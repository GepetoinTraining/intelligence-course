import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { capstoneSubmissions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/capstones - List capstone submissions
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        let query = db
            .select()
            .from(capstoneSubmissions)
            .where(eq(capstoneSubmissions.personId, personId));

        if (status) {
            // The schema uses 'under_review' not 'in_review'
            const validStatus = status === 'in_review' ? 'under_review' : status;
            // @ts-ignore - Type is validated at runtime
            query = query.where(eq(capstoneSubmissions.status, validStatus as any));
        }

        const submissions = await query
            .orderBy(desc(capstoneSubmissions.createdAt))
            .limit(limit);

        return NextResponse.json({ data: submissions });
    } catch (error) {
        console.error('Error fetching capstones:', error);
        return NextResponse.json({ error: 'Failed to fetch capstones' }, { status: 500 });
    }
}

// POST /api/capstones - Create capstone submission
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, moduleId, description } = body;

        if (!title || !moduleId) {
            return NextResponse.json({ error: 'title and moduleId required' }, { status: 400 });
        }

        const newSubmission = await db.insert(capstoneSubmissions).values({
            userId,
            title,
            moduleId,
            description,
            status: 'draft',
        }).returning();

        return NextResponse.json({ data: newSubmission[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating capstone:', error);
        return NextResponse.json({ error: 'Failed to create capstone' }, { status: 500 });
    }
}



