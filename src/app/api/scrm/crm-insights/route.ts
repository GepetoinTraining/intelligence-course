import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    leads,
    leadInsights,
    leadSentimentHistory,
    leadFunnelHistory
} from '@/lib/db/schema';
import { eq, and, desc, gte, count, sql } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// GET /api/scrm/crm-insights - Get CRM-wide AI insights
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30', 10);

        const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

        // Get leads with activity in period
        const activeLeads = await db
            .select({
                id: leads.id,
                name: leads.name,
                funnelStage: leads.funnelStage,
                funnelSegment: leads.funnelSegment,
                currentSentiment: leads.currentSentiment,
                insightDreams: leads.insightDreams,
                insightHobbies: leads.insightHobbies,
                insightAspirations: leads.insightAspirations,
                hasPersona: leads.hasPersona,
                source: leads.source,
                createdAt: leads.createdAt,
                updatedAt: leads.updatedAt,
            })
            .from(leads)
            .where(and(
                eq(leads.organizationId, orgId),
                gte(leads.updatedAt, startDate)
            ))
            .orderBy(desc(leads.updatedAt))
            .limit(100);

        // Funnel distribution
        const funnelDistribution: Record<string, number> = {};
        const segmentDistribution = { tofu: 0, mofu: 0, bofu: 0, outcome: 0 };
        const sentimentDistribution: Record<string, number> = {};
        const sourceDistribution: Record<string, number> = {};

        activeLeads.forEach(lead => {
            if (lead.funnelStage) {
                funnelDistribution[lead.funnelStage] = (funnelDistribution[lead.funnelStage] || 0) + 1;
            }
            if (lead.funnelSegment) {
                segmentDistribution[lead.funnelSegment as keyof typeof segmentDistribution]++;
            }
            if (lead.currentSentiment) {
                sentimentDistribution[lead.currentSentiment] = (sentimentDistribution[lead.currentSentiment] || 0) + 1;
            }
            if (lead.source) {
                sourceDistribution[lead.source] = (sourceDistribution[lead.source] || 0) + 1;
            }
        });

        // Insight coverage
        const with3x3Complete = activeLeads.filter(l =>
            l.insightDreams && l.insightHobbies && l.insightAspirations
        ).length;
        const withPersonas = activeLeads.filter(l => l.hasPersona).length;

        // Recent funnel transitions
        const recentTransitions = await db
            .select({
                stage: leadFunnelHistory.stage,
                previousStage: leadFunnelHistory.previousStage,
                changedAt: leadFunnelHistory.changedAt,
            })
            .from(leadFunnelHistory)
            .innerJoin(leads, eq(leadFunnelHistory.leadId, leads.id))
            .where(and(
                eq(leads.organizationId, orgId),
                gte(leadFunnelHistory.changedAt, startDate)
            ))
            .orderBy(desc(leadFunnelHistory.changedAt))
            .limit(50);

        // Calculate conversion rates
        const wonCount = activeLeads.filter(l => l.funnelStage === 'won').length;
        const lostCount = activeLeads.filter(l => l.funnelStage === 'lost').length;
        const outcomeCount = wonCount + lostCount;
        const conversionRate = outcomeCount > 0 ? (wonCount / outcomeCount * 100) : 0;

        // Stage progression analysis
        const stageProgressions: Record<string, Record<string, number>> = {};
        recentTransitions.forEach(t => {
            if (t.previousStage && t.stage) {
                if (!stageProgressions[t.previousStage]) {
                    stageProgressions[t.previousStage] = {};
                }
                stageProgressions[t.previousStage][t.stage] =
                    (stageProgressions[t.previousStage][t.stage] || 0) + 1;
            }
        });

        // Bottleneck detection (stages with low progression)
        const bottlenecks: string[] = [];
        Object.entries(funnelDistribution).forEach(([stage, count]) => {
            if (count >= 3 && !['won', 'lost'].includes(stage)) {
                const transitions = stageProgressions[stage];
                if (!transitions || Object.keys(transitions).length === 0) {
                    bottlenecks.push(stage);
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                period: { days, startDate },
                summary: {
                    totalActive: activeLeads.length,
                    with3x3Complete,
                    withPersonas,
                    conversionRate: Math.round(conversionRate * 10) / 10,
                    wonCount,
                    lostCount,
                },
                distributions: {
                    funnel: funnelDistribution,
                    segment: segmentDistribution,
                    sentiment: sentimentDistribution,
                    source: sourceDistribution,
                },
                bottlenecks,
                stageProgressions,
                recommendations: generateRecommendations({
                    sentimentDistribution,
                    bottlenecks,
                    with3x3Complete,
                    totalActive: activeLeads.length,
                    withPersonas,
                }),
            },
        });
    } catch (error) {
        console.error('SCRM CRM insights error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// POST /api/scrm/crm-insights - Generate AI-powered insights
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { days = 30 } = await request.json();
        const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

        // Get summary data
        const activeLeads = await db
            .select({
                funnelStage: leads.funnelStage,
                funnelSegment: leads.funnelSegment,
                currentSentiment: leads.currentSentiment,
                source: leads.source,
                insightDreams: leads.insightDreams,
                insightHobbies: leads.insightHobbies,
                insightAspirations: leads.insightAspirations,
            })
            .from(leads)
            .where(and(
                eq(leads.organizationId, orgId),
                gte(leads.updatedAt, startDate)
            ))
            .limit(200);

        // Aggregate common themes in insights
        const allDreams: string[] = [];
        const allHobbies: string[] = [];
        const allAspirations: string[] = [];

        activeLeads.forEach(lead => {
            if (lead.insightDreams) {
                try {
                    allDreams.push(...JSON.parse(lead.insightDreams));
                } catch { }
            }
            if (lead.insightHobbies) {
                try {
                    allHobbies.push(...JSON.parse(lead.insightHobbies));
                } catch { }
            }
            if (lead.insightAspirations) {
                try {
                    allAspirations.push(...JSON.parse(lead.insightAspirations));
                } catch { }
            }
        });

        // Generate AI insights
        const anthropic = new Anthropic();

        const prompt = `You are a CRM analyst for a language school. Analyze the following data and provide actionable insights.

## Pipeline Summary (${days} days)
- Total active leads: ${activeLeads.length}
- TOFU (awareness): ${activeLeads.filter(l => l.funnelSegment === 'tofu').length}
- MOFU (consideration): ${activeLeads.filter(l => l.funnelSegment === 'mofu').length}
- BOFU (decision): ${activeLeads.filter(l => l.funnelSegment === 'bofu').length}

## Sentiment Breakdown
- Positive/Enthusiastic: ${activeLeads.filter(l => l.currentSentiment === 'positive' || l.currentSentiment === 'enthusiastic').length}
- Neutral: ${activeLeads.filter(l => l.currentSentiment === 'neutral').length}
- Hesitant/Negative: ${activeLeads.filter(l => l.currentSentiment === 'hesitant' || l.currentSentiment === 'negative').length}

## Lead Sources
${Object.entries(activeLeads.reduce((acc: Record<string, number>, l) => {
            if (l.source) acc[l.source] = (acc[l.source] || 0) + 1;
            return acc;
        }, {})).map(([source, count]) => `- ${source}: ${count}`).join('\n')}

## Common Dreams (sample):
${allDreams.slice(0, 10).join(', ') || 'Not enough data'}

## Common Hobbies (sample):
${allHobbies.slice(0, 10).join(', ') || 'Not enough data'}

## Common Aspirations (sample):
${allAspirations.slice(0, 10).join(', ') || 'Not enough data'}

Provide a JSON response with:
{
  "executiveSummary": "2-3 sentence overview of pipeline health",
  "keyPatterns": ["3-5 observed patterns in the data"],
  "actionableInsights": ["5 specific actions the team should take"],
  "riskAreas": ["2-3 areas of concern"],
  "opportunities": ["2-3 growth opportunities based on insights"],
  "segmentRecommendations": {
    "tofu": "Recommendation for awareness stage leads",
    "mofu": "Recommendation for consideration stage leads",
    "bofu": "Recommendation for decision stage leads"
  }
}

Return ONLY the JSON.`;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        let aiInsights;

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiInsights = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (parseError) {
            console.error('Failed to parse AI insights:', parseError);
            aiInsights = {
                executiveSummary: 'Unable to generate AI insights at this time.',
                keyPatterns: [],
                actionableInsights: [],
                riskAreas: [],
                opportunities: [],
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                ...aiInsights,
                generatedAt: Date.now(),
                periodDays: days,
                leadsAnalyzed: activeLeads.length,
            },
        });
    } catch (error) {
        console.error('SCRM generate insights error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ============================================================================
// Helper: Generate rule-based recommendations
// ============================================================================

function generateRecommendations(data: {
    sentimentDistribution: Record<string, number>;
    bottlenecks: string[];
    with3x3Complete: number;
    totalActive: number;
    withPersonas: number;
}): string[] {
    const recommendations: string[] = [];

    // Low 3x3 coverage
    const insightCoverage = data.with3x3Complete / Math.max(data.totalActive, 1) * 100;
    if (insightCoverage < 30) {
        recommendations.push(
            `Only ${Math.round(insightCoverage)}% of leads have complete 3x3 Insights. ` +
            `Focus on capturing Dreams, Hobbies, and Aspirations during initial contacts.`
        );
    }

    // Low persona coverage
    const personaCoverage = data.withPersonas / Math.max(data.totalActive, 1) * 100;
    if (personaCoverage < 20 && data.with3x3Complete >= 5) {
        recommendations.push(
            `${data.with3x3Complete} leads have insights but only ${data.withPersonas} have AI personas. ` +
            `Generate personas to get personalized communication recommendations.`
        );
    }

    // High hesitant/negative sentiment
    const negativeCount = (data.sentimentDistribution['hesitant'] || 0) +
        (data.sentimentDistribution['negative'] || 0);
    if (negativeCount >= 5) {
        recommendations.push(
            `${negativeCount} leads show hesitant or negative sentiment. ` +
            `Review these contacts and address their concerns proactively.`
        );
    }

    // Bottlenecks
    if (data.bottlenecks.length > 0) {
        recommendations.push(
            `Potential bottlenecks detected at: ${data.bottlenecks.join(', ')}. ` +
            `These stages have leads but no recent progressions.`
        );
    }

    // Always include one positive/general recommendation
    if (recommendations.length === 0) {
        recommendations.push(
            `Pipeline is healthy. Continue capturing 3x3 Insights and maintaining regular contact.`
        );
    }

    return recommendations;
}

