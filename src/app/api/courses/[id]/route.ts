import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, modules } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/courses/[id] - Get course with modules
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const course = await db
            .select()
            .from(courses)
            .where(eq(courses.id, id))
            .limit(1);

        if (course.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Get modules for this course
        const courseModules = await db
            .select()
            .from(modules)
            .where(eq(modules.courseId, id))
            .orderBy(asc(modules.orderIndex));

        return NextResponse.json({
            data: {
                ...course[0],
                modules: courseModules
            }
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}

// PATCH /api/courses/[id] - Update course
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.title !== undefined) updateData.title = JSON.stringify(body.title);
        if (body.description !== undefined) updateData.description = JSON.stringify(body.description);
        if (body.isPublished !== undefined) updateData.isPublished = body.isPublished ? 1 : 0;
        if (body.isPublic !== undefined) updateData.isPublic = body.isPublic ? 1 : 0;
        if (body.version !== undefined) updateData.version = body.version;
        if (body.language !== undefined) updateData.language = body.language;

        const updated = await db
            .update(courses)
            .set(updateData)
            .where(eq(courses.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating course:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}

// DELETE /api/courses/[id] - Archive course
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(courses)
            .set({ archivedAt: Math.floor(Date.now() / 1000) })
            .where(eq(courses.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error archiving course:', error);
        return NextResponse.json({ error: 'Failed to archive course' }, { status: 500 });
    }
}
