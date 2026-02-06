/**
 * Wiki Categories API
 * 
 * GET /api/wiki/categories - List categories
 * POST /api/wiki/categories - Create category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { wikiCategories, users } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

const CreateCategorySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(20).optional(),
    parentId: z.string().uuid().optional(),
    visibility: z.enum(['public', 'internal', 'restricted']).optional(),
    allowedRoles: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { personId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user?.organizationId) {
            return NextResponse.json({ error: 'No organization' }, { status: 400 });
        }

        const categories = await db.select()
            .from(wikiCategories)
            .where(eq(wikiCategories.organizationId, user.organizationId))
            .orderBy(asc(wikiCategories.sortOrder), asc(wikiCategories.name));

        return NextResponse.json({ data: categories });
    } catch (error) {
        console.error('Error fetching wiki categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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

        // Check permission (staff+ can create categories)
        if (!['staff', 'school', 'owner'].includes(user.role || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = CreateCategorySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid data',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Check slug uniqueness
        const existing = await db.query.wikiCategories.findFirst({
            where: and(
                eq(wikiCategories.organizationId, user.organizationId),
                eq(wikiCategories.slug, data.slug)
            ),
        });

        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
        }

        const now = Math.floor(Date.now() / 1000);
        const [category] = await db.insert(wikiCategories).values({
            organizationId: user.organizationId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            icon: data.icon || 'IconBook',
            color: data.color || 'blue',
            parentId: data.parentId,
            visibility: data.visibility || 'internal',
            allowedRoles: data.allowedRoles ? JSON.stringify(data.allowedRoles) : '[]',
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
        }).returning();

        return NextResponse.json({ data: category }, { status: 201 });
    } catch (error) {
        console.error('Error creating wiki category:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}



