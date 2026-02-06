/**
 * Procedure Steps API
 * 
 * GET /api/procedures/[id]/steps - List steps for a procedure
 * POST /api/procedures/[id]/steps - Add a step to a procedure
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    procedureTemplates,
    procedureSteps,
    procedureTransitions,
    wikiPages,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateProcedureStepSchema, generateMermaidFlowchart, STEP_TYPE_ICONS, STEP_TYPE_COLORS } from '@/lib/validations/procedures';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: procedureId } = await params;

        // Verify procedure exists and belongs to org
        const [procedure] = await db.select()
            .from(procedureTemplates)
            .where(and(
                eq(procedureTemplates.id, procedureId),
                eq(procedureTemplates.organizationId, orgId)
            ))
            .limit(1);

        if (!procedure) {
            return NextResponse.json({ error: 'Procedure not found' }, { status: 404 });
        }

        // Get all steps
        const steps = await db.select()
            .from(procedureSteps)
            .where(eq(procedureSteps.procedureId, procedureId))
            .orderBy(procedureSteps.displayOrder);

        // Get all transitions
        const transitions = await db.select()
            .from(procedureTransitions)
            .where(eq(procedureTransitions.procedureId, procedureId));

        // Generate Mermaid flowchart
        const mermaidCode = generateMermaidFlowchart(
            steps.map(s => ({
                id: s.id,
                stepCode: s.stepCode,
                name: s.name,
                stepType: s.stepType as any,
                medianDurationMinutes: s.medianDurationMinutes,
            })),
            transitions.map(t => ({
                fromStepId: t.fromStepId,
                toStepId: t.toStepId,
                label: t.label,
                transitionPercentage: t.transitionPercentage,
            })),
            { showAnalytics: true }
        );

        // Enrich steps with visual info
        const enrichedSteps = steps.map(step => ({
            ...step,
            icon: step.icon || STEP_TYPE_ICONS[step.stepType as keyof typeof STEP_TYPE_ICONS] || 'IconCircle',
            color: step.color || STEP_TYPE_COLORS[step.stepType as keyof typeof STEP_TYPE_COLORS] || 'blue',
            outgoingTransitions: transitions.filter(t => t.fromStepId === step.id),
            incomingTransitions: transitions.filter(t => t.toStepId === step.id),
        }));

        return NextResponse.json({
            procedure,
            steps: enrichedSteps,
            transitions,
            mermaidCode,
        });

    } catch (error) {
        console.error('Error fetching procedure steps:', error);
        return NextResponse.json({ error: 'Failed to fetch procedure steps' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: procedureId } = await params;
        const body = await request.json();

        // Verify procedure exists and belongs to org
        const [procedure] = await db.select()
            .from(procedureTemplates)
            .where(and(
                eq(procedureTemplates.id, procedureId),
                eq(procedureTemplates.organizationId, orgId)
            ))
            .limit(1);

        if (!procedure) {
            return NextResponse.json({ error: 'Procedure not found' }, { status: 404 });
        }

        // Validate input
        const validation = CreateProcedureStepSchema.safeParse({
            ...body,
            procedureId,
        });
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Check for duplicate step code
        const existingStep = await db.select({ id: procedureSteps.id })
            .from(procedureSteps)
            .where(and(
                eq(procedureSteps.procedureId, procedureId),
                eq(procedureSteps.stepCode, data.stepCode)
            ))
            .limit(1);

        if (existingStep.length > 0) {
            return NextResponse.json({
                error: 'A step with this code already exists in this procedure'
            }, { status: 409 });
        }

        // Get max display order
        const [maxOrder] = await db.select({
            maxOrder: procedureSteps.displayOrder,
        })
            .from(procedureSteps)
            .where(eq(procedureSteps.procedureId, procedureId))
            .orderBy(procedureSteps.displayOrder)
            .limit(1);

        // Create step
        const [newStep] = await db.insert(procedureSteps).values({
            procedureId,
            stepCode: data.stepCode,
            name: data.name,
            description: data.description,
            stepType: data.stepType,
            positionX: data.positionX,
            positionY: data.positionY,
            entryConditions: data.entryConditions ? JSON.stringify(data.entryConditions) : '{}',
            exitConditions: data.exitConditions ? JSON.stringify(data.exitConditions) : '{}',
            decisionOptions: data.decisionOptions ? JSON.stringify(data.decisionOptions) : null,
            expectedDurationMinutes: data.expectedDurationMinutes,
            assignedRoleId: data.assignedRoleId,
            assignmentRule: data.assignmentRule ? JSON.stringify(data.assignmentRule) : null,
            createsActionItem: data.createsActionItem,
            actionItemTypeId: data.actionItemTypeId,
            createsMeeting: data.createsMeeting,
            meetingTemplateId: data.meetingTemplateId,
            sendsNotification: data.sendsNotification,
            notificationTemplate: data.notificationTemplate ? JSON.stringify(data.notificationTemplate) : null,
            formSchema: data.formSchema ? JSON.stringify(data.formSchema) : null,
            icon: data.icon || STEP_TYPE_ICONS[data.stepType] || 'IconCircle',
            color: data.color || STEP_TYPE_COLORS[data.stepType] || 'blue',
            isOptional: data.isOptional,
            isStartStep: data.isStartStep,
            isEndStep: data.isEndStep,
            displayOrder: data.displayOrder || ((maxOrder?.maxOrder || 0) + 1),
        }).returning();

        // Update wiki page if auto-update is enabled
        if (procedure.autoUpdateWiki && procedure.wikiPageId) {
            await updateProcedureWikiPage(procedure.wikiPageId, procedureId, orgId);
        }

        return NextResponse.json({
            success: true,
            step: newStep,
        });

    } catch (error) {
        console.error('Error creating procedure step:', error);
        return NextResponse.json({ error: 'Failed to create procedure step' }, { status: 500 });
    }
}

// Helper to update wiki page content
async function updateProcedureWikiPage(wikiPageId: string, procedureId: string, orgId: string) {
    try {
        // Get procedure details
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

        // Generate Mermaid code
        const mermaidCode = generateMermaidFlowchart(
            steps.map(s => ({
                id: s.id,
                stepCode: s.stepCode,
                name: s.name,
                stepType: s.stepType as any,
                medianDurationMinutes: s.medianDurationMinutes,
            })),
            transitions.map(t => ({
                fromStepId: t.fromStepId,
                toStepId: t.toStepId,
                label: t.label,
                transitionPercentage: t.transitionPercentage,
            })),
            { showAnalytics: true }
        );

        // Generate steps table
        const stepsTable = steps.length > 0
            ? `| Código | Nome | Tipo | Duração Média | Taxa de Conclusão |
|--------|------|------|---------------|-------------------|
${steps.map(s =>
                `| ${s.stepCode} | ${s.name} | ${s.stepType} | ${s.medianDurationMinutes ? `${s.medianDurationMinutes}m` : '-'} | ${s.completionRate ? `${s.completionRate}%` : '-'} |`
            ).join('\n')}`
            : '*Nenhum passo definido ainda.*';

        // Generate content
        const content = `# ${procedure.name}

${procedure.description || '*Descrição não disponível.*'}

## Fluxograma

\`\`\`mermaid
${mermaidCode}
\`\`\`

## Passos do Processo

${stepsTable}

## Métricas

| Métrica | Valor |
|---------|-------|
| Duração Alvo | ${procedure.targetDurationHours ? `${procedure.targetDurationHours}h` : '-'} |
| Total de Passos | ${steps.length} |
| Versão | ${procedure.version} |

---
*Esta página é atualizada automaticamente. Última atualização: ${new Date().toLocaleString('pt-BR')}*
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

    } catch (error) {
        console.error('Error updating wiki page:', error);
    }
}
