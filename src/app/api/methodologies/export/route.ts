import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teachingMethodologies, classStructures, homeworkPolicies, gradingScales } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/methodologies/export - Export full methodology config as JSON schema
// This output is designed for AI consumption — Synapse can ingest this to auto-generate courses
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all methodology components for this org
        const [methods, structures, policies, scales] = await Promise.all([
            db.select().from(teachingMethodologies).where(eq(teachingMethodologies.organizationId, orgId)),
            db.select().from(classStructures).where(eq(classStructures.organizationId, orgId)),
            db.select().from(homeworkPolicies).where(eq(homeworkPolicies.organizationId, orgId)),
            db.select().from(gradingScales).where(eq(gradingScales.organizationId, orgId)),
        ]);

        // Parse JSON fields for clean output
        const parsedMethods = methods.map(m => ({
            ...m,
            learningObjectives: JSON.parse(m.learningObjectives || '[]'),
            principles: JSON.parse(m.principles || '[]'),
            targetAgeGroups: JSON.parse(m.targetAgeGroups || '[]'),
            targetProficiencyLevels: JSON.parse(m.targetProficiencyLevels || '[]'),
        }));

        const parsedStructures = structures.map(s => ({
            ...s,
            phases: JSON.parse(s.phases || '[]'),
            typicalMaterials: JSON.parse(s.typicalMaterials || '[]'),
        }));

        // Build the schema document
        const schema = {
            _meta: {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                organizationId: orgId,
                purpose: 'AI-consumable methodology schema for automated course generation',
            },
            methodologies: parsedMethods,
            classStructures: parsedStructures,
            homeworkPolicies: policies,
            gradingScales: scales,
            // Summary for AI context
            summary: {
                totalMethodologies: methods.length,
                totalStructures: structures.length,
                totalPolicies: policies.length,
                totalScales: scales.length,
                defaultMethodology: parsedMethods.find(m => m.isDefault)?.name || null,
                defaultStructure: parsedStructures.find(s => s.isDefault)?.name || null,
                availableApproaches: parsedMethods.map(m => m.coreApproach),
                availablePhasePatterns: parsedStructures.map(s => ({
                    name: s.name,
                    phases: JSON.parse(s.phases || '[]').map((p: any) => p.name),
                    durationMinutes: s.durationMinutes,
                })),
            },
        };

        return NextResponse.json(schema);
    } catch (error) {
        console.error('[methodologies/export GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
