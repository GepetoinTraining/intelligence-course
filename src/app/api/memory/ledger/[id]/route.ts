import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memoryLedger } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/memory/ledger/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(memoryLedger)
            .where(eq(memoryLedger.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching ledger entry:', error);
        return NextResponse.json({ error: 'Failed to fetch ledger entry' }, { status: 500 });
    }
}

// PATCH /api/memory/ledger/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.content !== undefined) updateData.content = body.content;
        if (body.summary !== undefined) updateData.summary = body.summary;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.importance !== undefined) updateData.importance = body.importance;
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;
        if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt;

        const updated = await db
            .update(memoryLedger)
            .set(updateData)
            .where(eq(memoryLedger.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating ledger entry:', error);
        return NextResponse.json({ error: 'Failed to update ledger entry' }, { status: 500 });
    }
}

// DELETE /api/memory/ledger/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Soft delete by deactivating
        const deleted = await db
            .update(memoryLedger)
            .set({ isActive: 0 })
            .where(eq(memoryLedger.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting ledger entry:', error);
        return NextResponse.json({ error: 'Failed to delete ledger entry' }, { status: 500 });
    }
}
