import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryGraphs, chatSessions, safetyAlerts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/domains/supervision/[studentId] - Get supervision data
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    try {
        // Get memory graph stats
        const graph = await db
            .select()
            .from(memoryGraphs)
            .where(eq(memoryGraphs.studentId, studentId))
            .orderBy(desc(memoryGraphs.lastCompressed))
            .limit(1);

        // Get session activity
        const recentSessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, studentId))
            .orderBy(desc(chatSessions.startedAt))
            .limit(20);

        // Get alerts
        const alerts = await db
            .select()
            .from(safetyAlerts)
            .where(eq(safetyAlerts.studentId, studentId))
            .orderBy(desc(safetyAlerts.detectedAt))
            .limit(10);

        const now = Math.floor(Date.now() / 1000);
        const weekAgo = now - 604800;
        const weeklySessions = recentSessions.filter(s => s.startedAt && s.startedAt > weekAgo);

        return NextResponse.json({
            data: {
                studentId,
                memoryIntegrity: graph.length > 0 ? {
                    snr: graph[0].snr,
                    nodeCount: graph[0].nodeCount,
                    edgeCount: graph[0].edgeCount,
                    lastCompressed: graph[0].lastCompressed,
                } : null,
                activity: {
                    totalSessions: recentSessions.length,
                    weeklySessions: weeklySessions.length,
                    lastActive: recentSessions[0]?.startedAt,
                },
                alerts: {
                    total: alerts.length,
                    unresolved: alerts.filter(a => !a.resolvedAt).length,
                    byLevel: {
                        red: alerts.filter(a => a.level === 'red').length,
                        orange: alerts.filter(a => a.level === 'orange').length,
                        yellow: alerts.filter(a => a.level === 'yellow').length,
                        green: alerts.filter(a => a.level === 'green').length,
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching supervision data:', error);
        return NextResponse.json({ error: 'Failed to fetch supervision data' }, { status: 500 });
    }
}
