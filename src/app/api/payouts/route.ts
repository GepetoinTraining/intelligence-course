import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teacherPayouts } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/payouts - List teacher payouts
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(teacherPayouts.organizationId, orgId));
        }

        if (teacherId) {
            conditions.push(eq(teacherPayouts.teacherId, teacherId));
        }

        if (status) {
            conditions.push(eq(teacherPayouts.status, status as 'calculating' | 'pending_approval' | 'approved' | 'paid' | 'disputed'));
        }

        if (periodStart) {
            conditions.push(gte(teacherPayouts.periodStart, parseInt(periodStart)));
        }

        if (periodEnd) {
            conditions.push(lte(teacherPayouts.periodEnd, parseInt(periodEnd)));
        }

        const result = await db
            .select()
            .from(teacherPayouts)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(teacherPayouts.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching payouts:', error);
        return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }
}

// POST /api/payouts - Create payout
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newPayout = await db.insert(teacherPayouts).values({
            teacherId: body.teacherId,
            organizationId: orgId || body.organizationId,
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
            grossAmount: body.grossAmount,
            deductions: body.deductions || 0,
            netAmount: body.netAmount,
            currency: body.currency || 'BRL',
            breakdown: body.breakdown ? JSON.stringify(body.breakdown) : '{}',
            status: 'calculating',
        }).returning();

        return NextResponse.json({ data: newPayout[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating payout:', error);
        return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
    }
}



