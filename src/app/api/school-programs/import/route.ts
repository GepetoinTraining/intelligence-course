import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schoolPrograms, programUnits } from '@/lib/db/schema';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/school-programs/import - Bulk import school programs (+ their units) from JSON
// Designed for AI pipeline: methodology export → AI generates programs → ingest here
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        const created = [];

        for (const item of items) {
            // Create the program
            const [program] = await db.insert(schoolPrograms).values({
                organizationId: orgId,
                name: item.name,
                code: item.code,
                description: item.description,
                shortDescription: item.shortDescription,
                methodologyId: item.methodologyId,
                classStructureId: item.classStructureId,
                homeworkPolicyId: item.homeworkPolicyId,
                gradingScaleId: item.gradingScaleId,
                targetProficiencyId: item.targetProficiencyId,
                prerequisiteProficiencyId: item.prerequisiteProficiencyId,
                durationWeeks: item.durationWeeks,
                classesPerWeek: item.classesPerWeek,
                hoursPerClass: item.hoursPerClass,
                totalHours: item.totalHours,
                targetAgeMin: item.targetAgeMin,
                targetAgeMax: item.targetAgeMax,
                targetAudienceType: item.targetAudienceType || 'all',
                modality: item.modality || 'in_person',
                basePriceCents: item.basePriceCents,
                materialsCostCents: item.materialsCostCents,
                status: item.status || 'draft',
                isPublic: item.isPublic !== false,
                showOnWebsite: item.showOnWebsite !== false,
            }).returning();

            // If the item includes units, create them too
            const createdUnits = [];
            if (item.units && Array.isArray(item.units)) {
                for (let i = 0; i < item.units.length; i++) {
                    const unit = item.units[i];
                    const [createdUnit] = await db.insert(programUnits).values({
                        programId: program.id,
                        name: unit.name,
                        description: unit.description,
                        objectives: JSON.stringify(unit.objectives || []),
                        position: unit.position ?? i,
                        estimatedHours: unit.estimatedHours,
                        estimatedClasses: unit.estimatedClasses,
                    }).returning();
                    createdUnits.push(createdUnit);
                }
            }

            created.push({ ...program, units: createdUnits });
        }

        return NextResponse.json({
            data: created,
            summary: {
                programsCreated: created.length,
                unitsCreated: created.reduce((sum, p) => sum + (p.units?.length || 0), 0),
            },
        }, { status: 201 });
    } catch (error) {
        console.error('[school-programs/import POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
