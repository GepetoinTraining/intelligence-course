/**
 * ============================================================================
 * DOMAIN TYPES — Shared type definitions for the NodeZero platform
 * ============================================================================
 *
 * These interfaces represent the data shapes used across dashboard pages.
 * They serve as the contract between the frontend and the API layer.
 *
 * When an API endpoint is wired up, the response shape should match these types.
 * Until then, pages use typed empty arrays/objects as placeholders.
 *
 * Organized by domain module.
 */

// ============================================================================
// COMMON / SHARED
// ============================================================================

/** Generic select option shape (used in Mantine dropdowns) */
export interface SelectOption {
    value: string;
    label: string;
}

/** Base entity with id and timestamps */
export interface BaseEntity {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================================================
// FINANCIAL
// ============================================================================

/** Financial summary with current vs previous comparison */
export interface FinancialSummary {
    revenue: { current: number; previous: number };
    expenses: { current: number; previous: number };
    profit: { current: number; previous: number };
    students: { current: number; previous: number };
    pendingPayments: number;
    payrollDue: number;
}

/** Monthly financial data point */
export interface MonthlyFinancial {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    students: number;
}

/** Cash flow projection */
export interface CashFlowProjection {
    currentBalance: number;
    projectedInflows: CashFlowEntry[];
    projectedOutflows: CashFlowEntry[];
}

export interface CashFlowEntry {
    month: string;
    amount: number;
    label: string;
    category?: string;
}

/** Revenue breakdown by course */
export interface RevenueByCourse {
    name: string;
    revenue: number;
    students: number;
    percentage: number;
    color?: string;
}

/** Payment method distribution */
export interface PaymentMethodSummary {
    method: string;
    count: number;
    amount: number;
    percentage: number;
    color?: string;
}

/** Defaulter record */
export interface Defaulter {
    id: string;
    name: string;
    course: string;
    amount: number;
    daysPast: number;
    lastContact?: string;
    status: string;
}

/** Cost breakdown (HR) */
export interface CostBreakdown {
    salaries: number;
    bonuses: number;
    benefits: number;
    training: number;
    total: number;
    asPercentOfRevenue: number;
}

/** Balancete item (Trial Balance) */
export interface BalanceteItem {
    code: string;
    name: string;
    type: 'debit' | 'credit' | 'group' | 'subgroup' | 'account';
    balance: number;
    debit: number;
    credit: number;
    previousBalance?: number;
}

/** DRE line item (Income Statement) */
export interface DREItem {
    name: string;
    value: number;
    type?: 'header' | 'subtotal' | 'total' | 'item';
    indent?: number;
    previousValue?: number;
}

/** Balanço Patrimonial (Balance Sheet) */
export interface BalancoPatrimonial {
    ativo: {
        circulante: BalancoLineItem[];
        naoCirculante: BalancoLineItem[];
    };
    passivo: {
        circulante: BalancoLineItem[];
        naoCirculante: BalancoLineItem[];
    };
    patrimonioLiquido: BalancoLineItem[];
}

export interface BalancoLineItem {
    name: string;
    value: number;
    previousValue?: number;
}

// ============================================================================
// SCHOOL / ACADEMIC
// ============================================================================

/** School dashboard cashflow summary */
export interface SchoolCashflow {
    currentMonth: { expected: number; received: number; pending: number; overdue: number };
    lastMonth: { expected: number; received: number; pending: number; overdue: number };
    students: { total: number; active: number; defaulting: number };
    revenue: { current: number; previous: number };
}

/** Payment record */
export interface Payment {
    id: string;
    student: string;
    parent?: string;
    course: string;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    method?: string;
}

/** Course summary for school dashboard */
export interface CourseSummary {
    id: string;
    title: string;
    name?: string;
    teacher?: string;
    model?: string;
    students: number;
    price: number;
    revenue: number;
    status: 'active' | 'inactive';
}

/** Class (turma) reference for selects */
export interface ClassRef {
    id: string;
    name: string;
    courseType?: string;
    level?: string;
    teacher?: string;
    room?: string;
    students?: number;
    schedule?: string;
}

/** Module reference for selects */
export interface ModuleRef {
    id: string;
    name: string;
    courseId?: string;
    courseName?: string;
    order?: number;
}

/** Level reference */
export interface LevelRef {
    id: string;
    name: string;
    code?: string;
}

/** Room reference */
export interface RoomRef {
    id: string;
    name: string;
    capacity?: number;
    type?: string;
}

/** Teacher reference for reports */
export interface TeacherRef {
    id: string;
    name: string;
    email?: string;
    department?: string;
    classes: number;
    students: number;
    salary: number;
    bonus: number;
    totalCost: number;
    hoursPerWeek: number;
    revenueGenerated: number;
    efficiency: number;
    costPerStudent: number;
    trend: number;
}

/** Service (product/pricing) reference */
export interface ServiceRef {
    id: string;
    name: string;
    price?: number;
    type?: string;
}

// ============================================================================
// STUDENT
// ============================================================================

/** Student progress for todo/dashboard */
export interface StudentProgress {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    completedModules: number;
    totalModules: number;
    streak: number;
}

// ============================================================================
// STAFF / CRM
// ============================================================================

/** SCRM Profile (Smart CRM) */
export interface SCRMProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    stage: string;
    score: number;
    persona?: string;
    sentiment?: string;
    interactions: number;
    lastContact?: string;
    tags?: string[];
}

// ============================================================================
// INBOX / COMMUNICATION
// ============================================================================

/** Message thread */
export interface Thread {
    id: string;
    subject: string;
    participants: string[];
    lastMessage: string;
    lastMessageAt: string;
    unread: boolean;
    messages: ThreadMessage[];
}

export interface ThreadMessage {
    id: string;
    sender: string;
    content: string;
    sentAt: string;
    read: boolean;
}
