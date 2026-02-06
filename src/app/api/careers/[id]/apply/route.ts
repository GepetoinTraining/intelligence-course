/**
 * Candidate Application API
 * 
 * POST /api/careers/[id]/apply - Start/continue candidate interview
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { latticeProjections, latticeProjectionResults } from '@/lib/db/schema';
import { CandidateInterviewEngine } from '@/lib/lattice/candidate-interview';
import { calculateCandidateMatch, type IdealLattice } from '@/lib/lattice/interview';
import { eq, and } from 'drizzle-orm';
import { SKILL_CATEGORIES } from '@/lib/lattice/skills';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: jobId } = await params;
        const body = await request.json();
        const { action, candidateName, candidateEmail, messages, response } = body;

        // Get job details
        const [job] = await db
            .select()
            .from(latticeProjections)
            .where(
                and(
                    eq(latticeProjections.id, jobId),
                    eq(latticeProjections.isPublic, 1),
                    eq(latticeProjections.category, 'hiring')
                )
            )
            .limit(1);

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found or not accepting applications' },
                { status: 404 }
            );
        }

        const engine = new CandidateInterviewEngine();

        switch (action) {
            case 'start': {
                // Start new candidate interview
                if (!candidateName || !candidateEmail) {
                    return NextResponse.json(
                        { error: 'candidateName and candidateEmail required' },
                        { status: 400 }
                    );
                }

                const result = await engine.startInterview(
                    candidateName,
                    job.name,
                    job.description || ''
                );

                return NextResponse.json({
                    success: true,
                    message: result.message,
                    interviewState: {
                        status: 'in_progress',
                        candidateName,
                        candidateEmail,
                        jobTitle: job.name,
                        messages: [
                            { role: 'assistant', content: result.message, timestamp: new Date().toISOString() }
                        ],
                    },
                });
            }

            case 'continue': {
                // Continue interview with candidate response
                if (!messages || !response) {
                    return NextResponse.json(
                        { error: 'messages and response required' },
                        { status: 400 }
                    );
                }

                const result = await engine.continueInterview(
                    messages,
                    response,
                    job.name,
                    job.description || ''
                );

                return NextResponse.json({
                    success: true,
                    message: result.message,
                    isComplete: result.isComplete,
                });
            }

            case 'complete': {
                // Extract lattice and calculate match
                if (!messages || !candidateName || !candidateEmail) {
                    return NextResponse.json(
                        { error: 'messages, candidateName, and candidateEmail required' },
                        { status: 400 }
                    );
                }

                // Extract candidate lattice
                const extraction = await engine.extractLattice(messages);

                // Calculate match if job has ideal lattice
                let matchResult = null;
                if (job.idealShapeData) {
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

                    matchResult = calculateCandidateMatch(extraction.lattice.positions, idealLattice);
                }

                // Store result (optional - requires candidate auth)
                // For now, just return the results without storing

                return NextResponse.json({
                    success: true,
                    profile: {
                        lattice: extraction.lattice,
                        summary: extraction.summary,
                        keyStrengths: extraction.keyStrengths,
                        potentialConcerns: extraction.potentialConcerns,
                    },
                    match: matchResult,
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: start, continue, complete' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error processing application:', error);
        return NextResponse.json(
            { error: 'Failed to process application' },
            { status: 500 }
        );
    }
}
