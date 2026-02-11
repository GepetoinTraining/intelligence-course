/**
 * NodeZero Payment System — Public API
 * 
 * Barrel export for the entire payment adapter layer.
 * 14 providers: 4 PSPs + 10 Banks
 */

// Core
export { PaymentAdapter, PaymentAdapterError } from './adapter';
export { getAdapterForOrg, createAdapter, createAdapterFromGateway, getSupportedProviders } from './factory';
export { normalizeStatus, isTerminalStatus, isSuccessStatus } from './status-map';

// Types
export type {
    PaymentProvider, PaymentMethod, NormalizedStatus, SubscriptionCycle, WebhookEventType,
    CreateCustomerParams, CustomerResult,
    CreateChargeParams, ChargeResult, ChargeStatus, RefundResult, SplitRule,
    CreateSubscriptionParams, SubscriptionResult, SubscriptionStatus,
    CreateRecipientParams, RecipientResult,
    BalanceResult, StatementEntry, CreateTransferParams, TransferResult,
    NormalizedWebhookEvent, GatewayConfig, ProviderCapabilities,
} from './types';

// PSP adapters
export { AsaasAdapter } from './providers/asaas';
export { PagBankAdapter } from './providers/pagbank';
export { MercadoPagoAdapter } from './providers/mercadopago';
export { PagarMeAdapter } from './providers/pagarme';

// Bank adapters
export { InterAdapter } from './providers/inter';
export { BBAdapter } from './providers/bb';
export { ItauAdapter } from './providers/itau';
export { BradescoAdapter } from './providers/bradesco';
export { SantanderAdapter } from './providers/santander';
export { CaixaAdapter } from './providers/caixa';
export { SicrediAdapter } from './providers/sicredi';
export { SicoobAdapter } from './providers/sicoob';
export { SafraAdapter } from './providers/safra';
export { C6BankAdapter } from './providers/c6bank';
