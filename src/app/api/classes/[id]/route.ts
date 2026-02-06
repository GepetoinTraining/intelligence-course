import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classes, schedules, enrollments, users } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/classes/[id] - Get class with schedules and enrolled students
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const classData = await db
            .select()
            .from(classes)
            .where(eq(classes.id, id))
            .limit(1);

        if (classData.length === 0) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        // Get schedules
        const classSchedules = await db
            .select()
            .from(schedules)
            .where(eq(schedules.classId, id))
            .orderBy(asc(schedules.dayOfWeek));

        // Get enrolled students
        const classEnrollments = await db
            .select({
                enrollment: enrollments,
                student: users,
            })
            .from(enrollments)
            .innerJoin(users, eq(enrollments.userId, users.id))
            .where(eq(enrollments.classId, id));

        return NextResponse.json({
            data: {
                ...classData[0],
                schedules: classSchedules,
                students: classEnrollments.map(e => ({
                    ...e.student,
                    enrollmentId: e.enrollment.id,
                    enrolledAt: e.enrollment.enrolledAt,
                    status: e.enrollment.status,
                })),
            }
        });
    } catch (error) {
        console.error('Error fetching class:', error);
        return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 });
    }
}

// PATCH /api/classes/[id]
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

        if (body.name !== undefined) updateData.name = body.name;
        if (body.teacherId !== undefined) updateData.teacherId = body.teacherId;
        if (body.maxStudents !== undefined) updateData.maxStudents = body.maxStudents;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.startsAt !== undefined) updateData.startsAt = body.startsAt;
        if (body.endsAt !== undefined) updateData.endsAt = body.endsAt;
        if (body.courseId !== undefined) updateData.courseId = body.courseId;
        if (body.levelId !== undefined) updateData.levelId = body.levelId;

        const updated = await db
            .update(classes)
            .set(updateData)
            .where(eq(classes.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating class:', error);
        return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
    }
}

// DELETE /api/classes/[id] - Cancel class
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const cancelled = await db
            .update(classes)
            .set({
                status: 'cancelled',
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(classes.id, id))
            .returning();

        if (cancelled.length === 0) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling class:', error);
        return NextResponse.json({ error: 'Failed to cancel class' }, { status: 500 });
    }
}
