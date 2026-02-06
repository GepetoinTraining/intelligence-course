# SPED-CLAUDE: Brazilian Fiscal Export System Specification

## Context

Node Zero is a language school operating under **Lucro Real** (actual profit taxation regime) in Brazil. This requires complete, auditable financial records that integrate with Brazil's SPED (Sistema Público de Escrituração Digital) ecosystem.

The accountant needs to export data in formats compatible with:
- **ECD** (Escrituração Contábil Digital) - Digital accounting bookkeeping
- **ECF** (Escrituração Contábil Fiscal) - Fiscal accounting
- **EFD-Contribuições** - PIS/COFINS contributions
- **EFD-Reinf** - Withholdings and fiscal information
- **NFS-e** - Electronic service invoices (municipal)

---

## Architecture

### File Structure

```
lib/
  schemas/
    fiscal/
      common.ts           # Shared types (CPF, CNPJ, currency, dates)
      tax-withholdings.ts # IRRF, INSS, ISS, PIS, COFINS, CSLL
      invoices.ts         # NFS-e and internal invoices
      transactions.ts     # All financial movements
      journal-entries.ts  # Accounting entries (already done, reference)
      chart-of-accounts.ts # Plano de contas (already done, reference)
      payroll.ts          # Teacher payments (already done, reference)
      index.ts            # Re-exports
  
  services/
    export/
      exportService.ts    # Existing - extend with new schemas
      sped-formatters.ts  # SPED-specific text file formatters
```

---

## Zod Schemas

### 1. Common Types (`lib/schemas/fiscal/common.ts`)

```typescript
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

// ============================================================================
// MONETARY VALUES
// ============================================================================

// All monetary values in centavos (integer) to avoid floating point issues
export const MoneySchema = z.number().int().min(0);

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
  'ADJUSTMENT',     # Accounting adjustment
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

// Export types for type inference
export type CPF = z.infer<typeof CPFSchema>;
export type CNPJ = z.infer<typeof CNPJSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Percentage = z.infer<typeof PercentageSchema>;
export type CompetencyPeriod = z.infer<typeof CompetencyPeriodSchema>;
export type TaxType = z.infer<typeof TaxTypeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;
```

---

### 2. Tax Withholdings (`lib/schemas/fiscal/tax-withholdings.ts`)

