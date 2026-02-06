import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classes, schedules, enrollments } from '@/lib/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/classes - List classes
export async function GET(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const termId = searchParams.get('termId');
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');
    const courseTypeId = searchParams.get('courseTypeId');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(classes.organizationId, orgId));
        }

        if (termId) {
            conditions.push(eq(classes.termId, termId));
        }

        if (teacherId) {
            conditions.push(eq(classes.teacherId, teacherId));
        }

        if (status) {
            conditions.push(eq(classes.status, status as any));
        }

        if (courseTypeId) {
            conditions.push(eq(classes.courseTypeId, courseTypeId));
        }

        const result = await db
            .select()
            .from(classes)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(classes.createdAt));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching classes:', error);
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}

// POST /api/classes - Create class
export async function POST(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newClass = await db.insert(classes).values({
            organizationId: orgId,
            name: body.name,
            courseId: body.courseId,
            courseTypeId: body.courseTypeId,
            levelId: body.levelId,
            termId: body.termId,
            teacherId: body.teacherId,
            maxStudents: body.maxStudents || 15,
            currentStudents: 0,
            status: body.status || 'draft',
            startsAt: body.startsAt,
            endsAt: body.endsAt,
        }).returning();

        return NextResponse.json({ data: newClass[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating class:', error);
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }
}

