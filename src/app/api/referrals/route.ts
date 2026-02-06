import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { referrals } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/referrals - List referrals
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const referrerId = searchParams.get('referrerId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(referrals.organizationId, orgId));
        }

        if (referrerId) {
            conditions.push(eq(referrals.referrerId, referrerId));
        }

        if (status) {
            conditions.push(eq(referrals.status, status as 'pending' | 'qualified' | 'enrolled' | 'rewarded'));
        }

        const result = await db
            .select()
            .from(referrals)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(referrals.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching referrals:', error);
        return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
    }
}

// POST /api/referrals - Create referral
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newReferral = await db.insert(referrals).values({
            organizationId: orgId || body.organizationId,
            referrerId: body.referrerId || userId,
            leadId: body.leadId,
            referredUserId: body.referredUserId,
            status: 'pending',
            referrerRewardType: body.referrerRewardType,
            referrerRewardValue: body.referrerRewardValue,
            referredRewardType: body.referredRewardType,
            referredRewardValue: body.referredRewardValue,
        }).returning();

        return NextResponse.json({ data: newReferral[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating referral:', error);
        return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
    }
}



