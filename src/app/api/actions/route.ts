import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { actionTypes, positionPermissions } from '@/lib/db/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';
import { z } from 'zod';

const actionTypeSchema = z.object({
    code: z.string().min(1).max(100),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    category: z.string().min(1).max(50),
    subcategory: z.string().max(50).optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
    requiresApproval: z.boolean().default(false),
    icon: z.string().optional(),
});

// GET /api/actions - List all action types
export async function GET(request: NextRequest) {
    try {
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        const actions = await db
            .select()
            .from(actionTypes)
            .where(
                and(
                    or(
                        eq(actionTypes.organizationId, organizationId),
                        eq(actionTypes.isSystem, true)
                    ),
                    eq(actionTypes.isActive, true),
                    category ? eq(actionTypes.category, category) : undefined,
                    search ? or(
                        like(actionTypes.code, `%${search}%`),
                        like(actionTypes.name, `%${search}%`)
                    ) : undefined
                )
            )
            .orderBy(actionTypes.category, actionTypes.code);

        // Group by category
        const grouped = actions.reduce((acc, action) => {
            const cat = action.category;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(action);
            return acc;
        }, {} as Record<string, typeof actions>);

        return NextResponse.json({
            data: actions,
            grouped,
            categories: Object.keys(grouped).sort(),
        });
    } catch (error) {
        console.error('Error fetching action types:', error);
        return NextResponse.json({ error: 'Failed to fetch action types' }, { status: 500 });
    }
}

// POST /api/actions - Create a new action type
export async function POST(request: NextRequest) {
    try {
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = actionTypeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
        }

        const data = parsed.data;

        // Check uniqueness
        const existing = await db
            .select({ id: actionTypes.id })
            .from(actionTypes)
            .where(
                and(
                    eq(actionTypes.organizationId, organizationId),
                    eq(actionTypes.code, data.code)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Action type with this code already exists' }, { status: 409 });
        }

        const [newAction] = await db.insert(actionTypes).values({
            organizationId,
            code: data.code,
            name: data.name,
            description: data.description,
            category: data.category,
            subcategory: data.subcategory,
            riskLevel: data.riskLevel,
            requiresApproval: data.requiresApproval,
            icon: data.icon,
        }).returning();

        return NextResponse.json({ data: newAction }, { status: 201 });
    } catch (error) {
        console.error('Error creating action type:', error);
        return NextResponse.json({ error: 'Failed to create action type' }, { status: 500 });
    }
}

