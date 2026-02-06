/**
 * Kaizen Suggestions API - Toyota-style bottom-up improvement
 * 
 * GET /api/kaizen/suggestions - List suggestions
 * POST /api/kaizen/suggestions - Submit a new suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { kaizenSuggestions, kaizenVotes, users } from '@/lib/db/schema';
import { eq, and, desc, sql, or, like, inArray } from 'drizzle-orm';
import { z } from 'zod';

const CreateSuggestionSchema = z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(5000),
    problemType: z.enum([
        'inefficiency', 'error_prone', 'unclear', 'bottleneck',
        'waste', 'safety', 'quality', 'cost', 'communication', 'other'
    ]),
    impactArea: z.enum(['time', 'cost', 'quality', 'safety', 'morale', 'customer']).optional(),
    estimatedImpact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    procedureId: z.string().uuid().optional(),
    stepId: z.string().uuid().optional(),
    wikiArticleId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
    })).optional(),
    isAnonymous: z.boolean().optional(),
});

const ListSuggestionsSchema = z.object({
    status: z.enum([
        'submitted', 'under_review', 'needs_info', 'approved',
        'in_progress', 'implemented', 'rejected', 'deferred'
    ]).optional(),
    problemType: z.string().optional(),
    mine: z.coerce.boolean().optional(),
    topVoted: z.coerce.boolean().optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    offset: z.coerce.number().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const params = ListSuggestionsSchema.parse({
            status: searchParams.get('status') || undefined,
            problemType: searchParams.get('problemType') || undefined,
            mine: searchParams.get('mine'),
            topVoted: searchParams.get('topVoted'),
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
        });

        // Build conditions
        const conditions: any[] = [
            eq(kaizenSuggestions.organizationId, user.organizationId),
        ];

        if (params.status) {
            conditions.push(eq(kaizenSuggestions.status, params.status));
        }

        if (params.problemType) {
            conditions.push(eq(kaizenSuggestions.problemType, params.problemType as any));
        }

        if (params.mine) {
            conditions.push(eq(kaizenSuggestions.submitterId, userId));
        }

        // Order by
        const orderBy = params.topVoted
            ? desc(kaizenSuggestions.upvotes)
            : desc(kaizenSuggestions.createdAt);

        const suggestions = await db.select({
            id: kaizenSuggestions.id,
            title: kaizenSuggestions.title,
            description: kaizenSuggestions.description,
            problemType: kaizenSuggestions.problemType,
            impactArea: kaizenSuggestions.impactArea,
            estimatedImpact: kaizenSuggestions.estimatedImpact,
            status: kaizenSuggestions.status,
            upvotes: kaizenSuggestions.upvotes,
            downvotes: kaizenSuggestions.downvotes,
            submitterId: kaizenSuggestions.submitterId,
            isAnonymous: kaizenSuggestions.isAnonymous,
            procedureId: kaizenSuggestions.procedureId,
            tags: kaizenSuggestions.tags,
            createdAt: kaizenSuggestions.createdAt,
            reviewedAt: kaizenSuggestions.reviewedAt,
            implementedAt: kaizenSuggestions.implementedAt,
        })
            .from(kaizenSuggestions)
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(params.limit)
            .offset(params.offset);

        // Get user's votes for these suggestions
        const suggestionIds = suggestions.map(s => s.id);
        let userVotes: Record<string, number> = {};

        if (suggestionIds.length > 0) {
            const votes = await db.select({
                suggestionId: kaizenVotes.suggestionId,
                vote: kaizenVotes.vote,
            })
                .from(kaizenVotes)
                .where(and(
                    inArray(kaizenVotes.suggestionId, suggestionIds),
                    eq(kaizenVotes.personId, personId)
                ));

            userVotes = Object.fromEntries(votes.map(v => [v.suggestionId, v.vote]));
        }

        // Get submitter names (for non-anonymous)
        const submitterIds = [...new Set(
            suggestions
                .filter(s => !s.isAnonymous && s.submitterId !== userId)
                .map(s => s.submitterId)
        )];

        let submitterNames: Record<string, string> = {};
        if (submitterIds.length > 0) {
            const submitters = await db.select({
                id: users.id,
                name: users.name,
            })
                .from(users)
                .where(inArray(users.id, submitterIds));

            submitterNames = Object.fromEntries(submitters.map(u => [u.id, u.name || 'Unknown']));
        }

        // Get total count
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(kaizenSuggestions)
            .where(and(...conditions));

        return NextResponse.json({
            data: suggestions.map(s => ({
                ...s,
                tags: s.tags ? JSON.parse(s.tags) : [],
                netVotes: (s.upvotes || 0) - (s.downvotes || 0),
                userVote: userVotes[s.id] || null,
                submitterName: s.isAnonymous
                    ? 'Anônimo'
                    : (s.submitterId === userId ? 'Você' : submitterNames[s.submitterId] || 'Unknown'),
                isOwner: s.submitterId === userId,
            })),
            meta: {
                total: countResult[0]?.count || 0,
                limit: params.limit,
                offset: params.offset,
            },
        });
    } catch (error) {
        console.error('Error fetching kaizen suggestions:', error);
        return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const body = await request.json();
        const validation = CreateSuggestionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;
        const now = Math.floor(Date.now() / 1000);

        const [suggestion] = await db.insert(kaizenSuggestions).values({
            organizationId: user.organizationId,
            title: data.title,
            description: data.description,
            problemType: data.problemType,
            impactArea: data.impactArea || 'time',
            estimatedImpact: data.estimatedImpact || 'medium',
            procedureId: data.procedureId,
            stepId: data.stepId,
            wikiArticleId: data.wikiArticleId,
            status: 'submitted',
            submitterId: userId,
            isAnonymous: data.isAnonymous || false,
            tags: data.tags ? JSON.stringify(data.tags) : '[]',
            attachments: data.attachments ? JSON.stringify(data.attachments) : '[]',
            upvotes: 1, // Auto-upvote own suggestion
            downvotes: 0,
            createdAt: now,
            updatedAt: now,
        }).returning();

        // Auto-vote for own suggestion
        await db.insert(kaizenVotes).values({
            suggestionId: suggestion.id,
            userId,
            vote: 1,
            createdAt: now,
        });

        return NextResponse.json({
            data: {
                ...suggestion,
                tags: data.tags || [],
                attachments: data.attachments || [],
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating kaizen suggestion:', error);
        return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
    }
}



