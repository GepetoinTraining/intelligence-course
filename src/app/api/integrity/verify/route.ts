import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs, memoryNodes, memoryEdges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/integrity/verify - Verify memory integrity
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ error: 'studentId required' }, { status: 400 });
        }

        const graph = await db
            .select()
            .from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, studentId))
            .limit(1);

        if (graph.length === 0) {
            return NextResponse.json({ error: 'Memory graph not found' }, { status: 404 });
        }

        // Count actual nodes and edges
        const nodes = await db
            .select()
            .from(memoryNodes)
            .where(eq(memoryNodes.graphId, graph[0].id));

        const edges = await db
            .select()
            .from(memoryEdges)
            .where(eq(memoryEdges.graphId, graph[0].id));

        const actualNodeCount = nodes.length;
        const actualEdgeCount = edges.length;

        const isConsistent =
            actualNodeCount === (graph[0].nodeCount || 0) &&
            actualEdgeCount === (graph[0].edgeCount || 0);

        // Update last verified timestamp
        await db
            .update(memoryGraphs)
            .set({ updatedAt: Math.floor(Date.now() / 1000) })
            .where(eq(memoryGraphs.id, graph[0].id));

        return NextResponse.json({
            data: {
                studentId,
                graphId: graph[0].id,
                verified: true,
                verifiedAt: Math.floor(Date.now() / 1000),
                consistent: isConsistent,
                counts: {
                    recordedNodes: graph[0].nodeCount,
                    actualNodes: actualNodeCount,
                    recordedEdges: graph[0].edgeCount,
                    actualEdges: actualEdgeCount,
                }
            }
        });
    } catch (error) {
        console.error('Error verifying integrity:', error);
        return NextResponse.json({ error: 'Failed to verify integrity' }, { status: 500 });
    }
}



