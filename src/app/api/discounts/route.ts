import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { discounts } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/discounts - List discounts
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const discountType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (orgId) conditions.push(eq(discounts.organizationId, orgId));
        if (discountType) {
            conditions.push(eq(discounts.discountType, discountType as any));
        }

        const result = await db
            .select()
            .from(discounts)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(discounts.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching discounts:', error);
        return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
    }
}

// POST /api/discounts - Create discount
export async function POST(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized - organization required' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, discountType, percentage, fixedAmount, code, validFrom, validUntil, maxUses } = body;

        if (!name || !discountType) {
            return NextResponse.json({ error: 'name and discountType required' }, { status: 400 });
        }

        const newDiscount = await db.insert(discounts).values({
            organizationId: orgId,
            name,
            discountType,
            percentage,
            fixedAmount,
            code,
            validFrom,
            validUntil,
            maxUses,
        }).returning();

        return NextResponse.json({ data: newDiscount[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating discount:', error);
        return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
    }
}

