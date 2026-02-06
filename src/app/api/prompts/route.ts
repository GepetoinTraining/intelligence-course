import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prompts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/prompts - List prompts
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get('lessonId');
    const taskId = searchParams.get('taskId');
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (lessonId) {
            conditions.push(eq(prompts.lessonId, lessonId));
        }

        if (taskId) {
            conditions.push(eq(prompts.taskId, taskId));
        }

        if (courseId) {
            conditions.push(eq(prompts.courseId, courseId));
        }

        // Also filter by user's own prompts or shared prompts
        // For now, return user's prompts and public prompts
        if (!lessonId && !taskId && !courseId) {
            conditions.push(eq(prompts.personId, personId));
        }

        const result = await db
            .select()
            .from(prompts)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(prompts.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching prompts:', error);
        return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }
}

// POST /api/prompts - Create prompt
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newPrompt = await db.insert(prompts).values({
            personId,
            organizationId: orgId || null,
            name: body.name,
            description: body.description,
            tags: body.tags ? JSON.stringify(body.tags) : '[]',
            baseSystemPrompt: body.baseSystemPrompt || body.systemPrompt,
            baseMessages: body.baseMessages ? JSON.stringify(body.baseMessages) : '[]',
            currentSystemPrompt: body.currentSystemPrompt || body.systemPrompt,
            currentMessages: body.currentMessages ? JSON.stringify(body.currentMessages) : '[]',
            sharedWith: body.sharedWith || 'private',
            courseId: body.courseId,
            moduleId: body.moduleId,
            lessonId: body.lessonId,
            taskId: body.taskId,
        }).returning();

        return NextResponse.json({ data: newPrompt[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating prompt:', error);
        return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
    }
}



