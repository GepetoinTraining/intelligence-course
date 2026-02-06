import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/memory/overlay/[studentId] - Get world overlay
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
            return NextResponse.json({
                data: {
                    studentId,
                    hasOverlay: false,
                }
            });
        }

        // The world overlay could be stored in a dedicated table or as part of graph metadata
        // For now, return the graph's overall state as a proxy for the overlay
        return NextResponse.json({
            data: {
                studentId,
                hasOverlay: true,
                graphId: graph[0].id,
                overlay: {
                    nodeCount: graph[0].nodeCount,
                    edgeCount: graph[0].edgeCount,
                    snr: graph[0].snr,
                    lastUpdated: graph[0].updatedAt,
                }
            }
        });
    } catch (error) {
        console.error('Error fetching overlay:', error);
        return NextResponse.json({ error: 'Failed to fetch overlay' }, { status: 500 });
    }
}

// PATCH /api/memory/overlay/[studentId] - Update world overlay
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    try {
        const body = await request.json();

        const graph = await db
            .select()
            .from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, studentId))
            .limit(1);

        if (graph.length === 0) {
            return NextResponse.json({ error: 'Memory graph not found' }, { status: 404 });
        }

        // Update the graph timestamp as a proxy for overlay update
        await db
            .update(memoryGraphs)
            .set({ updatedAt: Math.floor(Date.now() / 1000) })
            .where(eq(memoryGraphs.id, graph[0].id));

        return NextResponse.json({
            data: {
                studentId,
                overlayUpdated: true,
                updatedAt: Math.floor(Date.now() / 1000),
            }
        });
    } catch (error) {
        console.error('Error updating overlay:', error);
        return NextResponse.json({ error: 'Failed to update overlay' }, { status: 500 });
    }
}
