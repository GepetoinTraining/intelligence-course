import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { capstoneSubmissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/capstones/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(capstoneSubmissions)
            .where(eq(capstoneSubmissions.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Authorization check - must be owner or reviewer
        if (result[0].personId !== personId && result[0].gradedBy !== personId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching capstone:', error);
        return NextResponse.json({ error: 'Failed to fetch capstone' }, { status: 500 });
    }
}

// PATCH /api/capstones/[id]
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

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.status !== undefined) {
            // Map 'in_review' to 'under_review'
            updateData.status = body.status === 'in_review' ? 'under_review' : body.status;
        }
        if (body.submittedAt !== undefined) updateData.submittedAt = body.submittedAt;

        const updated = await db
            .update(capstoneSubmissions)
            .set(updateData)
            .where(and(eq(capstoneSubmissions.id, id), eq(capstoneSubmissions.personId, personId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating capstone:', error);
        return NextResponse.json({ error: 'Failed to update capstone' }, { status: 500 });
    }
}

// DELETE /api/capstones/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(capstoneSubmissions)
            .where(and(eq(capstoneSubmissions.id, id), eq(capstoneSubmissions.personId, personId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting capstone:', error);
        return NextResponse.json({ error: 'Failed to delete capstone' }, { status: 500 });
    }
}
