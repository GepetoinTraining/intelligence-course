import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, leadInteractions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/leads/[id]/interact - Add interaction to lead
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // Create interaction
        const interaction = await db.insert(leadInteractions).values({
            leadId: id,
            interactionType: body.interactionType,
            direction: body.direction,
            subject: body.subject,
            content: body.content,
            outcome: body.outcome,
            createdBy: personId,
        }).returning();

        // Update lead's lastContactAt
        await db
            .update(leads)
            .set({
                lastContactAt: Math.floor(Date.now() / 1000),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(leads.id, id));

        return NextResponse.json({ data: interaction[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating interaction:', error);
        return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
    }
}
