import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSessions, familyLinks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ childId: string }>;
}

// GET /api/parent/child/[childId]/wellbeing - Aggregated emotional indicators
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;

    try {
        // Verify parent-child relationship
        const familyLink = await db
            .select()
            .from(familyLinks)
            .where(and(eq(familyLinks.parentId, personId), eq(familyLinks.studentId, childId)))
            .limit(1);

        if (familyLink.length === 0) {
            return NextResponse.json({ error: 'No relationship found' }, { status: 403 });
        }

        const now = Math.floor(Date.now() / 1000);
        const weekAgo = now - 604800;

        const recentSessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, childId))
            .orderBy(desc(chatSessions.startedAt))
            .limit(14);

        // Calculate metrics from metadata patterns
        const weeklySessions = recentSessions.filter(s => s.startedAt && s.startedAt > weekAgo);
        const avgMessagesPerSession = weeklySessions.length > 0
            ? weeklySessions.reduce((sum, s) => sum + (s.messageCount || 0), 0) / weeklySessions.length
            : 0;

        // Engagement patterns
        const consistency = weeklySessions.length >= 3 ? 'consistent' : weeklySessions.length >= 1 ? 'moderate' : 'low';

        return NextResponse.json({
            data: {
                childId,
                wellbeing: {
                    engagementLevel: consistency,
                    weeklySessionCount: weeklySessions.length,
                    avgMessagesPerSession: Math.round(avgMessagesPerSession),
                    // These would be computed from actual AI analysis in production
                    overallStatus: weeklySessions.length >= 2 ? 'healthy' : 'needs_attention',
                },
                privacyNote: 'Wellbeing indicators are derived from engagement patterns only. Actual conversation content is private.',
            }
        });
    } catch (error) {
        console.error('Error fetching wellbeing:', error);
        return NextResponse.json({ error: 'Failed to fetch wellbeing' }, { status: 500 });
    }
}
