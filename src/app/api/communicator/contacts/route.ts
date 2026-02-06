/**
 * Contacts API - Permission-Based Contact List
 * 
 * GET /api/communicator/contacts - Get contacts based on user's role hierarchy
 * 
 * Contact visibility rules:
 * - Everyone: Their own Synapse (AI companion)
 * - Owner/Admin: All org users
 * - Staff: Teachers, other staff, admin, owner
 * - Teacher: Other teachers, staff, admin, owner
 * - Parent: Teachers, staff, admin
 * - Student: Teachers, staff
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, conversationParticipants, conversations } from '@/lib/db/schema';
import { eq, and, inArray, ne, isNull } from 'drizzle-orm';

// Role hierarchy for contact visibility - maps user role to visible roles
// Must match schema: 'student' | 'parent' | 'teacher' | 'staff' | 'admin' | 'owner' | 'talent'
type SchemaRole = 'owner' | 'admin' | 'staff' | 'teacher' | 'parent' | 'student' | 'talent';
const CONTACT_VISIBILITY: Record<string, readonly SchemaRole[]> = {
    // Who each role can see
    owner: ['owner', 'admin', 'staff', 'teacher', 'parent', 'student', 'talent'] as const,
    admin: ['owner', 'admin', 'staff', 'teacher', 'parent', 'student', 'talent'] as const,
    staff: ['owner', 'admin', 'staff', 'teacher'] as const,
    teacher: ['owner', 'admin', 'staff', 'teacher', 'parent', 'student'] as const,
    parent: ['owner', 'admin', 'staff', 'teacher'] as const,
    student: ['teacher', 'staff'] as const,
    talent: ['owner', 'admin', 'staff'] as const,
} as const;

interface ContactResult {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
    role: string | null;
    isSynapse: boolean;
    conversationCount: number;
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const contacts: ContactResult[] = [];

        // 1. Always add Synapse (AI companion) first
        contacts.push({
            id: `synapse-${userId}`,
            name: 'Synapse',
            email: null,
            avatarUrl: null,
            role: 'ai_companion',
            isSynapse: true,
            conversationCount: 0,
        });

        // Get current user with their org
        const [currentUser] = await db.select({
            role: users.role,
            name: users.name,
            organizationId: users.organizationId,
        })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        // If user not found or no org, just return Synapse
        if (!currentUser) {
            return NextResponse.json({
                contacts,
                totalCount: contacts.length,
            });
        }

        const orgId = currentUser.organizationId;
        const userRole = currentUser.role || 'student';
        const visibleRoles = CONTACT_VISIBILITY[userRole] || ['teacher', 'staff'];

        // If user has no org, just return Synapse
        if (!orgId) {
            return NextResponse.json({
                contacts,
                totalCount: contacts.length,
            });
        }

        // 2. Get human contacts based on role visibility (wrapped in try-catch for resilience)
        try {
            // Using isNull(archivedAt) instead of isActive since schema uses archivedAt for soft delete
            const humanContacts = await db.select({
                id: users.id,
                name: users.name,
                email: users.email,
                avatarUrl: users.avatarUrl,
                role: users.role,
            })
                .from(users)
                .where(and(
                    eq(users.organizationId, orgId),
                    ne(users.id, userId), // Exclude self
                    isNull(users.archivedAt) // Only active users
                ))
                .orderBy(users.name)
                .limit(100);

            // 3. Enrich with conversation counts
            for (const contact of humanContacts) {
                // Filter by visible roles
                if (!visibleRoles.includes(contact.role as any)) continue;

                // Count conversations with this contact
                const convCount = await getConversationCount(userId, contact.id);

                contacts.push({
                    id: contact.id,
                    name: contact.name || 'Usuário',
                    email: contact.email,
                    avatarUrl: contact.avatarUrl,
                    role: contact.role,
                    isSynapse: false,
                    conversationCount: convCount,
                });
            }
        } catch (err) {
            console.error('Error fetching human contacts:', err);
            // Continue with just Synapse
        }

        // 4. Get Synapse conversation count
        try {
            const synapseConvs = await db.select({ id: conversations.id })
                .from(conversations)
                .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
                .where(and(
                    eq(conversationParticipants.userId, userId),
                    eq(conversations.type, 'ai_assistant')
                ))
                .limit(100);

            contacts[0].conversationCount = synapseConvs.length;
        } catch (err) {
            console.error('Error fetching synapse conversations:', err);
        }

        return NextResponse.json({
            contacts,
            totalCount: contacts.length,
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }
}

// Helper to count conversations between two users
async function getConversationCount(userId1: string, userId2: string): Promise<number> {
    try {
        // Get conversations where both users are participants
        const user1Convs = await db.select({ conversationId: conversationParticipants.conversationId })
            .from(conversationParticipants)
            .where(eq(conversationParticipants.userId, userId1));

        if (user1Convs.length === 0) return 0;

        const convIds = user1Convs.map(c => c.conversationId);

        const sharedConvs = await db.select({ id: conversationParticipants.conversationId })
            .from(conversationParticipants)
            .where(and(
                eq(conversationParticipants.userId, userId2),
                inArray(conversationParticipants.conversationId, convIds)
            ));

        return sharedConvs.length;
    } catch {
        return 0;
    }
}

