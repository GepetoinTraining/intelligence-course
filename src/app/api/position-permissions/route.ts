import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    positionPermissions,
    actionTypes,
    teamPositions,
    permissionAuditLog
} from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Schema for creating/updating position permissions
const positionPermissionSchema = z.object({
    positionId: z.string().uuid(),
    actionTypeId: z.string().uuid(),
    scope: z.enum(['own', 'team', 'department', 'organization', 'global']).default('team'),
    canDelegate: z.boolean().default(false),
    conditions: z.record(z.string(), z.any()).optional(),
});

const bulkPermissionSchema = z.object({
    positionId: z.string().uuid(),
    permissions: z.array(z.object({
        actionTypeId: z.string().uuid(),
        scope: z.enum(['own', 'team', 'department', 'organization', 'global']).default('team'),
        canDelegate: z.boolean().default(false),
        enabled: z.boolean(),
    })),
});

// GET: List position permissions
export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const positionId = searchParams.get('positionId');
        const actionTypeId = searchParams.get('actionTypeId');

        const results = await db
            .select({
                id: positionPermissions.id,
                positionId: positionPermissions.positionId,
                actionTypeId: positionPermissions.actionTypeId,
                scope: positionPermissions.scope,
                canDelegate: positionPermissions.canDelegate,
                conditions: positionPermissions.conditions,
                grantedAt: positionPermissions.grantedAt,
                // Include related data
                positionName: teamPositions.name,
                positionLevel: teamPositions.level,
                actionCode: actionTypes.code,
                actionName: actionTypes.name,
                actionCategory: actionTypes.category,
            })
            .from(positionPermissions)
            .leftJoin(teamPositions, eq(positionPermissions.positionId, teamPositions.id))
            .leftJoin(actionTypes, eq(positionPermissions.actionTypeId, actionTypes.id))
            .where(eq(teamPositions.organizationId, orgId));

        // Filter by positionId if provided
        let filtered = results;
        if (positionId) {
            filtered = filtered.filter(r => r.positionId === positionId);
        }
        if (actionTypeId) {
            filtered = filtered.filter(r => r.actionTypeId === actionTypeId);
        }

        return NextResponse.json({
            success: true,
            data: filtered,
            count: filtered.length
        });
    } catch (error) {
        console.error('Error fetching position permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a single position permission
export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = positionPermissionSchema.parse(body);

        // Verify position belongs to org
        const position = await db
            .select()
            .from(teamPositions)
            .where(and(
                eq(teamPositions.id, validated.positionId),
                eq(teamPositions.organizationId, orgId)
            ))
            .limit(1);

        if (position.length === 0) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        // Check if permission already exists
        const existing = await db
            .select()
            .from(positionPermissions)
            .where(and(
                eq(positionPermissions.positionId, validated.positionId),
                eq(positionPermissions.actionTypeId, validated.actionTypeId)
            ))
            .limit(1);

        if (existing.length > 0) {
            // Update existing
            await db
                .update(positionPermissions)
                .set({
                    scope: validated.scope,
                    canDelegate: validated.canDelegate,
                    conditions: validated.conditions ? JSON.stringify(validated.conditions) : null,
                    grantedAt: Date.now(),
                    grantedBy: userId,
                })
                .where(eq(positionPermissions.id, existing[0].id));

            // Log the change
            await db.insert(permissionAuditLog).values({
                id: randomUUID(),
                organizationId: orgId,
                action: 'modify',
                targetPositionId: validated.positionId,
                actionTypeId: validated.actionTypeId,
                previousValue: JSON.stringify({ scope: existing[0].scope }),
                newValue: JSON.stringify({ scope: validated.scope, canDelegate: validated.canDelegate }),
                performedBy: userId,
                performedAt: Date.now(),
            });

            return NextResponse.json({
                success: true,
                data: { ...existing[0], ...validated },
                updated: true
            });
        }

        // Create new permission
        const id = randomUUID();
        await db.insert(positionPermissions).values({
            id,
            positionId: validated.positionId,
            actionTypeId: validated.actionTypeId,
            scope: validated.scope,
            canDelegate: validated.canDelegate,
            conditions: validated.conditions ? JSON.stringify(validated.conditions) : null,
            grantedAt: Date.now(),
            grantedBy: userId,
        });

        // Log the change
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'grant',
            targetPositionId: validated.positionId,
            actionTypeId: validated.actionTypeId,
            newValue: JSON.stringify({ scope: validated.scope, canDelegate: validated.canDelegate }),
            performedBy: userId,
            performedAt: Date.now(),
        });

        return NextResponse.json({
            success: true,
            data: { id, ...validated },
            created: true
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('Error creating position permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Bulk update permissions for a position
export async function PUT(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = bulkPermissionSchema.parse(body);

        // Verify position belongs to org
        const position = await db
            .select()
            .from(teamPositions)
            .where(and(
                eq(teamPositions.id, validated.positionId),
                eq(teamPositions.organizationId, orgId)
            ))
            .limit(1);

        if (position.length === 0) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        // Get existing permissions for this position
        const existingPerms = await db
            .select()
            .from(positionPermissions)
            .where(eq(positionPermissions.positionId, validated.positionId));

        const existingMap = new Map(existingPerms.map(p => [p.actionTypeId, p]));

        let created = 0;
        let updated = 0;
        let deleted = 0;

        for (const perm of validated.permissions) {
            const existing = existingMap.get(perm.actionTypeId);

            if (perm.enabled) {
                if (existing) {
                    // Update existing
                    await db
                        .update(positionPermissions)
                        .set({
                            scope: perm.scope,
                            canDelegate: perm.canDelegate,
                            grantedAt: Date.now(),
                            grantedBy: userId,
                        })
                        .where(eq(positionPermissions.id, existing.id));
                    updated++;
                } else {
                    // Create new
                    await db.insert(positionPermissions).values({
                        id: randomUUID(),
                        positionId: validated.positionId,
                        actionTypeId: perm.actionTypeId,
                        scope: perm.scope,
                        canDelegate: perm.canDelegate,
                        grantedAt: Date.now(),
                        grantedBy: userId,
                    });
                    created++;
                }
            } else if (existing) {
                // Delete permission
                await db
                    .delete(positionPermissions)
                    .where(eq(positionPermissions.id, existing.id));
                deleted++;
            }
        }

        // Log bulk change
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'modify',
            targetPositionId: validated.positionId,
            newValue: JSON.stringify({ created, updated, deleted }),
            performedBy: userId,
            performedAt: Date.now(),
        });

        return NextResponse.json({
            success: true,
            created,
            updated,
            deleted,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('Error bulk updating permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove a position permission
export async function DELETE(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const positionId = searchParams.get('positionId');
        const actionTypeId = searchParams.get('actionTypeId');

        if (!positionId || !actionTypeId) {
            return NextResponse.json({
                error: 'positionId and actionTypeId are required'
            }, { status: 400 });
        }

        // Verify position belongs to org
        const position = await db
            .select()
            .from(teamPositions)
            .where(and(
                eq(teamPositions.id, positionId),
                eq(teamPositions.organizationId, orgId)
            ))
            .limit(1);

        if (position.length === 0) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        // Find and delete the permission
        const existing = await db
            .select()
            .from(positionPermissions)
            .where(and(
                eq(positionPermissions.positionId, positionId),
                eq(positionPermissions.actionTypeId, actionTypeId)
            ))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
        }

        await db
            .delete(positionPermissions)
            .where(eq(positionPermissions.id, existing[0].id));

        // Log the change
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'revoke',
            targetPositionId: positionId,
            actionTypeId,
            previousValue: JSON.stringify({ scope: existing[0].scope }),
            performedBy: userId,
            performedAt: Date.now(),
        });

        return NextResponse.json({ success: true, deleted: true });
    } catch (error) {
        console.error('Error deleting position permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}



