// Analytics Module Types

export interface Dashboard {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    layout: DashboardLayout;
    widgets: DashboardWidget[];
    isDefault: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardLayout {
    columns: number;
    rows: number;
}

export interface DashboardWidget {
    id: string;
    dashboardId: string;
    type: WidgetType;
    title: string;
    config: Record<string, unknown>;
    position: { x: number; y: number; w: number; h: number };
}

export type WidgetType =
    | 'metric'
    | 'chart_line'
    | 'chart_bar'
    | 'chart_pie'
    | 'chart_donut'
    | 'table'
    | 'list'
    | 'progress';

export interface KPI {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    category: string;
    formula: string;
    unit: string;
    target?: number;
    currentValue?: number;
    trend?: 'up' | 'down' | 'stable';
    trendPercentage?: number;
    updatedAt: Date;
}

export interface Report {
    id: string;
    organizationId: string;
    name: string;
    category: ReportCategory;
    type: 'standard' | 'custom';
    config: ReportConfig;
    status: 'draft' | 'published';
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export type ReportCategory =
    | 'commercial'
    | 'academic'
    | 'financial'
    | 'hr'
    | 'operational'
    | 'custom';

export interface ReportConfig {
    dataSource: string;
    filters?: ReportFilter[];
    columns: ReportColumn[];
    groupBy?: string[];
    orderBy?: { field: string; direction: 'asc' | 'desc' }[];
}

export interface ReportFilter {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
    value: unknown;
}

export interface ReportColumn {
    field: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'currency' | 'percentage';
    aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ScheduledReport {
    id: string;
    organizationId: string;
    reportId: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    format: 'pdf' | 'excel' | 'csv';
    recipients: string[];
    isActive: boolean;
    lastRunAt?: Date;
    nextRunAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Export {
    id: string;
    organizationId: string;
    type: 'report' | 'data';
    format: 'pdf' | 'excel' | 'csv' | 'json';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    fileUrl?: string;
    expiresAt?: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

