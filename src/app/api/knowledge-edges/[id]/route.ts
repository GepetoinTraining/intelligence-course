import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeEdges } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/knowledge-edges/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
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

        // Transform to use source/target naming
        const edge = {
            ...result[0],
            sourceNodeId: result[0].fromNodeId,
            targetNodeId: result[0].toNodeId,
        };

        return NextResponse.json({ data: edge });
    } catch (error) {
        console.error('Error fetching knowledge edge:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge edge' }, { status: 500 });
    }
}

// PATCH /api/knowledge-edges/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.edgeType !== undefined) updateData.edgeType = body.edgeType;
        if (body.weight !== undefined) updateData.weight = body.weight;
        if (body.sourceNodeId !== undefined) updateData.fromNodeId = body.sourceNodeId;
        if (body.targetNodeId !== undefined) updateData.toNodeId = body.targetNodeId;

        const updated = await db
            .update(knowledgeEdges)
            .set(updateData)
            .where(and(eq(knowledgeEdges.id, id), eq(knowledgeEdges.userId, userId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        // Transform response
        const edge = {
            ...updated[0],
            sourceNodeId: updated[0].fromNodeId,
            targetNodeId: updated[0].toNodeId,
        };

        return NextResponse.json({ data: edge });
    } catch (error) {
        console.error('Error updating knowledge edge:', error);
        return NextResponse.json({ error: 'Failed to update knowledge edge' }, { status: 500 });
    }
}

// DELETE /api/knowledge-edges/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(knowledgeEdges)
            .where(and(eq(knowledgeEdges.id, id), eq(knowledgeEdges.userId, userId)))
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
