import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prompts, promptRuns } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/prompts/[id] - Get prompt with recent runs
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const prompt = await db
            .select()
            .from(prompts)
            .where(eq(prompts.id, id))
            .limit(1);

        if (prompt.length === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        // Get recent runs for this prompt
        const recentRuns = await db
            .select()
            .from(promptRuns)
            .where(eq(promptRuns.promptId, id))
            .orderBy(desc(promptRuns.createdAt))
            .limit(10);

        return NextResponse.json({
            data: {
                ...prompt[0],
                recentRuns,
            }
        });
    } catch (error) {
        console.error('Error fetching prompt:', error);
        return NextResponse.json({ error: 'Failed to fetch prompt' }, { status: 500 });
    }
}

// PATCH /api/prompts/[id] - Update prompt (creates new version)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        // Map API fields to schema fields
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
        if (body.baseSystemPrompt !== undefined) updateData.baseSystemPrompt = body.baseSystemPrompt;
        if (body.baseMessages !== undefined) updateData.baseMessages = JSON.stringify(body.baseMessages);
        if (body.currentSystemPrompt !== undefined) updateData.currentSystemPrompt = body.currentSystemPrompt;
        if (body.currentMessages !== undefined) updateData.currentMessages = JSON.stringify(body.currentMessages);
        if (body.sharedWith !== undefined) updateData.sharedWith = body.sharedWith;

        // Increment version if system prompt changed
        if (body.currentSystemPrompt !== undefined || body.currentMessages !== undefined) {
            const current = await db
                .select({ currentVersion: prompts.currentVersion })
                .from(prompts)
                .where(eq(prompts.id, id))
                .limit(1);

            if (current.length > 0) {
                updateData.currentVersion = (current[0].currentVersion || 1) + 1;
            }
        }

        const updated = await db
            .update(prompts)
            .set(updateData)
            .where(eq(prompts.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating prompt:', error);
        return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }
}

// DELETE /api/prompts/[id] - Archive prompt
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(prompts)
            .set({ archivedAt: Math.floor(Date.now() / 1000) })
            .where(eq(prompts.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error archiving prompt:', error);
        return NextResponse.json({ error: 'Failed to archive prompt' }, { status: 500 });
    }
}
