/**
 * Caixa Econômica Federal Payment Adapter
 * 
 * Government-owned bank. SIGCB boleto system,
 * PIX QR codes, account information APIs.
 * 
 * Auth: OAuth2
 * Docs: openfinance.caixa.gov.br
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

export class CaixaAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'caixa';

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
            ? 'https://testeopn.caixa.gov.br'
            : 'https://api.caixa.gov.br';
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
            throw new PaymentAdapterError('caixa', `${method} ${path} → ${response.status}: ${errorBody}`, response.status, errorBody);
        }
        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;

        const authUrl = this.config.sandboxMode
            ? 'https://testeopn.caixa.gov.br/oauth/v2/token'
            : 'https://api.caixa.gov.br/oauth/v2/token';

        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.apiKey,
                client_secret: this.config.secretKey || '',
            }).toString(),
        });

        if (!response.ok) throw new PaymentAdapterError('caixa', `OAuth failed: ${response.status}`);
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
            status: normalizeStatus('caixa', cob.status || 'ATIVA'),
            provider: 'caixa',
            pixCopiaECola: cob.pixCopiaECola,
            pixQrCodeBase64: cob.location,
            pixExpiresAt: new Date(Date.now() + cob.calendario.expiracao * 1000).toISOString(),
            createdAt: cob.calendario.criacao,
            raw: cob as unknown as Record<string, unknown>,
        };
    }

    private async createBoletoCharge(params: CreateChargeParams): Promise<ChargeResult> {
        const doc = params.customer.document.replace(/\D/g, '');
        // SIGCB — Caixa's boleto processing system
        const body = {
            CODIGO_BENEFICIARIO: this.config.apiKey,
            DATA_EMISSAO: new Date().toISOString().split('T')[0],
            DATA_VENCIMENTO: params.dueDate,
            VALOR: params.amountCents / 100,
            FLAG_ACEITE: 'S',
            IDENTIFICACAO_TITULO_EMPRESA: params.externalReference.slice(0, 25),
            PAGADOR: {
                CPF: doc.length <= 11 ? doc : undefined,
                CNPJ: doc.length > 11 ? doc : undefined,
                NOME: params.customer.name,
                ENDERECO: {
                    LOGRADOURO: params.customer.address?.street || '',
                    BAIRRO: params.customer.address?.neighborhood || '',
                    CIDADE: params.customer.address?.city || '',
                    UF: params.customer.address?.state || '',
                    CEP: params.customer.address?.postalCode?.replace(/\D/g, '') || '',
                },
            },
            FICHA_COMPENSACAO: {
                MENSAGENS: {
                    MENSAGEM: [params.boletoInstructions || params.description].filter(Boolean).slice(0, 2),
                },
            },
        };

        const boleto = await this.request<{
            NOSSO_NUMERO: string; LINHA_DIGITAVEL: string; CODIGO_BARRAS: string;
            URL: string;
        }>('POST', '/sibar/ManutencaoCobrancaBancaria/Boleto/Incluir', body);

        return {
            externalId: boleto.NOSSO_NUMERO || '',
            status: 'pending',
            provider: 'caixa',
            boletoDigitableLine: boleto.LINHA_DIGITAVEL,
            boletoBarcode: boleto.CODIGO_BARRAS,
            boletoUrl: boleto.URL,
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
                status: normalizeStatus('caixa', cob.status),
                amountCents: Math.round(parseFloat(cob.valor.original) * 100),
                raw: cob as unknown as Record<string, unknown>,
            };
        } catch {
            const boleto = await this.request<{ NOSSO_NUMERO: string; SITUACAO: string }>(
                'GET', `/sibar/ManutencaoCobrancaBancaria/Boleto/Consultar/${externalId}`,
            );
            return {
                externalId: boleto.NOSSO_NUMERO || externalId,
                status: boleto.SITUACAO === 'PAGO' ? 'confirmed' : 'pending',
                amountCents: 0,
                raw: boleto as unknown as Record<string, unknown>,
            };
        }
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PUT', `/sibar/ManutencaoCobrancaBancaria/Boleto/Baixar/${externalId}`, {});
    }

    async refundCharge(_id: string, _amount?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('caixa', 'Use PIX devolução for refunds');
    }

    // ─── Subscriptions/Recipients ──────────────────────────

    async createSubscription(_p: CreateSubscriptionParams): Promise<SubscriptionResult> { throw new PaymentAdapterError('caixa', 'Not supported'); }
    async cancelSubscription(_id: string): Promise<void> { throw new PaymentAdapterError('caixa', 'Not supported'); }
    async getSubscription(_id: string): Promise<SubscriptionStatus> { throw new PaymentAdapterError('caixa', 'Not supported'); }
    async createRecipient(_p: CreateRecipientParams): Promise<RecipientResult> { throw new PaymentAdapterError('caixa', 'Not supported'); }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const result = await this.request<{ saldo: number; saldoDisponivel?: number }>(
            'GET', '/contas/v1/saldo',
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
        }>('GET', `/contas/v1/extrato?dataInicio=${startDate}&dataFim=${endDate}`);

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
                status: result.status === 'CONCLUIDA' ? 'confirmed' : 'pending',
                raw: result as unknown as Record<string, unknown>,
            };
        }
        throw new PaymentAdapterError('caixa', 'Only PIX transfers via API');
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean { return true; }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { pix?: Array<{ txid: string; valor: string; horario: string }> };
        const pix = data.pix?.[0];
        return {
            provider: 'caixa',
            eventType: pix ? 'payment.confirmed' : 'payment.created',
            externalChargeId: pix?.txid || '',
            amountCents: pix ? Math.round(parseFloat(pix.valor) * 100) : undefined,
            paidAt: pix?.horario,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
