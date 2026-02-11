import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeEdges } from '@/lib/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/knowledge-edges - List knowledge edges
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const nodeId = searchParams.get('nodeId');
    const relationship = searchParams.get('relationship') || searchParams.get('edgeType');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions: any[] = [];

        if (nodeId) {
            conditions.push(or(
                eq(knowledgeEdges.sourceNodeId, nodeId),
                eq(knowledgeEdges.targetNodeId, nodeId)
            )!);
        }

        if (relationship) {
            conditions.push(eq(knowledgeEdges.relationship, relationship as any));
        }

        const edges = await db
            .select()
            .from(knowledgeEdges)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(knowledgeEdges.createdAt))
            .limit(limit);

        return NextResponse.json({ data: edges });
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
        const { sourceNodeId, targetNodeId, relationship, weight } = body;

        if (!sourceNodeId || !targetNodeId) {
            return NextResponse.json({ error: 'sourceNodeId and targetNodeId required' }, { status: 400 });
        }

        const newEdge = await db.insert(knowledgeEdges).values({
            sourceNodeId,
            targetNodeId,
            relationship: relationship || 'supports',
            weight,
            createdBy: personId,
        }).returning();

        return NextResponse.json({ data: newEdge[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating knowledge edge:', error);
        return NextResponse.json({ error: 'Failed to create knowledge edge' }, { status: 500 });
    }
}
