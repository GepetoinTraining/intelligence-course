/**
 * Payment Providers Library
 * 
 * Unified interface for multiple Brazilian payment gateways:
 * - Stripe (international + Brazil)
 * - Asaas (popular for SMBs)
 * - Mercado Pago (largest in LATAM)
 * - PagSeguro (traditional Brazilian)
 * - Pagar.me (developer-friendly by Stone)
 */

// ============================================================================
// TYPES
// ============================================================================

export type PaymentProvider = 'stripe' | 'asaas' | 'mercado_pago' | 'pagseguro' | 'pagarme';
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'debit_card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'chargeback';

export interface CreatePaymentRequest {
    provider: PaymentProvider;
    method: PaymentMethod;
    amount: number; // in BRL cents
    currency?: string;
    customer: {
        name: string;
        email: string;
        cpf?: string;
        phone?: string;
    };
    description: string;
    externalReference?: string; // Your internal invoice ID
    dueDate?: string; // For boleto
    installments?: number; // For credit card
    metadata?: Record<string, string>;
}

export interface CreatePaymentResponse {
    success: boolean;
    paymentId: string;
    status: PaymentStatus;
    provider: PaymentProvider;
    method: PaymentMethod;

    // PIX
    pixCode?: string;
    pixQrCodeUrl?: string;
    pixExpiresAt?: string;

    // Boleto
    boletoCode?: string;
    boletoUrl?: string;
    boletoPdfUrl?: string;

    // Credit Card
    cardLastDigits?: string;
    cardBrand?: string;

    // URLs
    checkoutUrl?: string;

    // Error
    error?: string;
}

export interface RefundRequest {
    provider: PaymentProvider;
    paymentId: string;
    amount?: number; // Partial refund, omit for full
    reason?: string;
}

export interface ProviderConfig {
    stripe?: {
        secretKey: string;
        publishableKey: string;
        webhookSecret: string;
    };
    asaas?: {
        accessToken: string;
        sandbox: boolean;
    };
    mercadoPago?: {
        accessToken: string;
        publicKey: string;
    };
    pagseguro?: {
        accessToken: string;
        sandbox: boolean;
    };
    pagarme?: {
        secretKey: string;
        publicKey: string;
    };
}

// ============================================================================
// PROVIDER FEE STRUCTURE (2026)
// ============================================================================

export const PROVIDER_FEES: Record<PaymentProvider, Record<PaymentMethod, number>> = {
    stripe: {
        pix: 0.4,
        credit_card: 3.99,
        boleto: 0, // Not directly supported
        debit_card: 2.5,
    },
    asaas: {
        pix: 1.99,
        credit_card: 3.49,
        boleto: 2.99,
        debit_card: 0,
    },
    mercado_pago: {
        pix: 0.99,
        credit_card: 4.99,
        boleto: 3.49,
        debit_card: 2.99,
    },
    pagseguro: {
        pix: 0.99,
        credit_card: 4.79,
        boleto: 2.99,
        debit_card: 0,
    },
    pagarme: {
        pix: 0.99,
        credit_card: 2.99,
        boleto: 3.49,
        debit_card: 0,
    },
};

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

export async function createStripePayment(
    request: CreatePaymentRequest,
    config: ProviderConfig['stripe']
): Promise<CreatePaymentResponse> {
    if (!config) {
        return { success: false, error: 'Stripe not configured', paymentId: '', status: 'failed', provider: 'stripe', method: request.method };
    }

    // In production, use stripe SDK:
    // const stripe = require('stripe')(config.secretKey);
    // const paymentIntent = await stripe.paymentIntents.create({...});

    // Mock response
    return {
        success: true,
        paymentId: `pi_${Date.now()}`,
        status: 'pending',
        provider: 'stripe',
        method: request.method,
        checkoutUrl: 'https://checkout.stripe.com/...',
    };
}

// ============================================================================
// ASAAS INTEGRATION
// ============================================================================

