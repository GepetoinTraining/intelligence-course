/**
 * Financial Configuration
 * 
 * This module configures the payment provider and financial settings.
 * Set NEXT_PUBLIC_PAYMENT_PROVIDER in .env.local to change the payment system.
 * 
 * Supported providers:
 * - 'internal': Use built-in payment tracking (manual reconciliation)
 * - 'clerk': Use Clerk Billing (requires Clerk subscription features)
 * - 'stripe': Use Stripe directly (requires stripe integration)
 * - 'pix': Brazilian PIX payments (requires PIX integration)
 */

export type PaymentProvider = 'internal' | 'clerk' | 'stripe' | 'pix';

export const PAYMENT_PROVIDER: PaymentProvider =
    (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER as PaymentProvider) || 'internal';

export const PAYMENT_CONFIG = {
    // Default currency
    currency: 'BRL',
    currencySymbol: 'R$',

    // Early payment discount percentage
    earlyPaymentDiscount: 10, // 10% discount for payment before due date

    // Late payment fee percentage
    latePaymentFee: 2, // 2% fee for late payments

    // Days before due date to qualify for early discount
    earlyPaymentDays: 5,

    // Whether to show payment provider branding
    showProviderBranding: true,

    // Enable installment payments
    enableInstallments: true,
    maxInstallments: 12,

    // Minimum installment value
    minInstallmentValue: 50.00,
};

// Course pricing tiers
export const COURSE_PRICING = {
    'intelligence-course-v1': {
        fullPrice: 1497.00,
        monthlyPrice: 149.70, // 10 installments
        modules: 8,
        description: 'Intelligence: The Architect Protocol - Curso Completo',
    },
};

// Payment status types
export type PaymentStatus =
    | 'pending'
    | 'paid'
    | 'overdue'
    | 'cancelled'
    | 'refunded'
    | 'processing';

// Invoice type
export interface Invoice {
    id: string;
    studentId: string;
    studentName: string;
    parentId: string;
    parentName: string;
    courseId: string;
    description: string;
    amount: number;
    discount: number;
    finalAmount: number;
    dueDate: string;
    paidDate?: string;
    status: PaymentStatus;
    installment?: {
        current: number;
        total: number;
    };
    paymentMethod?: string;
    transactionId?: string;
}

// Helper functions
export function formatCurrency(amount: number): string {
    return `${PAYMENT_CONFIG.currencySymbol} ${amount.toFixed(2).replace('.', ',')}`;
}

export function calculateEarlyDiscount(amount: number): number {
    return amount * (PAYMENT_CONFIG.earlyPaymentDiscount / 100);
}

export function calculateLateFee(amount: number): number {
    return amount * (PAYMENT_CONFIG.latePaymentFee / 100);
}

export function isEarlyPayment(dueDate: Date): boolean {
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= PAYMENT_CONFIG.earlyPaymentDays;
}

export function isOverdue(dueDate: Date): boolean {
    return new Date() > dueDate;
}

// Payment provider check
export function isPaymentProviderEnabled(provider: PaymentProvider): boolean {
    return PAYMENT_PROVIDER === provider;
}

