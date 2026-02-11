/**
 * Sicoob Payment Adapter (API v3)
 * 
 * Cooperative bank. RESTful APIs with digital certificate.
 * Boletos v3, PIX, saldo, extrato, transfers.
 * 
 * Auth: OAuth2 + digital certificate
 * Docs: developers.sicoob.com.br
 * Base: api.sicoob.com.br
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

export class SicoobAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'sicoob';

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
            ? 'https://sandbox.sicoob.com.br'
            : 'https://api.sicoob.com.br';
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
            'client_id': this.config.apiKey,
            ...extraHeaders,
        };

        const options: RequestInit = { method, headers };
        if (body && method !== 'GET') options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new PaymentAdapterError('sicoob', `${method} ${path} → ${response.status}: ${errorBody}`, response.status, errorBody);
        }
        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;

        const authUrl = this.config.sandboxMode
            ? 'https://sandbox.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token'
            : 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token';

        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.apiKey,
                client_secret: this.config.secretKey || '',
                scope: 'cobranca_boletos_incluir cobranca_boletos_consultar cobranca_boletos_pagador cobranca_boletos_segunda_via pix_cob',
            }).toString(),
        });

        if (!response.ok) throw new PaymentAdapterError('sicoob', `OAuth failed: ${response.status}`);
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
        }>('PUT', `/pix/api/v2/cob/${txid}`, body);

        return {
            externalId: cob.txid,
            status: normalizeStatus('sicoob', cob.status || 'ATIVA'),
            provider: 'sicoob',
            pixCopiaECola: cob.pixCopiaECola,
            pixQrCodeBase64: cob.location,
            pixExpiresAt: new Date(Date.now() + cob.calendario.expiracao * 1000).toISOString(),
            createdAt: cob.calendario.criacao,
            raw: cob as unknown as Record<string, unknown>,
        };
    }

    private async createBoletoCharge(params: CreateChargeParams): Promise<ChargeResult> {
        const doc = params.customer.document.replace(/\D/g, '');
        // Boleto v3 API
        const body = {
            numeroContrato: parseInt(this.config.apiKey.split(':')[0] || '0'),
            modalidade: 1, // Simples
            especieDocumento: 'DM',
            dataVencimento: params.dueDate,
            valor: params.amountCents / 100,
            identificacaoBoletoEmpresa: params.externalReference.slice(0, 25),
            tipoDesconto: 0,
            tipoMulta: 0,
            tipoJurosMora: 0,
            pagador: {
                numeroCpfCnpj: doc,
                nome: params.customer.name,
                endereco: params.customer.address?.street || '',
                bairro: params.customer.address?.neighborhood || '',
                cidade: params.customer.address?.city || '',
                cep: params.customer.address?.postalCode?.replace(/\D/g, '') || '',
                uf: params.customer.address?.state || '',
            },
            gerarPix: true,
        };

        const boleto = await this.request<{
            nossoNumero: number; linhaDigitavel: string; codigoBarras: string;
            pix?: { txid: string; pixCopiaECola: string };
        }>('POST', '/cobranca-bancaria/v3/boletos', body);

        return {
            externalId: String(boleto.nossoNumero || ''),
            status: 'pending',
            provider: 'sicoob',
            boletoDigitableLine: boleto.linhaDigitavel,
            boletoBarcode: boleto.codigoBarras,
            pixCopiaECola: boleto.pix?.pixCopiaECola,
            createdAt: new Date().toISOString(),
            raw: boleto as unknown as Record<string, unknown>,
        };
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        try {
            const cob = await this.request<{ txid: string; status: string; valor: { original: string } }>(
                'GET', `/pix/api/v2/cob/${externalId}`,
            );
            return {
                externalId: cob.txid,
                status: normalizeStatus('sicoob', cob.status),
                amountCents: Math.round(parseFloat(cob.valor.original) * 100),
                raw: cob as unknown as Record<string, unknown>,
            };
        } catch {
            const boleto = await this.request<{ nossoNumero: number; situacaoBoleto: string; valor: number }>(
                'GET', `/cobranca-bancaria/v3/boletos?nossoNumero=${externalId}`,
            );
            return {
                externalId: String(boleto.nossoNumero),
                status: normalizeStatus('sicoob', boleto.situacaoBoleto || 'EM_ABERTO'),
                amountCents: Math.round((boleto.valor || 0) * 100),
                raw: boleto as unknown as Record<string, unknown>,
            };
        }
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PATCH', `/cobranca-bancaria/v3/boletos/${externalId}/baixar`, {});
    }

    async refundCharge(_id: string, _amount?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('sicoob', 'Use PIX devolução for refunds');
    }

    // ─── Subscriptions/Recipients ──────────────────────────

    async createSubscription(_p: CreateSubscriptionParams): Promise<SubscriptionResult> { throw new PaymentAdapterError('sicoob', 'Not supported'); }
    async cancelSubscription(_id: string): Promise<void> { throw new PaymentAdapterError('sicoob', 'Not supported'); }
    async getSubscription(_id: string): Promise<SubscriptionStatus> { throw new PaymentAdapterError('sicoob', 'Not supported'); }
    async createRecipient(_p: CreateRecipientParams): Promise<RecipientResult> { throw new PaymentAdapterError('sicoob', 'Not supported'); }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const result = await this.request<{ saldo: { disponivel: number; bloqueado?: number } }>(
            'GET', '/conta-corrente/v1/saldo',
        );
        return {
            availableCents: Math.round((result.saldo?.disponivel || 0) * 100),
            pendingCents: 0,
            blockedCents: Math.round((result.saldo?.bloqueado || 0) * 100),
            currency: 'BRL',
        };
    }

    async getStatement(start: Date, end: Date): Promise<StatementEntry[]> {
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];
        const result = await this.request<{
            lancamentos: Array<{
                dataLancamento: string; descricao: string; valor: number;
                tipoLancamento: string; numerodocumento?: string;
            }>;
        }>('GET', `/conta-corrente/v1/extrato?dataInicio=${startDate}&dataFim=${endDate}`);

        return (result.lancamentos || []).map(l => ({
            date: l.dataLancamento,
            description: l.descricao,
            amountCents: Math.round(l.valor * 100) * (l.tipoLancamento === 'D' ? -1 : 1),
            type: l.tipoLancamento === 'D' ? 'debit' as const : 'credit' as const,
            reference: l.numerodocumento,
        }));
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        if (params.method === 'pix' && params.pixKey) {
            const result = await this.request<{ endToEndId: string; status: string }>(
                'POST', '/pix/api/v2/pix', {
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
        throw new PaymentAdapterError('sicoob', 'Only PIX transfers via API');
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean { return true; }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { pix?: Array<{ txid: string; valor: string; horario: string }> };
        const pix = data.pix?.[0];
        return {
            provider: 'sicoob',
            eventType: pix ? 'payment.confirmed' : 'payment.created',
            externalChargeId: pix?.txid || '',
            amountCents: pix ? Math.round(parseFloat(pix.valor) * 100) : undefined,
            paidAt: pix?.horario,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
