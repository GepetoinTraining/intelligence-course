/**
 * NodeZero Payment System — Unified Types
 * 
 * These types normalize the disparate APIs of 14 Brazilian PSPs
 * and banks into a single coherent interface.
 * 
 * PSPs: Asaas, PagBank, Mercado Pago, Pagar.me
 * Banks: Inter, BB, Itaú, Bradesco, Santander, Caixa, Sicredi, Sicoob, Safra, C6 Bank
 */

// ─── Provider Registry ──────────────────────────────────────

export type PaymentProvider =
    // PSPs
    | 'asaas' | 'pagbank' | 'mercadopago' | 'pagarme'
    // Banks
    | 'inter' | 'bb' | 'itau' | 'bradesco' | 'santander'
    | 'caixa' | 'sicredi' | 'sicoob' | 'safra' | 'c6bank';

export type PaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'debit_card';

export type NormalizedStatus =
    | 'pending'      // Created, awaiting payment
    | 'processing'   // Being analyzed (card anti-fraud)
    | 'confirmed'    // Payment confirmed / received
    | 'overdue'      // Past due date
    | 'refunded'     // Fully refunded
    | 'partial_refund' // Partially refunded
    | 'cancelled'    // Cancelled before payment
    | 'failed'       // Payment attempt failed
    | 'chargeback';  // Disputed by cardholder

export type SubscriptionCycle =
    | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly'
    | 'quarterly' | 'semiannually' | 'annually';

export type WebhookEventType =
    | 'payment.created' | 'payment.confirmed' | 'payment.failed'
    | 'payment.overdue' | 'payment.refunded' | 'payment.chargeback'
    | 'payment.cancelled'
    | 'subscription.created' | 'subscription.renewed' | 'subscription.cancelled';

// ─── Customer ────────────────────────────────────────────────

export interface CreateCustomerParams {
    name: string;
    document: string;          // CPF or CNPJ (numbers only)
    email: string;
    phone?: string;            // +55 format
    address?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;           // UF (2 chars)
        postalCode: string;      // CEP
    };
}

export interface CustomerResult {
    externalId: string;         // Provider's customer ID
    name: string;
    document: string;
    email: string;
}

// ─── Charges ─────────────────────────────────────────────────

export interface CreateChargeParams {
    method: PaymentMethod;
    amountCents: number;
    description: string;
    dueDate: string;            // ISO 8601 date (YYYY-MM-DD)
    customer: CreateCustomerParams;
    externalReference: string;  // Our receivable ID

    // Card-specific (required when method = credit_card | debit_card)
    card?: {
        token?: string;           // Tokenized card (preferred)
        number?: string;          // Raw PAN (fallback)
        holderName?: string;
        expMonth?: string;
        expYear?: string;
        cvv?: string;
    };
    cardInstallments?: number;  // 1-12

    // PIX-specific overrides
    pixExpirationMinutes?: number;  // Default: 30

    // Boleto-specific overrides
    boletoInstructions?: string;    // Instructions printed on boleto

    // Split payment
    splits?: SplitRule[];

    // Metadata
    metadata?: Record<string, string>;
}

export interface SplitRule {
    recipientExternalId: string;
    amountCents?: number;       // Fixed amount (mutually exclusive with percentage)
    percentage?: number;        // 0-100 (mutually exclusive with amountCents)
    chargeProcessingFee?: boolean; // Should this recipient absorb fees?
}

export interface ChargeResult {
    externalId: string;
    status: NormalizedStatus;
    provider: PaymentProvider;

    // PIX
    pixQrCodeBase64?: string;
    pixCopiaECola?: string;
    pixExpiresAt?: string;

    // Boleto
    boletoUrl?: string;
    boletoBarcode?: string;
    boletoDigitableLine?: string;

    // Card
    cardAuthorizationCode?: string;
    cardLastFour?: string;
    cardBrand?: string;

    // Timestamps
    createdAt: string;
    paidAt?: string;

    // Raw provider response
    raw: Record<string, unknown>;
}

