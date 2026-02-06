// Sales Module Types

export interface Opportunity {
    id: string;
    organizationId: string;
    leadId: string;
    name: string;
    value: number;
    stage: OpportunityStage;
    probability: number;
    expectedCloseDate?: Date;
    assignedTo?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type OpportunityStage =
    | 'prospecting'
    | 'qualification'
    | 'needs_analysis'
    | 'proposal'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';

export interface Proposal {
    id: string;
    organizationId: string;
    opportunityId: string;
    number: string;
    status: ProposalStatus;
    totalValue: number;
    validUntil?: Date;
    items: ProposalItem[];
    terms?: string;
    sentAt?: Date;
    viewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type ProposalStatus =
    | 'draft'
    | 'sent'
    | 'viewed'
    | 'accepted'
    | 'rejected'
    | 'expired';

export interface ProposalItem {
    id: string;
    proposalId: string;
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
}

export interface Pipeline {
    id: string;
    organizationId: string;
    name: string;
    stages: PipelineStage[];
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PipelineStage {
    id: string;
    pipelineId: string;
    name: string;
    order: number;
    probability: number;
    color: string;
}

export interface SalesTarget {
    id: string;
    organizationId: string;
    userId?: string;
    teamId?: string;
    period: 'monthly' | 'quarterly' | 'yearly';
    year: number;
    month?: number;
    quarter?: number;
    targetValue: number;
    achievedValue: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface FollowUp {
    id: string;
    organizationId: string;
    opportunityId: string;
    type: 'call' | 'email' | 'meeting' | 'task';
    status: 'pending' | 'completed' | 'cancelled';
    scheduledAt: Date;
    completedAt?: Date;
    notes?: string;
    assignedTo: string;
    createdAt: Date;
    updatedAt: Date;
}

