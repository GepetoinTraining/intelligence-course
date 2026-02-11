/**
 * Charge Detail API
 * 
 * Route: /api/charges/[id]
 * 
 * Get charge status and refund charges.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { getAdapterForOrg, PaymentAdapterError } from '@/lib/payments';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { orgId } = await getApiAuthWithOrg();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adapter = await getAdapterForOrg(orgId);
        const charge = await adapter.getCharge(id);

        return NextResponse.json({ success: true, charge });
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

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { orgId } = await getApiAuthWithOrg();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adapter = await getAdapterForOrg(orgId);
        await adapter.cancelCharge(id);

        return NextResponse.json({ success: true, cancelled: true });
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { orgId } = await getApiAuthWithOrg();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const action = body.action;

        const adapter = await getAdapterForOrg(orgId);

        if (action === 'refund') {
            const result = await adapter.refundCharge(id, body.amountCents);
            return NextResponse.json({ success: true, refund: result });
        }

        return NextResponse.json({ error: 'Unknown action. Use action: "refund"' }, { status: 400 });
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
