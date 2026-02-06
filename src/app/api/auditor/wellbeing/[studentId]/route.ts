import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSessions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/auditor/wellbeing/[studentId] - Get wellbeing indicators
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    try {
        const now = Math.floor(Date.now() / 1000);
        const weekAgo = now - 604800;

        const recentSessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, studentId))
            .orderBy(desc(chatSessions.startedAt))
            .limit(14);

        const weeklySessions = recentSessions.filter(s => s.startedAt && s.startedAt > weekAgo);

        // Calculate consistency
        const consistency = weeklySessions.length >= 3 ? 'consistent' : weeklySessions.length >= 1 ? 'moderate' : 'low';

        // Session timing analysis (approximation)
        const avgMessagesPerSession = weeklySessions.length > 0
            ? weeklySessions.reduce((sum, s) => sum + (s.messageCount || 0), 0) / weeklySessions.length
            : 0;

        return NextResponse.json({
            data: {
                studentId,
                wellbeing: {
                    engagementLevel: consistency,
                    weeklySessionCount: weeklySessions.length,
                    avgMessagesPerSession: Math.round(avgMessagesPerSession),
                    lastActive: recentSessions[0]?.startedAt,
                    overallStatus: weeklySessions.length >= 2 ? 'healthy' : 'needs_attention',
                },
                note: 'Wellbeing indicators are derived from engagement patterns only.',
            }
        });
    } catch (error) {
        console.error('Error fetching wellbeing:', error);
        return NextResponse.json({ error: 'Failed to fetch wellbeing' }, { status: 500 });
    }
}
