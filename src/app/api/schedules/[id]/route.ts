import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schedules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/schedules/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(schedules)
            .where(eq(schedules.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

// PATCH /api/schedules/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.dayOfWeek !== undefined) updateData.dayOfWeek = body.dayOfWeek;
        if (body.startTime !== undefined) updateData.startTime = body.startTime;
        if (body.endTime !== undefined) updateData.endTime = body.endTime;
        if (body.roomId !== undefined) updateData.roomId = body.roomId;
        if (body.validFrom !== undefined) updateData.validFrom = body.validFrom;
        if (body.validUntil !== undefined) updateData.validUntil = body.validUntil;
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

        const updated = await db
            .update(schedules)
            .set(updateData)
            .where(eq(schedules.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating schedule:', error);
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}

// DELETE /api/schedules/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Soft delete
        const deleted = await db
            .update(schedules)
            .set({ isActive: 0 })
            .where(eq(schedules.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }
}
