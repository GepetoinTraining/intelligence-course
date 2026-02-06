import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { techniqueUsage } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/techniques - List technique usage
export async function GET(request: NextRequest) {
    const { userId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const technique = searchParams.get('technique');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [eq(techniqueUsage.userId, userId)];

        if (technique) {
            conditions.push(eq(techniqueUsage.technique, technique as any));
        }

        const usages = await db
            .select()
            .from(techniqueUsage)
            .where(and(...conditions))
            .orderBy(desc(techniqueUsage.createdAt))
            .limit(limit);

        return NextResponse.json({ data: usages });
    } catch (error) {
        console.error('Error fetching techniques:', error);
        return NextResponse.json({ error: 'Failed to fetch techniques' }, { status: 500 });
    }
}

// POST /api/techniques - Record technique usage
export async function POST(request: NextRequest) {
    const { userId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { runId, technique, heldCharacter } = body;

        if (!runId || !technique) {
            return NextResponse.json({ error: 'runId and technique required' }, { status: 400 });
        }

        const newUsage = await db.insert(techniqueUsage).values({
            userId,
            runId,
            technique,
            heldCharacter: heldCharacter ? 1 : 0,
        }).returning();

        return NextResponse.json({ data: newUsage[0] }, { status: 201 });
    } catch (error) {
        console.error('Error recording technique:', error);
        return NextResponse.json({ error: 'Failed to record technique' }, { status: 500 });
    }
}

