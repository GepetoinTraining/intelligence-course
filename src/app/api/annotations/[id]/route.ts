import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAnnotations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/annotations/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(runAnnotations)
            .where(and(eq(runAnnotations.id, id), eq(runAnnotations.userId, userId)))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching annotation:', error);
        return NextResponse.json({ error: 'Failed to fetch annotation' }, { status: 500 });
    }
}

// PATCH /api/annotations/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.label !== undefined) updateData.label = body.label;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.annotationType !== undefined) updateData.annotationType = body.annotationType;

        const updated = await db
            .update(runAnnotations)
            .set(updateData)
            .where(and(eq(runAnnotations.id, id), eq(runAnnotations.userId, userId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating annotation:', error);
        return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 });
    }
}

// DELETE /api/annotations/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(runAnnotations)
            .where(and(eq(runAnnotations.id, id), eq(runAnnotations.userId, userId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting annotation:', error);
        return NextResponse.json({ error: 'Failed to delete annotation' }, { status: 500 });
    }
}
