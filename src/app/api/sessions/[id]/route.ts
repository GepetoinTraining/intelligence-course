import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classSessions, attendance } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/sessions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(classSessions)
            .where(eq(classSessions.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Get attendance for this session
        const sessionAttendance = await db
            .select()
            .from(attendance)
            .where(eq(attendance.sessionId, id));

        return NextResponse.json({
            data: {
                ...result[0],
                attendance: sessionAttendance,
            }
        });
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}

// PATCH /api/sessions/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.sessionDate !== undefined) updateData.sessionDate = body.sessionDate;
        if (body.startTime !== undefined) updateData.startTime = body.startTime;
        if (body.endTime !== undefined) updateData.endTime = body.endTime;
        if (body.roomId !== undefined) updateData.roomId = body.roomId;
        if (body.teacherId !== undefined) updateData.teacherId = body.teacherId;
        if (body.lessonId !== undefined) updateData.lessonId = body.lessonId;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.status !== undefined) updateData.status = body.status;

        const updated = await db
            .update(classSessions)
            .set(updateData)
            .where(eq(classSessions.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

// DELETE /api/sessions/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(classSessions)
            .set({ status: 'cancelled' })
            .where(eq(classSessions.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling session:', error);
        return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 });
    }
}
