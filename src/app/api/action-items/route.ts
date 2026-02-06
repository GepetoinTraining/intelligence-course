/**
 * Action Items API
 * 
 * GET /api/action-items - List action items (filtered by entity, user, status)
 * POST /api/action-items - Create a new action item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { actionItems, actionItemTypes, users, activityFeed } from '@/lib/db/schema';
import { eq, and, desc, or, gte, lte, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const entityType = request.nextUrl.searchParams.get('entityType');
        const entityId = request.nextUrl.searchParams.get('entityId');
        const assignedTo = request.nextUrl.searchParams.get('assignedTo');
        const status = request.nextUrl.searchParams.get('status');
        const fromDate = request.nextUrl.searchParams.get('fromDate');
        const toDate = request.nextUrl.searchParams.get('toDate');
        const view = request.nextUrl.searchParams.get('view') || 'all'; // 'my', 'all', 'entity'

        // Build conditions
        const conditions = [eq(actionItems.organizationId, orgId)];

        // Filter by entity (for CRM modal)
        if (entityType && entityId) {
            conditions.push(eq(actionItems.linkedEntityType, entityType));
            conditions.push(eq(actionItems.linkedEntityId, entityId));
        }

        // Filter by assigned user (for personal calendar)
        if (view === 'my' || assignedTo) {
            conditions.push(eq(actionItems.assignedTo, assignedTo || userId));
        }

        // Filter by status
        if (status && status !== 'all') {
            conditions.push(eq(actionItems.status, status as any));
        } else {
            // Default: exclude completed/cancelled for calendar views
            if (view === 'my') {
                conditions.push(
                    or(
                        eq(actionItems.status, 'pending'),
                        eq(actionItems.status, 'in_progress')
                    )!
                );
            }
        }

        // Date range filter (for calendar)
        if (fromDate) {
            conditions.push(gte(actionItems.dueDate, parseInt(fromDate)));
        }
        if (toDate) {
            conditions.push(lte(actionItems.dueDate, parseInt(toDate)));
        }

        // Fetch action items
        const items = await db.select({
            id: actionItems.id,
            title: actionItems.title,
            description: actionItems.description,
            actionTypeId: actionItems.actionTypeId,
            linkedEntityType: actionItems.linkedEntityType,
            linkedEntityId: actionItems.linkedEntityId,
            assignedTo: actionItems.assignedTo,
            createdBy: actionItems.createdBy,
            status: actionItems.status,
            priority: actionItems.priority,
            dueDate: actionItems.dueDate,
            dueTime: actionItems.dueTime,
            startDate: actionItems.startDate,
            endDate: actionItems.endDate,
            isAllDay: actionItems.isAllDay,
            completedAt: actionItems.completedAt,
            outcome: actionItems.outcome,
            createdAt: actionItems.createdAt,
        }).from(actionItems)
            .where(and(...conditions))
            .orderBy(desc(actionItems.priority), actionItems.dueDate)
            .limit(100);

        // Enrich with user info and action type
        const enrichedItems = await Promise.all(
            items.map(async (item) => {
                const [assignedUser, creator, actionType] = await Promise.all([
                    item.assignedTo ? db.query.users.findFirst({
                        where: eq(users.id, item.assignedTo),
                        columns: { name: true, avatarUrl: true },
                    }) : null,
                    db.query.users.findFirst({
                        where: eq(users.id, item.createdBy),
                        columns: { name: true },
                    }),
                    item.actionTypeId ? db.query.actionItemTypes.findFirst({
                        where: eq(actionItemTypes.id, item.actionTypeId),
                        columns: { name: true, icon: true, color: true },
                    }) : null,
                ]);

                return {
                    ...item,
                    assignedToName: assignedUser?.name || null,
                    assignedToAvatar: assignedUser?.avatarUrl || null,
                    createdByName: creator?.name || 'Unknown',
                    actionTypeName: actionType?.name || null,
                    actionTypeIcon: actionType?.icon || 'IconChecklist',
                    actionTypeColor: actionType?.color || 'blue',
                };
            })
        );

        return NextResponse.json({ items: enrichedItems });

    } catch (error) {
        console.error('Error fetching action items:', error);
        return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            description,
            actionTypeId,
            linkedEntityType,
            linkedEntityId,
            assignedTo,
            priority,
            dueDate,
            dueTime,
            isAllDay,
            reminders,
        } = body;

        if (!title) {
            return NextResponse.json({ error: 'title required' }, { status: 400 });
        }

        // Get user name for activity feed
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true },
        });

        // Create the action item
        const [newItem] = await db.insert(actionItems).values({
            organizationId: orgId,
            title,
            description: description || null,
            actionTypeId: actionTypeId || null,
            linkedEntityType: linkedEntityType || null,
            linkedEntityId: linkedEntityId || null,
            assignedTo: assignedTo || userId,
            createdBy: userId,
            priority: priority || 'medium',
            dueDate: dueDate || null,
            dueTime: dueTime || null,
            isAllDay: isAllDay || false,
            reminders: reminders ? JSON.stringify(reminders) : '[]',
        }).returning();

        // Log to activity feed
        await db.insert(activityFeed).values({
            organizationId: orgId,
            actorId: userId,
            actorName: user?.name || 'Unknown',
            action: 'task_created',
            entityType: linkedEntityType || 'action_item',
            entityId: linkedEntityId || newItem.id,
            entityName: title,
            details: JSON.stringify({
                actionItemId: newItem.id,
                priority,
                dueDate,
            }),
        });

        return NextResponse.json({
            success: true,
            item: newItem,
        });

    } catch (error) {
        console.error('Error creating action item:', error);
        return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 });
    }
}

