// Communications Module Types

export interface Conversation {
    id: string;
    organizationId: string;
    type: 'direct' | 'group' | 'channel';
    name?: string;
    participants: ConversationParticipant[];
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationParticipant {
    id: string;
    conversationId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
    lastReadAt?: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video';
    attachments?: MessageAttachment[];
    replyToId?: string;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
}

export interface MessageAttachment {
    id: string;
    messageId: string;
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface Announcement {
    id: string;
    organizationId: string;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    audience: AnnouncementAudience;
    publishedAt?: Date;
    expiresAt?: Date;
    status: 'draft' | 'published' | 'archived';
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AnnouncementAudience {
    type: 'all' | 'roles' | 'users' | 'classes';
    roleIds?: string[];
    userIds?: string[];
    classIds?: string[];
}

export interface MessageTemplate {
    id: string;
    organizationId: string;
    name: string;
    content: string;
    type: 'email' | 'sms' | 'whatsapp' | 'push';
    category: string;
    variables?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface WhatsAppMessage {
    id: string;
    organizationId: string;
    contactPhone: string;
    direction: 'inbound' | 'outbound';
    content: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video';
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    templateId?: string;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    createdAt: Date;
}

export interface Draft {
    id: string;
    organizationId: string;
    userId: string;
    conversationId?: string;
    recipientIds?: string[];
    subject?: string;
    content: string;
    attachments?: MessageAttachment[];
    createdAt: Date;
    updatedAt: Date;
}