export async function createAsaasPayment(
    request: CreatePaymentRequest,
    config: ProviderConfig['asaas']
): Promise<CreatePaymentResponse> {
    if (!config) {
        return { success: false, error: 'Asaas not configured', paymentId: '', status: 'failed', provider: 'asaas', method: request.method };
    }

    const baseUrl = config.sandbox
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://www.asaas.com/api/v3';

    // Map payment method to Asaas billing type
    const billingTypeMap: Record<PaymentMethod, string> = {
        pix: 'PIX',
        credit_card: 'CREDIT_CARD',
        boleto: 'BOLETO',
        debit_card: 'DEBIT_CARD',
    };

    try {
        // 1. Create or get customer
        // const customerResponse = await fetch(`${baseUrl}/customers`, {...});

        // 2. Create payment
        // const paymentResponse = await fetch(`${baseUrl}/payments`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'access_token': config.accessToken,
        //     },
        //     body: JSON.stringify({
        //         customer: customerId,
        //         billingType: billingTypeMap[request.method],
        //         value: request.amount / 100,
        //         dueDate: request.dueDate,
        //         description: request.description,
        //         externalReference: request.externalReference,
        //     }),
        // });

        // Mock response
        const paymentId = `pay_${Date.now()}`;

        const response: CreatePaymentResponse = {
            success: true,
            paymentId,
            status: 'pending',
            provider: 'asaas',
            method: request.method,
        };

        if (request.method === 'pix') {
            response.pixCode = '00020126580014br.gov.bcb.pix0136...';
            response.pixQrCodeUrl = `https://www.asaas.com/api/v3/payments/${paymentId}/pixQrCode`;
        } else if (request.method === 'boleto') {
            response.boletoCode = '23793.38128 60000.000003 00000.000400 1 84340000033500';
            response.boletoUrl = `https://www.asaas.com/b/pdf/${paymentId}`;
        }

        return response;
    } catch (error) {
        return {
            success: false,
            paymentId: '',
            status: 'failed',
            provider: 'asaas',
            method: request.method,
            error: String(error),
        };
    }
}

// ============================================================================
// MERCADO PAGO INTEGRATION
// ============================================================================

export async function createMercadoPagoPayment(
    request: CreatePaymentRequest,
    config: ProviderConfig['mercadoPago']
): Promise<CreatePaymentResponse> {
    if (!config) {
        return { success: false, error: 'Mercado Pago not configured', paymentId: '', status: 'failed', provider: 'mercado_pago', method: request.method };
    }

    // In production:
    // const preference = await mercadopago.preferences.create({
    //     items: [{ title: request.description, unit_price: request.amount / 100, quantity: 1 }],
    //     payer: { email: request.customer.email },
    //     external_reference: request.externalReference,
    // });

    // Mock response
    return {
        success: true,
        paymentId: `pref_${Date.now()}`,
        status: 'pending',
        provider: 'mercado_pago',
        method: request.method,
        checkoutUrl: 'https://www.mercadopago.com.br/checkout/v1/redirect?...',
        pixCode: request.method === 'pix' ? '00020126580014br.gov.bcb.pix...' : undefined,
    };
}

// ============================================================================
// PAGSEGURO INTEGRATION
// ============================================================================

export async function createPagSeguroPayment(
    request: CreatePaymentRequest,
    config: ProviderConfig['pagseguro']
): Promise<CreatePaymentResponse> {
    if (!config) {
        return { success: false, error: 'PagSeguro not configured', paymentId: '', status: 'failed', provider: 'pagseguro', method: request.method };
    }

    const baseUrl = config.sandbox
        ? 'https://sandbox.api.pagseguro.com'
        : 'https://api.pagseguro.com';

    // Mock response
    return {
        success: true,
        paymentId: `ORDE_${Date.now()}`,
        status: 'pending',
        provider: 'pagseguro',
        method: request.method,
        checkoutUrl: 'https://pagseguro.uol.com.br/checkout/...',
    };
}

// ============================================================================
// PAGAR.ME INTEGRATION
// ============================================================================

