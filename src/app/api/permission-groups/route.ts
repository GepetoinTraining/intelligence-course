import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    permissionGroups,
    permissionGroupActions,
    userGroupAssignments,
    actionTypes,
    users,
    permissionAuditLog
} from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Schemas
const createGroupSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    actionTypeIds: z.array(z.string().uuid()).optional(),
});

const assignUserSchema = z.object({
    groupId: z.string().uuid(),
    userId: z.string(),
    teamId: z.string().uuid().optional().nullable(),
    expiresAt: z.number().optional(),
});

// Slug generator
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// GET: List permission groups
export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const groupId = searchParams.get('groupId');
        const includeActions = searchParams.get('includeActions') === 'true';
        const includeUsers = searchParams.get('includeUsers') === 'true';

        if (groupId) {
            // Get single group with details
            const [group] = await db
                .select()
                .from(permissionGroups)
                .where(and(
                    eq(permissionGroups.id, groupId),
                    eq(permissionGroups.organizationId, orgId)
                ))
                .limit(1);

            if (!group) {
                return NextResponse.json({ error: 'Group not found' }, { status: 404 });
            }

            let actions: any[] = [];
            let assignedUsers: any[] = [];

            if (includeActions) {
                actions = await db
                    .select({
                        id: actionTypes.id,
                        code: actionTypes.code,
                        name: actionTypes.name,
                        category: actionTypes.category,
                        riskLevel: actionTypes.riskLevel,
                    })
                    .from(permissionGroupActions)
                    .leftJoin(actionTypes, eq(permissionGroupActions.actionTypeId, actionTypes.id))
                    .where(eq(permissionGroupActions.groupId, groupId));
            }

            if (includeUsers) {
                assignedUsers = await db
                    .select({
                        assignmentId: userGroupAssignments.id,
                        userId: users.id,
                        userName: users.name,
                        userEmail: users.email,
                        userAvatar: users.avatarUrl,
                        grantedAt: userGroupAssignments.grantedAt,
                        expiresAt: userGroupAssignments.expiresAt,
                    })
                    .from(userGroupAssignments)
                    .leftJoin(users, eq(userGroupAssignments.userId, users.id))
                    .where(eq(userGroupAssignments.groupId, groupId));
            }

            return NextResponse.json({
                success: true,
                data: {
                    ...group,
                    actions,
                    users: assignedUsers,
                },
            });
        }

        // List all groups for org
        const groups = await db
            .select()
            .from(permissionGroups)
            .where(eq(permissionGroups.organizationId, orgId));

        // Get action counts for each group
        const groupIds = groups.map(g => g.id);
        let actionCounts: Record<string, number> = {};
        let userCounts: Record<string, number> = {};

        if (groupIds.length > 0) {
            const actionCountResults = await db
                .select({ groupId: permissionGroupActions.groupId })
                .from(permissionGroupActions)
                .where(inArray(permissionGroupActions.groupId, groupIds));

            actionCountResults.forEach(r => {
                actionCounts[r.groupId] = (actionCounts[r.groupId] || 0) + 1;
            });

            const userCountResults = await db
                .select({ groupId: userGroupAssignments.groupId })
                .from(userGroupAssignments)
                .where(inArray(userGroupAssignments.groupId, groupIds));

            userCountResults.forEach(r => {
                userCounts[r.groupId] = (userCounts[r.groupId] || 0) + 1;
            });
        }

        const enrichedGroups = groups.map(g => ({
            ...g,
            actionCount: actionCounts[g.id] || 0,
            userCount: userCounts[g.id] || 0,
        }));

        return NextResponse.json({
            success: true,
            data: enrichedGroups,
            count: enrichedGroups.length,
        });
    } catch (error) {
        console.error('Error fetching permission groups:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create group or assign user
export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Check if this is a user assignment or group creation
        if (body.groupId && body.userId) {
            // Assign user to group
            const validated = assignUserSchema.parse(body);

            // Verify group exists in org
            const [group] = await db
                .select()
                .from(permissionGroups)
                .where(and(
                    eq(permissionGroups.id, validated.groupId),
                    eq(permissionGroups.organizationId, orgId)
                ))
                .limit(1);

            if (!group) {
                return NextResponse.json({ error: 'Group not found' }, { status: 404 });
            }

            // Check if already assigned
            const existing = await db
                .select()
                .from(userGroupAssignments)
                .where(and(
                    eq(userGroupAssignments.groupId, validated.groupId),
                    eq(userGroupAssignments.userId, validated.userId)
                ))
                .limit(1);

            if (existing.length > 0) {
                // Update existing assignment
                await db
                    .update(userGroupAssignments)
                    .set({
                        expiresAt: validated.expiresAt || null,
                        grantedAt: Date.now(),
                        grantedBy: userId,
                    })
                    .where(eq(userGroupAssignments.id, existing[0].id));

                return NextResponse.json({ success: true, updated: true });
            }

            // Create new assignment
            const assignmentId = randomUUID();
            await db.insert(userGroupAssignments).values({
                id: assignmentId,
                groupId: validated.groupId,
                userId: validated.userId,
                teamId: validated.teamId || null,
                expiresAt: validated.expiresAt || null,
                grantedAt: Date.now(),
                grantedBy: userId,
            });

            // Audit log
            await db.insert(permissionAuditLog).values({
                id: randomUUID(),
                organizationId: orgId,
                action: 'grant',
                targetUserId: validated.userId,
                targetGroupId: validated.groupId,
                newValue: JSON.stringify({ groupName: group.name }),
                performedBy: userId,
                performedAt: Date.now(),
            });

            return NextResponse.json({ success: true, assignmentId, created: true }, { status: 201 });
        }

        // Create new group
        const validated = createGroupSchema.parse(body);
        const id = randomUUID();
        const slug = generateSlug(validated.name);

        await db.insert(permissionGroups).values({
            id,
            organizationId: orgId,
            name: validated.name,
            slug,
            description: validated.description || null,
            isSystem: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Add actions if provided
        if (validated.actionTypeIds && validated.actionTypeIds.length > 0) {
            await db.insert(permissionGroupActions).values(
                validated.actionTypeIds.map(actionTypeId => ({
                    id: randomUUID(),
                    groupId: id,
                    actionTypeId,
                }))
            );
        }

        // Audit log
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'grant',
            targetGroupId: id,
            newValue: JSON.stringify({ name: validated.name, actionCount: validated.actionTypeIds?.length || 0 }),
            performedBy: userId,
            performedAt: Date.now(),
        });

        return NextResponse.json({
            success: true,
            data: { id, name: validated.name, slug },
            created: true
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('Error creating permission group:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update group or manage actions
export async function PUT(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { groupId, name, description, actionTypeIds } = body;

        if (!groupId) {
            return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
        }

        // Verify group exists in org
        const [group] = await db
            .select()
            .from(permissionGroups)
            .where(and(
                eq(permissionGroups.id, groupId),
                eq(permissionGroups.organizationId, orgId)
            ))
            .limit(1);

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Update group metadata
        if (name || description !== undefined) {
            await db
                .update(permissionGroups)
                .set({
                    name: name || group.name,
                    slug: name ? generateSlug(name) : group.slug,
                    description: description !== undefined ? description : group.description,
                    updatedAt: Date.now(),
                })
                .where(eq(permissionGroups.id, groupId));
        }

        // Update actions if provided
        if (actionTypeIds !== undefined) {
            // Remove existing actions
            await db
                .delete(permissionGroupActions)
                .where(eq(permissionGroupActions.groupId, groupId));

            // Add new actions
            if (actionTypeIds.length > 0) {
                await db.insert(permissionGroupActions).values(
                    actionTypeIds.map((actionTypeId: string) => ({
                        id: randomUUID(),
                        groupId,
                        actionTypeId,
                    }))
                );
            }
        }

        // Audit log
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'modify',
            targetGroupId: groupId,
            previousValue: JSON.stringify({ name: group.name }),
            newValue: JSON.stringify({ name: name || group.name, actionCount: actionTypeIds?.length }),
            performedBy: userId,
            performedAt: Date.now(),
        });

        return NextResponse.json({ success: true, updated: true });
    } catch (error) {
        console.error('Error updating permission group:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete group or remove user assignment
export async function DELETE(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const groupId = searchParams.get('groupId');
        const targetUserId = searchParams.get('userId');

        if (!groupId) {
            return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
        }

        // Verify group exists in org
        const [group] = await db
            .select()
            .from(permissionGroups)
            .where(and(
                eq(permissionGroups.id, groupId),
                eq(permissionGroups.organizationId, orgId)
            ))
            .limit(1);

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        if (group.isSystem) {
            return NextResponse.json({ error: 'Cannot delete system group' }, { status: 403 });
        }

        if (targetUserId) {
            // Remove user from group
            await db
                .delete(userGroupAssignments)
                .where(and(
                    eq(userGroupAssignments.groupId, groupId),
                    eq(userGroupAssignments.userId, targetUserId)
                ));

            // Audit log
            await db.insert(permissionAuditLog).values({
                id: randomUUID(),
                organizationId: orgId,
                action: 'revoke',
                targetUserId,
                targetGroupId: groupId,
                previousValue: JSON.stringify({ groupName: group.name }),
                performedBy: userId,
                performedAt: Date.now(),
            });

            return NextResponse.json({ success: true, removedUser: true });
        }

        // Delete entire group
        await db.delete(permissionGroupActions).where(eq(permissionGroupActions.groupId, groupId));
        await db.delete(userGroupAssignments).where(eq(userGroupAssignments.groupId, groupId));
        await db.delete(permissionGroups).where(eq(permissionGroups.id, groupId));

        // Audit log
        await db.insert(permissionAuditLog).values({
            id: randomUUID(),
            organizationId: orgId,
            action: 'revoke',
            targetGroupId: groupId,
            previousValue: JSON.stringify({ name: group.name }),
            performedBy: userId,
            performedAt: Date.now(),
        });

        return NextResponse.json({ success: true, deleted: true });
    } catch (error) {
        console.error('Error deleting permission group:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

