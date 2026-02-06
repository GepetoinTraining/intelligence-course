import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeEdges } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/knowledge-edges - List knowledge edges
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const nodeId = searchParams.get('nodeId');
    const edgeType = searchParams.get('edgeType');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [eq(knowledgeEdges.personId, personId)];

        if (nodeId) {
            conditions.push(or(
                eq(knowledgeEdges.fromNodeId, nodeId),
                eq(knowledgeEdges.toNodeId, nodeId)
            )!);
        }

        if (edgeType) {
            conditions.push(eq(knowledgeEdges.edgeType, edgeType as any));
        }

        const edges = await db
            .select()
            .from(knowledgeEdges)
            .where(and(...conditions))
            .orderBy(desc(knowledgeEdges.createdAt))
            .limit(limit);

        // Transform to include source/target naming convention
        const transformedEdges = edges.map(e => ({
            ...e,
            sourceNodeId: e.fromNodeId,
            targetNodeId: e.toNodeId,
        }));

        return NextResponse.json({ data: transformedEdges });
    } catch (error) {
        console.error('Error fetching knowledge edges:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge edges' }, { status: 500 });
    }
}

// POST /api/knowledge-edges - Create knowledge edge
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { sourceNodeId, targetNodeId, edgeType, weight } = body;

        if (!sourceNodeId || !targetNodeId) {
            return NextResponse.json({ error: 'sourceNodeId and targetNodeId required' }, { status: 400 });
        }

        const newEdge = await db.insert(knowledgeEdges).values({
            userId,
            fromNodeId: sourceNodeId,
            toNodeId: targetNodeId,
            edgeType,
            weight,
        }).returning();

        // Transform response
        const result = {
            ...newEdge[0],
            sourceNodeId: newEdge[0].fromNodeId,
            targetNodeId: newEdge[0].toNodeId,
        };

        return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
        console.error('Error creating knowledge edge:', error);
        return NextResponse.json({ error: 'Failed to create knowledge edge' }, { status: 500 });
    }
}



