/**
 * Banco do Brasil Payment Adapter (API v2)
 * 
 * Largest Brazilian bank by assets. Full API suite:
 * boleto cobrança, PIX v2, extratos, pagamentos em lote.
 * 
 * Auth: OAuth2 client_credentials
 * Docs: developers.bb.com.br
 * Sandbox: api.sandbox.bb.com.br
 * Production: api.bb.com.br
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

interface BBBoleto {
    numero: string;
    numeroCarteira: number;
    codigoLinhaDigitavel: string;
    codigoBarraNumerico: string;
    quantidadeOcorrenciaRegistrada?: number;
    codigoEstadoTituloCobranca: number;
    urlBoleto?: string;
    qrCode?: { url: string; txId: string; emv: string };
}

interface BBPixCob {
    txid: string;
    status: string;
    valor: { original: string };
    pixCopiaECola: string;
    location: string;
    calendario: { criacao: string; expiracao: number };
}

export class BBAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'bb';

    readonly capabilities: ProviderCapabilities = {
        pix: true,
        boleto: true,
        creditCard: false,
        debitCard: false,
        recurring: false,
        split: false,
        transfer: true,
        balance: false,     // Balance is WIP on BB API
        statement: true,
    };

    private accessToken: string | null = null;
    private tokenExpiresAt = 0;

    protected getBaseUrl(): string {
        return this.config.sandboxMode
            ? 'https://api.sandbox.bb.com.br'
            : 'https://api.bb.com.br';
    }

    protected getAuthHeaders(): Record<string, string> {
        return {};
    }

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
            throw new PaymentAdapterError('bb', `${method} ${path} → ${response.status}: ${errorBody}`, response.status, errorBody);
        }
        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;

        const authUrl = this.config.sandboxMode
            ? 'https://oauth.sandbox.bb.com.br/oauth/token'
            : 'https://oauth.bb.com.br/oauth/token';

        const encoded = Buffer.from(`${this.config.apiKey}:${this.config.secretKey || ''}`).toString('base64');
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${encoded}`,
            },
            body: 'grant_type=client_credentials&scope=cobrancas.boletos-requisicao cobrancas.boletos-info pix.cob-write pix.cob-read extratos.lancamentos-read',
        });

        if (!response.ok) throw new PaymentAdapterError('bb', `OAuth failed: ${response.status}`);
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
        const body = {
            calendario: { expiracao: (params.pixExpirationMinutes || 30) * 60 },
            devedor: {
                cpf: params.customer.document.replace(/\D/g, '').length <= 11
                    ? params.customer.document.replace(/\D/g, '') : undefined,
                cnpj: params.customer.document.replace(/\D/g, '').length > 11
                    ? params.customer.document.replace(/\D/g, '') : undefined,
                nome: params.customer.name,
            },
            valor: { original: (params.amountCents / 100).toFixed(2) },
            chave: this.config.secretKey || '', // PIX key of the receiving account
            infoAdicionais: [{ nome: 'Ref', valor: params.externalReference.slice(0, 70) }],
        };

        const cob = await this.request<BBPixCob>('PUT', `/pix/v2/cob/${txid}`, body);
        return {
            externalId: cob.txid,
            status: normalizeStatus('bb', cob.status),
            provider: 'bb',
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
            numeroConvenio: this.config.apiKey.split(':')[0] || '',
            numeroCarteira: 17,
            descricaoTipoTitulo: 'DM',
            indicadorAceiteTituloCobranca: 'N',
            codigoTipoJurosMora: 0,
            codigoTipoMulta: 0,
            dataEmissaoTituloCobranca: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            dataVencimentoTituloCobranca: params.dueDate.replace(/-/g, '.'),
            valorOriginalTituloCobranca: params.amountCents / 100,
            indicadorPermissaoRecebimentoParcial: 'N',
            identificacaoBoletoEmpresa: params.externalReference.slice(0, 25),
            pagador: {
                tipoInscricao: doc.length > 11 ? 2 : 1,
                numeroInscricao: parseInt(doc),
                nome: params.customer.name,
                endereco: params.customer.address?.street || '',
                cep: parseInt((params.customer.address?.postalCode || '00000000').replace(/\D/g, '')),
                cidade: params.customer.address?.city || '',
                bairro: params.customer.address?.neighborhood || '',
                uf: params.customer.address?.state || '',
            },
            indicadorPix: 'S', // Generate PIX QR on the boleto
        };

        const boleto = await this.request<BBBoleto>('POST', '/cobrancas/v2/boletos', body);
        return {
            externalId: boleto.numero,
            status: 'pending',
            provider: 'bb',
            boletoDigitableLine: boleto.codigoLinhaDigitavel,
            boletoBarcode: boleto.codigoBarraNumerico,
            boletoUrl: boleto.urlBoleto,
            pixCopiaECola: boleto.qrCode?.emv,
            createdAt: new Date().toISOString(),
            raw: boleto as unknown as Record<string, unknown>,
        };
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        // Try PIX first, fallback to boleto
        try {
            const cob = await this.request<BBPixCob>('GET', `/pix/v2/cob/${externalId}`);
            return {
                externalId: cob.txid,
                status: normalizeStatus('bb', cob.status),
                amountCents: Math.round(parseFloat(cob.valor.original) * 100),
                raw: cob as unknown as Record<string, unknown>,
            };
        } catch {
            const boleto = await this.request<BBBoleto>('GET', `/cobrancas/v2/boletos/${externalId}`);
            return {
                externalId: boleto.numero,
                status: boleto.codigoEstadoTituloCobranca === 6 ? 'confirmed' : 'pending',
                amountCents: 0,
                raw: boleto as unknown as Record<string, unknown>,
            };
        }
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PATCH', `/cobrancas/v2/boletos/${externalId}`, {
            codigoEstadoTituloCobranca: 5,
        });
    }

    async refundCharge(_externalId: string, _amountCents?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('bb', 'BB does not support refunds via boleto API — use PIX devolução');
    }

    // ─── Subscriptions (Not supported) ────────────────────

    async createSubscription(_p: CreateSubscriptionParams): Promise<SubscriptionResult> {
        throw new PaymentAdapterError('bb', 'BB does not support subscriptions');
    }
    async cancelSubscription(_id: string): Promise<void> {
        throw new PaymentAdapterError('bb', 'BB does not support subscriptions');
    }
    async getSubscription(_id: string): Promise<SubscriptionStatus> {
        throw new PaymentAdapterError('bb', 'BB does not support subscriptions');
    }

    // ─── Recipients (Not supported) ────────────────────────

    async createRecipient(_p: CreateRecipientParams): Promise<RecipientResult> {
        throw new PaymentAdapterError('bb', 'BB does not support split recipients');
    }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        throw new PaymentAdapterError('bb', 'BB balance API is still WIP — check developers.bb.com.br');
    }

    async getStatement(start: Date, end: Date): Promise<StatementEntry[]> {
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];
        const result = await this.request<{
            lancamentos: Array<{
                dataLancamento: string; descricaoLancamento: string;
                valorLancamento: number; indicadorTipoLancamento: string;
                numeroDocumento: string;
            }>;
        }>('GET', `/extratos/v1/lancamentos?dataInicio=${startDate}&dataFim=${endDate}`);

        return (result.lancamentos || []).map(l => ({
            date: l.dataLancamento,
            description: l.descricaoLancamento,
            amountCents: Math.round(l.valorLancamento * 100) * (l.indicadorTipoLancamento === 'D' ? -1 : 1),
            type: l.indicadorTipoLancamento === 'D' ? 'debit' as const : 'credit' as const,
            reference: l.numeroDocumento,
        }));
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        const body = {
            pagamentos: [{
                tipoPagamento: params.method === 'pix' ? 128 : 18, // 128=PIX, 18=TED
                valorPagamento: params.amountCents / 100,
                descricaoPagamento: params.description,
                ...(params.pixKey ? {
                    campoLivre: params.pixKey,
                } : {
                    codigoBancoFavorecido: params.bankAccount?.bankCode,
                    agenciaFavorecido: params.bankAccount?.agencyNumber,
                    contaPagamentoFavorecido: params.bankAccount?.accountNumber,
                    digitoVerificadorContaPagamento: params.bankAccount?.accountDigit,
                    cpfCnpjFavorecido: params.bankAccount?.holderDocument?.replace(/\D/g, ''),
                    nomeFavorecido: params.bankAccount?.holderName,
                }),
            }],
        };

        const result = await this.request<{ codigoSolicitacao: string; estadoRequisicao: number }>(
            'POST', '/pagamentos/v1/lote-pagamentos', body,
        );
        return {
            externalId: result.codigoSolicitacao,
            status: result.estadoRequisicao === 1 ? 'confirmed' : 'pending',
            raw: result as unknown as Record<string, unknown>,
        };
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean { return true; }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { pix?: Array<{ txid: string; valor: string; horario: string }> };
        const pix = data.pix?.[0];
        return {
            provider: 'bb',
            eventType: pix ? 'payment.confirmed' : 'payment.created',
            externalChargeId: pix?.txid || '',
            amountCents: pix ? Math.round(parseFloat(pix.valor) * 100) : undefined,
            paidAt: pix?.horario,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
