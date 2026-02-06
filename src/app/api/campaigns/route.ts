import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/campaigns - List marketing campaigns
export async function GET(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const campaignType = searchParams.get('campaignType');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(campaigns.organizationId, orgId));
        }

        if (status) {
            conditions.push(eq(campaigns.status, status as 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled'));
        }

        if (campaignType) {
            conditions.push(eq(campaigns.campaignType, campaignType as 'enrollment' | 'retention' | 'reactivation' | 'upsell' | 'referral' | 'event' | 'seasonal'));
        }

        const result = await db
            .select()
            .from(campaigns)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(campaigns.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
}

// POST /api/campaigns - Create campaign
export async function POST(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newCampaign = await db.insert(campaigns).values({
            organizationId: orgId || body.organizationId,
            name: body.name,
            description: body.description,
            campaignType: body.campaignType || 'enrollment',
            channels: body.channels ? JSON.stringify(body.channels) : '[]',
            targetAudience: body.targetAudience ? JSON.stringify(body.targetAudience) : null,
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            budgetCents: body.budgetCents,
            goalLeads: body.goalLeads,
            goalEnrollments: body.goalEnrollments,
            goalRevenueCents: body.goalRevenueCents,
            status: body.status || 'draft',
            createdBy: userId,
        }).returning();

        return NextResponse.json({ data: newCampaign[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }
}

