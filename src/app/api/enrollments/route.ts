import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrollments, classes, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/enrollments - List enrollments
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('personId');
    const status = searchParams.get('status');
    const termId = searchParams.get('termId');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(enrollments.organizationId, orgId));
        }

        if (classId) {
            conditions.push(eq(enrollments.classId, classId));
        }

        if (studentId) {
            conditions.push(eq(enrollments.personId, studentId));
        }

        if (status) {
            conditions.push(eq(enrollments.status, status as any));
        }

        if (termId) {
            conditions.push(eq(enrollments.termId, termId));
        }

        const result = await db
            .select({
                enrollment: enrollments,
                student: users,
                class: classes,
            })
            .from(enrollments)
            .innerJoin(users, eq(enrollments.personId, users.id))
            .innerJoin(classes, eq(enrollments.classId, classes.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(enrollments.enrolledAt));

        const formatted = result.map(r => ({
            ...r.enrollment,
            student: r.student,
            class: r.class,
        }));

        return NextResponse.json({ data: formatted });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }
}

// POST /api/enrollments - Create enrollment
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Check class capacity
        const classData = await db
            .select()
            .from(classes)
            .where(eq(classes.id, body.classId))
            .limit(1);

        if (classData.length === 0) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        if ((classData[0].currentStudents || 0) >= (classData[0].maxStudents || 15)) {
            return NextResponse.json({ error: 'Class is full' }, { status: 400 });
        }

        const newEnrollment = await db.insert(enrollments).values({
            organizationId: orgId,
            personId: body.personId,
            classId: body.classId,
            termId: body.termId || classData[0].termId,
            leadId: body.leadId,
            trialId: body.trialId,
            status: body.status || 'active',
            enrolledAt: Math.floor(Date.now() / 1000),
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            notes: body.notes,
        }).returning();

        // Update class student count
        await db
            .update(classes)
            .set({
                currentStudents: (classData[0].currentStudents || 0) + 1,
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(classes.id, body.classId));

        return NextResponse.json({ data: newEnrollment[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating enrollment:', error);
        return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }
}



