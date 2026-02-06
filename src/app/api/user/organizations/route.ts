/**
 * User Organizations API
 * 
 * GET /api/user/organizations - Get all organizations the user is a member of
 * POST /api/user/organizations/switch - Switch active organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, organizations, organizationMemberships, persons } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const ACTIVE_ORG_COOKIE = 'nodezero_active_org';

export async function GET() {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the user's personId
        const user = await db.query.users.findFirst({
            where: eq(users.id, personId),
            columns: { personId: true, organizationId: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all org memberships for this person
        let userOrgs: Array<{
            id: string;
            name: string;
            slug: string;
            type: string | null;
            role: string;
            logoUrl: string | null;
            primaryColor: string | null;
        }> = [];

        if (user.personId) {
            // New architecture: use organizationMemberships
            const memberships = await db
                .select({
                    orgId: organizations.id,
                    orgName: organizations.name,
                    orgSlug: organizations.slug,
                    orgType: organizations.type,
                    role: organizationMemberships.role,
                    logoUrl: organizations.logoUrl,
                    primaryColor: organizations.primaryColor,
                })
                .from(organizationMemberships)
                .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
                .where(
                    and(
                        eq(organizationMemberships.personId, user.personId),
                        eq(organizationMemberships.status, 'active')
                    )
                );

            userOrgs = memberships.map(m => ({
                id: m.orgId,
                name: m.orgName,
                slug: m.orgSlug,
                type: m.orgType,
                role: m.role,
                logoUrl: m.logoUrl,
                primaryColor: m.primaryColor,
            }));
        }

        // Fallback: if no memberships, use user.organizationId
        if (userOrgs.length === 0 && user.organizationId) {
            const org = await db.query.organizations.findFirst({
                where: eq(organizations.id, user.organizationId),
                columns: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true,
                    logoUrl: true,
                    primaryColor: true,
                },
            });
            if (org) {
                userOrgs = [{
                    ...org,
                    role: 'staff', // Default role
                }];
            }
        }

        // Get the active org from cookie
        const cookieStore = await cookies();
        const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

        return NextResponse.json({
            organizations: userOrgs,
            activeOrgId: activeOrgId || userOrgs[0]?.id || null,
        });

    } catch (error) {
        console.error('Error fetching user organizations:', error);
        return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();
        if (!personId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { organizationId } = await request.json();
        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
        }

        // Verify user has access to this org
        const user = await db.query.users.findFirst({
            where: eq(users.id, personId),
            columns: { personId: true, organizationId: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user is a member of this org
        let hasAccess = false;

        if (user.personId) {
            const membership = await db.query.organizationMemberships.findFirst({
                where: and(
                    eq(organizationMemberships.personId, user.personId),
                    eq(organizationMemberships.organizationId, organizationId),
                    eq(organizationMemberships.status, 'active')
                ),
            });
            hasAccess = !!membership;
        }

        // Fallback: check user.organizationId
        if (!hasAccess && user.organizationId === organizationId) {
            hasAccess = true;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 });
        }

        // Set the active org cookie
        const cookieStore = await cookies();
        cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return NextResponse.json({ success: true, activeOrgId: organizationId });

    } catch (error) {
        console.error('Error switching organization:', error);
        return NextResponse.json({ error: 'Failed to switch organization' }, { status: 500 });
    }
}


