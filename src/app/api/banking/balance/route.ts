/**
 * GET /api/banking/balance?gatewayId=xxx
 * 
 * Fetches live balance from the specified gateway adapter.
 * Returns 400 if provider doesn't support balance.
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

        if (!gatewayId) {
            return NextResponse.json({ error: 'gatewayId is required' }, { status: 400 });
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

        if (!adapter.capabilities.balance) {
            return NextResponse.json(
                { error: `Provider '${gateway.provider}' does not support balance queries` },
                { status: 400 },
            );
        }

        const balance = await adapter.getBalance();

        return NextResponse.json({
            data: {
                gatewayId: gateway.id,
                provider: gateway.provider,
                balance,
                fetchedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[Banking] Balance fetch failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch balance' },
            { status: 500 },
        );
    }
}
