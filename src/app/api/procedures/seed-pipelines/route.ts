import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { procedureTemplates, procedureSteps, procedureTransitions } from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/procedures/seed-pipelines
 * 
 * Seeds the 5 pipeline templates that power the staff pipeline page.
 * Idempotent — checks if templates already exist before creating.
 * 
 * Templates created:
 * 1. Funil de Leads (lead) — 5 stages
 * 2. Funil de Vendas (sale) — 5 stages  
 * 3. Jornada do Aluno (enrollment) — 5 stages
 * 4. Pós-Venda (postsale) — 5 stages
 * 5. Contratos (contract) — 4 stages
 */

// ============================================================================
// PIPELINE DEFINITIONS
// ============================================================================

interface StepDef {
    stepCode: string;
    name: string;
    color: string;
    icon: string;
    expectedDurationMinutes?: number;
    isStartStep?: boolean;
    isEndStep?: boolean;
    stepType: string;
}

interface PipelineDef {
    name: string;
    slug: string;
    description: string;
    entityType: string;
    category: string;
    steps: StepDef[];
}

const PIPELINE_DEFINITIONS: PipelineDef[] = [
    {
        name: 'Funil de Leads',
        slug: 'lead-funnel',
        description: 'Pipeline de captação: do primeiro contato até a aula experimental',
        entityType: 'lead',
        category: 'sales',
        steps: [
            { stepCode: 'NEW', name: 'Novos', color: 'blue', icon: 'IconSparkles', isStartStep: true, stepType: 'action', expectedDurationMinutes: 1440 },
            { stepCode: 'CONTACTED', name: 'Contatados', color: 'cyan', icon: 'IconPhone', stepType: 'communication', expectedDurationMinutes: 2880 },
            { stepCode: 'QUALIFIED', name: 'Qualificados', color: 'teal', icon: 'IconCheck', stepType: 'verification', expectedDurationMinutes: 4320 },
            { stepCode: 'TRIAL_SCHED', name: 'Trial Agendado', color: 'violet', icon: 'IconCalendarEvent', stepType: 'meeting', expectedDurationMinutes: 10080 },
            { stepCode: 'TRIAL_DONE', name: 'Trial Feito', color: 'grape', icon: 'IconSchool', isEndStep: true, stepType: 'milestone', expectedDurationMinutes: 2880 },
        ],
    },
    {
        name: 'Funil de Vendas',
        slug: 'sales-funnel',
        description: 'Pipeline comercial: da proposta ao fechamento',
        entityType: 'sale',
        category: 'sales',
        steps: [
            { stepCode: 'PROPOSAL', name: 'Proposta', color: 'orange', icon: 'IconCurrencyDollar', isStartStep: true, stepType: 'document', expectedDurationMinutes: 4320 },
            { stepCode: 'NEGOTIATION', name: 'Negociação', color: 'yellow', icon: 'IconTargetArrow', stepType: 'action', expectedDurationMinutes: 10080 },
            { stepCode: 'CLOSING', name: 'Fechamento', color: 'lime', icon: 'IconCheck', stepType: 'decision', expectedDurationMinutes: 4320 },
            { stepCode: 'WON', name: 'Ganho ✅', color: 'green', icon: 'IconCheck', isEndStep: true, stepType: 'milestone' },
            { stepCode: 'LOST', name: 'Perdido ❌', color: 'red', icon: 'IconX', isEndStep: true, stepType: 'milestone' },
        ],
    },
    {
        name: 'Jornada do Aluno',
        slug: 'student-journey',
        description: 'Lifecycle do aluno: do onboarding ao status atual',
        entityType: 'enrollment',
        category: 'operations',
        steps: [
            { stepCode: 'ONBOARDING', name: 'Onboarding', color: 'cyan', icon: 'IconSparkles', isStartStep: true, stepType: 'action', expectedDurationMinutes: 10080 },
            { stepCode: 'ACTIVE', name: 'Ativo', color: 'green', icon: 'IconSchool', stepType: 'action' },
            { stepCode: 'AT_RISK', name: 'Em Risco', color: 'orange', icon: 'IconClock', stepType: 'action', expectedDurationMinutes: 20160 },
            { stepCode: 'CHURNING', name: 'Cancelando', color: 'red', icon: 'IconX', stepType: 'escalation', expectedDurationMinutes: 10080 },
            { stepCode: 'PAUSED', name: 'Pausado', color: 'gray', icon: 'IconClock', isEndStep: true, stepType: 'wait' },
        ],
    },
    {
        name: 'Pós-Venda',
        slug: 'postsale-funnel',
        description: 'Pipeline de retenção: upsell, cross-sell e renovação',
        entityType: 'postsale',
        category: 'sales',
        steps: [
            { stepCode: 'IDENTIFY', name: 'Identificados', color: 'blue', icon: 'IconTargetArrow', isStartStep: true, stepType: 'action', expectedDurationMinutes: 10080 },
            { stepCode: 'APPROACH', name: 'Abordagem', color: 'violet', icon: 'IconHeart', stepType: 'communication', expectedDurationMinutes: 7200 },
            { stepCode: 'PRESENT', name: 'Apresentação', color: 'grape', icon: 'IconGift', stepType: 'meeting', expectedDurationMinutes: 7200 },
            { stepCode: 'UPSOLD', name: 'Upsell ✅', color: 'green', icon: 'IconTrendingUp', isEndStep: true, stepType: 'milestone' },
            { stepCode: 'RENEWED', name: 'Renovado ✅', color: 'teal', icon: 'IconRepeat', isEndStep: true, stepType: 'milestone' },
        ],
    },
    {
        name: 'Contratos',
        slug: 'contract-lifecycle',
        description: 'Acompanhamento de contratos do início ao vencimento',
        entityType: 'contract',
        category: 'operations',
        steps: [
            { stepCode: 'NOT_STARTED', name: 'Contratado (Sem Início)', color: 'cyan', icon: 'IconHourglass', isStartStep: true, stepType: 'wait', expectedDurationMinutes: 20160 },
            { stepCode: 'STUDYING', name: 'Contratado e Estudando', color: 'green', icon: 'IconSchool', stepType: 'action' },
            { stepCode: 'ENDING', name: 'Contrato Encerrando', color: 'orange', icon: 'IconAlertTriangle', stepType: 'escalation', expectedDurationMinutes: 43200 },
            { stepCode: 'RENEWAL', name: 'Possíveis Novos Contratos', color: 'violet', icon: 'IconRefresh', isEndStep: true, stepType: 'decision' },
        ],
    },
];

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const auth = await getApiAuthWithOrg();
        if (!auth.orgId) {
            return NextResponse.json({ error: 'Organization required' }, { status: 401 });
        }

        const results: Array<{ name: string; templateId: string; stepsCreated: number; transitionsCreated: number }> = [];

        for (const def of PIPELINE_DEFINITIONS) {
            // Check if template already exists (idempotent)
            const existing = await db
                .select({ id: procedureTemplates.id })
                .from(procedureTemplates)
                .where(
                    and(
                        eq(procedureTemplates.organizationId, auth.orgId),
                        eq(procedureTemplates.slug, def.slug)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                results.push({
                    name: def.name,
                    templateId: existing[0].id,
                    stepsCreated: 0,
                    transitionsCreated: 0,
                });
                continue;
            }

            // Create template
            const [template] = await db.insert(procedureTemplates).values({
                organizationId: auth.orgId,
                name: def.name,
                slug: def.slug,
                description: def.description,
                entityType: def.entityType,
                category: def.category,
                status: 'active',
                version: 1,
                isLearnable: true,
                autoUpdateWiki: false,
                createdBy: auth.personId || null,
            }).returning();

            // Create steps
            const createdSteps: Array<{ id: string; stepCode: string; displayOrder: number }> = [];
            for (let i = 0; i < def.steps.length; i++) {
                const step = def.steps[i];
                const [created] = await db.insert(procedureSteps).values({
                    procedureId: template.id,
                    stepCode: step.stepCode,
                    name: step.name,
                    stepType: step.stepType as any,
                    color: step.color,
                    icon: step.icon,
                    isStartStep: step.isStartStep || false,
                    isEndStep: step.isEndStep || false,
                    expectedDurationMinutes: step.expectedDurationMinutes || null,
                    displayOrder: i,
                    autoAdvance: false,
                }).returning();
                createdSteps.push({ id: created.id, stepCode: step.stepCode, displayOrder: i });
            }

            // Create transitions (linear: step[n] → step[n+1])
            let transitionsCreated = 0;
            for (let i = 0; i < createdSteps.length - 1; i++) {
                const from = createdSteps[i];
                const to = createdSteps[i + 1];

                // Skip transitions FROM end-steps
                const fromDef = def.steps[i];
                if (fromDef.isEndStep) continue;

                await db.insert(procedureTransitions).values({
                    procedureId: template.id,
                    fromStepId: from.id,
                    toStepId: to.id,
                    label: `${from.stepCode} → ${to.stepCode}`,
                    priority: 0,
                    lineStyle: 'solid',
                });
                transitionsCreated++;
            }

            // Special case: Sales funnel has CLOSING → WON and CLOSING → LOST
            if (def.slug === 'sales-funnel') {
                const closingStep = createdSteps.find(s => s.stepCode === 'CLOSING');
                const wonStep = createdSteps.find(s => s.stepCode === 'WON');
                const lostStep = createdSteps.find(s => s.stepCode === 'LOST');

                if (closingStep && lostStep) {
                    // The linear transition already created CLOSING → WON
                    // We need CLOSING → LOST for the branch
                    await db.insert(procedureTransitions).values({
                        procedureId: template.id,
                        fromStepId: closingStep.id,
                        toStepId: lostStep.id,
                        label: 'Perdido',
                        priority: 1,
                        lineStyle: 'dashed',
                        color: 'red',
                    });
                    transitionsCreated++;
                }
            }

            results.push({
                name: def.name,
                templateId: template.id,
                stepsCreated: createdSteps.length,
                transitionsCreated,
            });
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${results.filter(r => r.stepsCreated > 0).length} new pipeline templates`,
            templates: results,
        });
    } catch (error: any) {
        console.error('[seed-pipelines] Error:', error);
        return NextResponse.json(
            { error: 'Failed to seed pipelines', details: error?.message },
            { status: 500 }
        );
    }
}
