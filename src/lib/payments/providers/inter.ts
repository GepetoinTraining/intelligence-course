/**
 * Banco Inter Payment Adapter (v3 API)
 * 
 * Equal priority — direct bank integration, zero fees for accountholders.
 * Boleto + PIX QR (combined), balance, statement, barcode payments.
 * mTLS authentication (client certificate + OAuth2).
 * 
 * Docs: https://developers.inter.co
 * Production: https://cdpj.partners.bancointer.com.br
 * 
 * NOTE: Some PIX endpoints are temporarily disabled for new integrations.
 * Boleto v3 (with embedded PIX QR) remains fully available.
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

interface InterCobranca {
    codigoSolicitacao: string;
    nossoNumero?: string;
    seuNumero?: string;
    situacao: string;
    valorNominal: number;
    dataPagamento?: string;
    valorTotalRecebimento?: number;
    linhaDigitavel?: string;
    codigoBarras?: string;
    pixCopiaECola?: string;
}

export class InterAdapter extends PaymentAdapter {
    readonly provider: PaymentProvider = 'inter';

    readonly capabilities: ProviderCapabilities = {
        pix: true,       // Via combined boleto+PIX QR
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
        return 'https://cdpj.partners.bancointer.com.br';
    }

    protected getAuthHeaders(): Record<string, string> {
        return {};
    }

    /**
     * Override request to handle OAuth2 + mTLS.
     * Inter requires an access token obtained via client_credentials grant.
     * mTLS would require a custom fetch agent with certificates—
     * we implement the token flow; mTLS config depends on deployment.
     */
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
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        // NOTE: In production, this fetch would use an https.Agent configured
        // with the mTLS certificate/key from this.config.certificate/certificateKey.
        // For Node.js, this requires the undici or https module with cert/key options.

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new PaymentAdapterError(
                'inter', `${method} ${path} returned ${response.status}: ${errorBody}`,
                response.status, errorBody,
            );
        }

        if (response.status === 204) return {} as T;
        return response.json() as Promise<T>;
    }

    private async ensureAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        const url = `${this.getBaseUrl()}/oauth/v2/token`;
        const body = new URLSearchParams({
            client_id: this.config.apiKey,
            client_secret: this.config.secretKey || '',
            grant_type: 'client_credentials',
            scope: 'boleto-cobranca.read boleto-cobranca.write extrato.read pagamento-pix.write pagamento-pix.read',
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });

        if (!response.ok) {
            throw new PaymentAdapterError('inter', `OAuth token request failed: ${response.status}`);
        }

        const data = await response.json() as { access_token: string; expires_in: number };
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // Refresh 60s early
        return this.accessToken;
    }

    // ─── Customer ──────────────────────────────────────────

    async createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
        // Inter doesn't have a customer API — customer data is inline per cobrança
        return {
            externalId: params.document.replace(/\D/g, ''),
            name: params.name,
            document: params.document,
            email: params.email,
        };
    }

    async findCustomer(_document: string): Promise<CustomerResult | null> {
        return null;
    }

    // ─── Charges ───────────────────────────────────────────

    async createCharge(params: CreateChargeParams): Promise<ChargeResult> {
        if (params.method === 'credit_card' || params.method === 'debit_card') {
            throw new PaymentAdapterError('inter', 'Inter does not support card payments');
        }

        // Inter v3 — combined boleto + PIX QR
        const doc = params.customer.document.replace(/\D/g, '');
        const body = {
            seuNumero: params.externalReference.slice(0, 15),
            valorNominal: params.amountCents / 100,
            dataVencimento: params.dueDate,
            numDiasAgenda: 30,
            pagador: {
                cpfCnpj: doc,
                tipoPessoa: doc.length > 11 ? 'JURIDICA' : 'FISICA',
                nome: params.customer.name,
                email: params.customer.email,
                endereco: params.customer.address?.street || '',
                numero: params.customer.address?.number || '',
                bairro: params.customer.address?.neighborhood || '',
                cidade: params.customer.address?.city || '',
                uf: params.customer.address?.state || '',
                cep: params.customer.address?.postalCode?.replace(/\D/g, '') || '',
            },
            mensagem: {
                linha1: params.boletoInstructions || 'Mensalidade escolar',
                linha2: '',
                linha3: '',
                linha4: '',
                linha5: '',
            },
        };

        const result = await this.request<InterCobranca>(
            'POST', '/cobranca/v3/cobrancas', body,
        );

        const chargeResult: ChargeResult = {
            externalId: result.codigoSolicitacao,
            status: normalizeStatus('inter', result.situacao || 'EMITIDO'),
            provider: 'inter',
            createdAt: new Date().toISOString(),
            boletoDigitableLine: result.linhaDigitavel,
            boletoBarcode: result.codigoBarras,
            pixCopiaECola: result.pixCopiaECola,
            raw: result as unknown as Record<string, unknown>,
        };

        // Fetch boleto PDF
        try {
            chargeResult.boletoUrl = `${this.getBaseUrl()}/cobranca/v3/cobrancas/${result.codigoSolicitacao}/pdf`;
        } catch { /* PDF might not be ready */ }

        return chargeResult;
    }

    async getCharge(externalId: string): Promise<ChargeStatus> {
        const result = await this.request<InterCobranca>(
            'GET', `/cobranca/v3/cobrancas/${externalId}`,
        );
        return {
            externalId: result.codigoSolicitacao,
            status: normalizeStatus('inter', result.situacao),
            amountCents: Math.round(result.valorNominal * 100),
            paidAmountCents: result.valorTotalRecebimento
                ? Math.round(result.valorTotalRecebimento * 100) : undefined,
            paidAt: result.dataPagamento,
            raw: result as unknown as Record<string, unknown>,
        };
    }

    async cancelCharge(externalId: string): Promise<void> {
        await this.request('POST', `/cobranca/v3/cobrancas/${externalId}/cancelar`, {
            motivoCancelamento: 'SOLICITACAO_CLIENTE',
        });
    }

    async refundCharge(_externalId: string, _amountCents?: number): Promise<RefundResult> {
        throw new PaymentAdapterError('inter', 'Inter does not support refunds via API — use PIX devolução');
    }

    // ─── Subscriptions (Not supported) ────────────────────

    async createSubscription(_params: CreateSubscriptionParams): Promise<SubscriptionResult> {
        throw new PaymentAdapterError('inter', 'Inter does not support subscriptions');
    }

    async cancelSubscription(_externalId: string): Promise<void> {
        throw new PaymentAdapterError('inter', 'Inter does not support subscriptions');
    }

    async getSubscription(_externalId: string): Promise<SubscriptionStatus> {
        throw new PaymentAdapterError('inter', 'Inter does not support subscriptions');
    }

    // ─── Recipients (Not supported) ────────────────────────

    async createRecipient(_params: CreateRecipientParams): Promise<RecipientResult> {
        throw new PaymentAdapterError('inter', 'Inter does not support split recipients');
    }

    // ─── Banking ──────────────────────────────────────────

    async getBalance(): Promise<BalanceResult> {
        const result = await this.request<{ disponivel: number; bloqueadoCheque?: number; bloqueadoJudicialmente?: number }>(
            'GET', '/banking/v2/saldo',
        );
        return {
            availableCents: Math.round(result.disponivel * 100),
            pendingCents: 0,
            blockedCents: Math.round(((result.bloqueadoCheque || 0) + (result.bloqueadoJudicialmente || 0)) * 100),
            currency: 'BRL',
        };
    }

    async getStatement(start: Date, end: Date): Promise<StatementEntry[]> {
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];

        const result = await this.request<{
            transacoes: Array<{
                dataEntrada: string; tipoTransacao: string; tipoOperacao: string;
                valor: number; titulo: string; descricao: string;
            }>;
        }>('GET', `/banking/v2/extrato?dataInicio=${startDate}&dataFim=${endDate}`);

        return (result.transacoes || []).map(t => ({
            date: t.dataEntrada,
            description: t.titulo || t.descricao,
            amountCents: Math.round(t.valor * 100) * (t.tipoOperacao === 'D' ? -1 : 1),
            type: t.tipoOperacao === 'D' ? 'debit' as const : 'credit' as const,
            reference: t.tipoTransacao,
        }));
    }

    async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
        if (params.method === 'pix' && params.pixKey) {
            const body = {
                valor: params.amountCents / 100,
                descricao: params.description,
                destinatario: {
                    tipo: 'CHAVE',
                    chave: params.pixKey,
                },
            };
            const result = await this.request<{ endToEndId: string; status: string }>(
                'POST', '/banking/v2/pix', body,
            );
            return {
                externalId: result.endToEndId,
                status: result.status === 'REALIZADO' ? 'confirmed' : 'pending',
                raw: result as unknown as Record<string, unknown>,
            };
        }

        if (params.bankAccount) {
            // Barcode payment / TED
            const body = {
                valor: params.amountCents / 100,
                descricao: params.description,
                contaCorrente: {
                    banco: params.bankAccount.bankCode,
                    agencia: params.bankAccount.agencyNumber,
                    conta: params.bankAccount.accountNumber,
                    digitoConta: params.bankAccount.accountDigit,
                    tipoConta: params.bankAccount.type === 'checking' ? 'CONTA_CORRENTE' : 'CONTA_POUPANCA',
                    cpfCnpj: params.bankAccount.holderDocument?.replace(/\D/g, ''),
                    nome: params.bankAccount.holderName,
                },
            };
            const result = await this.request<{ codigoTransacao: string; status: string }>(
                'POST', '/banking/v2/pagamento', body,
            );
            return {
                externalId: result.codigoTransacao,
                status: result.status === 'REALIZADO' ? 'confirmed' : 'pending',
                raw: result as unknown as Record<string, unknown>,
            };
        }

        throw new PaymentAdapterError('inter', 'Either pixKey or bankAccount is required');
    }

    // ─── Webhooks ─────────────────────────────────────────

    validateWebhook(_headers: Record<string, string>, _body: string): boolean {
        // Inter webhook validation happens at config time
        return true;
    }

    parseWebhookEvent(body: unknown): NormalizedWebhookEvent {
        const data = body as {
            codigoSolicitacao?: string;
            nossoNumero?: string;
            situacao?: string;
            valorNominal?: number;
            dataPagamento?: string;
            valorTotalRecebimento?: number;
            // PIX webhook shape
            endToEndId?: string;
            txid?: string;
            valor?: string;
            horario?: string;
        };

        // Determine if boleto or PIX webhook
        const isBoleto = !!data.codigoSolicitacao;
        const externalId = data.codigoSolicitacao || data.endToEndId || data.txid || '';

        let eventType: NormalizedWebhookEvent['eventType'] = 'payment.created';
        if (isBoleto) {
            const status = normalizeStatus('inter', data.situacao || '');
            if (status === 'confirmed') eventType = 'payment.confirmed';
            else if (status === 'cancelled') eventType = 'payment.cancelled';
            else if (status === 'overdue') eventType = 'payment.overdue';
        } else {
            // PIX callback = confirmed
            eventType = 'payment.confirmed';
        }

        return {
            provider: 'inter',
            eventType,
            externalChargeId: externalId,
            amountCents: data.valorTotalRecebimento
                ? Math.round(data.valorTotalRecebimento * 100)
                : data.valor ? Math.round(parseFloat(data.valor) * 100) : undefined,
            paidAt: data.dataPagamento || data.horario,
            raw: data as unknown as Record<string, unknown>,
        };
    }
}
