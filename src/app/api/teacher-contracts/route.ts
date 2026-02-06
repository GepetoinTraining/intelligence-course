import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teacherContracts } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/teacher-contracts - List teacher contracts
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get('teacherId');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (orgId) conditions.push(eq(teacherContracts.organizationId, orgId));
        if (teacherId) conditions.push(eq(teacherContracts.teacherId, teacherId));

        const contracts = await db
            .select()
            .from(teacherContracts)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(teacherContracts.startsAt))
            .limit(limit);

        return NextResponse.json({ data: contracts });
    } catch (error) {
        console.error('Error fetching teacher contracts:', error);
        return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }
}

// POST /api/teacher-contracts - Create teacher contract
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized - organization required' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            teacherId,
            contractType,
            baseSalaryCents,
            hourlyRateCents,
            commissionRate,
            startsAt,
            endsAt,
            minHoursWeek,
            maxHoursWeek,
        } = body;

        if (!teacherId || !contractType || !startsAt) {
            return NextResponse.json({ error: 'teacherId, contractType, and startsAt required' }, { status: 400 });
        }

        const newContract = await db.insert(teacherContracts).values({
            organizationId: orgId,
            teacherId,
            contractType,
            baseSalaryCents,
            hourlyRateCents,
            commissionRate,
            startsAt,
            endsAt,
            minHoursWeek,
            maxHoursWeek,
        }).returning();

        return NextResponse.json({ data: newContract[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating teacher contract:', error);
        return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
    }
}



