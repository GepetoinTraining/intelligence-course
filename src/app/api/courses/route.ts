import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/courses - List courses
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get('published');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(courses.organizationId, orgId));
        }

        if (published === 'true') {
            conditions.push(eq(courses.isPublished, 1));
        }

        const result = await db
            .select()
            .from(courses)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(courses.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

// POST /api/courses - Create course
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newCourse = await db.insert(courses).values({
            createdBy: userId,
            organizationId: orgId || body.organizationId,
            title: JSON.stringify(body.title),
            description: JSON.stringify(body.description || {}),
            isPublished: body.isPublished ? 1 : 0,
            isPublic: body.isPublic ? 1 : 0,
            version: body.version || '1.0',
            language: body.language || 'pt-BR',
        }).returning();

        return NextResponse.json({ data: newCourse[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}



