import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staffLeave } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/staff-leave/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const leave = await db
            .select()
            .from(staffLeave)
            .where(eq(staffLeave.id, id))
            .limit(1);

        if (leave.length === 0) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        return NextResponse.json({ data: leave[0] });
    } catch (error) {
        console.error('Error fetching leave request:', error);
        return NextResponse.json({ error: 'Failed to fetch leave request' }, { status: 500 });
    }
}

// PATCH /api/staff-leave/[id] - Update/Approve/Reject leave
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.status !== undefined) {
            updateData.status = body.status;
            if (body.status === 'approved') {
                updateData.approvedBy = userId;
                updateData.approvedAt = Date.now();
            }
        }
        if (body.startDate !== undefined) updateData.startDate = body.startDate;
        if (body.endDate !== undefined) updateData.endDate = body.endDate;
        if (body.reason !== undefined) updateData.reason = body.reason;
        if (body.leaveType !== undefined) updateData.leaveType = body.leaveType;

        const updated = await db
            .update(staffLeave)
            .set(updateData)
            .where(eq(staffLeave.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating leave request:', error);
        return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 });
    }
}

// DELETE /api/staff-leave/[id] - Cancel leave request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const cancelled = await db
            .update(staffLeave)
            .set({ status: 'cancelled' })
            .where(eq(staffLeave.id, id))
            .returning();

        if (cancelled.length === 0) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling leave request:', error);
        return NextResponse.json({ error: 'Failed to cancel leave request' }, { status: 500 });
    }
}
