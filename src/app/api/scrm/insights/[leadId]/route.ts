import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    leads,
    leadInsights,
    insightCommunications,
    leadPersonas
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// GET /api/scrm/insights/[leadId] - Get all insights for a lead
// ============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { leadId } = await params;

        // Verify lead exists
        const [lead] = await db
            .select({ id: leads.id })
            .from(leads)
            .where(and(
                eq(leads.id, leadId),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Get all insights
        const insights = await db
            .select()
            .from(leadInsights)
            .where(eq(leadInsights.leadId, leadId))
            .orderBy(leadInsights.insightType, leadInsights.position);

        // Group by type
        const grouped = {
            dreams: insights.filter(i => i.insightType === 'dream'),
            hobbies: insights.filter(i => i.insightType === 'hobby'),
            aspirations: insights.filter(i => i.insightType === 'aspiration'),
        };

        // Get communications for each insight
        const insightIds = insights.map(i => i.id);
        const communications = insightIds.length > 0
            ? await db
                .select()
                .from(insightCommunications)
                .where(eq(insightCommunications.insightId, insightIds[0])) // TODO: Use inArray when needed
                .orderBy(desc(insightCommunications.createdAt))
            : [];

        return NextResponse.json({
            success: true,
            data: {
                all: insights,
                grouped,
                communications,
                stats: {
                    total: insights.length,
                    dreams: grouped.dreams.length,
                    hobbies: grouped.hobbies.length,
                    aspirations: grouped.aspirations.length,
                    is3x3Complete: grouped.dreams.length >= 3 && grouped.hobbies.length >= 3 && grouped.aspirations.length >= 3,
                },
            },
        });
    } catch (error) {
        console.error('SCRM get insights error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// POST /api/scrm/insights/[leadId] - Add insight to a lead
// ============================================================================

const addInsightSchema = z.object({
    insightType: z.enum(['dream', 'hobby', 'aspiration']),
    content: z.string().min(1).max(500),
    context: z.string().optional(),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { leadId } = await params;
        const body = await request.json();
        const validated = addInsightSchema.parse(body);

        // Verify lead exists
        const [lead] = await db
            .select()
            .from(leads)
            .where(and(
                eq(leads.id, leadId),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Count existing insights of this type (max 3)
        const existingOfType = await db
            .select()
            .from(leadInsights)
            .where(and(
                eq(leadInsights.leadId, leadId),
                eq(leadInsights.insightType, validated.insightType)
            ));

        if (existingOfType.length >= 3) {
            return NextResponse.json({
                error: `Maximum 3 ${validated.insightType}s allowed`
            }, { status: 400 });
        }

        const now = Date.now();
        const position = existingOfType.length;

        // Add insight
        const [newInsight] = await db.insert(leadInsights).values({
            leadId,
            insightType: validated.insightType,
            content: validated.content,
            context: validated.context,
            position,
            createdBy: personId,
            createdAt: now,
            updatedAt: now,
        }).returning();

        // Update cached insights on lead
        await syncLeadInsights(leadId);

        // Mark persona as stale if exists
        await db
            .update(leadPersonas)
            .set({ stale: true, lastInsightUpdate: now })
            .where(eq(leadPersonas.leadId, leadId));

        return NextResponse.json({
            success: true,
            data: newInsight,
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('SCRM add insight error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// DELETE /api/scrm/insights/[leadId] - Remove an insight
// Query param: ?insightId=xxx
// ============================================================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { leadId } = await params;
        const { searchParams } = new URL(request.url);
        const insightId = searchParams.get('insightId');

        if (!insightId) {
            return NextResponse.json({ error: 'insightId required' }, { status: 400 });
        }

        // Verify lead exists
        const [lead] = await db
            .select({ id: leads.id })
            .from(leads)
            .where(and(
                eq(leads.id, leadId),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Delete the insight
        await db
            .delete(leadInsights)
            .where(and(
                eq(leadInsights.id, insightId),
                eq(leadInsights.leadId, leadId)
            ));

        // Update cached insights
        await syncLeadInsights(leadId);

        // Mark persona as stale
        await db
            .update(leadPersonas)
            .set({ stale: true, lastInsightUpdate: Date.now() })
            .where(eq(leadPersonas.leadId, leadId));

        return NextResponse.json({ success: true, deleted: true });
    } catch (error) {
        console.error('SCRM delete insight error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// Helper: Sync cached insights on lead record
// ============================================================================

async function syncLeadInsights(leadId: string) {
    const insights = await db
        .select()
        .from(leadInsights)
        .where(eq(leadInsights.leadId, leadId))
        .orderBy(leadInsights.insightType, leadInsights.position);

    const dreams = insights.filter(i => i.insightType === 'dream').map(i => i.content);
    const hobbies = insights.filter(i => i.insightType === 'hobby').map(i => i.content);
    const aspirations = insights.filter(i => i.insightType === 'aspiration').map(i => i.content);

    await db
        .update(leads)
        .set({
            insightDreams: dreams.length > 0 ? JSON.stringify(dreams) : null,
            insightHobbies: hobbies.length > 0 ? JSON.stringify(hobbies) : null,
            insightAspirations: aspirations.length > 0 ? JSON.stringify(aspirations) : null,
            updatedAt: Date.now(),
        })
        .where(eq(leads.id, leadId));
}
