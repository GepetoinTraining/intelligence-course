/**
 * Unified Charge API
 * 
 * Route: /api/charges
 * 
 * Creates payment charges via the org's configured PSP adapter.
 * Automatically resolves which provider to use from gateway config.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { getAdapterForOrg, PaymentAdapterError } from '@/lib/payments';
import type { CreateChargeParams, PaymentMethod } from '@/lib/payments';

export async function POST(request: NextRequest) {
    try {
        const { orgId } = await getApiAuthWithOrg();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate required fields
        if (!body.method || !body.amountCents || !body.customer) {
            return NextResponse.json(
                { error: 'Missing required fields: method, amountCents, customer' },
                { status: 400 },
            );
        }

        const validMethods: PaymentMethod[] = ['pix', 'boleto', 'credit_card', 'debit_card'];
        if (!validMethods.includes(body.method)) {
            return NextResponse.json(
                { error: `Invalid method. Must be one of: ${validMethods.join(', ')}` },
                { status: 400 },
            );
        }

        // Get the adapter for this org
        const adapter = await getAdapterForOrg(orgId);

        // Verify the adapter supports this method
        const capMap: Record<string, keyof typeof adapter.capabilities> = {
            pix: 'pix', boleto: 'boleto', credit_card: 'creditCard', debit_card: 'debitCard',
        };
        if (!adapter.capabilities[capMap[body.method]]) {
            return NextResponse.json(
                { error: `Provider ${adapter.provider} does not support ${body.method}` },
                { status: 400 },
            );
        }

        const params: CreateChargeParams = {
            method: body.method,
            amountCents: body.amountCents,
            description: body.description || 'Mensalidade escolar',
            dueDate: body.dueDate || new Date().toISOString().split('T')[0],
            customer: {
                name: body.customer.name,
                document: body.customer.document,
                email: body.customer.email,
                phone: body.customer.phone,
                address: body.customer.address,
            },
            externalReference: body.externalReference || body.receivableId || crypto.randomUUID(),
            card: body.card,
            cardInstallments: body.cardInstallments,
            pixExpirationMinutes: body.pixExpirationMinutes,
            boletoInstructions: body.boletoInstructions,
            splits: body.splits,
            metadata: body.metadata,
        };

        const result = await adapter.createCharge(params);

        return NextResponse.json({
            success: true,
            charge: result,
        });
    } catch (error) {
        if (error instanceof PaymentAdapterError) {
            return NextResponse.json(
                { error: error.message, provider: error.provider, httpStatus: error.httpStatus },
                { status: error.httpStatus || 500 },
            );
        }
        console.error('[charges] Error creating charge:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { orgId } = await getApiAuthWithOrg();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const chargeId = searchParams.get('id');

        if (!chargeId) {
            return NextResponse.json(
                { error: 'Charge ID required. Pass ?id=xxx' },
                { status: 400 },
            );
        }

        const adapter = await getAdapterForOrg(orgId);
        const status = await adapter.getCharge(chargeId);

        return NextResponse.json({ success: true, charge: status });
    } catch (error) {
        if (error instanceof PaymentAdapterError) {
            return NextResponse.json(
                { error: error.message, provider: error.provider },
                { status: error.httpStatus || 500 },
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
