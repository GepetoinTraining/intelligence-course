import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { programUnits } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/program-units - List program units (optionally filtered by programId)
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const programId = searchParams.get('programId');

        const conditions = [];
        if (programId) {
            conditions.push(eq(programUnits.programId, programId));
        }

        const result = await db
            .select()
            .from(programUnits)
            .where(conditions.length > 0 ? conditions[0] : undefined)
            .orderBy(asc(programUnits.position));

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('[program-units GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/program-units - Create a new program unit
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const [unit] = await db.insert(programUnits).values({
            programId: body.programId,
            name: body.name,
            description: body.description,
            objectives: JSON.stringify(body.objectives || []),
            position: body.position || 0,
            estimatedHours: body.estimatedHours,
            estimatedClasses: body.estimatedClasses,
        }).returning();

        return NextResponse.json({ data: unit }, { status: 201 });
    } catch (error) {
        console.error('[program-units POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
