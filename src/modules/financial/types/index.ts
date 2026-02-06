// Financial Module Types

export interface Invoice {
    id: string;
    organizationId: string;
    customerId: string;
    enrollmentId?: string;
    number: string;
    status: InvoiceStatus;
    issueDate: Date;
    dueDate: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paidAmount: number;
    paymentMethod?: string;
    paidAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type InvoiceStatus =
    | 'draft'
    | 'pending'
    | 'paid'
    | 'partial'
    | 'overdue'
    | 'cancelled'
    | 'refunded';

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}

export interface Transaction {
    id: string;
    organizationId: string;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    date: Date;
    bankAccountId?: string;
    invoiceId?: string;
    payableId?: string;
    status: 'pending' | 'completed' | 'cancelled';
    reconciled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Receivable {
    id: string;
    organizationId: string;
    invoiceId: string;
    customerId: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'received' | 'overdue' | 'cancelled';
    receivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Payable {
    id: string;
    organizationId: string;
    vendorId?: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    category: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface BankAccount {
    id: string;
    organizationId: string;
    name: string;
    bank: string;
    accountNumber: string;
    agency: string;
    type: 'checking' | 'savings';
    balance: number;
    isActive: boolean;
    pixKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CashFlowEntry {
    id: string;
    organizationId: string;
    date: Date;
    type: 'income' | 'expense';
    category: string;
    description: string;
    projected: number;
    actual?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaymentMethod {
    id: string;
    organizationId: string;
    name: string;
    type: 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'cash' | 'transfer';
    isActive: boolean;
    processingFee?: number;
    createdAt: Date;
    updatedAt: Date;
}

