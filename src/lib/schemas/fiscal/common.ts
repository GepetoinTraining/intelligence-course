import { z } from 'zod';

// ============================================================================
// DOCUMENT NUMBERS
// ============================================================================

// CPF: 11 digits, stored without formatting
export const CPFSchema = z.string()
    .regex(/^\d{11}$/, 'CPF must be 11 digits')
    .transform(val => val.replace(/\D/g, ''));

// CNPJ: 14 digits, stored without formatting  
export const CNPJSchema = z.string()
    .regex(/^\d{14}$/, 'CNPJ must be 14 digits')
    .transform(val => val.replace(/\D/g, ''));

// Either CPF or CNPJ
export const DocumentSchema = z.union([
    z.object({ type: z.literal('CPF'), number: CPFSchema }),
    z.object({ type: z.literal('CNPJ'), number: CNPJSchema }),
]);

// Flexible document schema for database storage (accepts raw strings)
export const DocumentFlexSchema = z.object({
    type: z.enum(['CPF', 'CNPJ']),
    number: z.string().min(11).max(14),
});

// ============================================================================
// MONETARY VALUES
// ============================================================================

// All monetary values in centavos (integer) to avoid floating point issues
export const MoneySchema = z.number().int().min(0);

// Signed money for debits/credits
export const SignedMoneySchema = z.number().int();

// Percentage as basis points (10000 = 100%, 1500 = 15%)
export const PercentageSchema = z.number().int().min(0).max(10000);

// ============================================================================
// DATES AND PERIODS
// ============================================================================

// Competency period: "YYYY-MM" format
export const CompetencyPeriodSchema = z.string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Must be YYYY-MM format');

// Brazilian date format for display: "DD/MM/YYYY"
export const BrazilianDateSchema = z.coerce.date();

// ============================================================================
// ENUMS
// ============================================================================

// Tax types
export const TaxTypeSchema = z.enum([
    'IRRF',           // Imposto de Renda Retido na Fonte
    'INSS',           // Instituto Nacional do Seguro Social  
    'ISS',            // Imposto Sobre Serviços
    'PIS',            // Programa de Integração Social
    'COFINS',         // Contribuição para Financiamento da Seguridade Social
    'CSLL',           // Contribuição Social sobre o Lucro Líquido
]);

// Payment methods
export const PaymentMethodSchema = z.enum([
    'PIX',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BOLETO',
    'CASH',
    'BANK_TRANSFER',
    'CHECK',
]);

// Invoice status
export const InvoiceStatusSchema = z.enum([
    'DRAFT',          // Not yet issued
    'ISSUED',         // NFS-e generated
    'PAID',           // Payment confirmed
    'PARTIAL',        // Partially paid
    'OVERDUE',        // Past due date
    'CANCELLED',      // Cancelled/voided
    'REFUNDED',       // Refunded to customer
]);

// Transaction types
export const TransactionTypeSchema = z.enum([
    'REVENUE',        // Income
    'EXPENSE',        // Outgoing
    'TRANSFER',       // Between accounts
    'ADJUSTMENT',     // Accounting adjustment
]);

// Transaction categories for language school
export const TransactionCategorySchema = z.enum([
    // Revenue
    'TUITION',              // Mensalidade
    'ENROLLMENT_FEE',       // Taxa de matrícula
    'MATERIAL_FEE',         // Material didático
    'EXAM_FEE',             // Taxa de prova/certificação
    'TRIAL_CONVERSION',     // Aula experimental convertida

    // Expenses - Personnel
    'TEACHER_SALARY',       // Salário professor
    'TEACHER_BONUS',        // Bônus professor
    'ADMIN_SALARY',         // Salário administrativo
    'BENEFITS',             // Benefícios (VT, VR, etc)

    // Expenses - Operations
    'RENT',                 // Aluguel
    'UTILITIES',            // Água, luz, internet
    'MAINTENANCE',          // Manutenção
    'CLEANING',             // Limpeza
    'SECURITY',             // Segurança

    // Expenses - Marketing
    'ADVERTISING',          // Publicidade
    'EVENTS',               // Eventos
    'PARTNERSHIPS',         // Parcerias

    // Expenses - Technology
    'SOFTWARE',             // Licenças, SaaS
    'HARDWARE',             // Equipamentos
    'AI_SERVICES',          // OpenAI, Anthropic, etc

    // Expenses - Administrative
    'BANKING_FEES',         // Taxas bancárias
    'ACCOUNTING',           // Contabilidade
    'LEGAL',                // Jurídico
    'INSURANCE',            // Seguros
    'TAXES',                // Impostos (não retidos)

    // Other
    'OTHER_REVENUE',
    'OTHER_EXPENSE',
]);

// Voucher types (payment vouchers)
export const VoucherTypeSchema = z.enum([
    'DARF',       // Documento de Arrecadação de Receitas Federais
    'GPS',        // Guia da Previdência Social
    'DAM',        // Documento de Arrecadação Municipal
    'OTHER',
]);

// Reference document types
export const ReferenceTypeSchema = z.enum([
    'INVOICE',
    'PAYROLL',
    'CONTRACT',
]);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CPF = z.infer<typeof CPFSchema>;
export type CNPJ = z.infer<typeof CNPJSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentFlex = z.infer<typeof DocumentFlexSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type SignedMoney = z.infer<typeof SignedMoneySchema>;
export type Percentage = z.infer<typeof PercentageSchema>;
export type CompetencyPeriod = z.infer<typeof CompetencyPeriodSchema>;
export type TaxType = z.infer<typeof TaxTypeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;
export type VoucherType = z.infer<typeof VoucherTypeSchema>;
export type ReferenceType = z.infer<typeof ReferenceTypeSchema>;

