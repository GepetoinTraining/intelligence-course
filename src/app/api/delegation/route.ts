import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    userPermissionOverrides,
    positionPermissions,
    teamMembers,
    actionTypes,
    permissionAuditLog,
    users
} from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const delegateSchema = z.object({
    targetUserId: z.string().uuid(),
    actionTypeId: z.string().uuid(),
    scope: z.enum(['own', 'team', 'department', 'organization', 'global']).optional(),
    expiresAt: z.number().optional(), // Unix timestamp
    reason: z.string().optional(),
});

const delegateBulkSchema = z.object({
    targetUserId: z.string().uuid(),
    actionTypeIds: z.array(z.string().uuid()).min(1),
    scope: z.enum(['own', 'team', 'department', 'organization', 'global']).optional(),
    expiresAt: z.number().optional(),
    reason: z.string().optional(),
});

/**
 * GET /api/delegation
 * List delegable permissions for current user (only those with canDelegate=true)
 */
export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's team memberships and positions
        const memberships = await db
            .select({
                positionId: teamMembers.positionId,
            })
            .from(teamMembers)
            .where(and(
                eq(teamMembers.personId, personId),
                eq(teamMembers.isActive, true)
            ));

        const positionIds = memberships.map(m => m.positionId).filter(Boolean) as string[];

        if (positionIds.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'No delegable permissions - no positions assigned'
            });
        }

        // Get permissions where canDelegate = true
        const delegablePerms = await db
            .select({
                permissionId: positionPermissions.id,
                positionId: positionPermissions.positionId,
                actionTypeId: positionPermissions.actionTypeId,
                scope: positionPermissions.scope,
                canDelegate: positionPermissions.canDelegate,
                actionName: actionTypes.name,
                actionCode: actionTypes.code,
                actionCategory: actionTypes.category,
                actionRiskLevel: actionTypes.riskLevel,
            })
            .from(positionPermissions)
            .innerJoin(actionTypes, eq(positionPermissions.actionTypeId, actionTypes.id))
            .where(and(
                inArray(positionPermissions.positionId, positionIds),
                eq(positionPermissions.canDelegate, true)
            ));

        // Get existing delegations made by this user
        const existingDelegations = await db
            .select({
                id: userPermissionOverrides.id,
                targetUserId: userPermissionOverrides.userId,
                actionTypeId: userPermissionOverrides.actionTypeId,
                scope: userPermissionOverrides.scope,
                isGranted: userPermissionOverrides.isGranted,
                expiresAt: userPermissionOverrides.expiresAt,
                grantedBy: userPermissionOverrides.grantedBy,
                targetUserName: persons.firstName,
                targetpersonEmail: persons.primaryEmail,
            })
            .from(userPermissionOverrides)
            .leftJoin(users, eq(userPermissionOverrides.userId, users.id))
            .where(and(
                eq(userPermissionOverrides.grantedBy, userId),
                eq(userPermissionOverrides.isGranted, true),
                isNull(userPermissionOverrides.revokedAt)
            ));

        return NextResponse.json({
            success: true,
            data: {
                delegablPermissions: delegablePerms,
                activeDelegations: existingDelegations,
            },
        });
    } catch (error) {
        console.error('Error fetching delegable permissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/delegation
 * Delegate a permission to another user
 */
export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Support bulk or single delegation
        const isBulk = Array.isArray(body.actionTypeIds);
        const validated = isBulk
            ? delegateBulkSchema.parse(body)
            : delegateSchema.parse(body);

        const targetUserId = validated.targetUserId;
        const actionTypeIds = isBulk
            ? (validated as z.infer<typeof delegateBulkSchema>).actionTypeIds
            : [(validated as z.infer<typeof delegateSchema>).actionTypeId];

        // Verify target user exists
        const [targetUser] = await db
            .select({ id: users.id, name: persons.firstName })
            .from(users)
            .where(eq(users.id, targetUserId))
            .limit(1);

        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        // Check that the delegator has canDelegate permission for these actions
        const memberships = await db
            .select({ positionId: teamMembers.positionId })
            .from(teamMembers)
            .where(and(
                eq(teamMembers.personId, personId),
                eq(teamMembers.isActive, true)
            ));

        const positionIds = memberships.map(m => m.positionId).filter(Boolean) as string[];

        if (positionIds.length === 0) {
            return NextResponse.json({
                error: 'You have no positions with delegation rights'
            }, { status: 403 });
        }

        // Verify the user can delegate each action
        const delegableActions = await db
            .select({
                actionTypeId: positionPermissions.actionTypeId,
                scope: positionPermissions.scope,
            })
            .from(positionPermissions)
            .where(and(
                inArray(positionPermissions.positionId, positionIds),
                inArray(positionPermissions.actionTypeId, actionTypeIds),
                eq(positionPermissions.canDelegate, true)
            ));

        const delegableActionIds = new Set(delegableActions.map(a => a.actionTypeId));
        const unauthorized = actionTypeIds.filter(id => !delegableActionIds.has(id));

        if (unauthorized.length > 0) {
            return NextResponse.json({
                error: 'Cannot delegate actions you do not have delegation rights for',
                unauthorizedActions: unauthorized,
            }, { status: 403 });
        }

        const now = Date.now();
        const results = [];

        for (const actionTypeId of actionTypeIds) {
            const delegableAction = delegableActions.find(a => a.actionTypeId === actionTypeId);
            const effectiveScope = validated.scope || delegableAction?.scope || 'team';

            // Check for existing override
            const [existing] = await db
                .select()
                .from(userPermissionOverrides)
                .where(and(
                    eq(userPermissionOverrides.userId, targetUserId),
                    eq(userPermissionOverrides.actionTypeId, actionTypeId),
                    isNull(userPermissionOverrides.revokedAt)
                ))
                .limit(1);

            let overrideId: string;

            if (existing) {
                // Update existing
                await db
                    .update(userPermissionOverrides)
                    .set({
                        scope: effectiveScope,
                        isGranted: true,
                        expiresAt: validated.expiresAt || null,
                        grantedBy: userId,
                        grantedAt: now,
                        reason: validated.reason,
                    })
                    .where(eq(userPermissionOverrides.id, existing.id));
                overrideId = existing.id;
            } else {
                // Create new
                const [newOverride] = await db
                    .insert(userPermissionOverrides)
                    .values({
                        userId: targetUserId,
                        actionTypeId,
                        scope: effectiveScope,
                        isGranted: true,
                        grantedBy: userId,
                        grantedAt: now,
                        expiresAt: validated.expiresAt || null,
                        reason: validated.reason,
                    })
                    .returning();
                overrideId = newOverride.id;
            }

            // Audit log
            await db.insert(permissionAuditLog).values({
                id: randomUUID(),
                organizationId: orgId,
                action: 'delegate',
                targetUserId,
                actionTypeId,
                previousValue: existing ? JSON.stringify(existing) : null,
                newValue: JSON.stringify({
                    scope: effectiveScope,
                    expiresAt: validated.expiresAt,
                }),
                performedBy: userId,
                performedAt: now,
                reason: validated.reason || `Delegated by ${userId}`,
            });

            results.push({
                actionTypeId,
                overrideId,
                status: existing ? 'updated' : 'created',
            });
        }

        return NextResponse.json({
            success: true,
            delegatedTo: targetUser.name,
            results,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('Error delegating permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/delegation
 * Revoke a delegated permission
 */
export async function DELETE(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const overrideId = searchParams.get('id');

        if (!overrideId) {
            return NextResponse.json({ error: 'Override ID required' }, { status: 400 });
        }

        // Verify the override was created by this user
        const [override] = await db
            .select()
            .from(userPermissionOverrides)
            .where(and(
                eq(userPermissionOverrides.id, overrideId),
                eq(userPermissionOverrides.grantedBy, userId)
            ))
            .limit(1);

        if (!override) {
            return NextResponse.json({
                error: 'Delegation not found or you cannot revoke this delegation'
            }, { status: 404 });
        }

        const now = Date.now();

        // Soft revoke
        await db
            .update(userPermissionOverrides)
            .set({
                revokedAt: now,
                revokedBy: userId,
            })
            .where(eq(userPermissionOverrides.id, overrideId));

        // Audit log
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'revoke',
            targetUserId: override.userId,
            actionTypeId: override.actionTypeId,
            previousValue: JSON.stringify(override),
            performedBy: userId,
            performedAt: now,
            reason: 'Delegation revoked by grantor',
        });

        return NextResponse.json({ success: true, revoked: true });
    } catch (error) {
        console.error('Error revoking delegation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}




