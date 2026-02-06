import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/profile/payment-history - Get payment records
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        // Get transactions where user is the payer (related user)
        const payments = await db
            .select()
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.createdAt))
            .limit(limit);

        const summary = {
            totalPaid: payments
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + (p.amount || 0), 0),
            pendingAmount: payments
                .filter(p => p.status === 'pending')
                .reduce((sum, p) => sum + (p.amount || 0), 0),
            totalTransactions: payments.length,
        };

        return NextResponse.json({ data: payments, summary });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }
}

