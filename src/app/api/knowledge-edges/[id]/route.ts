import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeEdges } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/knowledge-edges/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(knowledgeEdges)
            .where(eq(knowledgeEdges.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching knowledge edge:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge edge' }, { status: 500 });
    }
}

// PATCH /api/knowledge-edges/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.relationship !== undefined) updateData.relationship = body.relationship;
        if (body.weight !== undefined) updateData.weight = body.weight;
        if (body.sourceNodeId !== undefined) updateData.sourceNodeId = body.sourceNodeId;
        if (body.targetNodeId !== undefined) updateData.targetNodeId = body.targetNodeId;

        const updated = await db
            .update(knowledgeEdges)
            .set(updateData)
            .where(and(eq(knowledgeEdges.id, id), eq(knowledgeEdges.createdBy, personId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating knowledge edge:', error);
        return NextResponse.json({ error: 'Failed to update knowledge edge' }, { status: 500 });
    }
}

// DELETE /api/knowledge-edges/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(knowledgeEdges)
            .where(and(eq(knowledgeEdges.id, id), eq(knowledgeEdges.createdBy, personId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting knowledge edge:', error);
        return NextResponse.json({ error: 'Failed to delete knowledge edge' }, { status: 500 });
    }
}
