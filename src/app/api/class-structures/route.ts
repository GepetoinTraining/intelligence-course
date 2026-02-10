import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classStructures } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/class-structures - List class structures
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const conditions = [];
        if (orgId) {
            conditions.push(eq(classStructures.organizationId, orgId));
        }

        const result = await db
            .select()
            .from(classStructures)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(desc(classStructures.createdAt));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('[class-structures GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/class-structures - Create a new class structure
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const [structure] = await db.insert(classStructures).values({
            organizationId: orgId,
            methodologyId: body.methodologyId,
            name: body.name,
            description: body.description,
            durationMinutes: body.durationMinutes || 50,
            phases: JSON.stringify(body.phases || [
                { name: 'Warm-up', durationMinutes: 5, description: 'Engage students' },
                { name: 'Presentation', durationMinutes: 15, description: 'Introduce new content' },
                { name: 'Practice', durationMinutes: 20, description: 'Guided practice' },
                { name: 'Production', durationMinutes: 8, description: 'Free practice' },
                { name: 'Wrap-up', durationMinutes: 2, description: 'Review and preview' },
            ]),
            teacherTalkTimePercent: body.teacherTalkTimePercent ?? 30,
            studentTalkTimePercent: body.studentTalkTimePercent ?? 70,
            defaultGroupingType: body.defaultGroupingType || 'mixed',
            maxStudentsRecommended: body.maxStudentsRecommended,
            minStudentsRecommended: body.minStudentsRecommended,
            requiresMaterials: body.requiresMaterials !== false,
            typicalMaterials: JSON.stringify(body.typicalMaterials || []),
            isDefault: body.isDefault || false,
            isActive: body.isActive !== false,
        }).returning();

        return NextResponse.json({ data: structure }, { status: 201 });
    } catch (error) {
        console.error('[class-structures POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
