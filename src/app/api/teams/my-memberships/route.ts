import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { teams, teamMembers, teamPositions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/teams/my-memberships
 * 
 * Returns all team memberships for the current user.
 * Used by AdminSidebar to determine which bundles a multi-hat user can see.
 * 
 * A person on both Marketing and Sales teams will get both memberships returned,
 * enabling the sidebar to show both bundles.
 */
export async function GET(request: NextRequest) {
    try {
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all active team memberships for this person, joined with team and position info
        const memberships = await db
            .select({
                teamId: teams.id,
                teamSlug: teams.slug,
                teamName: teams.name,
                teamType: teams.teamType,
                teamColor: teams.color,
                teamIcon: teams.icon,
                positionId: teamPositions.id,
                positionName: teamPositions.name,
                positionType: teamPositions.positionType,
                isLeadership: teamPositions.isLeadership,
                canManage: teamPositions.canManage,
                memberRole: teamMembers.memberRole,
                customTitle: teamMembers.customTitle,
                allocation: teamMembers.allocation,
            })
            .from(teamMembers)
            .innerJoin(teams, and(
                eq(teamMembers.teamId, teams.id),
                eq(teams.organizationId, organizationId),
            ))
            .innerJoin(teamPositions, eq(teamMembers.positionId, teamPositions.id))
            .where(
                and(
                    eq(teamMembers.personId, personId),
                    eq(teamMembers.isActive, true),
                )
            );

        return NextResponse.json({ memberships });
    } catch (error) {
        console.error('Error fetching user team memberships:', error);
        return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }
}
