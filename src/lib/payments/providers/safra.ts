/**
 * Banco Safra Payment Adapter
 * 
 * Large Brazilian private bank. Full dev portal with
 * boleto, PIX, saldo, extrato, and transfer APIs.
 * 
 * Auth: OAuth2
 * Docs: developer.safra.com.br
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

export class SafraAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'safra';

    readonly capabilities: ProviderCapabilities = {
        pix: true,
        boleto: true,
        creditCard: false,
        debitCard: false,
        recurring: false,
        split: false,
        transfer: true,
        balance: true,
        statement: true,
    };

    private accessToken: string | null = null;
    private tokenExpiresAt = 0;

    protected getBaseUrl(): string {
        return this.config.sandboxMode
            ? 'https://api-sandbox.safra.com.br'
            : 'https://api.safra.com.br';
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
            ...extraHeaders,
        };

        const options: RequestInit = { method, headers };
        if (body && method !== 'GET') options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new PaymentAdapterError('safra', `${method} ${path} → ${response.status}: ${errorBody}`, response.status, errorBody);
        }
        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;

        const authUrl = `${this.getBaseUrl()}/oauth/token`;
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.apiKey,
                client_secret: this.config.secretKey || '',
            }).toString(),
        });

        if (!response.ok) throw new PaymentAdapterError('safra', `OAuth failed: ${response.status}`);
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
        if (params.method === 'pix') return this.createPixCharge(params);
        return this.createBoletoCharge(params);
    }

    private async createPixCharge(params: CreateChargeParams): Promise<ChargeResult> {
        const txid = params.externalReference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 35);
        const doc = params.customer.document.replace(/\D/g, '');

        const body = {
            calendario: { expiracao: (params.pixExpirationMinutes || 30) * 60 },
            devedor: {
                ...(doc.length > 11 ? { cnpj: doc } : { cpf: doc }),
                nome: params.customer.name,
            },
            valor: { original: (params.amountCents / 100).toFixed(2) },
            chave: this.config.oauthAccessToken || '',
        };

        const cob = await this.request<{
            txid: string; status: string; pixCopiaECola: string;
            location: string; calendario: { criacao: string; expiracao: number };
        }>('PUT', `/pix/v2/cob/${txid}`, body);

        return {
            externalId: cob.txid,
            status: normalizeStatus('safra', cob.status || 'ATIVA'),
            provider: 'safra',
            pixCopiaECola: cob.pixCopiaECola,
            pixQrCodeBase64: cob.location,
            pixExpiresAt: new Date(Date.now() + cob.calendario.expiracao * 1000).toISOString(),
            createdAt: cob.calendario.criacao,
            raw: cob as unknown as Record<string, unknown>,
        };
    }

    private async createBoletoCharge(params: CreateChargeParams): Promise<ChargeResult> {
        const doc = params.customer.document.replace(/\D/g, '');

        const body = {
            contaBeneficiario: this.config.apiKey,
            dataVencimento: params.dueDate,
            valorNominal: params.amountCents / 100,
            especie: 'DM',
            seuNumero: params.externalReference.slice(0, 25),
            pagador: {
                cpfCnpj: doc,
                nome: params.customer.name,
                endereco: params.customer.address?.street || '',
                bairro: params.customer.address?.neighborhood || '',
                cidade: params.customer.address?.city || '',
                uf: params.customer.address?.state || '',
                cep: params.customer.address?.postalCode?.replace(/\D/g, '') || '',
            },
            indicadorPix: true,
        };

        const boleto = await this.request<{
            nossoNumero: string; linhaDigitavel: string; codigoBarras: string;
            urlBoleto?: string; pix?: { emv: string };
        }>('POST', '/cobranca/v1/boletos', body);

        return {
            externalId: boleto.nossoNumero || '',
            status: 'pending',
            provider: 'safra',
            boletoDigitableLine: boleto.linhaDigitavel,
            boletoBarcode: boleto.codigoBarras,
            boletoUrl: boleto.urlBoleto,
            pixCopiaECola: boleto.pix?.emv,
            createdAt: new Date().toISOString(),
            raw: boleto as unknown as Record<string, unknown>,
        };
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        try {
            const cob = await this.request<{ txid: string; status: string; valor: { original: string } }>(
                'GET', `/pix/v2/cob/${externalId}`,
            );
            return {
                externalId: cob.txid,
                status: normalizeStatus('safra', cob.status),
                amountCents: Math.round(parseFloat(cob.valor.original) * 100),
                raw: cob as unknown as Record<string, unknown>,
            };
        } catch {
            return { externalId, status: 'pending', amountCents: 0, raw: {} };
        }
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PATCH', `/cobranca/v1/boletos/${externalId}/baixar`, {});
    }

    async refundCharge(_id: string, _amount?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('safra', 'Use PIX devolução for refunds');
    }

    // ─── Subscriptions/Recipients ──────────────────────────

    async createSubscription(_p: CreateSubscriptionParams): Promise<SubscriptionResult> { throw new PaymentAdapterError('safra', 'Not supported'); }
    async cancelSubscription(_id: string): Promise<void> { throw new PaymentAdapterError('safra', 'Not supported'); }
    async getSubscription(_id: string): Promise<SubscriptionStatus> { throw new PaymentAdapterError('safra', 'Not supported'); }
    async createRecipient(_p: CreateRecipientParams): Promise<RecipientResult> { throw new PaymentAdapterError('safra', 'Not supported'); }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const result = await this.request<{ saldo: number; saldoDisponivel?: number }>(
            'GET', '/conta/v1/saldo',
        );
        return {
            availableCents: Math.round((result.saldoDisponivel || result.saldo) * 100),
            pendingCents: 0,
            currency: 'BRL',
        };
    }

    async getStatement(start: Date, end: Date): Promise<StatementEntry[]> {
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];
        const result = await this.request<{
            lancamentos: Array<{
                data: string; descricao: string; valor: number;
                tipo: string; documento?: string;
            }>;
        }>('GET', `/conta/v1/extrato?dataInicio=${startDate}&dataFim=${endDate}`);

        return (result.lancamentos || []).map(l => ({
            date: l.data,
            description: l.descricao,
            amountCents: Math.round(l.valor * 100) * (l.tipo === 'D' ? -1 : 1),
            type: l.tipo === 'D' ? 'debit' as const : 'credit' as const,
            reference: l.documento,
        }));
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        if (params.method === 'pix' && params.pixKey) {
            const result = await this.request<{ endToEndId: string; status: string }>(
                'POST', '/pix/v2/pix', {
                valor: (params.amountCents / 100).toFixed(2),
                descricao: params.description,
                chave: params.pixKey,
            },
            );
            return {
                externalId: result.endToEndId,
                status: result.status === 'REALIZADO' ? 'confirmed' : 'pending',
                raw: result as unknown as Record<string, unknown>,
            };
        }
        throw new PaymentAdapterError('safra', 'Only PIX transfers via API');
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean { return true; }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { pix?: Array<{ txid: string; valor: string; horario: string }> };
        const pix = data.pix?.[0];
        return {
            provider: 'safra',
            eventType: pix ? 'payment.confirmed' : 'payment.created',
            externalChargeId: pix?.txid || '',
            amountCents: pix ? Math.round(parseFloat(pix.valor) * 100) : undefined,
            paidAt: pix?.horario,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
