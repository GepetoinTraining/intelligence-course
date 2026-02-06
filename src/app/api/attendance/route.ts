import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { attendance, classSessions, users, classes } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/attendance - List attendance records
export async function GET(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('userId');
    const classId = searchParams.get('classId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    try {
        if (sessionId) {
            // Get attendance for specific session
            const result = await db
                .select({
                    attendance: attendance,
                    student: users,
                })
                .from(attendance)
                .innerJoin(users, eq(attendance.userId, users.id))
                .where(eq(attendance.sessionId, sessionId));

            return NextResponse.json({
                data: result.map(r => ({
                    ...r.attendance,
                    student: r.student,
                }))
            });
        }

        if (studentId) {
            // Get attendance history for student
            const result = await db
                .select({
                    attendance: attendance,
                    session: classSessions,
                })
                .from(attendance)
                .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
                .where(eq(attendance.userId, studentId))
                .orderBy(desc(classSessions.sessionDate));

            return NextResponse.json({
                data: result.map(r => ({
                    ...r.attendance,
                    session: r.session,
                }))
            });
        }

        return NextResponse.json({ error: 'sessionId or userId required' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}

// POST /api/attendance - Record attendance (bulk)
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { sessionId, records } = body;

        if (!sessionId || !records || !Array.isArray(records)) {
            return NextResponse.json({
                error: 'sessionId and records array required'
            }, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);

        // Insert or update attendance records
        const results = [];
        for (const record of records) {
            // Try to find existing record
            const existing = await db
                .select()
                .from(attendance)
                .where(and(
                    eq(attendance.sessionId, sessionId),
                    eq(attendance.userId, record.userId)
                ))
                .limit(1);

            if (existing.length > 0) {
                // Update
                const updated = await db
                    .update(attendance)
                    .set({
                        status: record.status,
                        arrivedAt: record.arrivedAt,
                        notes: record.notes,
                        excuseReason: record.excuseReason,
                        markedBy: userId,
                        markedAt: now,
                    })
                    .where(eq(attendance.id, existing[0].id))
                    .returning();
                results.push(updated[0]);
            } else {
                // Insert
                const inserted = await db
                    .insert(attendance)
                    .values({
                        sessionId,
                        userId: record.userId,
                        status: record.status,
                        arrivedAt: record.arrivedAt,
                        notes: record.notes,
                        excuseReason: record.excuseReason,
                        markedBy: userId,
                        markedAt: now,
                    })
                    .returning();
                results.push(inserted[0]);
            }
        }

        return NextResponse.json({ data: results }, { status: 201 });
    } catch (error) {
        console.error('Error recording attendance:', error);
        return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
    }
}

