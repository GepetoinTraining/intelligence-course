/**
 * Action Item Detail API
 * 
 * GET /api/action-items/[id] - Get action item details
 * PATCH /api/action-items/[id] - Update action item
 * POST /api/action-items/[id]/complete - Mark as complete with outcome
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { actionItems, users, activityFeed } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

        const item = await db.query.actionItems.findFirst({
            where: eq(actionItems.id, id),
        });

        if (!item) {
            return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
        }

        // Get related user info
        const [assignedUser, creator] = await Promise.all([
            item.assignedTo ? db.query.users.findFirst({
                where: eq(users.id, item.assignedTo),
                columns: { name: true, avatarUrl: true },
            }) : null,
            db.query.users.findFirst({
                where: eq(users.id, item.createdBy),
                columns: { name: true, avatarUrl: true },
            }),
        ]);

        return NextResponse.json({
            item: {
                ...item,
                assignedToName: assignedUser?.name || null,
                assignedToAvatar: assignedUser?.avatarUrl || null,
                createdByName: creator?.name || 'Unknown',
                reminders: item.reminders ? JSON.parse(item.reminders) : [],
                customFieldValues: item.customFieldValues ? JSON.parse(item.customFieldValues) : {},
            },
        });

    } catch (error) {
        console.error('Error fetching action item:', error);
        return NextResponse.json({ error: 'Failed to fetch action item' }, { status: 500 });
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

        // Get current item
        const currentItem = await db.query.actionItems.findFirst({
            where: eq(actionItems.id, id),
        });

        if (!currentItem) {
            return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
        }

        // Prepare update
        const updates: Record<string, any> = {
            updatedAt: Date.now(),
        };

        // Copy allowed fields
        const allowedFields = [
            'title', 'description', 'status', 'priority',
            'dueDate', 'dueTime', 'startDate', 'endDate', 'isAllDay',
            'assignedTo', 'outcome', 'outcomeNotes',
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        // Handle status change to completed
        if (body.status === 'completed' && currentItem.status !== 'completed') {
            updates.completedAt = Date.now();
            updates.completedBy = userId;
        }

        // Apply update
        await db.update(actionItems)
            .set(updates)
            .where(eq(actionItems.id, id));

        // Log significant changes
        if (body.status === 'completed') {
            const user = await db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { name: true },
            });

            await db.insert(activityFeed).values({
                organizationId: orgId,
                actorId: userId,
                actorName: user?.name || 'Unknown',
                action: 'task_completed',
                entityType: currentItem.linkedEntityType || 'action_item',
                entityId: currentItem.linkedEntityId || id,
                entityName: currentItem.title,
                details: JSON.stringify({
                    actionItemId: id,
                    outcome: body.outcome,
                }),
            });
        }

        const updatedItem = await db.query.actionItems.findFirst({
            where: eq(actionItems.id, id),
        });

        return NextResponse.json({ success: true, item: updatedItem });

    } catch (error) {
        console.error('Error updating action item:', error);
        return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
    }
}
