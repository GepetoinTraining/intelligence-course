import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { persons, organizationMemberships, organizations } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';
import { sendInviteEmail } from '@/lib/email';
import crypto from 'crypto';

// ============================================================================
// GET /api/invites — List pending invites for current org
// ============================================================================

export async function GET() {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const invites = await db
            .select({
                id: organizationMemberships.id,
                personId: organizationMemberships.personId,
                role: organizationMemberships.role,
                status: organizationMemberships.status,
                invitedAt: organizationMemberships.invitedAt,
                invitedBy: organizationMemberships.invitedBy,
                joinedAt: organizationMemberships.joinedAt,
                personName: persons.firstName,
                personLastName: persons.lastName,
                personEmail: persons.primaryEmail,
            })
            .from(organizationMemberships)
            .innerJoin(persons, eq(organizationMemberships.personId, persons.id))
            .where(
                and(
                    eq(organizationMemberships.organizationId, orgId),
                    eq(organizationMemberships.status, 'invited')
                )
            )
            .orderBy(desc(organizationMemberships.invitedAt));

        const data = invites.map(inv => ({
            id: inv.id,
            personId: inv.personId,
            name: [inv.personName, inv.personLastName].filter(Boolean).join(' '),
            email: inv.personEmail,
            role: inv.role,
            status: inv.status,
            invitedAt: inv.invitedAt,
        }));

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error listing invites:', error);
        return NextResponse.json({ error: 'Failed to list invites' }, { status: 500 });
    }
}


// ============================================================================
// POST /api/invites — Create invite: person + membership + send email
// ============================================================================

export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { firstName, lastName, email, role } = body;

        if (!firstName || !email || !role) {
            return NextResponse.json(
                { error: 'firstName, email, and role are required' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['admin', 'teacher', 'staff', 'accountant', 'support'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
                { status: 400 }
            );
        }

        // Check if person with this email already exists
        const existingPerson = await db
            .select()
            .from(persons)
            .where(eq(persons.primaryEmail, email.toLowerCase().trim()))
            .limit(1);

        let targetPersonId: string;

        if (existingPerson.length > 0) {
            targetPersonId = existingPerson[0].id;

            // Check if already a member of this org
            const existingMembership = await db
                .select()
                .from(organizationMemberships)
                .where(
                    and(
                        eq(organizationMemberships.personId, targetPersonId),
                        eq(organizationMemberships.organizationId, orgId)
                    )
                )
                .limit(1);

            if (existingMembership.length > 0) {
                const m = existingMembership[0];
                if (m.status === 'active') {
                    return NextResponse.json(
                        { error: 'Esta pessoa já é membro ativo da organização' },
                        { status: 409 }
                    );
                }
                if (m.status === 'invited') {
                    // Re-send the invite email
                    // Fall through to the email sending logic below
                }
            }
        } else {
            // Create new person
            const newPerson = await db.insert(persons).values({
                firstName: firstName.trim(),
                lastName: lastName?.trim() || null,
                primaryEmail: email.toLowerCase().trim(),
                status: 'active',
            }).returning();
            targetPersonId = newPerson[0].id;
        }

        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const now = Math.floor(Date.now() / 1000);

        // Upsert membership (create or update to 'invited')
        const existingMem = await db
            .select()
            .from(organizationMemberships)
            .where(
                and(
                    eq(organizationMemberships.personId, targetPersonId),
                    eq(organizationMemberships.organizationId, orgId)
                )
            )
            .limit(1);

        let membershipId: string;

        if (existingMem.length > 0) {
            // Update existing
            membershipId = existingMem[0].id;
            await db
                .update(organizationMemberships)
                .set({
                    role: role,
                    status: 'invited',
                    invitedAt: now,
                    invitedBy: personId,
                    notificationPreferences: JSON.stringify({ inviteToken }),
                    updatedAt: now,
                })
                .where(eq(organizationMemberships.id, membershipId));
        } else {
            // Create new membership
            const newMem = await db.insert(organizationMemberships).values({
                organizationId: orgId,
                personId: targetPersonId,
                role: role,
                status: 'invited',
                invitedAt: now,
                invitedBy: personId,
                notificationPreferences: JSON.stringify({ inviteToken }),
            }).returning();
            membershipId = newMem[0].id;
        }

        // Get inviter info and org name for email
        const inviter = await db
            .select({ firstName: persons.firstName, lastName: persons.lastName })
            .from(persons)
            .where(eq(persons.id, personId))
            .limit(1);

        const org = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, orgId))
            .limit(1);

        const inviterName = inviter.length > 0
            ? [inviter[0].firstName, inviter[0].lastName].filter(Boolean).join(' ')
            : 'Um proprietário';
        const orgName = org.length > 0 ? org[0].name : 'a organização';

        // Build join URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';
        const joinUrl = `${baseUrl}/join?token=${inviteToken}`;

        // Send invite email
        const emailResult = await sendInviteEmail({
            to: email.toLowerCase().trim(),
            inviterName,
            orgName,
            role,
            inviteeName: firstName,
            joinUrl,
        });

        return NextResponse.json({
            data: {
                membershipId,
                personId: targetPersonId,
                email: email.toLowerCase().trim(),
                role,
                status: 'invited',
                emailSent: emailResult.success,
                joinUrl, // Also return this so owner can copy+share manually
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating invite:', error);
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }
}
