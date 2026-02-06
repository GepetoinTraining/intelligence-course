// Fiscal Schemas - Brazilian SPED/Lucro Real Compliance
// Re-exports for easy importing

// Common types
export {
    CPFSchema,
    CNPJSchema,
    DocumentSchema,
    DocumentFlexSchema,
    MoneySchema,
    SignedMoneySchema,
    PercentageSchema,
    CompetencyPeriodSchema,
    BrazilianDateSchema,
    TaxTypeSchema,
    PaymentMethodSchema,
    InvoiceStatusSchema,
    TransactionTypeSchema,
    TransactionCategorySchema,
    VoucherTypeSchema,
    ReferenceTypeSchema,
} from './common';

export type {
    CPF,
    CNPJ,
    Document,
    DocumentFlex,
    Money,
    SignedMoney,
    Percentage,
    CompetencyPeriod,
    TaxType,
    PaymentMethod,
    InvoiceStatus,
    TransactionType,
    TransactionCategory,
    VoucherType,
    ReferenceType,
} from './common';

// Tax Withholdings
export {
    TaxWithholdingSchema,
    TaxWithholdingExportSchema,
    WithholdingRatesReference,
} from './tax-withholdings';

export type {
    TaxWithholding,
    TaxWithholdingExport,
} from './tax-withholdings';

// Invoices
export {
    ServiceItemSchema,
    InvoiceWithholdingSchema,
    AddressSchema,
    InvoicePaymentSchema,
    InvoiceSchema,
    InvoiceExportSchema,
    EducationalServiceCodes,
} from './invoices';

export type {
    ServiceItem,
    InvoiceWithholding,
    Address,
    InvoicePayment,
    Invoice,
    InvoiceExport,
} from './invoices';

// Transactions
export {
    BankAccountSchema,
    DocumentReferenceSchema,
    AccountingEntrySchema,
    ReconciliationStatusSchema,
    ReconciliationSchema,
    TransactionSchema,
    TransactionExportSchema,
    TransactionCategoryLabels,
    PaymentMethodLabels,
} from './transactions';

export type {
    BankAccount,
    DocumentReference,
    AccountingEntry,
    Reconciliation,
    Transaction,
    TransactionExport,
} from './transactions';

