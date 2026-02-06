/**
 * Anunciação History API
 * 
 * GET - List all enshrined anunciações for team (the lineage)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { anunciacoes, teams, persons } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

type Params = Promise<{ id: string }>;

export async function GET(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: teamId } = await params;
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();

        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify team belongs to org
        const team = await db.query.teams.findFirst({
            where: and(
                eq(teams.id, teamId),
                eq(teams.organizationId, organizationId)
            ),
        });

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Get all enshrined anunciações for this team, ordered by enshrine date
        const enshrinedList = await db.select()
            .from(anunciacoes)
            .where(and(
                eq(anunciacoes.teamId, teamId),
                eq(anunciacoes.status, 'enshrined')
            ))
            .orderBy(desc(anunciacoes.enshrinedAt));

        // Enrich with author info
        const enriched = await Promise.all(enshrinedList.map(async (a) => {
            const author = await db.query.persons.findFirst({
                where: eq(persons.id, a.authorPersonId),
                columns: { id: true, displayName: true, firstName: true, lastName: true },
            });

            return {
                ...a,
                author,
                tenureStats: a.tenureStats ? JSON.parse(a.tenureStats) : null,
            };
        }));

        return NextResponse.json({
            history: enriched,
            count: enriched.length,
        });
    } catch (error) {
        console.error('Error fetching anunciação history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
