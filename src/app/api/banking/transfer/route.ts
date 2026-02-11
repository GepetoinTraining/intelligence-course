/**
 * POST /api/banking/transfer
 * 
 * Initiates a PIX or TED transfer via the specified gateway.
 * Requires transfer capability on the adapter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentGateways } from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';
import { createAdapterFromGateway } from '@/lib/payments/factory';
import type { CreateTransferParams } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
    try {
        const { orgId } = await getApiAuthWithOrg();
        const body = await request.json();

        const { gatewayId, pixKey, pixKeyType, bankAccount, amountCents, description, method } = body;

        if (!gatewayId) {
            return NextResponse.json({ error: 'gatewayId is required' }, { status: 400 });
        }
        if (!amountCents || amountCents <= 0) {
            return NextResponse.json({ error: 'amountCents must be a positive integer' }, { status: 400 });
        }
        if (!method || !['pix', 'ted'].includes(method)) {
            return NextResponse.json({ error: 'method must be "pix" or "ted"' }, { status: 400 });
        }
        if (method === 'pix' && !pixKey) {
            return NextResponse.json({ error: 'pixKey is required for PIX transfers' }, { status: 400 });
        }
        if (method === 'ted' && !bankAccount) {
            return NextResponse.json({ error: 'bankAccount is required for TED transfers' }, { status: 400 });
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

        if (!adapter.capabilities.transfer) {
            return NextResponse.json(
                { error: `Provider '${gateway.provider}' does not support transfers` },
                { status: 400 },
            );
        }

        const transferParams: CreateTransferParams = {
            pixKey,
            pixKeyType,
            bankAccount,
            amountCents: Math.round(amountCents),
            description: description || 'Transferência NodeZero',
            method,
        };

        const result = await adapter.createTransfer(transferParams);

        return NextResponse.json({
            data: {
                gatewayId: gateway.id,
                provider: gateway.provider,
                transfer: result,
                createdAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[Banking] Transfer failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Transfer failed' },
            { status: 500 },
        );
    }
}
