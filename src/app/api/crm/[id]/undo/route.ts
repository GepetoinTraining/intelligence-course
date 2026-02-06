/**
 * CRM Undo API
 * 
 * POST /api/crm/[id]/undo - Undo a specific change (for owners/leaders)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { leads, enrollments, users, crmAuditLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: entityId } = await params;
        const body = await request.json();
        const { logId, reason } = body;

        if (!logId) {
            return NextResponse.json({ error: 'logId required' }, { status: 400 });
        }

        // Get the audit log entry to undo
        const logEntry = await db.query.crmAuditLog.findFirst({
            where: eq(crmAuditLog.id, logId),
        });

        if (!logEntry) {
            return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
        }

        if (!logEntry.canUndo) {
            return NextResponse.json({ error: 'This change cannot be undone' }, { status: 400 });
        }

        if (logEntry.undoneAt) {
            return NextResponse.json({ error: 'This change has already been undone' }, { status: 400 });
        }

        // Check permissions - only owner/admin can undo
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true, role: true },
        });

        if (!currentUser || !['owner', 'admin'].includes(currentUser.role || '')) {
            return NextResponse.json({ error: 'Only owners/admins can undo changes' }, { status: 403 });
        }

        // Get the previous value
        if (!logEntry.fieldName || logEntry.previousValue === null) {
            return NextResponse.json({ error: 'Cannot undo this type of change' }, { status: 400 });
        }

        const previousValue = JSON.parse(logEntry.previousValue);

        // Apply the undo based on entity type
        if (logEntry.entityType === 'lead') {
            // Get current state for the undo log
            const currentLead = await db.query.leads.findFirst({
                where: eq(leads.id, entityId),
            });

            if (!currentLead) {
                return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
            }

            // Apply the revert
            await db.update(leads)
                .set({
                    [logEntry.fieldName]: previousValue,
                    updatedAt: Date.now(),
                })
                .where(eq(leads.id, entityId));

            // Mark the original log as undone
            await db.update(crmAuditLog)
                .set({
                    undoneAt: Date.now(),
                    undoneBy: userId,
                    undoReason: reason,
                })
                .where(eq(crmAuditLog.id, logId));

            // Create a new log entry for the undo action
            await db.insert(crmAuditLog).values({
                organizationId: orgId,
                entityType: 'lead',
                entityId,
                action: 'undo',
                fieldName: logEntry.fieldName,
                previousValue: logEntry.newValue, // What it was before undo
                newValue: logEntry.previousValue, // What it is after undo
                changeDescription: `Undo: ${logEntry.changeDescription}`,
                reason: reason || 'Undo by owner',
                changedBy: userId,
                changedByName: currentUser.name || undefined,
                changedByRole: currentUser.role || undefined,
                undoesLogId: logId,
                canUndo: false, // Undo actions cannot be undone
            });

            return NextResponse.json({
                success: true,
                message: `Reverted ${logEntry.fieldName} to previous value`,
            });

        } else if (logEntry.entityType === 'enrollment') {
            const currentEnrollment = await db.query.enrollments.findFirst({
                where: eq(enrollments.id, entityId),
            });

            if (!currentEnrollment) {
                return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
            }

            // Apply the revert
            await db.update(enrollments)
                .set({
                    [logEntry.fieldName]: previousValue,
                    updatedAt: Date.now(),
                })
                .where(eq(enrollments.id, entityId));

            // Mark the original log as undone
            await db.update(crmAuditLog)
                .set({
                    undoneAt: Date.now(),
                    undoneBy: userId,
                    undoReason: reason,
                })
                .where(eq(crmAuditLog.id, logId));

            // Create undo log entry
            await db.insert(crmAuditLog).values({
                organizationId: orgId,
                entityType: 'enrollment',
                entityId,
                action: 'undo',
                fieldName: logEntry.fieldName,
                previousValue: logEntry.newValue,
                newValue: logEntry.previousValue,
                changeDescription: `Undo: ${logEntry.changeDescription}`,
                reason: reason || 'Undo by owner',
                changedBy: userId,
                changedByName: currentUser.name || undefined,
                changedByRole: currentUser.role || undefined,
                undoesLogId: logId,
                canUndo: false,
            });

            return NextResponse.json({
                success: true,
                message: `Reverted ${logEntry.fieldName} to previous value`,
            });
        }

        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

    } catch (error) {
        console.error('Error undoing CRM change:', error);
        return NextResponse.json({ error: 'Failed to undo change' }, { status: 500 });
    }
}
