/**
 * CRM Item Detail API
 * 
 * GET /api/crm/[id] - Get full details of a CRM item (lead/enrollment)
 * PATCH /api/crm/[id] - Update with audit logging
 * POST /api/crm/[id]/undo - Undo a specific change
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { leads, enrollments, users, crmAuditLog, crmStageHistory, leadInteractions } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// Helper to log CRM changes
async function logCrmChange({
    organizationId,
    entityType,
    entityId,
    action,
    fieldName,
    previousValue,
    newValue,
    previousSnapshot,
    newSnapshot,
    changeDescription,
    reason,
    changedBy,
    changedByName,
    changedByRole,
}: {
    organizationId: string;
    entityType: 'lead' | 'enrollment' | 'trial' | 'interaction' | 'campaign';
    entityId: string;
    action: 'create' | 'update' | 'stage_change' | 'assign' | 'note' | 'status_change' | 'archive' | 'restore' | 'undo';
    fieldName?: string;
    previousValue?: string;
    newValue?: string;
    previousSnapshot?: string;
    newSnapshot?: string;
    changeDescription?: string;
    reason?: string;
    changedBy: string;
    changedByName?: string;
    changedByRole?: string;
}) {
    const [log] = await db.insert(crmAuditLog).values({
        organizationId,
        entityType,
        entityId,
        action,
        fieldName,
        previousValue,
        newValue,
        previousSnapshot,
        newSnapshot,
        changeDescription,
        reason,
        changedBy,
        changedByName,
        changedByRole,
    }).returning();

    return log;
}

// Helper to log stage transitions
async function logStageTransition({
    organizationId,
    entityType,
    entityId,
    fromStage,
    toStage,
    changedBy,
    reason,
    value,
}: {
    organizationId: string;
    entityType: 'lead' | 'enrollment';
    entityId: string;
    fromStage: string | null;
    toStage: string;
    changedBy: string;
    reason?: string;
    value?: number;
}) {
    // Close the previous stage entry if exists
    const now = Date.now();

    if (fromStage) {
        const previousEntry = await db.select().from(crmStageHistory)
            .where(and(
                eq(crmStageHistory.entityId, entityId),
                eq(crmStageHistory.toStage, fromStage)
            ))
            .orderBy(desc(crmStageHistory.enteredAt))
            .limit(1);

        if (previousEntry.length > 0 && !previousEntry[0].exitedAt) {
            const duration = Math.floor((now - (previousEntry[0].enteredAt || now)) / 1000);
            await db.update(crmStageHistory)
                .set({
                    exitedAt: now,
                    durationSeconds: duration,
                })
                .where(eq(crmStageHistory.id, previousEntry[0].id));
        }
    }

    // Create new stage entry
    await db.insert(crmStageHistory).values({
        organizationId,
        entityType,
        entityId,
        fromStage,
        toStage,
        changedBy,
        reason,
        valueAtTransition: value,
    });
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const entityType = request.nextUrl.searchParams.get('type') || 'lead';

        if (entityType === 'lead') {
            // Get lead with assigned user info
            const lead = await db.query.leads.findFirst({
                where: eq(leads.id, id),
            });

            if (!lead) {
                return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
            }

            // Get assigned user info
            let assignedUser = null;
            if (lead.assignedTo) {
                assignedUser = await db.query.users.findFirst({
                    where: eq(users.id, lead.assignedTo),
                    columns: { id: true, name: true, email: true, avatarUrl: true },
                });
            }

            // Get interactions
            const interactions = await db.select().from(leadInteractions)
                .where(eq(leadInteractions.leadId, id))
                .orderBy(desc(leadInteractions.createdAt))
                .limit(20);

            // Get audit history
            const history = await db.select({
                id: crmAuditLog.id,
                action: crmAuditLog.action,
                fieldName: crmAuditLog.fieldName,
                previousValue: crmAuditLog.previousValue,
                newValue: crmAuditLog.newValue,
                changeDescription: crmAuditLog.changeDescription,
                reason: crmAuditLog.reason,
                changedBy: crmAuditLog.changedBy,
                changedByName: crmAuditLog.changedByName,
                changedByRole: crmAuditLog.changedByRole,
                canUndo: crmAuditLog.canUndo,
                undoneAt: crmAuditLog.undoneAt,
                createdAt: crmAuditLog.createdAt,
            }).from(crmAuditLog)
                .where(and(
                    eq(crmAuditLog.entityType, 'lead'),
                    eq(crmAuditLog.entityId, id)
                ))
                .orderBy(desc(crmAuditLog.createdAt))
                .limit(50);

            // Get stage history
            const stageHistoryData = await db.select().from(crmStageHistory)
                .where(and(
                    eq(crmStageHistory.entityType, 'lead'),
                    eq(crmStageHistory.entityId, id)
                ))
                .orderBy(desc(crmStageHistory.enteredAt));

            return NextResponse.json({
                entity: {
                    ...lead,
                    assignedUser,
                    interestedIn: lead.interestedIn ? JSON.parse(lead.interestedIn) : [],
                },
                interactions,
                history,
                stageHistory: stageHistoryData,
            });

        } else if (entityType === 'enrollment') {
            const enrollment = await db.query.enrollments.findFirst({
                where: eq(enrollments.id, id),
            });

            if (!enrollment) {
                return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
            }

            // Get student info
            const student = await db.query.users.findFirst({
                where: eq(users.id, enrollment.userId),
                columns: { id: true, name: true, email: true, avatarUrl: true },
            });

            // Get audit history
            const history = await db.select({
                id: crmAuditLog.id,
                action: crmAuditLog.action,
                fieldName: crmAuditLog.fieldName,
                previousValue: crmAuditLog.previousValue,
                newValue: crmAuditLog.newValue,
                changeDescription: crmAuditLog.changeDescription,
                reason: crmAuditLog.reason,
                changedBy: crmAuditLog.changedBy,
                changedByName: crmAuditLog.changedByName,
                changedByRole: crmAuditLog.changedByRole,
                canUndo: crmAuditLog.canUndo,
                undoneAt: crmAuditLog.undoneAt,
                createdAt: crmAuditLog.createdAt,
            }).from(crmAuditLog)
                .where(and(
                    eq(crmAuditLog.entityType, 'enrollment'),
                    eq(crmAuditLog.entityId, id)
                ))
                .orderBy(desc(crmAuditLog.createdAt))
                .limit(50);

            return NextResponse.json({
                entity: {
                    ...enrollment,
                    student,
                },
                history,
            });
        }

        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

    } catch (error) {
        console.error('Error fetching CRM item:', error);
        return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { entityType, updates, reason } = body;

        // Get current user info for audit log
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true, role: true },
        });

        if (entityType === 'lead') {
            // Get current state for snapshot
            const currentLead = await db.query.leads.findFirst({
                where: eq(leads.id, id),
            });

            if (!currentLead) {
                return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
            }

            // Determine action type
            let action: 'update' | 'stage_change' | 'assign' | 'status_change' = 'update';
            if (updates.status && updates.status !== currentLead.status) {
                action = 'stage_change';
            } else if (updates.assignedTo && updates.assignedTo !== currentLead.assignedTo) {
                action = 'assign';
            }

            // Log each field change
            for (const [field, newValue] of Object.entries(updates)) {
                const previousValue = (currentLead as any)[field];
                if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
                    await logCrmChange({
                        organizationId: orgId,
                        entityType: 'lead',
                        entityId: id,
                        action,
                        fieldName: field,
                        previousValue: JSON.stringify(previousValue),
                        newValue: JSON.stringify(newValue),
                        changeDescription: `${field}: ${previousValue} → ${newValue}`,
                        reason,
                        changedBy: userId,
                        changedByName: currentUser?.name || undefined,
                        changedByRole: currentUser?.role || undefined,
                    });

                    // Log stage transition separately for analytics
                    if (field === 'status') {
                        await logStageTransition({
                            organizationId: orgId,
                            entityType: 'lead',
                            entityId: id,
                            fromStage: previousValue,
                            toStage: newValue as string,
                            changedBy: userId,
                            reason,
                        });
                    }
                }
            }

            // Apply update
            await db.update(leads)
                .set({
                    ...updates,
                    updatedAt: Date.now(),
                })
                .where(eq(leads.id, id));

            const updatedLead = await db.query.leads.findFirst({
                where: eq(leads.id, id),
            });

            return NextResponse.json({ success: true, entity: updatedLead });

        } else if (entityType === 'enrollment') {
            const currentEnrollment = await db.query.enrollments.findFirst({
                where: eq(enrollments.id, id),
            });

            if (!currentEnrollment) {
                return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
            }

            // Log each field change
            for (const [field, newValue] of Object.entries(updates)) {
                const previousValue = (currentEnrollment as any)[field];
                if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
                    await logCrmChange({
                        organizationId: orgId,
                        entityType: 'enrollment',
                        entityId: id,
                        action: field === 'status' ? 'status_change' : 'update',
                        fieldName: field,
                        previousValue: JSON.stringify(previousValue),
                        newValue: JSON.stringify(newValue),
                        changeDescription: `${field}: ${previousValue} → ${newValue}`,
                        reason,
                        changedBy: userId,
                        changedByName: currentUser?.name || undefined,
                        changedByRole: currentUser?.role || undefined,
                    });
                }
            }

            // Apply update
            await db.update(enrollments)
                .set({
                    ...updates,
                    updatedAt: Date.now(),
                })
                .where(eq(enrollments.id, id));

            const updatedEnrollment = await db.query.enrollments.findFirst({
                where: eq(enrollments.id, id),
            });

            return NextResponse.json({ success: true, entity: updatedEnrollment });
        }

        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

    } catch (error) {
        console.error('Error updating CRM item:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}
