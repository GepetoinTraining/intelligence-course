import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/todos/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(todoItems)
            .where(and(eq(todoItems.id, id), eq(todoItems.personId, personId)))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching todo:', error);
        return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
    }
}

// PATCH /api/todos/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;

        // If urgency or importance change, recalculate quadrant
        const urgency = body.urgency;
        const importance = body.importance;

        if (urgency !== undefined) updateData.urgency = urgency;
        if (importance !== undefined) updateData.importance = importance;
        if (body.effort !== undefined) updateData.effort = body.effort;

        if (urgency !== undefined || importance !== undefined) {
            const u = urgency ?? 5;
            const i = importance ?? 5;

            if (u >= 5 && i >= 5) updateData.quadrant = 'do_first';
            else if (u < 5 && i >= 5) updateData.quadrant = 'schedule';
            else if (u >= 5 && i < 5) updateData.quadrant = 'delegate';
            else updateData.quadrant = 'eliminate';
        }

        if (body.status === 'completed') {
            updateData.completedAt = Math.floor(Date.now() / 1000);
        }

        const updated = await db
            .update(todoItems)
            .set(updateData)
            .where(and(eq(todoItems.id, id), eq(todoItems.personId, personId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating todo:', error);
        return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
    }
}

// DELETE /api/todos/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(todoItems)
            .where(and(eq(todoItems.id, id), eq(todoItems.personId, personId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting todo:', error);
        return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
    }
}
