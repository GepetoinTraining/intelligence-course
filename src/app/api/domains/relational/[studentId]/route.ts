import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs, memoryNodes, chatSessions, chatMessages, memoryEdges } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/domains/relational/[studentId] - Get relational data for AI personality
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
                    hasRelationalData: false,
                }
            });
        }

        // Get episodic/emotional nodes
        const emotionalNodes = await db
            .select()
            .from(memoryNodes)
            .where(eq(memoryNodes.graphId, graph[0].id))
            .orderBy(desc(memoryNodes.createdAt))
            .limit(20);

        // Get recent sessions for context
        const recentSessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, studentId))
            .orderBy(desc(chatSessions.startedAt))
            .limit(5);

        // Get messages from recent sessions (for personality inference)
        const sessionMessages = [];
        for (const session of recentSessions.slice(0, 2)) {
            const messages = await db
                .select()
                .from(chatMessages)
                .where(eq(chatMessages.sessionId, session.id))
                .limit(10);
            sessionMessages.push({
                sessionId: session.id,
                startedAt: session.startedAt,
                messageCount: messages.length,
            });
        }

        return NextResponse.json({
            data: {
                studentId,
                hasRelationalData: true,
                memoryGraph: {
                    nodeCount: graph[0].nodeCount,
                    edgeCount: graph[0].edgeCount,
                    snr: graph[0].snr,
                },
                emotionalContext: emotionalNodes.filter(n => n.modality === 'emotional').slice(0, 5).map(n => ({
                    content: n.content,
                    salience: n.salience,
                })),
                conversationHistory: sessionMessages,
            }
        });
    } catch (error) {
        console.error('Error fetching relational data:', error);
        return NextResponse.json({ error: 'Failed to fetch relational data' }, { status: 500 });
    }
}
