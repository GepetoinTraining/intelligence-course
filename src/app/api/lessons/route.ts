import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lessons } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/lessons - List lessons
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const moduleId = searchParams.get('moduleId');

    try {
        const conditions = [];

        if (moduleId) {
            conditions.push(eq(lessons.moduleId, moduleId));
        }

        const result = await db
            .select()
            .from(lessons)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(asc(lessons.orderIndex));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching lessons:', error);
        return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
    }
}

// POST /api/lessons - Create lesson
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newLesson = await db.insert(lessons).values({
            moduleId: body.moduleId,
            title: typeof body.title === 'string' ? body.title : JSON.stringify(body.title),
            description: body.description ? JSON.stringify(body.description) : '{}',
            content: body.content,
            contentFormat: body.contentFormat || 'markdown',
            orderIndex: body.orderIndex || 0,
            lessonType: body.lessonType || 'standard',
        }).returning();

        return NextResponse.json({ data: newLesson[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating lesson:', error);
        return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
    }
}



