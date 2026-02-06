import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// STRIPE WEBHOOK HANDLER
// ============================================================================
// Endpoint: /api/webhooks/stripe
// Documentation: https://stripe.com/docs/webhooks
// ============================================================================

// Stripe event types we handle
type StripeEventType =
    | 'payment_intent.succeeded'
    | 'payment_intent.payment_failed'
    | 'charge.refunded'
    | 'charge.dispute.created'
    | 'customer.subscription.created'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted'
    | 'invoice.paid'
    | 'invoice.payment_failed';

interface StripeWebhookEvent {
    id: string;
    type: StripeEventType;
    created: number;
    data: {
        object: {
            id: string;
            amount?: number;
            currency?: string;
            customer?: string;
            metadata?: Record<string, string>;
            status?: string;
        };
    };
}

// Verify Stripe webhook signature
async function verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    // In production, use stripe.webhooks.constructEvent()
    // For now, we'll do a basic check
    if (!signature || !secret) return false;

    // TODO: Implement proper HMAC verification
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //     .createHmac('sha256', secret)
    //     .update(payload)
    //     .digest('hex');

    return true; // Placeholder - implement proper verification
}

// Process Stripe events
async function processStripeEvent(event: StripeWebhookEvent) {
    const { type, data } = event;

    switch (type) {
        case 'payment_intent.succeeded':
            // Update invoice status to paid
            console.log('💳 Stripe: Payment succeeded', data.object.id);
            // await updateInvoiceStatus(data.object.metadata?.invoiceId, 'paid');
            // await sendPaymentConfirmation(data.object.metadata?.studentId);
            break;

        case 'payment_intent.payment_failed':
            console.log('❌ Stripe: Payment failed', data.object.id);
            // await updateInvoiceStatus(data.object.metadata?.invoiceId, 'failed');
            // await sendPaymentFailureNotification(data.object.metadata?.studentId);
            break;

        case 'charge.refunded':
            console.log('💰 Stripe: Refund processed', data.object.id);
            // await updateInvoiceStatus(data.object.metadata?.invoiceId, 'refunded');
            break;

        case 'charge.dispute.created':
            console.log('⚠️ Stripe: Dispute created', data.object.id);
            // await notifyAdminOfDispute(data.object);
            break;

        case 'invoice.paid':
            console.log('📄 Stripe: Invoice paid', data.object.id);
            break;

        case 'invoice.payment_failed':
            console.log('❌ Stripe: Invoice payment failed', data.object.id);
            break;

        default:
            console.log('📨 Stripe: Unhandled event type', type);
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('stripe-signature') || '';
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

        // Verify signature
        const isValid = await verifyStripeSignature(payload, signature, webhookSecret);
        if (!isValid) {
            console.error('❌ Stripe webhook signature verification failed');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const event: StripeWebhookEvent = JSON.parse(payload);

        // Log event
        console.log(`📨 Stripe Webhook: ${event.type} (${event.id})`);

        // Process event
        await processStripeEvent(event);

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('❌ Stripe webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

// Handle GET for webhook verification
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        provider: 'stripe',
        message: 'Stripe webhook endpoint is active',
    });
}

