import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { techniqueUsage } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/techniques/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(techniqueUsage)
            .where(and(eq(techniqueUsage.id, id), eq(techniqueUsage.userId, userId)))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching technique:', error);
        return NextResponse.json({ error: 'Failed to fetch technique' }, { status: 500 });
    }
}

// PATCH /api/techniques/[id] - Update effectiveness or notes
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.effectiveness !== undefined) updateData.effectiveness = body.effectiveness;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.context !== undefined) updateData.context = body.context;

        const updated = await db
            .update(techniqueUsage)
            .set(updateData)
            .where(and(eq(techniqueUsage.id, id), eq(techniqueUsage.userId, userId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating technique:', error);
        return NextResponse.json({ error: 'Failed to update technique' }, { status: 500 });
    }
}

// DELETE /api/techniques/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(techniqueUsage)
            .where(and(eq(techniqueUsage.id, id), eq(techniqueUsage.userId, userId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting technique:', error);
        return NextResponse.json({ error: 'Failed to delete technique' }, { status: 500 });
    }
}
