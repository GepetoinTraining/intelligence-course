// Operations Module Types

export interface Enrollment {
    id: string;
    organizationId: string;
    studentId: string;
    courseId: string;
    classId?: string;
    status: EnrollmentStatus;
    startDate: Date;
    endDate?: Date;
    contractId?: string;
    paymentPlanId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type EnrollmentStatus =
    | 'pending'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'suspended'
    | 'transferred';

export interface Student {
    id: string;
    personId: string;
    organizationId: string;
    studentNumber?: string;
    enrollmentDate: Date;
    status: 'active' | 'inactive' | 'graduated' | 'withdrawn';
    guardians: Guardian[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Guardian {
    id: string;
    personId: string;
    studentId: string;
    relationship: 'father' | 'mother' | 'guardian' | 'other';
    isPrimary: boolean;
    canPickup: boolean;
    isFinancialResponsible: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Contract {
    id: string;
    organizationId: string;
    enrollmentId: string;
    number: string;
    status: ContractStatus;
    startDate: Date;
    endDate: Date;
    totalValue: number;
    signedAt?: Date;
    signedBy?: string;
    documentUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type ContractStatus =
    | 'draft'
    | 'pending_signature'
    | 'signed'
    | 'active'
    | 'expired'
    | 'cancelled';

export interface CheckIn {
    id: string;
    organizationId: string;
    studentId: string;
    checkInAt: Date;
    checkOutAt?: Date;
    checkedInBy?: string;
    checkedOutBy?: string;
    method: 'manual' | 'qr_code' | 'biometric' | 'card';
    notes?: string;
    createdAt: Date;
}

export interface Transfer {
    id: string;
    organizationId: string;
    enrollmentId: string;
    fromClassId: string;
    toClassId: string;
    reason?: string;
    effectiveDate: Date;
    approvedBy?: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

export interface Renewal {
    id: string;
    organizationId: string;
    enrollmentId: string;
    status: 'pending' | 'offered' | 'accepted' | 'declined' | 'expired';
    offerExpiresAt?: Date;
    discountPercent?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

