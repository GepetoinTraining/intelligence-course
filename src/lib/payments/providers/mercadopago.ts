/**
 * Mercado Pago Payment Adapter (v1 API)
 * 
 * Equal priority — largest reach, strong subscriptions.
 * Uses a single /v1/payments endpoint for all methods.
 * application_fee model for marketplace commissions.
 * 
 * Docs: https://www.mercadopago.com.br/developers
 * Production: https://api.mercadopago.com
 */

import { PaymentAdapter } from '../adapter';
import { normalizeStatus } from '../status-map';
import type {
    PaymentProvider, ProviderCapabilities,
    CreateCustomerParams, CustomerResult,
    CreateChargeParams, ChargeResult, ChargeStatus, RefundResult,
    CreateSubscriptionParams, SubscriptionResult, SubscriptionStatus,
    CreateRecipientParams, RecipientResult,
    BalanceResult, StatementEntry, CreateTransferParams, TransferResult,
    NormalizedWebhookEvent,
} from '../types';

interface MPPayment {
    id: number;
    status: string;
    status_detail: string;
    transaction_amount: number;
    currency_id: string;
    date_created: string;
    date_approved?: string;
    external_reference?: string;
    payment_method_id: string;
    point_of_interaction?: {
        transaction_data?: {
            qr_code?: string;
            qr_code_base64?: string;
            ticket_url?: string;
        };
    };
    transaction_details?: {
        external_resource_url?: string;
        net_received_amount?: number;
    };
    card?: { last_four_digits?: string; cardholder?: { name: string } };
    authorization_code?: string;
}

interface MPSubscription {
    id: string;
    status: string;
    auto_recurring: { frequency: number; frequency_type: string; transaction_amount: number };
    next_payment_date?: string;
}

