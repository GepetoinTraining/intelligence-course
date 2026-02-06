import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { familyLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/family-links/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(familyLinks)
            .where(eq(familyLinks.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching family link:', error);
        return NextResponse.json({ error: 'Failed to fetch family link' }, { status: 500 });
    }
}

// PATCH /api/family-links/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.relationship !== undefined) updateData.relationship = body.relationship;
        if (body.canViewProgress !== undefined) updateData.canViewProgress = body.canViewProgress ? 1 : 0;
        if (body.canViewGrades !== undefined) updateData.canViewGrades = body.canViewGrades ? 1 : 0;
        if (body.canPayInvoices !== undefined) updateData.canPayInvoices = body.canPayInvoices ? 1 : 0;
        if (body.canCommunicate !== undefined) updateData.canCommunicate = body.canCommunicate ? 1 : 0;
        if (body.isPrimaryContact !== undefined) updateData.isPrimaryContact = body.isPrimaryContact ? 1 : 0;

        const updated = await db
            .update(familyLinks)
            .set(updateData)
            .where(eq(familyLinks.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating family link:', error);
        return NextResponse.json({ error: 'Failed to update family link' }, { status: 500 });
    }
}

// DELETE /api/family-links/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(familyLinks)
            .where(eq(familyLinks.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting family link:', error);
        return NextResponse.json({ error: 'Failed to delete family link' }, { status: 500 });
    }
}
