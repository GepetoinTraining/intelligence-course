/**
 * Procedure Mapping Zod Validation Schemas
 * 
 * Defines validation rules for:
 * - Procedure templates and steps
 * - Step types and transitions
 * - Procedure executions and analytics
 * - Stakeholder lifecycles
 * - Wiki pages
 */

import { z } from 'zod';

// ============================================================================
// STEP TYPE ENUM
// ============================================================================

export const StepTypeEnum = z.enum([
    'decision',       // Branching point with multiple possible outcomes
    'action',         // Simple task/action to complete
    'communication',  // Send email, message, call, notification
    'event',          // External trigger or scheduled event
    'approval',       // Requires sign-off/authorization
    'wait',           // Time-based delay or external dependency
    'milestone',      // Key checkpoint/achievement point
    'integration',    // External system interaction (API, webhook)
    'document',       // Document generation, signing, upload
    'meeting',        // Scheduled meeting or call
    'data_entry',     // Form fill, data input
    'verification',   // Check/validate something
    'notification',   // Inform stakeholder (no response needed)
    'escalation',     // Escalate to higher authority
    'handoff',        // Transfer to another person/team
    'parallel_start', // Begin parallel execution paths
    'parallel_end',   // Merge parallel paths
    'loop_start',     // Begin loop/iteration
    'loop_end',       // End loop condition
    'subprocess',     // Trigger another procedure
]);

export type StepType = z.infer<typeof StepTypeEnum>;

// Step type icons mapping
export const STEP_TYPE_ICONS: Record<StepType, string> = {
    decision: 'IconGitBranch',
    action: 'IconPlayerPlay',
    communication: 'IconMessageCircle',
    event: 'IconBell',
    approval: 'IconCheck',
    wait: 'IconClock',
    milestone: 'IconFlag',
    integration: 'IconApi',
    document: 'IconFileText',
    meeting: 'IconCalendarEvent',
    data_entry: 'IconForms',
    verification: 'IconChecklist',
    notification: 'IconBellRinging',
    escalation: 'IconArrowUp',
    handoff: 'IconRefresh',
    parallel_start: 'IconGitFork',
    parallel_end: 'IconGitMerge',
    loop_start: 'IconRepeat',
    loop_end: 'IconRepeatOff',
    subprocess: 'IconBoxMultiple',
};

// Step type colors mapping
export const STEP_TYPE_COLORS: Record<StepType, string> = {
    decision: 'orange',
    action: 'blue',
    communication: 'cyan',
    event: 'yellow',
    approval: 'green',
    wait: 'gray',
    milestone: 'pink',
    integration: 'violet',
    document: 'indigo',
    meeting: 'teal',
    data_entry: 'grape',
    verification: 'lime',
    notification: 'red',
    escalation: 'red',
    handoff: 'orange',
    parallel_start: 'blue',
    parallel_end: 'blue',
    loop_start: 'violet',
    loop_end: 'violet',
    subprocess: 'grape',
};

// Step type Mermaid shape mapping
export const STEP_TYPE_SHAPES: Record<StepType, { start: string; end: string }> = {
    decision: { start: '{', end: '}' },       // Diamond
    action: { start: '[', end: ']' },         // Rectangle
    communication: { start: '([', end: '])' }, // Stadium
    event: { start: '>', end: ']' },          // Flag
    approval: { start: '{{', end: '}}' },     // Hexagon
    wait: { start: '[[', end: ']]' },         // Subroutine
    milestone: { start: '(((', end: ')))' },  // Circle in circle
    integration: { start: '[(', end: ')]' },  // Cylinder
    document: { start: '[/', end: '/]' },     // Parallelogram
    meeting: { start: '([', end: '])' },      // Stadium
    data_entry: { start: '[/', end: '/]' },   // Parallelogram
    verification: { start: '{{', end: '}}' }, // Hexagon
    notification: { start: '>', end: ']' },   // Flag
    escalation: { start: '>', end: ']' },     // Flag
    handoff: { start: '([', end: '])' },      // Stadium
    parallel_start: { start: '([', end: '])' },
    parallel_end: { start: '([', end: '])' },
    loop_start: { start: '([', end: '])' },
    loop_end: { start: '([', end: '])' },
    subprocess: { start: '[[', end: ']]' },   // Subroutine
};

