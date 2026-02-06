import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { memoryNodes, memoryGraphs, memoryAuditLog, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/memory/nodes/[id] - Get a specific node
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const { id } = await params;

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

        const node = await db.query.memoryNodes.findFirst({
            where: and(
                eq(memoryNodes.id, id),
                eq(memoryNodes.graphId, graph.id)
            ),
        });

        if (!node) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Node not found' } }, { status: 404 });
        }

        // Update last accessed and boost gravity slightly
        const now = Math.floor(Date.now() / 1000);
        await db.update(memoryNodes)
            .set({
                lastAccessed: now,
                // Small gravity boost on access (capped at salience)
                gravity: sql`MIN(${memoryNodes.salience}, ${memoryNodes.gravity} * 1.1)`
            })
            .where(eq(memoryNodes.id, id));

        return NextResponse.json({ data: node });
    } catch (error) {
        console.error('Error fetching memory node:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch memory node' } }, { status: 500 });
    }
}

// PATCH /api/memory/nodes/[id] - Update node gravity or other properties
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const { id } = await params;

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

        const existingNode = await db.query.memoryNodes.findFirst({
            where: and(
                eq(memoryNodes.id, id),
                eq(memoryNodes.graphId, graph.id)
            ),
        });

        if (!existingNode) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Node not found' } }, { status: 404 });
        }

        const body = await req.json();
        const { gravity, salience, confidence, strength } = body;

        const updates: Record<string, number> = {};
        if (typeof gravity === 'number') updates.gravity = gravity;
        if (typeof salience === 'number') updates.salience = salience;
        if (typeof confidence === 'number') updates.confidence = confidence;
        if (typeof strength === 'number') updates.strength = strength;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'No valid updates provided' } }, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);
        const [updatedNode] = await db.update(memoryNodes)
            .set({ ...updates, lastAccessed: now })
            .where(eq(memoryNodes.id, id))
            .returning();

        // Log the update
        await db.insert(memoryAuditLog).values({
            studentId: dbUser.id,
            operation: 'node.updated',
            entityType: 'node',
            entityId: id,
            actor: 'student',
            details: JSON.stringify(updates),
            timestamp: now,
        });

        return NextResponse.json({ data: updatedNode });
    } catch (error) {
        console.error('Error updating memory node:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update memory node' } }, { status: 500 });
    }
}

// DELETE /api/memory/nodes/[id] - Delete a node (student right - with some limitations)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const { id } = await params;

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

        const existingNode = await db.query.memoryNodes.findFirst({
            where: and(
                eq(memoryNodes.id, id),
                eq(memoryNodes.graphId, graph.id)
            ),
        });

        if (!existingNode) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Node not found' } }, { status: 404 });
        }

        // Note: In a full implementation, we might block deletion of safety-critical nodes
        // For now, we allow deletion with audit logging

        // Delete the node (edges will cascade delete)
        await db.delete(memoryNodes).where(eq(memoryNodes.id, id));

        // Update graph stats
        await db.update(memoryGraphs)
            .set({
                nodeCount: sql`MAX(0, ${memoryGraphs.nodeCount} - 1)`,
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(memoryGraphs.id, graph.id));

        // Log the deletion
        const now = Math.floor(Date.now() / 1000);
        await db.insert(memoryAuditLog).values({
            studentId: dbUser.id,
            operation: 'node.deleted',
            entityType: 'node',
            entityId: id,
            actor: 'student',
            details: JSON.stringify({
                contentHash: existingNode.contentHash,
                modality: existingNode.modality,
            }),
            timestamp: now,
        });

        return NextResponse.json({ data: { deleted: true, id } });
    } catch (error) {
        console.error('Error deleting memory node:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete memory node' } }, { status: 500 });
    }
}
