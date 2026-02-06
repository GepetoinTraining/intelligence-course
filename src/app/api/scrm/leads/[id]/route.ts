import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    leads,
    leadInsights,
    leadSentimentHistory,
    leadPersonas,
    leadFunnelHistory,
    leadCourseInterests,
    leadInteractions,
    insightCommunications,
    users
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// GET /api/scrm/leads/[id] - Get lead with full SCRM enrichment
// ============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get lead
        const [lead] = await db
            .select()
            .from(leads)
            .where(and(
                eq(leads.id, id),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Get all insights (detailed)
        const insights = await db
            .select()
            .from(leadInsights)
            .where(eq(leadInsights.leadId, id))
            .orderBy(leadInsights.insightType, leadInsights.position);

        // Get sentiment history
        const sentimentHistory = await db
            .select()
            .from(leadSentimentHistory)
            .where(eq(leadSentimentHistory.leadId, id))
            .orderBy(desc(leadSentimentHistory.analyzedAt))
            .limit(20);

        // Get funnel history
        const funnelHistory = await db
            .select()
            .from(leadFunnelHistory)
            .where(eq(leadFunnelHistory.leadId, id))
            .orderBy(desc(leadFunnelHistory.changedAt))
            .limit(20);

        // Get persona if exists
        const [persona] = await db
            .select()
            .from(leadPersonas)
            .where(eq(leadPersonas.leadId, id))
            .limit(1);

        // Get course interests
        const courseInterests = await db
            .select()
            .from(leadCourseInterests)
            .where(eq(leadCourseInterests.leadId, id));

        // Get recent interactions
        const interactions = await db
            .select()
            .from(leadInteractions)
            .where(eq(leadInteractions.leadId, id))
            .orderBy(desc(leadInteractions.createdAt))
            .limit(10);

        // Group insights by type
        const groupedInsights = {
            dreams: insights.filter(i => i.insightType === 'dream'),
            hobbies: insights.filter(i => i.insightType === 'hobby'),
            aspirations: insights.filter(i => i.insightType === 'aspiration'),
        };

        // Parse JSON fields
        const enrichedLead = {
            ...lead,
            insightDreams: lead.insightDreams ? JSON.parse(lead.insightDreams) : [],
            insightHobbies: lead.insightHobbies ? JSON.parse(lead.insightHobbies) : [],
            insightAspirations: lead.insightAspirations ? JSON.parse(lead.insightAspirations) : [],
        };

        // Parse persona JSON fields
        const enrichedPersona = persona ? {
            ...persona,
            conversationStarters: persona.conversationStarters ? JSON.parse(persona.conversationStarters) : [],
            personalityTags: persona.personalityTags ? JSON.parse(persona.personalityTags) : [],
            preferredChannels: persona.preferredChannels ? JSON.parse(persona.preferredChannels) : [],
            avoidTopics: persona.avoidTopics ? JSON.parse(persona.avoidTopics) : [],
        } : null;

        return NextResponse.json({
            success: true,
            data: {
                lead: enrichedLead,
                insights: groupedInsights,
                insightsDetailed: insights,
                sentimentHistory,
                funnelHistory,
                persona: enrichedPersona,
                courseInterests,
                recentInteractions: interactions,
            },
        });
    } catch (error) {
        console.error('SCRM get lead error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// PUT /api/scrm/leads/[id] - Update lead with SCRM fields
// ============================================================================

const updateLeadSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
    funnelStage: z.enum([
        'small_engagement', 'comments_conversations', 'interested',
        'qualifying', 'more_information', 'events_invitations',
        'appointments', 'negotiation', 'counters',
        'won', 'lost'
    ]).optional(),
    currentSentiment: z.enum(['positive', 'neutral', 'hesitant', 'negative', 'enthusiastic']).optional(),
    sentimentReason: z.string().optional(),
    notes: z.string().optional().nullable(),
    assignedTo: z.string().uuid().optional().nullable(),
    nextFollowupAt: z.number().optional().nullable(),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = updateLeadSchema.parse(body);

        // Get current lead
        const [current] = await db
            .select()
            .from(leads)
            .where(and(
                eq(leads.id, id),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!current) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const now = Date.now();
        const getFunnelSegment = (stage: string) => {
            if (['small_engagement', 'comments_conversations', 'interested'].includes(stage)) return 'tofu';
            if (['qualifying', 'more_information', 'events_invitations'].includes(stage)) return 'mofu';
            if (['appointments', 'negotiation', 'counters'].includes(stage)) return 'bofu';
            return 'outcome';
        };

        // Track if funnel stage changed
        const stageChanged = validated.funnelStage && validated.funnelStage !== current.funnelStage;
        const sentimentChanged = validated.currentSentiment && validated.currentSentiment !== current.currentSentiment;

        // Update lead
        const updateData: any = {
            updatedAt: now,
        };
        if (validated.name) updateData.name = validated.name;
        if (validated.email !== undefined) updateData.email = validated.email;
        if (validated.phone !== undefined) updateData.phone = validated.phone;
        if (validated.whatsapp !== undefined) updateData.whatsapp = validated.whatsapp;
        if (validated.notes !== undefined) updateData.notes = validated.notes;
        if (validated.assignedTo !== undefined) updateData.assignedTo = validated.assignedTo;
        if (validated.nextFollowupAt !== undefined) updateData.nextFollowupAt = validated.nextFollowupAt;

        if (validated.funnelStage) {
            updateData.funnelStage = validated.funnelStage;
            updateData.funnelSegment = getFunnelSegment(validated.funnelStage);
        }
        if (validated.currentSentiment) {
            updateData.currentSentiment = validated.currentSentiment;
            updateData.sentimentUpdatedAt = now;
        }

        const [updated] = await db
            .update(leads)
            .set(updateData)
            .where(eq(leads.id, id))
            .returning();

        // Log funnel transition
        if (stageChanged && validated.funnelStage) {
            await db.insert(leadFunnelHistory).values({
                leadId: id,
                stage: validated.funnelStage,
                funnelSegment: getFunnelSegment(validated.funnelStage),
                previousStage: current.funnelStage,
                changedBy: personId,
                changedAt: now,
            });
        }

        // Log sentiment change
        if (sentimentChanged && validated.currentSentiment) {
            await db.insert(leadSentimentHistory).values({
                leadId: id,
                sentiment: validated.currentSentiment,
                source: 'user_observation',
                context: validated.sentimentReason,
                analyzedBy: personId,
                analyzedAt: now,
            });
        }

        return NextResponse.json({
            success: true,
            data: updated,
            stageChanged,
            sentimentChanged,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('SCRM update lead error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// DELETE /api/scrm/leads/[id] - Archive lead (soft delete)
// ============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify lead exists and belongs to org
        const [lead] = await db
            .select({ id: leads.id })
            .from(leads)
            .where(and(
                eq(leads.id, id),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Move to lost stage instead of deleting (relationships don't delete)
        const now = Date.now();
        await db
            .update(leads)
            .set({
                funnelStage: 'lost',
                funnelSegment: 'outcome',
                updatedAt: now,
            })
            .where(eq(leads.id, id));

        // Log the transition
        await db.insert(leadFunnelHistory).values({
            leadId: id,
            stage: 'lost',
            funnelSegment: 'outcome',
            reason: 'Archived by user',
            changedBy: personId,
            changedAt: now,
        });

        return NextResponse.json({
            success: true,
            message: 'Lead archived (moved to Lost stage)',
        });
    } catch (error) {
        console.error('SCRM archive lead error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
