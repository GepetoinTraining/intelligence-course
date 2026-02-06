import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSessions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/auditor/engagement/[studentId] - Get engagement metrics
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    try {
        const now = Math.floor(Date.now() / 1000);
        const weekAgo = now - 604800;
        const monthAgo = now - 2592000;

        const sessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, studentId))
            .orderBy(desc(chatSessions.startedAt))
            .limit(100);

        const weeklySessions = sessions.filter(s => s.startedAt && s.startedAt > weekAgo);
        const monthlySessions = sessions.filter(s => s.startedAt && s.startedAt > monthAgo);

        const totalMessages = monthlySessions.reduce((sum, s) => sum + (s.messageCount || 0), 0);

        const sessionDurations = sessions
            .filter(s => s.startedAt && s.endedAt)
            .map(s => (s.endedAt! - s.startedAt!) / 60);
        const averageDuration = sessionDurations.length > 0
            ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
            : 0;

        return NextResponse.json({
            data: {
                studentId,
                engagement: {
                    thisWeek: {
                        sessions: weeklySessions.length,
                        messages: weeklySessions.reduce((sum, s) => sum + (s.messageCount || 0), 0),
                    },
                    thisMonth: {
                        sessions: monthlySessions.length,
                        messages: totalMessages,
                        avgMessagesPerSession: monthlySessions.length > 0 ? Math.round(totalMessages / monthlySessions.length) : 0,
                    },
                    averageSessionDuration: Math.round(averageDuration),
                    lastActive: sessions[0]?.startedAt,
                },
            }
        });
    } catch (error) {
        console.error('Error fetching engagement:', error);
        return NextResponse.json({ error: 'Failed to fetch engagement' }, { status: 500 });
    }
}
