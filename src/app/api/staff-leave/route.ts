import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staffLeave, users } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/staff-leave - List leave requests
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const staffUserId = searchParams.get('userId');
    const status = searchParams.get('status');
    const leaveType = searchParams.get('type');
    const startAfter = searchParams.get('startAfter');
    const startBefore = searchParams.get('startBefore');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [];

        if (staffUserId) {
            conditions.push(eq(staffLeave.userId, staffUserId));
        }

        if (status) {
            conditions.push(eq(staffLeave.status, status as any));
        }

        if (leaveType) {
            conditions.push(eq(staffLeave.leaveType, leaveType as any));
        }

        if (startAfter) {
            conditions.push(gte(staffLeave.startDate, parseInt(startAfter)));
        }

        if (startBefore) {
            conditions.push(lte(staffLeave.startDate, parseInt(startBefore)));
        }

        const result = await db
            .select({
                leave: staffLeave,
                user: {
                    id: users.id,
                    name: persons.firstName,
                    email: persons.primaryEmail,
                }
            })
            .from(staffLeave)
            .leftJoin(users, eq(staffLeave.userId, users.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(staffLeave.startDate))
            .limit(limit)
            .offset(offset);

        const flattened = result.map(r => ({
            ...r.leave,
            userName: r.user?.name,
            personEmail: r.user?.email,
        }));

        return NextResponse.json({ data: flattened });
    } catch (error) {
        console.error('Error fetching staff leave:', error);
        return NextResponse.json({ error: 'Failed to fetch staff leave' }, { status: 500 });
    }
}

// POST /api/staff-leave - Create leave request
export async function POST(request: NextRequest) {
    const { userId: authUserId } = await getApiAuthWithOrg();
    if (!authUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newLeave = await db.insert(staffLeave).values({
            userId: body.userId,
            contractId: body.contractId,
            leaveType: body.leaveType,
            startDate: body.startDate,
            endDate: body.endDate,
            status: 'pending',
            reason: body.reason,
        }).returning();

        return NextResponse.json({ data: newLeave[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating staff leave:', error);
        return NextResponse.json({ error: 'Failed to create staff leave' }, { status: 500 });
    }
}




