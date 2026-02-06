import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { peerReviews } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/reviews/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(peerReviews)
            .where(eq(peerReviews.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching review:', error);
        return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
    }
}

// PATCH /api/reviews/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.heldCharacter !== undefined) updateData.heldCharacter = body.heldCharacter;
        if (body.creativity !== undefined) updateData.creativity = body.creativity;
        if (body.techniqueUsage !== undefined) updateData.techniqueUsage = body.techniqueUsage;
        if (body.overall !== undefined) updateData.overall = body.overall;
        if (body.feedback !== undefined) updateData.feedback = body.feedback;
        if (body.qualityScore !== undefined) updateData.qualityScore = body.qualityScore;

        const updated = await db
            .update(peerReviews)
            .set(updateData)
            .where(and(eq(peerReviews.id, id), eq(peerReviews.reviewerId, userId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating review:', error);
        return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }
}

// DELETE /api/reviews/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(peerReviews)
            .where(and(eq(peerReviews.id, id), eq(peerReviews.reviewerId, userId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting review:', error);
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }
}
