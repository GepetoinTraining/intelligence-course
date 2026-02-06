// Accounting Module Types

export interface ChartOfAccount {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    type: AccountType;
    nature: 'debit' | 'credit';
    parentId?: string;
    level: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type AccountType =
    | 'asset'
    | 'liability'
    | 'equity'
    | 'revenue'
    | 'expense';

export interface JournalEntry {
    id: string;
    organizationId: string;
    number: string;
    date: Date;
    description: string;
    status: 'draft' | 'posted' | 'reversed';
    lines: JournalEntryLine[];
    createdBy: string;
    postedAt?: Date;
    reversedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface JournalEntryLine {
    id: string;
    journalEntryId: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    description?: string;
    debit: number;
    credit: number;
    costCenterId?: string;
}

export interface CostCenter {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    parentId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface FiscalDocument {
    id: string;
    organizationId: string;
    type: FiscalDocumentType;
    number: string;
    series?: string;
    date: Date;
    customerId?: string;
    vendorId?: string;
    totalValue: number;
    status: FiscalDocumentStatus;
    xml?: string;
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type FiscalDocumentType =
    | 'nfse'
    | 'nfe'
    | 'nfce'
    | 'cte';

export type FiscalDocumentStatus =
    | 'draft'
    | 'pending'
    | 'authorized'
    | 'cancelled'
    | 'rejected';

export interface TaxWithholding {
    id: string;
    organizationId: string;
    fiscalDocumentId: string;
    type: 'irrf' | 'pis' | 'cofins' | 'csll' | 'iss' | 'inss';
    baseValue: number;
    rate: number;
    amount: number;
    createdAt: Date;
}

export interface SPEDExport {
    id: string;
    organizationId: string;
    type: 'ecd' | 'ecf' | 'efd_contribuicoes' | 'efd_icms';
    period: string; // YYYY or YYYY-MM
    status: 'pending' | 'generating' | 'completed' | 'failed';
    fileUrl?: string;
    errors?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface BalanceSheet {
    period: string;
    assets: BalanceSheetSection;
    liabilities: BalanceSheetSection;
    equity: BalanceSheetSection;
}

export interface BalanceSheetSection {
    total: number;
    accounts: BalanceSheetAccount[];
}

export interface BalanceSheetAccount {
    code: string;
    name: string;
    balance: number;
    children?: BalanceSheetAccount[];
}

export interface IncomeStatement {
    period: string;
    revenue: IncomeStatementSection;
    expenses: IncomeStatementSection;
    netIncome: number;
}

export interface IncomeStatementSection {
    total: number;
    accounts: { code: string; name: string; value: number }[];
}

