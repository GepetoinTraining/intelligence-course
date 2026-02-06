import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { progress, familyLinks, modules } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ childId: string }>;
}

// GET /api/parent/child/[childId]/recommendations - Get recommendations
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;

    try {
        // Verify parent-child relationship
        const link = await db
            .select()
            .from(familyLinks)
            .where(eq(familyLinks.parentId, personId))
            .limit(100);

        const isAuthorized = link.some(l => l.studentId === childId);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Not authorized to view this child' }, { status: 403 });
        }

        // Get recent progress
        const progressData = await db
            .select()
            .from(progress)
            .where(eq(progress.personId, childId))
            .orderBy(desc(progress.updatedAt))
            .limit(20);

        // Generate simple recommendations based on progress
        const recommendations = [];

        const inProgressItems = progressData.filter(p => p.status === 'in_progress');
        const completedRecently = progressData.filter(p => p.status === 'completed').slice(0, 5);

        if (inProgressItems.length > 0) {
            recommendations.push({
                type: 'continue',
                message: `Continue with ${inProgressItems.length} items in progress`,
                priority: 'high',
            });
        }

        if (completedRecently.length >= 3) {
            recommendations.push({
                type: 'celebrate',
                message: 'Great progress! Celebrate recent achievements',
                priority: 'medium',
            });
        }

        if (progressData.length === 0) {
            recommendations.push({
                type: 'start',
                message: 'Start the first module to begin learning',
                priority: 'high',
            });
        }

        return NextResponse.json({
            data: {
                childId,
                recommendations,
                progressSummary: {
                    total: progressData.length,
                    completed: progressData.filter(p => p.status === 'completed').length,
                    inProgress: inProgressItems.length,
                }
            }
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}
