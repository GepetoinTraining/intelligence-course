import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    userPermissionOverrides,
    userGroupAssignments,
    permissionGroups,
    actionTypes,
    users
} from '@/lib/db/schema';
import { eq, and, isNull, lt, gt, gte } from 'drizzle-orm';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

interface ExpiringPermission {
    id: string;
    type: 'override' | 'group';
    userId: string;
    userName: string | null;
    personEmail: string | null;
    description: string;
    expiresAt: number;
    expiresInDays: number;
    urgency: 'critical' | 'warning' | 'notice';
}

/**
 * GET /api/permission-expiry
 * Get upcoming permission expirations
 * 
 * Query params:
 * - days: Number of days to look ahead (default: 7)
 * - userId: Filter by specific user
 */
export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const lookAheadDays = parseInt(searchParams.get('days') || '7', 10);
        const filterUserId = searchParams.get('userId');

        const now = Date.now();
        const lookAheadMs = lookAheadDays * ONE_DAY_MS;
        const maxExpiry = now + lookAheadMs;

        const expirations: ExpiringPermission[] = [];

        // Check expiring user permission overrides
        const expiringOverrides = await db
            .select({
                id: userPermissionOverrides.id,
                userId: userPermissionOverrides.userId,
                actionTypeId: userPermissionOverrides.actionTypeId,
                expiresAt: userPermissionOverrides.expiresAt,
                scope: userPermissionOverrides.scope,
                userName: persons.firstName,
                personEmail: persons.primaryEmail,
                actionName: actionTypes.name,
                actionCode: actionTypes.code,
            })
            .from(userPermissionOverrides)
            .leftJoin(users, eq(userPermissionOverrides.userId, users.id))
            .leftJoin(actionTypes, eq(userPermissionOverrides.actionTypeId, actionTypes.id))
            .where(and(
                eq(userPermissionOverrides.isGranted, true),
                isNull(userPermissionOverrides.revokedAt),
                gte(userPermissionOverrides.expiresAt, now),
                lt(userPermissionOverrides.expiresAt, maxExpiry),
                filterUserId ? eq(userPermissionOverrides.userId, filterUserId) : undefined
            ));

        for (const override of expiringOverrides) {
            if (!override.expiresAt) continue;

            const expiresInMs = override.expiresAt - now;
            const expiresInDays = Math.ceil(expiresInMs / ONE_DAY_MS);

            let urgency: 'critical' | 'warning' | 'notice' = 'notice';
            if (expiresInDays <= 1) urgency = 'critical';
            else if (expiresInDays <= 3) urgency = 'warning';

            expirations.push({
                id: override.id,
                type: 'override',
                userId: override.userId,
                userName: override.userName,
                personEmail: override.userEmail,
                description: `Permission "${override.actionName || override.actionCode}" (${override.scope})`,
                expiresAt: override.expiresAt,
                expiresInDays,
                urgency,
            });
        }

        // Check expiring group assignments
        const expiringGroupAssignments = await db
            .select({
                id: userGroupAssignments.id,
                userId: userGroupAssignments.userId,
                groupId: userGroupAssignments.groupId,
                expiresAt: userGroupAssignments.expiresAt,
                userName: persons.firstName,
                personEmail: persons.primaryEmail,
                groupName: permissionGroups.name,
            })
            .from(userGroupAssignments)
            .leftJoin(users, eq(userGroupAssignments.userId, users.id))
            .leftJoin(permissionGroups, eq(userGroupAssignments.groupId, permissionGroups.id))
            .where(and(
                gte(userGroupAssignments.expiresAt, now),
                lt(userGroupAssignments.expiresAt, maxExpiry),
                filterUserId ? eq(userGroupAssignments.userId, filterUserId) : undefined
            ));

        for (const assignment of expiringGroupAssignments) {
            if (!assignment.expiresAt) continue;

            const expiresInMs = assignment.expiresAt - now;
            const expiresInDays = Math.ceil(expiresInMs / ONE_DAY_MS);

            let urgency: 'critical' | 'warning' | 'notice' = 'notice';
            if (expiresInDays <= 1) urgency = 'critical';
            else if (expiresInDays <= 3) urgency = 'warning';

            expirations.push({
                id: assignment.id,
                type: 'group',
                userId: assignment.userId,
                userName: assignment.userName,
                personEmail: assignment.userEmail,
                description: `Group "${assignment.groupName}" membership`,
                expiresAt: assignment.expiresAt,
                expiresInDays,
                urgency,
            });
        }

        // Sort by expiry date (soonest first)
        expirations.sort((a, b) => a.expiresAt - b.expiresAt);

        // Group by urgency
        const byUrgency = {
            critical: expirations.filter(e => e.urgency === 'critical'),
            warning: expirations.filter(e => e.urgency === 'warning'),
            notice: expirations.filter(e => e.urgency === 'notice'),
        };

        return NextResponse.json({
            success: true,
            data: expirations,
            summary: {
                total: expirations.length,
                critical: byUrgency.critical.length,
                warning: byUrgency.warning.length,
                notice: byUrgency.notice.length,
            },
            byUrgency,
        });
    } catch (error) {
        console.error('Error checking permission expiry:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/permission-expiry
 * Extend or renew an expiring permission
 */
export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, type, extendDays } = body;

        if (!id || !type || !extendDays) {
            return NextResponse.json({
                error: 'Missing required fields: id, type, extendDays'
            }, { status: 400 });
        }

        const additionalMs = extendDays * ONE_DAY_MS;
        const now = Date.now();

        if (type === 'override') {
            const [override] = await db
                .select()
                .from(userPermissionOverrides)
                .where(eq(userPermissionOverrides.id, id))
                .limit(1);

            if (!override) {
                return NextResponse.json({ error: 'Override not found' }, { status: 404 });
            }

            const currentExpiry = override.expiresAt || now;
            const newExpiry = Math.max(currentExpiry, now) + additionalMs;

            await db
                .update(userPermissionOverrides)
                .set({
                    expiresAt: newExpiry,
                })
                .where(eq(userPermissionOverrides.id, id));

            return NextResponse.json({
                success: true,
                previousExpiry: currentExpiry,
                newExpiry,
                extendedByDays: extendDays,
            });
        } else if (type === 'group') {
            const [assignment] = await db
                .select()
                .from(userGroupAssignments)
                .where(eq(userGroupAssignments.id, id))
                .limit(1);

            if (!assignment) {
                return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
            }

            const currentExpiry = assignment.expiresAt || now;
            const newExpiry = Math.max(currentExpiry, now) + additionalMs;

            await db
                .update(userGroupAssignments)
                .set({
                    expiresAt: newExpiry,
                })
                .where(eq(userGroupAssignments.id, id));

            return NextResponse.json({
                success: true,
                previousExpiry: currentExpiry,
                newExpiry,
                extendedByDays: extendDays,
            });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Error extending permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}




