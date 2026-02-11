/**
 * NodeZero Payment System — Status Normalization
 * 
 * Maps each provider's proprietary status strings
 * to our unified NormalizedStatus enum.
 * 
 * Covers 4 PSPs + 10 Banks = 14 providers.
 * 
 * Brazilian banks largely use the same status vocabulary
 * (PIX BACEN standard + CNAB boleto conventions), so they
 * share a common BANK_PIX_STATUS_MAP for PIX and per-bank
 * overrides for boleto statuses.
 */

import type { NormalizedStatus, PaymentProvider } from './types';

// ─── PSP Status Maps ──────────────────────────────────────

const ASAAS_STATUS_MAP: Record<string, NormalizedStatus> = {
    PENDING: 'pending',
    RECEIVED: 'confirmed',
    CONFIRMED: 'confirmed',
    OVERDUE: 'overdue',
    REFUNDED: 'refunded',
    RECEIVED_IN_CASH: 'confirmed',
    REFUND_REQUESTED: 'refunded',
    REFUND_IN_PROGRESS: 'refunded',
    CHARGEBACK_REQUESTED: 'chargeback',
    CHARGEBACK_DISPUTE: 'chargeback',
    AWAITING_CHARGEBACK_REVERSAL: 'chargeback',
    DUNNING_REQUESTED: 'overdue',
    DUNNING_RECEIVED: 'confirmed',
    AWAITING_RISK_ANALYSIS: 'processing',
    DELETED: 'cancelled',
};

const PAGBANK_STATUS_MAP: Record<string, NormalizedStatus> = {
    WAITING: 'pending',
    IN_ANALYSIS: 'processing',
    PAID: 'confirmed',
    AUTHORIZED: 'processing',
    AVAILABLE: 'confirmed',
    DECLINED: 'failed',
    CANCELED: 'cancelled',
    DISPUTE: 'chargeback',
    REFUNDED: 'refunded',
};

const MERCADOPAGO_STATUS_MAP: Record<string, NormalizedStatus> = {
    pending: 'pending',
    approved: 'confirmed',
    authorized: 'processing',
    in_process: 'processing',
    in_mediation: 'chargeback',
    rejected: 'failed',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'chargeback',
};

const PAGARME_STATUS_MAP: Record<string, NormalizedStatus> = {
    pending: 'pending',
    paid: 'confirmed',
    canceled: 'cancelled',
    processing: 'processing',
    failed: 'failed',
    overpaid: 'confirmed',
    underpaid: 'pending',
    chargedback: 'chargeback',
    with_error: 'failed',
    refunded: 'refunded',
    partial_void: 'partial_refund',
};

// ─── Bank Status Maps ─────────────────────────────────────

/**
 * Common PIX status vocabulary defined by BACEN.
 * Used by all Brazilian banks for PIX cob operations.
 */
const BANK_PIX_STATUS_MAP: Record<string, NormalizedStatus> = {
    ATIVA: 'pending',
    CONCLUIDA: 'confirmed',
    REMOVIDA_PELO_USUARIO_RECEBEDOR: 'cancelled',
    REMOVIDA_PELO_PSP: 'cancelled',
    // PIX payment / transfer completion statuses
    REALIZADO: 'confirmed',
    EM_PROCESSAMENTO: 'processing',
    NAO_REALIZADO: 'failed',
};

/**
 * Shared bank boleto statuses.
 * Most banks use similar CNAB/FEBRABAN conventions.
 */
const BANK_BOLETO_STATUS_MAP: Record<string, NormalizedStatus> = {
    // Common across most banks
    EMITIDO: 'pending',
    REGISTRADO: 'pending',
    A_RECEBER: 'pending',
    EM_ABERTO: 'pending',
    EMABERTO: 'pending',
    ABERTO: 'pending',
    RECEBIDO: 'confirmed',
    PAGO: 'confirmed',
    LIQUIDADO: 'confirmed',
    CANCELADO: 'cancelled',
    BAIXADO: 'cancelled',
    EXPIRADO: 'overdue',
    VENCIDO: 'overdue',
    EM_PROCESSAMENTO: 'processing',
    MARCADO_RECEBIDO: 'confirmed',
};

const INTER_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

const BB_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
    // BB-specific boleto state codes
    '1': 'pending',    // Normal
    '2': 'pending',    // Movimento carteira
    '5': 'cancelled',  // Baixado
    '6': 'confirmed',  // Liquidado
    '7': 'pending',    // Abatimento
};

const ITAU_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

const BRADESCO_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
    CONCLUIDO: 'confirmed',
};

const SANTANDER_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

const CAIXA_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

const SICREDI_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

const SICOOB_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

const SAFRA_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

const C6BANK_STATUS_MAP: Record<string, NormalizedStatus> = {
    ...BANK_BOLETO_STATUS_MAP,
    ...BANK_PIX_STATUS_MAP,
};

// ─── Registry ─────────────────────────────────────────────

const STATUS_MAPS: Record<PaymentProvider, Record<string, NormalizedStatus>> = {
    // PSPs
    asaas: ASAAS_STATUS_MAP,
    pagbank: PAGBANK_STATUS_MAP,
    mercadopago: MERCADOPAGO_STATUS_MAP,
    pagarme: PAGARME_STATUS_MAP,
    // Banks
    inter: INTER_STATUS_MAP,
    bb: BB_STATUS_MAP,
    itau: ITAU_STATUS_MAP,
    bradesco: BRADESCO_STATUS_MAP,
    santander: SANTANDER_STATUS_MAP,
    caixa: CAIXA_STATUS_MAP,
    sicredi: SICREDI_STATUS_MAP,
    sicoob: SICOOB_STATUS_MAP,
    safra: SAFRA_STATUS_MAP,
    c6bank: C6BANK_STATUS_MAP,
};

/**
 * Normalize a provider-specific status string to our unified status.
 * Tries exact match, then uppercase, then lowercase. Returns 'pending' for unknowns.
 */
export function normalizeStatus(
    provider: PaymentProvider,
    providerStatus: string,
): NormalizedStatus {
    const map = STATUS_MAPS[provider];
    if (!map) return 'pending';
    return map[providerStatus] || map[providerStatus.toUpperCase()] || map[providerStatus.toLowerCase()] || 'pending';
}

/**
 * Check if a normalized status represents a terminal (final) state.
 */
export function isTerminalStatus(status: NormalizedStatus): boolean {
    return ['confirmed', 'refunded', 'partial_refund', 'cancelled', 'failed', 'chargeback'].includes(status);
}

/**
 * Check if a normalized status represents a successful payment.
 */
export function isSuccessStatus(status: NormalizedStatus): boolean {
    return status === 'confirmed';
}
