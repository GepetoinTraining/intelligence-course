/**
 * Process Discovery Service
 * 
 * Analyzes execution data to:
 * 1. Calculate procedure and step analytics
 * 2. Identify common paths and bottlenecks
 * 3. Learn procedure patterns from raw events
 * 4. Update wiki pages with latest data
 */

import { db } from '@/lib/db';
import {
    procedureTemplates,
    procedureSteps,
    procedureTransitions,
    procedureExecutions,
    stepExecutions,
    procedureAnalytics,
    processDiscoveryEvents,
    wikiPages,
    stakeholderLifecycles,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { generateMermaidFlowchart } from '@/lib/validations/procedures';

// ============================================================================
// ANALYTICS CALCULATION
// ============================================================================

export interface AnalyticsResult {
    executionCount: number;
    completedCount: number;
    failedCount: number;
    cancelledCount: number;
    completionRate: number;
    avgCompletionTimeMinutes: number;
    medianCompletionTimeMinutes: number;
    p90CompletionTimeMinutes: number;
    onTimeCompletionRate: number;
    overdueCount: number;
    stepMetrics: Record<string, StepMetrics>;
    transitionMetrics: Record<string, TransitionMetrics>;
    bottleneckSteps: string[];
    commonPaths: PathInfo[];
}

export interface StepMetrics {
    stepId: string;
    stepCode: string;
    name: string;
    executionCount: number;
    completedCount: number;
    avgDurationMinutes: number;
    medianDurationMinutes: number;
    p90DurationMinutes: number;
    completionRate: number;
    avgWaitTimeMinutes: number;
}

export interface TransitionMetrics {
    transitionId: string;
    fromStepCode: string;
    toStepCode: string;
    label: string | null;
    transitionCount: number;
    percentage: number;
}

export interface PathInfo {
    path: string[];
    count: number;
    percentage: number;
    avgDurationMinutes: number;
}

/**
 * Calculate comprehensive analytics for a procedure
 */
export async function calculateProcedureAnalytics(
    procedureId: string,
    periodType: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
    periodStart?: number,
    periodEnd?: number
): Promise<AnalyticsResult> {
    // Set period bounds
    const now = Date.now();
    if (!periodEnd) periodEnd = now;
    if (!periodStart) {
        switch (periodType) {
            case 'daily':
                periodStart = now - (24 * 60 * 60 * 1000);
                break;
            case 'weekly':
                periodStart = now - (7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                periodStart = now - (30 * 24 * 60 * 60 * 1000);
                break;
            default:
                periodStart = 0;
        }
    }

    // Get executions in period
    const conditions = [
        eq(procedureExecutions.procedureId, procedureId),
    ];
    if (periodStart > 0) {
        conditions.push(gte(procedureExecutions.createdAt, periodStart));
    }
    if (periodEnd) {
        conditions.push(lte(procedureExecutions.createdAt, periodEnd));
    }

    const executions = await db.select()
        .from(procedureExecutions)
        .where(and(...conditions));

    // Calculate basic metrics
    const executionCount = executions.length;
    const completedCount = executions.filter(e => e.status === 'completed').length;
    const failedCount = executions.filter(e => e.status === 'failed').length;
    const cancelledCount = executions.filter(e => e.status === 'cancelled').length;
    const overdueCount = executions.filter(e => e.isOverdue).length;

    const completionRate = executionCount > 0
        ? Math.round((completedCount / executionCount) * 100)
        : 0;

    const onTimeCount = executions.filter(e =>
        e.status === 'completed' &&
        e.completedAt &&
        e.targetCompletionAt &&
        e.completedAt <= e.targetCompletionAt
    ).length;
    const onTimeCompletionRate = completedCount > 0
        ? Math.round((onTimeCount / completedCount) * 100)
        : 0;

    // Calculate duration statistics
    const durations = executions
        .filter(e => e.durationMinutes !== null)
        .map(e => e.durationMinutes!)
        .sort((a, b) => a - b);

    const avgCompletionTimeMinutes = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    const medianCompletionTimeMinutes = durations.length > 0
        ? durations[Math.floor(durations.length / 2)]
        : 0;

    const p90CompletionTimeMinutes = durations.length > 0
        ? durations[Math.floor(durations.length * 0.9)] || durations[durations.length - 1]
        : 0;

    // Calculate step metrics
    const stepMetrics = await calculateStepMetrics(procedureId, executions.map(e => e.id));

    // Calculate transition metrics
    const transitionMetrics = await calculateTransitionMetrics(procedureId);

    // Identify bottlenecks (top 3 slowest steps)
    const bottleneckSteps = Object.entries(stepMetrics)
        .sort((a, b) => (b[1].medianDurationMinutes || 0) - (a[1].medianDurationMinutes || 0))
        .slice(0, 3)
        .map(([stepId]) => stepId);

    // Calculate common paths
    const commonPaths = await calculateCommonPaths(procedureId, executions.map(e => e.id));

    return {
        executionCount,
        completedCount,
        failedCount,
        cancelledCount,
        completionRate,
        avgCompletionTimeMinutes,
        medianCompletionTimeMinutes,
        p90CompletionTimeMinutes,
        onTimeCompletionRate,
        overdueCount,
        stepMetrics,
        transitionMetrics,
        bottleneckSteps,
        commonPaths,
    };
}

async function calculateStepMetrics(
    procedureId: string,
    executionIds: string[]
): Promise<Record<string, StepMetrics>> {
    if (executionIds.length === 0) return {};

    // Get all steps
    const steps = await db.select()
        .from(procedureSteps)
        .where(eq(procedureSteps.procedureId, procedureId));

    const metrics: Record<string, StepMetrics> = {};

    for (const step of steps) {
        // Get step executions
        const stepExecs = await db.select()
            .from(stepExecutions)
            .where(and(
                eq(stepExecutions.stepId, step.id),
                sql`${stepExecutions.executionId} IN (${executionIds.map(() => '?').join(', ')})`
            ));

        const completed = stepExecs.filter(se => se.status === 'completed');
        const durations = completed
            .filter(se => se.durationMinutes !== null)
            .map(se => se.durationMinutes!)
            .sort((a, b) => a - b);

        const waitTimes = stepExecs
            .filter(se => se.waitTimeMinutes !== null)
            .map(se => se.waitTimeMinutes!);

        metrics[step.id] = {
            stepId: step.id,
            stepCode: step.stepCode,
            name: step.name,
            executionCount: stepExecs.length,
            completedCount: completed.length,
            avgDurationMinutes: durations.length > 0
                ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
                : 0,
            medianDurationMinutes: durations.length > 0
                ? durations[Math.floor(durations.length / 2)]
                : 0,
            p90DurationMinutes: durations.length > 0
                ? durations[Math.floor(durations.length * 0.9)] || durations[durations.length - 1]
                : 0,
            completionRate: stepExecs.length > 0
                ? Math.round((completed.length / stepExecs.length) * 100)
                : 0,
            avgWaitTimeMinutes: waitTimes.length > 0
                ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
                : 0,
        };
    }

    return metrics;
}

async function calculateTransitionMetrics(
    procedureId: string
): Promise<Record<string, TransitionMetrics>> {
    const transitions = await db.select()
        .from(procedureTransitions)
        .where(eq(procedureTransitions.procedureId, procedureId));

    const steps = await db.select()
        .from(procedureSteps)
        .where(eq(procedureSteps.procedureId, procedureId));

    const stepCodeMap = new Map(steps.map(s => [s.id, s.stepCode]));

    // Calculate total transitions per source step
    const sourceTotals = new Map<string, number>();
    for (const t of transitions) {
        const current = sourceTotals.get(t.fromStepId) || 0;
        sourceTotals.set(t.fromStepId, current + (t.transitionCount || 0));
    }

    const metrics: Record<string, TransitionMetrics> = {};

    for (const t of transitions) {
        const sourceTotal = sourceTotals.get(t.fromStepId) || 1;
        metrics[t.id] = {
            transitionId: t.id,
            fromStepCode: stepCodeMap.get(t.fromStepId) || 'unknown',
            toStepCode: stepCodeMap.get(t.toStepId) || 'unknown',
            label: t.label,
            transitionCount: t.transitionCount || 0,
            percentage: Math.round(((t.transitionCount || 0) / sourceTotal) * 100),
        };
    }

    return metrics;
}

async function calculateCommonPaths(
    procedureId: string,
    executionIds: string[]
): Promise<PathInfo[]> {
    if (executionIds.length === 0) return [];

    const pathCounts = new Map<string, { count: number; durations: number[] }>();

    for (const execId of executionIds) {
        // Get completed steps in order
        const completedSteps = await db.select({
            stepCode: procedureSteps.stepCode,
            completedAt: stepExecutions.completedAt,
        })
            .from(stepExecutions)
            .innerJoin(procedureSteps, eq(stepExecutions.stepId, procedureSteps.id))
            .where(and(
                eq(stepExecutions.executionId, execId),
                eq(stepExecutions.status, 'completed')
            ))
            .orderBy(stepExecutions.completedAt);

        if (completedSteps.length === 0) continue;

        const path = completedSteps.map(s => s.stepCode).join(' → ');
        const existing = pathCounts.get(path) || { count: 0, durations: [] };
        existing.count++;

        // Get execution duration
        const [exec] = await db.select({ durationMinutes: procedureExecutions.durationMinutes })
            .from(procedureExecutions)
            .where(eq(procedureExecutions.id, execId));

        if (exec?.durationMinutes) {
            existing.durations.push(exec.durationMinutes);
        }

        pathCounts.set(path, existing);
    }

    // Convert to array and calculate percentages
    const totalExecutions = executionIds.length;
    const paths: PathInfo[] = [];

    for (const [path, data] of pathCounts) {
        paths.push({
            path: path.split(' → '),
            count: data.count,
            percentage: Math.round((data.count / totalExecutions) * 100),
            avgDurationMinutes: data.durations.length > 0
                ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
                : 0,
        });
    }

    // Sort by count and return top 5
    return paths.sort((a, b) => b.count - a.count).slice(0, 5);
}

// ============================================================================
// WIKI UPDATE
// ============================================================================

/**
 * Update wiki page with latest procedure analytics
 */
export async function updateProcedureWikiPage(
    wikiPageId: string,
    procedureId: string
): Promise<void> {
    // Get procedure
    const [procedure] = await db.select()
        .from(procedureTemplates)
        .where(eq(procedureTemplates.id, procedureId));

    if (!procedure) return;

    // Get steps and transitions
    const steps = await db.select()
        .from(procedureSteps)
        .where(eq(procedureSteps.procedureId, procedureId))
        .orderBy(procedureSteps.displayOrder);

    const transitions = await db.select()
        .from(procedureTransitions)
        .where(eq(procedureTransitions.procedureId, procedureId));

    // Calculate analytics
    const analytics = await calculateProcedureAnalytics(procedureId);

    // Generate Mermaid flowchart
    const mermaidCode = generateMermaidFlowchart(
        steps.map(s => ({
            id: s.id,
            stepCode: s.stepCode,
            name: s.name,
            stepType: s.stepType as any,
            medianDurationMinutes: analytics.stepMetrics[s.id]?.medianDurationMinutes || null,
        })),
        transitions.map(t => ({
            fromStepId: t.fromStepId,
            toStepId: t.toStepId,
            label: t.label,
            transitionPercentage: analytics.transitionMetrics[t.id]?.percentage || null,
        })),
        { showAnalytics: true }
    );

    // Generate steps table
    const stepsTable = steps.length > 0
        ? `| Código | Nome | Tipo | Duração Mediana | Taxa de Conclusão |
|--------|------|------|-----------------|-------------------|
${steps.map(s => {
            const metrics = analytics.stepMetrics[s.id];
            return `| ${s.stepCode} | ${s.name} | ${s.stepType} | ${metrics?.medianDurationMinutes ? `${metrics.medianDurationMinutes}m` : '-'} | ${metrics?.completionRate ? `${metrics.completionRate}%` : '-'} |`;
        }).join('\n')}`
        : '*Nenhum passo definido ainda.*';

    // Generate common paths section
    const pathsSection = analytics.commonPaths.length > 0
        ? `### Caminhos Mais Comuns

${analytics.commonPaths.map((p, i) =>
            `${i + 1}. **${p.path.join(' → ')}** - ${p.count} execuções (${p.percentage}%) - Duração média: ${p.avgDurationMinutes}m`
        ).join('\n')}`
        : '';

    // Generate bottlenecks section
    const bottlenecksSection = analytics.bottleneckSteps.length > 0
        ? `### Gargalos Identificados

${analytics.bottleneckSteps.map((stepId, i) => {
            const metrics = analytics.stepMetrics[stepId];
            if (!metrics) return '';
            return `${i + 1}. **${metrics.name}** (${metrics.stepCode}) - Duração mediana: ${metrics.medianDurationMinutes}m`;
        }).filter(Boolean).join('\n')}`
        : '';

    // Generate content
    const content = `# ${procedure.name}

${procedure.description || '*Descrição não disponível.*'}

## Fluxograma

\`\`\`mermaid
${mermaidCode}
\`\`\`

## Passos do Processo

${stepsTable}

## Métricas de Performance

| Métrica | Valor |
|---------|-------|
| Execuções Totais | ${analytics.executionCount} |
| Taxa de Conclusão | ${analytics.completionRate}% |
| Duração Mediana | ${analytics.medianCompletionTimeMinutes}m |
| Duração P90 | ${analytics.p90CompletionTimeMinutes}m |
| Taxa de Pontualidade (SLA) | ${analytics.onTimeCompletionRate}% |
| Execuções Atrasadas | ${analytics.overdueCount} |

${pathsSection}

${bottlenecksSection}

---
*Esta página é atualizada automaticamente com base nos dados do procedimento.*
*Última atualização: ${new Date().toLocaleString('pt-BR')}*
`;

    // Update wiki page
    await db.update(wikiPages)
        .set({
            content,
            flowchartCode: mermaidCode,
            lastAutoUpdateAt: Date.now(),
            updatedAt: Date.now(),
        })
        .where(eq(wikiPages.id, wikiPageId));
}

// ============================================================================
// PROCEDURE LEARNING
// ============================================================================

/**
 * Analyze unprocessed discovery events and suggest procedure improvements
 */
export async function analyzeDiscoveryEvents(
    organizationId: string
): Promise<{
    suggestedSteps: Array<{
        entityType: string;
        eventName: string;
        frequency: number;
        suggestedType: string;
    }>;
    suggestedTransitions: Array<{
        fromEvent: string;
        toEvent: string;
        frequency: number;
    }>;
}> {
    // Get unprocessed events
    const events = await db.select()
        .from(processDiscoveryEvents)
        .where(and(
            eq(processDiscoveryEvents.organizationId, organizationId),
            eq(processDiscoveryEvents.isProcessed, false)
        ))
        .orderBy(processDiscoveryEvents.occurredAt)
        .limit(1000);

    // Group events by entity
    const entityEvents = new Map<string, typeof events>();
    for (const event of events) {
        const key = `${event.entityType}:${event.entityId}`;
        const existing = entityEvents.get(key) || [];
        existing.push(event);
        entityEvents.set(key, existing);
    }

    // Count event frequencies
    const eventCounts = new Map<string, number>();
    for (const event of events) {
        const key = `${event.entityType}:${event.eventName}`;
        eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
    }

    // Count transition frequencies (sequential event pairs)
    const transitionCounts = new Map<string, number>();
    for (const [, entityEventList] of entityEvents) {
        for (let i = 0; i < entityEventList.length - 1; i++) {
            const from = entityEventList[i].eventName;
            const to = entityEventList[i + 1].eventName;
            const key = `${from} → ${to}`;
            transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
        }
    }

    // Suggest step types based on event names
    const suggestedSteps = Array.from(eventCounts.entries())
        .filter(([, count]) => count >= 3) // Only events that occur at least 3 times
        .map(([key, frequency]) => {
            const [entityType, eventName] = key.split(':');
            return {
                entityType,
                eventName,
                frequency,
                suggestedType: inferStepType(eventName),
            };
        })
        .sort((a, b) => b.frequency - a.frequency);

    // Suggest transitions
    const suggestedTransitions = Array.from(transitionCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([key, frequency]) => {
            const [fromEvent, toEvent] = key.split(' → ');
            return { fromEvent, toEvent, frequency };
        })
        .sort((a, b) => b.frequency - a.frequency);

    return { suggestedSteps, suggestedTransitions };
}

function inferStepType(eventName: string): string {
    const name = eventName.toLowerCase();

    if (name.includes('decision') || name.includes('escolha') || name.includes('aprovação')) {
        return 'decision';
    }
    if (name.includes('email') || name.includes('mensagem') || name.includes('ligação') || name.includes('call')) {
        return 'communication';
    }
    if (name.includes('meeting') || name.includes('reunião') || name.includes('aula')) {
        return 'meeting';
    }
    if (name.includes('document') || name.includes('contrato') || name.includes('arquivo')) {
        return 'document';
    }
    if (name.includes('wait') || name.includes('aguardar') || name.includes('espera')) {
        return 'wait';
    }
    if (name.includes('approval') || name.includes('aprovação')) {
        return 'approval';
    }
    if (name.includes('milestone') || name.includes('marco')) {
        return 'milestone';
    }
    if (name.includes('form') || name.includes('cadastro') || name.includes('dados')) {
        return 'data_entry';
    }
    if (name.includes('verify') || name.includes('verificar') || name.includes('check')) {
        return 'verification';
    }
    if (name.includes('notify') || name.includes('notificar') || name.includes('aviso')) {
        return 'notification';
    }

    return 'action';
}

// ============================================================================
// LIFECYCLE ANALYTICS
// ============================================================================

/**
 * Calculate lifecycle analytics for a stakeholder type
 */
export async function calculateLifecycleAnalytics(
    lifecycleId: string
): Promise<{
    totalEntities: number;
    avgLifecycleDays: number;
    medianLifecycleDays: number;
    stageMetrics: Record<string, {
        stage: string;
        count: number;
        avgDaysInStage: number;
        conversionRate: number;
    }>;
}> {
    const [lifecycle] = await db.select()
        .from(stakeholderLifecycles)
        .where(eq(stakeholderLifecycles.id, lifecycleId));

    if (!lifecycle) {
        return {
            totalEntities: 0,
            avgLifecycleDays: 0,
            medianLifecycleDays: 0,
            stageMetrics: {},
        };
    }

    const procedureIds = JSON.parse(lifecycle.procedureIds || '[]');

    // Get all executions for lifecycle procedures
    const executions = await db.select()
        .from(procedureExecutions)
        .where(and(
            eq(procedureExecutions.entityType, lifecycle.entityType),
            sql`${procedureExecutions.procedureId} IN (${procedureIds.map(() => '?').join(', ')})`
        ));

    // Group by entity
    const entityExecutions = new Map<string, typeof executions>();
    for (const exec of executions) {
        const existing = entityExecutions.get(exec.entityId) || [];
        existing.push(exec);
        entityExecutions.set(exec.entityId, existing);
    }

    const totalEntities = entityExecutions.size;

    // Calculate lifecycle durations
    const lifecycleDurations: number[] = [];
    for (const [, execs] of entityExecutions) {
        const sorted = execs.sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        if (first.startedAt && last.completedAt) {
            const days = Math.round((last.completedAt - first.startedAt) / (24 * 60 * 60 * 1000));
            lifecycleDurations.push(days);
        }
    }

    lifecycleDurations.sort((a, b) => a - b);

    const avgLifecycleDays = lifecycleDurations.length > 0
        ? Math.round(lifecycleDurations.reduce((a, b) => a + b, 0) / lifecycleDurations.length)
        : 0;

    const medianLifecycleDays = lifecycleDurations.length > 0
        ? lifecycleDurations[Math.floor(lifecycleDurations.length / 2)]
        : 0;

    return {
        totalEntities,
        avgLifecycleDays,
        medianLifecycleDays,
        stageMetrics: {}, // Would need stage tracking to calculate
    };
}

