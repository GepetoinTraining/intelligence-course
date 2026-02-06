/**
 * Team Anunciação API
 * 
 * GET  - Get current/active anunciação for team
 * POST - Create new anunciação (for new leader)
 * PATCH - Update draft quarters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { anunciacoes, teams, teamMembers, users, persons, orgAnunciacaoSettings } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

type Params = Promise<{ id: string }>;

// GET - Get current anunciação for team
export async function GET(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: teamId } = await params;
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();

        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the team
        const team = await db.query.teams.findFirst({
            where: and(
                eq(teams.id, teamId),
                eq(teams.organizationId, organizationId)
            ),
        });

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Get the active anunciação
        const activeAnunciacao = await db.query.anunciacoes.findFirst({
            where: and(
                eq(anunciacoes.teamId, teamId),
                eq(anunciacoes.status, 'active')
            ),
        });

        // Get org settings
        const settings = await db.query.orgAnunciacaoSettings.findFirst({
            where: eq(orgAnunciacaoSettings.orgId, organizationId),
        });

        // Get the current user's record
        const user = await db.query.users.findFirst({
            where: eq(users.id, personId),
        });

        // Check if user is a team leader (memberRole = 'owner' or 'lead')
        const isLeader = await db.query.teamMembers.findFirst({
            where: and(
                eq(teamMembers.teamId, teamId),
                eq(teamMembers.personId, personId),
                or(
                    eq(teamMembers.memberRole, 'owner'),
                    eq(teamMembers.memberRole, 'lead')
                )
            ),
        });

        // Get author info if there's an active anunciação
        let authorInfo = null;
        if (activeAnunciacao) {
            const author = await db.query.persons.findFirst({
                where: eq(persons.id, activeAnunciacao.authorPersonId),
                columns: { id: true, displayName: true, firstName: true, lastName: true },
            });
            authorInfo = author;
        }

        // Check if user has a draft (using personId from user record)
        const myDraft = user?.personId ? await db.query.anunciacoes.findFirst({
            where: and(
                eq(anunciacoes.teamId, teamId),
                eq(anunciacoes.authorPersonId, user.personId),
                eq(anunciacoes.status, 'draft')
            ),
        }) : null;

        return NextResponse.json({
            team: {
                id: team.id,
                name: team.name,
            },
            anunciacao: activeAnunciacao ? {
                ...activeAnunciacao,
                author: authorInfo,
            } : null,
            myDraft: myDraft,
            isLeader: !!isLeader,
            settings: {
                enabled: settings?.enabled === 1,
                requiredForTeamAccess: settings?.requiredForTeamAccess === 1,
                visibility: settings?.visibility || 'org_wide',
            },
            isLocked: (settings?.enabled === 1) &&
                (settings?.requiredForTeamAccess === 1) &&
                !activeAnunciacao,
        });
    } catch (error) {
        console.error('Error fetching team anunciação:', error);
        return NextResponse.json({ error: 'Failed to fetch anunciação' }, { status: 500 });
    }
}

// POST - Create new anunciação draft
export async function POST(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: teamId } = await params;
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();

        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's person record
        const user = await db.query.users.findFirst({
            where: eq(users.id, personId),
        });

        if (!user?.personId) {
            return NextResponse.json({ error: 'User not linked to person' }, { status: 400 });
        }

        // Verify user is team leader (memberRole = 'owner' or 'lead')
        const membership = await db.query.teamMembers.findFirst({
            where: and(
                eq(teamMembers.teamId, teamId),
                eq(teamMembers.personId, personId),
                or(
                    eq(teamMembers.memberRole, 'owner'),
                    eq(teamMembers.memberRole, 'lead')
                )
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: 'Only team leaders can create anunciações' }, { status: 403 });
        }

        // Check for existing draft
        const existingDraft = await db.query.anunciacoes.findFirst({
            where: and(
                eq(anunciacoes.teamId, teamId),
                eq(anunciacoes.authorPersonId, user.personId),
                eq(anunciacoes.status, 'draft')
            ),
        });

        if (existingDraft) {
            return NextResponse.json({
                anunciacao: existingDraft,
                message: 'Draft already exists'
            });
        }

        const now = Math.floor(Date.now() / 1000);

        const [anunciacao] = await db.insert(anunciacoes).values({
            organizationId,
            teamId,
            authorPersonId: user.personId,
            status: 'draft',
            tenureStartedAt: now,
            createdAt: now,
            updatedAt: now,
        }).returning();

        return NextResponse.json({
            anunciacao,
            message: 'Draft created'
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating anunciação:', error);
        return NextResponse.json({ error: 'Failed to create anunciação' }, { status: 500 });
    }
}

// PATCH - Update anunciação draft
export async function PATCH(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: teamId } = await params;
        const { personId, orgId: organizationId } = await getApiAuthWithOrg();

        if (!personId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { anunciacaoId, quarter1Content, quarter2Content, quarter3Content,
            quarter4AiContent, closingContent, aiQuarterEdited } = body;

        // Get user's person record
        const user = await db.query.users.findFirst({
            where: eq(users.id, personId),
        });

        if (!user?.personId) {
            return NextResponse.json({ error: 'User not linked to person' }, { status: 400 });
        }

        // Get the anunciação
        const anunciacao = await db.query.anunciacoes.findFirst({
            where: and(
                eq(anunciacoes.id, anunciacaoId),
                eq(anunciacoes.authorPersonId, user.personId),
                eq(anunciacoes.status, 'draft')
            ),
        });

        if (!anunciacao) {
            return NextResponse.json({ error: 'Draft not found or not yours' }, { status: 404 });
        }

        const now = Math.floor(Date.now() / 1000);

        const updates: Record<string, any> = { updatedAt: now };

        if (quarter1Content !== undefined) updates.quarter1Content = quarter1Content;
        if (quarter2Content !== undefined) updates.quarter2Content = quarter2Content;
        if (quarter3Content !== undefined) updates.quarter3Content = quarter3Content;
        if (quarter4AiContent !== undefined) updates.quarter4AiContent = quarter4AiContent;
        if (closingContent !== undefined) updates.closingContent = closingContent;
        if (aiQuarterEdited !== undefined) updates.aiQuarterEdited = aiQuarterEdited ? 1 : 0;

        await db.update(anunciacoes)
            .set(updates)
            .where(eq(anunciacoes.id, anunciacaoId));

        const updated = await db.query.anunciacoes.findFirst({
            where: eq(anunciacoes.id, anunciacaoId),
        });

        return NextResponse.json({ anunciacao: updated });
    } catch (error) {
        console.error('Error updating anunciação:', error);
        return NextResponse.json({ error: 'Failed to update anunciação' }, { status: 500 });
    }
}
