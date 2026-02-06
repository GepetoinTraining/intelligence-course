/**
 * Wiki Articles API
 * 
 * GET /api/wiki/articles - List articles
 * POST /api/wiki/articles - Create article
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { wikiArticles, wikiArticleVersions, users } from '@/lib/db/schema';
import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { z } from 'zod';

const CreateArticleSchema = z.object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
    summary: z.string().max(500).optional(),
    content: z.string().min(1),
    categoryId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    linkedProcedureId: z.string().uuid().optional(),
    visibility: z.enum(['inherit', 'public', 'internal', 'restricted']).optional(),
    status: z.enum(['draft', 'review', 'published']).optional(),
});

const ListArticlesSchema = z.object({
    categoryId: z.string().uuid().optional(),
    status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
    search: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    offset: z.coerce.number().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'No organization context' }, { status: 400 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        const { searchParams } = new URL(request.url);
        const params = ListArticlesSchema.parse({
            categoryId: searchParams.get('categoryId') || undefined,
            status: searchParams.get('status') || undefined,
            search: searchParams.get('search') || undefined,
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
        });

        // Build conditions
        const conditions: any[] = [
            eq(wikiArticles.organizationId, organizationId),
        ];


        if (params.categoryId) {
            conditions.push(eq(wikiArticles.categoryId, params.categoryId));
        }

        if (params.status) {
            conditions.push(eq(wikiArticles.status, params.status));
        } else {
            // Default: show published to regular users, all to staff+
            if (!['staff', 'school', 'owner'].includes(user?.role || '')) {
                conditions.push(eq(wikiArticles.status, 'published'));
            }
        }


        if (params.search) {
            const searchTerm = `%${params.search}%`;
            conditions.push(or(
                like(wikiArticles.title, searchTerm),
                like(wikiArticles.summary, searchTerm),
                like(wikiArticles.content, searchTerm)
            ));
        }

        const articles = await db.select({
            id: wikiArticles.id,
            title: wikiArticles.title,
            slug: wikiArticles.slug,
            summary: wikiArticles.summary,
            categoryId: wikiArticles.categoryId,
            status: wikiArticles.status,
            tags: wikiArticles.tags,
            viewCount: wikiArticles.viewCount,
            helpfulCount: wikiArticles.helpfulCount,
            authorId: wikiArticles.authorId,
            createdAt: wikiArticles.createdAt,
            updatedAt: wikiArticles.updatedAt,
            publishedAt: wikiArticles.publishedAt,
        })
            .from(wikiArticles)
            .where(and(...conditions))
            .orderBy(desc(wikiArticles.updatedAt))
            .limit(params.limit)
            .offset(params.offset);

        // Get total count
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(wikiArticles)
            .where(and(...conditions));

        return NextResponse.json({
            data: articles.map(a => ({
                ...a,
                tags: a.tags ? JSON.parse(a.tags) : [],
            })),
            meta: {
                total: countResult[0]?.count || 0,
                limit: params.limit,
                offset: params.offset,
            },
        });
    } catch (error) {
        console.error('Error fetching wiki articles:', error);
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId: organizationId } = await getApiAuthWithOrg();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'No organization context' }, { status: 400 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        // Check permission (staff+ can create articles)
        if (!['staff', 'school', 'owner'].includes(user?.role || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }


        const body = await request.json();
        const validation = CreateArticleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Check slug uniqueness
        const existing = await db.query.wikiArticles.findFirst({
            where: and(
                eq(wikiArticles.organizationId, organizationId),
                eq(wikiArticles.slug, data.slug)
            ),
        });

        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
        }

        const now = Math.floor(Date.now() / 1000);
        const status = data.status || 'draft';

        const [article] = await db.insert(wikiArticles).values({
            organizationId: organizationId,

            categoryId: data.categoryId,
            title: data.title,
            slug: data.slug,
            summary: data.summary,
            content: data.content,
            contentFormat: 'markdown',
            status,
            tags: data.tags ? JSON.stringify(data.tags) : '[]',
            keywords: '[]',
            version: 1,
            linkedProcedureId: data.linkedProcedureId,
            visibility: data.visibility || 'inherit',
            authorId: userId,
            lastEditorId: userId,
            createdAt: now,
            updatedAt: now,
            publishedAt: status === 'published' ? now : undefined,
        }).returning();

        // Create initial version
        await db.insert(wikiArticleVersions).values({
            articleId: article.id,
            version: 1,
            title: data.title,
            content: data.content,
            summary: data.summary,
            changeNotes: 'Initial creation',
            editorId: userId,
            createdAt: now,
        });

        return NextResponse.json({
            data: {
                ...article,
                tags: data.tags || [],
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating wiki article:', error);
        return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }
}

