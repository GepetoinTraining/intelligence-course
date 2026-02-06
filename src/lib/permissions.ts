/**
 * Permission Checking Utility
 * 
 * Core function to check if a user can perform a specific action.
 * Considers:
 * 1. Position-based permissions (via team membership)
 * 2. User-specific overrides (grants/revocations)
 * 3. Permission groups assigned to user
 * 4. Scope-based filtering (own, team, department, org, global)
 */

import { db } from '@/lib/db';
import {
    teamMembers,
    positionPermissions,
    actionTypes,
    userPermissionOverrides,
    userGroupAssignments,
    permissionGroupActions,
    teams
} from '@/lib/db/schema';
import { eq, and, inArray, isNull } from 'drizzle-orm';

export type PermissionScope = 'own' | 'team' | 'department' | 'organization' | 'global';

export interface PermissionCheckResult {
    allowed: boolean;
    scope: PermissionScope | null;
    source: 'position' | 'override' | 'group' | 'none';
    positionId?: string;
    positionName?: string;
    teamId?: string;
    teamName?: string;
    canDelegate?: boolean;
}

export interface PermissionContext {
    userId: string;
    orgId: string;
    teamId?: string;         // Current team context (optional)
    resourceOwnerId?: string; // Owner of the resource being accessed
    resourceTeamId?: string;  // Team the resource belongs to
}

/**
 * Check if a user has permission to perform an action
 * 
 * @param actionCode - The action code to check (e.g., 'wiki.create', 'kaizen.approve')
 * @param ctx - Context including userId, orgId, and optional scope filters
 * @returns PermissionCheckResult with allowed status and metadata
 */
export async function hasPermission(
    actionCode: string,
    ctx: PermissionContext
): Promise<PermissionCheckResult> {
    const { userId, orgId, resourceOwnerId, resourceTeamId } = ctx;

    // 1. Get the action type
    const [action] = await db
        .select()
        .from(actionTypes)
        .where(eq(actionTypes.code, actionCode))
        .limit(1);

    if (!action) {
        console.warn(`Action type not found: ${actionCode}`);
        return { allowed: false, scope: null, source: 'none' };
    }

    // 2. Check for user-specific override (grant or revoke)
    // Uses isGranted boolean, soft delete via revokedAt
    const [override] = await db
        .select()
        .from(userPermissionOverrides)
        .where(and(
            eq(userPermissionOverrides.personId, userId),
            eq(userPermissionOverrides.actionTypeId, action.id),
            isNull(userPermissionOverrides.revokedAt) // Only active overrides
        ))
        .limit(1);

    if (override) {
        // Check if expired
        const now = Date.now();
        if (!override.expiresAt || override.expiresAt > now) {
            if (override.isGranted === false) {
                // Explicitly revoked
                return { allowed: false, scope: null, source: 'override' };
            }
            if (override.isGranted === true) {
                // Explicitly granted
                return {
                    allowed: true,
                    scope: (override.scope as PermissionScope) || 'organization',
                    source: 'override',
                    canDelegate: false // Schema doesn't have canDelegate on overrides
                };
            }
        }
    }

    // 3. Get user's team memberships and positions
    const memberships = await db
        .select({
            memberId: teamMembers.id,
            teamId: teamMembers.teamId,
            positionId: teamMembers.positionId,
            memberRole: teamMembers.memberRole,
            teamName: teams.name,
            teamType: teams.teamType,
            parentTeamId: teams.parentTeamId,
        })
        .from(teamMembers)
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(and(
            eq(teamMembers.personId, userId),
            eq(teamMembers.isActive, true)
        ));

    if (memberships.length === 0) {
        // No team memberships, check permission groups
        return await checkPermissionGroups(userId, action.id, orgId);
    }

    // 4. Check position-based permissions for each membership
    const positionIds = [...new Set(memberships.map(m => m.positionId).filter(Boolean))] as string[];

    if (positionIds.length > 0) {
        const permissions = await db
            .select()
            .from(positionPermissions)
            .where(and(
                inArray(positionPermissions.positionId, positionIds),
                eq(positionPermissions.actionTypeId, action.id)
            ));

        if (permissions.length > 0) {
            // Find the highest scope permission
            const scopePriority: Record<PermissionScope, number> = {
                'own': 1,
                'team': 2,
                'department': 3,
                'organization': 4,
                'global': 5,
            };

            const sortedPerms = permissions.sort((a, b) =>
                (scopePriority[b.scope as PermissionScope] || 0) - (scopePriority[a.scope as PermissionScope] || 0)
            );

            const bestPerm = sortedPerms[0];
            const membership = memberships.find(m => m.positionId === bestPerm.positionId);

            // Check if the scope allows this action on the resource
            const scopeAllowed = checkScopeAllows(
                bestPerm.scope as PermissionScope,
                userId,
                membership?.teamId,
                resourceOwnerId,
                resourceTeamId
            );

            if (scopeAllowed) {
                return {
                    allowed: true,
                    scope: bestPerm.scope as PermissionScope,
                    source: 'position',
                    positionId: bestPerm.positionId,
                    teamId: membership?.teamId,
                    teamName: membership?.teamName || undefined,
                    canDelegate: bestPerm.canDelegate || false,
                };
            }
        }
    }

    // 5. Check leadership/owner role grants broader access
    const isLeader = memberships.some(m =>
        m.memberRole === 'owner' || m.memberRole === 'lead'
    );

    if (isLeader) {
        // Leaders implicitly have team-scope for most actions
        const leaderMembership = memberships.find(m =>
            m.memberRole === 'owner' || m.memberRole === 'lead'
        );

        // Check if this is within their team scope
        const inTeamScope = resourceTeamId
            ? memberships.some(m => m.teamId === resourceTeamId)
            : true;

        if (inTeamScope && action.riskLevel !== 'critical') {
            return {
                allowed: true,
                scope: 'team',
                source: 'position',
                teamId: leaderMembership?.teamId,
                teamName: leaderMembership?.teamName || undefined,
                canDelegate: true,
            };
        }
    }

    // 5.5. Check for inherited permissions from parent teams
    const userTeamIds = memberships.map(m => m.teamId).filter(Boolean) as string[];
    if (userTeamIds.length > 0) {
        const inheritedResult = await checkInheritedPermissions(userId, action.id, userTeamIds);
        if (inheritedResult) {
            return inheritedResult;
        }
    }

    // 6. Fall back to permission groups
    return await checkPermissionGroups(userId, action.id, orgId);
}

