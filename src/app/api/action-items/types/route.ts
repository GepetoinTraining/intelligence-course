/**
 * Action Item Types API (Owner Only)
 * 
 * GET /api/action-items/types - List all action item types for org
 * POST /api/action-items/types - Create new action item type
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { actionItemTypes, organizationMemberships } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';

        // Get organization's action item types
        const conditions = [eq(actionItemTypes.organizationId, orgId)];
        if (!includeInactive) {
            conditions.push(eq(actionItemTypes.isActive, true));
        }

        const types = await db.select().from(actionItemTypes)
            .where(and(...conditions))
            .orderBy(actionItemTypes.sortOrder);

        // Parse JSON fields
        const parsedTypes = types.map(t => ({
            ...t,
            allowedEntities: t.allowedEntities ? JSON.parse(t.allowedEntities) : [],
            customFields: t.customFields ? JSON.parse(t.customFields) : [],
            visibleToRoles: t.visibleToRoles ? JSON.parse(t.visibleToRoles) : [],
        }));

        return NextResponse.json({ types: parsedTypes });

    } catch (error) {
        console.error('Error fetching action item types:', error);
        return NextResponse.json({ error: 'Failed to fetch action item types' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is owner/admin via org membership
        const membership = await db.query.organizationMemberships.findFirst({
            where: and(
                eq(organizationMemberships.personId, personId),
                eq(organizationMemberships.organizationId, orgId),
                inArray(organizationMemberships.role, ['owner', 'admin'])
            ),
        });

        if (!membership) {
            return NextResponse.json({ error: 'Only owners/admins can create action item types' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            description,
            icon,
            color,
            allowedEntities,
            defaultPriority,
            defaultDurationMinutes,
            customFields,
            requiresNote,
            requiresOutcome,
            autoCreateFollowUp,
            visibleToRoles,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'name required' }, { status: 400 });
        }

        // Get max sort order
        const existing = await db.select({ sortOrder: actionItemTypes.sortOrder })
            .from(actionItemTypes)
            .where(eq(actionItemTypes.organizationId, orgId))
            .orderBy(actionItemTypes.sortOrder);

        const maxSort = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder || 0)) : 0;

        // Create the type
        const [newType] = await db.insert(actionItemTypes).values({
            organizationId: orgId,
            name,
            description: description || null,
            icon: icon || 'IconChecklist',
            color: color || 'blue',
            allowedEntities: allowedEntities ? JSON.stringify(allowedEntities) : '[]',
            defaultPriority: defaultPriority || 'medium',
            defaultDurationMinutes: defaultDurationMinutes || 30,
            customFields: customFields ? JSON.stringify(customFields) : '[]',
            requiresNote: requiresNote || false,
            requiresOutcome: requiresOutcome || false,
            autoCreateFollowUp: autoCreateFollowUp || false,
            visibleToRoles: visibleToRoles ? JSON.stringify(visibleToRoles) : '["owner", "admin", "staff"]',
            sortOrder: maxSort + 1,
            createdBy: personId,
        }).returning();

        return NextResponse.json({
            success: true,
            type: {
                ...newType,
                allowedEntities: allowedEntities || [],
                customFields: customFields || [],
                visibleToRoles: visibleToRoles || ['owner', 'admin', 'staff'],
            },
        });

    } catch (error) {
        console.error('Error creating action item type:', error);
        return NextResponse.json({ error: 'Failed to create action item type' }, { status: 500 });
    }
}



