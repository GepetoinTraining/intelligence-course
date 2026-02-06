import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { peerReviews } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/reviews - List peer reviews
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const submissionId = searchParams.get('submissionId');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (submissionId) conditions.push(eq(peerReviews.submissionId, submissionId));

        const reviews = await db
            .select()
            .from(peerReviews)
            .where(eq(peerReviews.reviewerId, userId))
            .orderBy(desc(peerReviews.createdAt))
            .limit(limit);

        return NextResponse.json({ data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

// POST /api/reviews - Create peer review
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { submissionId, heldCharacter, creativity, techniqueUsage, overall, feedback } = body;

        if (!submissionId) {
            return NextResponse.json({ error: 'submissionId required' }, { status: 400 });
        }

        const newReview = await db.insert(peerReviews).values({
            submissionId,
            reviewerId: userId,
            heldCharacter,
            creativity,
            techniqueUsage,
            overall,
            feedback,
        }).returning();

        return NextResponse.json({ data: newReview[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating review:', error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}



