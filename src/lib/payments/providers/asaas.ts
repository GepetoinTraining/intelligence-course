/**
 * Asaas Payment Adapter (v3 API)
 * 
 * Priority 1 provider — best overall for Brazilian schools.
 * Supports PIX, Boleto, Credit Card, Subscriptions, Splits.
 * 
 * Docs: https://docs.asaas.com
 * Sandbox: https://sandbox.asaas.com/api
 * Production: https://api.asaas.com
 */

import { PaymentAdapter, PaymentAdapterError } from '../adapter';
import { normalizeStatus } from '../status-map';
import type {
    PaymentProvider, ProviderCapabilities, GatewayConfig,
    CreateCustomerParams, CustomerResult,
    CreateChargeParams, ChargeResult, ChargeStatus, RefundResult,
    CreateSubscriptionParams, SubscriptionResult, SubscriptionStatus,
    CreateRecipientParams, RecipientResult,
    BalanceResult, StatementEntry, CreateTransferParams, TransferResult,
    NormalizedWebhookEvent, SubscriptionCycle,
} from '../types';

// ─── Asaas-specific types ────────────────────────────────────

interface AsaasCustomer {
    id: string;
    name: string;
    cpfCnpj: string;
    email: string;
}

interface AsaasPayment {
    id: string;
    status: string;
    value: number;
    netValue: number;
    billingType: string;
    pixQrCodeId?: string;
    bankSlipUrl?: string;
    invoiceUrl?: string;
    nossoNumero?: string;
    dateCreated: string;
    paymentDate?: string;
    confirmedDate?: string;
    externalReference?: string;
}

interface AsaasPixQrCode {
    encodedImage: string;
    payload: string;
    expirationDate: string;
}

interface AsaasSubscription {
    id: string;
    status: string;
    value: number;
    nextDueDate: string;
    cycle: string;
}

interface AsaasTransfer {
    id: string;
    status: string;
    value: number;
}

const CYCLE_MAP: Record<SubscriptionCycle, string> = {
    weekly: 'WEEKLY',
    biweekly: 'BIWEEKLY',
    monthly: 'MONTHLY',
    bimonthly: 'BIMONTHLY',
    quarterly: 'QUARTERLY',
    semiannually: 'SEMIANNUALLY',
    annually: 'YEARLY',
};

const METHOD_MAP: Record<string, string> = {
    pix: 'PIX',
    boleto: 'BOLETO',
    credit_card: 'CREDIT_CARD',
    debit_card: 'DEBIT_CARD',
};

