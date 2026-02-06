import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { terms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/terms/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(terms)
            .where(eq(terms.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching term:', error);
        return NextResponse.json({ error: 'Failed to fetch term' }, { status: 500 });
    }
}

// PATCH /api/terms/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.startsAt !== undefined) updateData.startsAt = body.startsAt;
        if (body.endsAt !== undefined) updateData.endsAt = body.endsAt;
        if (body.status !== undefined) {
            // Valid statuses: planning, enrollment, active, completed
            // Map 'archived' to 'completed' as archived is not valid
            updateData.status = body.status === 'archived' ? 'completed' : body.status;
        }
        if (body.isCurrent !== undefined) updateData.isCurrent = body.isCurrent ? 1 : 0;

        const updated = await db
            .update(terms)
            .set(updateData)
            .where(eq(terms.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating term:', error);
        return NextResponse.json({ error: 'Failed to update term' }, { status: 500 });
    }
}

// DELETE /api/terms/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(terms)
            .where(eq(terms.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting term:', error);
        return NextResponse.json({ error: 'Failed to delete term' }, { status: 500 });
    }
}