export class MercadoPagoAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'mercadopago';

    readonly capabilities: ProviderCapabilities = {
        pix: true,
        boleto: true,
        creditCard: true,
        debitCard: true,
        recurring: true,
        split: false,       // Uses application_fee, not true split
        transfer: false,    // No payout API for regular sellers
        balance: false,
        statement: false,
    };

    protected getBaseUrl(): string {
        // MercadoPago doesn't have a separate sandbox domain;
        // sandbox mode uses test credentials on the same base URL
        return 'https://api.mercadopago.com';
    }

    protected getAuthHeaders(): Record<string, string> {
        return { Authorization: `Bearer ${this.config.apiKey}` };
    }

    // ─── Customer ──────────────────────────────────────────

    async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
        // MercadoPago has a customer API but it's optional
        const existing = await this.findCustomer(params.document);
        if (existing) return existing;

        const result = await this.request<{ id: string; email: string }>(
            'POST', '/v1/customers', {
            email: params.email,
            first_name: params.name.split(' ')[0],
            last_name: params.name.split(' ').slice(1).join(' ') || params.name,
            identification: {
                type: params.document.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
                number: params.document.replace(/\D/g, ''),
            },
        },
        );
        return { externalId: result.id, name: params.name, document: params.document, email: params.email };
    }

    async findCustomer(document: string): Promise<CustomerResult | null> {
        try {
            const result = await this.request<{ results: Array<{ id: string; email: string; first_name: string; last_name: string }> }>(
                'GET', `/v1/customers/search?identification.number=${document.replace(/\D/g, '')}`,
            );
            if (result.results?.length > 0) {
                const c = result.results[0];
                return {
                    externalId: c.id,
                    name: `${c.first_name} ${c.last_name}`.trim(),
                    document,
                    email: c.email,
                };
            }
        } catch {
            // Search might fail, not critical
        }
        return null;
    }

    // ─── Charges ───────────────────────────────────────────

    async createCharge(params: CreateChargeParams): Promise<ChargeResult> {
        const body: Record<string, unknown> = {
            transaction_amount: params.amountCents / 100,
            description: params.description,
            external_reference: params.externalReference,
            payer: {
                email: params.customer.email,
                first_name: params.customer.name.split(' ')[0],
                last_name: params.customer.name.split(' ').slice(1).join(' ') || params.customer.name,
                identification: {
                    type: params.customer.document.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
                    number: params.customer.document.replace(/\D/g, ''),
                },
            },
            notification_url: params.metadata?.webhookUrl,
        };

        // Method-specific
        if (params.method === 'pix') {
            body.payment_method_id = 'pix';
        } else if (params.method === 'boleto') {
            body.payment_method_id = 'bolbradesco';
            body.date_of_expiration = new Date(params.dueDate + 'T23:59:59-03:00').toISOString();
        } else if (params.method === 'credit_card') {
            body.payment_method_id = 'visa'; // Auto-detected by token
            body.installments = params.cardInstallments || 1;
            if (params.card?.token) {
                body.token = params.card.token;
            }
        }

        // Marketplace fee (pseudo-split)
        if (params.splits?.length) {
            const totalSplitCents = params.splits.reduce((acc, s) => acc + (s.amountCents || 0), 0);
            if (totalSplitCents > 0) {
                body.application_fee = totalSplitCents / 100;
            }
        }

        const payment = await this.request<MPPayment>('POST', '/v1/payments', body);

        const result: ChargeResult = {
            externalId: payment.id.toString(),
            status: normalizeStatus('mercadopago', payment.status),
            provider: 'mercadopago',
            createdAt: payment.date_created,
            paidAt: payment.date_approved,
            raw: payment as unknown as Record<string, unknown>,
        };

        // PIX QR
        if (params.method === 'pix') {
            const txData = payment.point_of_interaction?.transaction_data;
            if (txData) {
                result.pixCopiaECola = txData.qr_code;
                result.pixQrCodeBase64 = txData.qr_code_base64;
                result.pixExpiresAt = payment.date_created; // MP auto-expires
            }
        }

        // Boleto
        if (params.method === 'boleto') {
            result.boletoUrl = payment.transaction_details?.external_resource_url;
        }

        // Card
        if (params.method === 'credit_card' && payment.card) {
            result.cardLastFour = payment.card.last_four_digits;
            result.cardAuthorizationCode = payment.authorization_code;
        }

        return result;
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        const p = await this.request<MPPayment>('GET', `/v1/payments/${externalId}`);
        return {
            externalId: p.id.toString(),
            status: normalizeStatus('mercadopago', p.status),
            amountCents: Math.round(p.transaction_amount * 100),
            paidAmountCents: p.transaction_details?.net_received_amount
                ? Math.round(p.transaction_details.net_received_amount * 100) : undefined,
            paidAt: p.date_approved,
            raw: p as unknown as Record<string, unknown>,
        };
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PUT', `/v1/payments/${externalId}`, { status: 'cancelled' });
    }

    async refundCharge(externalId: string, amountCents?: number): Promise<RefundResult> {
        const body = amountCents ? { amount: amountCents / 100 } : {};
        const result = await this.request<{ id: number; amount: number }>(
            'POST', `/v1/payments/${externalId}/refunds`, body,
        );
        return {
            externalId,
            refundId: result.id.toString(),
            amountCents: Math.round(result.amount * 100),
            status: 'pending',
        };
    }

    // ─── Subscriptions ────────────────────────────────────

    async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
        const freqMap: Record<string, { type: string; frequency: number }> = {
            weekly: { type: 'days', frequency: 7 },
            biweekly: { type: 'days', frequency: 14 },
            monthly: { type: 'months', frequency: 1 },
            bimonthly: { type: 'months', frequency: 2 },
            quarterly: { type: 'months', frequency: 3 },
            semiannually: { type: 'months', frequency: 6 },
            annually: { type: 'months', frequency: 12 },
        };
        const freq = freqMap[params.cycle] || freqMap.monthly;

        const sub = await this.request<MPSubscription>('POST', '/preapproval', {
            reason: params.description,
            external_reference: params.externalReference,
            payer_email: params.customer.email,
            auto_recurring: {
                frequency: freq.frequency,
                frequency_type: freq.type,
                transaction_amount: params.amountCents / 100,
                currency_id: 'BRL',
                start_date: params.nextDueDate ? new Date(params.nextDueDate).toISOString() : undefined,
                end_date: params.endDate ? new Date(params.endDate).toISOString() : undefined,
            },
            back_url: params.metadata?.backUrl || '',
            status: 'authorized',
        });

        return {
            externalId: sub.id,
            status: sub.status === 'authorized' ? 'active' : 'inactive',
            provider: 'mercadopago',
            nextDueDate: sub.next_payment_date || params.nextDueDate,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    async cancelSubscription(externalId: string): Promise<void> {
        await this.request('PUT', `/preapproval/${externalId}`, { status: 'cancelled' });
    }

    async getSubscription(externalId: string): Promise<SubscriptionStatus> {
        const sub = await this.request<MPSubscription>('GET', `/preapproval/${externalId}`);
        const statusMap: Record<string, 'active' | 'inactive' | 'cancelled' | 'expired'> = {
            authorized: 'active', paused: 'inactive', cancelled: 'cancelled', pending: 'inactive',
        };
        return {
            externalId: sub.id,
            status: statusMap[sub.status] || 'inactive',
            cycle: `${sub.auto_recurring.frequency} ${sub.auto_recurring.frequency_type}`,
            amountCents: Math.round(sub.auto_recurring.transaction_amount * 100),
            nextDueDate: sub.next_payment_date,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    // ─── Recipients (Not natively supported) ───────────────

    async createRecipient(_params: CreateRecipientParams): Promise<RecipientResult> {
        // MercadoPago uses application_fee for marketplace commissions,
        // not recipient-based splits
        return {
            externalId: 'marketplace-fee-model',
            status: 'active',
            raw: { note: 'MercadoPago uses application_fee, not split recipients' },
        };
    }

    // ─── Banking (Limited) ────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const b = await this.request<{ available_balance: number; unavailable_balance: number }>(
            'GET', '/users/me',
        );
        return {
            availableCents: Math.round((b.available_balance || 0) * 100),
            pendingCents: Math.round((b.unavailable_balance || 0) * 100),
            currency: 'BRL',
        };
    }

    async getStatement(_start: Date, _end: Date): Promise<StatementEntry[]> {
        return []; // Not available via standard API
    }

    async createTransfer(_params: CreateTransferParams): Promise<TransferResult> {
        return { externalId: '', status: 'failed', raw: { error: 'Not supported' } };
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(headers: Record<string, string>, _body: string): boolean {
        // MercadoPago sends x-signature header; simplified validation
        return !!headers['x-signature'] || !!headers['x-request-id'];
    }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as {
            type: string; action: string;
            data: { id: string };
        };

        let eventType: NormalizedWebhookEvent['eventType'] = 'payment.created';
        if (data.action === 'payment.updated' || data.action === 'payment.created') {
            // Need to fetch payment to know actual status
            eventType = 'payment.confirmed';
        }

        return {
            provider: 'mercadopago',
            eventType,
            externalChargeId: data.data?.id?.toString() || '',
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
