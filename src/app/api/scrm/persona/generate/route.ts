import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    leads,
    leadInsights,
    leadPersonas,
    leadSentimentHistory
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// POST /api/scrm/persona/generate - Generate AI persona for a lead
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { leadId } = body;

        if (!leadId) {
            return NextResponse.json({ error: 'leadId required' }, { status: 400 });
        }

        // Get lead with insights
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

        // Get detailed insights
        const insights = await db
            .select()
            .from(leadInsights)
            .where(eq(leadInsights.leadId, leadId))
            .orderBy(leadInsights.insightType, leadInsights.position);

        const dreams = insights.filter(i => i.insightType === 'dream').map(i => i.content);
        const hobbies = insights.filter(i => i.insightType === 'hobby').map(i => i.content);
        const aspirations = insights.filter(i => i.insightType === 'aspiration').map(i => i.content);

        if (dreams.length === 0 && hobbies.length === 0 && aspirations.length === 0) {
            return NextResponse.json({
                error: 'No insights available. Add Dreams, Hobbies, or Aspirations first.'
            }, { status: 400 });
        }

        // Get recent sentiment history
        const sentimentHistory = await db
            .select()
            .from(leadSentimentHistory)
            .where(eq(leadSentimentHistory.leadId, leadId))
            .orderBy(desc(leadSentimentHistory.analyzedAt))
            .limit(5);

        // Generate persona using Claude
        const anthropic = new Anthropic();

        const prompt = `You are an expert relationship intelligence analyst. Based on the following information about a potential student/client, generate a detailed persona profile that will help our team build a genuine relationship with them.

## Contact Information
- Name: ${lead.name}
- Current Sentiment: ${lead.currentSentiment || 'neutral'}
- Funnel Stage: ${lead.funnelStage || 'unknown'}

## 3x3 Insights (Dreams, Hobbies, Aspirations)

### Dreams (What they hope for):
${dreams.length > 0 ? dreams.map((d, i) => `${i + 1}. ${d}`).join('\n') : 'Not yet captured'}

### Hobbies (What they choose freely):
${hobbies.length > 0 ? hobbies.map((h, i) => `${i + 1}. ${h}`).join('\n') : 'Not yet captured'}

### Aspirations (Who they're becoming):
${aspirations.length > 0 ? aspirations.map((a, i) => `${i + 1}. ${a}`).join('\n') : 'Not yet captured'}

${sentimentHistory.length > 0 ? `## Recent Sentiment History:
${sentimentHistory.map(s => `- ${s.sentiment}: ${s.context || 'No context'}`).join('\n')}` : ''}

## Your Task
Generate a JSON response with the following structure:
{
  "personalityProfile": "A 2-3 paragraph description of this person's personality, values, and motivations based on their insights",
  "communicationStyle": "How to best communicate with this person (formal/informal, detail-oriented/big-picture, etc.)",
  "conversationStarters": ["5 specific conversation starters that reference their interests"],
  "personalityTags": ["5-7 single-word or short phrase tags describing their personality"],
  "preferredChannels": ["Recommended communication channels in order of preference"],
  "bestTimeToContact": "When might be the best time to reach out based on their lifestyle",
  "avoidTopics": ["Topics to avoid or approach carefully"],
  "approachRecommendations": "Specific recommendations for how to approach enrollment conversations"
}

Important: Return ONLY the JSON, no additional text.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
        });

        // Parse the response
        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        let personaData;

        try {
            // Try to extract JSON from the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                personaData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            return NextResponse.json({
                error: 'Failed to parse AI response',
                rawResponse: responseText
            }, { status: 500 });
        }

        const now = Date.now();

        // Check if persona exists
        const [existingPersona] = await db
            .select({ id: leadPersonas.id })
            .from(leadPersonas)
            .where(eq(leadPersonas.leadId, leadId))
            .limit(1);

        if (existingPersona) {
            // Update existing
            await db
                .update(leadPersonas)
                .set({
                    personalityProfile: personaData.personalityProfile,
                    communicationStyle: personaData.communicationStyle,
                    conversationStarters: JSON.stringify(personaData.conversationStarters || []),
                    personalityTags: JSON.stringify(personaData.personalityTags || []),
                    preferredChannels: JSON.stringify(personaData.preferredChannels || []),
                    bestTimeToContact: personaData.bestTimeToContact,
                    avoidTopics: JSON.stringify(personaData.avoidTopics || []),
                    generatedAt: now,
                    basedOnInsightsCount: insights.length,
                    confidence: Math.min(100, 30 + insights.length * 10),
                    stale: false,
                    lastInsightUpdate: now,
                })
                .where(eq(leadPersonas.id, existingPersona.id));
        } else {
            // Create new
            await db.insert(leadPersonas).values({
                leadId,
                personalityProfile: personaData.personalityProfile,
                communicationStyle: personaData.communicationStyle,
                conversationStarters: JSON.stringify(personaData.conversationStarters || []),
                personalityTags: JSON.stringify(personaData.personalityTags || []),
                preferredChannels: JSON.stringify(personaData.preferredChannels || []),
                bestTimeToContact: personaData.bestTimeToContact,
                avoidTopics: JSON.stringify(personaData.avoidTopics || []),
                generatedAt: now,
                basedOnInsightsCount: insights.length,
                confidence: Math.min(100, 30 + insights.length * 10),
                stale: false,
                lastInsightUpdate: now,
            });
        }

        // Update lead's persona status
        await db
            .update(leads)
            .set({
                hasPersona: true,
                personaGeneratedAt: now,
                updatedAt: now,
            })
            .where(eq(leads.id, leadId));

        return NextResponse.json({
            success: true,
            data: {
                ...personaData,
                insightsUsed: insights.length,
                confidence: Math.min(100, 30 + insights.length * 10),
                generatedAt: now,
            },
        });
    } catch (error) {
        console.error('SCRM generate persona error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// GET /api/scrm/persona/generate?leadId=xxx - Get existing persona
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const leadId = searchParams.get('leadId');

        if (!leadId) {
            return NextResponse.json({ error: 'leadId required' }, { status: 400 });
        }

        // Verify lead exists
        const [lead] = await db
            .select({ id: leads.id, name: leads.name })
            .from(leads)
            .where(and(
                eq(leads.id, leadId),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Get persona
        const [persona] = await db
            .select()
            .from(leadPersonas)
            .where(eq(leadPersonas.leadId, leadId))
            .limit(1);

        if (!persona) {
            return NextResponse.json({
                success: true,
                data: null,
                message: 'No persona generated yet',
            });
        }

        // Parse JSON fields
        const enriched = {
            ...persona,
            conversationStarters: persona.conversationStarters ? JSON.parse(persona.conversationStarters) : [],
            personalityTags: persona.personalityTags ? JSON.parse(persona.personalityTags) : [],
            preferredChannels: persona.preferredChannels ? JSON.parse(persona.preferredChannels) : [],
            avoidTopics: persona.avoidTopics ? JSON.parse(persona.avoidTopics) : [],
        };

        return NextResponse.json({
            success: true,
            data: enriched,
        });
    } catch (error) {
        console.error('SCRM get persona error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

