import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, desc, gte, lte, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const transactionType = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (orgId) conditions.push(eq(transactions.organizationId, orgId));
        if (transactionType) {
            // Valid types: payment_received, teacher_payout, school_revenue, platform_fee, service_fee, refund
            conditions.push(eq(transactions.type, transactionType as any));
        }
        if (status) {
            conditions.push(eq(transactions.status, status as any));
        }

        const result = await db
            .select()
            .from(transactions)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(transactions.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

// POST /api/transactions - Create transaction
export async function POST(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            invoiceId,
            type,
            amount,
            currency,
            status,
            payoutMethod,
            payoutReference,
        } = body;

        if (!type || amount === undefined) {
            return NextResponse.json({ error: 'type and amount required' }, { status: 400 });
        }

        const newTransaction = await db.insert(transactions).values({
            organizationId: orgId,
            invoiceId,
            type,
            userId,
            amount,
            currency,
            status: status || 'pending',
            payoutMethod,
            payoutReference,
        }).returning();

        return NextResponse.json({ data: newTransaction[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

