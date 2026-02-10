import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { persons, organizationMemberships, organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// GET /api/invites/[token] — Verify invite token and return details
// ============================================================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    if (!token || token.length < 32) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    try {
        // Find membership with this invite token
        // Token is stored in notificationPreferences JSON
        const allInvited = await db
            .select({
                id: organizationMemberships.id,
                personId: organizationMemberships.personId,
                organizationId: organizationMemberships.organizationId,
                role: organizationMemberships.role,
                status: organizationMemberships.status,
                invitedAt: organizationMemberships.invitedAt,
                notificationPreferences: organizationMemberships.notificationPreferences,
            })
            .from(organizationMemberships)
            .where(eq(organizationMemberships.status, 'invited'));

        // Find the one with matching token
        const membership = allInvited.find(m => {
            try {
                const prefs = JSON.parse(m.notificationPreferences || '{}');
                return prefs.inviteToken === token;
            } catch {
                return false;
            }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
        }

        // Check expiration (7 days)
        const now = Math.floor(Date.now() / 1000);
        const sevenDays = 7 * 24 * 60 * 60;
        if (membership.invitedAt && (now - membership.invitedAt) > sevenDays) {
            return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
        }

        // Get person and org info
        const person = await db
            .select({ firstName: persons.firstName, lastName: persons.lastName, email: persons.primaryEmail })
            .from(persons)
            .where(eq(persons.id, membership.personId))
            .limit(1);

        const org = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, membership.organizationId))
            .limit(1);

        return NextResponse.json({
            data: {
                membershipId: membership.id,
                personId: membership.personId,
                organizationId: membership.organizationId,
                role: membership.role,
                orgName: org[0]?.name || 'Organização',
                inviteeName: person[0] ? [person[0].firstName, person[0].lastName].filter(Boolean).join(' ') : '',
                inviteeEmail: person[0]?.email || '',
                invitedAt: membership.invitedAt,
            }
        });
    } catch (error) {
        console.error('Error verifying invite:', error);
        return NextResponse.json({ error: 'Failed to verify invite' }, { status: 500 });
    }
}

// ============================================================================
// POST /api/invites/[token] — Accept invite (link Clerk user → activate membership)
// ============================================================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    try {
        const body = await request.json();
        const { clerkUserId } = body;

        // Find the invite
        const allInvited = await db
            .select()
            .from(organizationMemberships)
            .where(eq(organizationMemberships.status, 'invited'));

        const membership = allInvited.find(m => {
            try {
                const prefs = JSON.parse(m.notificationPreferences || '{}');
                return prefs.inviteToken === token;
            } catch {
                return false;
            }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 });
        }

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        const sevenDays = 7 * 24 * 60 * 60;
        if (membership.invitedAt && (now - membership.invitedAt) > sevenDays) {
            return NextResponse.json({ error: 'Invite expired' }, { status: 410 });
        }

        // Activate the membership
        const cleanPrefs = JSON.parse(membership.notificationPreferences || '{}');
        delete cleanPrefs.inviteToken; // Remove used token

        await db
            .update(organizationMemberships)
            .set({
                status: 'active',
                joinedAt: now,
                notificationPreferences: JSON.stringify(cleanPrefs),
                updatedAt: now,
            })
            .where(eq(organizationMemberships.id, membership.id));

        // If we have clerkUserId, link the person record to the users table
        if (clerkUserId) {
            const { users } = await import('@/lib/db/schema');

            // Check if user already exists (users.id IS the Clerk user_id)
            const existingUser = await db
                .select()
                .from(users)
                .where(eq(users.id, clerkUserId))
                .limit(1);

            if (existingUser.length === 0) {
                // Get person info
                const person = await db
                    .select()
                    .from(persons)
                    .where(eq(persons.id, membership.personId))
                    .limit(1);

                if (person.length > 0) {
                    await db.insert(users).values({
                        id: clerkUserId,  // users.id = Clerk user_id
                        personId: membership.personId,
                        organizationId: membership.organizationId,
                        name: [person[0].firstName, person[0].lastName].filter(Boolean).join(' '),
                        email: person[0].primaryEmail || '',
                        role: membership.role as any,
                        avatarUrl: person[0].avatarUrl,
                        preferences: '{}',
                    });
                }
            } else {
                // Link existing user to this person if not already linked
                if (!existingUser[0].personId) {
                    await db
                        .update(users)
                        .set({ personId: membership.personId })
                        .where(eq(users.id, clerkUserId));
                }
            }
        }

        return NextResponse.json({
            data: {
                membershipId: membership.id,
                organizationId: membership.organizationId,
                role: membership.role,
                status: 'active',
                message: 'Convite aceito com sucesso!',
            }
        });
    } catch (error) {
        console.error('Error accepting invite:', error);
        return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
    }
}
