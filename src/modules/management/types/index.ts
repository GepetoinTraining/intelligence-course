// Management Module Types

export interface OrganizationSettings {
    id: string;
    organizationId: string;
    name: string;
    legalName?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: Address;
    timezone: string;
    locale: string;
    currency: string;
    fiscalYearStart: number; // month 1-12
    createdAt: Date;
    updatedAt: Date;
}

export interface Address {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface BrandingSettings {
    id: string;
    organizationId: string;
    primaryColor: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    coverImageUrl?: string;
    fontFamily?: string;
    customCss?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSettings {
    id: string;
    userId: string;
    theme: 'light' | 'dark' | 'brand';
    language: string;
    timezone?: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    customViews?: CustomView[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CustomView {
    id: string;
    label: string;
    href: string;
    icon?: string;
    order: number;
}

export interface RoleDefinition {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    permissions: string[];
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PermissionDefinition {
    id: string;
    resource: string;
    action: string;
    description?: string;
}

export interface Integration {
    id: string;
    organizationId: string;
    type: IntegrationType;
    name: string;
    status: 'active' | 'inactive' | 'error';
    config: Record<string, unknown>;
    lastSyncAt?: Date;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type IntegrationType =
    | 'payment_gateway'
    | 'accounting'
    | 'email'
    | 'sms'
    | 'whatsapp'
    | 'calendar'
    | 'storage'
    | 'ai'
    | 'custom';

export interface APIKey {
    id: string;
    organizationId: string;
    name: string;
    keyPrefix: string;
    keyHash: string;
    permissions: string[];
    expiresAt?: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Webhook {
    id: string;
    organizationId: string;
    name: string;
    url: string;
    events: string[];
    secret?: string;
    isActive: boolean;
    lastTriggeredAt?: Date;
    failureCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLogEntry {
    id: string;
    organizationId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

export interface Backup {
    id: string;
    organizationId: string;
    type: 'full' | 'incremental';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    size?: number;
    fileUrl?: string;
    expiresAt?: Date;
    createdBy: string;
    createdAt: Date;
    completedAt?: Date;
}

