import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs, memoryNodes, memoryLedger, chatSessions, chatMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/chat/context/[studentId] - Get chat context for a student
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    try {
        // Get memory graph
        const graph = await db
            .select()
            .from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, studentId))
            .limit(1);

        if (graph.length === 0) {
            return NextResponse.json({
                data: {
                    studentId,
                    hasContext: false,
                    message: 'No memory graph found for this student',
                }
            });
        }

        // Get recent memory nodes
        const recentNodes = await db
            .select()
            .from(memoryNodes)
            .where(eq(memoryNodes.graphId, graph[0].id))
            .orderBy(desc(memoryNodes.createdAt))
            .limit(10);

        // Get important ledger entries
        const ledgerEntries = await db
            .select()
            .from(memoryLedger)
            .where(eq(memoryLedger.graphId, graph[0].id))
            .orderBy(desc(memoryLedger.importance))
            .limit(5);

        // Get recent session metadata (NOT content)
        const recentSessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, studentId))
            .orderBy(desc(chatSessions.startedAt))
            .limit(5);

        return NextResponse.json({
            data: {
                studentId,
                hasContext: true,
                graph: {
                    id: graph[0].id,
                    nodeCount: graph[0].nodeCount,
                    edgeCount: graph[0].edgeCount,
                    snr: graph[0].snr,
                },
                recentNodes: recentNodes.map(n => ({
                    id: n.id,
                    content: n.content,
                    modality: n.modality,
                    salience: n.salience,
                })),
                ledgerItems: ledgerEntries.map(l => ({
                    id: l.id,
                    summary: l.summary,
                    category: l.category,
                    importance: l.importance,
                })),
                sessionMetadata: recentSessions.map(s => ({
                    id: s.id,
                    startedAt: s.startedAt,
                    messageCount: s.messageCount,
                })),
            }
        });
    } catch (error) {
        console.error('Error fetching chat context:', error);
        return NextResponse.json({ error: 'Failed to fetch chat context' }, { status: 500 });
    }
}
