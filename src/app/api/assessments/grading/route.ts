/**
 * Grading Configuration API
 * 
 * GET /api/assessments/grading — Get grading scales + assessment types for org
 * POST /api/assessments/grading — Create a grading scale or assessment type
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { gradingScales, assessmentTypes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [scales, types] = await Promise.all([
            db.select().from(gradingScales)
                .where(and(
                    eq(gradingScales.organizationId, orgId),
                    eq(gradingScales.isActive, true),
                ))
                .orderBy(desc(gradingScales.createdAt)),
            db.select().from(assessmentTypes)
                .where(and(
                    eq(assessmentTypes.organizationId, orgId),
                    eq(assessmentTypes.isActive, true),
                ))
                .orderBy(desc(assessmentTypes.createdAt)),
        ]);

        // Parse JSON fields
        const parsedScales = scales.map(s => ({
            ...s,
            gradeLevels: (() => { try { return JSON.parse(s.gradeLevels || '[]'); } catch { return []; } })(),
        }));

        return NextResponse.json({
            gradingScales: parsedScales,
            assessmentTypes: types,
        });
    } catch (error) {
        console.error('[grading GET]', error);
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
        const entity = body.entity; // 'grading_scale' or 'assessment_type'

        if (entity === 'grading_scale') {
            if (!body.name || !body.scaleType) {
                return NextResponse.json(
                    { error: 'name and scaleType are required for grading scales' },
                    { status: 400 },
                );
            }

            const [created] = await db.insert(gradingScales).values({
                organizationId: orgId,
                name: body.name,
                description: body.description || null,
                scaleType: body.scaleType,
                minValue: body.minValue ?? 0,
                maxValue: body.maxValue ?? 10,
                passingValue: body.passingValue ?? 6,
                gradeLevels: body.gradeLevels ? JSON.stringify(body.gradeLevels) : '[]',
                showNumericValue: body.showNumericValue ?? true,
                showLetterGrade: body.showLetterGrade ?? true,
                showPercentage: body.showPercentage ?? false,
                roundingMethod: body.roundingMethod || 'nearest',
                decimalPlaces: body.decimalPlaces ?? 1,
                isDefault: body.isDefault ?? false,
            }).returning();

            return NextResponse.json({ success: true, gradingScale: created }, { status: 201 });
        }

        if (entity === 'assessment_type') {
            if (!body.name || !body.category || !body.format) {
                return NextResponse.json(
                    { error: 'name, category, and format are required for assessment types' },
                    { status: 400 },
                );
            }

            const [created] = await db.insert(assessmentTypes).values({
                organizationId: orgId,
                name: body.name,
                code: body.code || null,
                description: body.description || null,
                icon: body.icon || null,
                category: body.category,
                format: body.format,
                defaultDurationMinutes: body.defaultDurationMinutes || null,
                defaultWeight: body.defaultWeight || null,
                allowsRetake: body.allowsRetake ?? false,
                maxRetakes: body.maxRetakes || null,
                defaultGradingScaleId: body.defaultGradingScaleId || null,
                usesRubric: body.usesRubric ?? false,
                showToStudents: body.showToStudents ?? true,
                showToParents: body.showToParents ?? true,
            }).returning();

            return NextResponse.json({ success: true, assessmentType: created }, { status: 201 });
        }

        return NextResponse.json(
            { error: 'entity must be "grading_scale" or "assessment_type"' },
            { status: 400 },
        );
    } catch (error) {
        console.error('[grading POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
