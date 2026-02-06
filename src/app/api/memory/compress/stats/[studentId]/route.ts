import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/memory/compress/stats/[studentId] - Get compression stats
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    try {
        const graph = await db
            .select()
            .from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, studentId))
            .limit(1);

        if (graph.length === 0) {
            return NextResponse.json({ error: 'Memory graph not found' }, { status: 404 });
        }

        return NextResponse.json({
            data: {
                studentId,
                graphId: graph[0].id,
                stats: {
                    snr: graph[0].snr,
                    compressionPasses: graph[0].compressionPasses,
                    lossVector: graph[0].lossVector,
                    nodeCount: graph[0].nodeCount,
                    edgeCount: graph[0].edgeCount,
                    lastCompressed: graph[0].lastCompressed,
                    oldestMemory: graph[0].oldestMemory,
                    newestMemory: graph[0].newestMemory,
                }
            }
        });
    } catch (error) {
        console.error('Error fetching compression stats:', error);
        return NextResponse.json({ error: 'Failed to fetch compression stats' }, { status: 500 });
    }
}