```typescript
import { z } from 'zod';
import {
  DocumentSchema,
  MoneySchema,
  PercentageSchema,
  CompetencyPeriodSchema,
  BrazilianDateSchema,
  TaxTypeSchema,
} from './common';

// ============================================================================
// TAX WITHHOLDING RECORD
// ============================================================================

export const TaxWithholdingSchema = z.object({
  // Identification
  id: z.string().uuid(),
  
  // Tax details
  taxType: TaxTypeSchema,
  
  // Calculation
  calculationBase: MoneySchema,           // Base de cálculo (centavos)
  rate: PercentageSchema,                 // Alíquota (basis points)
  amountWithheld: MoneySchema,            // Valor retido (centavos)
  
  // Reference document
  referenceType: z.enum(['INVOICE', 'PAYROLL', 'CONTRACT']),
  referenceId: z.string(),
  referenceNumber: z.string().optional(), // NFS-e number, payroll ID, etc
  
  // Timing
  competencyPeriod: CompetencyPeriodSchema,  // Período de competência
  withholdingDate: BrazilianDateSchema,      // Data da retenção
  dueDate: BrazilianDateSchema,              // Data de vencimento
  paymentDate: BrazilianDateSchema.nullable(), // Data do pagamento (null if unpaid)
  
  // Parties
  withholder: z.object({                  // Quem retém (Node Zero)
    name: z.string(),
    document: DocumentSchema,
  }),
  beneficiary: z.object({                 // Quem sofre a retenção
    name: z.string(),
    document: DocumentSchema,
  }),
  
  // DARF/GPS details (payment voucher)
  paymentVoucher: z.object({
    type: z.enum(['DARF', 'GPS', 'DAM', 'OTHER']),
    code: z.string(),                     // Código de receita
    barcode: z.string().optional(),       // Código de barras
    authenticationCode: z.string().optional(), // Código de autenticação
  }).optional(),
  
  // Metadata
  createdAt: BrazilianDateSchema,
  updatedAt: BrazilianDateSchema,
  notes: z.string().optional(),
});

export type TaxWithholding = z.infer<typeof TaxWithholdingSchema>;

// ============================================================================
// WITHHOLDING RATES REFERENCE (for validation)
// ============================================================================

export const WithholdingRatesReference = {
  // IRRF - varies by income bracket, these are common service rates
  IRRF: {
    services: 1500,        // 15% for most services
    salary: 'progressive', // Uses progressive table
  },
  
  // INSS - employee contribution (progressive)
  INSS: {
    employee: 'progressive', // 7.5% to 14%
    employer: 2000,          // 20% employer contribution
  },
  
  // ISS - Joinville rate for educational services
  ISS: {
    education: 200,  // 2% (varies by municipality)
    minRate: 200,    // Minimum 2%
    maxRate: 500,    // Maximum 5%
  },
  
  // Federal contributions on revenue
  PIS: {
    cumulativo: 65,      // 0.65% (Lucro Presumido)
    naoCumulativo: 165,  // 1.65% (Lucro Real)
  },
  
  COFINS: {
    cumulativo: 300,     // 3% (Lucro Presumido)
    naoCumulativo: 760,  // 7.6% (Lucro Real)
  },
  
  CSLL: {
    services: 288,       // 2.88% for services
  },
} as const;

// ============================================================================
// EXPORT SCHEMA (flattened for CSV/Excel)
// ============================================================================

export const TaxWithholdingExportSchema = z.object({
  id: z.string(),
  taxType: z.string(),
  calculationBaseFormatted: z.string(),   // "R$ 1.234,56"
  rateFormatted: z.string(),              // "15,00%"
  amountWithheldFormatted: z.string(),    // "R$ 185,18"
  referenceType: z.string(),
  referenceNumber: z.string(),
  competencyPeriod: z.string(),
  withholdingDate: z.string(),            // "DD/MM/YYYY"
  dueDate: z.string(),
  paymentDate: z.string().nullable(),
  withholderId: z.string(),
  withholderName: z.string(),
  beneficiaryId: z.string(),
  beneficiaryName: z.string(),
  voucherType: z.string().optional(),
  voucherCode: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE']),
});

export type TaxWithholdingExport = z.infer<typeof TaxWithholdingExportSchema>;
```

---

### 3. Invoices (`lib/schemas/fiscal/invoices.ts`)

