import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/waitlist/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(waitlist)
            .where(eq(waitlist.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching waitlist entry:', error);
        return NextResponse.json({ error: 'Failed to fetch waitlist entry' }, { status: 500 });
    }
}

// PATCH /api/waitlist/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.status !== undefined) updateData.status = body.status;
        if (body.position !== undefined) updateData.position = body.position;
        if (body.notifiedAt !== undefined) updateData.notifiedAt = body.notifiedAt;
        if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt;

        const updated = await db
            .update(waitlist)
            .set(updateData)
            .where(eq(waitlist.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating waitlist entry:', error);
        return NextResponse.json({ error: 'Failed to update waitlist entry' }, { status: 500 });
    }
}

// DELETE /api/waitlist/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(waitlist)
            .where(eq(waitlist.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting waitlist entry:', error);
        return NextResponse.json({ error: 'Failed to delete waitlist entry' }, { status: 500 });
    }
}
