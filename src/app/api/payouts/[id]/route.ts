import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teacherPayouts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/payouts/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(teacherPayouts)
            .where(eq(teacherPayouts.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching payout:', error);
        return NextResponse.json({ error: 'Failed to fetch payout' }, { status: 500 });
    }
}

// PATCH /api/payouts/[id]
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

        if (body.status !== undefined) updateData.status = body.status;
        if (body.grossAmount !== undefined) updateData.grossAmount = body.grossAmount;
        if (body.deductions !== undefined) updateData.deductions = body.deductions;
        if (body.netAmount !== undefined) updateData.netAmount = body.netAmount;
        if (body.breakdown !== undefined) updateData.breakdown = JSON.stringify(body.breakdown);
        if (body.payoutReference !== undefined) updateData.payoutReference = body.payoutReference;

        if (body.status === 'approved') {
            updateData.approvedBy = personId;
            updateData.approvedAt = Math.floor(Date.now() / 1000);
        }

        if (body.status === 'paid') {
            updateData.paidDate = Math.floor(Date.now() / 1000);
        }

        const updated = await db
            .update(teacherPayouts)
            .set(updateData)
            .where(eq(teacherPayouts.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating payout:', error);
        return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
    }
}

// DELETE /api/payouts/[id] - Cancel payout
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(teacherPayouts)
            .where(eq(teacherPayouts.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting payout:', error);
        return NextResponse.json({ error: 'Failed to delete payout' }, { status: 500 });
    }
}
