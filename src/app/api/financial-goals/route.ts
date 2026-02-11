import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financialGoals } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/financial-goals - List financial goals
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const goalType = searchParams.get('goalType');
    const status = searchParams.get('status');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(financialGoals.organizationId, orgId));
        }
        if (year) {
            conditions.push(eq(financialGoals.year, parseInt(year)));
        }
        if (goalType) {
            conditions.push(eq(financialGoals.goalType, goalType as any));
        }
        if (status) {
            conditions.push(eq(financialGoals.status, status as any));
        }

        const result = await db
            .select()
            .from(financialGoals)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(financialGoals.year));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching financial goals:', error);
        return NextResponse.json({ error: 'Failed to fetch financial goals' }, { status: 500 });
    }
}

// POST /api/financial-goals - Create financial goal
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newGoal = await db.insert(financialGoals).values({
            organizationId: orgId,
            year: body.year || new Date().getFullYear(),
            month: body.month,
            quarter: body.quarter,
            goalType: body.goalType,
            name: body.name,
            description: body.description,
            costCenterId: body.costCenterId,
            targetAmountCents: body.targetAmountCents,
            targetCount: body.targetCount,
            targetPercent: body.targetPercent,
            status: 'draft',
            createdBy: personId,
        }).returning();

        return NextResponse.json({ data: newGoal[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating financial goal:', error);
        return NextResponse.json({ error: 'Failed to create financial goal' }, { status: 500 });
    }
}
