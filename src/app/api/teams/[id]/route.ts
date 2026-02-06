import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { teams, teamMembers, teamPositions, users, persons } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const teamUpdateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    teamType: z.enum(['department', 'squad', 'chapter', 'guild', 'tribe', 'project', 'committee', 'other']).optional(),
    parentTeamId: z.string().optional().nullable(),
    icon: z.string().optional(),
    color: z.string().optional(),
    isActive: z.boolean().optional(),
    settings: z.record(z.string(), z.any()).optional(),
});

const addMemberSchema = z.object({
    userId: z.string(),
    positionId: z.string(),
    memberRole: z.enum(['owner', 'lead', 'member', 'guest', 'observer']).default('member'),
    customTitle: z.string().optional(),
    employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern', 'volunteer']).default('full_time'),
    allocation: z.number().min(0).max(1).default(1.0),
    reportsToMemberId: z.string().optional(),
});

// GET /api/teams/[id] - Get single team with members
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId: organizationId } = await auth();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get team
        const [team] = await db
            .select()
            .from(teams)
            .where(
                and(
                    eq(teams.id, id),
                    eq(teams.organizationId, organizationId),
                    isNull(teams.archivedAt)
                )
            )
            .limit(1);

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Get members with user and position details
        const members = await db
            .select({
                id: teamMembers.id,
                personId: teamMembers.personId,
                positionId: teamMembers.positionId,
                memberRole: teamMembers.memberRole,
                customTitle: teamMembers.customTitle,
                employmentType: teamMembers.employmentType,
                allocation: teamMembers.allocation,
                reportsToMemberId: teamMembers.reportsToMemberId,
                isActive: teamMembers.isActive,
                startDate: teamMembers.startDate,
                endDate: teamMembers.endDate,
                personName: persons.firstName,
                personEmail: persons.primaryEmail,
                personAvatar: persons.avatarUrl,
                positionName: teamPositions.name,
                positionLevel: teamPositions.level,
                positionType: teamPositions.positionType,
            })
            .from(teamMembers)
            .leftJoin(persons, eq(teamMembers.personId, persons.id))
            .leftJoin(teamPositions, eq(teamMembers.positionId, teamPositions.id))
            .where(eq(teamMembers.teamId, id));

        // Get child teams
        const childTeams = await db
            .select({
                id: teams.id,
                name: teams.name,
                slug: teams.slug,
                teamType: teams.teamType,
                icon: teams.icon,
                color: teams.color,
            })
            .from(teams)
            .where(
                and(
                    eq(teams.parentTeamId, id),
                    eq(teams.organizationId, organizationId),
                    isNull(teams.archivedAt)
                )
            );

        return NextResponse.json({
            data: {
                ...team,
                settings: JSON.parse(team.settings || '{}'),
                members,
                childTeams,
            }
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }
}

// PUT /api/teams/[id] - Update team
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId: organizationId } = await auth();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = teamUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
        }

        // Verify team exists
        const [existing] = await db
            .select({ id: teams.id })
            .from(teams)
            .where(
                and(
                    eq(teams.id, id),
                    eq(teams.organizationId, organizationId)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const data = parsed.data;

        // Prevent circular parent reference
        if (data.parentTeamId === id) {
            return NextResponse.json({ error: 'Team cannot be its own parent' }, { status: 400 });
        }

        const [updated] = await db
            .update(teams)
            .set({
                name: data.name,
                description: data.description,
                teamType: data.teamType,
                parentTeamId: data.parentTeamId,
                icon: data.icon,
                color: data.color,
                isActive: data.isActive,
                settings: data.settings ? JSON.stringify(data.settings) : undefined,
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(teams.id, id))
            .returning();

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error('Error updating team:', error);
        return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
    }
}

// DELETE /api/teams/[id] - Archive team
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId: organizationId } = await auth();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify team exists
        const [existing] = await db
            .select({ id: teams.id })
            .from(teams)
            .where(
                and(
                    eq(teams.id, id),
                    eq(teams.organizationId, organizationId)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Check for child teams
        const childTeams = await db
            .select({ id: teams.id })
            .from(teams)
            .where(
                and(
                    eq(teams.parentTeamId, id),
                    isNull(teams.archivedAt)
                )
            )
            .limit(1);

        if (childTeams.length > 0) {
            return NextResponse.json({ error: 'Cannot archive team with child teams' }, { status: 400 });
        }

        // Archive the team
        await db
            .update(teams)
            .set({
                archivedAt: Math.floor(Date.now() / 1000),
                isActive: false,
            })
            .where(eq(teams.id, id));

        // Deactivate all memberships
        await db
            .update(teamMembers)
            .set({
                isActive: false,
                endDate: Math.floor(Date.now() / 1000),
            })
            .where(eq(teamMembers.teamId, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error archiving team:', error);
        return NextResponse.json({ error: 'Failed to archive team' }, { status: 500 });
    }
}

// POST /api/teams/[id] - Add member to team
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId, orgId: organizationId } = await auth();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const parsed = addMemberSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
        }

        // Verify team exists
        const [team] = await db
            .select({ id: teams.id })
            .from(teams)
            .where(
                and(
                    eq(teams.id, id),
                    eq(teams.organizationId, organizationId)
                )
            )
            .limit(1);

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const data = parsed.data;

        // Verify user exists
        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, data.userId))
            .limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify position exists
        const [position] = await db
            .select({ id: teamPositions.id })
            .from(teamPositions)
            .where(
                and(
                    eq(teamPositions.id, data.positionId),
                    eq(teamPositions.organizationId, organizationId)
                )
            )
            .limit(1);

        if (!position) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        // Check if already a member
        const [existingMember] = await db
            .select({ id: teamMembers.id })
            .from(teamMembers)
            .where(
                and(
                    eq(teamMembers.teamId, id),
                    eq(teamMembers.userId, data.userId)
                )
            )
            .limit(1);

        if (existingMember) {
            return NextResponse.json({ error: 'User is already a member of this team' }, { status: 409 });
        }

        // Add member
        const [newMember] = await db.insert(teamMembers).values({
            teamId: id,
            userId: data.userId,
            positionId: data.positionId,
            memberRole: data.memberRole,
            customTitle: data.customTitle,
            employmentType: data.employmentType,
            allocation: data.allocation,
            reportsToMemberId: data.reportsToMemberId,
        }).returning();

        return NextResponse.json({ data: newMember }, { status: 201 });
    } catch (error) {
        console.error('Error adding member:', error);
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
}
