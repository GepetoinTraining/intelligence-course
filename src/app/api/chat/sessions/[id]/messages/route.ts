import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatSessions, chatMessages, users } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { encrypt, decrypt, deriveStudentKey } from '@/lib/crypto';

// GET /api/chat/sessions/[id]/messages - Get messages for a session (decrypted)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const { id } = await params;

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, personId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        // Verify session belongs to user
        const session = await db.query.chatSessions.findFirst({
            where: and(
                eq(chatSessions.id, id),
                eq(chatSessions.studentId, dbUser.id)
            ),
        });

        if (!session) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 });
        }

        const messages = await db.select()
            .from(chatMessages)
            .where(eq(chatMessages.sessionId, id))
            .orderBy(chatMessages.timestamp);

        // Derive encryption key for this student
        const key = deriveStudentKey(dbUser.id);

        // Decrypt messages
        const decryptedMessages = messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: decrypt(msg.contentEncrypted, key),
            timestamp: msg.timestamp,
            tokensUsed: msg.tokensUsed,
        }));

        return NextResponse.json({
            data: decryptedMessages,
            meta: { sessionId: id, total: messages.length }
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } }, { status: 500 });
    }
}

// POST /api/chat/sessions/[id]/messages - Add a message to the session
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const { id } = await params;

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, personId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        const session = await db.query.chatSessions.findFirst({
            where: and(
                eq(chatSessions.id, id),
                eq(chatSessions.studentId, dbUser.id)
            ),
        });

        if (!session) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 });
        }

        const body = await req.json();
        const { role, content, tokensUsed = 0 } = body;

        if (!role || !content) {
            return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Role and content are required' } }, { status: 400 });
        }

        // Derive encryption key and encrypt content
        const key = deriveStudentKey(dbUser.id);
        const encryptedContent = encrypt(content, key);

        const now = Math.floor(Date.now() / 1000);

        const [newMessage] = await db.insert(chatMessages).values({
            sessionId: id,
            role,
            contentEncrypted: encryptedContent,
            timestamp: now,
            tokensUsed,
        }).returning();

        // Update session message count
        await db.update(chatSessions)
            .set({
                messageCount: sql`${chatSessions.messageCount} + 1`,
            })
            .where(eq(chatSessions.id, id));

        return NextResponse.json({
            data: {
                id: newMessage.id,
                role: newMessage.role,
                content, // Return unencrypted for convenience
                timestamp: newMessage.timestamp,
                tokensUsed: newMessage.tokensUsed,
            },
            meta: { sessionId: id }
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding chat message:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add message' } }, { status: 500 });
    }
}
