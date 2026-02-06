/**
 * Talent Pool API
 * 
 * POST /api/careers/talent-pool - Start/continue standalone candidate interview
 * Allows candidates to build their lattice profile without a specific job
 */

import { NextRequest, NextResponse } from 'next/server';
import { CandidateInterviewEngine } from '@/lib/lattice/candidate-interview';


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, candidateName, candidateEmail, messages, response } = body;

        const engine = new CandidateInterviewEngine();

        switch (action) {
            case 'start': {
                if (!candidateName || !candidateEmail) {
                    return NextResponse.json(
                        { error: 'candidateName and candidateEmail required' },
                        { status: 400 }
                    );
                }

                // Use generic job title for talent pool
                const result = await engine.startInterview(
                    candidateName,
                    'General Talent Pool',
                    'We want to understand your skills and experience to match you with the best opportunities. This is a general assessment, not for a specific role.'
                );

                return NextResponse.json({
                    success: true,
                    message: result.message,
                    interviewState: {
                        status: 'in_progress',
                        candidateName,
                        candidateEmail,
                        messages: [
                            { role: 'assistant', content: result.message, timestamp: new Date().toISOString() }
                        ],
                    },
                });
            }

            case 'continue': {
                if (!messages || !response) {
                    return NextResponse.json(
                        { error: 'messages and response required' },
                        { status: 400 }
                    );
                }

                const result = await engine.continueInterview(
                    messages,
                    response,
                    'General Talent Pool',
                    'General skills assessment for talent matching.'
                );

                return NextResponse.json({
                    success: true,
                    message: result.message,
                    isComplete: result.isComplete,
                });
            }

            case 'complete': {
                if (!messages || !candidateName || !candidateEmail) {
                    return NextResponse.json(
                        { error: 'messages, candidateName, and candidateEmail required' },
                        { status: 400 }
                    );
                }

                // Extract candidate lattice with embedded key moments
                console.log(`[Talent Pool] Completing interview for ${candidateName}`);
                const extraction = await engine.extractLattice(messages);

                // Log embedding stats
                const embeddedMoments = extraction.keyMoments.filter(m => m.embedding.length > 0);
                console.log(`[Talent Pool] Extracted ${extraction.keyMoments.length} key moments, ${embeddedMoments.length} with embeddings`);

                return NextResponse.json({
                    success: true,
                    profile: {
                        lattice: extraction.lattice,
                        summary: extraction.summary,
                        keyStrengths: extraction.keyStrengths,
                        potentialConcerns: extraction.potentialConcerns,
                        candidateName,
                        candidateEmail,
                        createdAt: new Date().toISOString(),
                        // Include key moments metadata (without full embeddings to save bandwidth)
                        keyMomentsCount: extraction.keyMoments.length,
                        keyMomentsEmbedded: embeddedMoments.length,
                        keyMomentsSummary: extraction.keyMoments.map(m => ({
                            content: m.content,
                            skillIds: m.skillIds,
                            confidence: m.confidence,
                            hasEmbedding: m.embedding.length > 0,
                        })),
                    },
                    // Full key moments with embeddings (for storage/matching)
                    keyMoments: extraction.keyMoments,
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: start, continue, complete' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error processing talent pool application:', error);
        return NextResponse.json(
            { error: 'Failed to process application' },
            { status: 500 }
        );
    }
}