export interface ChargeStatus {
    externalId: string;
    status: NormalizedStatus;
    amountCents: number;
    paidAmountCents?: number;
    paidAt?: string;
    refundedAmountCents?: number;
    raw: Record<string, unknown>;
}

export interface RefundResult {
    externalId: string;
    refundId: string;
    amountCents: number;
    status: 'pending' | 'confirmed';
}

// ─── Subscriptions ───────────────────────────────────────────

export interface CreateSubscriptionParams {
    customer: CreateCustomerParams;
    amountCents: number;
    description: string;
    cycle: SubscriptionCycle;
    method: PaymentMethod;
    nextDueDate: string;        // ISO date
    endDate?: string;           // Auto-cancel after this date

    card?: {
        token?: string;
        number?: string;
        holderName?: string;
        expMonth?: string;
        expYear?: string;
        cvv?: string;
    };

    splits?: SplitRule[];
    externalReference: string;
    metadata?: Record<string, string>;
}

export interface SubscriptionResult {
    externalId: string;
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    provider: PaymentProvider;
    nextDueDate: string;
    raw: Record<string, unknown>;
}

export interface SubscriptionStatus {
    externalId: string;
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    cycle: string;
    amountCents: number;
    nextDueDate?: string;
    raw: Record<string, unknown>;
}

// ─── Recipients (Split) ─────────────────────────────────────

export interface CreateRecipientParams {
    name: string;
    document: string;
    email: string;
    bankAccount: {
        bankCode: string;         // ISPB or COMPE code
        agencyNumber: string;
        accountNumber: string;
        accountDigit: string;
        type: 'checking' | 'savings';
    };
    pixKey?: string;
    pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
}

export interface RecipientResult {
    externalId: string;
    status: 'active' | 'pending' | 'inactive';
    raw: Record<string, unknown>;
}

// ─── Banking ─────────────────────────────────────────────────

export interface BalanceResult {
    availableCents: number;
    pendingCents: number;       // Funds not yet settled
    blockedCents?: number;      // Held for disputes
    currency: string;           // Always 'BRL'
}

export interface StatementEntry {
    date: string;
    description: string;
    amountCents: number;        // Positive = credit, negative = debit
    type: 'credit' | 'debit';
    reference?: string;
    balance?: number;
}

export interface CreateTransferParams {
    recipientDocument?: string;
    pixKey?: string;
    pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    bankAccount?: {
        bankCode: string;
        agencyNumber: string;
        accountNumber: string;
        accountDigit: string;
        type: 'checking' | 'savings';
        holderName: string;
        holderDocument: string;
    };
    amountCents: number;
    description: string;
    method: 'pix' | 'ted';
}

export interface TransferResult {
    externalId: string;
    status: 'pending' | 'confirmed' | 'failed';
    raw: Record<string, unknown>;
}

// ─── Webhooks ────────────────────────────────────────────────

export interface NormalizedWebhookEvent {
    provider: PaymentProvider;
    eventType: WebhookEventType;
    externalChargeId: string;
    externalReference?: string;
    amountCents?: number;
    paidAt?: string;
    raw: Record<string, unknown>;
}

// ─── Gateway Config (from DB) ────────────────────────────────

export interface GatewayConfig {
    id: string;
    provider: PaymentProvider;
    apiKey: string;             // Decrypted
    secretKey?: string;         // Decrypted
    webhookSecret?: string;     // Decrypted
    sandboxMode: boolean;
    // Inter mTLS
    certificate?: string;      // Decrypted PEM
    certificateKey?: string;   // Decrypted PEM
    // OAuth tokens (PagBank, MercadoPago)
    oauthAccessToken?: string;
    oauthRefreshToken?: string;
    oauthExpiresAt?: number;
}

// ─── Adapter Capability Flags ────────────────────────────────

export interface ProviderCapabilities {
    pix: boolean;
    boleto: boolean;
    creditCard: boolean;
    debitCard: boolean;
    recurring: boolean;
    split: boolean;
    transfer: boolean;
    balance: boolean;
    statement: boolean;
}
