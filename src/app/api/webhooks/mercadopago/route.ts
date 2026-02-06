import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// MERCADO PAGO WEBHOOK HANDLER (IPN)
// ============================================================================
// Endpoint: /api/webhooks/mercadopago
// Documentation: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
// ============================================================================

type MercadoPagoAction =
    | 'payment.created'
    | 'payment.updated'
    | 'plan.created'
    | 'subscription_preapproval.created'
    | 'subscription_preapproval.updated'
    | 'subscription_preapproval_plan.created'
    | 'subscription_preapproval_plan.updated'
    | 'point_integration_wh'
    | 'topic_chargebacks_wh'
    | 'topic_merchant_order_wh';

interface MercadoPagoWebhookPayload {
    action: MercadoPagoAction;
    api_version: string;
    data: {
        id: string;
    };
    date_created: string;
    id: number;
    live_mode: boolean;
    type: string;
    user_id: string;
}

interface MercadoPagoPayment {
    id: number;
    status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
    status_detail: string;
    transaction_amount: number;
    net_received_amount: number;
    currency_id: string;
    payment_method_id: string;
    payment_type_id: 'credit_card' | 'debit_card' | 'ticket' | 'bank_transfer' | 'account_money';
    external_reference?: string;
    payer: {
        email: string;
        first_name?: string;
        last_name?: string;
    };
    date_approved?: string;
    point_of_interaction?: {
        transaction_data?: {
            qr_code?: string;
            qr_code_base64?: string;
        };
    };
}

// Fetch payment details from Mercado Pago API
async function getPaymentDetails(paymentId: string): Promise<MercadoPagoPayment | null> {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
        console.error('❌ Mercado Pago access token not configured');
        return null;
    }

    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            console.error('❌ Failed to fetch payment details:', response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Error fetching payment details:', error);
        return null;
    }
}

async function processMercadoPagoEvent(payload: MercadoPagoWebhookPayload) {
    const { action, data } = payload;

    if (action === 'payment.created' || action === 'payment.updated') {
        const payment = await getPaymentDetails(data.id);

        if (!payment) {
            console.log('⚠️ Could not fetch payment details for', data.id);
            return;
        }

        switch (payment.status) {
            case 'approved':
                console.log('✅ Mercado Pago: Payment approved', payment.id);
                // await updateInvoiceStatus(payment.external_reference, 'paid', {
                //     paidAt: payment.date_approved,
                //     netAmount: payment.net_received_amount,
                //     method: payment.payment_type_id,
                //     provider: 'mercado_pago',
                // });
                break;

            case 'pending':
            case 'in_process':
                console.log('⏳ Mercado Pago: Payment pending', payment.id);
                break;

            case 'rejected':
                console.log('❌ Mercado Pago: Payment rejected', payment.id, payment.status_detail);
                // await updateInvoiceStatus(payment.external_reference, 'failed');
                break;

            case 'refunded':
                console.log('💰 Mercado Pago: Payment refunded', payment.id);
                // await updateInvoiceStatus(payment.external_reference, 'refunded');
                break;

            case 'charged_back':
                console.log('🚨 Mercado Pago: Chargeback', payment.id);
                // await notifyAdminOfChargeback(payment);
                break;

            case 'cancelled':
                console.log('🗑️ Mercado Pago: Payment cancelled', payment.id);
                break;

            default:
                console.log('📨 Mercado Pago: Payment status', payment.status);
        }
    } else {
        console.log('📨 Mercado Pago: Unhandled action', action);
    }
}

export async function POST(request: NextRequest) {
    try {
        // Mercado Pago sends webhook with query params for verification
        const searchParams = request.nextUrl.searchParams;
        const query_id = searchParams.get('id');
        const query_topic = searchParams.get('topic');

        const payload: MercadoPagoWebhookPayload = await request.json();

        console.log(`📨 Mercado Pago Webhook: ${payload.action || query_topic} (${payload.data?.id || query_id})`);
        console.log('Live mode:', payload.live_mode);

        await processMercadoPagoEvent(payload);

        // Mercado Pago expects a 200 response
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('❌ Mercado Pago webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        provider: 'mercado_pago',
        message: 'Mercado Pago webhook endpoint is active',
    });
}