/**
 * Get team hierarchy (team -> parent -> grandparent -> etc.)
 */
async function getTeamHierarchy(teamId: string): Promise<string[]> {
    const hierarchy: string[] = [teamId];
    let currentTeamId = teamId;
    const maxDepth = 10; // Prevent infinite loops

    for (let i = 0; i < maxDepth; i++) {
        const [team] = await db
            .select({ parentTeamId: teams.parentTeamId })
            .from(teams)
            .where(eq(teams.id, currentTeamId))
            .limit(1);

        if (!team || !team.parentTeamId) break;

        hierarchy.push(team.parentTeamId);
        currentTeamId = team.parentTeamId;
    }

    return hierarchy;
}

/**
 * Check inherited permissions from parent teams
 * This allows permissions set at department level to cascade down
 */
async function checkInheritedPermissions(
    userId: string,
    actionId: string,
    teamIds: string[],
): Promise<PermissionCheckResult | null> {
    // For each team, get its hierarchy and check for inherited permissions
    for (const teamId of teamIds) {
        const hierarchy = await getTeamHierarchy(teamId);

        // Skip the first one (current team), start from parent
        for (let i = 1; i < hierarchy.length; i++) {
            const parentTeamId = hierarchy[i];

            // Find positions in parent team that grant this permission
            const parentPositions = await db
                .select({
                    membershipId: teamMembers.id,
                    positionId: teamMembers.positionId,
                })
                .from(teamMembers)
                .where(and(
                    eq(teamMembers.teamId, parentTeamId),
                    eq(teamMembers.personId, userId),
                    eq(teamMembers.isActive, true)
                ));

            if (parentPositions.length > 0) {
                const positionIds = parentPositions.map(p => p.positionId).filter(Boolean) as string[];

                if (positionIds.length > 0) {
                    const [inheritedPerm] = await db
                        .select()
                        .from(positionPermissions)
                        .where(and(
                            inArray(positionPermissions.positionId, positionIds),
                            eq(positionPermissions.actionTypeId, actionId),
                            // Only inherit if scope allows downward inheritance
                            inArray(positionPermissions.scope, ['department', 'organization', 'global'])
                        ))
                        .limit(1);

                    if (inheritedPerm) {
                        return {
                            allowed: true,
                            scope: inheritedPerm.scope as PermissionScope,
                            source: 'position',
                            positionId: inheritedPerm.positionId,
                            teamId: parentTeamId,
                            canDelegate: inheritedPerm.canDelegate || false,
                        };
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Check permission groups assigned to user
 */
async function checkPermissionGroups(
    userId: string,
    actionTypeId: string,
    orgId: string
): Promise<PermissionCheckResult> {
    // Get user's group assignments (no isActive field - use expiresAt check)
    const now = Date.now();
    const groupAssignments = await db
        .select()
        .from(userGroupAssignments)
        .where(eq(userGroupAssignments.personId, userId));

    // Filter out expired assignments
    const activeAssignments = groupAssignments.filter(g =>
        !g.expiresAt || g.expiresAt > now
    );

    if (activeAssignments.length === 0) {
        return { allowed: false, scope: null, source: 'none' };
    }

    const groupIds = activeAssignments.map(g => g.groupId);

    // Check if any group has this action
    const groupActions = await db
        .select()
        .from(permissionGroupActions)
        .where(and(
            inArray(permissionGroupActions.groupId, groupIds),
            eq(permissionGroupActions.actionTypeId, actionTypeId)
        ));

    if (groupActions.length > 0) {
        // Find the best scope from group actions
        const scopePriority: Record<PermissionScope, number> = {
            'own': 1,
            'team': 2,
            'department': 3,
            'organization': 4,
            'global': 5,
        };

        const bestAction = groupActions.sort((a, b) =>
            (scopePriority[(b.scope as PermissionScope) || 'team'] || 0) -
            (scopePriority[(a.scope as PermissionScope) || 'team'] || 0)
        )[0];

        return {
            allowed: true,
            scope: (bestAction.scope as PermissionScope) || 'organization',
            source: 'group',
            canDelegate: false,
        };
    }

    return { allowed: false, scope: null, source: 'none' };
}

/**
 * Check if the permission scope allows access to the specific resource
 */
function checkScopeAllows(
    scope: PermissionScope,
    userId: string,
    userTeamId?: string,
    resourceOwnerId?: string,
    resourceTeamId?: string
): boolean {
    switch (scope) {
        case 'own':
            // Only if user owns the resource
            return resourceOwnerId === userId;

        case 'team':
            // Only if resource belongs to user's team
            return !resourceTeamId || resourceTeamId === userTeamId;

        case 'department':
            // Would need to check team hierarchy
            // For now, treat as team-level
            return !resourceTeamId || resourceTeamId === userTeamId;

        case 'organization':
        case 'global':
            // Full access within org
            return true;

        default:
            return false;
    }
}

/**
 * Check multiple permissions at once (more efficient for batch checks)
 */
export async function hasPermissions(
    actionCodes: string[],
    ctx: PermissionContext
): Promise<Map<string, PermissionCheckResult>> {
    const results = new Map<string, PermissionCheckResult>();

    // For now, check individually (can be optimized later)
    for (const code of actionCodes) {
        results.set(code, await hasPermission(code, ctx));
    }

    return results;
}

/**
 * Get all permissions for a user (for UI display)
 */
export async function getUserPermissions(
    userId: string,
    orgId: string
): Promise<{
    actions: Array<{
        code: string;
        name: string;
        category: string;
        allowed: boolean;
        scope: PermissionScope | null;
        source: string;
    }>;
    summary: {
        total: number;
        allowed: number;
        denied: number;
    };
}> {
    // Get all action types
    const allActions = await db
        .select()
        .from(actionTypes)
        .where(eq(actionTypes.isActive, true));

    const ctx: PermissionContext = { userId, orgId };
    const results: Array<{
        code: string;
        name: string;
        category: string;
        allowed: boolean;
        scope: PermissionScope | null;
        source: string;
    }> = [];

    for (const action of allActions) {
        const check = await hasPermission(action.code, ctx);
        results.push({
            code: action.code,
            name: action.name,
            category: action.category,
            allowed: check.allowed,
            scope: check.scope,
            source: check.source,
        });
    }

    return {
        actions: results,
        summary: {
            total: results.length,
            allowed: results.filter(r => r.allowed).length,
            denied: results.filter(r => !r.allowed).length,
        },
    };
}

/**
 * Quick check for common permission patterns
 */
export const can = {
    create: (actionPrefix: string, ctx: PermissionContext) =>
        hasPermission(`${actionPrefix}.create`, ctx),
    read: (actionPrefix: string, ctx: PermissionContext) =>
        hasPermission(`${actionPrefix}.read`, ctx),
    update: (actionPrefix: string, ctx: PermissionContext) =>
        hasPermission(`${actionPrefix}.update`, ctx),
    delete: (actionPrefix: string, ctx: PermissionContext) =>
        hasPermission(`${actionPrefix}.delete`, ctx),
    approve: (actionPrefix: string, ctx: PermissionContext) =>
        hasPermission(`${actionPrefix}.approve`, ctx),
    manage: (actionPrefix: string, ctx: PermissionContext) =>
        hasPermission(`${actionPrefix}.manage`, ctx),
};

