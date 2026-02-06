import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { memoryLedger, memoryGraphs, memoryAuditLog, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/memory/ledger - Get ledger entries (critical memories)
export async function GET(req: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
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
        const category = searchParams.get('category');
        const activeOnly = searchParams.get('active') !== 'false';

        const conditions = [eq(memoryLedger.graphId, graph.id)];

        if (category) {
            conditions.push(eq(memoryLedger.category, category as 'promise' | 'secret' | 'debt' | 'threat' | 'fact' | 'instruction' | 'observation'));
        }

        if (activeOnly) {
            conditions.push(eq(memoryLedger.isActive, 1));
        }

        const entries = await db.select()
            .from(memoryLedger)
            .where(and(...conditions))
            .orderBy(desc(memoryLedger.importance));

        return NextResponse.json({
            data: entries,
            meta: { total: entries.length, graphId: graph.id }
        });
    } catch (error) {
        console.error('Error fetching ledger entries:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ledger' } }, { status: 500 });
    }
}

// POST /api/memory/ledger - Add a new ledger entry (critical memory)
export async function POST(req: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
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
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Memory graph not found. Create one first.' } }, { status: 404 });
        }

        const body = await req.json();
        const {
            content,
            summary,
            category,
            importance = 1,
            triggerThreshold = 0.5,
            triggers = [],
            triggerEntities = [],
            linkedNodes = [],
            sourceType,
            sourceEntity,
            expiresAt
        } = body;

        if (!content || !category) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Content and category are required' } }, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);

        const [newEntry] = await db.insert(memoryLedger).values({
            graphId: graph.id,
            content,
            summary,
            category,
            importance,
            triggerThreshold,
            triggers: JSON.stringify(triggers),
            triggerEntities: JSON.stringify(triggerEntities),
            linkedNodes: JSON.stringify(linkedNodes),
            sourceType,
            sourceEntity,
            sourceDate: now,
            isActive: 1,
            expiresAt,
            accessCount: 0,
            createdAt: now,
        }).returning();

        // Log the operation
        await db.insert(memoryAuditLog).values({
            studentId: dbUser.id,
            operation: 'ledger.added',
            entityType: 'ledger',
            entityId: newEntry.id,
            actor: 'student',
            details: JSON.stringify({ category, importance }),
            timestamp: now,
        });

        return NextResponse.json({
            data: newEntry,
            meta: { graphId: graph.id }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating ledger entry:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create ledger entry' } }, { status: 500 });
    }
}



