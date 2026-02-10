import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schoolPrograms } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/school-programs - List school programs
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const conditions = [];
        if (orgId) {
            conditions.push(eq(schoolPrograms.organizationId, orgId));
        }

        const result = await db
            .select()
            .from(schoolPrograms)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(schoolPrograms.createdAt));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('[school-programs GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/school-programs - Create a new school program
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const [program] = await db.insert(schoolPrograms).values({
            organizationId: orgId,
            name: body.name,
            code: body.code,
            description: body.description,
            shortDescription: body.shortDescription,
            methodologyId: body.methodologyId,
            classStructureId: body.classStructureId,
            homeworkPolicyId: body.homeworkPolicyId,
            gradingScaleId: body.gradingScaleId,
            targetProficiencyId: body.targetProficiencyId,
            prerequisiteProficiencyId: body.prerequisiteProficiencyId,
            durationWeeks: body.durationWeeks,
            classesPerWeek: body.classesPerWeek,
            hoursPerClass: body.hoursPerClass,
            totalHours: body.totalHours,
            targetAgeMin: body.targetAgeMin,
            targetAgeMax: body.targetAgeMax,
            targetAudienceType: body.targetAudienceType || 'all',
            modality: body.modality || 'in_person',
            basePriceCents: body.basePriceCents,
            materialsCostCents: body.materialsCostCents,
            status: body.status || 'draft',
            isPublic: body.isPublic !== false,
            showOnWebsite: body.showOnWebsite !== false,
        }).returning();

        return NextResponse.json({ data: program }, { status: 201 });
    } catch (error) {
        console.error('[school-programs POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
