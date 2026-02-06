import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, enrollments, classes, courses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ studentId: string }>;
}

// GET /api/domains/institutional/[studentId] - Get institutional data
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    try {
        // Get user data
        const student = await db
            .select()
            .from(users)
            .where(eq(users.id, studentId))
            .limit(1);

        if (student.length === 0) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get enrollments
        const studentEnrollments = await db
            .select()
            .from(enrollments)
            .where(eq(enrollments.personId, studentId));

        return NextResponse.json({
            data: {
                studentId,
                name: student[0].name,
                email: student[0].email,
                role: student[0].role,
                organizationId: student[0].organizationId,
                enrollmentCount: studentEnrollments.length,
                enrollments: studentEnrollments.map(e => ({
                    id: e.id,
                    classId: e.classId,
                    status: e.status,
                    enrolledAt: e.enrolledAt,
                })),
            }
        });
    } catch (error) {
        console.error('Error fetching institutional data:', error);
        return NextResponse.json({ error: 'Failed to fetch institutional data' }, { status: 500 });
    }
}
