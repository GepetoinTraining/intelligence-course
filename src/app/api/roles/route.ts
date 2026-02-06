/**
 * Organizational Roles API (Owner Only)
 * 
 * GET /api/roles - List organizational roles
 * POST /api/roles - Create new role
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationalRoles, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CreateOrganizationalRoleSchema } from '@/lib/validations/calendar';

export async function GET(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

        const conditions = [eq(organizationalRoles.organizationId, orgId)];
        if (!includeInactive) {
            conditions.push(eq(organizationalRoles.isActive, true));
        }

        const roles = await db.select()
            .from(organizationalRoles)
            .where(and(...conditions))
            .orderBy(desc(organizationalRoles.hierarchyLevel));

        const parsedRoles = roles.map(role => ({
            ...role,
            permissions: role.permissions ? JSON.parse(role.permissions) : [],
        }));

        return NextResponse.json({ roles: parsedRoles });

    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, orgId } = await getApiAuthWithOrg();
        if (!userId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is owner
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { role: true },
        });

        if (user?.role !== 'owner') {
            return NextResponse.json({ error: 'Only owners can create roles' }, { status: 403 });
        }

        const body = await request.json();
        const validation = CreateOrganizationalRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.flatten()
            }, { status: 400 });
        }

        const data = validation.data;

        // Check for duplicate slug
        const existing = await db.query.organizationalRoles.findFirst({
            where: and(
                eq(organizationalRoles.organizationId, orgId),
                eq(organizationalRoles.slug, data.slug)
            ),
        });

        if (existing) {
            return NextResponse.json({ error: 'Role with this slug already exists' }, { status: 409 });
        }

        const [newRole] = await db.insert(organizationalRoles).values({
            organizationId: orgId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            hierarchyLevel: data.hierarchyLevel,
            category: data.category,
            department: data.department,
            permissions: JSON.stringify(data.permissions),
            icon: data.icon,
            color: data.color,
            canHaveReports: data.canHaveReports,
            createdBy: userId,
        }).returning();

        return NextResponse.json({
            success: true,
            role: {
                ...newRole,
                permissions: data.permissions,
            }
        });

    } catch (error) {
        console.error('Error creating role:', error);
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
}

