import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problemWorkshops } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/workshops - List workshop problems
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [eq(problemWorkshops.userId, userId)];

        if (status) {
            conditions.push(eq(problemWorkshops.status, status as 'draft' | 'in_progress' | 'complete'));
        }

        const result = await db
            .select()
            .from(problemWorkshops)
            .where(and(...conditions))
            .orderBy(desc(problemWorkshops.createdAt))
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching workshops:', error);
        return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 });
    }
}

// POST /api/workshops - Create workshop problem
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newWorkshop = await db.insert(problemWorkshops).values({
            userId,
            rawProblem: body.rawProblem || body.problemStatement || '',
            whyChain: body.whyChain ? JSON.stringify(body.whyChain) : '[]',
            rootCause: body.rootCause,
            signName: body.signName,
            signDescription: body.signDescription,
            stakeholders: body.stakeholders ? JSON.stringify(body.stakeholders) : '[]',
            requiredSkills: body.requiredSkills ? JSON.stringify(body.requiredSkills) : '[]',
            skillGaps: body.skillGaps ? JSON.stringify(body.skillGaps) : '[]',
            solutionShape: body.solutionShape,
            aiAgentPotential: body.aiAgentPotential,
            agentSketch: body.agentSketch,
            status: body.status || 'draft',
            currentStep: body.currentStep || 1,
        }).returning();

        return NextResponse.json({ data: newWorkshop[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating workshop:', error);
        return NextResponse.json({ error: 'Failed to create workshop' }, { status: 500 });
    }
}

