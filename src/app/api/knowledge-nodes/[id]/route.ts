import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeNodes, knowledgeEdges } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/knowledge-nodes/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(knowledgeNodes)
            .where(and(
                eq(knowledgeNodes.id, id),
                eq(knowledgeNodes.organizationId, orgId),
            ))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Get connected edges
        const edges = await db
            .select()
            .from(knowledgeEdges)
            .where(or(
                eq(knowledgeEdges.sourceNodeId, id),
                eq(knowledgeEdges.targetNodeId, id)
            ));

        return NextResponse.json({
            data: {
                ...result[0],
                edges,
            }
        });
    } catch (error) {
        console.error('Error fetching knowledge node:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge node' }, { status: 500 });
    }
}

// PATCH /api/knowledge-nodes/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.nodeType !== undefined) updateData.nodeType = body.nodeType;
        if (body.embedding !== undefined) updateData.embedding = body.embedding;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
        if (body.subjectArea !== undefined) updateData.subjectArea = body.subjectArea;

        const updated = await db
            .update(knowledgeNodes)
            .set(updateData)
            .where(and(
                eq(knowledgeNodes.id, id),
                eq(knowledgeNodes.organizationId, orgId),
            ))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating knowledge node:', error);
        return NextResponse.json({ error: 'Failed to update knowledge node' }, { status: 500 });
    }
}

// DELETE /api/knowledge-nodes/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Delete connected edges first
        await db
            .delete(knowledgeEdges)
            .where(or(
                eq(knowledgeEdges.sourceNodeId, id),
                eq(knowledgeEdges.targetNodeId, id)
            ));

        // Delete the node
        const deleted = await db
            .delete(knowledgeNodes)
            .where(and(
                eq(knowledgeNodes.id, id),
                eq(knowledgeNodes.organizationId, orgId),
            ))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting knowledge node:', error);
        return NextResponse.json({ error: 'Failed to delete knowledge node' }, { status: 500 });
    }
}
