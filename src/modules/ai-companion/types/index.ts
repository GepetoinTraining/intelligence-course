// AI Companion Module Types

export interface AIChat {
    id: string;
    organizationId: string;
    userId: string;
    title?: string;
    messages: AIChatMessage[];
    context?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface AIChatMessage {
    id: string;
    chatId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens?: number;
    createdAt: Date;
}

export interface AIGenerator {
    id: string;
    organizationId: string;
    type: GeneratorType;
    name: string;
    description?: string;
    promptTemplate: string;
    variables?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type GeneratorType =
    | 'lesson_plan'
    | 'content'
    | 'assessment'
    | 'message'
    | 'proposal'
    | 'report';

export interface AIAnalysis {
    id: string;
    organizationId: string;
    type: AnalysisType;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdBy: string;
    createdAt: Date;
    completedAt?: Date;
}

export type AnalysisType =
    | 'student_performance'
    | 'sales_forecast'
    | 'churn_prediction'
    | 'sentiment'
    | 'content_quality';

export interface AIInsight {
    id: string;
    organizationId: string;
    type: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    actionable: boolean;
    actions?: AIInsightAction[];
    status: 'new' | 'viewed' | 'actioned' | 'dismissed';
    createdAt: Date;
    updatedAt: Date;
}

export interface AIInsightAction {
    label: string;
    action: string;
    params?: Record<string, unknown>;
}

export interface AIUsage {
    id: string;
    organizationId: string;
    period: string; // YYYY-MM
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    requests: number;
    cost: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryNode {
    id: string;
    organizationId: string;
    graphId: string;
    type: string;
    content: string;
    embedding?: number[];
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryEdge {
    id: string;
    graphId: string;
    sourceId: string;
    targetId: string;
    type: string;
    weight?: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

