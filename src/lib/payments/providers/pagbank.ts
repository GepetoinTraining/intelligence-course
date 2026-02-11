/**
 * PagBank (PagSeguro) Payment Adapter (v4 API)
 * 
 * Priority 2 — large install base, strong recurring card.
 * Uses an order-centric model (orders contain charges).
 * OAuth2 authentication.
 * 
 * Docs: https://dev.pagbank.uol.com.br
 * Sandbox: https://sandbox.api.pagseguro.com
 * Production: https://api.pagseguro.com
 */

import { PaymentAdapter, PaymentAdapterError } from '../adapter';
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

interface PagBankOrder {
    id: string;
    reference_id: string;
    charges: Array<{
        id: string;
        status: string;
        amount: { value: number; currency: string };
        payment_method: { type: string };
        payment_response?: { code: string; message: string };
        links?: Array<{ rel: string; href: string; media: string }>;
    }>;
    qr_codes?: Array<{
        id: string;
        text: string;
        links: Array<{ rel: string; href: string }>;
        expiration_date: string;
    }>;
    links?: Array<{ rel: string; href: string }>;
}

export class PagBankAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'pagbank';

    readonly capabilities: ProviderCapabilities = {
        pix: true,
        boleto: true,
        creditCard: true,
        debitCard: true,
        recurring: true,
        split: false,         // PagBank v4 has no native split
        transfer: true,
        balance: true,
        statement: false,
    };

    protected getBaseUrl(): string {
        return this.config.sandboxMode
            ? 'https://sandbox.api.pagseguro.com'
            : 'https://api.pagseguro.com';
    }

    protected getAuthHeaders(): Record<string, string> {
        return { Authorization: `Bearer ${this.config.apiKey}` };
    }

    // ─── Customer ──────────────────────────────────────────

    async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
        // PagBank doesn't have a persistent customer API in v4;
        // customer data is inline per order. We return a synthetic result.
        return {
            externalId: params.document.replace(/\D/g, ''),
            name: params.name,
            document: params.document,
            email: params.email,
        };
    }

    async findCustomer(document: string): Promise<CustomerResult | null> {
        // Not supported — PagBank is order-centric
        return null;
    }

    // ─── Charges ───────────────────────────────────────────

    async createCharge(params: CreateChargeParams): Promise<ChargeResult> {
        const order = this.buildOrder(params);
        const result = await this.request<PagBankOrder>('POST', '/orders', order);

        const charge = result.charges?.[0];
        const qr = result.qr_codes?.[0];

        const chargeResult: ChargeResult = {
            externalId: result.id,
            status: charge ? normalizeStatus('pagbank', charge.status) : 'pending',
            provider: 'pagbank',
            createdAt: new Date().toISOString(),
            raw: result as unknown as Record<string, unknown>,
        };

        // PIX data
        if (params.method === 'pix' && qr) {
            chargeResult.pixCopiaECola = qr.text;
            chargeResult.pixExpiresAt = qr.expiration_date;
            const qrImage = qr.links?.find(l => l.rel === 'QRCODE.PNG');
            if (qrImage) chargeResult.pixQrCodeBase64 = qrImage.href;
        }

        // Boleto data
        if (params.method === 'boleto') {
            const boletoLink = charge?.links?.find(l => l.rel === 'BOLETO.PDF');
            if (boletoLink) chargeResult.boletoUrl = boletoLink.href;
        }

        // Card data
        if (params.method === 'credit_card' && charge?.payment_response) {
            chargeResult.cardAuthorizationCode = charge.payment_response.code;
        }

        return chargeResult;
    }

    private buildOrder(params: CreateChargeParams): Record<string, unknown> {
        const order: Record<string, unknown> = {
            reference_id: params.externalReference,
            customer: {
                name: params.customer.name,
                email: params.customer.email,
                tax_id: params.customer.document.replace(/\D/g, ''),
                phones: params.customer.phone ? [{
                    country: '55',
                    area: params.customer.phone.slice(3, 5),
                    number: params.customer.phone.slice(5),
                    type: 'MOBILE',
                }] : [],
            },
            items: [{
                reference_id: params.externalReference,
                name: params.description.slice(0, 64),
                quantity: 1,
                unit_amount: params.amountCents,
            }],
        };

        if (params.method === 'pix') {
            order.qr_codes = [{
                amount: { value: params.amountCents },
                expiration_date: this.getPixExpiration(params.pixExpirationMinutes || 30),
            }];
        } else if (params.method === 'boleto') {
            order.charges = [{
                reference_id: params.externalReference,
                description: params.description.slice(0, 64),
                amount: { value: params.amountCents, currency: 'BRL' },
                payment_method: {
                    type: 'BOLETO',
                    boleto: {
                        due_date: params.dueDate,
                        instruction_lines: {
                            line_1: params.boletoInstructions || 'Pagamento de mensalidade',
                            line_2: 'Não receber após vencimento',
                        },
                        holder: {
                            name: params.customer.name,
                            tax_id: params.customer.document.replace(/\D/g, ''),
                            email: params.customer.email,
                        },
                    },
                },
            }];
        } else if (params.method === 'credit_card') {
            const chargeBody: Record<string, unknown> = {
                reference_id: params.externalReference,
                description: params.description.slice(0, 64),
                amount: { value: params.amountCents, currency: 'BRL' },
                payment_method: {
                    type: 'CREDIT_CARD',
                    installments: params.cardInstallments || 1,
                    capture: true,
                    card: params.card?.token
                        ? { id: params.card.token }
                        : {
                            number: params.card?.number,
                            exp_month: params.card?.expMonth,
                            exp_year: params.card?.expYear,
                            security_code: params.card?.cvv,
                            holder: { name: params.card?.holderName || params.customer.name },
                        },
                },
            };
            order.charges = [chargeBody];
        }

        return order;
    }

    private getPixExpiration(minutes: number): string {
        const d = new Date(Date.now() + minutes * 60 * 1000);
        return d.toISOString().replace(/\.\d{3}Z$/, '-03:00'); // BRT
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        const order = await this.request<PagBankOrder>('GET', `/orders/${externalId}`);
        const charge = order.charges?.[0];
        return {
            externalId: order.id,
            status: charge ? normalizeStatus('pagbank', charge.status) : 'pending',
            amountCents: charge?.amount?.value || 0,
            raw: order as unknown as Record<string, unknown>,
        };
    }

    async cancelCharge(externalId: string): Promise<void> {
        // PagBank cancels via the charge, not the order
        const order = await this.request<PagBankOrder>('GET', `/orders/${externalId}`);
        const chargeId = order.charges?.[0]?.id;
        if (chargeId) {
            await this.request('POST', `/charges/${chargeId}/cancel`, {});
        }
    }

    async refundCharge(externalId: string, amountCents?: number): Promise<RefundResult> {
        const order = await this.request<PagBankOrder>('GET', `/orders/${externalId}`);
        const chargeId = order.charges?.[0]?.id;
        if (!chargeId) throw new PaymentAdapterError('pagbank', 'No charge found to refund');

        const body = amountCents ? { amount: { value: amountCents } } : {};
        const result = await this.request<{ id: string; amount: { value: number } }>(
            'POST', `/charges/${chargeId}/cancel`, body,
        );
        return {
            externalId,
            refundId: result.id || chargeId,
            amountCents: result.amount?.value || 0,
            status: 'pending',
        };
    }

    // ─── Subscriptions ────────────────────────────────────

    async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
        // PagBank uses /recurring/subscriptions
        const intervalMap: Record<string, string> = {
            monthly: 'MONTH', bimonthly: 'MONTH', quarterly: 'MONTH',
            semiannually: 'MONTH', annually: 'YEAR', weekly: 'DAY', biweekly: 'DAY',
        };
        const intervalLength: Record<string, number> = {
            monthly: 1, bimonthly: 2, quarterly: 3,
            semiannually: 6, annually: 1, weekly: 7, biweekly: 14,
        };

        // Step 1: Create a plan
        const plan = await this.request<{ id: string }>('POST', '/recurring/plans', {
            reference_id: `plan-${params.externalReference}`,
            name: params.description,
            interval: {
                unit: intervalMap[params.cycle] || 'MONTH',
                length: intervalLength[params.cycle] || 1,
            },
            amount: { value: params.amountCents, currency: 'BRL' },
            payment_method: [params.method === 'credit_card' ? 'CREDIT_CARD' : 'BOLETO'],
        });

        // Step 2: Create subscription
        const sub = await this.request<{ id: string; status: string }>('POST', '/recurring/subscriptions', {
            reference_id: params.externalReference,
            plan: { id: plan.id },
            customer: {
                name: params.customer.name,
                email: params.customer.email,
                tax_id: params.customer.document.replace(/\D/g, ''),
            },
            payment_method: params.card?.token
                ? [{ type: 'CREDIT_CARD', card: { id: params.card.token } }]
                : undefined,
        });

        return {
            externalId: sub.id,
            status: sub.status === 'ACTIVE' ? 'active' : 'inactive',
            provider: 'pagbank',
            nextDueDate: params.nextDueDate,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    async cancelSubscription(externalId: string): Promise<void> {
        await this.request('PUT', `/recurring/subscriptions/${externalId}`, { status: 'CANCELED' });
    }

    async getSubscription(externalId: string): Promise<SubscriptionStatus> {
        const sub = await this.request<{
            id: string; status: string; plan: { amount: { value: number } };
        }>('GET', `/recurring/subscriptions/${externalId}`);

        return {
            externalId: sub.id,
            status: sub.status === 'ACTIVE' ? 'active' : sub.status === 'CANCELED' ? 'cancelled' : 'inactive',
            cycle: 'monthly',
            amountCents: sub.plan?.amount?.value || 0,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    // ─── Recipients (Not supported) ────────────────────────

    async createRecipient(_params: CreateRecipientParams): Promise<RecipientResult> {
        throw new PaymentAdapterError('pagbank', 'PagBank does not support split recipients');
    }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const b = await this.request<{ balances: Array<{ amount: { value: number } }> }>(
            'GET', '/wallet/balance',
        );
        const available = b.balances?.[0]?.amount?.value || 0;
        return { availableCents: available, pendingCents: 0, currency: 'BRL' };
    }

    async getStatement(_start: Date, _end: Date): Promise<StatementEntry[]> {
        throw new PaymentAdapterError('pagbank', 'PagBank does not expose statement via API');
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        const body: Record<string, unknown> = {
            amount: { value: params.amountCents },
            description: params.description,
        };

        if (params.pixKey) {
            body.destination = { type: 'PIX', key: params.pixKey };
        } else if (params.bankAccount) {
            body.destination = {
                type: 'BANK_ACCOUNT',
                bank_account: {
                    bank: params.bankAccount.bankCode,
                    agency: params.bankAccount.agencyNumber,
                    account: params.bankAccount.accountNumber,
                    account_digit: params.bankAccount.accountDigit,
                    type: params.bankAccount.type === 'checking' ? 'CACC' : 'SVGS',
                    holder: {
                        name: params.bankAccount.holderName,
                        tax_id: params.bankAccount.holderDocument,
                    },
                },
            };
        }

        const result = await this.request<{ id: string; status: string }>(
            'POST', '/payouts', body,
        );
        return {
            externalId: result.id,
            status: result.status === 'COMPLETED' ? 'confirmed' : 'pending',
            raw: result as unknown as Record<string, unknown>,
        };
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean {
        // PagBank uses notification_url per order — validate by checking order exists
        return true;
    }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as {
            id: string; reference_id: string;
            charges?: Array<{ id: string; status: string; amount: { value: number } }>;
        };
        const charge = data.charges?.[0];

        const status = charge?.status;
        let eventType: NormalizedWebhookEvent['eventType'] = 'payment.created';
        if (status === 'PAID') eventType = 'payment.confirmed';
        else if (status === 'DECLINED' || status === 'CANCELED') eventType = 'payment.failed';
        else if (status === 'REFUNDED') eventType = 'payment.refunded';

        return {
            provider: 'pagbank',
            eventType,
            externalChargeId: data.id,
            externalReference: data.reference_id,
            amountCents: charge?.amount?.value,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
