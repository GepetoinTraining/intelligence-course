/**
 * Bradesco Payment Adapter
 * 
 * 120+ APIs launched August 2025 at api.bradesco.
 * Boleto, PIX, saldo, extrato, transfers.
 * 
 * Auth: OAuth2
 * Docs: api.bradesco
 * Production: api.bradesco
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

export class BradescoAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'bradesco';

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
            ? 'https://proxy.api.prebanco.com.br'
            : 'https://openapi.bradesco.com.br';
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
            throw new PaymentAdapterError('bradesco', `${method} ${path} → ${response.status}: ${errorBody}`, response.status, errorBody);
        }
        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;

        const authUrl = this.config.sandboxMode
            ? 'https://proxy.api.prebanco.com.br/auth/server/v1.1/token'
            : 'https://openapi.bradesco.com.br/auth/server/v1.1/token';

        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.apiKey,
                client_secret: this.config.secretKey || '',
            }).toString(),
        });

        if (!response.ok) throw new PaymentAdapterError('bradesco', `OAuth failed: ${response.status}`);
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
        }>('PUT', `/v1/spi/pix/api/v2/cob/${txid}`, body);

        return {
            externalId: cob.txid,
            status: normalizeStatus('bradesco', cob.status || 'ATIVA'),
            provider: 'bradesco',
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
            nuCPFCNPJ: doc,
            filialCPFCNPJ: '0001',
            ctrlCPFCNPJ: '09',
            idProduto: '09',
            nuNegociacao: this.config.apiKey.split(':')[0] || '',
            dtEmissaoTitulo: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            dtVencimentoTitulo: params.dueDate.replace(/-/g, '.'),
            vlNominalTitulo: params.amountCents / 100,
            cdEspecieTitulo: '04', // DM
            nomePagador: params.customer.name,
            logradouroPagador: params.customer.address?.street || '',
            nuLogradouroPagador: params.customer.address?.number || '',
            cepPagador: parseInt((params.customer.address?.postalCode || '00000000').replace(/\D/g, '')),
            municipioPagador: params.customer.address?.city || '',
            ufPagador: params.customer.address?.state || '',
            cdIndCpfcnpjPagador: doc.length > 11 ? '2' : '1',
            nuCpfcnpjPagador: doc,
        };

        const boleto = await this.request<{
            cdErro: number; linhaDigitavel: string; codigoBarras: string;
            nossoNumero: string; urlBoleto?: string;
        }>('POST', '/v1/boleto-hibrido/registrar-boleto', body);

        return {
            externalId: boleto.nossoNumero || '',
            status: 'pending',
            provider: 'bradesco',
            boletoDigitableLine: boleto.linhaDigitavel,
            boletoBarcode: boleto.codigoBarras,
            boletoUrl: boleto.urlBoleto,
            createdAt: new Date().toISOString(),
            raw: boleto as unknown as Record<string, unknown>,
        };
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        try {
            const cob = await this.request<{ txid: string; status: string; valor: { original: string } }>(
                'GET', `/v1/spi/pix/api/v2/cob/${externalId}`,
            );
            return {
                externalId: cob.txid,
                status: normalizeStatus('bradesco', cob.status),
                amountCents: Math.round(parseFloat(cob.valor.original) * 100),
                raw: cob as unknown as Record<string, unknown>,
            };
        } catch {
            return { externalId, status: 'pending', amountCents: 0, raw: {} };
        }
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PATCH', `/v1/boleto-hibrido/boletos/${externalId}/baixar`, {});
    }

    async refundCharge(_id: string, _amount?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('bradesco', 'Use PIX devolução for refunds');
    }

    // ─── Subscriptions/Recipients (Not supported) ──────────

    async createSubscription(_p: CreateSubscriptionParams): Promise<SubscriptionResult> { throw new PaymentAdapterError('bradesco', 'Not supported'); }
    async cancelSubscription(_id: string): Promise<void> { throw new PaymentAdapterError('bradesco', 'Not supported'); }
    async getSubscription(_id: string): Promise<SubscriptionStatus> { throw new PaymentAdapterError('bradesco', 'Not supported'); }
    async createRecipient(_p: CreateRecipientParams): Promise<RecipientResult> { throw new PaymentAdapterError('bradesco', 'Not supported'); }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const result = await this.request<{ saldo: { disponivel: number; bloqueado?: number } }>(
            'GET', '/v1/contas/saldo',
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
                tipoLancamento: string; documento?: string;
            }>;
        }>('GET', `/v1/contas/extrato?dataInicio=${startDate}&dataFim=${endDate}`);

        return (result.lancamentos || []).map(l => ({
            date: l.dataLancamento,
            description: l.descricao,
            amountCents: Math.round(l.valor * 100) * (l.tipoLancamento === 'D' ? -1 : 1),
            type: l.tipoLancamento === 'D' ? 'debit' as const : 'credit' as const,
            reference: l.documento,
        }));
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        if (params.method === 'pix' && params.pixKey) {
            const result = await this.request<{ endToEndId: string; status: string }>(
                'POST', '/v1/spi/pix/pagamento', {
                valor: (params.amountCents / 100).toFixed(2),
                descricao: params.description,
                chave: params.pixKey,
            },
            );
            return {
                externalId: result.endToEndId,
                status: result.status === 'CONCLUIDO' ? 'confirmed' : 'pending',
                raw: result as unknown as Record<string, unknown>,
            };
        }
        throw new PaymentAdapterError('bradesco', 'Only PIX transfers via API');
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean { return true; }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { pix?: Array<{ txid: string; valor: string; horario: string }> };
        const pix = data.pix?.[0];
        return {
            provider: 'bradesco',
            eventType: pix ? 'payment.confirmed' : 'payment.created',
            externalChargeId: pix?.txid || '',
            amountCents: pix ? Math.round(parseFloat(pix.valor) * 100) : undefined,
            paidAt: pix?.horario,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
