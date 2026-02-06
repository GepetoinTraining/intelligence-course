import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { levels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/levels - List all levels
export async function GET(request: NextRequest) {
    try {
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const courseTypeId = searchParams.get('courseTypeId');

        // Get levels, optionally filtered by courseTypeId
        let allLevels;
        if (courseTypeId) {
            allLevels = await db.query.levels.findMany({
                where: eq(levels.courseTypeId, courseTypeId),
            });
        } else {
            allLevels = await db.query.levels.findMany();
        }

        // Sort by orderIndex
        allLevels.sort((a, b) => a.orderIndex - b.orderIndex);

        return NextResponse.json(allLevels);
    } catch (error) {
        console.error('Error fetching levels:', error);
        return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 });
    }
}

// POST /api/levels - Create a new level
export async function POST(request: NextRequest) {
    try {
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { courseTypeId, code, name, orderIndex, prerequisiteLevelId, estimatedHours } = body;

        if (!courseTypeId || !code || !name || orderIndex === undefined) {
            return NextResponse.json({
                error: 'Missing required fields: courseTypeId, code, name, orderIndex'
            }, { status: 400 });
        }

        const [newLevel] = await db.insert(levels).values({
            courseTypeId,
            code,
            name,
            orderIndex,
            prerequisiteLevelId: prerequisiteLevelId || null,
            estimatedHours: estimatedHours || null,
        }).returning();

        return NextResponse.json(newLevel, { status: 201 });
    } catch (error) {
        console.error('Error creating level:', error);
        return NextResponse.json({ error: 'Failed to create level' }, { status: 500 });
    }
}
