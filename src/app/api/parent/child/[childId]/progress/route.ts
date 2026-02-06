import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { progress, familyLinks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ childId: string }>;
}

// GET /api/parent/child/[childId]/progress - Get child's progress
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

        // Get progress entries
        const progressData = await db
            .select()
            .from(progress)
            .where(eq(progress.personId, childId))
            .orderBy(desc(progress.updatedAt))
            .limit(100);

        // Calculate summary
        const completed = progressData.filter(p => p.status === 'completed').length;
        const inProgress = progressData.filter(p => p.status === 'in_progress').length;
        const total = progressData.length;

        // Calculate average score
        const scores = progressData.filter(p => p.score !== null).map(p => p.score!);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

        return NextResponse.json({
            data: {
                childId,
                summary: {
                    totalItems: total,
                    completed,
                    inProgress,
                    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
                    averageScore,
                },
                recentProgress: progressData.slice(0, 10).map(p => ({
                    id: p.id,
                    moduleId: p.moduleId,
                    lessonId: p.lessonId,
                    status: p.status,
                    score: p.score,
                    updatedAt: p.updatedAt,
                })),
            }
        });
    } catch (error) {
        console.error('Error fetching child progress:', error);
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}
