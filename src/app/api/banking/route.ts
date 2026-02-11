/**
 * GET /api/banking
 * 
 * Lists all active banking gateways for the org with their
 * adapter capabilities. This powers the account selector
 * in the banking dashboard.
 */

import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentGateways } from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';
import { createAdapterFromGateway, getSupportedProviders } from '@/lib/payments/factory';

export async function GET() {
    try {
        const { orgId } = await getApiAuthWithOrg();

        // Get all active gateways
        const gateways = await db
            .select()
            .from(paymentGateways)
            .where(
                and(
                    eq(paymentGateways.organizationId, orgId),
                    eq(paymentGateways.isActive, true),
                ),
            );

        const providerMeta = getSupportedProviders();

        const accounts = gateways.map((gw) => {
            // Try to build adapter to read capabilities
            let capabilities = {
                pix: false, boleto: false, creditCard: false, debitCard: false,
                recurring: false, split: false, transfer: false, balance: false, statement: false,
            };

            try {
                const adapter = createAdapterFromGateway(gw);
                capabilities = adapter.capabilities;
            } catch {
                // If adapter can't be created, leave all capabilities false
            }

            const meta = providerMeta.find(p => p.provider === gw.provider);

            return {
                id: gw.id,
                provider: gw.provider,
                accountName: gw.accountName || meta?.name || gw.provider,
                providerLabel: meta?.name || gw.provider,
                category: meta?.category || 'psp',
                isProduction: gw.isProduction,
                capabilities,
            };
        });

        return NextResponse.json({ data: accounts });
    } catch (error) {
        console.error('[Banking] Failed to list accounts:', error);
        return NextResponse.json(
            { error: 'Failed to list banking accounts' },
            { status: 500 },
        );
    }
}
