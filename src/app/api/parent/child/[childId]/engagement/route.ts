import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSessions, familyLinks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ childId: string }>;
}

// GET /api/parent/child/[childId]/engagement - Session frequency, duration
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;

    try {
        // Verify parent-child relationship
        const familyLink = await db
            .select()
            .from(familyLinks)
            .where(and(eq(familyLinks.parentId, userId), eq(familyLinks.studentId, childId)))
            .limit(1);

        if (familyLink.length === 0) {
            return NextResponse.json({ error: 'No relationship found' }, { status: 403 });
        }

        const now = Math.floor(Date.now() / 1000);
        const weekAgo = now - 604800;
        const monthAgo = now - 2592000;

        const sessions = await db
            .select({
                id: chatSessions.id,
                messageCount: chatSessions.messageCount,
                startedAt: chatSessions.startedAt,
                endedAt: chatSessions.endedAt,
            })
            .from(chatSessions)
            .where(eq(chatSessions.studentId, childId))
            .orderBy(desc(chatSessions.startedAt))
            .limit(30);

        const weeklySessions = sessions.filter(s => s.startedAt && s.startedAt > weekAgo);
        const monthlySessions = sessions.filter(s => s.startedAt && s.startedAt > monthAgo);

        const totalMessages = monthlySessions.reduce((sum, s) => sum + (s.messageCount || 0), 0);
        const avgPerSession = monthlySessions.length > 0 ? totalMessages / monthlySessions.length : 0;

        return NextResponse.json({
            data: {
                childId,
                engagement: {
                    thisWeek: {
                        sessions: weeklySessions.length,
                        messages: weeklySessions.reduce((sum, s) => sum + (s.messageCount || 0), 0),
                    },
                    thisMonth: {
                        sessions: monthlySessions.length,
                        messages: totalMessages,
                        avgMessagesPerSession: Math.round(avgPerSession * 10) / 10,
                    },
                    lastActive: sessions[0]?.startedAt,
                },
                privacyNote: 'This shows engagement metrics only. Conversation content is private to the student.'
            }
        });
    } catch (error) {
        console.error('Error fetching engagement:', error);
        return NextResponse.json({ error: 'Failed to fetch engagement' }, { status: 500 });
    }
}
