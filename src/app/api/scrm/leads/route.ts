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
    users
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// GET /api/scrm/leads - List leads with SCRM enrichment
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const segment = searchParams.get('segment'); // tofu, mofu, bofu, outcome
        const stage = searchParams.get('stage');
        const sentiment = searchParams.get('sentiment');
        const hasInsights = searchParams.get('hasInsights');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        // Build query
        let query = db
            .select({
                id: leads.id,
                name: leads.name,
                email: leads.email,
                phone: leads.phone,
                whatsapp: leads.whatsapp,
                source: leads.source,
                funnelStage: leads.funnelStage,
                funnelSegment: leads.funnelSegment,
                currentSentiment: leads.currentSentiment,
                insightDreams: leads.insightDreams,
                insightHobbies: leads.insightHobbies,
                insightAspirations: leads.insightAspirations,
                hasPersona: leads.hasPersona,
                personaGeneratedAt: leads.personaGeneratedAt,
                assignedTo: leads.assignedTo,
                lastContactAt: leads.lastContactAt,
                nextFollowupAt: leads.nextFollowupAt,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            })
            .from(leads)
            .where(eq(leads.organizationId, orgId))
            .orderBy(desc(leads.updatedAt))
            .limit(limit);

        const allLeads = await query;

        // Apply filters
        let filtered = allLeads;
        if (segment) {
            filtered = filtered.filter(l => l.funnelSegment === segment);
        }
        if (stage) {
            filtered = filtered.filter(l => l.funnelStage === stage);
        }
        if (sentiment) {
            filtered = filtered.filter(l => l.currentSentiment === sentiment);
        }
        if (hasInsights === 'true') {
            filtered = filtered.filter(l =>
                l.insightDreams || l.insightHobbies || l.insightAspirations
            );
        }

        // Parse JSON fields
        const enriched = filtered.map(lead => ({
            ...lead,
            insightDreams: lead.insightDreams ? JSON.parse(lead.insightDreams) : [],
            insightHobbies: lead.insightHobbies ? JSON.parse(lead.insightHobbies) : [],
            insightAspirations: lead.insightAspirations ? JSON.parse(lead.insightAspirations) : [],
            insights3x3Complete: Boolean(
                lead.insightDreams && lead.insightHobbies && lead.insightAspirations
            ),
        }));

        // Aggregate by segment for funnel visualization
        const funnelCounts = {
            tofu: allLeads.filter(l => l.funnelSegment === 'tofu').length,
            mofu: allLeads.filter(l => l.funnelSegment === 'mofu').length,
            bofu: allLeads.filter(l => l.funnelSegment === 'bofu').length,
            outcome: allLeads.filter(l => l.funnelSegment === 'outcome').length,
        };

        // Stage breakdown
        const stageCounts: Record<string, number> = {};
        allLeads.forEach(l => {
            if (l.funnelStage) {
                stageCounts[l.funnelStage] = (stageCounts[l.funnelStage] || 0) + 1;
            }
        });

        return NextResponse.json({
            success: true,
            data: enriched,
            funnel: funnelCounts,
            stages: stageCounts,
            total: allLeads.length,
        });
    } catch (error) {
        console.error('SCRM leads error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// POST /api/scrm/leads - Create lead with SCRM fields
// ============================================================================

const createLeadSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    source: z.enum(['website', 'instagram', 'facebook', 'google', 'referral', 'walk_in', 'event', 'partner', 'other']).optional(),
    sourceDetail: z.string().optional(),
    funnelStage: z.enum([
        'small_engagement', 'comments_conversations', 'interested',
        'qualifying', 'more_information', 'events_invitations',
        'appointments', 'negotiation', 'counters',
        'won', 'lost'
    ]).optional(),
    currentSentiment: z.enum(['positive', 'neutral', 'hesitant', 'negative', 'enthusiastic']).optional(),
    notes: z.string().optional(),
    // Initial insights
    insightDreams: z.array(z.string()).max(3).optional(),
    insightHobbies: z.array(z.string()).max(3).optional(),
    insightAspirations: z.array(z.string()).max(3).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = createLeadSchema.parse(body);

        // Determine funnel segment from stage
        const getFunnelSegment = (stage: string) => {
            if (['small_engagement', 'comments_conversations', 'interested'].includes(stage)) return 'tofu';
            if (['qualifying', 'more_information', 'events_invitations'].includes(stage)) return 'mofu';
            if (['appointments', 'negotiation', 'counters'].includes(stage)) return 'bofu';
            return 'outcome';
        };

        const now = Date.now();
        const funnelStage = validated.funnelStage || 'small_engagement';

        const [newLead] = await db.insert(leads).values({
            organizationId: orgId,
            name: validated.name,
            email: validated.email,
            phone: validated.phone,
            whatsapp: validated.whatsapp,
            source: validated.source,
            sourceDetail: validated.sourceDetail,
            funnelStage,
            funnelSegment: getFunnelSegment(funnelStage),
            currentSentiment: validated.currentSentiment || 'neutral',
            sentimentUpdatedAt: now,
            insightDreams: validated.insightDreams ? JSON.stringify(validated.insightDreams) : null,
            insightHobbies: validated.insightHobbies ? JSON.stringify(validated.insightHobbies) : null,
            insightAspirations: validated.insightAspirations ? JSON.stringify(validated.insightAspirations) : null,
            notes: validated.notes,
            assignedTo: personId,
            createdAt: now,
            updatedAt: now,
        }).returning();

        // Record initial funnel position
        await db.insert(leadFunnelHistory).values({
            leadId: newLead.id,
            stage: funnelStage,
            funnelSegment: getFunnelSegment(funnelStage),
            changedBy: personId,
            changedAt: now,
        });

        // If insights provided, also store in detailed table
        if (validated.insightDreams?.length) {
            for (let i = 0; i < validated.insightDreams.length; i++) {
                await db.insert(leadInsights).values({
                    leadId: newLead.id,
                    insightType: 'dream',
                    content: validated.insightDreams[i],
                    position: i,
                    createdBy: personId,
                    createdAt: now,
                });
            }
        }
        if (validated.insightHobbies?.length) {
            for (let i = 0; i < validated.insightHobbies.length; i++) {
                await db.insert(leadInsights).values({
                    leadId: newLead.id,
                    insightType: 'hobby',
                    content: validated.insightHobbies[i],
                    position: i,
                    createdBy: personId,
                    createdAt: now,
                });
            }
        }
        if (validated.insightAspirations?.length) {
            for (let i = 0; i < validated.insightAspirations.length; i++) {
                await db.insert(leadInsights).values({
                    leadId: newLead.id,
                    insightType: 'aspiration',
                    content: validated.insightAspirations[i],
                    position: i,
                    createdBy: personId,
                    createdAt: now,
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: newLead,
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('SCRM create lead error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}



