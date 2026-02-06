import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, persons, organizationMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Join users -> persons to get canonical identity data
        const result = await db
            .select({
                id: users.id,
                personId: users.personId,
                email: persons.primaryEmail,
                name: persons.firstName,
                avatarUrl: persons.avatarUrl,
                preferences: users.preferences,
                onboardingCompleted: users.onboardingCompleted,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .leftJoin(persons, eq(users.personId, persons.id))
            .where(eq(users.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get role from organizationMemberships
        let role = 'student'; // default
        if (orgId) {
            const [membership] = await db
                .select({ role: organizationMemberships.role })
                .from(organizationMemberships)
                .where(and(
                    eq(organizationMemberships.personId, result[0].personId!),
                    eq(organizationMemberships.organizationId, orgId)
                ))
                .limit(1);
            if (membership) {
                role = membership.role;
            }
        }

        return NextResponse.json({
            data: {
                ...result[0],
                role,
                organizationId: orgId,
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId: authPersonId, orgId } = await getApiAuthWithOrg();
    if (!authPersonId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // First get the user to find their personId
        const [user] = await db
            .select({ personId: users.personId })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update persons table for identity fields
        if ((body.name || body.avatarUrl) && user.personId) {
            await db
                .update(persons)
                .set({
                    firstName: body.name,
                    avatarUrl: body.avatarUrl,
                    updatedAt: Date.now(),
                })
                .where(eq(persons.id, user.personId));
        }

        // Update users table for preferences only
        if (body.preferences) {
            await db
                .update(users)
                .set({
                    preferences: body.preferences,
                    updatedAt: Date.now(),
                })
                .where(eq(users.id, id));
        }

        // Return the updated data
        const [updated] = await db
            .select({
                id: users.id,
                personId: users.personId,
                email: persons.primaryEmail,
                name: persons.firstName,
                avatarUrl: persons.avatarUrl,
                preferences: users.preferences,
            })
            .from(users)
            .leftJoin(persons, eq(users.personId, persons.id))
            .where(eq(users.id, id))
            .limit(1);

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Soft delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(users)
            .set({
                archivedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(users.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
