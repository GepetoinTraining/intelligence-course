import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problemWorkshops } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/workshops/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(problemWorkshops)
            .where(and(eq(problemWorkshops.id, id), eq(problemWorkshops.personId, personId)))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching workshop:', error);
        return NextResponse.json({ error: 'Failed to fetch workshop' }, { status: 500 });
    }
}

// PATCH /api/workshops/[id] - Update workshop progress
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.rawProblem !== undefined) updateData.rawProblem = body.rawProblem;
        if (body.whyChain !== undefined) updateData.whyChain = JSON.stringify(body.whyChain);
        if (body.rootCause !== undefined) updateData.rootCause = body.rootCause;
        if (body.signName !== undefined) updateData.signName = body.signName;
        if (body.signDescription !== undefined) updateData.signDescription = body.signDescription;
        if (body.stakeholders !== undefined) updateData.stakeholders = JSON.stringify(body.stakeholders);
        if (body.requiredSkills !== undefined) updateData.requiredSkills = JSON.stringify(body.requiredSkills);
        if (body.skillGaps !== undefined) updateData.skillGaps = JSON.stringify(body.skillGaps);
        if (body.solutionShape !== undefined) updateData.solutionShape = body.solutionShape;
        if (body.aiAgentPotential !== undefined) updateData.aiAgentPotential = body.aiAgentPotential;
        if (body.agentSketch !== undefined) updateData.agentSketch = body.agentSketch;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.currentStep !== undefined) updateData.currentStep = body.currentStep;
        if (body.selectedForCapstone !== undefined) updateData.selectedForCapstone = body.selectedForCapstone ? 1 : 0;

        const updated = await db
            .update(problemWorkshops)
            .set(updateData)
            .where(and(eq(problemWorkshops.id, id), eq(problemWorkshops.personId, personId)))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating workshop:', error);
        return NextResponse.json({ error: 'Failed to update workshop' }, { status: 500 });
    }
}

// DELETE /api/workshops/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .delete(problemWorkshops)
            .where(and(eq(problemWorkshops.id, id), eq(problemWorkshops.personId, personId)))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting workshop:', error);
        return NextResponse.json({ error: 'Failed to delete workshop' }, { status: 500 });
    }
}
