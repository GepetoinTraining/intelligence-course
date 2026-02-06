import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { progress } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/progress - Update progress
export async function POST(request: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();

        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            lessonId,
            moduleId,
            taskId,
            status,
            score,
            maxScore,
        } = body as {
            lessonId?: string;
            moduleId?: string;
            taskId?: string;
            status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
            score?: number;
            maxScore?: number;
        };

        if (!lessonId && !taskId) {
            return NextResponse.json(
                { error: 'Must provide lessonId or taskId' },
                { status: 400 }
            );
        }

        // Check if progress record exists
        const whereClause = taskId
            ? and(eq(progress.personId, personId), eq(progress.taskId, taskId))
            : and(eq(progress.personId, personId), eq(progress.lessonId, lessonId!));

        const [existing] = await db
            .select()
            .from(progress)
            .where(whereClause)
            .limit(1);

        const now = Math.floor(Date.now() / 1000);

        if (existing) {
            // Update existing
            await db
                .update(progress)
                .set({
                    status,
                    score,
                    maxScore,
                    completedAt: status === 'completed' ? now : existing.completedAt,
                    updatedAt: now,
                })
                .where(eq(progress.id, existing.id));
        } else {
            // Create new
            await db.insert(progress).values({
                userId,
                moduleId,
                lessonId,
                taskId,
                status,
                score,
                maxScore,
                startedAt: now,
                completedAt: status === 'completed' ? now : undefined,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Progress API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/progress - Get user progress
export async function GET(request: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();

        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const moduleId = url.searchParams.get('moduleId');
        const lessonId = url.searchParams.get('lessonId');

        let whereClause = eq(progress.personId, personId);

        if (moduleId) {
            whereClause = and(
                eq(progress.personId, personId),
                eq(progress.moduleId, moduleId)
            )!;
        }

        if (lessonId) {
            whereClause = and(
                eq(progress.personId, personId),
                eq(progress.lessonId, lessonId)
            )!;
        }

        const userProgress = await db
            .select()
            .from(progress)
            .where(whereClause);

        return NextResponse.json({ progress: userProgress });
    } catch (error) {
        console.error('Get progress error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}



