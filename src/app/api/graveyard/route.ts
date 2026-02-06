import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { graveyardEntries } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/graveyard - List graveyard entries
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const entries = await db
            .select()
            .from(graveyardEntries)
            .where(eq(graveyardEntries.personId, personId))
            .orderBy(desc(graveyardEntries.createdAt))
            .limit(limit);

        return NextResponse.json({ data: entries });
    } catch (error) {
        console.error('Error fetching graveyard:', error);
        return NextResponse.json({ error: 'Failed to fetch graveyard' }, { status: 500 });
    }
}

// POST /api/graveyard - Create graveyard entry
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { runId, characterName, causeOfDeath, epitaph, moduleId, technique } = body;

        if (!runId || !characterName) {
            return NextResponse.json({ error: 'runId and characterName required' }, { status: 400 });
        }

        const newEntry = await db.insert(graveyardEntries).values({
            personId,
            runId,
            characterName,
            causeOfDeath,
            epitaph,
            moduleId,
            technique,
        }).returning();

        return NextResponse.json({ data: newEntry[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating graveyard entry:', error);
        return NextResponse.json({ error: 'Failed to create graveyard entry' }, { status: 500 });
    }
}



