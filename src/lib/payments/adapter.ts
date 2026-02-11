/**
 * NodeZero Payment System — Abstract Adapter
 * 
 * All provider implementations extend this class.
 * Provides shared HTTP helpers and error handling.
 */

import type {
    PaymentProvider, GatewayConfig, ProviderCapabilities,
    CreateCustomerParams, CustomerResult,
    CreateChargeParams, ChargeResult, ChargeStatus, RefundResult,
    CreateSubscriptionParams, SubscriptionResult, SubscriptionStatus,
    CreateRecipientParams, RecipientResult,
    BalanceResult, StatementEntry, CreateTransferParams, TransferResult,
    NormalizedWebhookEvent,
} from './types';

export abstract class PaymentAdapter {
    protected config: GatewayConfig;

    constructor(config: GatewayConfig) {
        this.config = config;
    }

    /** Provider identifier */
    abstract readonly provider: PaymentProvider;

    /** What this provider supports */
    abstract readonly capabilities: ProviderCapabilities;

    // ─── Customer ──────────────────────────────────────────

    abstract createCustomer(params: CreateCustomerParams): Promise<CustomerResult>;
    abstract findCustomer(document: string): Promise<CustomerResult | null>;

    // ─── Charges ───────────────────────────────────────────

    abstract createCharge(params: CreateChargeParams): Promise<ChargeResult>;
    abstract getCharge(externalId: string): Promise<ChargeStatus>;
    abstract cancelCharge(externalId: string): Promise<void>;
    abstract refundCharge(externalId: string, amountCents?: number): Promise<RefundResult>;

    // ─── Subscriptions ────────────────────────────────────

    abstract createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;
    abstract cancelSubscription(externalId: string): Promise<void>;
    abstract getSubscription(externalId: string): Promise<SubscriptionStatus>;

    // ─── Recipients (Split) ────────────────────────────────

    abstract createRecipient(params: CreateRecipientParams): Promise<RecipientResult>;

    // ─── Banking ──────────────────────────────────────────

    abstract getBalance(): Promise<BalanceResult>;
    abstract getStatement(start: Date, end: Date): Promise<StatementEntry[]>;
    abstract createTransfer(params: CreateTransferParams): Promise<TransferResult>;

    // ─── Webhooks ─────────────────────────────────────────

    abstract validateWebhook(headers: Record<string, string>, body: string): boolean;
    abstract parseWebhookEvent(body: unknown): NormalizedWebhookEvent;

    // ─── Shared Helpers ───────────────────────────────────

    /** Get the correct base URL based on sandbox mode */
    protected abstract getBaseUrl(): string;

    /** Standard HTTP request with auth headers */
    protected async request<T>(
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        path: string,
        body?: unknown,
        extraHeaders?: Record<string, string>,
    ): Promise<T> {
        const url = `${this.getBaseUrl()}${path}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...this.getAuthHeaders(),
            ...extraHeaders,
        };

        const options: RequestInit = { method, headers };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new PaymentAdapterError(
                this.provider,
                `${method} ${path} returned ${response.status}: ${errorBody}`,
                response.status,
                errorBody,
            );
        }

        // Some endpoints return no body (204)
        if (response.status === 204) return {} as T;

        return response.json() as Promise<T>;
    }

    /** Provider-specific auth headers */
    protected abstract getAuthHeaders(): Record<string, string>;
}

/**
 * Structured error from a payment adapter.
 * Contains provider name, HTTP status, and raw error body.
 */
export class PaymentAdapterError extends Error {
    constructor(
        public readonly provider: string,
        message: string,
        public readonly httpStatus?: number,
        public readonly responseBody?: string,
    ) {
        super(`[${provider}] ${message}`);
        this.name = 'PaymentAdapterError';
    }
}
