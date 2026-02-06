import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { placementTests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/placements/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(placementTests)
            .where(eq(placementTests.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching placement:', error);
        return NextResponse.json({ error: 'Failed to fetch placement' }, { status: 500 });
    }
}

// PATCH /api/placements/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.sections !== undefined) updateData.sections = JSON.stringify(body.sections);
        if (body.maxScore !== undefined) updateData.maxScore = body.maxScore;
        if (body.levelThresholds !== undefined) updateData.levelThresholds = JSON.stringify(body.levelThresholds);
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

        const updated = await db
            .update(placementTests)
            .set(updateData)
            .where(eq(placementTests.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating placement:', error);
        return NextResponse.json({ error: 'Failed to update placement' }, { status: 500 });
    }
}

// DELETE /api/placements/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Soft delete
        const deleted = await db
            .update(placementTests)
            .set({ isActive: 0 })
            .where(eq(placementTests.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting placement:', error);
        return NextResponse.json({ error: 'Failed to delete placement' }, { status: 500 });
    }
}
