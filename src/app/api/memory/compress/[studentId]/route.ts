import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// POST /api/memory/compress/[studentId] - Compress memory graph
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        // Simulate compression operation
        const now = Math.floor(Date.now() / 1000);
        const newSNR = Math.min((graph[0].snr || 1) * 1.05, 2.0); // Improve SNR
        const newCompressionPasses = (graph[0].compressionPasses || 0) + 1;

        await db
            .update(memoryGraphs)
            .set({
                snr: newSNR,
                compressionPasses: newCompressionPasses,
                lastCompressed: now,
                updatedAt: now,
            })
            .where(eq(memoryGraphs.id, graph[0].id));

        return NextResponse.json({
            data: {
                studentId,
                graphId: graph[0].id,
                compressed: true,
                compressionPasses: newCompressionPasses,
                snr: newSNR,
                compressedAt: now,
            }
        });
    } catch (error) {
        console.error('Error compressing memory:', error);
        return NextResponse.json({ error: 'Failed to compress memory' }, { status: 500 });
    }
}
