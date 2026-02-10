import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    userPermissionOverrides,
    actionTypes,
    users,
    permissionAuditLog, persons, organizationMemberships } from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Schema for creating/updating user overrides (matches actual DB schema)
const userOverrideSchema = z.object({
    personId: z.string(),
    actionTypeId: z.string().uuid(),
    isGranted: z.boolean(), // true = grant, false = revoke
    scope: z.enum(['own', 'team', 'department', 'organization', 'global']).optional(),
    teamId: z.string().uuid().optional().nullable(),
    expiresAt: z.number().optional(), // Unix timestamp
    reason: z.string().optional(),
});

// GET: List user permission overrides
export async function GET(request: NextRequest) {
    try {
        const { personId: authUserId, orgId } = await getApiAuthWithOrg();
        if (!authUserId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const targetUserId = searchParams.get('personId');

        // Build query
        let results;
        if (targetUserId) {
            results = await db
                .select({
                    id: userPermissionOverrides.id,
                    personId: userPermissionOverrides.personId,
                    actionTypeId: userPermissionOverrides.actionTypeId,
                    isGranted: userPermissionOverrides.isGranted,
                    scope: userPermissionOverrides.scope,
                    teamId: userPermissionOverrides.teamId,
                    expiresAt: userPermissionOverrides.expiresAt,
                    reason: userPermissionOverrides.reason,
                    grantedAt: userPermissionOverrides.grantedAt,
                    grantedBy: userPermissionOverrides.grantedBy,
                    revokedAt: userPermissionOverrides.revokedAt,
                    // Action details
                    actionCode: actionTypes.code,
                    actionName: actionTypes.name,
                    actionCategory: actionTypes.category,
                })
                .from(userPermissionOverrides)
                .leftJoin(actionTypes, eq(userPermissionOverrides.actionTypeId, actionTypes.id))
                .where(and(
                    eq(userPermissionOverrides.personId, targetUserId),
                    isNull(userPermissionOverrides.revokedAt) // Only active overrides
                ));
        } else {
            // Fetch all overrides for org (need to filter by users in org)
            const orgUsers = await db
                .select({ id: users.id })
                .from(users)
                .where(eq(organizationMemberships.organizationId, orgId));

            const userIds = orgUsers.map(u => u.id);

            if (userIds.length === 0) {
                return NextResponse.json({ success: true, data: [], count: 0 });
            }

            results = await db
                .select({
                    id: userPermissionOverrides.id,
                    personId: userPermissionOverrides.personId,
                    actionTypeId: userPermissionOverrides.actionTypeId,
                    isGranted: userPermissionOverrides.isGranted,
                    scope: userPermissionOverrides.scope,
                    teamId: userPermissionOverrides.teamId,
                    expiresAt: userPermissionOverrides.expiresAt,
                    reason: userPermissionOverrides.reason,
                    grantedAt: userPermissionOverrides.grantedAt,
                    grantedBy: userPermissionOverrides.grantedBy,
                    actionCode: actionTypes.code,
                    actionName: actionTypes.name,
                    actionCategory: actionTypes.category,
                    userName: persons.firstName,
                    personEmail: persons.primaryEmail,
                })
                .from(userPermissionOverrides)
                .leftJoin(actionTypes, eq(userPermissionOverrides.actionTypeId, actionTypes.id))
                .leftJoin(users, eq(userPermissionOverrides.personId, users.id))
            .leftJoin(persons, eq(users.personId, persons.id))
                .where(isNull(userPermissionOverrides.revokedAt));
        }

        // Filter out expired overrides
        const now = Date.now();
        const active = results.filter(r => !r.expiresAt || r.expiresAt > now);

        return NextResponse.json({
            success: true,
            data: active,
            count: active.length
        });
    } catch (error) {
        console.error('Error fetching user overrides:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create or update a user override
export async function POST(request: NextRequest) {
    try {
        const { personId: authUserId, orgId } = await getApiAuthWithOrg();
        if (!authUserId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = userOverrideSchema.parse(body);

        // Verify target user exists
        const [targetUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, validated.personId))
            .limit(1);

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if override already exists (not revoked)
        const existing = await db
            .select()
            .from(userPermissionOverrides)
            .where(and(
                eq(userPermissionOverrides.personId, validated.personId),
                eq(userPermissionOverrides.actionTypeId, validated.actionTypeId),
                isNull(userPermissionOverrides.revokedAt)
            ))
            .limit(1);

        if (existing.length > 0) {
            // Revoke old and create new (for audit trail)
            await db
                .update(userPermissionOverrides)
                .set({
                    revokedAt: Date.now(),
                    revokedBy: authUserId,
                    revokeReason: 'Updated with new override',
                })
                .where(eq(userPermissionOverrides.id, existing[0].id));
        }

        // Create new override
        const id = randomUUID();
        await db.insert(userPermissionOverrides).values({
            id,
            personId: validated.personId,
            actionTypeId: validated.actionTypeId,
            isGranted: validated.isGranted,
            scope: validated.scope || 'own',
            teamId: validated.teamId || null,
            expiresAt: validated.expiresAt || null,
            reason: validated.reason || null,
            grantedAt: Date.now(),
            grantedBy: authUserId,
        });

        // Audit log
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: validated.isGranted ? 'grant' : 'revoke',
            targetUserId: validated.personId,
            actionTypeId: validated.actionTypeId,
            newValue: JSON.stringify({
                isGranted: validated.isGranted,
                scope: validated.scope,
            }),
            performedBy: authUserId,
            performedAt: Date.now(),
            reason: validated.reason,
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
        console.error('Error creating user override:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Revoke a user override
export async function DELETE(request: NextRequest) {
    try {
        const { personId: authUserId, orgId } = await getApiAuthWithOrg();
        if (!authUserId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const targetUserId = searchParams.get('personId');
        const actionTypeId = searchParams.get('actionTypeId');
        const overrideId = searchParams.get('id');
        const revokeReason = searchParams.get('reason') || 'Manually revoked';

        // Can delete by ID or by personId + actionTypeId
        let existing;
        if (overrideId) {
            [existing] = await db
                .select()
                .from(userPermissionOverrides)
                .where(and(
                    eq(userPermissionOverrides.id, overrideId),
                    isNull(userPermissionOverrides.revokedAt)
                ))
                .limit(1);
        } else if (targetUserId && actionTypeId) {
            [existing] = await db
                .select()
                .from(userPermissionOverrides)
                .where(and(
                    eq(userPermissionOverrides.personId, targetUserId),
                    eq(userPermissionOverrides.actionTypeId, actionTypeId),
                    isNull(userPermissionOverrides.revokedAt)
                ))
                .limit(1);
        } else {
            return NextResponse.json({
                error: 'Either id or (personId + actionTypeId) required'
            }, { status: 400 });
        }

        if (!existing) {
            return NextResponse.json({ error: 'Override not found' }, { status: 404 });
        }

        // Soft delete by setting revokedAt
        await db
            .update(userPermissionOverrides)
            .set({
                revokedAt: Date.now(),
                revokedBy: authUserId,
                revokeReason,
            })
            .where(eq(userPermissionOverrides.id, existing.id));

        // Audit log
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'revoke',
            targetUserId: existing.personId,
            actionTypeId: existing.actionTypeId,
            previousValue: JSON.stringify({
                isGranted: existing.isGranted,
                scope: existing.scope,
            }),
            performedBy: authUserId,
            performedAt: Date.now(),
            reason: revokeReason,
        });

        return NextResponse.json({ success: true, revoked: true });
    } catch (error) {
        console.error('Error revoking user override:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}




