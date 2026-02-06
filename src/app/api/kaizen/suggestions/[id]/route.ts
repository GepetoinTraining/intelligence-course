/**
 * Single Kaizen Suggestion API
 * 
 * GET /api/kaizen/suggestions/[id] - Get suggestion details
 * PUT /api/kaizen/suggestions/[id] - Update suggestion
 * POST /api/kaizen/suggestions/[id] - Actions (vote, review, implement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
    kaizenSuggestions, kaizenVotes, kaizenComments, kaizenMetrics, users
} from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const UpdateSuggestionSchema = z.object({
    title: z.string().min(5).max(200).optional(),
    description: z.string().min(20).max(5000).optional(),
    problemType: z.enum([
        'inefficiency', 'error_prone', 'unclear', 'bottleneck',
        'waste', 'safety', 'quality', 'cost', 'communication', 'other'
    ]).optional(),
    impactArea: z.enum(['time', 'cost', 'quality', 'safety', 'morale', 'customer']).optional(),
    estimatedImpact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    tags: z.array(z.string()).optional(),
});

const VoteSchema = z.object({
    vote: z.enum(['up', 'down', 'remove']),
});

const ReviewSchema = z.object({
    status: z.enum([
        'under_review', 'needs_info', 'approved', 'rejected', 'deferred'
    ]),
    reviewNotes: z.string().max(2000).optional(),
});

const ImplementSchema = z.object({
    status: z.enum(['in_progress', 'implemented']),
    implementationNotes: z.string().max(2000).optional(),
});

const CommentSchema = z.object({
    content: z.string().min(1).max(2000),
    parentCommentId: z.string().uuid().optional(),
});

const MetricSchema = z.object({
    metricName: z.string().min(1).max(100),
    beforeValue: z.number().optional(),
    afterValue: z.number().optional(),
    unit: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const suggestion = await db.query.kaizenSuggestions.findFirst({
            where: and(
                eq(kaizenSuggestions.id, id),
                eq(kaizenSuggestions.organizationId, user.organizationId)
            ),
        });

        if (!suggestion) {
            return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
        }

        // Get user's vote
        const userVote = await db.query.kaizenVotes.findFirst({
            where: and(
                eq(kaizenVotes.suggestionId, id),
                eq(kaizenVotes.userId, userId)
            ),
        });

        // Get comments
        const comments = await db.select({
            id: kaizenComments.id,
            content: kaizenComments.content,
            authorId: kaizenComments.authorId,
            isReviewerComment: kaizenComments.isReviewerComment,
            parentCommentId: kaizenComments.parentCommentId,
            createdAt: kaizenComments.createdAt,
        })
            .from(kaizenComments)
            .where(eq(kaizenComments.suggestionId, id))
            .orderBy(kaizenComments.createdAt);

        // Get comment author names
        const authorIds = [...new Set(comments.map(c => c.authorId))];
        let authorNames: Record<string, string> = {};
        if (authorIds.length > 0) {
            const authors = await db.select({ id: users.id, name: users.name })
                .from(users)
                .where(sql`${users.id} IN (${authorIds.map(id => `'${id}'`).join(',')})`);
            authorNames = Object.fromEntries(authors.map(a => [a.id, a.name || 'Unknown']));
        }

        // Get metrics if implemented
        let metrics: any[] = [];
        if (suggestion.status === 'implemented') {
            metrics = await db.select()
                .from(kaizenMetrics)
                .where(eq(kaizenMetrics.suggestionId, id))
                .orderBy(kaizenMetrics.measuredAt);
        }

        // Get submitter name if not anonymous
        let submitterName = 'Anônimo';
        if (!suggestion.isAnonymous) {
            if (suggestion.submitterId === userId) {
                submitterName = 'Você';
            } else {
                const submitter = await db.query.users.findFirst({
                    where: eq(users.id, suggestion.submitterId),
                });
                submitterName = submitter?.name || 'Unknown';
            }
        }

        return NextResponse.json({
            data: {
                ...suggestion,
                tags: suggestion.tags ? JSON.parse(suggestion.tags) : [],
                attachments: suggestion.attachments ? JSON.parse(suggestion.attachments) : [],
                netVotes: (suggestion.upvotes || 0) - (suggestion.downvotes || 0),
                userVote: userVote?.vote || null,
                submitterName,
                isOwner: suggestion.submitterId === userId,
                canReview: ['staff', 'school', 'owner'].includes(user.role || ''),
                comments: comments.map(c => ({
                    ...c,
                    authorName: authorNames[c.authorId] || 'Unknown',
                    isOwner: c.authorId === userId,
                })),
                metrics,
            },
        });
    } catch (error) {
        console.error('Error fetching kaizen suggestion:', error);
        return NextResponse.json({ error: 'Failed to fetch suggestion' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const suggestion = await db.query.kaizenSuggestions.findFirst({
            where: and(
                eq(kaizenSuggestions.id, id),
                eq(kaizenSuggestions.organizationId, user.organizationId)
            ),
        });

        if (!suggestion) {
            return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
        }

        // Only owner can update, and only if still submitted
        if (suggestion.submitterId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (suggestion.status !== 'submitted' && suggestion.status !== 'needs_info') {
            return NextResponse.json({ error: 'Cannot edit after review' }, { status: 400 });
        }

        const body = await request.json();
        const validation = UpdateSuggestionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;
        const updateData: any = { updatedAt: Math.floor(Date.now() / 1000) };

        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.problemType) updateData.problemType = data.problemType;
        if (data.impactArea) updateData.impactArea = data.impactArea;
        if (data.estimatedImpact) updateData.estimatedImpact = data.estimatedImpact;
        if (data.tags) updateData.tags = JSON.stringify(data.tags);

        const [updated] = await db.update(kaizenSuggestions)
            .set(updateData)
            .where(eq(kaizenSuggestions.id, id))
            .returning();

        return NextResponse.json({
            data: {
                ...updated,
                tags: updated.tags ? JSON.parse(updated.tags) : [],
            },
        });
    } catch (error) {
        console.error('Error updating kaizen suggestion:', error);
        return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const suggestion = await db.query.kaizenSuggestions.findFirst({
            where: and(
                eq(kaizenSuggestions.id, id),
                eq(kaizenSuggestions.organizationId, user.organizationId)
            ),
        });

        if (!suggestion) {
            return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
        }

        const now = Math.floor(Date.now() / 1000);

        // VOTE action
        if (action === 'vote') {
            const body = await request.json();
            const validation = VoteSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const { vote } = validation.data;

            // Get existing vote
            const existing = await db.query.kaizenVotes.findFirst({
                where: and(
                    eq(kaizenVotes.suggestionId, id),
                    eq(kaizenVotes.userId, userId)
                ),
            });

            if (vote === 'remove') {
                if (existing) {
                    // Remove vote and update counts
                    if (existing.vote === 1) {
                        await db.update(kaizenSuggestions)
                            .set({ upvotes: sql`${kaizenSuggestions.upvotes} - 1` })
                            .where(eq(kaizenSuggestions.id, id));
                    } else {
                        await db.update(kaizenSuggestions)
                            .set({ downvotes: sql`${kaizenSuggestions.downvotes} - 1` })
                            .where(eq(kaizenSuggestions.id, id));
                    }
                    await db.delete(kaizenVotes).where(eq(kaizenVotes.id, existing.id));
                }
            } else {
                const voteValue = vote === 'up' ? 1 : -1;

                if (existing) {
                    if (existing.vote !== voteValue) {
                        // Change vote direction
                        if (voteValue === 1) {
                            await db.update(kaizenSuggestions)
                                .set({
                                    upvotes: sql`${kaizenSuggestions.upvotes} + 1`,
                                    downvotes: sql`${kaizenSuggestions.downvotes} - 1`,
                                })
                                .where(eq(kaizenSuggestions.id, id));
                        } else {
                            await db.update(kaizenSuggestions)
                                .set({
                                    upvotes: sql`${kaizenSuggestions.upvotes} - 1`,
                                    downvotes: sql`${kaizenSuggestions.downvotes} + 1`,
                                })
                                .where(eq(kaizenSuggestions.id, id));
                        }
                        await db.update(kaizenVotes)
                            .set({ vote: voteValue })
                            .where(eq(kaizenVotes.id, existing.id));
                    }
                } else {
                    // New vote
                    if (voteValue === 1) {
                        await db.update(kaizenSuggestions)
                            .set({ upvotes: sql`${kaizenSuggestions.upvotes} + 1` })
                            .where(eq(kaizenSuggestions.id, id));
                    } else {
                        await db.update(kaizenSuggestions)
                            .set({ downvotes: sql`${kaizenSuggestions.downvotes} + 1` })
                            .where(eq(kaizenSuggestions.id, id));
                    }
                    await db.insert(kaizenVotes).values({
                        suggestionId: id,
                        userId,
                        vote: voteValue,
                        createdAt: now,
                    });
                }
            }

            // Get updated counts
            const updated = await db.query.kaizenSuggestions.findFirst({
                where: eq(kaizenSuggestions.id, id),
            });

            return NextResponse.json({
                success: true,
                upvotes: updated?.upvotes || 0,
                downvotes: updated?.downvotes || 0,
                netVotes: (updated?.upvotes || 0) - (updated?.downvotes || 0),
            });
        }

        // REVIEW action (staff+ only)
        if (action === 'review') {
            if (!['staff', 'school', 'owner'].includes(user.role || '')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const body = await request.json();
            const validation = ReviewSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const { status, reviewNotes } = validation.data;

            await db.update(kaizenSuggestions)
                .set({
                    status,
                    reviewerId: userId,
                    reviewNotes,
                    reviewedAt: now,
                    updatedAt: now,
                })
                .where(eq(kaizenSuggestions.id, id));

            return NextResponse.json({ success: true, status });
        }

        // IMPLEMENT action (staff+ only)
        if (action === 'implement') {
            if (!['staff', 'school', 'owner'].includes(user.role || '')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const body = await request.json();
            const validation = ImplementSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const { status, implementationNotes } = validation.data;

            const updateData: any = {
                status,
                implementerId: userId,
                implementationNotes,
                updatedAt: now,
            };

            if (status === 'implemented') {
                updateData.implementedAt = now;
            }

            await db.update(kaizenSuggestions)
                .set(updateData)
                .where(eq(kaizenSuggestions.id, id));

            return NextResponse.json({ success: true, status });
        }

        // COMMENT action
        if (action === 'comment') {
            const body = await request.json();
            const validation = CommentSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const { content, parentCommentId } = validation.data;
            const isReviewer = ['staff', 'school', 'owner'].includes(user.role || '');

            const [comment] = await db.insert(kaizenComments).values({
                suggestionId: id,
                content,
                authorId: userId,
                isReviewerComment: isReviewer,
                parentCommentId,
                createdAt: now,
                updatedAt: now,
            }).returning();

            return NextResponse.json({
                data: {
                    ...comment,
                    authorName: user.name || 'You',
                    isOwner: true,
                },
            }, { status: 201 });
        }

        // METRIC action (for implemented suggestions)
        if (action === 'metric') {
            if (!['staff', 'school', 'owner'].includes(user.role || '')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            if (suggestion.status !== 'implemented') {
                return NextResponse.json({ error: 'Suggestion not implemented' }, { status: 400 });
            }

            const body = await request.json();
            const validation = MetricSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const data = validation.data;

            const [metric] = await db.insert(kaizenMetrics).values({
                suggestionId: id,
                metricName: data.metricName,
                beforeValue: data.beforeValue,
                afterValue: data.afterValue,
                unit: data.unit,
                notes: data.notes,
                measuredAt: now,
                measuredBy: userId,
            }).returning();

            return NextResponse.json({ data: metric }, { status: 201 });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing kaizen action:', error);
        return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
    }
}
