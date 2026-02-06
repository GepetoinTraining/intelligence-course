import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryEdges, memoryNodes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/memory/contradictions/[id]/resolve - Resolve a contradiction
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { resolution, keepNodeId, discardNodeId } = body;

        // Get the contradiction edge
        const edge = await db
            .select()
            .from(memoryEdges)
            .where(eq(memoryEdges.id, id))
            .limit(1);

        if (edge.length === 0) {
            return NextResponse.json({ error: 'Contradiction not found' }, { status: 404 });
        }

        if (edge[0].edgeType !== 'CONTRADICTS') {
            return NextResponse.json({ error: 'Edge is not a contradiction' }, { status: 400 });
        }

        // Handle resolution
        if (resolution === 'merge') {
            // Transform the contradiction into a tension edge
            await db
                .update(memoryEdges)
                .set({ edgeType: 'RELATES_TO' })
                .where(eq(memoryEdges.id, id));
        } else if (resolution === 'keep_source') {
            // Delete target node and this edge
            if (discardNodeId) {
                await db.delete(memoryNodes).where(eq(memoryNodes.id, discardNodeId));
            }
            await db.delete(memoryEdges).where(eq(memoryEdges.id, id));
        } else if (resolution === 'keep_target') {
            // Delete source node and this edge
            if (discardNodeId) {
                await db.delete(memoryNodes).where(eq(memoryNodes.id, discardNodeId));
            }
            await db.delete(memoryEdges).where(eq(memoryEdges.id, id));
        }

        return NextResponse.json({
            data: {
                resolved: true,
                contradictionId: id,
                resolution,
            }
        });
    } catch (error) {
        console.error('Error resolving contradiction:', error);
        return NextResponse.json({ error: 'Failed to resolve contradiction' }, { status: 500 });
    }
}
