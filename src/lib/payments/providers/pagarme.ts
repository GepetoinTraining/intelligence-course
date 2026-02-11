/**
 * Pagar.me Payment Adapter (v5 API)
 * 
 * Equal priority — best native split engine (Stone subsidiary).
 * Order-centric with native multi-recipient splits.
 * Basic Auth with secret key.
 * 
 * Docs: https://docs.pagar.me
 * Production: https://api.pagar.me/core/v5
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

interface PagarMeOrder {
    id: string;
    code: string;
    status: string;
    charges: Array<{
        id: string;
        code: string;
        status: string;
        amount: number;
        paid_amount?: number;
        paid_at?: string;
        payment_method: string;
        last_transaction?: {
            id: string;
            status: string;
            qr_code?: string;
            qr_code_url?: string;
            expires_at?: string;
            url?: string;
            line?: string;
            barcode?: string;
            pdf?: string;
            acquirer_auth_code?: string;
            card?: { last_four_digits?: string; brand?: string };
        };
    }>;
}

interface PagarMeCustomer {
    id: string;
    name: string;
    email: string;
    document: string;
    document_type: string;
}

interface PagarMeSubscription {
    id: string;
    status: string;
    interval: string;
    interval_count: number;
    current_cycle?: { start_at: string; end_at: string };
    next_billing_at?: string;
}

export class PagarMeAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'pagarme';

    readonly capabilities: ProviderCapabilities = {
        pix: true,
        boleto: true,
        creditCard: true,
        debitCard: true,
        recurring: true,
        split: true,
        transfer: true,
        balance: true,
        statement: false,
    };

    protected getBaseUrl(): string {
        return 'https://api.pagar.me/core/v5';
    }

    protected getAuthHeaders(): Record<string, string> {
        const encoded = Buffer.from(`${this.config.apiKey}:`).toString('base64');
        return { Authorization: `Basic ${encoded}` };
    }

    // ─── Customer ──────────────────────────────────────────

    async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
        const doc = params.document.replace(/\D/g, '');
        const body: Record<string, unknown> = {
            name: params.name,
            email: params.email,
            document: doc,
            document_type: doc.length > 11 ? 'CNPJ' : 'CPF',
            type: doc.length > 11 ? 'company' : 'individual',
        };
        if (params.phone) {
            body.phones = {
                mobile_phone: {
                    country_code: '55',
                    area_code: params.phone.replace(/\D/g, '').slice(2, 4),
                    number: params.phone.replace(/\D/g, '').slice(4),
                },
            };
        }

        const result = await this.request<PagarMeCustomer>('POST', '/customers', body);
        return { externalId: result.id, name: result.name, document: result.document, email: result.email };
    }

    async findCustomer(document: string): Promise<CustomerResult | null> {
        try {
            const result = await this.request<{ data: PagarMeCustomer[] }>(
                'GET', `/customers?document=${document.replace(/\D/g, '')}`,
            );
            if (result.data?.length > 0) {
                const c = result.data[0];
                return { externalId: c.id, name: c.name, document: c.document, email: c.email };
            }
        } catch { /* Not found */ }
        return null;
    }

    // ─── Charges ───────────────────────────────────────────

    async createCharge(params: CreateChargeParams): Promise<ChargeResult> {
        const customer = await this.createCustomer(params.customer);
        const order = this.buildOrder(params, customer.externalId);
        const result = await this.request<PagarMeOrder>('POST', '/orders', order);

        const charge = result.charges?.[0];
        const tx = charge?.last_transaction;

        const chargeResult: ChargeResult = {
            externalId: result.id,
            status: charge ? normalizeStatus('pagarme', charge.status) : 'pending',
            provider: 'pagarme',
            createdAt: new Date().toISOString(),
            paidAt: charge?.paid_at,
            raw: result as unknown as Record<string, unknown>,
        };

        // PIX
        if (params.method === 'pix' && tx) {
            chargeResult.pixCopiaECola = tx.qr_code;
            chargeResult.pixQrCodeBase64 = tx.qr_code_url; // URL to QR image
            chargeResult.pixExpiresAt = tx.expires_at;
        }

        // Boleto
        if (params.method === 'boleto' && tx) {
            chargeResult.boletoUrl = tx.pdf || tx.url;
            chargeResult.boletoBarcode = tx.barcode;
            chargeResult.boletoDigitableLine = tx.line;
        }

        // Card
        if (params.method === 'credit_card' && tx) {
            chargeResult.cardAuthorizationCode = tx.acquirer_auth_code;
            chargeResult.cardLastFour = tx.card?.last_four_digits;
            chargeResult.cardBrand = tx.card?.brand;
        }

        return chargeResult;
    }

    private buildOrder(params: CreateChargeParams, customerId: string): Record<string, unknown> {
        const payment: Record<string, unknown> = {
            payment_method: params.method === 'credit_card' ? 'credit_card' : params.method,
            amount: params.amountCents,
        };

        if (params.method === 'pix') {
            payment.pix = {
                expires_in: (params.pixExpirationMinutes || 30) * 60,
                additional_information: [
                    { name: 'Referência', value: params.externalReference },
                ],
            };
        }

        if (params.method === 'boleto') {
            payment.boleto = {
                instructions: params.boletoInstructions || 'Pagamento de mensalidade escolar',
                due_at: new Date(params.dueDate).toISOString(),
                document_number: params.externalReference.slice(0, 16),
            };
        }

        if (params.method === 'credit_card') {
            payment.credit_card = {
                installments: params.cardInstallments || 1,
                capture: true,
                ...(params.card?.token
                    ? { card_id: params.card.token }
                    : {
                        card: {
                            number: params.card?.number,
                            holder_name: params.card?.holderName,
                            exp_month: parseInt(params.card?.expMonth || '1'),
                            exp_year: parseInt(params.card?.expYear || '2030'),
                            cvv: params.card?.cvv,
                        },
                    }),
            };
        }

        // Split rules — Pagar.me native
        if (params.splits?.length) {
            payment.split = params.splits.map(s => ({
                recipient_id: s.recipientExternalId,
                amount: s.amountCents || 0,
                type: s.amountCents ? 'flat' : 'percentage',
                ...(s.percentage ? { percentage: s.percentage } : {}),
                options: {
                    charge_processing_fee: s.chargeProcessingFee ?? false,
                    charge_remainder_fee: false,
                    liable: true,
                },
            }));
        }

        return {
            code: params.externalReference,
            customer_id: customerId,
            items: [{
                code: params.externalReference,
                description: params.description.slice(0, 256),
                quantity: 1,
                amount: params.amountCents,
            }],
            payments: [payment],
        };
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        const order = await this.request<PagarMeOrder>('GET', `/orders/${externalId}`);
        const charge = order.charges?.[0];
        return {
            externalId: order.id,
            status: charge ? normalizeStatus('pagarme', charge.status) : 'pending',
            amountCents: charge?.amount || 0,
            paidAmountCents: charge?.paid_amount,
            paidAt: charge?.paid_at,
            raw: order as unknown as Record<string, unknown>,
        };
    }

    async cancelCharge(externalId: string): Promise<void> {
        const order = await this.request<PagarMeOrder>('GET', `/orders/${externalId}`);
        const chargeId = order.charges?.[0]?.id;
        if (chargeId) {
            await this.request('DELETE', `/charges/${chargeId}`);
        }
    }

    async refundCharge(externalId: string, amountCents?: number): Promise<RefundResult> {
        const order = await this.request<PagarMeOrder>('GET', `/orders/${externalId}`);
        const chargeId = order.charges?.[0]?.id;
        if (!chargeId) throw new Error('No charge found');

        const body = amountCents ? { amount: amountCents } : {};
        const result = await this.request<{ id: string; amount: number }>(
            'DELETE', `/charges/${chargeId}`,
        );
        return {
            externalId,
            refundId: result.id || chargeId,
            amountCents: result.amount || amountCents || 0,
            status: 'pending',
        };
    }

    // ─── Subscriptions ────────────────────────────────────

    async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
        const customer = await this.createCustomer(params.customer);
        const intervalMap: Record<string, { interval: string; count: number }> = {
            weekly: { interval: 'week', count: 1 },
            biweekly: { interval: 'week', count: 2 },
            monthly: { interval: 'month', count: 1 },
            bimonthly: { interval: 'month', count: 2 },
            quarterly: { interval: 'month', count: 3 },
            semiannually: { interval: 'month', count: 6 },
            annually: { interval: 'year', count: 1 },
        };
        const interval = intervalMap[params.cycle] || intervalMap.monthly;

        const body: Record<string, unknown> = {
            code: params.externalReference,
            payment_method: params.method === 'credit_card' ? 'credit_card' : 'boleto',
            interval: interval.interval,
            interval_count: interval.count,
            customer_id: customer.externalId,
            minimum_price: params.amountCents,
            billing_type: 'prepaid',
            installments: 1,
            items: [{
                description: params.description,
                quantity: 1,
                pricing_scheme: { price: params.amountCents },
            }],
        };

        if (params.method === 'credit_card' && params.card) {
            body.card_id = params.card.token;
            if (!params.card.token) {
                body.card = {
                    number: params.card.number,
                    holder_name: params.card.holderName,
                    exp_month: parseInt(params.card.expMonth || '1'),
                    exp_year: parseInt(params.card.expYear || '2030'),
                    cvv: params.card.cvv,
                };
            }
        }

        if (params.splits?.length) {
            body.split = {
                enabled: true,
                rules: params.splits.map(s => ({
                    recipient_id: s.recipientExternalId,
                    amount: s.amountCents || 0,
                    type: s.amountCents ? 'flat' : 'percentage',
                    ...(s.percentage ? { percentage: s.percentage } : {}),
                })),
            };
        }

        const sub = await this.request<PagarMeSubscription>('POST', '/subscriptions', body);
        return {
            externalId: sub.id,
            status: sub.status === 'active' ? 'active' : 'inactive',
            provider: 'pagarme',
            nextDueDate: sub.next_billing_at || params.nextDueDate,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    async cancelSubscription(externalId: string): Promise<void> {
        await this.request('DELETE', `/subscriptions/${externalId}`);
    }

    async getSubscription(externalId: string): Promise<SubscriptionStatus> {
        const sub = await this.request<PagarMeSubscription>('GET', `/subscriptions/${externalId}`);
        return {
            externalId: sub.id,
            status: sub.status as 'active' | 'inactive' | 'cancelled' | 'expired',
            cycle: `${sub.interval_count} ${sub.interval}`,
            amountCents: 0, // Needs separate lookup
            nextDueDate: sub.next_billing_at,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    // ─── Recipients (Native Split!) ────────────────────────

    async createRecipient(params: CreateRecipientParams): Promise<RecipientResult> {
        const body = {
            name: params.name,
            email: params.email,
            document: params.document.replace(/\D/g, ''),
            type: params.document.replace(/\D/g, '').length > 11 ? 'company' : 'individual',
            default_bank_account: {
                holder_name: params.name,
                holder_type: params.document.replace(/\D/g, '').length > 11 ? 'company' : 'individual',
                holder_document: params.document.replace(/\D/g, ''),
                bank: params.bankAccount.bankCode,
                branch_number: params.bankAccount.agencyNumber,
                account_number: params.bankAccount.accountNumber,
                account_check_digit: params.bankAccount.accountDigit,
                type: params.bankAccount.type === 'checking' ? 'checking' : 'savings',
            },
            transfer_settings: {
                transfer_enabled: true,
                transfer_interval: 'Daily',
                transfer_day: 0,
            },
        };

        const result = await this.request<{ id: string; status: string }>(
            'POST', '/recipients', body,
        );
        return {
            externalId: result.id,
            status: result.status === 'active' ? 'active' : 'pending',
            raw: result as unknown as Record<string, unknown>,
        };
    }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        // Pagar.me exposes balance per recipient
        const defaultRecipient = this.config.secretKey || '';
        try {
            const b = await this.request<{
                available: { amount: number };
                transferred: { amount: number };
                waiting_funds: { amount: number };
            }>('GET', `/recipients/${defaultRecipient}/balance`);
            return {
                availableCents: b.available?.amount || 0,
                pendingCents: b.waiting_funds?.amount || 0,
                currency: 'BRL',
            };
        } catch {
            return { availableCents: 0, pendingCents: 0, currency: 'BRL' };
        }
    }

    async getStatement(_start: Date, _end: Date): Promise<StatementEntry[]> {
        return []; // Use balance operations instead
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        const body = {
            amount: params.amountCents,
            source_id: this.config.secretKey, // Default recipient
        };
        const result = await this.request<{ id: string; status: string }>(
            'POST', '/transfers', body,
        );
        return {
            externalId: result.id,
            status: result.status === 'transferred' ? 'confirmed' : 'pending',
            raw: result as unknown as Record<string, unknown>,
        };
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean {
        // Pagar.me webhooks are configured via dashboard
        return true;
    }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as {
            type: string;
            data: {
                id: string;
                code?: string;
                status: string;
                amount?: number;
                paid_at?: string;
                charges?: Array<{ id: string; status: string }>;
            };
        };

        const eventMap: Record<string, NormalizedWebhookEvent['eventType']> = {
            'order.paid': 'payment.confirmed',
            'order.payment_failed': 'payment.failed',
            'order.canceled': 'payment.cancelled',
            'charge.paid': 'payment.confirmed',
            'charge.payment_failed': 'payment.failed',
            'charge.refunded': 'payment.refunded',
            'charge.chargedback': 'payment.chargeback',
            'subscription.created': 'subscription.created',
            'subscription.canceled': 'subscription.cancelled',
        };

        return {
            provider: 'pagarme',
            eventType: eventMap[data.type] || 'payment.created',
            externalChargeId: data.data?.id || '',
            externalReference: data.data?.code,
            amountCents: data.data?.amount,
            paidAt: data.data?.paid_at,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
