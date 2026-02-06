// HR Module Types

export interface Employee {
    id: string;
    personId: string;
    organizationId: string;
    employeeNumber?: string;
    department?: string;
    position: string;
    contractType: 'clt' | 'pj' | 'intern' | 'temporary';
    hireDate: Date;
    terminationDate?: Date;
    salary: number;
    status: 'active' | 'inactive' | 'on_leave' | 'terminated';
    managerId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StaffContract {
    id: string;
    organizationId: string;
    employeeId: string;
    type: 'clt' | 'pj';
    startDate: Date;
    endDate?: Date;
    salary: number;
    workload: number; // hours per week
    benefits?: string[];
    documentUrl?: string;
    status: 'active' | 'expired' | 'terminated';
    createdAt: Date;
    updatedAt: Date;
}

export interface PayrollEntry {
    id: string;
    organizationId: string;
    employeeId: string;
    period: string; // YYYY-MM
    grossSalary: number;
    deductions: PayrollDeduction[];
    additions: PayrollAddition[];
    netSalary: number;
    status: 'draft' | 'approved' | 'paid';
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayrollDeduction {
    type: 'inss' | 'irrf' | 'fgts' | 'vt' | 'vr' | 'health' | 'other';
    description: string;
    amount: number;
}

export interface PayrollAddition {
    type: 'overtime' | 'bonus' | 'commission' | 'other';
    description: string;
    amount: number;
}

export interface Commission {
    id: string;
    organizationId: string;
    employeeId: string;
    period: string;
    enrollmentId?: string;
    saleValue: number;
    commissionRate: number;
    commissionAmount: number;
    status: 'pending' | 'approved' | 'paid';
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface StaffLeave {
    id: string;
    organizationId: string;
    employeeId: string;
    type: LeaveType;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    reason?: string;
    approvedBy?: string;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type LeaveType =
    | 'vacation'
    | 'sick'
    | 'maternity'
    | 'paternity'
    | 'bereavement'
    | 'personal'
    | 'unpaid';

export interface TimeEntry {
    id: string;
    organizationId: string;
    employeeId: string;
    date: Date;
    clockIn: string;
    clockOut?: string;
    breakStart?: string;
    breakEnd?: string;
    totalHours?: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

export interface JobPosting {
    id: string;
    organizationId: string;
    title: string;
    department?: string;
    description: string;
    requirements?: string[];
    benefits?: string[];
    salary?: { min: number; max: number };
    type: 'full_time' | 'part_time' | 'contract' | 'intern';
    location?: string;
    remote: boolean;
    status: 'draft' | 'open' | 'closed' | 'filled';
    publishedAt?: Date;
    closesAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface JobApplication {
    id: string;
    organizationId: string;
    jobPostingId: string;
    personId?: string;
    name: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    status: ApplicationStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type ApplicationStatus =
    | 'new'
    | 'screening'
    | 'interview'
    | 'assessment'
    | 'offer'
    | 'hired'
    | 'rejected'
    | 'withdrawn';

export interface Training {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    type: 'mandatory' | 'optional' | 'certification';
    duration: number; // in hours
    status: 'draft' | 'active' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

export interface TrainingRecord {
    id: string;
    organizationId: string;
    employeeId: string;
    trainingId: string;
    status: 'enrolled' | 'in_progress' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    score?: number;
    certificateUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

