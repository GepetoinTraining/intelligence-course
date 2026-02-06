/**
 * Job Opening Interview Actions
 * 
 * POST /api/lattice/jobs/[id] - Continue interview or extract requirements
 * GET /api/lattice/jobs/[id] - Get job details
 * DELETE /api/lattice/jobs/[id] - Delete job opening
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { latticeProjections } from '@/lib/db/schema';
import {
    JobInterviewEngine,
    calculateCandidateMatch,
    type IdealLattice,
} from '@/lib/lattice/interview';
import { embed } from '@/lib/embeddings/gemini';
import { eq, and } from 'drizzle-orm';
import { SKILL_CATEGORIES } from '@/lib/lattice/skills';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const [job] = await db
            .select()
            .from(latticeProjections)
            .where(eq(latticeProjections.id, id))
            .limit(1);

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Parse ideal shape data if exists
        const idealShapeData = job.idealShapeData
            ? JSON.parse(job.idealShapeData)
            : null;

        return NextResponse.json({
            success: true,
            job: {
                id: job.id,
                title: job.name,
                description: job.description,
                idealShapeData,
                hasIdealLattice: idealShapeData !== null,
                createdAt: job.createdAt,
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

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, messages, userResponse, candidateLattice } = body;

        const engine = new JobInterviewEngine();

        switch (action) {
            case 'continue': {
                // Continue the interview
                if (!messages || !userResponse) {
                    return NextResponse.json(
                        { error: 'messages and userResponse required' },
                        { status: 400 }
                    );
                }

                const result = await engine.continueInterview(messages, userResponse);

                return NextResponse.json({
                    success: true,
                    message: result.message,
                    isComplete: result.isComplete,
                });
            }

            case 'extract': {
                // Extract requirements and generate ideal lattice
                if (!messages) {
                    return NextResponse.json(
                        { error: 'messages required' },
                        { status: 400 }
                    );
                }

                const { requirements, idealLattice } = await engine.extractRequirements(messages);

                // Generate embedding for the job profile
                const profileEmbedding = await embed(idealLattice.overallProfile);

                // Update the job with extracted data
                await db
                    .update(latticeProjections)
                    .set({
                        queryText: idealLattice.overallProfile,
                        queryEmbedding: JSON.stringify(profileEmbedding),
                        idealShapeData: JSON.stringify(idealLattice),
                        shadowExclusions: JSON.stringify(idealLattice.mustNotHaveShadows),
                        updatedAt: Math.floor(Date.now() / 1000),
                    })
                    .where(eq(latticeProjections.id, id));

                return NextResponse.json({
                    success: true,
                    requirements,
                    idealLattice,
                });
            }

            case 'match': {
                // Match a candidate against this job
                if (!candidateLattice) {
                    return NextResponse.json(
                        { error: 'candidateLattice required' },
                        { status: 400 }
                    );
                }

                // Get job's ideal lattice
                const [job] = await db
                    .select()
                    .from(latticeProjections)
                    .where(eq(latticeProjections.id, id))
                    .limit(1);

                if (!job || !job.idealShapeData) {
                    return NextResponse.json(
                        { error: 'Job has no ideal lattice yet' },
                        { status: 400 }
                    );
                }

                // Parse stored ideal lattice
                const storedLattice = JSON.parse(job.idealShapeData);

                // Build complete ideal lattice with defaults
                const defaultWeights: Record<string, number> = {};
                SKILL_CATEGORIES.forEach(cat => { defaultWeights[cat] = 1 / SKILL_CATEGORIES.length; });

                const idealLattice: IdealLattice = {
                    positions: storedLattice.positions || {},
                    categoryWeights: storedLattice.categoryWeights || defaultWeights,
                    mustHaveSkills: storedLattice.mustHaveSkills || [],
                    mustNotHaveShadows: storedLattice.mustNotHaveShadows || [],
                    overallProfile: storedLattice.overallProfile || job.queryText,
                };

                const matchResult = calculateCandidateMatch(candidateLattice, idealLattice);

                return NextResponse.json({
                    success: true,
                    match: matchResult,
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: continue, extract, match' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error processing job action:', error);
        return NextResponse.json(
            { error: 'Failed to process action' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const [job] = await db
            .select()
            .from(latticeProjections)
            .where(
                and(
                    eq(latticeProjections.id, id),
                    eq(latticeProjections.createdBy, personId)
                )
            )
            .limit(1);

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found or not authorized' },
                { status: 404 }
            );
        }

        await db
            .delete(latticeProjections)
            .where(eq(latticeProjections.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting job:', error);
        return NextResponse.json(
            { error: 'Failed to delete job' },
            { status: 500 }
        );
    }
}
