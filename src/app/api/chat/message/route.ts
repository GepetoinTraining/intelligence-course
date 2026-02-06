import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatSessions, chatMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/chat/message - Send message to AI Companion (non-streaming)
export async function POST(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { sessionId, message, context } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        let activeSessionId = sessionId;

        // Create session if not provided
        if (!activeSessionId) {
            if (!orgId) {
                return NextResponse.json({ error: 'Organization required' }, { status: 400 });
            }
            const newSession = await db.insert(chatSessions).values({
                studentId: userId,
                organizationId: orgId,
            }).returning();
            activeSessionId = newSession[0].id;
        }

        // Store user message (encrypted in production)
        const userMessage = await db.insert(chatMessages).values({
            sessionId: activeSessionId,
            role: 'user',
            contentEncrypted: message, // In production, encrypt with student key
        }).returning();

        // Here you would call Anthropic API
        // For now, return a placeholder indicating where AI response goes
        const aiResponsePlaceholder = {
            id: 'pending',
            sessionId: activeSessionId,
            role: 'assistant',
            content: '[AI response would be generated here with Anthropic API]',
            note: 'Configure ANTHROPIC_API_KEY to enable AI responses'
        };

        // Update session message count
        const currentSession = await db.select().from(chatSessions)
            .where(eq(chatSessions.id, activeSessionId)).limit(1);

        await db.update(chatSessions).set({
            messageCount: (currentSession[0]?.messageCount || 0) + 1,
        }).where(eq(chatSessions.id, activeSessionId));

        return NextResponse.json({
            data: {
                sessionId: activeSessionId,
                userMessage: userMessage[0],
                aiResponse: aiResponsePlaceholder,
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

