import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { placementTests, placementResults } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/placements - List placement tests (templates)
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const result = await db
            .select()
            .from(placementTests)
            .where(orgId ? eq(placementTests.organizationId, orgId) : undefined)
            .orderBy(desc(placementTests.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching placements:', error);
        return NextResponse.json({ error: 'Failed to fetch placements' }, { status: 500 });
    }
}

// POST /api/placements - Create placement test template
export async function POST(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized - organization required' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newPlacement = await db.insert(placementTests).values({
            organizationId: orgId,
            courseTypeId: body.courseTypeId,
            name: body.name,
            description: body.description,
            sections: JSON.stringify(body.sections || []),
            maxScore: body.maxScore || 100,
            levelThresholds: JSON.stringify(body.levelThresholds || {}),
        }).returning();

        return NextResponse.json({ data: newPlacement[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating placement:', error);
        return NextResponse.json({ error: 'Failed to create placement' }, { status: 500 });
    }
}

