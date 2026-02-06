import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// PAGSEGURO WEBHOOK HANDLER
// ============================================================================
// Endpoint: /api/webhooks/pagseguro
// Documentation: https://dev.pagseguro.uol.com.br/reference/webhook
// ============================================================================

type PagSeguroEventType =
    | 'CHECKOUT.CREATED'
    | 'CHECKOUT.PAID'
    | 'CHECKOUT.DECLINED'
    | 'CHECKOUT.CANCELED'
    | 'CHARGE.CREATED'
    | 'CHARGE.PAID'
    | 'CHARGE.DECLINED'
    | 'CHARGE.CANCELED'
    | 'CHARGE.WAITING'
    | 'CHARGE.IN_ANALYSIS'
    | 'CHARGE.REFUNDED';

interface PagSeguroWebhookPayload {
    id: string;
    reference_id: string;
    created_at: string;
    charges?: Array<{
        id: string;
        reference_id: string;
        status: string;
        amount: {
            value: number;
            currency: string;
        };
        payment_method: {
            type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'PIX';
        };
        paid_at?: string;
    }>;
    qr_codes?: Array<{
        id: string;
        text: string;
        amount: {
            value: number;
        };
    }>;
}

interface PagSeguroNotification {
    notificationCode: string;
    notificationType: 'transaction' | 'preApproval';
}

// Process PagSeguro event
async function processPagSeguroEvent(payload: PagSeguroWebhookPayload) {
    const charges = payload.charges || [];

    for (const charge of charges) {
        switch (charge.status) {
            case 'PAID':
                console.log('✅ PagSeguro: Charge paid', charge.id);
                // await updateInvoiceStatus(payload.reference_id, 'paid', {
                //     paidAt: charge.paid_at,
                //     amount: charge.amount.value / 100, // PagSeguro uses cents
                //     method: charge.payment_method.type.toLowerCase(),
                //     provider: 'pagseguro',
                // });
                break;

            case 'DECLINED':
                console.log('❌ PagSeguro: Charge declined', charge.id);
                // await updateInvoiceStatus(payload.reference_id, 'failed');
                break;

            case 'CANCELED':
                console.log('🗑️ PagSeguro: Charge canceled', charge.id);
                // await updateInvoiceStatus(payload.reference_id, 'cancelled');
                break;

            case 'REFUNDED':
                console.log('💰 PagSeguro: Charge refunded', charge.id);
                // await updateInvoiceStatus(payload.reference_id, 'refunded');
                break;

            case 'WAITING':
            case 'IN_ANALYSIS':
                console.log('⏳ PagSeguro: Charge pending', charge.id, charge.status);
                break;

            default:
                console.log('📨 PagSeguro: Charge status', charge.status);
        }
    }
}

// Process legacy notification format
async function processLegacyNotification(notification: PagSeguroNotification) {
    console.log('📨 PagSeguro Legacy Notification:', notification.notificationCode);

    // In production, you would fetch the transaction details using the notification code
    // const accessToken = process.env.PAGSEGURO_ACCESS_TOKEN;
    // const response = await fetch(
    //     `https://ws.pagseguro.uol.com.br/v3/transactions/notifications/${notification.notificationCode}`,
    //     { headers: { 'Authorization': `Bearer ${accessToken}` } }
    // );
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        // PagSeguro can send both JSON and form-urlencoded
        if (contentType.includes('application/json')) {
            const payload: PagSeguroWebhookPayload = await request.json();

            console.log(`📨 PagSeguro Webhook: ${payload.id}`);

            await processPagSeguroEvent(payload);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Legacy notification format
            const formData = await request.formData();
            const notification: PagSeguroNotification = {
                notificationCode: formData.get('notificationCode') as string,
                notificationType: formData.get('notificationType') as 'transaction' | 'preApproval',
            };

            console.log(`📨 PagSeguro Legacy: ${notification.notificationType}`);

            await processLegacyNotification(notification);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('❌ PagSeguro webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        provider: 'pagseguro',
        message: 'PagSeguro webhook endpoint is active',
    });
}

