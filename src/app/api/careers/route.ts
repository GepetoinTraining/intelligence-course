/**
 * Public Careers API
 * 
 * GET /api/careers - List public job openings
 * No auth required for browsing
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { latticeProjections, organizations } from '@/lib/db/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Only get public hiring projections with completed ideal lattices
        let query = db
            .select({
                id: latticeProjections.id,
                title: latticeProjections.name,
                description: latticeProjections.description,
                organizationId: latticeProjections.organizationId,
                createdAt: latticeProjections.createdAt,
            })
            .from(latticeProjections)
            .where(
                and(
                    eq(latticeProjections.isPublic, 1),
                    eq(latticeProjections.category, 'hiring')
                )
            )
            .orderBy(desc(latticeProjections.createdAt))
            .limit(limit)
            .offset(offset);

        const jobs = await query;

        // Get organization names for jobs that have orgIds
        const orgIds = [...new Set(jobs.map(j => j.organizationId).filter(Boolean))];
        const orgs = orgIds.length > 0
            ? await db
                .select({ id: organizations.id, name: organizations.name })
                .from(organizations)
                .where(or(...orgIds.map(id => eq(organizations.id, id!))))
            : [];

        const orgMap = new Map(orgs.map(o => [o.id, o.name]));

        return NextResponse.json({
            success: true,
            jobs: jobs.map(j => ({
                id: j.id,
                title: j.title,
                description: j.description,
                company: j.organizationId ? orgMap.get(j.organizationId) || 'Anonymous' : 'Anonymous',
                postedAt: j.createdAt,
            })),
            total: jobs.length,
        });
    } catch (error) {
        console.error('Error fetching public jobs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}


