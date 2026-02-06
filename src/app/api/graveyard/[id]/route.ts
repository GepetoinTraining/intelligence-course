import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { graveyardEntries } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/graveyard/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(graveyardEntries)
            .where(and(eq(graveyardEntries.id, id), eq(graveyardEntries.userId, userId)))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching graveyard entry:', error);
        return NextResponse.json({ error: 'Failed to fetch graveyard entry' }, { status: 500 });
    }
}

// PATCH /api/graveyard/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.epitaph !== undefined) updateData.epitaph = body.epitaph;
        if (body.lessonLearned !== undefined) updateData.lessonLearned = body.lessonLearned;
        if (body.resurrected !== undefined) updateData.resurrected = body.resurrected ? 1 : 0;

        const updated = await db
            .update(graveyardEntries)
            .set(updateData)
            .where(and(eq(graveyardEntries.id, id), eq(graveyardEntries.userId, userId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating graveyard entry:', error);
        return NextResponse.json({ error: 'Failed to update graveyard entry' }, { status: 500 });
    }
}

// DELETE /api/graveyard/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(graveyardEntries)
            .where(and(eq(graveyardEntries.id, id), eq(graveyardEntries.userId, userId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting graveyard entry:', error);
        return NextResponse.json({ error: 'Failed to delete graveyard entry' }, { status: 500 });
    }
}
