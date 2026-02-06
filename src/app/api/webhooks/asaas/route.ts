import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// ASAAS WEBHOOK HANDLER
// ============================================================================
// Endpoint: /api/webhooks/asaas
// Documentation: https://docs.asaas.com/docs/webhook
// ============================================================================

type AsaasEventType =
    | 'PAYMENT_CREATED'
    | 'PAYMENT_AWAITING_RISK_ANALYSIS'
    | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
    | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
    | 'PAYMENT_UPDATED'
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_ANTICIPATED'
    | 'PAYMENT_OVERDUE'
    | 'PAYMENT_DELETED'
    | 'PAYMENT_RESTORED'
    | 'PAYMENT_REFUNDED'
    | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
    | 'PAYMENT_CHARGEBACK_REQUESTED'
    | 'PAYMENT_CHARGEBACK_DISPUTE'
    | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
    | 'PAYMENT_DUNNING_RECEIVED'
    | 'PAYMENT_DUNNING_REQUESTED';

interface AsaasWebhookEvent {
    event: AsaasEventType;
    payment: {
        id: string;
        customer: string;
        value: number;
        netValue: number;
        billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
        status: string;
        dueDate: string;
        paymentDate?: string;
        invoiceUrl?: string;
        bankSlipUrl?: string;
        pixQrCodeId?: string;
        externalReference?: string;
    };
}

// Verify Asaas webhook (they use access token in header)
function verifyAsaasWebhook(accessToken: string): boolean {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    return accessToken === expectedToken;
}

async function processAsaasEvent(event: AsaasWebhookEvent) {
    const { event: eventType, payment } = event;

    switch (eventType) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
            console.log('✅ Asaas: Payment confirmed', payment.id);
            // await updateInvoiceStatus(payment.externalReference, 'paid', {
            //     paidAt: payment.paymentDate,
            //     netAmount: payment.netValue,
            //     method: payment.billingType.toLowerCase(),
            // });
            break;

        case 'PAYMENT_OVERDUE':
            console.log('⚠️ Asaas: Payment overdue', payment.id);
            // await updateInvoiceStatus(payment.externalReference, 'overdue');
            // await sendOverdueNotification(payment.externalReference);
            break;

        case 'PAYMENT_REFUNDED':
            console.log('💰 Asaas: Payment refunded', payment.id);
            // await updateInvoiceStatus(payment.externalReference, 'refunded');
            break;

        case 'PAYMENT_CHARGEBACK_REQUESTED':
            console.log('🚨 Asaas: Chargeback requested', payment.id);
            // await notifyAdminOfChargeback(payment);
            break;

        case 'PAYMENT_CREATED':
            console.log('📝 Asaas: Payment created', payment.id);
            break;

        case 'PAYMENT_DELETED':
            console.log('🗑️ Asaas: Payment deleted', payment.id);
            break;

        default:
            console.log('📨 Asaas: Event received', eventType);
    }
}

export async function POST(request: NextRequest) {
    try {
        const accessToken = request.headers.get('asaas-access-token') || '';

        // Optional: Verify webhook token
        // In production, configure a webhook auth token in Asaas dashboard
        // if (!verifyAsaasWebhook(accessToken)) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const event: AsaasWebhookEvent = await request.json();

        console.log(`📨 Asaas Webhook: ${event.event} (${event.payment.id})`);

        await processAsaasEvent(event);

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('❌ Asaas webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        provider: 'asaas',
        message: 'Asaas webhook endpoint is active',
    });
}