```typescript
import { z } from 'zod';
import {
  DocumentSchema,
  MoneySchema,
  PercentageSchema,
  CompetencyPeriodSchema,
  BrazilianDateSchema,
  InvoiceStatusSchema,
  PaymentMethodSchema,
  TaxTypeSchema,
} from './common';

// ============================================================================
// SERVICE ITEM
// ============================================================================

export const ServiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: MoneySchema,
  totalPrice: MoneySchema,
  
  // Service classification
  cnaeCode: z.string().optional(),        // Código CNAE
  municipalServiceCode: z.string().optional(), // Código de serviço municipal
  federalServiceCode: z.string().optional(),   // Código LC 116
});

// ============================================================================
// WITHHOLDING DETAIL ON INVOICE
// ============================================================================

export const InvoiceWithholdingSchema = z.object({
  taxType: TaxTypeSchema,
  calculationBase: MoneySchema,
  rate: PercentageSchema,
  amount: MoneySchema,
});

// ============================================================================
// INVOICE SCHEMA
// ============================================================================

export const InvoiceSchema = z.object({
  // Identification
  id: z.string().uuid(),
  internalNumber: z.string(),             // Internal sequential number
  
  // NFS-e details (if issued)
  nfse: z.object({
    number: z.string(),
    verificationCode: z.string(),
    issueDate: BrazilianDateSchema,
    accessKey: z.string().optional(),     // Chave de acesso (44 digits)
    xmlUrl: z.string().url().optional(),
    pdfUrl: z.string().url().optional(),
  }).nullable(),
  
  // Parties
  issuer: z.object({                      // Node Zero
    name: z.string(),
    tradeName: z.string().optional(),     // Nome fantasia
    document: DocumentSchema,
    municipalRegistration: z.string(),    // Inscrição municipal
    address: z.object({
      street: z.string(),
      number: z.string(),
      complement: z.string().optional(),
      neighborhood: z.string(),
      city: z.string(),
      cityCode: z.string(),               // Código IBGE
      state: z.string().length(2),
      postalCode: z.string(),
    }),
  }),
  
  recipient: z.object({                   // Student/Parent/Company
    name: z.string(),
    document: DocumentSchema,
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string(),
      number: z.string(),
      complement: z.string().optional(),
      neighborhood: z.string(),
      city: z.string(),
      cityCode: z.string(),
      state: z.string().length(2),
      postalCode: z.string(),
    }).optional(),
  }),
  
  // Service details
  items: z.array(ServiceItemSchema).min(1),
  serviceDescription: z.string(),         // Discriminação dos serviços
  
  // Amounts
  grossAmount: MoneySchema,               // Valor bruto
  discountAmount: MoneySchema.default(0), // Desconto
  deductionAmount: MoneySchema.default(0), // Deduções legais
  
  // Withholdings
  withholdings: z.array(InvoiceWithholdingSchema),
  totalWithholdings: MoneySchema,
  
  // Net amount
  netAmount: MoneySchema,                 // Valor líquido (grosso - descontos - retenções)
  
  // Timing
  competencyPeriod: CompetencyPeriodSchema,
  issueDate: BrazilianDateSchema,
  dueDate: BrazilianDateSchema,
  
  // Payment
  status: InvoiceStatusSchema,
  payments: z.array(z.object({
    id: z.string().uuid(),
    date: BrazilianDateSchema,
    amount: MoneySchema,
    method: PaymentMethodSchema,
    transactionId: z.string().optional(), // PIX e2e, card auth, etc
    bankAccount: z.string().optional(),
  })),
  
  // Student reference (for tuition invoices)
  studentId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  
  // Metadata
  createdAt: BrazilianDateSchema,
  updatedAt: BrazilianDateSchema,
  cancelledAt: BrazilianDateSchema.nullable(),
  cancellationReason: z.string().optional(),
  notes: z.string().optional(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// ============================================================================
// NFS-e SPECIFIC CODES FOR EDUCATIONAL SERVICES
// ============================================================================

export const EducationalServiceCodes = {
  // LC 116/2003 - Federal service list
  federalCode: '8.02', // Instrução, treinamento, orientação pedagógica e educacional
  
  // CNAE
  cnae: {
    languageCourses: '8593700',     // Ensino de idiomas
    professionalCourses: '8599604', // Treinamento em desenvolvimento profissional
  },
  
  // Joinville municipal code (check with accountant)
  municipalCode: '802', // Varies by municipality
} as const;

// ============================================================================
// EXPORT SCHEMA (flattened for CSV/Excel)
// ============================================================================

export const InvoiceExportSchema = z.object({
  // Basic info
  id: z.string(),
  internalNumber: z.string(),
  nfseNumber: z.string().nullable(),
  nfseVerificationCode: z.string().nullable(),
  
  // Dates
  issueDate: z.string(),              // "DD/MM/YYYY"
  dueDate: z.string(),
  competencyPeriod: z.string(),       // "MM/YYYY"
  
  // Recipient
  recipientName: z.string(),
  recipientDocument: z.string(),      // Formatted CPF/CNPJ
  recipientDocumentType: z.enum(['CPF', 'CNPJ']),
  
  // Service
  serviceDescription: z.string(),
  serviceCode: z.string(),
  
  // Amounts (formatted)
  grossAmount: z.string(),            // "R$ 1.234,56"
  discountAmount: z.string(),
  
  // Withholdings (formatted)
  irrfAmount: z.string(),
  inssAmount: z.string(),
  issAmount: z.string(),
  pisAmount: z.string(),
  cofinsAmount: z.string(),
  csllAmount: z.string(),
  totalWithholdings: z.string(),
  
  // Net
  netAmount: z.string(),
  
  // Payment
  status: z.string(),
  paymentDate: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  
  // Reference
  studentName: z.string().optional(),
  enrollmentId: z.string().optional(),
});

export type InvoiceExport = z.infer<typeof InvoiceExportSchema>;
```

