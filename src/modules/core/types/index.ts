// Core Module Types

export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    birthDate?: Date;
    cpf?: string;
    rg?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    primaryColor?: string;
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    clerkId: string;
    personId: string;
    organizationId: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type UserRole =
    | 'owner'
    | 'admin'
    | 'coordinator'
    | 'teacher'
    | 'staff'
    | 'student'
    | 'parent';

export interface Permission {
    id: string;
    action: string;
    resource: string;
    scope: 'own' | 'team' | 'org' | 'global';
}

export interface Role {
    id: string;
    name: string;
    slug: string;
    permissions: Permission[];
    organizationId: string;
}

