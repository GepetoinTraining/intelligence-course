import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { modules } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/modules - List modules
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    try {
        const conditions = [];

        if (courseId) {
            conditions.push(eq(modules.courseId, courseId));
        }

        const result = await db
            .select()
            .from(modules)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(asc(modules.orderIndex));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching modules:', error);
        return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }
}

// POST /api/modules - Create module
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newModule = await db.insert(modules).values({
            courseId: body.courseId,
            title: typeof body.title === 'string' ? body.title : JSON.stringify(body.title),
            description: body.description ? JSON.stringify(body.description) : '{}',
            orderIndex: body.orderIndex || 0,
            estimatedHours: body.estimatedHours,
        }).returning();

        return NextResponse.json({ data: newModule[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating module:', error);
        return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
    }
}

