import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { teams, teamMembers, teamPositions, users } from '@/lib/db/schema';
import { eq, and, desc, isNull, count, sql } from 'drizzle-orm';
import { z } from 'zod';

// Schema for creating/updating teams
const teamSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(50).optional(),
    description: z.string().max(1000).optional(),
    teamType: z.enum(['department', 'squad', 'chapter', 'guild', 'tribe', 'project', 'committee', 'other']).default('squad'),
    parentTeamId: z.string().optional().nullable(),
    icon: z.string().optional(),
    color: z.string().optional(),
    settings: z.record(z.string(), z.any()).optional(),
});

// GET /api/teams - List all teams
export async function GET(request: NextRequest) {
    try {
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        const { searchParams } = new URL(request.url);
        const includeMembers = searchParams.get('includeMembers') === 'true';
        const parentId = searchParams.get('parentId');
        const type = searchParams.get('type');

        // Build query
        let query = db
            .select({
                id: teams.id,
                name: teams.name,
                slug: teams.slug,
                description: teams.description,
                teamType: teams.teamType,
                parentTeamId: teams.parentTeamId,
                icon: teams.icon,
                color: teams.color,
                isActive: teams.isActive,
                createdAt: teams.createdAt,
                memberCount: sql<number>`(SELECT COUNT(*) FROM team_members WHERE team_id = teams.id AND is_active = 1)`,
            })
            .from(teams)
            .where(
                and(
                    eq(teams.organizationId, organizationId),
                    isNull(teams.archivedAt),
                    parentId ? eq(teams.parentTeamId, parentId) : undefined,
                    type ? eq(teams.teamType, type as any) : undefined,
                )
            )
            .orderBy(teams.name);

        const teamList = await query;

        // If including members, fetch them
        if (includeMembers) {
            const teamsWithMembers = await Promise.all(
                teamList.map(async (team) => {
                    const members = await db
                        .select({
                            id: teamMembers.id,
                            userId: teamMembers.userId,
                            positionId: teamMembers.positionId,
                            memberRole: teamMembers.memberRole,
                            customTitle: teamMembers.customTitle,
                            allocation: teamMembers.allocation,
                            userName: users.name,
                            userEmail: users.email,
                            userAvatar: users.avatarUrl,
                            positionName: teamPositions.name,
                        })
                        .from(teamMembers)
                        .leftJoin(users, eq(teamMembers.userId, users.id))
                        .leftJoin(teamPositions, eq(teamMembers.positionId, teamPositions.id))
                        .where(
                            and(
                                eq(teamMembers.teamId, team.id),
                                eq(teamMembers.isActive, true)
                            )
                        );
                    return { ...team, members };
                })
            );
            return NextResponse.json({ data: teamsWithMembers });
        }

        return NextResponse.json({ data: teamList });
    } catch (error) {
        console.error('Error fetching teams:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
    try {
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = teamSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
        }

        const data = parsed.data;

        // Generate slug if not provided
        const slug = data.slug || data.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check if slug is unique
        const existing = await db
            .select({ id: teams.id })
            .from(teams)
            .where(
                and(
                    eq(teams.organizationId, organizationId),
                    eq(teams.slug, slug)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Team with this slug already exists' }, { status: 409 });
        }

        // Validate parent team if provided
        if (data.parentTeamId) {
            const parent = await db
                .select({ id: teams.id })
                .from(teams)
                .where(
                    and(
                        eq(teams.id, data.parentTeamId),
                        eq(teams.organizationId, organizationId)
                    )
                )
                .limit(1);

            if (parent.length === 0) {
                return NextResponse.json({ error: 'Parent team not found' }, { status: 404 });
            }
        }

        // Create team
        const [newTeam] = await db.insert(teams).values({
            organizationId,
            name: data.name,
            slug,
            description: data.description,
            teamType: data.teamType,
            parentTeamId: data.parentTeamId || null,
            icon: data.icon || 'IconUsers',
            color: data.color || 'blue',
            settings: JSON.stringify(data.settings || {}),
            createdBy: userId,
        }).returning();

        return NextResponse.json({ data: newTeam }, { status: 201 });
    } catch (error) {
        console.error('Error creating team:', error);
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }
}



