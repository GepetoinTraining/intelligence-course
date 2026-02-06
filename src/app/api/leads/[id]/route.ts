import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, leadInteractions, trialClasses, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/leads/[id] - Get lead with interactions
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const lead = await db
            .select()
            .from(leads)
            .where(eq(leads.id, id))
            .limit(1);

        if (lead.length === 0) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Get interactions
        const interactions = await db
            .select()
            .from(leadInteractions)
            .where(eq(leadInteractions.leadId, id))
            .orderBy(desc(leadInteractions.createdAt));

        // Get trial classes
        const trials = await db
            .select()
            .from(trialClasses)
            .where(eq(trialClasses.leadId, id))
            .orderBy(desc(trialClasses.scheduledDate));

        return NextResponse.json({
            data: {
                ...lead[0],
                interactions,
                trials,
            }
        });
    } catch (error) {
        console.error('Error fetching lead:', error);
        return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
    }
}

// PATCH /api/leads/[id] - Update lead
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

        if (body.name !== undefined) updateData.name = body.name;
        if (body.email !== undefined) updateData.email = body.email;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
        if (body.interestedIn !== undefined) updateData.interestedIn = JSON.stringify(body.interestedIn);
        if (body.currentLevel !== undefined) updateData.currentLevel = body.currentLevel;
        if (body.preferredSchedule !== undefined) updateData.preferredSchedule = body.preferredSchedule;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.nextFollowupAt !== undefined) updateData.nextFollowupAt = body.nextFollowupAt;

        const updated = await db
            .update(leads)
            .set(updateData)
            .where(eq(leads.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating lead:', error);
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }
}

// DELETE /api/leads/[id] - Mark lead as lost
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const updated = await db
            .update(leads)
            .set({
                status: 'lost',
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(leads.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error marking lead as lost:', error);
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }
}
