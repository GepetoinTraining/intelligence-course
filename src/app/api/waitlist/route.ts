import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/waitlist - List waitlist entries
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (classId) conditions.push(eq(waitlist.classId, classId));
        if (status) conditions.push(eq(waitlist.status, status as any));

        const entries = await db
            .select()
            .from(waitlist)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(waitlist.createdAt))
            .limit(limit);

        return NextResponse.json({ data: entries });
    } catch (error) {
        console.error('Error fetching waitlist:', error);
        return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
    }
}

// POST /api/waitlist - Add to waitlist
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { classId, courseTypeId, levelId, preferredSchedule } = body;

        if (!classId && !courseTypeId) {
            return NextResponse.json({ error: 'classId or courseTypeId required' }, { status: 400 });
        }

        // Get current position (highest + 1)
        const existing = classId
            ? await db.select().from(waitlist).where(eq(waitlist.classId, classId))
            : [];

        const position = existing.length + 1;

        const newEntry = await db.insert(waitlist).values({
            personId,
            classId,
            courseTypeId,
            levelId,
            preferredSchedule,
            position,
            status: 'waiting',
        }).returning();

        return NextResponse.json({ data: newEntry[0] }, { status: 201 });
    } catch (error) {
        console.error('Error adding to waitlist:', error);
        return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
    }
}



