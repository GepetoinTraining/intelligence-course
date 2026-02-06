/**
 * Talent Pool Admin API
 * 
 * GET /api/owner/talent-pool - List all talent profiles (admin view)
 * Allows owners/admins to browse the talent pool with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { talentProfiles, users, persons } from '@/lib/db/schema';
import { eq, desc, sql, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query conditions
        const conditions = [];

        // Filter by status if provided
        if (status && status !== 'all') {
            conditions.push(eq(talentProfiles.status, status as any));
        }

        // Fetch profiles with user data
        const profilesQuery = db
            .select({
                id: talentProfiles.id,
                headline: talentProfiles.headline,
                summary: talentProfiles.summary,
                currentLattice: talentProfiles.currentLattice,
                status: talentProfiles.status,
                isSearchable: talentProfiles.isSearchable,
                evidenceCount: talentProfiles.evidenceCount,
                profileCompleteness: talentProfiles.profileCompleteness,
                interviewCompletedAt: talentProfiles.interviewCompletedAt,
                createdAt: talentProfiles.createdAt,
                updatedAt: talentProfiles.updatedAt,
                personId: talentProfiles.personId,
                // User info from persons table
                userName: persons.firstName,
                userEmail: persons.primaryEmail,
                userAvatarUrl: persons.avatarUrl,
            })
            .from(talentProfiles)
            .leftJoin(persons, eq(talentProfiles.personId, persons.id))
            .orderBy(desc(talentProfiles.updatedAt))
            .limit(limit)
            .offset(offset);

        let profiles = await profilesQuery;

        // Filter by search if provided (client-side for now since SQLite)
        if (search) {
            const searchLower = search.toLowerCase();
            profiles = profiles.filter(p =>
                p.userName?.toLowerCase().includes(searchLower) ||
                p.userEmail?.toLowerCase().includes(searchLower) ||
                p.headline?.toLowerCase().includes(searchLower) ||
                p.summary?.toLowerCase().includes(searchLower)
            );
        }

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(talentProfiles);
        const total = countResult[0]?.count || 0;

        // Get status counts for filters
        const statusCounts = await db
            .select({
                status: talentProfiles.status,
                count: sql<number>`count(*)`,
            })
            .from(talentProfiles)
            .groupBy(talentProfiles.status);

        // Transform profiles with parsed lattice data
        const transformedProfiles = profiles.map(p => {
            let lattice = null;
            try {
                if (p.currentLattice) {
                    lattice = JSON.parse(p.currentLattice);
                }
            } catch (e) {
                console.error('Failed to parse lattice:', e);
            }

            // Calculate top skills from lattice
            let topSkills: { id: string; score: number }[] = [];
            if (lattice && typeof lattice === 'object') {
                topSkills = Object.entries(lattice)
                    .map(([id, score]) => ({ id, score: score as number }))
                    .filter(s => s.score > 0.5)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);
            }

            return {
                id: p.id,
                personId: p.personId,
                name: p.userName || 'Unknown',
                email: p.userEmail || null,
                avatarUrl: p.userAvatarUrl,
                headline: p.headline,
                summary: p.summary,
                status: p.status,
                isSearchable: Boolean(p.isSearchable),
                evidenceCount: p.evidenceCount || 0,
                profileCompleteness: p.profileCompleteness || 0,
                interviewCompleted: Boolean(p.interviewCompletedAt),
                topSkills,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            };
        });

        return NextResponse.json({
            profiles: transformedProfiles,
            total,
            statusCounts: Object.fromEntries(
                statusCounts.map(s => [s.status || 'incomplete', s.count])
            ),
            pagination: {
                limit,
                offset,
                hasMore: offset + profiles.length < total,
            },
        });
    } catch (error) {
        console.error('Error fetching talent pool:', error);
        return NextResponse.json(
            { error: 'Failed to fetch talent pool' },
            { status: 500 }
        );
    }
}




