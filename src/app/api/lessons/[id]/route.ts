import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessons, tasks, prompts } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/lessons/[id] - Get lesson with tasks and prompts
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const lesson = await db
            .select()
            .from(lessons)
            .where(eq(lessons.id, id))
            .limit(1);

        if (lesson.length === 0) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Get tasks for this lesson
        const lessonTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.lessonId, id))
            .orderBy(asc(tasks.orderIndex));

        // Get prompts for this lesson
        const lessonPrompts = await db
            .select()
            .from(prompts)
            .where(eq(prompts.lessonId, id))
            .orderBy(asc(prompts.createdAt));

        return NextResponse.json({
            data: {
                ...lesson[0],
                tasks: lessonTasks,
                prompts: lessonPrompts,
            }
        });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 });
    }
}

// PATCH /api/lessons/[id] - Update lesson
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

        if (body.title !== undefined) {
            updateData.title = typeof body.title === 'string' ? body.title : JSON.stringify(body.title);
        }
        if (body.description !== undefined) {
            updateData.description = JSON.stringify(body.description);
        }
        if (body.content !== undefined) updateData.content = body.content;
        if (body.contentFormat !== undefined) updateData.contentFormat = body.contentFormat;
        if (body.orderIndex !== undefined) updateData.orderIndex = body.orderIndex;
        if (body.lessonType !== undefined) updateData.lessonType = body.lessonType;

        const updated = await db
            .update(lessons)
            .set(updateData)
            .where(eq(lessons.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating lesson:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
    }
}

// DELETE /api/lessons/[id] - Archive lesson
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(lessons)
            .set({ archivedAt: Math.floor(Date.now() / 1000) })
            .where(eq(lessons.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error archiving lesson:', error);
        return NextResponse.json({ error: 'Failed to archive lesson' }, { status: 500 });
    }
}
