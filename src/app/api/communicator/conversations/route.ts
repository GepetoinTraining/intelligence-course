/**
 * Conversations API
 * 
 * GET /api/communicator/conversations - List user's conversations
 * POST /api/communicator/conversations - Create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    conversations,
    conversationParticipants,
    messages,
    users,
    meetings,
    organizations,
} from '@/lib/db/schema';
import { eq, and, desc, or, sql, inArray } from 'drizzle-orm';
import {
    CreateDirectConversationSchema,
    CreateAIConversationSchema,
    CreateBroadcastSchema,
    CreateGroupConversationSchema,
    CreateMeetingConversationSchema,
    CreateProblemResolutionSchema,
    ListConversationsSchema,
    ConversationType,
} from '@/lib/validations/communicator';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization from database
        const [currentUser] = await db.select({
            organizationId: users.organizationId,
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const orgId = currentUser?.organizationId;

        // Parse query params
        const params = Object.fromEntries(request.nextUrl.searchParams);
        const validation = ListConversationsSchema.safeParse(params);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid parameters',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const { type, includeArchived, isPinned, search, limit, cursor } = validation.data;

        // Get participantId for filtering conversations with a specific contact
        const participantIdFilter = request.nextUrl.searchParams.get('participantId');

        // Get conversations where user is a participant
        const userParticipations = await db.select({
            conversationId: conversationParticipants.conversationId,
            unreadCount: conversationParticipants.unreadCount,
            lastReadAt: conversationParticipants.lastReadAt,
            role: conversationParticipants.role,
        })
            .from(conversationParticipants)
            .where(and(
                eq(conversationParticipants.userId, userId),
                eq(conversationParticipants.isActive, true)
            ));

        if (userParticipations.length === 0) {
            return NextResponse.json({ conversations: [], hasMore: false });
        }

        let conversationIds = userParticipations.map(p => p.conversationId);
        const participationMap = new Map(userParticipations.map(p => [p.conversationId, p]));

        // If filtering by a specific contact, intersect with conversations where they participate
        if (participantIdFilter) {
            const contactParticipations = await db.select({
                conversationId: conversationParticipants.conversationId,
            })
                .from(conversationParticipants)
                .where(and(
                    eq(conversationParticipants.userId, participantIdFilter),
                    eq(conversationParticipants.isActive, true),
                    inArray(conversationParticipants.conversationId, conversationIds)
                ));

            const contactConvIds = new Set(contactParticipations.map(p => p.conversationId));
            conversationIds = conversationIds.filter(id => contactConvIds.has(id));

            if (conversationIds.length === 0) {
                return NextResponse.json({ conversations: [], hasMore: false });
            }
        }

        // Build conditions
        const conditions: any[] = [
            inArray(conversations.id, conversationIds),
        ];

        // Only filter by org if user has one
        if (orgId) {
            conditions.push(eq(conversations.organizationId, orgId));
        }

        if (!includeArchived) {
            conditions.push(eq(conversations.isArchived, false));
        }
        if (type) {
            conditions.push(eq(conversations.type, type));
        }
        if (isPinned !== undefined) {
            conditions.push(eq(conversations.isPinned, isPinned));
        }

        // Cursor pagination
        if (cursor) {
            conditions.push(sql`${conversations.lastMessageAt} < ${parseInt(cursor)}`);
        }

        // Get conversations
        const convos = await db.select()
            .from(conversations)
            .where(and(...conditions))
            .orderBy(desc(conversations.isPinned), desc(conversations.lastMessageAt))
            .limit(limit + 1);

        const hasMore = convos.length > limit;
        const results = hasMore ? convos.slice(0, limit) : convos;

        // Enrich with participants and last message
        const enrichedConversations = await Promise.all(
            results.map(async (conv) => {
                // Get participants
                const participants = await db.select({
                    id: conversationParticipants.userId,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                    role: conversationParticipants.role,
                })
                    .from(conversationParticipants)
                    .innerJoin(users, eq(conversationParticipants.userId, users.id))
                    .where(and(
                        eq(conversationParticipants.conversationId, conv.id),
                        eq(conversationParticipants.isActive, true)
                    ))
                    .limit(10);

                // Get last message
                const [lastMessage] = await db.select({
                    content: messages.content,
                    senderName: users.name,
                    senderId: messages.senderId,
                    senderType: messages.senderType,
                    createdAt: messages.createdAt,
                })
                    .from(messages)
                    .leftJoin(users, eq(messages.senderId, users.id))
                    .where(and(
                        eq(messages.conversationId, conv.id),
                        eq(messages.isDeleted, false)
                    ))
                    .orderBy(desc(messages.createdAt))
                    .limit(1);

                // Get display name for direct conversations
                let displayName = conv.name;
                if (conv.type === 'direct' && !displayName) {
                    const otherParticipant = participants.find(p => p.id !== userId);
                    displayName = otherParticipant?.name || 'Unknown';
                }

                // Get avatar for direct conversations
                let displayAvatar = conv.avatarUrl;
                if (conv.type === 'direct' && !displayAvatar) {
                    const otherParticipant = participants.find(p => p.id !== userId);
                    displayAvatar = otherParticipant?.avatarUrl || null;
                }

                const participation = participationMap.get(conv.id);

                return {
                    id: conv.id,
                    type: conv.type,
                    name: displayName,
                    description: conv.description,
                    avatarUrl: displayAvatar,

                    // Problem resolution fields
                    problemTitle: conv.problemTitle,
                    problemStatus: conv.problemStatus,

                    // Meeting link
                    meetingId: conv.meetingId,

                    // Broadcast info
                    broadcastScope: conv.broadcastScope,

                    // AI config
                    aiProvider: conv.aiProvider,
                    aiModel: conv.aiModel,

                    // State
                    isPinned: conv.isPinned,
                    isArchived: conv.isArchived,

                    // Task linking - locked when linked task is completed
                    linkedTaskId: conv.linkedTaskId,
                    linkedTaskTitle: conv.linkedTaskTitle,
                    isResolved: conv.problemStatus === 'resolved' || conv.problemStatus === 'closed',
                    resolvedAt: conv.resolvedAt,

                    // Stats
                    messageCount: conv.messageCount,
                    unreadCount: participation?.unreadCount || 0,
                    lastMessageAt: conv.lastMessageAt,

                    // Last message preview
                    lastMessage: lastMessage ? {
                        content: lastMessage.content.length > 100
                            ? lastMessage.content.slice(0, 100) + '...'
                            : lastMessage.content,
                        senderName: lastMessage.senderType === 'ai'
                            ? 'Assistente'
                            : (lastMessage.senderName || 'Sistema'),
                        createdAt: lastMessage.createdAt,
                    } : null,

                    // Participants (limited)
                    participants: participants.map(p => ({
                        id: p.id,
                        name: p.name,
                        avatarUrl: p.avatarUrl,
                        role: p.role,
                    })),
                    participantCount: participants.length,

                    // Node/Graph integration
                    nodeId: conv.nodeId,
                    graphPath: conv.graphPath,

                    createdAt: conv.createdAt,
                };
            })
        );

        return NextResponse.json({
            conversations: enrichedConversations,
            hasMore,
            nextCursor: hasMore && results.length > 0
                ? results[results.length - 1].lastMessageAt?.toString()
                : null,
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization from database
        const [currentUser] = await db.select({
            organizationId: users.organizationId,
            email: users.email,
            name: users.name,
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        let orgId = currentUser?.organizationId;

        // If user has no org, create a personal org for them
        if (!orgId) {
            const personalOrgId = `personal-${userId}`;

            // Check if personal org already exists
            const existingOrg = await db.select({ id: organizations.id })
                .from(organizations)
                .where(eq(organizations.id, personalOrgId))
                .limit(1);

            if (existingOrg.length === 0) {
                // Create personal organization
                await db.insert(organizations).values({
                    id: personalOrgId,
                    name: currentUser?.name ? `${currentUser.name}'s Workspace` : 'Personal Workspace',
                    slug: `personal-${userId.slice(0, 8)}`,
                    plan: 'trial',
                });
            }

            // Assign user to this org
            if (currentUser) {
                await db.update(users)
                    .set({ organizationId: personalOrgId })
                    .where(eq(users.id, userId));
            }

            orgId = personalOrgId;
        }

        const body = await request.json();
        const { type, ...data } = body;

        if (!type) {
            return NextResponse.json({ error: 'Conversation type is required' }, { status: 400 });
        }

        let conversation: any;
        let participantIds: string[] = [userId];

        switch (type as ConversationType) {
            case 'direct': {
                const validation = CreateDirectConversationSchema.safeParse(data);
                if (!validation.success) {
                    return NextResponse.json({
                        error: 'Invalid data',
                        details: validation.error.flatten()
                    }, { status: 400 });
                }

                const { participantId, initialMessage } = validation.data;
                participantIds.push(participantId);

                // Check if direct conversation already exists
                const existingParticipations = await db.select({
                    conversationId: conversationParticipants.conversationId,
                })
                    .from(conversationParticipants)
                    .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
                    .where(and(
                        eq(conversations.organizationId, orgId),
                        eq(conversations.type, 'direct'),
                        or(
                            eq(conversationParticipants.userId, userId),
                            eq(conversationParticipants.userId, participantId)
                        )
                    ));

                // Group by conversation and check if both users are in same conversation
                const convCounts = new Map<string, number>();
                for (const p of existingParticipations) {
                    convCounts.set(p.conversationId, (convCounts.get(p.conversationId) || 0) + 1);
                }

                const existingConvId = Array.from(convCounts.entries())
                    .find(([, count]) => count >= 2)?.[0];

                if (existingConvId) {
                    // Return existing conversation
                    const [existingConv] = await db.select()
                        .from(conversations)
                        .where(eq(conversations.id, existingConvId));

                    return NextResponse.json({
                        success: true,
                        conversation: existingConv,
                        isExisting: true,
                    });
                }

                // Create new direct conversation
                [conversation] = await db.insert(conversations).values({
                    organizationId: orgId,
                    type: 'direct',
                    createdBy: userId,
                }).returning();

                // Create initial message if provided
                if (initialMessage) {
                    await db.insert(messages).values({
                        conversationId: conversation.id,
                        senderId: userId,
                        senderType: 'user',
                        content: initialMessage,
                        contentType: 'text',
                    });

                    await db.update(conversations)
                        .set({
                            lastMessageAt: Date.now(),
                            messageCount: 1,
                        })
                        .where(eq(conversations.id, conversation.id));
                }

                break;
            }

            case 'ai_assistant': {
                const validation = CreateAIConversationSchema.safeParse(data);
                if (!validation.success) {
                    return NextResponse.json({
                        error: 'Invalid data',
                        details: validation.error.flatten()
                    }, { status: 400 });
                }

                const { name, aiProvider, aiModel, aiSystemPrompt, aiContext } = validation.data;

                [conversation] = await db.insert(conversations).values({
                    organizationId: orgId,
                    type: 'ai_assistant',
                    name: name || 'Nova Conversa com IA',
                    aiProvider,
                    aiModel,
                    aiSystemPrompt,
                    aiContext: aiContext ? JSON.stringify(aiContext) : '[]',
                    createdBy: userId,
                }).returning();

                break;
            }

            case 'broadcast': {
                const validation = CreateBroadcastSchema.safeParse(data);
                if (!validation.success) {
                    return NextResponse.json({
                        error: 'Invalid data',
                        details: validation.error.flatten()
                    }, { status: 400 });
                }

                const {
                    name, description, broadcastScope, broadcastRoleFilter,
                    broadcastTeamId, customRecipientIds, subject, content,
                    contentType, allowReplies
                } = validation.data;

                // Determine recipients based on scope
                let recipientIds: string[] = [];

                if (broadcastScope === 'all') {
                    const allUsers = await db.select({ id: users.id })
                        .from(users)
                        .where(eq(users.organizationId, orgId));
                    recipientIds = allUsers.map(u => u.id);
                } else if (broadcastScope === 'role' && broadcastRoleFilter) {
                    const roleUsers = await db.select({ id: users.id })
                        .from(users)
                        .where(and(
                            eq(users.organizationId, orgId),
                            inArray(users.role, broadcastRoleFilter as any)
                        ));
                    recipientIds = roleUsers.map(u => u.id);
                } else if (broadcastScope === 'custom' && customRecipientIds) {
                    recipientIds = customRecipientIds;
                }
                // TODO: Handle 'team' scope when team membership is implemented

                participantIds = [...new Set([userId, ...recipientIds])];

                [conversation] = await db.insert(conversations).values({
                    organizationId: orgId,
                    type: 'broadcast',
                    name,
                    description,
                    broadcastScope,
                    broadcastRoleFilter: broadcastRoleFilter ? JSON.stringify(broadcastRoleFilter) : null,
                    broadcastTeamId,
                    createdBy: userId,
                }).returning();

                // Create the initial broadcast message
                await db.insert(messages).values({
                    conversationId: conversation.id,
                    senderId: userId,
                    senderType: 'user',
                    content,
                    contentType,
                    metadata: subject ? JSON.stringify({ subject }) : '{}',
                });

                await db.update(conversations)
                    .set({
                        lastMessageAt: Date.now(),
                        messageCount: 1,
                    })
                    .where(eq(conversations.id, conversation.id));

                // Add participants with canReply based on allowReplies
                for (const recipientId of participantIds) {
                    await db.insert(conversationParticipants).values({
                        conversationId: conversation.id,
                        userId: recipientId,
                        role: recipientId === userId ? 'owner' : 'member',
                        canReply: recipientId === userId || allowReplies,
                    });
                }

                return NextResponse.json({
                    success: true,
                    conversation,
                    recipientCount: participantIds.length,
                });
            }

            case 'group': {
                const validation = CreateGroupConversationSchema.safeParse(data);
                if (!validation.success) {
                    return NextResponse.json({
                        error: 'Invalid data',
                        details: validation.error.flatten()
                    }, { status: 400 });
                }

                const { name, description, avatarUrl, participantIds: groupParticipants, initialMessage, nodeId, graphPath } = validation.data;
                participantIds = [...new Set([userId, ...groupParticipants])];

                [conversation] = await db.insert(conversations).values({
                    organizationId: orgId,
                    type: 'group',
                    name,
                    description,
                    avatarUrl,
                    nodeId,
                    graphPath,
                    createdBy: userId,
                }).returning();

                if (initialMessage) {
                    await db.insert(messages).values({
                        conversationId: conversation.id,
                        senderId: userId,
                        senderType: 'user',
                        content: initialMessage,
                        contentType: 'text',
                    });

                    await db.update(conversations)
                        .set({
                            lastMessageAt: Date.now(),
                            messageCount: 1,
                        })
                        .where(eq(conversations.id, conversation.id));
                }

                break;
            }

            case 'meeting': {
                const validation = CreateMeetingConversationSchema.safeParse(data);
                if (!validation.success) {
                    return NextResponse.json({
                        error: 'Invalid data',
                        details: validation.error.flatten()
                    }, { status: 400 });
                }

                const { meetingId, name } = validation.data;

                // Verify meeting exists
                const [meeting] = await db.select()
                    .from(meetings)
                    .where(and(
                        eq(meetings.id, meetingId),
                        eq(meetings.organizationId, orgId)
                    ))
                    .limit(1);

                if (!meeting) {
                    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
                }

                // Check if meeting conversation already exists
                const [existingMeetingConv] = await db.select()
                    .from(conversations)
                    .where(and(
                        eq(conversations.meetingId, meetingId),
                        eq(conversations.type, 'meeting')
                    ))
                    .limit(1);

                if (existingMeetingConv) {
                    return NextResponse.json({
                        success: true,
                        conversation: existingMeetingConv,
                        isExisting: true,
                    });
                }

                [conversation] = await db.insert(conversations).values({
                    organizationId: orgId,
                    type: 'meeting',
                    name: name || meeting.title,
                    meetingId,
                    createdBy: userId,
                }).returning();

                // TODO: Add meeting participants as conversation participants

                break;
            }

            case 'problem_resolution': {
                const validation = CreateProblemResolutionSchema.safeParse(data);
                if (!validation.success) {
                    return NextResponse.json({
                        error: 'Invalid data',
                        details: validation.error.flatten()
                    }, { status: 400 });
                }

                const { problemTitle, description, participantIds: problemParticipants, linkedEntityType, linkedEntityId, nodeId } = validation.data;
                participantIds = [...new Set([userId, ...problemParticipants])];

                [conversation] = await db.insert(conversations).values({
                    organizationId: orgId,
                    type: 'problem_resolution',
                    name: problemTitle,
                    problemTitle,
                    problemStatus: 'open',
                    nodeId,
                    createdBy: userId,
                }).returning();

                // Create system message describing the problem
                if (description) {
                    await db.insert(messages).values({
                        conversationId: conversation.id,
                        senderType: 'system',
                        content: `**Problema:** ${problemTitle}\n\n${description}`,
                        contentType: 'markdown',
                        linkedEntityType,
                        linkedEntityId,
                    });

                    await db.update(conversations)
                        .set({
                            lastMessageAt: Date.now(),
                            messageCount: 1,
                        })
                        .where(eq(conversations.id, conversation.id));
                }

                break;
            }

            default:
                return NextResponse.json({ error: 'Invalid conversation type' }, { status: 400 });
        }

        // Add participants (if not already added for broadcast)
        if (type !== 'broadcast') {
            for (const participantId of participantIds) {
                await db.insert(conversationParticipants).values({
                    conversationId: conversation.id,
                    userId: participantId,
                    role: participantId === userId ? 'owner' : 'member',
                }).onConflictDoNothing();
            }
        }

        return NextResponse.json({
            success: true,
            conversation,
        });

    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}