// Seed default action types
export async function PUT(request: NextRequest) {
    try {
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const defaultActions = [
            // Wiki
            { code: 'wiki.article.view', name: 'Ver Artigos Wiki', category: 'wiki', riskLevel: 'low' },
            { code: 'wiki.article.create', name: 'Criar Artigos Wiki', category: 'wiki', riskLevel: 'low' },
            { code: 'wiki.article.edit', name: 'Editar Artigos Wiki', category: 'wiki', riskLevel: 'low' },
            { code: 'wiki.article.delete', name: 'Excluir Artigos Wiki', category: 'wiki', riskLevel: 'medium' },
            { code: 'wiki.article.publish', name: 'Publicar Artigos Wiki', category: 'wiki', riskLevel: 'medium' },
            { code: 'wiki.category.manage', name: 'Gerenciar Categorias Wiki', category: 'wiki', riskLevel: 'medium' },

            // Kaizen
            { code: 'kaizen.suggestion.view', name: 'Ver Sugestões Kaizen', category: 'kaizen', riskLevel: 'low' },
            { code: 'kaizen.suggestion.create', name: 'Criar Sugestões Kaizen', category: 'kaizen', riskLevel: 'low' },
            { code: 'kaizen.suggestion.vote', name: 'Votar em Sugestões', category: 'kaizen', riskLevel: 'low' },
            { code: 'kaizen.suggestion.comment', name: 'Comentar em Sugestões', category: 'kaizen', riskLevel: 'low' },
            { code: 'kaizen.suggestion.review', name: 'Revisar Sugestões', category: 'kaizen', riskLevel: 'medium' },
            { code: 'kaizen.suggestion.approve', name: 'Aprovar Sugestões', category: 'kaizen', riskLevel: 'high' },

            // CRM
            { code: 'crm.lead.view', name: 'Ver Leads', category: 'crm', riskLevel: 'low' },
            { code: 'crm.lead.create', name: 'Criar Leads', category: 'crm', riskLevel: 'low' },
            { code: 'crm.lead.edit', name: 'Editar Leads', category: 'crm', riskLevel: 'low' },
            { code: 'crm.lead.delete', name: 'Excluir Leads', category: 'crm', riskLevel: 'high' },
            { code: 'crm.deal.close', name: 'Fechar Negócios', category: 'crm', riskLevel: 'high' },

            // Finance
            { code: 'finance.invoice.view', name: 'Ver Faturas', category: 'finance', riskLevel: 'low' },
            { code: 'finance.invoice.create', name: 'Criar Faturas', category: 'finance', riskLevel: 'medium' },
            { code: 'finance.payment.receive', name: 'Receber Pagamentos', category: 'finance', riskLevel: 'high' },
            { code: 'finance.expense.approve', name: 'Aprovar Despesas', category: 'finance', riskLevel: 'high', requiresApproval: true },
            { code: 'finance.report.view', name: 'Ver Relatórios Financeiros', category: 'finance', riskLevel: 'medium' },

            // HR / Teams
            { code: 'team.view', name: 'Ver Equipes', category: 'hr', riskLevel: 'low' },
            { code: 'team.create', name: 'Criar Equipes', category: 'hr', riskLevel: 'medium' },
            { code: 'team.manage', name: 'Gerenciar Equipes', category: 'hr', riskLevel: 'high' },
            { code: 'team.member.add', name: 'Adicionar Membros', category: 'hr', riskLevel: 'medium' },
            { code: 'team.member.remove', name: 'Remover Membros', category: 'hr', riskLevel: 'high' },
            { code: 'position.manage', name: 'Gerenciar Posições', category: 'hr', riskLevel: 'high' },
            { code: 'permission.manage', name: 'Gerenciar Permissões', category: 'hr', riskLevel: 'critical', requiresApproval: true },

            // Academic
            { code: 'student.view', name: 'Ver Alunos', category: 'academic', riskLevel: 'low' },
            { code: 'student.enroll', name: 'Matricular Alunos', category: 'academic', riskLevel: 'medium' },
            { code: 'grade.view', name: 'Ver Notas', category: 'academic', riskLevel: 'low' },
            { code: 'grade.edit', name: 'Editar Notas', category: 'academic', riskLevel: 'high' },
            { code: 'schedule.manage', name: 'Gerenciar Horários', category: 'academic', riskLevel: 'medium' },

            // System
            { code: 'system.settings.view', name: 'Ver Configurações', category: 'system', riskLevel: 'low' },
            { code: 'system.settings.edit', name: 'Editar Configurações', category: 'system', riskLevel: 'critical', requiresApproval: true },
            { code: 'system.audit.view', name: 'Ver Auditoria', category: 'system', riskLevel: 'medium' },
        ];

        let created = 0;
        let skipped = 0;

        for (const action of defaultActions) {
            const existing = await db
                .select({ id: actionTypes.id })
                .from(actionTypes)
                .where(
                    and(
                        eq(actionTypes.organizationId, organizationId),
                        eq(actionTypes.code, action.code)
                    )
                )
                .limit(1);

            if (existing.length === 0) {
                await db.insert(actionTypes).values({
                    organizationId,
                    code: action.code,
                    name: action.name,
                    category: action.category,
                    riskLevel: action.riskLevel as any,
                    requiresApproval: action.requiresApproval || false,
                    isSystem: true,
                });
                created++;
            } else {
                skipped++;
            }
        }

        return NextResponse.json({
            message: 'Default actions seeded',
            created,
            skipped,
        });
    } catch (error) {
        console.error('Error seeding actions:', error);
        return NextResponse.json({ error: 'Failed to seed actions' }, { status: 500 });
    }
}