// ============================================================================
// PROCEDURE TEMPLATE SCHEMAS
// ============================================================================

export const ProcedureStatusEnum = z.enum(['draft', 'active', 'deprecated', 'archived']);

export const CreateProcedureTemplateSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    slug: z.string()
        .min(2)
        .max(50)
        .regex(/^[a-z][a-z0-9_-]*$/, 'Slug must be lowercase with dashes or underscores'),
    description: z.string().max(2000).optional(),

    category: z.string().max(50).optional(),
    subcategory: z.string().max(50).optional(),
    tags: z.array(z.string()).default([]),

    entityType: z.string().max(50).optional(),
    triggerCondition: z.record(z.string(), z.any()).optional(),

    isLearnable: z.boolean().default(true),
    targetDurationHours: z.number().int().min(1).optional(),
    warningThresholdPercent: z.number().int().min(1).max(100).default(80),

    autoUpdateWiki: z.boolean().default(true),
});

export type CreateProcedureTemplate = z.infer<typeof CreateProcedureTemplateSchema>;

// ============================================================================
// PROCEDURE STEP SCHEMAS
// ============================================================================

export const DecisionOptionSchema = z.object({
    label: z.string().min(1),
    value: z.string().optional(),
    transitionTo: z.string().optional(), // Step code to transition to
    condition: z.record(z.string(), z.any()).optional(),
    color: z.string().optional(),
});

export const NotificationTemplateSchema = z.object({
    type: z.enum(['email', 'push', 'sms', 'in_app']),
    templateId: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    recipientType: z.enum(['actor', 'assignee', 'manager', 'custom']),
    recipientIds: z.array(z.string()).optional(),
});

export const CreateProcedureStepSchema = z.object({
    procedureId: z.string().uuid(),

    stepCode: z.string()
        .min(1)
        .max(10)
        .regex(/^[A-Z0-9_]+$/, 'Step code must be uppercase alphanumeric'),
    name: z.string().min(2).max(200),
    description: z.string().max(1000).optional(),

    stepType: StepTypeEnum,

    positionX: z.number().default(0),
    positionY: z.number().default(0),

    entryConditions: z.record(z.string(), z.any()).optional(),
    exitConditions: z.record(z.string(), z.any()).optional(),
    decisionOptions: z.array(DecisionOptionSchema).optional(),

    expectedDurationMinutes: z.number().int().min(1).optional(),

    assignedRoleId: z.string().uuid().optional(),
    assignmentRule: z.record(z.string(), z.any()).optional(),

    createsActionItem: z.boolean().default(false),
    actionItemTypeId: z.string().uuid().optional(),

    createsMeeting: z.boolean().default(false),
    meetingTemplateId: z.string().uuid().optional(),

    sendsNotification: z.boolean().default(false),
    notificationTemplate: NotificationTemplateSchema.optional(),

    formSchema: z.record(z.string(), z.any()).optional(),

    icon: z.string().default('IconCircle'),
    color: z.string().default('blue'),

    isOptional: z.boolean().default(false),
    isStartStep: z.boolean().default(false),
    isEndStep: z.boolean().default(false),
    displayOrder: z.number().int().default(0),
});

export type CreateProcedureStep = z.infer<typeof CreateProcedureStepSchema>;

// ============================================================================
// PROCEDURE TRANSITION SCHEMAS
// ============================================================================

export const CreateTransitionSchema = z.object({
    procedureId: z.string().uuid(),
    fromStepId: z.string().uuid(),
    toStepId: z.string().uuid(),

    label: z.string().max(50).optional(),
    condition: z.record(z.string(), z.any()).optional(),
    priority: z.number().int().default(0),

    lineStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
    color: z.string().optional(),
}).refine(
    (data) => data.fromStepId !== data.toStepId,
    { message: 'Cannot create transition to same step' }
);

export type CreateTransition = z.infer<typeof CreateTransitionSchema>;