---

### 4. Transactions (`lib/schemas/fiscal/transactions.ts`)

```typescript
import { z } from 'zod';
import {
  MoneySchema,
  BrazilianDateSchema,
  PaymentMethodSchema,
  TransactionTypeSchema,
  TransactionCategorySchema,
  DocumentSchema,
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
    document: DocumentSchema.optional(),
  }).optional(),
  
  // Document references
  documents: z.array(z.object({
    type: z.enum(['INVOICE', 'RECEIPT', 'CONTRACT', 'PAYROLL', 'DARF', 'OTHER']),
    id: z.string(),
    number: z.string().optional(),
  })),
  
  // Accounting
  accountingEntry: z.object({
    debitAccount: z.string(),             // Chart of accounts code
    creditAccount: z.string(),
    costCenter: z.string().optional(),
  }).optional(),
  
  // Reconciliation
  reconciliation: z.object({
    status: z.enum(['PENDING', 'RECONCILED', 'DISCREPANCY']),
    reconciledAt: BrazilianDateSchema.optional(),
    reconciledBy: z.string().optional(),
    bankStatementDate: BrazilianDateSchema.optional(),
    bankStatementAmount: MoneySchema.optional(),
    discrepancyNotes: z.string().optional(),
  }),
  
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
```

---

## Implementation Tasks

### Task 1: Create Schema Files

Create the four schema files as specified above:
1. `lib/schemas/fiscal/common.ts`
2. `lib/schemas/fiscal/tax-withholdings.ts`
3. `lib/schemas/fiscal/invoices.ts`
4. `lib/schemas/fiscal/transactions.ts`
5. `lib/schemas/fiscal/index.ts` (re-exports)

### Task 2: Update Database Schema (Drizzle/Turso)

Add tables to match the Zod schemas:

```typescript
// db/schema/fiscal.ts

export const taxWithholdings = sqliteTable('tax_withholdings', {
  id: text('id').primaryKey(),
  taxType: text('tax_type').notNull(),
  calculationBase: integer('calculation_base').notNull(),
  rate: integer('rate').notNull(),
  amountWithheld: integer('amount_withheld').notNull(),
  referenceType: text('reference_type').notNull(),
  referenceId: text('reference_id').notNull(),
  referenceNumber: text('reference_number'),
  competencyPeriod: text('competency_period').notNull(),
  withholdingDate: text('withholding_date').notNull(),
  dueDate: text('due_date').notNull(),
  paymentDate: text('payment_date'),
  withholderId: text('withholder_id').notNull(),
  withholderName: text('withholder_name').notNull(),
  beneficiaryId: text('beneficiary_id').notNull(),
  beneficiaryName: text('beneficiary_name').notNull(),
  voucherType: text('voucher_type'),
  voucherCode: text('voucher_code'),
  voucherBarcode: text('voucher_barcode'),
  voucherAuth: text('voucher_auth'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  sequentialNumber: integer('sequential_number').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  detailedDescription: text('detailed_description'),
  amount: integer('amount').notNull(),
  transactionDate: text('transaction_date').notNull(),
  competencyDate: text('competency_date').notNull(),
  paymentMethod: text('payment_method').notNull(),
  bankAccountId: text('bank_account_id'),
  bankTransactionId: text('bank_transaction_id'),
  counterpartyName: text('counterparty_name'),
  counterpartyDocument: text('counterparty_document'),
  counterpartyDocumentType: text('counterparty_document_type'),
  debitAccount: text('debit_account'),
  creditAccount: text('credit_account'),
  costCenter: text('cost_center'),
  reconciliationStatus: text('reconciliation_status').default('PENDING'),
  reconciledAt: text('reconciled_at'),
  reconciledBy: text('reconciled_by'),
  notes: text('notes'),
  tags: text('tags'), // JSON array
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  createdBy: text('created_by').notNull(),
});

// Junction table for transaction documents
export const transactionDocuments = sqliteTable('transaction_documents', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull().references(() => transactions.id),
  documentType: text('document_type').notNull(),
  documentId: text('document_id').notNull(),
  documentNumber: text('document_number'),
});
```

