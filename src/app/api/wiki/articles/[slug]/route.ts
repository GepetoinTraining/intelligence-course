/**
 * Single Wiki Article API
 * 
 * GET /api/wiki/articles/[slug] - Get article by slug
 * PUT /api/wiki/articles/[slug] - Update article
 * DELETE /api/wiki/articles/[slug] - Archive article
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { wikiArticles, wikiArticleVersions, wikiArticleFeedback, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const UpdateArticleSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    summary: z.string().max(500).optional(),
    content: z.string().min(1).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    tags: z.array(z.string()).optional(),
    visibility: z.enum(['inherit', 'public', 'internal', 'restricted']).optional(),
    status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
    changeNotes: z.string().max(500).optional(),
});

const FeedbackSchema = z.object({
    isHelpful: z.boolean(),
    comment: z.string().max(500).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const article = await db.query.wikiArticles.findFirst({
            where: and(
                eq(wikiArticles.organizationId, user.organizationId),
                eq(wikiArticles.slug, slug)
            ),
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Check access: published articles are visible to all, others need staff+
        if (article.status !== 'published' && !['staff', 'school', 'owner'].includes(user.role || '')) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Increment view count
        await db.update(wikiArticles)
            .set({ viewCount: sql`${wikiArticles.viewCount} + 1` })
            .where(eq(wikiArticles.id, article.id));

        // Get user's feedback if any
        const feedback = await db.query.wikiArticleFeedback.findFirst({
            where: and(
                eq(wikiArticleFeedback.articleId, article.id),
                eq(wikiArticleFeedback.userId, userId)
            ),
        });

        return NextResponse.json({
            data: {
                ...article,
                tags: article.tags ? JSON.parse(article.tags) : [],
                keywords: article.keywords ? JSON.parse(article.keywords) : [],
                relatedArticleIds: article.relatedArticleIds ? JSON.parse(article.relatedArticleIds) : [],
            },
            meta: {
                userFeedback: feedback ? { isHelpful: feedback.isHelpful } : null,
            },
        });
    } catch (error) {
        console.error('Error fetching wiki article:', error);
        return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        // Check permission
        if (!['staff', 'school', 'owner'].includes(user.role || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const article = await db.query.wikiArticles.findFirst({
            where: and(
                eq(wikiArticles.organizationId, user.organizationId),
                eq(wikiArticles.slug, slug)
            ),
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const body = await request.json();
        const validation = UpdateArticleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;
        const now = Math.floor(Date.now() / 1000);
        const newVersion = (article.version || 1) + 1;

        // Create new version if content changed
        if (data.content && data.content !== article.content) {
            await db.insert(wikiArticleVersions).values({
                articleId: article.id,
                version: newVersion,
                title: data.title || article.title,
                content: data.content,
                summary: data.summary ?? article.summary,
                changeNotes: data.changeNotes || 'Updated',
                editorId: userId,
                createdAt: now,
            });
        }

        // Update article
        const updateData: any = {
            updatedAt: now,
            lastEditorId: userId,
        };

        if (data.title) updateData.title = data.title;
        if (data.summary !== undefined) updateData.summary = data.summary;
        if (data.content) {
            updateData.content = data.content;
            updateData.version = newVersion;
        }
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
        if (data.tags) updateData.tags = JSON.stringify(data.tags);
        if (data.visibility) updateData.visibility = data.visibility;
        if (data.status) {
            updateData.status = data.status;
            if (data.status === 'published' && !article.publishedAt) {
                updateData.publishedAt = now;
            }
        }

        const [updated] = await db.update(wikiArticles)
            .set(updateData)
            .where(eq(wikiArticles.id, article.id))
            .returning();

        return NextResponse.json({
            data: {
                ...updated,
                tags: updated.tags ? JSON.parse(updated.tags) : [],
            },
        });
    } catch (error) {
        console.error('Error updating wiki article:', error);
        return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        // Check permission (school+ can archive)
        if (!['school', 'owner'].includes(user.role || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const article = await db.query.wikiArticles.findFirst({
            where: and(
                eq(wikiArticles.organizationId, user.organizationId),
                eq(wikiArticles.slug, slug)
            ),
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Archive instead of delete
        await db.update(wikiArticles)
            .set({
                status: 'archived',
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(wikiArticles.id, article.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error archiving wiki article:', error);
        return NextResponse.json({ error: 'Failed to archive article' }, { status: 500 });
    }
}

// POST for feedback (separate action)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const article = await db.query.wikiArticles.findFirst({
            where: and(
                eq(wikiArticles.organizationId, user.organizationId),
                eq(wikiArticles.slug, slug)
            ),
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        if (action === 'feedback') {
            const body = await request.json();
            const validation = FeedbackSchema.safeParse(body);

            if (!validation.success) {
                return NextResponse.json({
                    error: 'Invalid data',
                    details: validation.error.flatten()
                }, { status: 400 });
            }

            const data = validation.data;

            // Upsert feedback
            const existing = await db.query.wikiArticleFeedback.findFirst({
                where: and(
                    eq(wikiArticleFeedback.articleId, article.id),
                    eq(wikiArticleFeedback.userId, userId)
                ),
            });

            if (existing) {
                // Update counts based on change
                const delta = data.isHelpful !== existing.isHelpful;
                if (delta) {
                    if (data.isHelpful) {
                        await db.update(wikiArticles)
                            .set({
                                helpfulCount: sql`${wikiArticles.helpfulCount} + 1`,
                                notHelpfulCount: sql`${wikiArticles.notHelpfulCount} - 1`,
                            })
                            .where(eq(wikiArticles.id, article.id));
                    } else {
                        await db.update(wikiArticles)
                            .set({
                                helpfulCount: sql`${wikiArticles.helpfulCount} - 1`,
                                notHelpfulCount: sql`${wikiArticles.notHelpfulCount} + 1`,
                            })
                            .where(eq(wikiArticles.id, article.id));
                    }
                }

                await db.update(wikiArticleFeedback)
                    .set({
                        isHelpful: data.isHelpful,
                        comment: data.comment,
                    })
                    .where(eq(wikiArticleFeedback.id, existing.id));
            } else {
                // New feedback
                await db.insert(wikiArticleFeedback).values({
                    articleId: article.id,
                    userId,
                    isHelpful: data.isHelpful,
                    comment: data.comment,
                    createdAt: Math.floor(Date.now() / 1000),
                });

                // Update counts
                if (data.isHelpful) {
                    await db.update(wikiArticles)
                        .set({ helpfulCount: sql`${wikiArticles.helpfulCount} + 1` })
                        .where(eq(wikiArticles.id, article.id));
                } else {
                    await db.update(wikiArticles)
                        .set({ notHelpfulCount: sql`${wikiArticles.notHelpfulCount} + 1` })
                        .where(eq(wikiArticles.id, article.id));
                }
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing article action:', error);
        return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
    }
}
