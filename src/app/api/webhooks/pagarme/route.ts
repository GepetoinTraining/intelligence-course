import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================================
// PAGAR.ME WEBHOOK HANDLER
// ============================================================================
// Endpoint: /api/webhooks/pagarme
// Documentation: https://docs.pagar.me/docs/webhooks
// ============================================================================

type PagarmeEventType =
    | 'transaction.status_changed'
    | 'transaction.created'
    | 'transaction.updated'
    | 'transaction.paid'
    | 'transaction.refused'
    | 'transaction.refunded'
    | 'transaction.chargeback'
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.canceled';

type PagarmeTransactionStatus =
    | 'processing'
    | 'authorized'
    | 'paid'
    | 'refunded'
    | 'waiting_payment'
    | 'pending_refund'
    | 'refused'
    | 'chargedback'
    | 'analyzing'
    | 'pending_review';

interface PagarmeWebhookPayload {
    id: string;
    event: PagarmeEventType;
    old_status?: PagarmeTransactionStatus;
    current_status?: PagarmeTransactionStatus;
    desired_status?: PagarmeTransactionStatus;
    object: 'transaction' | 'subscription';
    transaction?: {
        id: number;
        status: PagarmeTransactionStatus;
        amount: number;
        paid_amount: number;
        refunded_amount: number;
        cost: number;
        payment_method: 'credit_card' | 'boleto' | 'pix';
        metadata?: Record<string, string>;
        customer: {
            id: number;
            name: string;
            email: string;
        };
        date_created: string;
        date_updated: string;
    };
    subscription?: {
        id: number;
        status: string;
        plan: {
            id: number;
            name: string;
            amount: number;
        };
    };
}

// Verify Pagar.me webhook signature
function verifyPagarmeSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    if (!signature || !secret) return false;

    try {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(`sha256=${expectedSignature}`)
        );
    } catch {
        return false;
    }
}

async function processPagarmeEvent(payload: PagarmeWebhookPayload) {
    const { event, transaction, subscription } = payload;

    if (transaction) {
        switch (payload.current_status || transaction.status) {
            case 'paid':
                console.log('✅ Pagar.me: Transaction paid', transaction.id);
                // await updateInvoiceStatus(transaction.metadata?.invoiceId, 'paid', {
                //     paidAt: transaction.date_updated,
                //     amount: transaction.paid_amount / 100,
                //     fee: transaction.cost / 100,
                //     method: transaction.payment_method,
                //     provider: 'pagarme',
                // });
                break;

            case 'refused':
                console.log('❌ Pagar.me: Transaction refused', transaction.id);
                // await updateInvoiceStatus(transaction.metadata?.invoiceId, 'failed');
                break;

            case 'refunded':
                console.log('💰 Pagar.me: Transaction refunded', transaction.id);
                // await updateInvoiceStatus(transaction.metadata?.invoiceId, 'refunded');
                break;

            case 'chargedback':
                console.log('🚨 Pagar.me: Chargeback', transaction.id);
                // await notifyAdminOfChargeback(transaction);
                break;

            case 'waiting_payment':
                console.log('⏳ Pagar.me: Waiting payment (boleto/pix)', transaction.id);
                break;

            case 'processing':
            case 'authorized':
            case 'analyzing':
            case 'pending_review':
                console.log('⏳ Pagar.me: Processing', transaction.id, transaction.status);
                break;

            default:
                console.log('📨 Pagar.me: Transaction status', transaction.status);
        }
    }

    if (subscription) {
        switch (event) {
            case 'subscription.created':
                console.log('✨ Pagar.me: Subscription created', subscription.id);
                break;

            case 'subscription.canceled':
                console.log('🗑️ Pagar.me: Subscription canceled', subscription.id);
                break;

            case 'subscription.updated':
                console.log('📝 Pagar.me: Subscription updated', subscription.id);
                break;

            default:
                console.log('📨 Pagar.me: Subscription event', event);
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('x-hub-signature') || '';
        const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET || '';

        // Verify signature in production
        // if (webhookSecret && !verifyPagarmeSignature(payload, signature, webhookSecret)) {
        //     console.error('❌ Pagar.me webhook signature verification failed');
        //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        // }

        const event: PagarmeWebhookPayload = JSON.parse(payload);

        console.log(`📨 Pagar.me Webhook: ${event.event} (${event.id})`);

        await processPagarmeEvent(event);

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('❌ Pagar.me webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        provider: 'pagarme',
        message: 'Pagar.me webhook endpoint is active',
    });
}


