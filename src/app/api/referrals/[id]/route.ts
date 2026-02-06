import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { referrals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/referrals/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(referrals)
            .where(eq(referrals.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching referral:', error);
        return NextResponse.json({ error: 'Failed to fetch referral' }, { status: 500 });
    }
}

// PATCH /api/referrals/[id]
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

        if (body.status !== undefined) updateData.status = body.status;
        if (body.leadId !== undefined) updateData.leadId = body.leadId;
        if (body.referredUserId !== undefined) updateData.referredUserId = body.referredUserId;
        if (body.referrerRewardType !== undefined) updateData.referrerRewardType = body.referrerRewardType;
        if (body.referrerRewardValue !== undefined) updateData.referrerRewardValue = body.referrerRewardValue;
        if (body.referrerRewardApplied !== undefined) updateData.referrerRewardApplied = body.referrerRewardApplied ? 1 : 0;
        if (body.referredRewardType !== undefined) updateData.referredRewardType = body.referredRewardType;
        if (body.referredRewardValue !== undefined) updateData.referredRewardValue = body.referredRewardValue;
        if (body.referredRewardApplied !== undefined) updateData.referredRewardApplied = body.referredRewardApplied ? 1 : 0;

        const updated = await db
            .update(referrals)
            .set(updateData)
            .where(eq(referrals.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating referral:', error);
        return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
    }
}

// DELETE /api/referrals/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(referrals)
            .where(eq(referrals.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting referral:', error);
        return NextResponse.json({ error: 'Failed to delete referral' }, { status: 500 });
    }
}
