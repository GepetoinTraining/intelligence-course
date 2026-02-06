/**
 * Communicator Zod Validation Schemas
 * 
 * Defines validation rules for:
 * - Conversations (1-1, 1-AI, 1-n, group, meeting, problem resolution)
 * - Messages
 * - Meeting notes and transcripts
 * - AI summaries
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const ConversationTypeEnum = z.enum([
    'direct',           // 1-1 private chat
    'ai_assistant',     // 1-AI conversation
    'broadcast',        // 1-n announcements (read-only for recipients)
    'group',            // n-n collaborative chat
    'meeting',          // Meeting-linked discussion
    'problem_resolution', // Multi-person problem solving with solution logging
    'support',          // Support ticket thread
]);

export type ConversationType = z.infer<typeof ConversationTypeEnum>;

export const BroadcastScopeEnum = z.enum(['all', 'team', 'role', 'custom']);
export const ParticipantRoleEnum = z.enum(['owner', 'admin', 'member', 'viewer', 'ai']);
export const SenderTypeEnum = z.enum(['user', 'ai', 'system', 'bot']);
export const ContentTypeEnum = z.enum([
    'text', 'markdown', 'html', 'voice_transcript',
    'code', 'file', 'image', 'location', 'contact', 'system'
]);
export const ProblemStatusEnum = z.enum(['open', 'investigating', 'resolved', 'closed']);

// ============================================================================
// CONVERSATION SCHEMAS
// ============================================================================

// Create 1-1 direct conversation
export const CreateDirectConversationSchema = z.object({
    participantId: z.string().min(1, 'Participant ID is required'),
    initialMessage: z.string().optional(),
});

export type CreateDirectConversation = z.infer<typeof CreateDirectConversationSchema>;

// Create AI assistant conversation
export const CreateAIConversationSchema = z.object({
    name: z.string().max(200).optional(),
    aiProvider: z.enum(['anthropic', 'google', 'openai']).default('anthropic'),
    aiModel: z.string().default('claude-sonnet-4-20250514'),
    aiSystemPrompt: z.string().max(10000).optional(),
    aiContext: z.array(z.object({
        type: z.enum(['entity', 'conversation', 'document', 'custom']),
        id: z.string(),
        label: z.string().optional(),
    })).optional(),
});

export type CreateAIConversation = z.infer<typeof CreateAIConversationSchema>;

// Create broadcast (1-n)
export const CreateBroadcastSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(1000).optional(),

    broadcastScope: BroadcastScopeEnum,
    broadcastRoleFilter: z.array(z.string()).optional(), // For 'role' scope
    broadcastTeamId: z.string().optional(), // For 'team' scope
    customRecipientIds: z.array(z.string()).optional(), // For 'custom' scope

    // Initial announcement
    subject: z.string().max(200).optional(),
    content: z.string().min(1).max(50000),
    contentType: z.enum(['text', 'markdown', 'html']).default('markdown'),

    // Options
    allowReplies: z.boolean().default(false),
});

export type CreateBroadcast = z.infer<typeof CreateBroadcastSchema>;

// Create group conversation
export const CreateGroupConversationSchema = z.object({
    name: z.string().min(2).max(200),
    description: z.string().max(1000).optional(),
    avatarUrl: z.string().url().optional(),

    participantIds: z.array(z.string()).min(1),
    initialMessage: z.string().optional(),

    // Node/Graph integration
    nodeId: z.string().optional(),
    graphPath: z.string().optional(),
});

export type CreateGroupConversation = z.infer<typeof CreateGroupConversationSchema>;

// Create meeting conversation
export const CreateMeetingConversationSchema = z.object({
    meetingId: z.string().min(1),
    name: z.string().optional(), // Defaults to meeting title
});

export type CreateMeetingConversation = z.infer<typeof CreateMeetingConversationSchema>;

// Create problem resolution conversation
export const CreateProblemResolutionSchema = z.object({
    problemTitle: z.string().min(5).max(200),
    description: z.string().max(5000).optional(),

    participantIds: z.array(z.string()).min(1),

    // Link to entity if applicable
    linkedEntityType: z.string().optional(),
    linkedEntityId: z.string().optional(),

    // Node/Graph integration
    nodeId: z.string().optional(),
});

export type CreateProblemResolution = z.infer<typeof CreateProblemResolutionSchema>;

// Generic conversation creation schema
export const CreateConversationSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('direct'), ...CreateDirectConversationSchema.shape }),
    z.object({ type: z.literal('ai_assistant'), ...CreateAIConversationSchema.shape }),
    z.object({ type: z.literal('broadcast'), ...CreateBroadcastSchema.shape }),
    z.object({ type: z.literal('group'), ...CreateGroupConversationSchema.shape }),
    z.object({ type: z.literal('meeting'), ...CreateMeetingConversationSchema.shape }),
    z.object({ type: z.literal('problem_resolution'), ...CreateProblemResolutionSchema.shape }),
]);

export type CreateConversation = z.infer<typeof CreateConversationSchema>;

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const SendMessageSchema = z.object({
    conversationId: z.string().min(1),
    content: z.string().min(1).max(100000),
    contentType: ContentTypeEnum.default('text'),

    // Threading
    replyToMessageId: z.string().optional(),

    // Mentions
    mentions: z.array(z.string()).optional(),

    // Entity linking (Node/Graph)
    linkedNodeId: z.string().optional(),
    linkedEntityType: z.string().optional(),
    linkedEntityId: z.string().optional(),

    // For problem resolution
    isSolution: z.boolean().default(false),

    // Metadata
    metadata: z.record(z.string(), z.any()).optional(),
});

export type SendMessage = z.infer<typeof SendMessageSchema>;

export const EditMessageSchema = z.object({
    messageId: z.string().min(1),
    content: z.string().min(1).max(100000),
});

export type EditMessage = z.infer<typeof EditMessageSchema>;

export const AddReactionSchema = z.object({
    messageId: z.string().min(1),
    emoji: z.string().min(1).max(10),
});

export type AddReaction = z.infer<typeof AddReactionSchema>;

// ============================================================================
// AI CONVERSATION SCHEMAS
// ============================================================================

export const SendAIMessageSchema = z.object({
    conversationId: z.string().min(1),
    content: z.string().min(1).max(50000),

    // Context for the AI
    additionalContext: z.array(z.object({
        type: z.enum(['entity', 'document', 'previous_conversation']),
        id: z.string(),
        content: z.string().optional(),
    })).optional(),

    // Override settings
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(100).max(100000).optional(),
});

export type SendAIMessage = z.infer<typeof SendAIMessageSchema>;

// ============================================================================
// MEETING NOTES SCHEMAS
// ============================================================================

export const CreateMeetingNoteSchema = z.object({
    meetingId: z.string().min(1),
    content: z.string().max(100000).default(''),
    contentFormat: z.enum(['text', 'markdown', 'rich_text']).default('markdown'),
    isPrivate: z.boolean().default(true),
});

export type CreateMeetingNote = z.infer<typeof CreateMeetingNoteSchema>;

export const UpdateMeetingNoteSchema = z.object({
    noteId: z.string().min(1),
    content: z.string().max(100000),
});

export type UpdateMeetingNote = z.infer<typeof UpdateMeetingNoteSchema>;

// ============================================================================
// TRANSCRIPT SCHEMAS
// ============================================================================

export const StartTranscriptionSchema = z.object({
    meetingId: z.string().min(1),
    deviceType: z.enum(['android', 'ios', 'web', 'desktop']),
    language: z.string().default('pt-BR'),
});

export type StartTranscription = z.infer<typeof StartTranscriptionSchema>;

export const AddTranscriptChunkSchema = z.object({
    meetingId: z.string().min(1),
    transcriptionId: z.string().min(1),
    rawTranscript: z.string().min(1),
    startTimestamp: z.number().int(),
    endTimestamp: z.number().int(),
    speakerLabels: z.record(z.string(), z.string()).optional(), // { "00:01:15": "Speaker 1" }
    confidenceScore: z.number().min(0).max(1).optional(),
});

export type AddTranscriptChunk = z.infer<typeof AddTranscriptChunkSchema>;

// ============================================================================
// AI SUMMARY SCHEMAS
// ============================================================================

export const GenerateSummarySchema = z.object({
    sourceType: z.enum(['meeting', 'conversation', 'transcript', 'problem_resolution', 'thread']),
    sourceId: z.string().min(1),

    // AI settings
    aiProvider: z.enum(['anthropic', 'google']).default('anthropic'),
    aiModel: z.string().optional(),

    // What to include
    includeKeyPoints: z.boolean().default(true),
    includeActionItems: z.boolean().default(true),
    includeDecisions: z.boolean().default(true),
    includeSentiment: z.boolean().default(false),

    // Language
    language: z.string().default('pt-BR'),

    // Custom prompt additions
    additionalInstructions: z.string().max(2000).optional(),
});

export type GenerateSummary = z.infer<typeof GenerateSummarySchema>;

// ============================================================================
// PROBLEM RESOLUTION SCHEMAS
// ============================================================================

export const ResolveProblemSchema = z.object({
    conversationId: z.string().min(1),
    solutionMessageId: z.string().optional(),
    resolution: z.string().min(10).max(10000),

    // Log to process discovery
    logToProcessDiscovery: z.boolean().default(true),
    linkedProcedureId: z.string().optional(),
});

export type ResolveProblem = z.infer<typeof ResolveProblemSchema>;

// ============================================================================
// CONVERSATION QUERY SCHEMAS
// ============================================================================

export const ListConversationsSchema = z.object({
    type: ConversationTypeEnum.optional(),
    includeArchived: z.boolean().default(false),
    isPinned: z.boolean().optional(),
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    cursor: z.string().optional(),
});

export type ListConversations = z.infer<typeof ListConversationsSchema>;

export const ListMessagesSchema = z.object({
    conversationId: z.string().min(1),
    before: z.number().int().optional(),
    after: z.number().int().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    threadRootId: z.string().optional(),
});

export type ListMessages = z.infer<typeof ListMessagesSchema>;

// ============================================================================
// PARTICIPANT MANAGEMENT
// ============================================================================

export const AddParticipantSchema = z.object({
    conversationId: z.string().min(1),
    userId: z.string().min(1),
    role: ParticipantRoleEnum.default('member'),
    canReply: z.boolean().default(true),
});

export type AddParticipant = z.infer<typeof AddParticipantSchema>;

export const UpdateParticipantSchema = z.object({
    conversationId: z.string().min(1),
    userId: z.string().min(1),
    role: ParticipantRoleEnum.optional(),
    isMuted: z.boolean().optional(),
    mutedUntil: z.number().int().optional(),
});

export type UpdateParticipant = z.infer<typeof UpdateParticipantSchema>;

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export const NotificationPreferencesSchema = z.object({
    conversationId: z.string().min(1),
    isMuted: z.boolean().optional(),
    mutedUntil: z.number().int().optional(),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// ============================================================================
// ATTACHMENT SCHEMAS
// ============================================================================

export const UploadAttachmentSchema = z.object({
    messageId: z.string().min(1),
    fileName: z.string().min(1).max(255),
    fileType: z.string().min(1), // MIME type
    fileSize: z.number().int().min(1).max(100 * 1024 * 1024), // Max 100MB
    fileUrl: z.string().url(),

    // For images/video
    thumbnailUrl: z.string().url().optional(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    durationSeconds: z.number().int().optional(),
});

export type UploadAttachment = z.infer<typeof UploadAttachmentSchema>;

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface ConversationWithParticipants {
    id: string;
    type: ConversationType;
    name: string | null;
    avatarUrl: string | null;
    lastMessage: {
        content: string;
        senderName: string;
        createdAt: number;
    } | null;
    participants: Array<{
        userId: string;
        name: string;
        avatarUrl: string | null;
        role: string;
    }>;
    unreadCount: number;
    isPinned: boolean;
    lastMessageAt: number | null;
}

export interface MessageWithSender {
    id: string;
    content: string;
    contentType: string;
    sender: {
        id: string | null;
        name: string;
        avatarUrl: string | null;
        type: string;
    };
    reactions: Record<string, string[]>;
    replyTo: {
        id: string;
        content: string;
        senderName: string;
    } | null;
    attachments: Array<{
        id: string;
        fileName: string;
        fileType: string;
        fileUrl: string;
        thumbnailUrl: string | null;
    }>;
    isSolution: boolean;
    isEdited: boolean;
    createdAt: number;
}

// ============================================================================
// AI PROMPT TEMPLATES
// ============================================================================

export const AI_SUMMARY_PROMPTS = {
    meeting: `Você é um assistente que cria resumos executivos de reuniões.
Analise a transcrição/mensagens da reunião e crie:

1. **Resumo Executivo** (2-3 parágrafos)
2. **Pontos-Chave** (lista de tópicos importantes discutidos)
3. **Decisões Tomadas** (lista de decisões finais)
4. **Itens de Ação** (tarefas atribuídas com responsável, se identificável)

Seja conciso mas completo. Use português brasileiro.`,

    problem_resolution: `Você é um assistente que documenta soluções de problemas.
Analise a conversa sobre resolução do problema e extraia:

1. **Problema Original** (descrição clara do problema)
2. **Investigação** (passos de diagnóstico realizados)
3. **Causa Raiz** (se identificada)
4. **Solução Aplicada** (passos exatos para resolver)
5. **Prevenção** (como evitar no futuro, se aplicável)

Formate para fácil referência futura.`,

    conversation: `Você é um assistente que cria resumos de conversas.
Analise as mensagens e crie:

1. **Resumo** (parágrafo único sobre o que foi discutido)
2. **Tópicos Principais** (lista de assuntos abordados)
3. **Próximos Passos** (se houver)

Seja objetivo e conciso.`,
};

// ============================================================================
// CONVERSATION TYPE HELPERS
// ============================================================================

export const CONVERSATION_TYPE_CONFIG: Record<ConversationType, {
    icon: string;
    color: string;
    label: string;
    description: string;
}> = {
    direct: {
        icon: 'IconMessage',
        color: 'blue',
        label: 'Conversa Direta',
        description: 'Conversa privada 1-1',
    },
    ai_assistant: {
        icon: 'IconRobot',
        color: 'violet',
        label: 'Assistente IA',
        description: 'Conversa com inteligência artificial',
    },
    broadcast: {
        icon: 'IconSpeakerphone',
        color: 'orange',
        label: 'Comunicado',
        description: 'Anúncio para grupos',
    },
    group: {
        icon: 'IconUsers',
        color: 'teal',
        label: 'Grupo',
        description: 'Conversa em grupo',
    },
    meeting: {
        icon: 'IconVideo',
        color: 'green',
        label: 'Reunião',
        description: 'Chat vinculado à reunião',
    },
    problem_resolution: {
        icon: 'IconBulb',
        color: 'yellow',
        label: 'Resolução de Problema',
        description: 'Discussão colaborativa com log de solução',
    },
    support: {
        icon: 'IconHeadset',
        color: 'pink',
        label: 'Suporte',
        description: 'Ticket de suporte',
    },
};

