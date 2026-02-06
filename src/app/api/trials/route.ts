import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trialClasses } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/trials - List trial classes
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const scheduledFrom = searchParams.get('scheduledFrom');
    const scheduledTo = searchParams.get('scheduledTo');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(trialClasses.organizationId, orgId));
        }

        if (leadId) {
            conditions.push(eq(trialClasses.leadId, leadId));
        }

        if (status) {
            conditions.push(eq(trialClasses.status, status as 'scheduled' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'rescheduled'));
        }

        if (scheduledFrom) {
            conditions.push(gte(trialClasses.scheduledDate, parseInt(scheduledFrom)));
        }

        if (scheduledTo) {
            conditions.push(lte(trialClasses.scheduledDate, parseInt(scheduledTo)));
        }

        const result = await db
            .select()
            .from(trialClasses)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(trialClasses.scheduledDate))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching trials:', error);
        return NextResponse.json({ error: 'Failed to fetch trials' }, { status: 500 });
    }
}

// POST /api/trials - Schedule trial class
export async function POST(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newTrial = await db.insert(trialClasses).values({
            organizationId: orgId || body.organizationId,
            leadId: body.leadId,
            userId: body.userId,
            classId: body.classId,
            sessionId: body.sessionId,
            scheduledDate: body.scheduledDate,
            scheduledTime: body.scheduledTime,
            roomId: body.roomId,
            teacherId: body.teacherId,
            status: body.status || 'scheduled',
        }).returning();

        return NextResponse.json({ data: newTrial[0] }, { status: 201 });
    } catch (error) {
        console.error('Error scheduling trial:', error);
        return NextResponse.json({ error: 'Failed to schedule trial' }, { status: 500 });
    }
}

