import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrollments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/enrollments/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(enrollments)
            .where(eq(enrollments.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching enrollment:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollment' }, { status: 500 });
    }
}

// PATCH /api/enrollments/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.status !== undefined) updateData.status = body.status;
        if (body.classId !== undefined) updateData.classId = body.classId;
        if (body.startsAt !== undefined) updateData.startsAt = body.startsAt;
        if (body.endsAt !== undefined) updateData.endsAt = body.endsAt;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const updated = await db
            .update(enrollments)
            .set(updateData)
            .where(eq(enrollments.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating enrollment:', error);
        return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
    }
}

// DELETE /api/enrollments/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(enrollments)
            .where(eq(enrollments.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 });
    }
}
