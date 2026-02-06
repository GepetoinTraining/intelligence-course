import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { studentPrompts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/student-prompts - List student prompts
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const prompts = await db
            .select()
            .from(studentPrompts)
            .where(eq(studentPrompts.userId, userId))
            .orderBy(desc(studentPrompts.createdAt))
            .limit(limit);

        return NextResponse.json({ data: prompts });
    } catch (error) {
        console.error('Error fetching student prompts:', error);
        return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }
}

// POST /api/student-prompts - Create student prompt
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, systemPrompt, userMessage, tags, isPublic, moduleId, lessonId } = body;

        if (!title) {
            return NextResponse.json({ error: 'title required' }, { status: 400 });
        }

        const newPrompt = await db.insert(studentPrompts).values({
            userId,
            title,
            systemPrompt,
            userMessage,
            tags,
            isPublic: isPublic ? 1 : 0,
            moduleId,
            lessonId,
        }).returning();

        return NextResponse.json({ data: newPrompt[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating student prompt:', error);
        return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
    }
}