// ============================================================================
// PROCEDURE EXECUTION SCHEMAS
// ============================================================================

export const ExecutionStatusEnum = z.enum([
    'pending', 'in_progress', 'completed', 'failed', 'cancelled', 'on_hold'
]);

export const StartExecutionSchema = z.object({
    procedureId: z.string().uuid(),
    entityType: z.string().min(1).max(50),
    entityId: z.string().min(1),

    assignedUserId: z.string().optional(),
    targetCompletionAt: z.number().int().optional(),
    initialData: z.record(z.string(), z.any()).optional(),
});

export type StartExecution = z.infer<typeof StartExecutionSchema>;

export const CompleteStepSchema = z.object({
    executionId: z.string().uuid(),
    stepId: z.string().uuid(),

    decisionOutcome: z.string().optional(),
    stepData: z.record(z.string(), z.any()).optional(),
    notes: z.string().max(2000).optional(),

    transitionToStepCode: z.string().optional(),
});

export type CompleteStep = z.infer<typeof CompleteStepSchema>;

// ============================================================================
// STAKEHOLDER LIFECYCLE SCHEMAS
// ============================================================================

export const LifecycleStageSchema = z.object({
    stage: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    procedures: z.array(z.string()), // Procedure slugs
    color: z.string().optional(),
    icon: z.string().optional(),
    expectedDurationDays: z.number().int().optional(),
});

export const CreateLifecycleSchema = z.object({
    entityType: z.string().min(1).max(50),
    name: z.string().min(2).max(200),
    description: z.string().max(2000).optional(),

    stages: z.array(LifecycleStageSchema).min(1),

    expectedDurationDays: z.number().int().min(1).optional(),

    diagramConfig: z.record(z.string(), z.any()).optional(),
});

export type CreateLifecycle = z.infer<typeof CreateLifecycleSchema>;

// ============================================================================
// WIKI PAGE SCHEMAS
// ============================================================================

export const WikiPageStatusEnum = z.enum(['draft', 'published', 'archived']);
export const WikiSourceTypeEnum = z.enum(['manual', 'procedure', 'lifecycle', 'auto_generated']);

export const CreateWikiPageSchema = z.object({
    title: z.string().min(2).max(200),
    slug: z.string()
        .min(2)
        .max(100)
        .regex(/^[a-z][a-z0-9_-]*$/, 'Slug must be lowercase with dashes or underscores'),

    content: z.string().max(100000).optional(),

    parentPageId: z.string().uuid().optional(),
    displayOrder: z.number().int().default(0),

    category: z.string().max(50).optional(),
    tags: z.array(z.string()).default([]),

    sourceType: WikiSourceTypeEnum.default('manual'),
    sourceProcedureId: z.string().uuid().optional(),
    sourceLifecycleId: z.string().uuid().optional(),

    autoUpdate: z.boolean().default(false),
    includesAnalytics: z.boolean().default(false),
});

export type CreateWikiPage = z.infer<typeof CreateWikiPageSchema>;

// ============================================================================
// MERMAID FLOWCHART GENERATION
// ============================================================================

export interface MermaidFlowchartOptions {
    direction?: 'TD' | 'LR' | 'BT' | 'RL';
    showAnalytics?: boolean;
    showAssignees?: boolean;
    highlightPath?: string[];
    theme?: 'default' | 'forest' | 'dark' | 'neutral';
}

/**
 * Generates Mermaid flowchart code from procedure steps and transitions
 */
