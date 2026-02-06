import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { memoryNodes, memoryGraphs, memoryAuditLog, users } from '@/lib/db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { createHash } from 'crypto';

// GET /api/memory/nodes - Get memory nodes for current user's graph
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        // Get the user's graph
        const graph = await db.query.memoryGraphs.findFirst({
            where: eq(memoryGraphs.studentId, dbUser.id),
        });

        if (!graph) {
            return NextResponse.json({ data: [], meta: { total: 0 } });
        }

        // Parse query params for filtering
        const { searchParams } = new URL(req.url);
        const modality = searchParams.get('modality');
        const minGravity = parseFloat(searchParams.get('minGravity') || '0');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query
        let query = db.select()
            .from(memoryNodes)
            .where(eq(memoryNodes.graphId, graph.id))
            .orderBy(desc(memoryNodes.gravity))
            .limit(limit);

        // Apply filters
        const conditions = [eq(memoryNodes.graphId, graph.id)];

        if (modality) {
            conditions.push(eq(memoryNodes.modality, modality as 'episodic' | 'semantic' | 'procedural' | 'emotional' | 'sensory'));
        }

        if (minGravity > 0) {
            conditions.push(gte(memoryNodes.gravity, minGravity));
        }

        const nodes = await db.select()
            .from(memoryNodes)
            .where(and(...conditions))
            .orderBy(desc(memoryNodes.gravity))
            .limit(limit);

        return NextResponse.json({
            data: nodes,
            meta: { total: nodes.length, graphId: graph.id }
        });
    } catch (error) {
        console.error('Error fetching memory nodes:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch memory nodes' } }, { status: 500 });
    }
}

// POST /api/memory/nodes - Add a new memory node
export async function POST(req: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        const body = await req.json();
        const { content, modality = 'semantic', salience = 1, confidence = 1, sourceType = 'chat', sourceId } = body;

        if (!content) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Content is required' } }, { status: 400 });
        }

        // Get or create the user's graph
        let graph = await db.query.memoryGraphs.findFirst({
            where: eq(memoryGraphs.studentId, dbUser.id),
        });

        if (!graph) {
            // Auto-create graph if it doesn't exist
            const now = Math.floor(Date.now() / 1000);
            const [newGraph] = await db.insert(memoryGraphs).values({
                studentId: dbUser.id,
                organizationId: dbUser.organizationId!,
                snr: 1,
                compressionPasses: 0,
                lossVector: '[]',
                nodeCount: 0,
                edgeCount: 0,
                version: 1,
                createdAt: now,
                updatedAt: now,
                lastAccessed: now,
            }).returning();
            graph = newGraph;
        }

        // Generate content hash for integrity
        const contentHash = createHash('sha256').update(content).digest('hex');
        const now = Math.floor(Date.now() / 1000);

        // Create the node
        const [newNode] = await db.insert(memoryNodes).values({
            graphId: graph.id,
            content,
            contentHash,
            gravity: salience, // Initial gravity = salience
            salience,
            confidence,
            modality,
            timestamp: now,
            strength: 1,
            lastAccessed: now,
            sourceType,
            sourceId,
            createdAt: now,
        }).returning();

        // Update graph stats
        await db.update(memoryGraphs)
            .set({
                nodeCount: sql`${memoryGraphs.nodeCount} + 1`,
                newestMemory: now,
                updatedAt: now,
            })
            .where(eq(memoryGraphs.id, graph.id));

        // If this is the first node, also set oldestMemory
        if (graph.nodeCount === 0) {
            await db.update(memoryGraphs)
                .set({ oldestMemory: now })
                .where(eq(memoryGraphs.id, graph.id));
        }

        // Log the operation
        await db.insert(memoryAuditLog).values({
            studentId: dbUser.id,
            operation: 'node.created',
            entityType: 'node',
            entityId: newNode.id,
            actor: 'student',
            details: JSON.stringify({ modality, sourceType }),
            timestamp: now,
        });

        return NextResponse.json({
            data: newNode,
            meta: { graphId: graph.id }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating memory node:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create memory node' } }, { status: 500 });
    }
}

