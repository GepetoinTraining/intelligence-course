import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { moneyFlows } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/money-flows - List money flows (chain of custody)
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const flowType = searchParams.get('flowType');
    const direction = searchParams.get('direction');
    const location = searchParams.get('location');
    const isReconciled = searchParams.get('isReconciled');
    const after = searchParams.get('after');
    const before = searchParams.get('before');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(moneyFlows.organizationId, orgId));
        }
        if (flowType) {
            conditions.push(eq(moneyFlows.flowType, flowType as any));
        }
        if (direction) {
            conditions.push(eq(moneyFlows.direction, direction as any));
        }
        if (location) {
            conditions.push(eq(moneyFlows.location, location as any));
        }
        if (isReconciled === 'true') {
            conditions.push(eq(moneyFlows.isReconciled, true));
        } else if (isReconciled === 'false') {
            conditions.push(eq(moneyFlows.isReconciled, false));
        }
        if (after) {
            conditions.push(gte(moneyFlows.createdAt, parseInt(after)));
        }
        if (before) {
            conditions.push(lte(moneyFlows.createdAt, parseInt(before)));
        }

        const result = await db
            .select()
            .from(moneyFlows)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(moneyFlows.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching money flows:', error);
        return NextResponse.json({ error: 'Failed to fetch money flows' }, { status: 500 });
    }
}
