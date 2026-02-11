/**
 * Dynamic Webhook Receiver for All Payment Providers
 * 
 * Route: /api/webhooks/[provider]/route.ts
 * 
 * Receives webhook callbacks from Asaas, PagBank, Mercado Pago,
 * Pagar.me, and Inter. Validates, parses, and updates receivables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { paymentGateways, receivables } from '@/lib/db/schema';
import { decrypt } from '@/lib/crypto';
import { createAdapter } from '@/lib/payments/factory';
import type { PaymentProvider, GatewayConfig, NormalizedWebhookEvent } from '@/lib/payments/types';

const VALID_PROVIDERS = ['asaas', 'pagbank', 'mercadopago', 'pagarme', 'inter'];

export async function POST(
    request: NextRequest,
    { params }: { params: { provider: string } },
) {
    const provider = params.provider;

    // Validate provider name
    if (!VALID_PROVIDERS.includes(provider)) {
        return NextResponse.json({ error: 'Unknown provider' }, { status: 404 });
    }

    try {
        const rawBody = await request.text();
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
        });

        let body: unknown;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // Find all gateways of this provider type to validate
        const gateways = await db
            .select()
            .from(paymentGateways)
            .where(eq(paymentGateways.provider, provider as any));

        if (gateways.length === 0) {
            console.warn(`[webhook/${provider}] No gateways configured for provider`);
            return NextResponse.json({ received: true, warning: 'no_gateway_configured' });
        }

        // Try each gateway until validation passes
        let event: NormalizedWebhookEvent | null = null;

        for (const gw of gateways) {
            const config: GatewayConfig = {
                id: gw.id,
                provider: gw.provider as PaymentProvider,
                apiKey: gw.apiKeyEncrypted ? decrypt(gw.apiKeyEncrypted) : '',
                secretKey: gw.secretKeyEncrypted ? decrypt(gw.secretKeyEncrypted) : undefined,
                webhookSecret: gw.webhookSecret || undefined,
                sandboxMode: !gw.isProduction,
            };

            const adapter = createAdapter(config);

            if (adapter.validateWebhook(headers, rawBody)) {
                event = adapter.parseWebhookEvent(body);
                break;
            }
        }

        if (!event) {
            console.warn(`[webhook/${provider}] Webhook validation failed for all gateways`);
            return NextResponse.json({ error: 'Validation failed' }, { status: 401 });
        }

        console.log(`[webhook/${provider}] Event: ${event.eventType} | Charge: ${event.externalChargeId}`);

        // Process the event — update receivable status
        await processWebhookEvent(event);

        return NextResponse.json({ received: true, event: event.eventType });
    } catch (error) {
        console.error(`[webhook/${provider}] Error processing webhook:`, error);
        // Return 200 to prevent PSP from retrying indefinitely
        return NextResponse.json({ received: true, error: 'Processing failed' });
    }
}

/**
 * Process a normalized webhook event by updating the corresponding
 * receivable and creating money flow records.
 */
async function processWebhookEvent(event: NormalizedWebhookEvent) {
    if (!event.externalChargeId && !event.externalReference) {
        console.warn(`[webhook/${event.provider}] No charge ID or reference — skipping`);
        return;
    }

    // Find the receivable by external payment ID or by our reference ID
    let receivableRecord;

    if (event.externalReference) {
        const results = await db
            .select()
            .from(receivables)
            .where(eq(receivables.id, event.externalReference))
            .limit(1);
        receivableRecord = results[0];
    }

    if (!receivableRecord && event.externalChargeId) {
        const results = await db
            .select()
            .from(receivables)
            .where(eq(receivables.externalPaymentId, event.externalChargeId))
            .limit(1);
        receivableRecord = results[0];
    }

    if (!receivableRecord) {
        console.warn(`[webhook/${event.provider}] Receivable not found for charge ${event.externalChargeId}`);
        return;
    }

    // Map webhook event type to receivable status
    const statusMap: Record<string, string> = {
        'payment.confirmed': 'paid',
        'payment.failed': 'cancelled',
        'payment.refunded': 'refunded',
        'payment.overdue': 'overdue',
        'payment.cancelled': 'cancelled',
        'payment.chargeback': 'refunded',
    };

    const newStatus = statusMap[event.eventType];
    if (!newStatus) return;

    // Build update payload
    const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updatedAt: Math.floor(Date.now() / 1000),
    };

    if (event.eventType === 'payment.confirmed') {
        if (event.paidAt) {
            updatePayload.paymentDate = Math.floor(new Date(event.paidAt).getTime() / 1000);
        } else {
            updatePayload.paymentDate = Math.floor(Date.now() / 1000);
        }
        if (event.amountCents) {
            updatePayload.paidAmountCents = event.amountCents;
        }
    }

    await db
        .update(receivables)
        .set(updatePayload)
        .where(eq(receivables.id, receivableRecord.id));

    console.log(`[webhook/${event.provider}] Updated receivable ${receivableRecord.id} → ${newStatus}`);
}
