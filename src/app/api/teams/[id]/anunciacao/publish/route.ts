/**
 * Anunciação Publish API
 * 
 * POST - Publish a draft anunciação (makes it active, unlocks team)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { anunciacoes, users, drafts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type Params = Promise<{ id: string }>;

export async function POST(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: teamId } = await params;
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();

        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { anunciacaoId } = body;

        // Get user's person record
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.personId) {
            return NextResponse.json({ error: 'User not linked to person' }, { status: 400 });
        }

        // Get the draft
        const draft = await db.query.anunciacoes.findFirst({
            where: and(
                eq(anunciacoes.id, anunciacaoId),
                eq(anunciacoes.authorPersonId, user.personId),
                eq(anunciacoes.status, 'draft')
            ),
        });

        if (!draft) {
            return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }

        // Validate: must have at least quarters 1-3
        if (!draft.quarter1Content || !draft.quarter2Content || !draft.quarter3Content) {
            return NextResponse.json({
                error: 'All three quarters must be written before publishing'
            }, { status: 400 });
        }

        // Check if there's currently an active anunciação for this team
        const currentActive = await db.query.anunciacoes.findFirst({
            where: and(
                eq(anunciacoes.teamId, teamId),
                eq(anunciacoes.status, 'active')
            ),
        });

        const now = Math.floor(Date.now() / 1000);

        // If there's an active one, enshrine it first
        if (currentActive) {
            await db.update(anunciacoes)
                .set({
                    status: 'enshrined',
                    tenureEndedAt: now,
                    enshrinedAt: now,
                    updatedAt: now,
                })
                .where(eq(anunciacoes.id, currentActive.id));
        }

        // Publish the draft
        await db.update(anunciacoes)
            .set({
                status: 'active',
                publishedAt: now,
                updatedAt: now,
            })
            .where(eq(anunciacoes.id, anunciacaoId));

        // Clear any drafts in the drafts table for this anunciação
        await db.delete(drafts).where(
            and(
                eq(drafts.userId, userId),
                eq(drafts.type, 'anunciacao'),
                eq(drafts.referenceId, teamId)
            )
        );

        const published = await db.query.anunciacoes.findFirst({
            where: eq(anunciacoes.id, anunciacaoId),
        });

        return NextResponse.json({
            success: true,
            anunciacao: published,
            message: 'Anunciação published! Team is now unlocked.',
        });
    } catch (error) {
        console.error('Error publishing anunciação:', error);
        return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
    }
}
