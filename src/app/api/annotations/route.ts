import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAnnotations } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/annotations - List annotations
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('runId');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [eq(runAnnotations.personId, personId)];
        if (runId) conditions.push(eq(runAnnotations.runId, runId));

        const result = await db
            .select()
            .from(runAnnotations)
            .where(and(...conditions))
            .orderBy(desc(runAnnotations.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching annotations:', error);
        return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
    }
}

// POST /api/annotations - Create annotation
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { runId, annotation, annotationType, knowledgeNodeId } = body;

        if (!runId || !annotation) {
            return NextResponse.json({ error: 'runId and annotation required' }, { status: 400 });
        }

        const newAnnotation = await db.insert(runAnnotations).values({
            personId,
            runId,
            annotation,
            annotationType,
            knowledgeNodeId,
        }).returning();

        return NextResponse.json({ data: newAnnotation[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating annotation:', error);
        return NextResponse.json({ error: 'Failed to create annotation' }, { status: 500 });
    }
}



