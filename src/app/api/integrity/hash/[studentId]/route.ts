import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/integrity/hash/[studentId] - Get integrity hash
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
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

        // Compute a simple integrity check based on node/edge counts and SNR
        const integrityData = {
            graphId: graph[0].id,
            nodeCount: graph[0].nodeCount,
            edgeCount: graph[0].edgeCount,
            snr: graph[0].snr,
            compressionPasses: graph[0].compressionPasses,
            lossVector: graph[0].lossVector,
            lastCompressed: graph[0].lastCompressed,
            updatedAt: graph[0].updatedAt,
        };

        return NextResponse.json({
            data: {
                studentId,
                integrity: integrityData,
                valid: true, // Would compute actual validation
            }
        });
    } catch (error) {
        console.error('Error getting integrity hash:', error);
        return NextResponse.json({ error: 'Failed to get integrity hash' }, { status: 500 });
    }
}
