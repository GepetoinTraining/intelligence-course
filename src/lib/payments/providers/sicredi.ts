/**
 * Sicredi Payment Adapter
 * 
 * Cooperative bank. Cobrança Híbrida API (boleto + PIX QR combined).
 * Limited banking APIs — no direct saldo/extrato yet.
 * 
 * Auth: OAuth2
 * Docs: developers.sicredi.com.br
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

export class SicrediAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'sicredi';

    readonly capabilities: ProviderCapabilities = {
        pix: true,
        boleto: true,
        creditCard: false,
        debitCard: false,
        recurring: false,
        split: false,
        transfer: false,
        balance: false,
        statement: false,
    };

    private accessToken: string | null = null;
    private tokenExpiresAt = 0;

    protected getBaseUrl(): string {
        return this.config.sandboxMode
            ? 'https://api-parceiro.sicredi.com.br/sb'
            : 'https://api-parceiro.sicredi.com.br';
    }

    protected getAuthHeaders(): Record<string, string> { return {}; }

    protected override async request<T>(
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        path: string,
        body?: unknown,
        extraHeaders?: Record<string, string>,
    ): Promise<T> {
        const token = await this.ensureAccessToken();
        const url = `${this.getBaseUrl()}${path}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.config.apiKey,
            ...extraHeaders,
        };

        const options: RequestInit = { method, headers };
        if (body && method !== 'GET') options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new PaymentAdapterError('sicredi', `${method} ${path} → ${response.status}: ${errorBody}`, response.status, errorBody);
        }
        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;

        const authUrl = `${this.getBaseUrl()}/auth/openapi/token`;
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.apiKey,
                client_secret: this.config.secretKey || '',
                scope: 'cobranca',
            }).toString(),
        });

        if (!response.ok) throw new PaymentAdapterError('sicredi', `OAuth failed: ${response.status}`);
        const data = await response.json() as { access_token: string; expires_in: number };
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
        return this.accessToken;
    }

    // ─── Customer ──────────────────────────────────────────

    async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
        return {
            externalId: params.document.replace(/\D/g, ''),
            name: params.name, document: params.document, email: params.email,
        };
    }

    async findCustomer(_document: string): Promise<CustomerResult | null> { return null; }

    // ─── Charges ───────────────────────────────────────────

    async createCharge(params: CreateChargeParams): Promise<ChargeResult> {
        // Cobrança Híbrida — generates boleto with embedded PIX QR
        const doc = params.customer.document.replace(/\D/g, '');

        const body = {
            tipoCobranca: 'HIBRIDO',
            beneficiarioFinal: {
                documento: doc,
                tipoPessoa: doc.length > 11 ? 'JURIDICA' : 'FISICA',
                nome: params.customer.name,
                email: params.customer.email,
                telefone: params.customer.phone || '',
                endereco: params.customer.address ? {
                    logradouro: params.customer.address.street,
                    numero: params.customer.address.number,
                    bairro: params.customer.address.neighborhood,
                    cidade: params.customer.address.city,
                    uf: params.customer.address.state,
                    cep: params.customer.address.postalCode?.replace(/\D/g, ''),
                } : undefined,
            },
            dataVencimento: params.dueDate,
            valor: params.amountCents / 100,
            seuNumero: params.externalReference.slice(0, 15),
            especieDocumento: 'DMI',
        };

        const boleto = await this.request<{
            nossoNumero: string; linhaDigitavel: string; codigoBarras: string;
            cooperativa: string; posto: string;
            qrCode?: { txid: string; emv: string };
        }>('POST', '/cobranca/boleto/v1/boletos', body);

        return {
            externalId: boleto.nossoNumero || '',
            status: 'pending',
            provider: 'sicredi',
            boletoDigitableLine: boleto.linhaDigitavel,
            boletoBarcode: boleto.codigoBarras,
            pixCopiaECola: boleto.qrCode?.emv,
            createdAt: new Date().toISOString(),
            raw: boleto as unknown as Record<string, unknown>,
        };
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        const boleto = await this.request<{
            nossoNumero: string; situacao: string; valor: number;
            dataPagamento?: string; valorPago?: number;
        }>('GET', `/cobranca/boleto/v1/boletos?nossoNumero=${externalId}`);

        return {
            externalId: boleto.nossoNumero || externalId,
            status: normalizeStatus('sicredi', boleto.situacao || 'EMABERTO'),
            amountCents: Math.round((boleto.valor || 0) * 100),
            paidAmountCents: boleto.valorPago ? Math.round(boleto.valorPago * 100) : undefined,
            paidAt: boleto.dataPagamento,
            raw: boleto as unknown as Record<string, unknown>,
        };
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PATCH', `/cobranca/boleto/v1/boletos/${externalId}/baixa`, {});
    }

    async refundCharge(_id: string, _amount?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('sicredi', 'Use PIX devolução for refunds');
    }

    // ─── Unsupported ──────────────────────────────────────

    async createSubscription(_p: CreateSubscriptionParams): Promise<SubscriptionResult> { throw new PaymentAdapterError('sicredi', 'Not supported'); }
    async cancelSubscription(_id: string): Promise<void> { throw new PaymentAdapterError('sicredi', 'Not supported'); }
    async getSubscription(_id: string): Promise<SubscriptionStatus> { throw new PaymentAdapterError('sicredi', 'Not supported'); }
    async createRecipient(_p: CreateRecipientParams): Promise<RecipientResult> { throw new PaymentAdapterError('sicredi', 'Not supported'); }

    async getBalance(): Promise<BalanceResult> { throw new PaymentAdapterError('sicredi', 'No banking API available'); }
    async getStatement(_start: Date, _end: Date): Promise<StatementEntry[]> { throw new PaymentAdapterError('sicredi', 'No banking API available'); }
    async createTransfer(_p: CreateTransferParams): Promise<TransferResult> { throw new PaymentAdapterError('sicredi', 'No transfer API available'); }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean { return true; }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { nossoNumero?: string; situacao?: string; valor?: number };
        const isPaid = data.situacao === 'PAGO' || data.situacao === 'LIQUIDADO';
        return {
            provider: 'sicredi',
            eventType: isPaid ? 'payment.confirmed' : 'payment.created',
            externalChargeId: data.nossoNumero || '',
            amountCents: data.valor ? Math.round(data.valor * 100) : undefined,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
