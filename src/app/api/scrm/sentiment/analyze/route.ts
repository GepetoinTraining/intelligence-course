import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    leads,
    leadSentimentHistory,
    leadInteractions
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ============================================================================
// POST /api/scrm/sentiment/analyze - Analyze text and update sentiment
// ============================================================================

const analyzeSchema = z.object({
    leadId: z.string().uuid(),
    text: z.string().min(1),
    interactionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = analyzeSchema.parse(body);

        // Verify lead exists
        const [lead] = await db
            .select()
            .from(leads)
            .where(and(
                eq(leads.id, validated.leadId),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Analyze sentiment using Claude
        const anthropic = new Anthropic();

        const prompt = `Analyze the emotional sentiment of the following text from a potential student/client. 

Text to analyze:
"${validated.text}"

Classify the sentiment as one of:
- positive: Enthusiastic, happy, engaged, interested
- neutral: Matter-of-fact, neither positive nor negative
- hesitant: Uncertain, having doubts, asking many questions
- negative: Frustrated, disappointed, upset
- enthusiastic: Extremely positive, excited, eager

Also provide:
1. A confidence score (1-100)
2. Key emotional indicators found in the text
3. A brief explanation

Respond in JSON format:
{
  "sentiment": "positive|neutral|hesitant|negative|enthusiastic",
  "confidence": 85,
  "indicators": ["indicator1", "indicator2"],
  "explanation": "Brief explanation of why this sentiment was detected"
}

Return ONLY the JSON.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
        });

        // Parse response
        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        let analysisResult;

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (parseError) {
            console.error('Failed to parse sentiment response:', parseError);
            // Fallback to neutral
            analysisResult = {
                sentiment: 'neutral',
                confidence: 50,
                indicators: [],
                explanation: 'Unable to analyze - defaulting to neutral',
            };
        }

        const now = Date.now();

        // Record sentiment history
        await db.insert(leadSentimentHistory).values({
            leadId: validated.leadId,
            sentiment: analysisResult.sentiment,
            source: 'ai_analysis',
            context: JSON.stringify({
                text: validated.text.substring(0, 200),
                indicators: analysisResult.indicators,
                explanation: analysisResult.explanation,
                confidence: analysisResult.confidence,
            }),
            interactionId: validated.interactionId,
            analyzedBy: userId,
            analyzedAt: now,
        });

        // Update lead's current sentiment if confidence is high enough
        if (analysisResult.confidence >= 60) {
            await db
                .update(leads)
                .set({
                    currentSentiment: analysisResult.sentiment,
                    sentimentUpdatedAt: now,
                    updatedAt: now,
                })
                .where(eq(leads.id, validated.leadId));
        }

        return NextResponse.json({
            success: true,
            data: analysisResult,
            updated: analysisResult.confidence >= 60,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('SCRM sentiment analysis error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// GET /api/scrm/sentiment/analyze - Get sentiment history for lead
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
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
            .select({
                id: leads.id,
                name: leads.name,
                currentSentiment: leads.currentSentiment,
                sentimentUpdatedAt: leads.sentimentUpdatedAt,
            })
            .from(leads)
            .where(and(
                eq(leads.id, leadId),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Get history
        const history = await db
            .select()
            .from(leadSentimentHistory)
            .where(eq(leadSentimentHistory.leadId, leadId))
            .orderBy(desc(leadSentimentHistory.analyzedAt))
            .limit(50);

        // Parse context JSON
        const enrichedHistory = history.map(h => ({
            ...h,
            contextParsed: h.context ? JSON.parse(h.context) : null,
        }));

        // Calculate sentiment distribution
        const distribution: Record<string, number> = {
            positive: 0,
            neutral: 0,
            hesitant: 0,
            negative: 0,
            enthusiastic: 0,
        };
        history.forEach(h => {
            if (h.sentiment && distribution[h.sentiment] !== undefined) {
                distribution[h.sentiment]++;
            }
        });

        // Determine trend
        let trend = 'stable';
        if (history.length >= 3) {
            const recent = history.slice(0, 3);
            const positiveCount = recent.filter(h =>
                h.sentiment === 'positive' || h.sentiment === 'enthusiastic'
            ).length;
            const negativeCount = recent.filter(h =>
                h.sentiment === 'negative' || h.sentiment === 'hesitant'
            ).length;

            if (positiveCount >= 2) trend = 'improving';
            else if (negativeCount >= 2) trend = 'declining';
        }

        return NextResponse.json({
            success: true,
            data: {
                current: lead.currentSentiment,
                lastUpdated: lead.sentimentUpdatedAt,
                history: enrichedHistory,
                distribution,
                trend,
                totalReadings: history.length,
            },
        });
    } catch (error) {
        console.error('SCRM get sentiment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// PUT /api/scrm/sentiment/analyze - Manual sentiment update
// ============================================================================

const manualUpdateSchema = z.object({
    leadId: z.string().uuid(),
    sentiment: z.enum(['positive', 'neutral', 'hesitant', 'negative', 'enthusiastic']),
    reason: z.string().optional(),
});

export async function PUT(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validated = manualUpdateSchema.parse(body);

        // Verify lead exists
        const [lead] = await db
            .select({ id: leads.id })
            .from(leads)
            .where(and(
                eq(leads.id, validated.leadId),
                eq(leads.organizationId, orgId)
            ))
            .limit(1);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const now = Date.now();

        // Record history
        await db.insert(leadSentimentHistory).values({
            leadId: validated.leadId,
            sentiment: validated.sentiment,
            source: 'user_observation',
            context: validated.reason,
            analyzedBy: userId,
            analyzedAt: now,
        });

        // Update lead
        await db
            .update(leads)
            .set({
                currentSentiment: validated.sentiment,
                sentimentUpdatedAt: now,
                updatedAt: now,
            })
            .where(eq(leads.id, validated.leadId));

        return NextResponse.json({
            success: true,
            sentiment: validated.sentiment,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
        }
        console.error('SCRM manual sentiment update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

