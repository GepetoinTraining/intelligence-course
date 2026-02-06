/**
 * Drafts API
 * 
 * GET /api/drafts/[type]/[id] - Get a draft
 * PUT /api/drafts/[type]/[id] - Save/update a draft
 * DELETE /api/drafts/[type]/[id] - Delete a draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { drafts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type Params = Promise<{ type: string; id: string }>;

// GET - Retrieve a draft
export async function GET(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { type, id: referenceId } = await params;
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const draft = await db.query.drafts.findFirst({
            where: and(
                eq(drafts.userId, userId),
                eq(drafts.type, type as any),
                eq(drafts.referenceId, referenceId)
            ),
        });

        if (!draft) {
            return NextResponse.json({ draft: null });
        }

        return NextResponse.json({
            draft: {
                ...draft,
                content: JSON.parse(draft.content),
            }
        });
    } catch (error) {
        console.error('Error fetching draft:', error);
        return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
    }
}

// PUT - Save/update a draft
export async function PUT(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { type, id: referenceId } = await params;
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'No organization context' }, { status: 400 });
        }

        const body = await request.json();
        const content = JSON.stringify(body.content || body);
        const now = Math.floor(Date.now() / 1000);

        // Check if draft exists
        const existing = await db.query.drafts.findFirst({
            where: and(
                eq(drafts.userId, userId),
                eq(drafts.type, type as any),
                eq(drafts.referenceId, referenceId)
            ),
        });

        if (existing) {
            // Update existing draft
            await db.update(drafts)
                .set({ content, updatedAt: now })
                .where(eq(drafts.id, existing.id));

            return NextResponse.json({ success: true, action: 'updated' });
        } else {
            // Create new draft
            await db.insert(drafts).values({
                userId,
                organizationId,
                type: type as any,
                referenceId,
                content,
                createdAt: now,
                updatedAt: now,
            });

            return NextResponse.json({ success: true, action: 'created' });
        }
    } catch (error) {
        console.error('Error saving draft:', error);
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }
}

// DELETE - Remove a draft (e.g., after publishing)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { type, id: referenceId } = await params;
        const { userId } = await getApiAuthWithOrg();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await db.delete(drafts).where(
            and(
                eq(drafts.userId, userId),
                eq(drafts.type, type as any),
                eq(drafts.referenceId, referenceId)
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting draft:', error);
        return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }
}
