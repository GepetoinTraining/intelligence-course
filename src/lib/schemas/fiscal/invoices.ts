import { z } from 'zod';
import {
    DocumentFlexSchema,
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

export type ServiceItem = z.infer<typeof ServiceItemSchema>;

// ============================================================================
// WITHHOLDING DETAIL ON INVOICE
// ============================================================================

export const InvoiceWithholdingSchema = z.object({
    taxType: TaxTypeSchema,
    calculationBase: MoneySchema,
    rate: PercentageSchema,
    amount: MoneySchema,
});

export type InvoiceWithholding = z.infer<typeof InvoiceWithholdingSchema>;

// ============================================================================
// ADDRESS SCHEMA
// ============================================================================

export const AddressSchema = z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    cityCode: z.string(),               // Código IBGE
    state: z.string().length(2),
    postalCode: z.string(),
});

export type Address = z.infer<typeof AddressSchema>;

// ============================================================================
// INVOICE PAYMENT SCHEMA
// ============================================================================

export const InvoicePaymentSchema = z.object({
    id: z.string().uuid(),
    date: BrazilianDateSchema,
    amount: MoneySchema,
    method: PaymentMethodSchema,
    transactionId: z.string().optional(), // PIX e2e, card auth, etc
    bankAccount: z.string().optional(),
});

export type InvoicePayment = z.infer<typeof InvoicePaymentSchema>;

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
        document: DocumentFlexSchema,
        municipalRegistration: z.string(),    // Inscrição municipal
        address: AddressSchema,
    }),

    recipient: z.object({                   // Student/Parent/Company
        name: z.string(),
        document: DocumentFlexSchema,
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: AddressSchema.optional(),
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
    payments: z.array(InvoicePaymentSchema),

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
    grossAmountRaw: z.number(),         // Raw centavos
    discountAmount: z.string(),
    discountAmountRaw: z.number(),

    // Withholdings (formatted)
    irrfAmount: z.string(),
    irrfAmountRaw: z.number(),
    inssAmount: z.string(),
    inssAmountRaw: z.number(),
    issAmount: z.string(),
    issAmountRaw: z.number(),
    pisAmount: z.string(),
    pisAmountRaw: z.number(),
    cofinsAmount: z.string(),
    cofinsAmountRaw: z.number(),
    csllAmount: z.string(),
    csllAmountRaw: z.number(),
    totalWithholdings: z.string(),
    totalWithholdingsRaw: z.number(),

    // Net
    netAmount: z.string(),
    netAmountRaw: z.number(),

    // Payment
    status: z.string(),
    paymentDate: z.string().nullable(),
    paymentMethod: z.string().nullable(),

    // Reference
    studentName: z.string().optional(),
    enrollmentId: z.string().optional(),
});

export type InvoiceExport = z.infer<typeof InvoiceExportSchema>;

