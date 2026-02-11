/**
 * Assessments API
 * 
 * GET /api/assessments — List assessments for org (optional ?classGroupId= filter)
 * POST /api/assessments — Create a new assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    studentAssessments,
    assessmentTypes,
    studentGrades,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const classGroupId = request.nextUrl.searchParams.get('classGroupId');
        const statusFilter = request.nextUrl.searchParams.get('status');

        // Build conditions — scope through assessmentTypes.organizationId
        const conditions: any[] = [eq(assessmentTypes.organizationId, orgId)];
        if (classGroupId) conditions.push(eq(studentAssessments.classGroupId, classGroupId));
        if (statusFilter) conditions.push(eq(studentAssessments.status, statusFilter as any));

        // Fetch assessments with type info
        const assessments = await db
            .select({
                id: studentAssessments.id,
                name: studentAssessments.name,
                description: studentAssessments.description,
                classGroupId: studentAssessments.classGroupId,
                assessmentTypeId: studentAssessments.assessmentTypeId,
                scheduledDate: studentAssessments.scheduledDate,
                dueDate: studentAssessments.dueDate,
                durationMinutes: studentAssessments.durationMinutes,
                maxPoints: studentAssessments.maxPoints,
                weight: studentAssessments.weight,
                status: studentAssessments.status,
                allowsRetake: studentAssessments.allowsRetake,
                maxRetakes: studentAssessments.maxRetakes,
                showGradeToStudent: studentAssessments.showGradeToStudent,
                rubricId: studentAssessments.rubricId,
                gradingScaleId: studentAssessments.gradingScaleId,
                createdBy: studentAssessments.createdBy,
                createdAt: studentAssessments.createdAt,
                // Joined fields
                assessmentTypeName: assessmentTypes.name,
                assessmentTypeCategory: assessmentTypes.category,
                assessmentTypeFormat: assessmentTypes.format,
            })
            .from(studentAssessments)
            .leftJoin(assessmentTypes, eq(studentAssessments.assessmentTypeId, assessmentTypes.id))
            .where(and(...conditions))
            .orderBy(desc(studentAssessments.createdAt))
            .limit(100);

        // Get grade counts per assessment
        const enriched = await Promise.all(
            assessments.map(async (a) => {
                const grades = await db
                    .select({ id: studentGrades.id, status: studentGrades.status })
                    .from(studentGrades)
                    .where(eq(studentGrades.assessmentId, a.id));

                const totalGrades = grades.length;
                const gradedCount = grades.filter(g => g.status === 'graded').length;
                const submittedCount = grades.filter(g =>
                    g.status === 'submitted' || g.status === 'grading' || g.status === 'graded',
                ).length;

                return { ...a, totalGrades, gradedCount, submittedCount };
            }),
        );

        return NextResponse.json({ assessments: enriched });
    } catch (error) {
        console.error('[assessments GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.classGroupId || !body.assessmentTypeId || !body.name) {
            return NextResponse.json(
                { error: 'classGroupId, assessmentTypeId, and name are required' },
                { status: 400 },
            );
        }

        // Verify assessment type belongs to org
        const aType = await db.query.assessmentTypes.findFirst({
            where: and(
                eq(assessmentTypes.id, body.assessmentTypeId),
                eq(assessmentTypes.organizationId, orgId),
            ),
        });

        if (!aType) {
            return NextResponse.json({ error: 'Assessment type not found' }, { status: 404 });
        }

        const [created] = await db.insert(studentAssessments).values({
            classGroupId: body.classGroupId,
            assessmentTypeId: body.assessmentTypeId,
            name: body.name,
            description: body.description || null,
            programUnitId: body.programUnitId || null,
            scheduledDate: body.scheduledDate || null,
            dueDate: body.dueDate || null,
            durationMinutes: body.durationMinutes || null,
            gradingScaleId: body.gradingScaleId || aType.defaultGradingScaleId || null,
            rubricId: body.rubricId || null,
            maxPoints: body.maxPoints || null,
            weight: body.weight || aType.defaultWeight || null,
            status: body.status || 'draft',
            allowsRetake: body.allowsRetake ?? aType.allowsRetake ?? false,
            maxRetakes: body.maxRetakes ?? aType.maxRetakes ?? 0,
            showGradeToStudent: body.showGradeToStudent ?? true,
            createdBy: personId,
        }).returning();

        return NextResponse.json({ success: true, assessment: created }, { status: 201 });
    } catch (error) {
        console.error('[assessments POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
