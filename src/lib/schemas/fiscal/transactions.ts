import { z } from 'zod';
import {
    MoneySchema,
    BrazilianDateSchema,
    PaymentMethodSchema,
    TransactionTypeSchema,
    TransactionCategorySchema,
    DocumentFlexSchema,
    CompetencyPeriodSchema,
} from './common';

// ============================================================================
// BANK ACCOUNT REFERENCE
// ============================================================================

export const BankAccountSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),                       // "Conta Principal Sicoob"
    bankCode: z.string(),                   // "756" for Sicoob
    bankName: z.string(),
    agency: z.string(),
    accountNumber: z.string(),
    accountType: z.enum(['CHECKING', 'SAVINGS', 'PAYMENT']),
});

export type BankAccount = z.infer<typeof BankAccountSchema>;

// ============================================================================
// DOCUMENT REFERENCE
// ============================================================================

export const DocumentReferenceSchema = z.object({
    type: z.enum(['INVOICE', 'RECEIPT', 'CONTRACT', 'PAYROLL', 'DARF', 'OTHER']),
    id: z.string(),
    number: z.string().optional(),
});

export type DocumentReference = z.infer<typeof DocumentReferenceSchema>;

// ============================================================================
// ACCOUNTING ENTRY
// ============================================================================

export const AccountingEntrySchema = z.object({
    debitAccount: z.string(),             // Chart of accounts code
    creditAccount: z.string(),
    costCenter: z.string().optional(),
});

export type AccountingEntry = z.infer<typeof AccountingEntrySchema>;

// ============================================================================
// RECONCILIATION STATUS
// ============================================================================

export const ReconciliationStatusSchema = z.enum(['PENDING', 'RECONCILED', 'DISCREPANCY']);

export const ReconciliationSchema = z.object({
    status: ReconciliationStatusSchema,
    reconciledAt: BrazilianDateSchema.optional(),
    reconciledBy: z.string().optional(),
    bankStatementDate: BrazilianDateSchema.optional(),
    bankStatementAmount: MoneySchema.optional(),
    discrepancyNotes: z.string().optional(),
});

export type Reconciliation = z.infer<typeof ReconciliationSchema>;

// ============================================================================
// TRANSACTION SCHEMA
// ============================================================================

export const TransactionSchema = z.object({
    // Identification
    id: z.string().uuid(),
    sequentialNumber: z.number().int(),     // For internal reference

    // Classification
    type: TransactionTypeSchema,
    category: TransactionCategorySchema,

    // Description
    description: z.string(),
    detailedDescription: z.string().optional(),

    // Amount
    amount: MoneySchema,                    // Always positive, type determines direction

    // Timing
    transactionDate: BrazilianDateSchema,   // When it happened
    competencyDate: BrazilianDateSchema,    // When it should be accounted (regime de competência)

    // Payment details
    paymentMethod: PaymentMethodSchema,

    // Bank details
    bankAccount: BankAccountSchema.optional(),
    bankTransactionId: z.string().optional(), // Bank's reference ID

    // Counterparty
    counterparty: z.object({
        name: z.string(),
        document: DocumentFlexSchema.optional(),
    }).optional(),

    // Document references
    documents: z.array(DocumentReferenceSchema),

    // Accounting
    accountingEntry: AccountingEntrySchema.optional(),

    // Reconciliation
    reconciliation: ReconciliationSchema,

    // Metadata
    createdAt: BrazilianDateSchema,
    updatedAt: BrazilianDateSchema,
    createdBy: z.string(),                  // User ID
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// ============================================================================
// EXPORT SCHEMA (flattened for CSV/Excel)
// ============================================================================

export const TransactionExportSchema = z.object({
    // Identification
    id: z.string(),
    sequentialNumber: z.number(),

    // Classification
    type: z.string(),
    category: z.string(),
    categoryLabel: z.string(),              // Human-readable Portuguese

    // Description
    description: z.string(),

    // Amount
    amount: z.string(),                     // Formatted "R$ 1.234,56"
    amountRaw: z.number(),                  // Raw centavos for calculations
    direction: z.enum(['ENTRADA', 'SAÍDA', 'TRANSFERÊNCIA']),

    // Dates
    transactionDate: z.string(),            // "DD/MM/YYYY"
    competencyDate: z.string(),
    competencyPeriod: z.string(),           // "MM/YYYY"

    // Payment
    paymentMethod: z.string(),
    paymentMethodLabel: z.string(),         // "PIX", "Cartão de Crédito", etc

    // Bank
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    bankTransactionId: z.string().optional(),

    // Counterparty
    counterpartyName: z.string().optional(),
    counterpartyDocument: z.string().optional(),

    // Document references
    invoiceNumber: z.string().optional(),
    receiptNumber: z.string().optional(),
    payrollId: z.string().optional(),

    // Accounting
    debitAccount: z.string().optional(),
    creditAccount: z.string().optional(),
    costCenter: z.string().optional(),

    // Reconciliation
    reconciliationStatus: z.string(),

    // Metadata
    createdAt: z.string(),
    notes: z.string().optional(),
});

export type TransactionExport = z.infer<typeof TransactionExportSchema>;

// ============================================================================
// CATEGORY LABELS (Portuguese)
// ============================================================================

export const TransactionCategoryLabels: Record<string, string> = {
    // Revenue
    TUITION: 'Mensalidade',
    ENROLLMENT_FEE: 'Taxa de Matrícula',
    MATERIAL_FEE: 'Material Didático',
    EXAM_FEE: 'Taxa de Exame/Certificação',
    TRIAL_CONVERSION: 'Conversão de Aula Experimental',

    // Personnel
    TEACHER_SALARY: 'Salário - Professor',
    TEACHER_BONUS: 'Bônus - Professor',
    ADMIN_SALARY: 'Salário - Administrativo',
    BENEFITS: 'Benefícios (VT/VR)',

    // Operations
    RENT: 'Aluguel',
    UTILITIES: 'Utilidades (Água/Luz/Internet)',
    MAINTENANCE: 'Manutenção',
    CLEANING: 'Limpeza',
    SECURITY: 'Segurança',

    // Marketing
    ADVERTISING: 'Publicidade',
    EVENTS: 'Eventos',
    PARTNERSHIPS: 'Parcerias',

    // Technology
    SOFTWARE: 'Software/SaaS',
    HARDWARE: 'Equipamentos',
    AI_SERVICES: 'Serviços de IA',

    // Administrative
    BANKING_FEES: 'Taxas Bancárias',
    ACCOUNTING: 'Contabilidade',
    LEGAL: 'Jurídico',
    INSURANCE: 'Seguros',
    TAXES: 'Impostos',

    // Other
    OTHER_REVENUE: 'Outras Receitas',
    OTHER_EXPENSE: 'Outras Despesas',
} as const;

// ============================================================================
// PAYMENT METHOD LABELS (Portuguese)
// ============================================================================

export const PaymentMethodLabels: Record<string, string> = {
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    BOLETO: 'Boleto Bancário',
    CASH: 'Dinheiro',
    BANK_TRANSFER: 'Transferência Bancária',
    CHECK: 'Cheque',
} as const;

