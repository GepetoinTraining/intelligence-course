import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { memoryGraphs, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/memory/graph - Get current user's memory graph
// GET /api/memory/graph?studentId=xxx - Get specific student's graph (staff only)
export async function GET(req: NextRequest) {
    try {
        const { userId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        // Get the database user
        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        // Check if querying for a specific student (staff/school only)
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        let targetStudentId = dbUser.id;

        if (studentId && studentId !== dbUser.id) {
            // Permission check: only staff/school/owner can access other students' graphs
            if (!['staff', 'school', 'owner'].includes(dbUser.role || '')) {
                return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not authorized to view other graphs' } }, { status: 403 });
            }
            targetStudentId = studentId;
        }

        // Get the memory graph
        const graph = await db.query.memoryGraphs.findFirst({
            where: and(
                eq(memoryGraphs.studentId, targetStudentId),
                eq(memoryGraphs.organizationId, dbUser.organizationId!)
            ),
        });

        if (!graph) {
            // Return empty state for students without a graph yet
            return NextResponse.json({
                data: null,
                meta: { exists: false }
            });
        }

        // Update last accessed
        await db.update(memoryGraphs)
            .set({ lastAccessed: Math.floor(Date.now() / 1000) })
            .where(eq(memoryGraphs.id, graph.id));

        return NextResponse.json({
            data: graph,
            meta: { exists: true }
        });
    } catch (error) {
        console.error('Error fetching memory graph:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch memory graph' } }, { status: 500 });
    }
}

// POST /api/memory/graph - Create a new memory graph for the current user
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

        // Check if graph already exists
        const existingGraph = await db.query.memoryGraphs.findFirst({
            where: eq(memoryGraphs.studentId, dbUser.id),
        });

        if (existingGraph) {
            return NextResponse.json({ error: { code: 'CONFLICT', message: 'Memory graph already exists' } }, { status: 409 });
        }

        // Create new graph
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

        return NextResponse.json({
            data: newGraph,
            meta: { created: true }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating memory graph:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create memory graph' } }, { status: 500 });
    }
}

