import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionPayouts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/commission-payouts - List commission payouts
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const commissionType = searchParams.get('commissionType');
    const status = searchParams.get('status');
    const recipientId = searchParams.get('personId');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(commissionPayouts.organizationId, orgId));
        }
        if (commissionType) {
            conditions.push(eq(commissionPayouts.commissionType, commissionType as any));
        }
        if (status) {
            conditions.push(eq(commissionPayouts.status, status as any));
        }
        if (recipientId) {
            conditions.push(eq(commissionPayouts.personId, recipientId));
        }

        const result = await db
            .select()
            .from(commissionPayouts)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(commissionPayouts.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching commission payouts:', error);
        return NextResponse.json({ error: 'Failed to fetch commission payouts' }, { status: 500 });
    }
}

// POST /api/commission-payouts - Create commission payout
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const grossAmountCents = body.grossAmountCents || 0;
        const deductionsCents = body.deductionsCents || 0;
        const netAmountCents = grossAmountCents - deductionsCents;

        const newPayout = await db.insert(commissionPayouts).values({
            organizationId: orgId,
            personId: body.personId,
            recipientId: body.recipientId,
            commissionType: body.commissionType,
            enrollmentId: body.enrollmentId,
            receivableId: body.receivableId,
            sourceDescription: body.sourceDescription,
            baseAmountCents: body.baseAmountCents,
            commissionPercent: body.commissionPercent,
            fixedAmountCents: body.fixedAmountCents,
            grossAmountCents,
            deductionsCents,
            netAmountCents,
            status: 'pending',
            paymentMethod: body.paymentMethod,
            notes: body.notes,
        }).returning();

        return NextResponse.json({ data: newPayout[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating commission payout:', error);
        return NextResponse.json({ error: 'Failed to create commission payout' }, { status: 500 });
    }
}
