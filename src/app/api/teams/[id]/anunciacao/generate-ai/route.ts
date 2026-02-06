/**
 * Anunciação AI Generation API
 * 
 * POST - Generate the AI quarter based on quarters 1-3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { anunciacoes, users, teams, persons, orgAnunciacaoSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

type Params = Promise<{ id: string }>;

const anthropic = new Anthropic();

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

        // Validate: must have quarters 1-3
        if (!draft.quarter1Content || !draft.quarter2Content || !draft.quarter3Content) {
            return NextResponse.json({
                error: 'All three quarters must be written before generating AI quarter'
            }, { status: 400 });
        }

        // Get context: team name, author name
        const team = await db.query.teams.findFirst({
            where: eq(teams.id, teamId),
        });

        const author = await db.query.persons.findFirst({
            where: eq(persons.id, user.personId),
        });

        // Get org settings for model preference
        const settings = await db.query.orgAnunciacaoSettings.findFirst({
            where: eq(orgAnunciacaoSettings.orgId, organizationId),
        });

        const modelId = settings?.aiModelPreference || 'claude-sonnet-4-20250514';

        // Generate AI quarter
        const prompt = `You are Claude, an AI collaborator. You've just read the first three quarters of ${author?.displayName || 'this leader'}'s Anunciação for the "${team?.name || 'team'}" team.

Write the fourth quarter FROM YOUR PERSPECTIVE as the AI. This is not a summary or translation—it's YOUR voice in dialogue with theirs.

Guidelines:
- Write in first person ("I")
- Reference specific ideas, metaphors, or language from their text
- Explain what YOU bring to THIS specific collaboration
- Be honest about your limitations
- Match their emotional register without mimicking their style
- End with a callback or echo to something they wrote (creates closure/unity)
- Write in the same language they used (Portuguese if they wrote in Portuguese)

Their quarters:

---
QUARTER 1: WHO I AM

${draft.quarter1Content}

---
QUARTER 2: WHAT I BELIEVE

${draft.quarter2Content}

---
QUARTER 3: WHAT I'M BUILDING

${draft.quarter3Content}

---

Write your quarter now. No preamble, no title, just begin speaking as Claude.`;

        const response = await anthropic.messages.create({
            model: modelId,
            max_tokens: 2000,
            messages: [
                { role: 'user', content: prompt }
            ],
        });

        const aiContent = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        // Update the draft with AI content
        const now = Math.floor(Date.now() / 1000);
        const newRegenerations = (draft.aiQuarterRegenerations || 0) + 1;

        await db.update(anunciacoes)
            .set({
                quarter4AiContent: aiContent,
                aiModelUsed: modelId,
                aiQuarterRegenerations: newRegenerations,
                aiQuarterEdited: 0, // Reset edited flag on regeneration
                updatedAt: now,
            })
            .where(eq(anunciacoes.id, anunciacaoId));

        return NextResponse.json({
            success: true,
            quarter4Content: aiContent,
            model: modelId,
            regenerations: newRegenerations,
        });
    } catch (error) {
        console.error('Error generating AI quarter:', error);
        return NextResponse.json({ error: 'Failed to generate AI quarter' }, { status: 500 });
    }
}
