import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trialClasses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/trials/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(trialClasses)
            .where(eq(trialClasses.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching trial:', error);
        return NextResponse.json({ error: 'Failed to fetch trial' }, { status: 500 });
    }
}

// PATCH /api/trials/[id]
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

        if (body.scheduledDate !== undefined) updateData.scheduledDate = body.scheduledDate;
        if (body.scheduledTime !== undefined) updateData.scheduledTime = body.scheduledTime;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.teacherId !== undefined) updateData.teacherId = body.teacherId;
        if (body.roomId !== undefined) updateData.roomId = body.roomId;
        if (body.classId !== undefined) updateData.classId = body.classId;
        if (body.feedbackScore !== undefined) updateData.feedbackScore = body.feedbackScore;
        if (body.feedbackNotes !== undefined) updateData.feedbackNotes = body.feedbackNotes;
        if (body.teacherNotes !== undefined) updateData.teacherNotes = body.teacherNotes;
        if (body.outcome !== undefined) updateData.outcome = body.outcome;

        const updated = await db
            .update(trialClasses)
            .set(updateData)
            .where(eq(trialClasses.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating trial:', error);
        return NextResponse.json({ error: 'Failed to update trial' }, { status: 500 });
    }
}

// DELETE /api/trials/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(trialClasses)
            .set({ status: 'cancelled', updatedAt: Math.floor(Date.now() / 1000) })
            .where(eq(trialClasses.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling trial:', error);
        return NextResponse.json({ error: 'Failed to cancel trial' }, { status: 500 });
    }
}
