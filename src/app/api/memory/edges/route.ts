import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { memoryEdges, memoryNodes, memoryGraphs, memoryAuditLog, users } from '@/lib/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

// GET /api/memory/edges - Get edges for current user's graph
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        const graph = await db.query.memoryGraphs.findFirst({
            where: eq(memoryGraphs.studentId, dbUser.id),
        });

        if (!graph) {
            return NextResponse.json({ data: [], meta: { total: 0 } });
        }

        // Parse query params
        const { searchParams } = new URL(req.url);
        const nodeId = searchParams.get('nodeId'); // Get edges connected to a specific node
        const edgeType = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '100');

        const conditions = [eq(memoryEdges.graphId, graph.id)];

        if (nodeId) {
            conditions.push(
                or(
                    eq(memoryEdges.sourceId, nodeId),
                    eq(memoryEdges.targetId, nodeId)
                )!
            );
        }

        if (edgeType) {
            conditions.push(eq(memoryEdges.edgeType, edgeType as 'CAUSES' | 'RELATES_TO' | 'EVOKES' | 'REMINDS_OF' | 'CONTRADICTS' | 'SUPPORTS' | 'REFINES' | 'ABSTRACTS' | 'INVOLVES' | 'ABOUT' | 'LOCATED_AT' | 'PRECEDES' | 'ENABLES'));
        }

        const edges = await db.select()
            .from(memoryEdges)
            .where(and(...conditions))
            .limit(limit);

        return NextResponse.json({
            data: edges,
            meta: { total: edges.length, graphId: graph.id }
        });
    } catch (error) {
        console.error('Error fetching memory edges:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch memory edges' } }, { status: 500 });
    }
}

// POST /api/memory/edges - Create a new edge between nodes
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        const graph = await db.query.memoryGraphs.findFirst({
            where: eq(memoryGraphs.studentId, dbUser.id),
        });

        if (!graph) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Memory graph not found' } }, { status: 404 });
        }

        const body = await req.json();
        const { sourceId, targetId, edgeType, direction = 'forward', weight = 1, valence = 0 } = body;

        if (!sourceId || !targetId || !edgeType) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'sourceId, targetId, and edgeType are required' } }, { status: 400 });
        }

        // Validate that both nodes exist and belong to this graph
        const sourceNode = await db.query.memoryNodes.findFirst({
            where: and(eq(memoryNodes.id, sourceId), eq(memoryNodes.graphId, graph.id)),
        });

        const targetNode = await db.query.memoryNodes.findFirst({
            where: and(eq(memoryNodes.id, targetId), eq(memoryNodes.graphId, graph.id)),
        });

        if (!sourceNode || !targetNode) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'One or both nodes not found in graph' } }, { status: 404 });
        }

        const now = Math.floor(Date.now() / 1000);

        // Create the edge
        const [newEdge] = await db.insert(memoryEdges).values({
            graphId: graph.id,
            sourceId,
            targetId,
            edgeType,
            direction,
            weight,
            valence,
            strength: 1,
            createdAt: now,
        }).returning();

        // Update graph stats
        await db.update(memoryGraphs)
            .set({
                edgeCount: sql`${memoryGraphs.edgeCount} + 1`,
                updatedAt: now,
            })
            .where(eq(memoryGraphs.id, graph.id));

        // Log the operation
        await db.insert(memoryAuditLog).values({
            studentId: dbUser.id,
            operation: 'edge.created',
            entityType: 'edge',
            entityId: newEdge.id,
            actor: 'student',
            details: JSON.stringify({ edgeType, sourceId, targetId }),
            timestamp: now,
        });

        return NextResponse.json({
            data: newEdge,
            meta: { graphId: graph.id }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating memory edge:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create memory edge' } }, { status: 500 });
    }
}

// DELETE /api/memory/edges?id=xxx - Delete an edge
export async function DELETE(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const edgeId = searchParams.get('id');

        if (!edgeId) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Edge ID is required' } }, { status: 400 });
        }

        const graph = await db.query.memoryGraphs.findFirst({
            where: eq(memoryGraphs.studentId, dbUser.id),
        });

        if (!graph) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Memory graph not found' } }, { status: 404 });
        }

        const existingEdge = await db.query.memoryEdges.findFirst({
            where: and(eq(memoryEdges.id, edgeId), eq(memoryEdges.graphId, graph.id)),
        });

        if (!existingEdge) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Edge not found' } }, { status: 404 });
        }

        await db.delete(memoryEdges).where(eq(memoryEdges.id, edgeId));

        // Update graph stats
        const now = Math.floor(Date.now() / 1000);
        await db.update(memoryGraphs)
            .set({
                edgeCount: sql`MAX(0, ${memoryGraphs.edgeCount} - 1)`,
                updatedAt: now,
            })
            .where(eq(memoryGraphs.id, graph.id));

        // Log the deletion
        await db.insert(memoryAuditLog).values({
            studentId: dbUser.id,
            operation: 'edge.deleted',
            entityType: 'edge',
            entityId: edgeId,
            actor: 'student',
            details: JSON.stringify({
                edgeType: existingEdge.edgeType,
                sourceId: existingEdge.sourceId,
                targetId: existingEdge.targetId,
            }),
            timestamp: now,
        });

        return NextResponse.json({ data: { deleted: true, id: edgeId } });
    } catch (error) {
        console.error('Error deleting memory edge:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete memory edge' } }, { status: 500 });
    }
}

