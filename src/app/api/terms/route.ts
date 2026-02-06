import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { terms } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/terms - List terms
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];
        if (orgId) conditions.push(eq(terms.organizationId, orgId));
        if (status) {
            const validStatus = status === 'archived' ? 'completed' : status;
            conditions.push(eq(terms.status, validStatus as any));
        }

        const result = await db
            .select()
            .from(terms)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(terms.classesStart))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching terms:', error);
        return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
    }
}

// POST /api/terms - Create term
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized - organization required' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, enrollmentOpens, enrollmentCloses, classesStart, classesEnd, status } = body;

        if (!name) {
            return NextResponse.json({ error: 'name required' }, { status: 400 });
        }

        const newTerm = await db.insert(terms).values({
            organizationId: orgId,
            name,
            enrollmentOpens,
            enrollmentCloses,
            classesStart,
            classesEnd,
            status: status || 'planning',
        }).returning();

        return NextResponse.json({ data: newTerm[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating term:', error);
        return NextResponse.json({ error: 'Failed to create term' }, { status: 500 });
    }
}



