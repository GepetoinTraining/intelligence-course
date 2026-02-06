/**
 * AI Summary API
 * 
 * POST /api/communicator/summaries - Generate AI summary
 * GET /api/communicator/summaries/[sourceType]/[sourceId] - Get existing summaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    aiSummaries,
    meetings,
    meetingTranscripts,
    conversations,
    messages,
    users,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { GenerateSummarySchema, AI_SUMMARY_PROMPTS } from '@/lib/validations/communicator';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const validation = GenerateSummarySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const {
            sourceType,
            sourceId,
            aiProvider,
            aiModel,
            includeKeyPoints,
            includeActionItems,
            includeDecisions,
            includeSentiment,
            language,
            additionalInstructions,
        } = validation.data;

        // Get content to summarize based on source type
        let contentToSummarize = '';
        let linkedNodeId: string | null = null;
        let participants: string[] = [];

        if (sourceType === 'meeting' || sourceType === 'transcript') {
            // Get meeting transcripts
            const transcripts = await db.select()
                .from(meetingTranscripts)
                .where(eq(meetingTranscripts.meetingId, sourceId))
                .orderBy(meetingTranscripts.chunkIndex);

            if (transcripts.length === 0) {
                return NextResponse.json({
                    error: 'No transcripts found for this meeting'
                }, { status: 404 });
            }

            contentToSummarize = transcripts.map(t => t.rawTranscript).join('\n\n');

            // Get meeting info
            const [meeting] = await db.select()
                .from(meetings)
                .where(eq(meetings.id, sourceId))
                .limit(1);

            if (meeting) {
                contentToSummarize = `# Reunião: ${meeting.title}\n\n${contentToSummarize}`;
            }

        } else if (sourceType === 'conversation' || sourceType === 'problem_resolution' || sourceType === 'thread') {
            // Get conversation messages
            const [conversation] = await db.select()
                .from(conversations)
                .where(eq(conversations.id, sourceId))
                .limit(1);

            if (!conversation) {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }

            const messageList = await db.select({
                content: messages.content,
                senderName: users.name,
                senderType: messages.senderType,
                isSolution: messages.isSolution,
                createdAt: messages.createdAt,
            })
                .from(messages)
                .leftJoin(users, eq(messages.senderId, users.id))
                .where(and(
                    eq(messages.conversationId, sourceId),
                    eq(messages.isDeleted, false)
                ))
                .orderBy(messages.createdAt);

            // Format as conversation
            contentToSummarize = messageList.map(msg => {
                const sender = msg.senderType === 'ai' ? 'Assistente' :
                    msg.senderType === 'system' ? 'Sistema' :
                        msg.senderName || 'Desconhecido';
                const solutionTag = msg.isSolution ? ' [SOLUÇÃO]' : '';
                return `[${sender}${solutionTag}]: ${msg.content}`;
            }).join('\n\n');

            // Collect participant names
            participants = [...new Set(
                messageList
                    .filter(m => m.senderName)
                    .map(m => m.senderName!)
            )];

            if (sourceType === 'problem_resolution' && conversation.problemTitle) {
                contentToSummarize = `# Problema: ${conversation.problemTitle}\n\n${contentToSummarize}`;
            }

            linkedNodeId = conversation.nodeId;
        }

        if (!contentToSummarize.trim()) {
            return NextResponse.json({ error: 'No content to summarize' }, { status: 400 });
        }

        // Build the prompt
        const basePrompt = AI_SUMMARY_PROMPTS[sourceType as keyof typeof AI_SUMMARY_PROMPTS]
            || AI_SUMMARY_PROMPTS.conversation;

        let fullPrompt = basePrompt;

        if (!includeKeyPoints) {
            fullPrompt = fullPrompt.replace(/\*\*Pontos-Chave\*\*[\s\S]*?(?=\n\d\.|\n\*\*|$)/, '');
        }
        if (!includeActionItems) {
            fullPrompt = fullPrompt.replace(/\*\*Itens de Ação\*\*[\s\S]*?(?=\n\d\.|\n\*\*|$)/, '');
        }
        if (!includeDecisions) {
            fullPrompt = fullPrompt.replace(/\*\*Decisões[\s\S]*?\*\*[\s\S]*?(?=\n\d\.|\n\*\*|$)/, '');
        }
        if (includeSentiment) {
            fullPrompt += '\n\n6. **Análise de Sentimento** (positivo, neutro, negativo ou misto)';
        }
        if (additionalInstructions) {
            fullPrompt += `\n\nInstruções adicionais: ${additionalInstructions}`;
        }

        const startTime = Date.now();

        // Call AI API
        const anthropic = new Anthropic();

        const response = await anthropic.messages.create({
            model: aiModel || 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: fullPrompt,
            messages: [
                {
                    role: 'user',
                    content: contentToSummarize,
                }
            ],
        });

        const processingTime = Date.now() - startTime;
        const summaryContent = response.content[0].type === 'text'
            ? response.content[0].text
            : '';
        const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

        // Parse structured data from summary
        const keyPoints = extractListSection(summaryContent, 'Pontos-Chave');
        const actionItems = extractListSection(summaryContent, 'Itens de Ação');
        const decisions = extractListSection(summaryContent, 'Decisões');
        const topics = extractTopics(summaryContent);
        const sentiment = extractSentiment(summaryContent);

        // Save summary
        const [summary] = await db.insert(aiSummaries).values({
            organizationId: orgId,
            sourceType,
            sourceId,
            summary: summaryContent,
            keyPoints: JSON.stringify(keyPoints),
            actionItems: JSON.stringify(actionItems),
            decisions: JSON.stringify(decisions),
            participants: JSON.stringify(participants),
            topics: JSON.stringify(topics),
            overallSentiment: sentiment.type as any,
            sentimentScore: sentiment.score,
            aiProvider,
            aiModel: aiModel || 'claude-sonnet-4-20250514',
            promptTemplate: sourceType,
            tokensUsed,
            processingTimeMs: processingTime,
            linkedNodeId,
            generatedBy: userId,
        }).returning();

        return NextResponse.json({
            success: true,
            summary: {
                id: summary.id,
                content: summaryContent,
                keyPoints,
                actionItems,
                decisions,
                participants,
                topics,
                sentiment: {
                    type: sentiment.type,
                    score: sentiment.score,
                },
                tokensUsed,
                processingTimeMs: processingTime,
                createdAt: summary.createdAt,
            },
        });

    } catch (error: any) {
        console.error('Error generating summary:', error);
        return NextResponse.json({
            error: 'Failed to generate summary',
            details: error.message,
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sourceType = request.nextUrl.searchParams.get('sourceType');
        const sourceId = request.nextUrl.searchParams.get('sourceId');

        if (!sourceType || !sourceId) {
            return NextResponse.json({
                error: 'sourceType and sourceId are required'
            }, { status: 400 });
        }

        const summaries = await db.select()
            .from(aiSummaries)
            .where(and(
                eq(aiSummaries.organizationId, orgId),
                eq(aiSummaries.sourceType, sourceType as any),
                eq(aiSummaries.sourceId, sourceId)
            ))
            .orderBy(desc(aiSummaries.createdAt));

        return NextResponse.json({
            summaries: summaries.map(s => ({
                id: s.id,
                summary: s.summary,
                keyPoints: JSON.parse(s.keyPoints || '[]'),
                actionItems: JSON.parse(s.actionItems || '[]'),
                decisions: JSON.parse(s.decisions || '[]'),
                participants: JSON.parse(s.participants || '[]'),
                topics: JSON.parse(s.topics || '[]'),
                sentiment: {
                    type: s.overallSentiment,
                    score: s.sentimentScore,
                },
                aiProvider: s.aiProvider,
                aiModel: s.aiModel,
                tokensUsed: s.tokensUsed,
                processingTimeMs: s.processingTimeMs,
                userRating: s.userRating,
                createdAt: s.createdAt,
            })),
        });

    } catch (error) {
        console.error('Error fetching summaries:', error);
        return NextResponse.json({ error: 'Failed to fetch summaries' }, { status: 500 });
    }
}

// Helper functions to extract structured data from summary

function extractListSection(content: string, sectionName: string): string[] {
    const regex = new RegExp(`\\*\\*${sectionName}\\*\\*([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i');
    const match = content.match(regex);

    if (!match) return [];

    const section = match[1];
    const items = section.match(/[-•*]\s*(.+)/g) || [];

    return items.map(item => item.replace(/^[-•*]\s*/, '').trim());
}

