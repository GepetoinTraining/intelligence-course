/**
 * Anunciação CRUD API
 *
 * GET  /api/anunciacoes         — List declarations for org (with optional team/status filters)
 * POST /api/anunciacoes         — Create new declaration (starts as draft)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { anunciacoes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// ── Validation ──

const CreateAnunciacaoSchema = z.object({
    teamId: z.string().min(1),
    quarter1Content: z.string().optional().default(''),
    quarter2Content: z.string().optional().default(''),
    quarter3Content: z.string().optional().default(''),
});

const ListQuerySchema = z.object({
    teamId: z.string().optional(),
    status: z.enum(['draft', 'active', 'enshrined']).optional(),
    authorPersonId: z.string().optional(),
});

// ── GET: List declarations ──

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const params = ListQuerySchema.parse({
            teamId: searchParams.get('teamId') || undefined,
            status: searchParams.get('status') || undefined,
            authorPersonId: searchParams.get('authorPersonId') || undefined,
        });

        const conditions: any[] = [eq(anunciacoes.organizationId, orgId)];
        if (params.teamId) conditions.push(eq(anunciacoes.teamId, params.teamId));
        if (params.status) conditions.push(eq(anunciacoes.status, params.status));
        if (params.authorPersonId) conditions.push(eq(anunciacoes.authorPersonId, params.authorPersonId));

        const results = await db.select({
            id: anunciacoes.id,
            teamId: anunciacoes.teamId,
            authorPersonId: anunciacoes.authorPersonId,
            status: anunciacoes.status,
            tenureStartedAt: anunciacoes.tenureStartedAt,
            tenureEndedAt: anunciacoes.tenureEndedAt,
            createdAt: anunciacoes.createdAt,
            updatedAt: anunciacoes.updatedAt,
            publishedAt: anunciacoes.publishedAt,
            // Include first 200 chars of Q1 as preview
            quarter1Content: anunciacoes.quarter1Content,
        })
            .from(anunciacoes)
            .where(and(...conditions))
            .orderBy(desc(anunciacoes.updatedAt));

        // Truncate content for list view
        const listData = results.map(r => ({
            ...r,
            quarter1Preview: r.quarter1Content?.slice(0, 200) || '',
            quarter1Content: undefined,
        }));

        return NextResponse.json({ data: listData });
    } catch (error) {
        console.error('Error listing anunciacoes:', error);
        return NextResponse.json({ error: 'Failed to list declarations' }, { status: 500 });
    }
}

// ── POST: Create new declaration ──

export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = CreateAnunciacaoSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if there's already a draft for this team+author
        const existing = await db.select({ id: anunciacoes.id })
            .from(anunciacoes)
            .where(and(
                eq(anunciacoes.organizationId, orgId),
                eq(anunciacoes.authorPersonId, personId),
                eq(anunciacoes.teamId, data.teamId),
                eq(anunciacoes.status, 'draft'),
            ))
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Você já tem um rascunho para esta equipe', existingId: existing[0].id },
                { status: 409 }
            );
        }

        const [created] = await db.insert(anunciacoes).values({
            organizationId: orgId,
            teamId: data.teamId,
            authorPersonId: personId,
            quarter1Content: data.quarter1Content,
            quarter2Content: data.quarter2Content,
            quarter3Content: data.quarter3Content,
            status: 'draft',
        }).returning();

        return NextResponse.json({ data: created }, { status: 201 });
    } catch (error) {
        console.error('Error creating anunciacao:', error);
        return NextResponse.json({ error: 'Failed to create declaration' }, { status: 500 });
    }
}
