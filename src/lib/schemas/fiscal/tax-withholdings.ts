import { z } from 'zod';
import {
    DocumentFlexSchema,
    MoneySchema,
    PercentageSchema,
    CompetencyPeriodSchema,
    BrazilianDateSchema,
    TaxTypeSchema,
    VoucherTypeSchema,
    ReferenceTypeSchema,
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
    referenceType: ReferenceTypeSchema,
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
        document: DocumentFlexSchema,
    }),
    beneficiary: z.object({                 // Quem sofre a retenção
        name: z.string(),
        document: DocumentFlexSchema,
    }),

    // DARF/GPS details (payment voucher)
    paymentVoucher: z.object({
        type: VoucherTypeSchema,
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

    // Federal contributions on revenue (Lucro Real - non-cumulative)
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
    calculationBaseRaw: z.number(),         // Raw centavos
    rateFormatted: z.string(),              // "15,00%"
    rateRaw: z.number(),                    // Raw basis points
    amountWithheldFormatted: z.string(),    // "R$ 185,18"
    amountWithheldRaw: z.number(),          // Raw centavos
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