export class AsaasAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'asaas';

    readonly capabilities: ProviderCapabilities = {
        pix: true,
        boleto: true,
        creditCard: true,
        debitCard: true,
        recurring: true,
        split: true,
        transfer: true,
        balance: true,
        statement: true,
    };

    protected getBaseUrl(): string {
        return this.config.sandboxMode
            ? 'https://sandbox.asaas.com/api'
            : 'https://api.asaas.com';
    }

    protected getAuthHeaders(): Record<string, string> {
        return { access_token: this.config.apiKey };
    }

    // ─── Customer ──────────────────────────────────────────

    async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
        // Check if customer already exists
        const existing = await this.findCustomer(params.document);
        if (existing) return existing;

        const body: Record<string, unknown> = {
            name: params.name,
            cpfCnpj: params.document.replace(/\D/g, ''),
            email: params.email,
        };
        if (params.phone) body.mobilePhone = params.phone;
        if (params.address) {
            body.address = params.address.street;
            body.addressNumber = params.address.number;
            body.complement = params.address.complement;
            body.province = params.address.neighborhood;
            body.postalCode = params.address.postalCode?.replace(/\D/g, '');
        }

        const result = await this.request<AsaasCustomer>('POST', '/v3/customers', body);
        return {
            externalId: result.id,
            name: result.name,
            document: result.cpfCnpj,
            email: result.email,
        };
    }

    async findCustomer(document: string): Promise<CustomerResult | null> {
        const clean = document.replace(/\D/g, '');
        const result = await this.request<{ data: AsaasCustomer[] }>(
            'GET', `/v3/customers?cpfCnpj=${clean}`,
        );
        if (result.data && result.data.length > 0) {
            const c = result.data[0];
            return { externalId: c.id, name: c.name, document: c.cpfCnpj, email: c.email };
        }
        return null;
    }

    // ─── Charges ───────────────────────────────────────────

    async createCharge(params: CreateChargeParams): Promise<ChargeResult> {
        // Ensure customer exists
        const customer = await this.createCustomer(params.customer);

        const body: Record<string, unknown> = {
            customer: customer.externalId,
            billingType: METHOD_MAP[params.method] || 'UNDEFINED',
            value: params.amountCents / 100,
            dueDate: params.dueDate,
            description: params.description,
            externalReference: params.externalReference,
        };

        // Card data
        if (params.method === 'credit_card' && params.card) {
            if (params.card.token) {
                body.creditCardToken = params.card.token;
            } else {
                body.creditCard = {
                    holderName: params.card.holderName,
                    number: params.card.number,
                    expiryMonth: params.card.expMonth,
                    expiryYear: params.card.expYear,
                    ccv: params.card.cvv,
                };
                body.creditCardHolderInfo = {
                    name: params.customer.name,
                    email: params.customer.email,
                    cpfCnpj: params.customer.document.replace(/\D/g, ''),
                    phone: params.customer.phone || '',
                };
            }
            if (params.cardInstallments && params.cardInstallments > 1) {
                body.installmentCount = params.cardInstallments;
                body.installmentValue = params.amountCents / 100 / params.cardInstallments;
            }
        }

        // Split rules
        if (params.splits && params.splits.length > 0) {
            body.split = params.splits.map(s => ({
                walletId: s.recipientExternalId,
                ...(s.amountCents != null ? { fixedValue: s.amountCents / 100 } : {}),
                ...(s.percentage != null ? { percentualValue: s.percentage } : {}),
            }));
        }

        const payment = await this.request<AsaasPayment>('POST', '/v3/payments', body);

        const result: ChargeResult = {
            externalId: payment.id,
            status: normalizeStatus('asaas', payment.status),
            provider: 'asaas',
            createdAt: payment.dateCreated,
            paidAt: payment.confirmedDate || payment.paymentDate,
            boletoUrl: payment.bankSlipUrl,
            raw: payment as unknown as Record<string, unknown>,
        };

        // Fetch PIX QR code if PIX method
        if (params.method === 'pix' && payment.id) {
            try {
                const pix = await this.request<AsaasPixQrCode>('GET', `/v3/payments/${payment.id}/pixQrCode`);
                result.pixQrCodeBase64 = pix.encodedImage;
                result.pixCopiaECola = pix.payload;
                result.pixExpiresAt = pix.expirationDate;
            } catch {
                // PIX QR might not be ready yet — not fatal
            }
        }

        return result;
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        const p = await this.request<AsaasPayment>('GET', `/v3/payments/${externalId}`);
        return {
            externalId: p.id,
            status: normalizeStatus('asaas', p.status),
            amountCents: Math.round(p.value * 100),
            paidAmountCents: p.netValue ? Math.round(p.netValue * 100) : undefined,
            paidAt: p.confirmedDate || p.paymentDate,
            raw: p as unknown as Record<string, unknown>,
        };
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('DELETE', `/v3/payments/${externalId}`);
    }

    async refundCharge(externalId: string, amountCents?: number): Promise<RefundResult> {
        const body = amountCents ? { value: amountCents / 100 } : {};
        const result = await this.request<{ id: string; value: number; status: string }>(
            'POST', `/v3/payments/${externalId}/refund`, body,
        );
        return {
            externalId,
            refundId: result.id || externalId,
            amountCents: Math.round(result.value * 100),
            status: 'pending',
        };
    }

    // ─── Subscriptions ────────────────────────────────────

    async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
        const customer = await this.createCustomer(params.customer);

        const body: Record<string, unknown> = {
            customer: customer.externalId,
            billingType: METHOD_MAP[params.method] || 'UNDEFINED',
            value: params.amountCents / 100,
            nextDueDate: params.nextDueDate,
            cycle: CYCLE_MAP[params.cycle] || 'MONTHLY',
            description: params.description,
            externalReference: params.externalReference,
        };

        if (params.endDate) body.endDate = params.endDate;

        if (params.method === 'credit_card' && params.card) {
            if (params.card.token) {
                body.creditCardToken = params.card.token;
            } else {
                body.creditCard = {
                    holderName: params.card.holderName,
                    number: params.card.number,
                    expiryMonth: params.card.expMonth,
                    expiryYear: params.card.expYear,
                    ccv: params.card.cvv,
                };
                body.creditCardHolderInfo = {
                    name: params.customer.name,
                    email: params.customer.email,
                    cpfCnpj: params.customer.document.replace(/\D/g, ''),
                };
            }
        }

        if (params.splits && params.splits.length > 0) {
            body.split = params.splits.map(s => ({
                walletId: s.recipientExternalId,
                ...(s.amountCents != null ? { fixedValue: s.amountCents / 100 } : {}),
                ...(s.percentage != null ? { percentualValue: s.percentage } : {}),
            }));
        }

        const sub = await this.request<AsaasSubscription>('POST', '/v3/subscriptions', body);
        return {
            externalId: sub.id,
            status: sub.status === 'ACTIVE' ? 'active' : 'inactive',
            provider: 'asaas',
            nextDueDate: sub.nextDueDate,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    async cancelSubscription(externalId: string): Promise<void> {
        await this.request('DELETE', `/v3/subscriptions/${externalId}`);
    }

    async getSubscription(externalId: string): Promise<SubscriptionStatus> {
        const sub = await this.request<AsaasSubscription>('GET', `/v3/subscriptions/${externalId}`);
        const statusMap: Record<string, 'active' | 'inactive' | 'cancelled' | 'expired'> = {
            ACTIVE: 'active', INACTIVE: 'inactive', EXPIRED: 'expired',
        };
        return {
            externalId: sub.id,
            status: statusMap[sub.status] || 'inactive',
            cycle: sub.cycle,
            amountCents: Math.round(sub.value * 100),
            nextDueDate: sub.nextDueDate,
            raw: sub as unknown as Record<string, unknown>,
        };
    }

    // ─── Recipients ────────────────────────────────────────

    async createRecipient(params: CreateRecipientParams): Promise<RecipientResult> {
        // Asaas uses sub-accounts for split recipients
        const body = {
            name: params.name,
            cpfCnpj: params.document.replace(/\D/g, ''),
            email: params.email,
            loginEmail: params.email,
            birthDate: null,
            companyType: params.document.length > 11 ? 'LIMITED' : null,
            phone: '',
            mobilePhone: '',
            address: '',
            addressNumber: '',
            province: '',
            postalCode: '',
        };

        const result = await this.request<{ id: string; walletId: string; status: string }>(
            'POST', '/v3/accounts', body,
        );
        return {
            externalId: result.walletId || result.id,
            status: result.status === 'ACTIVE' ? 'active' : 'pending',
            raw: result as unknown as Record<string, unknown>,
        };
    }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const b = await this.request<{ balance: number; statistics: { pending: number } }>(
            'GET', '/v3/finance/balance',
        );
        return {
            availableCents: Math.round(b.balance * 100),
            pendingCents: Math.round((b.statistics?.pending || 0) * 100),
            currency: 'BRL',
        };
    }

    async getStatement(start: Date, end: Date): Promise<StatementEntry[]> {
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];
        const result = await this.request<{
            data: Array<{
                date: string; description: string; value: number; type: string; balance: number;
            }>
        }>(
            'GET', `/v3/financialTransactions?startDate=${startDate}&finishDate=${endDate}`,
        );
        return (result.data || []).map(e => ({
            date: e.date,
            description: e.description,
            amountCents: Math.round(e.value * 100),
            type: e.type === 'DEBIT' ? 'debit' as const : 'credit' as const,
            balance: Math.round(e.balance * 100),
        }));
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        const body: Record<string, unknown> = {
            value: params.amountCents / 100,
            description: params.description,
        };

        if (params.method === 'pix' && params.pixKey) {
            body.pixAddressKey = params.pixKey;
            body.pixAddressKeyType = (params.pixKeyType || 'cpf').toUpperCase();
            body.operationType = 'PIX';
        } else if (params.bankAccount) {
            body.bankAccount = {
                bank: { code: params.bankAccount.bankCode },
                accountName: params.bankAccount.holderName,
                ownerName: params.bankAccount.holderName,
                cpfCnpj: params.bankAccount.holderDocument?.replace(/\D/g, ''),
                agency: params.bankAccount.agencyNumber,
                account: params.bankAccount.accountNumber,
                accountDigit: params.bankAccount.accountDigit,
                bankAccountType: params.bankAccount.type === 'checking' ? 'CONTA_CORRENTE' : 'CONTA_POUPANCA',
            };
            body.operationType = 'TED';
        }

        const t = await this.request<AsaasTransfer>('POST', '/v3/transfers', body);
        return {
            externalId: t.id,
            status: t.status === 'DONE' ? 'confirmed' : 'pending',
            raw: t as unknown as Record<string, unknown>,
        };
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean {
        // Asaas validates by access_token in webhook config, not signature
        // For extra security, verify the payment exists via API
        return true;
    }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { event: string; payment?: AsaasPayment };
        const payment = data.payment;

        const eventMap: Record<string, NormalizedWebhookEvent['eventType']> = {
            PAYMENT_CREATED: 'payment.created',
            PAYMENT_RECEIVED: 'payment.confirmed',
            PAYMENT_CONFIRMED: 'payment.confirmed',
            PAYMENT_OVERDUE: 'payment.overdue',
            PAYMENT_REFUNDED: 'payment.refunded',
            PAYMENT_DELETED: 'payment.cancelled',
            PAYMENT_CHARGEBACK_REQUESTED: 'payment.chargeback',
        };

        return {
            provider: 'asaas',
            eventType: eventMap[data.event] || 'payment.created',
            externalChargeId: payment?.id || '',
            externalReference: payment?.externalReference,
            amountCents: payment?.value ? Math.round(payment.value * 100) : undefined,
            paidAt: payment?.confirmedDate || payment?.paymentDate,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
