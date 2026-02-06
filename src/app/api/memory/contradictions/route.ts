import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryEdges, memoryNodes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/memory/contradictions - Get contradictions in memory
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const graphId = searchParams.get('graphId');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        if (!graphId) {
            return NextResponse.json({ error: 'graphId required' }, { status: 400 });
        }

        // Find edges marked as contradictions
        const contradictions = await db
            .select()
            .from(memoryEdges)
            .where(eq(memoryEdges.edgeType, 'CONTRADICTS'))
            .orderBy(desc(memoryEdges.createdAt))
            .limit(limit);

        // Enrich with node data
        const enriched = await Promise.all(contradictions.map(async (edge) => {
            const sourceNode = await db
                .select()
                .from(memoryNodes)
                .where(eq(memoryNodes.id, edge.sourceId))
                .limit(1);

            const targetNode = await db
                .select()
                .from(memoryNodes)
                .where(eq(memoryNodes.id, edge.targetId))
                .limit(1);

            return {
                id: edge.id,
                source: sourceNode[0] || null,
                target: targetNode[0] || null,
                strength: edge.strength,
                createdAt: edge.createdAt,
            };
        }));

        return NextResponse.json({ data: enriched });
    } catch (error) {
        console.error('Error fetching contradictions:', error);
        return NextResponse.json({ error: 'Failed to fetch contradictions' }, { status: 500 });
    }
}

