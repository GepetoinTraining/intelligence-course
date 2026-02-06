import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teacherPayouts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/payouts/[id]/approve - Approve payout
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // Get current payout
        const existing = await db
            .select()
            .from(teacherPayouts)
            .where(eq(teacherPayouts.id, id))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        if (existing[0].status !== 'pending_approval') {
            return NextResponse.json({ error: 'Payout is not pending approval' }, { status: 400 });
        }

        const updated = await db
            .update(teacherPayouts)
            .set({
                status: 'approved',
                approvedBy: personId,
                approvedAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(teacherPayouts.id, id))
            .returning();

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error approving payout:', error);
        return NextResponse.json({ error: 'Failed to approve payout' }, { status: 500 });
    }
}
