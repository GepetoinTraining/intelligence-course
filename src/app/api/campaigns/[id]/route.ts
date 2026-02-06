import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/campaigns/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(campaigns)
            .where(eq(campaigns.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
    }
}

// PATCH /api/campaigns/[id]
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
        if (body.description !== undefined) updateData.description = body.description;
        if (body.campaignType !== undefined) updateData.campaignType = body.campaignType;
        if (body.channels !== undefined) updateData.channels = JSON.stringify(body.channels);
        if (body.targetAudience !== undefined) updateData.targetAudience = JSON.stringify(body.targetAudience);
        if (body.startsAt !== undefined) updateData.startsAt = body.startsAt;
        if (body.endsAt !== undefined) updateData.endsAt = body.endsAt;
        if (body.budgetCents !== undefined) updateData.budgetCents = body.budgetCents;
        if (body.spentCents !== undefined) updateData.spentCents = body.spentCents;
        if (body.status !== undefined) updateData.status = body.status;

        // Track actual metrics
        if (body.actualLeads !== undefined) updateData.actualLeads = body.actualLeads;
        if (body.actualEnrollments !== undefined) updateData.actualEnrollments = body.actualEnrollments;
        if (body.actualRevenueCents !== undefined) updateData.actualRevenueCents = body.actualRevenueCents;

        const updated = await db
            .update(campaigns)
            .set(updateData)
            .where(eq(campaigns.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }
}

// DELETE /api/campaigns/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(campaigns)
            .set({ status: 'cancelled', updatedAt: Math.floor(Date.now() / 1000) })
            .where(eq(campaigns.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling campaign:', error);
        return NextResponse.json({ error: 'Failed to cancel campaign' }, { status: 500 });
    }
}
