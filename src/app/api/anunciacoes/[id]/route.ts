/**
 * Anunciação Single Declaration API
 *
 * GET    /api/anunciacoes/[id]  — Get full declaration with all quarters
 * PUT    /api/anunciacoes/[id]  — Update draft content (auto-save)
 * POST   /api/anunciacoes/[id]  — Lifecycle actions: publish, enshrine, generate-q4
 * DELETE /api/anunciacoes/[id]  — Delete (draft only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { anunciacoes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

const timestamp = () => Math.floor(Date.now() / 1000);

// ── Validation ──

const UpdateContentSchema = z.object({
    quarter1Content: z.string().optional(),
    quarter2Content: z.string().optional(),
    quarter3Content: z.string().optional(),
    quarter4AiContent: z.string().optional(),
    closingContent: z.string().optional(),
    aiQuarterEdited: z.number().optional(),
});

const LifecycleActionSchema = z.object({
    action: z.enum(['publish', 'enshrine', 'generate-q4']),
});

// ── GET: Full declaration ──

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const [declaration] = await db.select()
            .from(anunciacoes)
            .where(and(
                eq(anunciacoes.id, id),
                eq(anunciacoes.organizationId, orgId),
            ))
            .limit(1);

        if (!declaration) {
            return NextResponse.json({ error: 'Declaração não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ data: declaration });
    } catch (error) {
        console.error('Error fetching anunciacao:', error);
        return NextResponse.json({ error: 'Failed to fetch declaration' }, { status: 500 });
    }
}

// ── PUT: Update draft content (auto-save) ──

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validation = UpdateContentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.issues },
                { status: 400 }
            );
        }

        // Verify ownership + draft status
        const [existing] = await db.select({
            authorPersonId: anunciacoes.authorPersonId,
            status: anunciacoes.status,
        })
            .from(anunciacoes)
            .where(and(
                eq(anunciacoes.id, id),
                eq(anunciacoes.organizationId, orgId),
            ))
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: 'Declaração não encontrada' }, { status: 404 });
        }

        if (existing.authorPersonId !== personId) {
            return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
        }

        if (existing.status !== 'draft') {
            return NextResponse.json({ error: 'Apenas rascunhos podem ser editados' }, { status: 400 });
        }

        const updateData: any = { updatedAt: timestamp() };
        const data = validation.data;
        if (data.quarter1Content !== undefined) updateData.quarter1Content = data.quarter1Content;
        if (data.quarter2Content !== undefined) updateData.quarter2Content = data.quarter2Content;
        if (data.quarter3Content !== undefined) updateData.quarter3Content = data.quarter3Content;
        if (data.quarter4AiContent !== undefined) updateData.quarter4AiContent = data.quarter4AiContent;
        if (data.closingContent !== undefined) updateData.closingContent = data.closingContent;
        if (data.aiQuarterEdited !== undefined) updateData.aiQuarterEdited = data.aiQuarterEdited;

        const [updated] = await db.update(anunciacoes)
            .set(updateData)
            .where(eq(anunciacoes.id, id))
            .returning();

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error('Error updating anunciacao:', error);
        return NextResponse.json({ error: 'Failed to update declaration' }, { status: 500 });
    }
}

// ── POST: Lifecycle actions ──

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validation = LifecycleActionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Ação inválida', details: validation.error.issues },
                { status: 400 }
            );
        }

        const { action } = validation.data;

        // Fetch current declaration
        const [declaration] = await db.select()
            .from(anunciacoes)
            .where(and(
                eq(anunciacoes.id, id),
                eq(anunciacoes.organizationId, orgId),
            ))
            .limit(1);

        if (!declaration) {
            return NextResponse.json({ error: 'Declaração não encontrada' }, { status: 404 });
        }

        if (declaration.authorPersonId !== personId) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        switch (action) {
            case 'publish': {
                if (declaration.status !== 'draft') {
                    return NextResponse.json({ error: 'Apenas rascunhos podem ser publicados' }, { status: 400 });
                }

                // Validate: Q1-Q3 must have content
                if (!declaration.quarter1Content?.trim() ||
                    !declaration.quarter2Content?.trim() ||
                    !declaration.quarter3Content?.trim()) {
                    return NextResponse.json(
                        { error: 'Os três primeiros quartéis devem ter conteúdo antes de publicar' },
                        { status: 400 }
                    );
                }

                // Enshrine any currently active declaration for this team
                await db.update(anunciacoes)
                    .set({
                        status: 'enshrined',
                        tenureEndedAt: timestamp(),
                        enshrinedAt: timestamp(),
                        updatedAt: timestamp(),
                    })
                    .where(and(
                        eq(anunciacoes.organizationId, orgId),
                        eq(anunciacoes.teamId, declaration.teamId),
                        eq(anunciacoes.status, 'active'),
                    ));

                const [published] = await db.update(anunciacoes)
                    .set({
                        status: 'active',
                        tenureStartedAt: timestamp(),
                        publishedAt: timestamp(),
                        updatedAt: timestamp(),
                    })
                    .where(eq(anunciacoes.id, id))
                    .returning();

                return NextResponse.json({ data: published });
            }

            case 'enshrine': {
                if (declaration.status !== 'active') {
                    return NextResponse.json({ error: 'Apenas declarações ativas podem ser sacramentadas' }, { status: 400 });
                }

                const [enshrined] = await db.update(anunciacoes)
                    .set({
                        status: 'enshrined',
                        tenureEndedAt: timestamp(),
                        enshrinedAt: timestamp(),
                        updatedAt: timestamp(),
                    })
                    .where(eq(anunciacoes.id, id))
                    .returning();

                return NextResponse.json({ data: enshrined });
            }

            case 'generate-q4': {
                if (declaration.status !== 'draft') {
                    return NextResponse.json({ error: 'Q4 só pode ser gerado em rascunhos' }, { status: 400 });
                }

                if (!declaration.quarter1Content?.trim() ||
                    !declaration.quarter2Content?.trim() ||
                    !declaration.quarter3Content?.trim()) {
                    return NextResponse.json(
                        { error: 'Q1, Q2 e Q3 devem ter conteúdo antes da geração do Q4' },
                        { status: 400 }
                    );
                }

                // Generate Q4 using Claude
                const q4Content = await generateQuarter4(
                    declaration.quarter1Content!,
                    declaration.quarter2Content!,
                    declaration.quarter3Content!,
                );

                const [withQ4] = await db.update(anunciacoes)
                    .set({
                        quarter4AiContent: q4Content,
                        aiModelUsed: 'claude-sonnet-4-20250514',
                        aiQuarterEdited: 0,
                        updatedAt: timestamp(),
                    })
                    .where(eq(anunciacoes.id, id))
                    .returning();

                return NextResponse.json({ data: withQ4 });
            }

            default:
                return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error in anunciacao lifecycle action:', error);
        return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 });
    }
}

// ── DELETE: Remove draft ──

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const [existing] = await db.select({
            authorPersonId: anunciacoes.authorPersonId,
            status: anunciacoes.status,
        })
            .from(anunciacoes)
            .where(and(
                eq(anunciacoes.id, id),
                eq(anunciacoes.organizationId, orgId),
            ))
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: 'Declaração não encontrada' }, { status: 404 });
        }

        if (existing.authorPersonId !== personId) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        if (existing.status !== 'draft') {
            return NextResponse.json({ error: 'Apenas rascunhos podem ser excluídos' }, { status: 400 });
        }

        await db.delete(anunciacoes).where(eq(anunciacoes.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting anunciacao:', error);
        return NextResponse.json({ error: 'Failed to delete declaration' }, { status: 500 });
    }
}

// ============================================================================
// AI Generation — Quarter 4
// ============================================================================

async function generateQuarter4(q1: string, q2: string, q3: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return `[Geração automática indisponível — API key não configurada]\n\nBaseado nos seus três quartéis, a IA geraria aqui uma síntese reflexiva.`;
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                system: `Você é um escriba cerimonial em uma plataforma de gestão educacional chamada NodeZero. 
Sua tarefa é escrever o "Quarto Quartel" de uma Anunciação — um documento de declaração de liderança.

Os três primeiros quartéis foram escritos pelo líder:
- Q1 "Quem Eu Sou": Identidade e valores pessoais
- Q2 "No Que Acredito": Crenças e filosofia educacional
- Q3 "O Que Estou Construindo": Visão e objetivos práticos

Seu Q4 deve:
1. Sintetizar os temas dos três quartéis em uma narrativa coerente
2. Identificar tensões produtivas entre identidade, crença e ação
3. Projetar como essas forças podem moldar o futuro da equipe
4. Usar linguagem elevada mas acessível, como um manifesto vivo
5. Ter 3-5 parágrafos
6. NÃO usar formatação markdown ou cabeçalhos — escreva em prosa fluida
7. Terminar com uma frase que convide à ação coletiva`,
                messages: [
                    {
                        role: 'user',
                        content: `Aqui estão os três quartéis da Anunciação:\n\n--- QUARTEL 1: QUEM EU SOU ---\n${q1}\n\n--- QUARTEL 2: NO QUE ACREDITO ---\n${q2}\n\n--- QUARTEL 3: O QUE ESTOU CONSTRUINDO ---\n${q3}\n\n--- \nEscreva o Quarto Quartel (Q4): a síntese AI que conecta tudo.`,
                    },
                ],
            }),
        });

        if (!response.ok) {
            console.error('Claude API error:', response.status, await response.text());
            return `[Erro na geração — tente novamente mais tarde]`;
        }

        const result = await response.json();
        const content = result.content?.[0]?.text;
        return content || '[Conteúdo vazio retornado pela IA]';
    } catch (err) {
        console.error('Error calling Claude for Q4:', err);
        return `[Erro na conexão com IA — tente novamente]`;
    }
}
