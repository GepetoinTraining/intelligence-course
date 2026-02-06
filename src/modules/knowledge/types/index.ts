// Knowledge Module Types

export interface WikiArticle {
    id: string;
    organizationId: string;
    title: string;
    slug: string;
    content: string;
    categoryId?: string;
    status: 'draft' | 'published' | 'archived';
    author: string;
    contributors?: string[];
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface WikiCategory {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    parentId?: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Procedure {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    department?: string;
    version: string;
    status: 'draft' | 'active' | 'deprecated';
    steps: ProcedureStep[];
    approvedBy?: string;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProcedureStep {
    id: string;
    procedureId: string;
    order: number;
    title: string;
    description: string;
    responsible?: string;
    expectedDuration?: number; // minutes
}

export interface Policy {
    id: string;
    organizationId: string;
    title: string;
    category: string;
    content: string;
    version: string;
    status: 'draft' | 'active' | 'deprecated';
    effectiveDate?: Date;
    reviewDate?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface FAQItem {
    id: string;
    organizationId: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    isPublic: boolean;
    viewCount: number;
    helpful: number;
    notHelpful: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TrainingMaterial {
    id: string;
    organizationId: string;
    title: string;
    description?: string;
    type: 'document' | 'video' | 'course' | 'quiz';
    url?: string;
    content?: string;
    category: string;
    duration?: number;
    status: 'draft' | 'published' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

export interface DocumentTemplate {
    id: string;
    organizationId: string;
    name: string;
    category: string;
    description?: string;
    content: string;
    variables?: string[];
    status: 'draft' | 'active' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

export interface FileItem {
    id: string;
    organizationId: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
    mimeType?: string;
    size?: number;
    parentId?: string;
    url?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

