/**
 * Procedures API
 * 
 * GET /api/procedures - List procedure templates
 * POST /api/procedures - Create a new procedure template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    procedureTemplates,
    procedureSteps,
    procedureTransitions,
    procedureExecutions,
    users,
    wikiPages,
} from '@/lib/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { CreateProcedureTemplateSchema, generateMermaidFlowchart } from '@/lib/validations/procedures';

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query params
        const category = request.nextUrl.searchParams.get('category');
        const entityType = request.nextUrl.searchParams.get('entityType');
        const status = request.nextUrl.searchParams.get('status');
        const includeSteps = request.nextUrl.searchParams.get('includeSteps') === 'true';

        // Build query conditions
        const conditions = [eq(procedureTemplates.organizationId, orgId)];

        if (category) {
            conditions.push(eq(procedureTemplates.category, category));
        }
        if (entityType) {
            conditions.push(eq(procedureTemplates.entityType, entityType));
        }
        if (status) {
            conditions.push(eq(procedureTemplates.status, status as any));
        }

        // Get procedures
        const procedures = await db.select()
            .from(procedureTemplates)
            .where(and(...conditions))
            .orderBy(procedureTemplates.category, procedureTemplates.name);

        // Enrich with step counts and analytics if needed
        const enrichedProcedures = await Promise.all(
            procedures.map(async (proc) => {
                // Get step count
                const [stepCount] = await db.select({ count: count() })
                    .from(procedureSteps)
                    .where(eq(procedureSteps.procedureId, proc.id));

                // Get execution stats
                const [execStats] = await db.select({
                    total: count(),
                    completed: count(sql`CASE WHEN status = 'completed' THEN 1 END`),
                    avgDuration: sql<number>`AVG(duration_minutes)`,
                })
                    .from(procedureExecutions)
                    .where(eq(procedureExecutions.procedureId, proc.id));

                const result: any = {
                    ...proc,
                    stepCount: stepCount.count,
                    executionCount: execStats.total || 0,
                    completedCount: execStats.completed || 0,
                    avgDurationMinutes: execStats.avgDuration || null,
                };

                // Include steps if requested
                if (includeSteps) {
                    const steps = await db.select()
                        .from(procedureSteps)
                        .where(eq(procedureSteps.procedureId, proc.id))
                        .orderBy(procedureSteps.displayOrder);

                    const transitions = await db.select()
                        .from(procedureTransitions)
                        .where(eq(procedureTransitions.procedureId, proc.id));

                    result.steps = steps;
                    result.transitions = transitions;

                    // Generate Mermaid code
                    result.mermaidCode = generateMermaidFlowchart(
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
                }

                return result;
            })
        );

        // Get category list for filtering
        const categories = await db.selectDistinct({ category: procedureTemplates.category })
            .from(procedureTemplates)
            .where(eq(procedureTemplates.organizationId, orgId));

        return NextResponse.json({
            procedures: enrichedProcedures,
            categories: categories.map(c => c.category).filter(Boolean),
        });

    } catch (error) {
        console.error('Error fetching procedures:', error);
        return NextResponse.json({ error: 'Failed to fetch procedures' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Validate input
        const validation = CreateProcedureTemplateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Check for duplicate slug
        const existing = await db.select({ id: procedureTemplates.id })
            .from(procedureTemplates)
            .where(and(
                eq(procedureTemplates.organizationId, orgId),
                eq(procedureTemplates.slug, data.slug)
            ))
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({
                error: 'A procedure with this slug already exists'
            }, { status: 409 });
        }

        // Create procedure
        const [newProcedure] = await db.insert(procedureTemplates).values({
            organizationId: orgId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            category: data.category,
            subcategory: data.subcategory,
            tags: JSON.stringify(data.tags),
            entityType: data.entityType,
            triggerCondition: data.triggerCondition ? JSON.stringify(data.triggerCondition) : null,
            isLearnable: data.isLearnable,
            targetDurationHours: data.targetDurationHours,
            warningThresholdPercent: data.warningThresholdPercent,
            autoUpdateWiki: data.autoUpdateWiki,
            createdBy: userId,
            status: 'draft',
        }).returning();

        // Auto-create wiki page if enabled
        if (data.autoUpdateWiki) {
            const [wikiPage] = await db.insert(wikiPages).values({
                organizationId: orgId,
                title: `Processo: ${data.name}`,
                slug: `procedure-${data.slug}`,
                content: generateInitialWikiContent(data.name, data.description),
                category: 'procedures',
                sourceType: 'procedure',
                sourceProcedureId: newProcedure.id,
                autoUpdate: true,
                status: 'draft',
                createdBy: userId,
            }).returning();

            // Update procedure with wiki page ID
            await db.update(procedureTemplates)
                .set({ wikiPageId: wikiPage.id })
                .where(eq(procedureTemplates.id, newProcedure.id));
        }

        return NextResponse.json({
            success: true,
            procedure: newProcedure,
        });

    } catch (error) {
        console.error('Error creating procedure:', error);
        return NextResponse.json({ error: 'Failed to create procedure' }, { status: 500 });
    }
}

function generateInitialWikiContent(name: string, description?: string): string {
    return `# ${name}

${description || '*Descrição não disponível.*'}

## Fluxograma

*O fluxograma será gerado automaticamente quando os passos forem adicionados.*

## Passos do Processo

*Nenhum passo definido ainda.*

## Métricas

| Métrica | Valor |
|---------|-------|
| Duração Média | - |
| Taxa de Conclusão | - |
| Execuções Totais | 0 |

---
*Esta página é atualizada automaticamente com base nos dados do procedimento.*
`;
}