export function generateMermaidFlowchart(
    steps: Array<{
        id: string;
        stepCode: string;
        name: string;
        stepType: StepType;
        medianDurationMinutes?: number | null;
    }>,
    transitions: Array<{
        fromStepId: string;
        toStepId: string;
        label?: string | null;
        transitionPercentage?: number | null;
    }>,
    options: MermaidFlowchartOptions = {}
): string {
    const { direction = 'TD', showAnalytics = false } = options;

    const lines: string[] = [];
    lines.push(`flowchart ${direction}`);
    lines.push('');

    // Define nodes
    const stepIdToCode = new Map<string, string>();
    for (const step of steps) {
        stepIdToCode.set(step.id, step.stepCode);

        const shape = STEP_TYPE_SHAPES[step.stepType] || { start: '[', end: ']' };
        let label = step.name;

        if (showAnalytics && step.medianDurationMinutes) {
            const hours = Math.floor(step.medianDurationMinutes / 60);
            const mins = step.medianDurationMinutes % 60;
            const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            label += `<br/><small>~${duration}</small>`;
        }

        lines.push(`    ${step.stepCode}${shape.start}"${label}"${shape.end}`);
    }

    lines.push('');

    // Define transitions
    for (const transition of transitions) {
        const fromCode = stepIdToCode.get(transition.fromStepId);
        const toCode = stepIdToCode.get(transition.toStepId);

        if (!fromCode || !toCode) continue;

        let arrow = '-->';
        let label = transition.label || '';

        if (showAnalytics && transition.transitionPercentage) {
            label = label ? `${label} (${transition.transitionPercentage}%)` : `${transition.transitionPercentage}%`;
        }

        if (label) {
            lines.push(`    ${fromCode} ${arrow}|"${label}"| ${toCode}`);
        } else {
            lines.push(`    ${fromCode} ${arrow} ${toCode}`);
        }
    }

    return lines.join('\n');
}

// ============================================================================
// DEFAULT STAKEHOLDER LIFECYCLES
// ============================================================================

export const DEFAULT_STAKEHOLDER_LIFECYCLES = [
    {
        entityType: 'lead',
        name: 'Lead Journey',
        description: 'Complete lead lifecycle from first contact to enrollment',
        stages: [
            { stage: 'new', name: 'Novo Lead', procedures: ['first_contact'] },
            { stage: 'contacted', name: 'Contatado', procedures: ['initial_call', 'needs_assessment'] },
            { stage: 'qualified', name: 'Qualificado', procedures: ['qualification'] },
            { stage: 'trial_scheduled', name: 'Aula Agendada', procedures: ['schedule_trial'] },
            { stage: 'trial_completed', name: 'Aula Realizada', procedures: ['trial_feedback'] },
            { stage: 'proposal_sent', name: 'Proposta Enviada', procedures: ['send_proposal'] },
            { stage: 'negotiating', name: 'Negociando', procedures: ['negotiation'] },
            { stage: 'closed_won', name: 'Fechado - Ganho', procedures: ['enrollment_onboarding'] },
            { stage: 'closed_lost', name: 'Fechado - Perdido', procedures: ['lost_analysis'] },
        ],
    },
    {
        entityType: 'enrollment',
        name: 'Student Journey',
        description: 'Student lifecycle from enrollment to graduation',
        stages: [
            { stage: 'onboarding', name: 'Onboarding', procedures: ['student_onboarding'] },
            { stage: 'active', name: 'Ativo', procedures: ['regular_classes', 'progress_tracking'] },
            { stage: 'at_risk', name: 'Em Risco', procedures: ['retention_campaign'] },
            { stage: 'paused', name: 'Pausado', procedures: ['reactivation'] },
            { stage: 'completing', name: 'Concluindo', procedures: ['graduation_prep'] },
            { stage: 'graduated', name: 'Formado', procedures: ['graduation', 'alumni'] },
            { stage: 'cancelled', name: 'Cancelado', procedures: ['cancellation_analysis'] },
        ],
    },
    {
        entityType: 'employee',
        name: 'Employee Journey',
        description: 'Employee lifecycle from hiring to exit',
        stages: [
            { stage: 'candidate', name: 'Candidato', procedures: ['recruitment'] },
            { stage: 'hired', name: 'Contratado', procedures: ['employee_onboarding'] },
            { stage: 'probation', name: 'Experiência', procedures: ['probation_review'] },
            { stage: 'active', name: 'Ativo', procedures: ['performance_management'] },
            { stage: 'promoted', name: 'Promovido', procedures: ['promotion_onboarding'] },
            { stage: 'offboarding', name: 'Desligamento', procedures: ['exit_process'] },
        ],
    },
];

