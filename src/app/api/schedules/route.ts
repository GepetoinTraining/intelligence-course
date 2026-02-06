import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schedules } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/schedules - List schedule entries
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const dayOfWeek = searchParams.get('dayOfWeek');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        const conditions = [];

        if (classId) {
            conditions.push(eq(schedules.classId, classId));
        }

        if (dayOfWeek) {
            conditions.push(eq(schedules.dayOfWeek, parseInt(dayOfWeek)));
        }

        const result = await db
            .select()
            .from(schedules)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }
}

// POST /api/schedules - Create schedule entry
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newSchedule = await db.insert(schedules).values({
            classId: body.classId,
            roomId: body.roomId,
            dayOfWeek: body.dayOfWeek,
            startTime: body.startTime,
            endTime: body.endTime,
            validFrom: body.validFrom,
            validUntil: body.validUntil,
        }).returning();

        return NextResponse.json({ data: newSchedule[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating schedule:', error);
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }
}



