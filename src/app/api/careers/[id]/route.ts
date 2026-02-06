/**
 * Single Job Posting API
 * 
 * GET /api/careers/[id] - Get job details
 * POST /api/careers/[id] - Start candidate pre-interview
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { latticeProjections, organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Get job details (only if public)
        const [job] = await db
            .select()
            .from(latticeProjections)
            .where(
                and(
                    eq(latticeProjections.id, id),
                    eq(latticeProjections.isPublic, 1),
                    eq(latticeProjections.category, 'hiring')
                )
            )
            .limit(1);

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            );
        }

        // Get company name
        let companyName = 'Anonymous';
        if (job.organizationId) {
            const [org] = await db
                .select({ name: organizations.name })
                .from(organizations)
                .where(eq(organizations.id, job.organizationId))
                .limit(1);
            if (org) companyName = org.name;
        }

        // Parse ideal shape to show skill requirements (without exact positions)
        const idealShape = job.idealShapeData ? JSON.parse(job.idealShapeData) : null;
        const skillSummary = idealShape ? {
            mustHaveSkills: idealShape.mustHaveSkills || [],
            categoryFocus: Object.entries(idealShape.categoryWeights || {})
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 3)
                .map(([cat]) => cat),
            overallProfile: idealShape.overallProfile || job.description,
        } : null;

        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                title: job.name,
                description: job.description,
                company: companyName,
                postedAt: job.createdAt,
                skillSummary,
                canApply: idealShape !== null,
            },
        });
    } catch (error) {
        console.error('Error fetching job:', error);
        return NextResponse.json(
            { error: 'Failed to fetch job' },
            { status: 500 }
        );
    }
}
