/**
 * GET /api/banking/statement?gatewayId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 
 * Fetches account statement from the specified gateway adapter.
 * Returns entries with computed summary (total credits/debits/count).
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentGateways } from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';
import { createAdapterFromGateway } from '@/lib/payments/factory';

export async function GET(request: NextRequest) {
    try {
        const { orgId } = await getApiAuthWithOrg();
        const gatewayId = request.nextUrl.searchParams.get('gatewayId');
        const startDate = request.nextUrl.searchParams.get('startDate');
        const endDate = request.nextUrl.searchParams.get('endDate');

        if (!gatewayId) {
            return NextResponse.json({ error: 'gatewayId is required' }, { status: 400 });
        }

        // Default to last 30 days
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
        }

        // Max 90 days range
        if (end.getTime() - start.getTime() > 90 * 24 * 60 * 60 * 1000) {
            return NextResponse.json({ error: 'Date range cannot exceed 90 days' }, { status: 400 });
        }

        // Fetch gateway and verify ownership
        const [gateway] = await db
            .select()
            .from(paymentGateways)
            .where(
                and(
                    eq(paymentGateways.id, gatewayId),
                    eq(paymentGateways.organizationId, orgId),
                    eq(paymentGateways.isActive, true),
                ),
            )
            .limit(1);

        if (!gateway) {
            return NextResponse.json({ error: 'Gateway not found or not active' }, { status: 404 });
        }

        const adapter = createAdapterFromGateway(gateway);

        if (!adapter.capabilities.statement) {
            return NextResponse.json(
                { error: `Provider '${gateway.provider}' does not support statement queries` },
                { status: 400 },
            );
        }

        const entries = await adapter.getStatement(start, end);

        // Compute summary
        let totalCreditsCents = 0;
        let totalDebitsCents = 0;
        for (const entry of entries) {
            if (entry.type === 'credit') totalCreditsCents += entry.amountCents;
            else totalDebitsCents += Math.abs(entry.amountCents);
        }

        return NextResponse.json({
            data: {
                gatewayId: gateway.id,
                provider: gateway.provider,
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0],
                entries,
                summary: {
                    count: entries.length,
                    totalCreditsCents,
                    totalDebitsCents,
                    netCents: totalCreditsCents - totalDebitsCents,
                },
                fetchedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[Banking] Statement fetch failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch statement' },
            { status: 500 },
        );
    }
}
