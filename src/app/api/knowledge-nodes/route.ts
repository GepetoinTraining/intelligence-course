import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeNodes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/knowledge-nodes - List knowledge nodes
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const nodeType = searchParams.get('nodeType');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [eq(knowledgeNodes.personId, personId)];

        if (nodeType) {
            conditions.push(eq(knowledgeNodes.nodeType, nodeType as any));
        }

        const nodes = await db
            .select()
            .from(knowledgeNodes)
            .where(and(...conditions))
            .orderBy(desc(knowledgeNodes.createdAt))
            .limit(limit);

        return NextResponse.json({ data: nodes });
    } catch (error) {
        console.error('Error fetching knowledge nodes:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge nodes' }, { status: 500 });
    }
}

// POST /api/knowledge-nodes - Create knowledge node
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, content, nodeType, sourceLessonId, depth, moduleId, technique } = body;

        if (!title) {
            return NextResponse.json({ error: 'title required' }, { status: 400 });
        }

        const newNode = await db.insert(knowledgeNodes).values({
            personId,
            title,
            content,
            nodeType: nodeType || 'concept',
            sourceLessonId,
            depth,
            moduleId,
            technique,
        }).returning();

        return NextResponse.json({ data: newNode[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating knowledge node:', error);
        return NextResponse.json({ error: 'Failed to create knowledge node' }, { status: 500 });
    }
}