function extractTopics(content: string): string[] {
    // Extract topics from headers and key terms
    const headers = content.match(/#+\s*(.+)/g) || [];
    const boldTerms = content.match(/\*\*([^*]+)\*\*/g) || [];

    const topics = [
        ...headers.map(h => h.replace(/^#+\s*/, '')),
        ...boldTerms.slice(0, 5).map(t => t.replace(/\*\*/g, '')),
    ];

    return [...new Set(topics)].slice(0, 10);
}

function extractSentiment(content: string): { type: string; score: number } {
    const lowerContent = content.toLowerCase();

    const positiveWords = ['ótimo', 'excelente', 'sucesso', 'conseguiu', 'positivo', 'acordo', 'aprovado'];
    const negativeWords = ['problema', 'falhou', 'negativo', 'preocupação', 'atraso', 'rejeitado', 'dificuldade'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
        if (lowerContent.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
        if (lowerContent.includes(word)) negativeCount++;
    }

    const totalCount = positiveCount + negativeCount;
    if (totalCount === 0) {
        return { type: 'neutral', score: 0 };
    }

    const score = (positiveCount - negativeCount) / totalCount;

    if (score > 0.3) return { type: 'positive', score };
    if (score < -0.3) return { type: 'negative', score };
    if (positiveCount > 0 && negativeCount > 0) return { type: 'mixed', score };
    return { type: 'neutral', score };
}

