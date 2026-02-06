import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classSessions } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/sessions - List class sessions
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (classId) {
            conditions.push(eq(classSessions.classId, classId));
        }

        if (startDate) {
            conditions.push(gte(classSessions.sessionDate, parseInt(startDate)));
        }

        if (endDate) {
            conditions.push(lte(classSessions.sessionDate, parseInt(endDate)));
        }

        if (status) {
            conditions.push(eq(classSessions.status, status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'));
        }

        const result = await db
            .select()
            .from(classSessions)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(classSessions.sessionDate))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

// POST /api/sessions - Create session
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newSession = await db.insert(classSessions).values({
            classId: body.classId,
            sessionDate: body.sessionDate || body.date,
            startTime: body.startTime,
            endTime: body.endTime,
            roomId: body.roomId,
            teacherId: body.teacherId,
            lessonId: body.lessonId,
            notes: body.notes,
            status: body.status || 'scheduled',
        }).returning();

        return NextResponse.json({ data: newSession[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating session:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}

