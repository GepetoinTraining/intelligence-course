import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { chatSessions, chatMessages, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { encrypt, decrypt, deriveStudentKey } from '@/lib/crypto';

// GET /api/chat/sessions - Get user's chat sessions
export async function GET(req: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        // Parse query params
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const sessions = await db.select()
            .from(chatSessions)
            .where(eq(chatSessions.studentId, dbUser.id))
            .orderBy(desc(chatSessions.startedAt))
            .limit(limit);

        // Return sessions without message content (encrypted)
        return NextResponse.json({
            data: sessions.map(s => ({
                id: s.id,
                startedAt: s.startedAt,
                endedAt: s.endedAt,
                messageCount: s.messageCount,
                metadata: s.metadata,
            })),
            meta: { total: sessions.length }
        });
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch chat sessions' } }, { status: 500 });
    }
}

// POST /api/chat/sessions - Start a new chat session
export async function POST(req: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!dbUser) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
        }

        const now = Math.floor(Date.now() / 1000);

        const [newSession] = await db.insert(chatSessions).values({
            studentId: dbUser.id,
            organizationId: dbUser.organizationId!,
            startedAt: now,
            messageCount: 0,
            metadata: JSON.stringify({ tokens: 0 }),
        }).returning();

        return NextResponse.json({
            data: newSession,
            meta: { created: true }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating chat session:', error);
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create chat session' } }, { status: 500 });
    }
}



