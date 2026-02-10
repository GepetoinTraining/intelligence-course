import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teachingMethodologies } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/methodologies - List teaching methodologies
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const conditions = [];
        if (orgId) {
            conditions.push(eq(teachingMethodologies.organizationId, orgId));
        }

        const result = await db
            .select()
            .from(teachingMethodologies)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(teachingMethodologies.createdAt));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('[methodologies GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/methodologies - Create a new teaching methodology
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const [methodology] = await db.insert(teachingMethodologies).values({
            organizationId: orgId,
            name: body.name,
            code: body.code,
            description: body.description,
            coreApproach: body.coreApproach || 'custom',
            philosophyStatement: body.philosophyStatement,
            learningObjectives: JSON.stringify(body.learningObjectives || []),
            principles: JSON.stringify(body.principles || []),
            targetAgeGroups: JSON.stringify(body.targetAgeGroups || []),
            targetProficiencyLevels: JSON.stringify(body.targetProficiencyLevels || []),
            isDefault: body.isDefault || false,
            isActive: body.isActive !== false,
        }).returning();

        return NextResponse.json({ data: methodology }, { status: 201 });
    } catch (error) {
        console.error('[methodologies POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
