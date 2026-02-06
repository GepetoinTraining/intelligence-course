// Marketing Module Types

export interface Campaign {
    id: string;
    organizationId: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    budget?: number;
    spent?: number;
    startDate?: Date;
    endDate?: Date;
    targetAudience?: string;
    channels: string[];
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CampaignType =
    | 'awareness'
    | 'lead_generation'
    | 'conversion'
    | 'retention'
    | 'referral'
    | 'event'
    | 'seasonal';

export type CampaignStatus =
    | 'draft'
    | 'scheduled'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled';

export interface Lead {
    id: string;
    organizationId: string;
    personId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    status: LeadStatus;
    stage: LeadStage;
    source?: string;
    campaignId?: string;
    assignedTo?: string;
    score?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type LeadStatus =
    | 'new'
    | 'contacted'
    | 'qualified'
    | 'unqualified'
    | 'nurturing';

export type LeadStage =
    | 'awareness'
    | 'interest'
    | 'consideration'
    | 'intent'
    | 'evaluation'
    | 'purchase';

export interface Source {
    id: string;
    organizationId: string;
    name: string;
    type: SourceType;
    isActive: boolean;
    leadsCount: number;
    conversionRate?: number;
    createdAt: Date;
    updatedAt: Date;
}

export type SourceType =
    | 'organic'
    | 'paid'
    | 'referral'
    | 'direct'
    | 'social'
    | 'email'
    | 'event'
    | 'partner';

export interface LandingPage {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    template?: string;
    views: number;
    conversions: number;
    campaignId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Referral {
    id: string;
    organizationId: string;
    referrerId: string;
    referredId?: string;
    status: 'pending' | 'converted' | 'rewarded' | 'expired';
    rewardType?: string;
    rewardValue?: number;
    createdAt: Date;
    updatedAt: Date;
}

