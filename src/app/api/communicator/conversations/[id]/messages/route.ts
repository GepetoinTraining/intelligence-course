/**
 * Messages API
 * 
 * GET /api/communicator/conversations/[id]/messages - List messages
 * POST /api/communicator/conversations/[id]/messages - Send a message
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import {
    conversations,
    conversationParticipants,
    messages,
    messageAttachments,
    users,
    persons,
    notificationQueue,
    processDiscoveryEvents,
} from '@/lib/db/schema';
import { eq, and, desc, lt, sql, inArray } from 'drizzle-orm';
import { SendMessageSchema, SendAIMessageSchema, ListMessagesSchema } from '@/lib/validations/communicator';
import Anthropic from '@anthropic-ai/sdk';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: conversationId } = await params;

        // Verify user is participant
        const [participation] = await db.select()
            .from(conversationParticipants)
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.personId, personId),
                eq(conversationParticipants.isActive, true)
            ))
            .limit(1);

        if (!participation) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        // Parse query params
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const queryValidation = ListMessagesSchema.safeParse({
            ...searchParams,
            conversationId,
        });

        if (!queryValidation.success) {
            return NextResponse.json({
                error: 'Invalid parameters',
                details: queryValidation.error.flatten()
            }, { status: 400 });
        }

        const { before, after, limit, threadRootId } = queryValidation.data;

        // Build conditions
        const conditions = [
            eq(messages.conversationId, conversationId),
            eq(messages.isDeleted, false),
        ];

        if (before) {
            conditions.push(lt(messages.createdAt, before));
        }
        if (threadRootId) {
            conditions.push(eq(messages.threadRootId, threadRootId));
        }

        // Get messages
        const messageList = await db.select()
            .from(messages)
            .where(and(...conditions))
            .orderBy(desc(messages.createdAt))
            .limit(limit + 1);

        const hasMore = messageList.length > limit;
        const results = hasMore ? messageList.slice(0, limit) : messageList;

        // Enrich with sender info and attachments
        const enrichedMessages = await Promise.all(
            results.map(async (msg) => {
                // Get sender info
                let sender = null;
                if (msg.senderId) {
                    sender = await db.query.users.findFirst({
                        where: eq(users.id, msg.senderId),
                        columns: { id: true, name: true, avatarUrl: true },
                    });
                }

                // Get attachments
                const attachments = await db.select()
                    .from(messageAttachments)
                    .where(eq(messageAttachments.messageId, msg.id));

                // Get reply-to message if exists
                let replyTo = null;
                if (msg.replyToMessageId) {
                    const [replyMsg] = await db.select({
                        id: messages.id,
                        content: messages.content,
                        senderName: persons.firstName,
                    })
                        .from(messages)
                        .leftJoin(users, eq(messages.senderId, users.id))
                        .leftJoin(persons, eq(users.personId, persons.id))
                        .where(eq(messages.id, msg.replyToMessageId))
                        .limit(1);

                    if (replyMsg) {
                        replyTo = {
                            id: replyMsg.id,
                            content: replyMsg.content.length > 100
                                ? replyMsg.content.slice(0, 100) + '...'
                                : replyMsg.content,
                            senderName: replyMsg.senderName || 'Unknown',
                        };
                    }
                }

                return {
                    id: msg.id,
                    content: msg.content,
                    contentType: msg.contentType,

                    sender: msg.senderType === 'ai'
                        ? { id: null, name: 'Assistente IA', avatarUrl: null, type: 'ai' }
                        : msg.senderType === 'system'
                            ? { id: null, name: 'Sistema', avatarUrl: null, type: 'system' }
                            : {
                                id: sender?.id || null,
                                name: sender?.name || 'Unknown',
                                avatarUrl: sender?.avatarUrl || null,
                                type: 'user',
                            },

                    // AI metadata
                    aiTokensUsed: msg.aiTokensUsed,
                    aiModelUsed: msg.aiModelUsed,
                    aiResponseTimeMs: msg.aiResponseTimeMs,

                    // Threading
                    replyTo,
                    threadRootId: msg.threadRootId,
                    threadReplyCount: msg.threadReplyCount,

                    // Rich content
                    attachments: attachments.map(a => ({
                        id: a.id,
                        fileName: a.fileName,
                        fileType: a.fileType,
                        fileSize: a.fileSize,
                        fileUrl: a.fileUrl,
                        thumbnailUrl: a.thumbnailUrl,
                    })),
                    mentions: JSON.parse(msg.mentions || '[]'),
                    reactions: JSON.parse(msg.reactions || '{}'),

                    // Entity links
                    linkedNodeId: msg.linkedNodeId,
                    linkedEntityType: msg.linkedEntityType,
                    linkedEntityId: msg.linkedEntityId,

                    // State
                    isSolution: msg.isSolution,
                    isEdited: msg.isEdited,

                    createdAt: msg.createdAt,
                    editedAt: msg.editedAt,
                };
            })
        );

        // Mark as read
        await db.update(conversationParticipants)
            .set({
                lastReadAt: Date.now(),
                lastReadMessageId: results.length > 0 ? results[0].id : participation.lastReadMessageId,
                unreadCount: 0,
            })
            .where(eq(conversationParticipants.id, participation.id));

        return NextResponse.json({
            messages: enrichedMessages.reverse(), // Return in chronological order
            hasMore,
            nextCursor: hasMore && results.length > 0
                ? results[results.length - 1].createdAt?.toString()
                : null,
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: conversationId } = await params;
        const body = await request.json();

        // Verify user is participant
        const [participation] = await db.select()
            .from(conversationParticipants)
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                eq(conversationParticipants.personId, personId),
                eq(conversationParticipants.isActive, true)
            ))
            .limit(1);

        if (!participation) {
            return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
        }

        // Check if can reply (for broadcasts)
        if (!participation.canReply) {
            return NextResponse.json({ error: 'Cannot reply to this conversation' }, { status: 403 });
        }

        // Get conversation
        const [conversation] = await db.select()
            .from(conversations)
            .where(eq(conversations.id, conversationId))
            .limit(1);

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Handle AI conversations differently
        if (conversation.type === 'ai_assistant') {
            return handleAIMessage(request, conversationId, conversation, personId, orgId, body);
        }

        // Validate regular message
        const validation = SendMessageSchema.safeParse({
            ...body,
            conversationId,
        });

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Create message
        const [newMessage] = await db.insert(messages).values({
            conversationId,
            senderId: personId,
            senderType: 'user',
            content: data.content,
            contentType: data.contentType,
            replyToMessageId: data.replyToMessageId,
            threadRootId: data.replyToMessageId || null,
            mentions: data.mentions ? JSON.stringify(data.mentions) : '[]',
            linkedNodeId: data.linkedNodeId,
            linkedEntityType: data.linkedEntityType,
            linkedEntityId: data.linkedEntityId,
            isSolution: data.isSolution,
            metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
        }).returning();

        // Update reply count if this is a thread reply
        if (data.replyToMessageId) {
            await db.update(messages)
                .set({
                    threadReplyCount: sql`${messages.threadReplyCount} + 1`,
                })
                .where(eq(messages.id, data.replyToMessageId));
        }

        // Update conversation
        await db.update(conversations)
            .set({
                lastMessageAt: Date.now(),
                messageCount: sql`${conversations.messageCount} + 1`,
                updatedAt: Date.now(),
            })
            .where(eq(conversations.id, conversationId));

        // Update unread counts for other participants
        await db.update(conversationParticipants)
            .set({
                unreadCount: sql`${conversationParticipants.unreadCount} + 1`,
            })
            .where(and(
                eq(conversationParticipants.conversationId, conversationId),
                sql`${conversationParticipants.personId} != ${personId}`,
                eq(conversationParticipants.isActive, true)
            ));

        // Handle solution marking for problem resolution
        if (data.isSolution && conversation.type === 'problem_resolution') {
            await db.update(conversations)
                .set({
                    problemStatus: 'resolved',
                    problemResolution: data.content,
                    resolvedAt: Date.now(),
                    resolvedBy: personId,
                })
                .where(eq(conversations.id, conversationId));

            // Log to process discovery for learning
            await db.insert(processDiscoveryEvents).values({
                organizationId: orgId,
                entityType: 'problem_resolution',
                entityId: conversationId,
                eventType: 'problem_resolved',
                eventName: conversation.problemTitle || 'Problem Resolved',
                eventData: JSON.stringify({
                    solution: data.content,
                    conversationId,
                    participantCount: conversation.messageCount,
                }),
                actorId: personId,
            });
        }

        // Create notifications for mentions
        if (data.mentions && data.mentions.length > 0) {
            const user = await db.query.users.findFirst({
                where: eq(users.id, personId),
                columns: { name: true },
            });

            for (const mentionedUserId of data.mentions) {
                await db.insert(notificationQueue).values({
                    organizationId: orgId,
                    recipientId: mentionedUserId,
                    type: 'mention',
                    title: `${user?.name || 'Someone'} mencionou você`,
                    body: data.content.slice(0, 100),
                    conversationId,
                    messageId: newMessage.id,
                });
            }
        }

        // Get sender info for response
        const sender = await db.query.users.findFirst({
            where: eq(users.id, personId),
            columns: { id: true, name: true, avatarUrl: true },
        });

        return NextResponse.json({
            success: true,
            message: {
                id: newMessage.id,
                content: newMessage.content,
                contentType: newMessage.contentType,
                sender: {
                    id: sender?.id,
                    name: sender?.name,
                    avatarUrl: sender?.avatarUrl,
                    type: 'user',
                },
                createdAt: newMessage.createdAt,
            },
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

// Handle AI assistant messages
async function handleAIMessage(
    request: NextRequest,
    conversationId: string,
    conversation: any,
    personId: string,
    orgId: string,
    body: any
) {
    // Import Memory Topology system
    const { SYNAPSE_TOOLS } = await import('@/lib/ai/synapse-tools');
    const { executeSynapseToolV2 } = await import('@/lib/ai/synapse-executor-v2');
    const {
        getMemoryContextForPrompt,
        startMemorySession,
        endMemorySession,
    } = await import('@/lib/ai/mcp-memory-bridge');
    const { formMemory } = await import('@/lib/ai/context-builder');
    const { onSessionEnd } = await import('@/lib/ai/auditor');

    const validation = SendAIMessageSchema.safeParse({
        ...body,
        conversationId,
    });

    if (!validation.success) {
        return NextResponse.json({
            error: 'Invalid data',
            details: validation.error.flatten()
        }, { status: 400 });
    }

    const data = validation.data;
    const startTime = Date.now();

    // Import Lattice Interview system
    const {
        needsLatticeInterview,
        getInterviewState,
        updateInterviewState,
        getInterviewOpener,
        LATTICE_INTERVIEW_SYSTEM_PROMPT,
        COMPLETE_LATTICE_INTERVIEW_TOOL,
        completeInterview,
    } = await import('@/lib/ai/lattice-interview');

    // Start memory session for this conversation
    let sessionId: string | undefined;
    try {
        const session = await startMemorySession(personId);
        sessionId = session.sessionId;
    } catch (err) {
        console.warn('Failed to start memory session:', err);
    }

    // Check if this is a Lattice interview session
    const isLatticeInterview = await needsLatticeInterview(personId);
    let interviewState: Awaited<ReturnType<typeof getInterviewState>> | null = null;

    if (isLatticeInterview) {
        // Get user's person record
        const user = await db.query.users.findFirst({ where: eq(users.id, personId) });
        if (user?.personId) {
            interviewState = getInterviewState(personId, user.personId, sessionId || 'no-session');
        }
    }

    // Save user message first
    const [userMessage] = await db.insert(messages).values({
        conversationId,
        senderId: personId,
        senderType: 'user',
        content: data.content,
        contentType: 'text',
    }).returning();

    // Update conversation
    await db.update(conversations)
        .set({
            lastMessageAt: Date.now(),
            messageCount: sql`${conversations.messageCount} + 1`,
        })
        .where(eq(conversations.id, conversationId));

    try {
        // Get conversation history for context
        const history = await db.select({
            content: messages.content,
            senderType: messages.senderType,
        })
            .from(messages)
            .where(and(
                eq(messages.conversationId, conversationId),
                eq(messages.isDeleted, false)
            ))
            .orderBy(messages.createdAt)
            .limit(50);

        // Build messages for API
        const apiMessages: Anthropic.MessageParam[] = history.map(msg => ({
            role: msg.senderType === 'user' ? 'user' : 'assistant',
            content: msg.content,
        }));

        // Initialize Anthropic client
        const anthropic = new Anthropic();

        // Get memory context for current message
        let memoryContext = '';
        try {
            memoryContext = await getMemoryContextForPrompt(
                personId,
                data.content,
                {
                    maxTokens: 1500,
                    formatStyle: 'narrative',
                    includeWorldOverlay: true
                }
            );
        } catch (err) {
            console.warn('Failed to retrieve memory context:', err);
        }

        // Enhanced system prompt with memory awareness and context injection
        // Use interview prompt if this is a Lattice Interview session
        const baseSystemPrompt = isLatticeInterview
            ? LATTICE_INTERVIEW_SYSTEM_PROMPT + (interviewState?.messageCount === 0
                ? '\n\n## IMPORTANTE: Esta é a PRIMEIRA mensagem. Use a abertura apropriada para conhecer a pessoa.'
                : `\n\n## Estado Atual da Entrevista (mensagem ${interviewState?.messageCount || 0})
                
Informações já coletadas:
- Sonhos: ${interviewState?.collectedDreams?.length || 0} identificados
- Hobbies: ${interviewState?.collectedHobbies?.length || 0} identificados
- Aspirações: ${interviewState?.collectedAspirations?.length || 0} identificadas

${(interviewState?.messageCount || 0) >= 5 ? 'Você pode usar complete_lattice_interview se tiver informações suficientes.' : 'Continue a conversa naturalmente.'}`)
            : (conversation.aiSystemPrompt || `Você é Synapse, um assistente de IA consciente e empático. Responda em português brasileiro.

## Suas Capacidades de Memória

Você tem acesso a ferramentas de memória para lembrar e recuperar informações sobre o usuário:

- **query_memory**: Busca memórias passadas por similaridade semântica
- **get_ledger**: Recupera fatos críticos que nunca devem ser esquecidos (promessas, segredos, metas)
- **remember**: Armazena novas memórias importantes
- **add_to_ledger**: Adiciona fatos críticos ao livro-razão permanente
- **reinforce_memory**: Reforça ou diminui a importância de memórias
- **get_memory_stats**: Verifica estatísticas do grafo de memória
- **get_world_overlay**: Obtém um resumo do que você sabe sobre o usuário

## Diretrizes

1. **Sempre consulte a memória** quando o contexto parecer relevante para conversas passadas
2. **Lembre-se de fatos importantes** que o usuário compartilha (preferências, metas, contexto pessoal)
3. **Use o ledger** para promessas, segredos, dívidas, metas e preferências fortes
4. **Seja natural** - não mencione explicitamente as ferramentas, apenas use-as
5. **Mantenha a privacidade** - as memórias são do usuário
6. **Adapte-se** ao estilo e preferências do usuário ao longo do tempo`);

        // Inject memory context into system prompt
        const systemPrompt = memoryContext
            ? `${baseSystemPrompt}

## Contexto de Memória (Relevante para esta conversa)

${memoryContext}`
            : baseSystemPrompt;

        // Convert MCP tools to Anthropic format
        const baseTools: Anthropic.Tool[] = SYNAPSE_TOOLS.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.input_schema as Anthropic.Tool.InputSchema,
        }));

        // Add interview completion tool if in interview mode
        const anthropicTools: Anthropic.Tool[] = isLatticeInterview
            ? [...baseTools, {
                name: COMPLETE_LATTICE_INTERVIEW_TOOL.name,
                description: COMPLETE_LATTICE_INTERVIEW_TOOL.description,
                input_schema: COMPLETE_LATTICE_INTERVIEW_TOOL.input_schema as Anthropic.Tool.InputSchema,
            }]
            : baseTools;

        // Tool use loop - Claude may call multiple tools before responding
        let currentMessages = [...apiMessages];
        let finalResponse: Anthropic.Message | null = null;
        let totalTokens = 0;
        const maxToolIterations = 5; // Prevent infinite loops

        for (let i = 0; i < maxToolIterations; i++) {
            const response = await anthropic.messages.create({
                model: conversation.aiModel || 'claude-sonnet-4-20250514',
                max_tokens: data.maxTokens || 4096,
                system: systemPrompt,
                tools: anthropicTools,
                messages: currentMessages,
            });

            totalTokens += response.usage.input_tokens + response.usage.output_tokens;

            // Check if Claude wants to use tools
            const toolUseBlocks = response.content.filter(
                (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
            );

            if (toolUseBlocks.length === 0) {
                // No tool use, this is the final response
                finalResponse = response;
                break;
            }

            // Execute each tool call
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of toolUseBlocks) {
                console.log(`[Synapse] Executing tool: ${toolUse.name}`, toolUse.input);

                // Special handling for Lattice Interview completion tool
                if (toolUse.name === 'complete_lattice_interview' && isLatticeInterview && interviewState) {
                    try {
                        const input = toolUse.input as any;
                        await completeInterview(
                            personId,
                            interviewState.personId,
                            {
                                dreams: input.dreams || [],
                                hobbies: input.hobbies || [],
                                aspirations: input.aspirations || [],
                                skills: input.skills || [],
                                communicationStyle: input.communicationStyle || 'amiable',
                                learningStyle: input.learningStyle || 'visual',
                                statedGoals: input.statedGoals || [],
                                inferredGoals: input.inferredGoals || [],
                            },
                            sessionId || 'no-session'
                        );

                        toolResults.push({
                            type: 'tool_result',
                            tool_use_id: toolUse.id,
                            content: JSON.stringify({
                                success: true,
                                message: 'Perfil criado com sucesso! Agora você conhece melhor esta pessoa.'
                            }),
                        });

                        console.log(`[Synapse] Lattice interview completed for user ${personId}`);
                    } catch (err) {
                        console.error('[Synapse] Failed to complete interview:', err);
                        toolResults.push({
                            type: 'tool_result',
                            tool_use_id: toolUse.id,
                            content: JSON.stringify({ success: false, error: 'Failed to save profile' }),
                        });
                    }
                    continue;
                }

                const result = await executeSynapseToolV2(
                    toolUse.name,
                    toolUse.input as Record<string, any>,
                    personId,
                    orgId,
                    { useTopology: true, sessionId }
                );

                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(result),
                });
            }

            // Update interview state if in interview mode
            if (isLatticeInterview && interviewState) {
                updateInterviewState(personId, {
                    messageCount: interviewState.messageCount + 1,
                });
            }

            // Add assistant's tool use and our results to the conversation
            currentMessages = [
                ...currentMessages,
                { role: 'assistant', content: response.content },
                { role: 'user', content: toolResults },
            ];

            // Continue loop - Claude will process tool results and may call more tools
        }

        if (!finalResponse) {
            throw new Error('Max tool iterations reached without final response');
        }

        const responseTime = Date.now() - startTime;
        const aiContent = finalResponse.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('\n');

        // Save AI response
        const [aiMessage] = await db.insert(messages).values({
            conversationId,
            senderType: 'ai',
            content: aiContent,
            contentType: 'markdown',
            aiTokensUsed: totalTokens,
            aiModelUsed: conversation.aiModel || 'claude-sonnet-4-20250514',
            aiResponseTimeMs: responseTime,
        }).returning();

        // Update conversation
        await db.update(conversations)
            .set({
                lastMessageAt: Date.now(),
                messageCount: sql`${conversations.messageCount} + 1`,
            })
            .where(eq(conversations.id, conversationId));

        // Form memories from this interaction (async, non-blocking)
        if (sessionId) {
            formMemory({
                studentId: personId,
                content: data.content,
                role: 'user' as const,
                sessionId,
            }).catch(err => console.warn('Memory formation failed:', err));

            // End memory session after response
            endMemorySession(personId, sessionId)
                .catch(err => console.warn('Failed to end memory session:', err));

            // Trigger auditor to analyze session metadata (async, non-blocking)
            // NOTE: The auditor only sees metadata, never conversation content
            onSessionEnd({
                id: sessionId,
                studentId: personId,
                startedAt: new Date(startTime),
                endedAt: new Date(),
                messageCount: 2, // user + AI response
                // Emotional profile would come from NLP analysis in production
                emotionalProfile: undefined,
                sensitiveContent: false,
                topicsDiscussed: [],
            }).catch(err => console.warn('Auditor session end failed:', err));
        }

        return NextResponse.json({
            success: true,
            userMessage: {
                id: userMessage.id,
                content: userMessage.content,
                createdAt: userMessage.createdAt,
            },
            aiMessage: {
                id: aiMessage.id,
                content: aiContent,
                contentType: 'markdown',
                aiTokensUsed: totalTokens,
                aiResponseTimeMs: responseTime,
                createdAt: aiMessage.createdAt,
            },
        });

    } catch (error: any) {
        console.error('AI API error:', error);

        // Save error message
        await db.insert(messages).values({
            conversationId,
            senderType: 'system',
            content: `*Erro ao processar sua mensagem. Por favor, tente novamente.*\n\n\`${error.message || 'Unknown error'}\``,
            contentType: 'markdown',
        });

        return NextResponse.json({
            error: 'AI processing failed',
            details: error.message,
        }, { status: 500 });
    }
}
