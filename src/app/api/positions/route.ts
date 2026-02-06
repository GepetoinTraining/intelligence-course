import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { teamPositions, positionPermissions, actionTypes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const positionSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(50).optional(),
    description: z.string().max(1000).optional(),
    level: z.number().min(1).max(10).default(5),
    positionType: z.enum(['leadership', 'management', 'specialist', 'operational', 'support', 'intern', 'contractor', 'other']).default('specialist'),
    icon: z.string().optional(),
    color: z.string().optional(),
    canManage: z.boolean().default(false),
    isLeadership: z.boolean().default(false),
});

// GET /api/positions - List all positions
export async function GET(request: NextRequest) {
    try {
        const { userId, orgId: organizationId } = await auth();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includePermissions = searchParams.get('includePermissions') === 'true';
        const type = searchParams.get('type');

        const positions = await db
            .select()
            .from(teamPositions)
            .where(
                and(
                    eq(teamPositions.organizationId, organizationId),
                    eq(teamPositions.isActive, true),
                    type ? eq(teamPositions.positionType, type as any) : undefined
                )
            )
            .orderBy(teamPositions.level, teamPositions.name);

        if (includePermissions) {
            const positionsWithPermissions = await Promise.all(
                positions.map(async (position) => {
                    const permissions = await db
                        .select({
                            id: positionPermissions.id,
                            actionTypeId: positionPermissions.actionTypeId,
                            scope: positionPermissions.scope,
                            canDelegate: positionPermissions.canDelegate,
                            actionCode: actionTypes.code,
                            actionName: actionTypes.name,
                            actionCategory: actionTypes.category,
                        })
                        .from(positionPermissions)
                        .leftJoin(actionTypes, eq(positionPermissions.actionTypeId, actionTypes.id))
                        .where(eq(positionPermissions.positionId, position.id));

                    return { ...position, permissions };
                })
            );
            return NextResponse.json({ data: positionsWithPermissions });
        }

        return NextResponse.json({ data: positions });
    } catch (error) {
        console.error('Error fetching positions:', error);
        return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
    }
}

// POST /api/positions - Create a new position
export async function POST(request: NextRequest) {
    try {
        const { userId, orgId: organizationId } = await auth();
        if (!userId || !organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const parsed = positionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
        }

        const data = parsed.data;

        // Generate slug
        const slug = data.slug || data.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check uniqueness
        const existing = await db
            .select({ id: teamPositions.id })
            .from(teamPositions)
            .where(
                and(
                    eq(teamPositions.organizationId, organizationId),
                    eq(teamPositions.slug, slug)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Position with this slug already exists' }, { status: 409 });
        }

        const [newPosition] = await db.insert(teamPositions).values({
            organizationId,
            name: data.name,
            slug,
            description: data.description,
            level: data.level,
            positionType: data.positionType,
            icon: data.icon || 'IconUser',
            color: data.color || 'gray',
            canManage: data.canManage,
            isLeadership: data.isLeadership,
        }).returning();

        return NextResponse.json({ data: newPosition }, { status: 201 });
    } catch (error) {
        console.error('Error creating position:', error);
        return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
    }
}