### Task 3: Extend Export Service

Update `lib/export/exportService.ts`:

```typescript
import { 
  TaxWithholdingExportSchema,
  InvoiceExportSchema,
  TransactionExportSchema,
  TransactionCategoryLabels,
} from '@/lib/schemas/fiscal';

// Add to existing report templates
export const REPORT_TEMPLATES = {
  // ... existing templates ...
  
  TAX_WITHHOLDINGS: {
    name: 'Retenções Tributárias',
    description: 'Todas as retenções (IRRF, INSS, ISS, PIS, COFINS, CSLL)',
    schema: TaxWithholdingExportSchema,
    defaultFormat: 'xlsx',
  },
  
  INVOICES: {
    name: 'Notas Fiscais',
    description: 'NFS-e e faturas emitidas',
    schema: InvoiceExportSchema,
    defaultFormat: 'xlsx',
  },
  
  TRANSACTIONS: {
    name: 'Movimentações Financeiras',
    description: 'Todas as entradas e saídas',
    schema: TransactionExportSchema,
    defaultFormat: 'xlsx',
  },
  
  // Combined reports for accountant
  MONTHLY_CLOSING: {
    name: 'Fechamento Mensal',
    description: 'Relatório completo para fechamento contábil',
    includes: ['INVOICES', 'TAX_WITHHOLDINGS', 'TRANSACTIONS', 'PAYROLL'],
    defaultFormat: 'xlsx',
  },
} as const;
```

### Task 4: API Routes

Create/update API routes:

```typescript
// app/api/export/tax-withholdings/route.ts
// app/api/export/invoices/route.ts
// app/api/export/transactions/route.ts
```

Each should:
1. Accept date range parameters
2. Query database with filters
3. Transform to export schema
4. Use existing exportService for format conversion

### Task 5: Value Formatters

Add Brazilian formatters to `lib/export/formatters.ts`:

```typescript
// Format money in Brazilian style
export function formatBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

// Format percentage
export function formatPercentage(basisPoints: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(basisPoints / 10000);
}

// Format CPF: 000.000.000-00
export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Format CNPJ: 00.000.000/0000-00
export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Format date Brazilian style
export function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Format competency period
export function formatCompetency(period: string): string {
  const [year, month] = period.split('-');
  return `${month}/${year}`;
}
```

---

## Testing Checklist

- [ ] Tax withholdings export includes all required SPED fields
- [ ] Invoice export matches NFS-e requirements
- [ ] Transactions export supports bank reconciliation
- [ ] All monetary values use centavos internally
- [ ] All dates export in DD/MM/YYYY format
- [ ] CPF/CNPJ validation works correctly
- [ ] Export formats (CSV, XLSX, PDF, JSON) all work
- [ ] Date range filtering works
- [ ] Monthly closing report combines all data correctly

---

## Notes for Accountant Integration

1. **Lucro Real specifics**: PIS/COFINS are non-cumulative (1.65% and 7.6%), deductible against credits
2. **ISS Joinville**: Verify current rate for educational services (likely 2%)
3. **NFS-e integration**: May need to integrate with Joinville's municipal system later
4. **SPED ECD/ECF**: Future phase - generate actual SPED text files
5. **Bank reconciliation**: Critical for audit - every transaction must match bank statement

---

## References

- SPED Documentation: http://sped.rfb.gov.br/
- LC 116/2003 (Service list): http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm
- NFS-e Joinville: Check municipal portal
- CNAE lookup: https://cnae.ibge.gov.br/