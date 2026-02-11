/**
 * Itaú Unibanco Payment Adapter
 * 
 * Second largest private bank. Full API suite with
 * Bolecode (boleto + QR code), PIX, saldo, extrato.
 * 
 * Auth: OAuth2 + dynamic mTLS certificate
 * Docs: devportal.itau.com.br
 * Sandbox: devportal.itau.com.br/sandboxapi/
 * Production: secure.api.itau (per API docs)
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

interface ItauBoleto {
    dados_individuais_boleto: Array<{
        numero_nosso_numero: string;
        numero_linha_digitavel: string;
        codigo_barras: string;
        data_vencimento: string;
        valor_titulo: number;
        url_boleto?: string;
        qr_code?: { emv: string; url_qrcode: string };
    }>;
}

export class ItauAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'itau';

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
            ? 'https://devportal.itau.com.br/sandboxapi'
            : 'https://secure.api.itau';
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

        // NOTE: Production requires mTLS with a dynamic certificate generated
        // via the Itaú developer portal. The cert/key would be injected via
        // this.config.certificate / this.config.certificateKey

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new PaymentAdapterError('itau', `${method} ${path} → ${response.status}: ${errorBody}`, response.status, errorBody);
        }
        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) return this.accessToken;

        const authUrl = this.config.sandboxMode
            ? 'https://devportal.itau.com.br/api/jwt'
            : 'https://sts.itau.com.br/api/oauth/token';

        const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.apiKey,
                client_secret: this.config.secretKey || '',
            }).toString(),
        });

        if (!response.ok) throw new PaymentAdapterError('itau', `OAuth failed: ${response.status}`);
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
            chave: this.config.oauthAccessToken || '', // PIX key
            infoAdicionais: [{ nome: 'Referencia', valor: params.externalReference.slice(0, 70) }],
        };

        const cob = await this.request<{
            txid: string; status: string; pixCopiaECola: string;
            location: string; calendario: { criacao: string; expiracao: number };
        }>('PUT', `/pix/v2/cob/${txid}`, body);

        return {
            externalId: cob.txid,
            status: normalizeStatus('itau', cob.status || 'ATIVA'),
            provider: 'itau',
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
            etapa_processo_boleto: 'efetivacao',
            beneficiario: { id_beneficiario: this.config.apiKey.split(':')[0] || '' },
            dados_individuais_boleto: [{
                id_beneficiario: this.config.apiKey.split(':')[0] || '',
                dados_qrcode: { chave: this.config.oauthAccessToken || '' }, // Bolecode: boleto+QR
                pagador: {
                    pessoa: {
                        nome_pessoa: params.customer.name,
                        tipo_pessoa: doc.length > 11 ? 'J' : 'F',
                        ...(doc.length > 11 ? { cnpj: doc } : { cpf: doc }),
                    },
                    endereco: {
                        nome_logradouro: params.customer.address?.street || '',
                        nome_bairro: params.customer.address?.neighborhood || '',
                        nome_cidade: params.customer.address?.city || '',
                        sigla_UF: params.customer.address?.state || '',
                        numero_CEP: params.customer.address?.postalCode?.replace(/\D/g, '') || '',
                    },
                },
                data_vencimento: params.dueDate,
                valor_titulo: params.amountCents / 100,
                texto_seu_numero: params.externalReference.slice(0, 15),
                texto_uso_beneficiario: params.description.slice(0, 25),
            }],
        };

        const boleto = await this.request<ItauBoleto>('POST', '/boletos/v2/boletos', body);
        const b = boleto.dados_individuais_boleto?.[0];

        return {
            externalId: b?.numero_nosso_numero || '',
            status: 'pending',
            provider: 'itau',
            boletoDigitableLine: b?.numero_linha_digitavel,
            boletoBarcode: b?.codigo_barras,
            boletoUrl: b?.url_boleto,
            pixCopiaECola: b?.qr_code?.emv,
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
                status: normalizeStatus('itau', cob.status),
                amountCents: Math.round(parseFloat(cob.valor.original) * 100),
                raw: cob as unknown as Record<string, unknown>,
            };
        } catch {
            const boleto = await this.request<{ dados_individuais_boleto: Array<{ numero_nosso_numero: string; situacao_boleto: string }> }>(
                'GET', `/boletos/v2/boletos/${externalId}`,
            );
            const b = boleto.dados_individuais_boleto?.[0];
            return {
                externalId: b?.numero_nosso_numero || externalId,
                status: b?.situacao_boleto === 'PAGO' ? 'confirmed' : 'pending',
                amountCents: 0,
                raw: boleto as unknown as Record<string, unknown>,
            };
        }
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('PATCH', `/boletos/v2/boletos/${externalId}`, { operacao: 'BAIXA' });
    }

    async refundCharge(_id: string, _amount?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('itau', 'Use PIX devolução for refunds');
    }

    // ─── Subscriptions (Not supported) ─────────────────────

    async createSubscription(_p: CreateSubscriptionParams): Promise<SubscriptionResult> {
        throw new PaymentAdapterError('itau', 'Not supported');
    }
    async cancelSubscription(_id: string): Promise<void> {
        throw new PaymentAdapterError('itau', 'Not supported');
    }
    async getSubscription(_id: string): Promise<SubscriptionStatus> {
        throw new PaymentAdapterError('itau', 'Not supported');
    }

    // ─── Recipients (Not supported) ────────────────────────

    async createRecipient(_p: CreateRecipientParams): Promise<RecipientResult> {
        throw new PaymentAdapterError('itau', 'Not supported');
    }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const result = await this.request<{ saldo: number; saldo_disponivel?: number }>(
            'GET', '/saldo/v1/saldo',
        );
        return {
            availableCents: Math.round((result.saldo_disponivel || result.saldo) * 100),
            pendingCents: 0,
            currency: 'BRL',
        };
    }

    async getStatement(start: Date, end: Date): Promise<StatementEntry[]> {
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];
        const result = await this.request<{
            lancamentos: Array<{
                data_lancamento: string; descricao: string; valor: number;
                tipo_lancamento: string; numero_documento?: string;
            }>;
        }>('GET', `/extrato/v1/extrato?dataInicio=${startDate}&dataFim=${endDate}`);

        return (result.lancamentos || []).map(l => ({
            date: l.data_lancamento,
            description: l.descricao,
            amountCents: Math.round(l.valor * 100) * (l.tipo_lancamento === 'D' ? -1 : 1),
            type: l.tipo_lancamento === 'D' ? 'debit' as const : 'credit' as const,
            reference: l.numero_documento,
        }));
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        if (params.method === 'pix' && params.pixKey) {
            const body = {
                valor: (params.amountCents / 100).toFixed(2),
                descricao: params.description,
                chave: params.pixKey,
            };
            const result = await this.request<{ endToEndId: string; status: string }>(
                'POST', '/pix/v2/pix', body,
            );
            return {
                externalId: result.endToEndId,
                status: result.status === 'REALIZADO' ? 'confirmed' : 'pending',
                raw: result as unknown as Record<string, unknown>,
            };
        }
        throw new PaymentAdapterError('itau', 'Only PIX transfers are supported via API');
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean { return true; }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as { pix?: Array<{ txid: string; valor: string; horario: string }> };
        const pix = data.pix?.[0];
        return {
            provider: 'itau',
            eventType: pix ? 'payment.confirmed' : 'payment.created',
            externalChargeId: pix?.txid || '',
            amountCents: pix ? Math.round(parseFloat(pix.valor) * 100) : undefined,
            paidAt: pix?.horario,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
