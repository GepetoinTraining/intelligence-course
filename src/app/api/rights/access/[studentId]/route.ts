import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs, memoryLedger, chatSessions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/rights/access/[studentId] - Get data access information
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    // Authorization: only the student themselves or authorized roles can access
    if (personId !== studentId) {
        // In production, would check for parent/admin roles
    }

    try {
        // Get memory graph
        const graph = await db
            .select()
            .from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, studentId))
            .limit(1);

        // Count ledger entries
        let ledgerCount = 0;
        if (graph.length > 0) {
            const ledger = await db
                .select()
                .from(memoryLedger)
                .where(eq(memoryLedger.graphId, graph[0].id));
            ledgerCount = ledger.length;
        }

        // Count sessions
        const sessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, studentId));

        return NextResponse.json({
            data: {
                studentId,
                dataInventory: {
                    memoryGraph: graph.length > 0 ? {
                        exists: true,
                        nodeCount: graph[0].nodeCount,
                        edgeCount: graph[0].edgeCount,
                    } : { exists: false },
                    ledgerEntries: ledgerCount,
                    chatSessions: sessions.length,
                },
                rights: {
                    canExport: true,
                    canDelete: true,
                    canRestrict: true,
                }
            }
        });
    } catch (error) {
        console.error('Error fetching access info:', error);
        return NextResponse.json({ error: 'Failed to fetch access info' }, { status: 500 });
    }
}