export async function createPagarmePayment(
    request: CreatePaymentRequest,
    config: ProviderConfig['pagarme']
): Promise<CreatePaymentResponse> {
    if (!config) {
        return { success: false, error: 'Pagar.me not configured', paymentId: '', status: 'failed', provider: 'pagarme', method: request.method };
    }

    // In production:
    // const pagarme = require('pagarme');
    // const client = await pagarme.client.connect({ api_key: config.secretKey });
    // const transaction = await client.transactions.create({...});

    // Mock response
    return {
        success: true,
        paymentId: `trx_${Date.now()}`,
        status: 'pending',
        provider: 'pagarme',
        method: request.method,
    };
}

// ============================================================================
// UNIFIED PAYMENT INTERFACE
// ============================================================================

export async function createPayment(
    request: CreatePaymentRequest,
    config: ProviderConfig
): Promise<CreatePaymentResponse> {
    switch (request.provider) {
        case 'stripe':
            return createStripePayment(request, config.stripe);
        case 'asaas':
            return createAsaasPayment(request, config.asaas);
        case 'mercado_pago':
            return createMercadoPagoPayment(request, config.mercadoPago);
        case 'pagseguro':
            return createPagSeguroPayment(request, config.pagseguro);
        case 'pagarme':
            return createPagarmePayment(request, config.pagarme);
        default:
            return {
                success: false,
                paymentId: '',
                status: 'failed',
                provider: request.provider,
                method: request.method,
                error: 'Unknown provider',
            };
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate fee for a payment
 */
export function calculateFee(
    provider: PaymentProvider,
    method: PaymentMethod,
    amount: number
): { fee: number; netAmount: number } {
    const feePercent = PROVIDER_FEES[provider]?.[method] || 0;
    const fee = Math.round(amount * (feePercent / 100));
    return {
        fee,
        netAmount: amount - fee,
    };
}

/**
 * Get best provider for a payment method based on fees
 */
export function getBestProviderForMethod(
    method: PaymentMethod,
    enabledProviders: PaymentProvider[]
): PaymentProvider | null {
    let bestProvider: PaymentProvider | null = null;
    let lowestFee = Infinity;

    for (const provider of enabledProviders) {
        const fee = PROVIDER_FEES[provider]?.[method];
        if (fee !== undefined && fee < lowestFee) {
            lowestFee = fee;
            bestProvider = provider;
        }
    }

    return bestProvider;
}

/**
 * Generate PIX EMV code (simplified)
 */
export function generatePixCode(
    merchantKey: string,
    amount: number,
    merchantName: string,
    merchantCity: string,
    txId?: string
): string {
    // This is a simplified version
    // In production, use a proper EMV library
    const parts = [
        '000201', // Payload Format Indicator
        '010212', // Point of Initiation Method (12 = dynamic)
        `26${String(merchantKey.length + 22).padStart(2, '0')}0014br.gov.bcb.pix01${String(merchantKey.length).padStart(2, '0')}${merchantKey}`,
        '52040000', // Merchant Category Code
        '5303986', // Transaction Currency (986 = BRL)
        `54${String(amount.toFixed(2).length).padStart(2, '0')}${amount.toFixed(2)}`,
        `59${String(merchantName.length).padStart(2, '0')}${merchantName}`,
        `60${String(merchantCity.length).padStart(2, '0')}${merchantCity}`,
        txId ? `62${String(txId.length + 4).padStart(2, '0')}05${String(txId.length).padStart(2, '0')}${txId}` : '',
        '6304', // CRC placeholder
    ];

    const payloadWithoutCRC = parts.join('');
    // In production, calculate actual CRC16-CCITT
    const crc = 'ABCD'; // Placeholder

    return payloadWithoutCRC + crc;
}

/**
 * Validate Brazilian CPF
 */
export function validateCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned[10])) return false;

    return true;
}

/**
 * Format amount to BRL
 */
export function formatBRL(amountInCents: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amountInCents / 100);
}

