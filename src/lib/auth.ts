/**
 * Authentication Helpers
 * 
 * Identity Architecture:
 * - Clerk provides clerkUserId (auth session)
 * - users table bridges clerkUserId → personId
 * - persons table is the canonical identity
 * - organizationMemberships provides roles in each org
 * 
 * All API routes should use personId as the identity key.
 */

const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface ApiAuth {
    personId: string | null;
    orgId: string | null;
    clerkUserId: string | null;
}

export interface ApiAuthWithOrg {
    personId: string;
    orgId: string;
    clerkUserId: string;
    roles: string[];
}

// ============================================================================
// DEV MODE AUTH (Reads from DB)
// ============================================================================

/**
 * Get owner auth from database for dev mode.
 * This ensures dev mode works with real data after running bootstrap-owner.ts
 */
async function getDevAuth(): Promise<ApiAuth> {
    try {
        const { db } = await import('@/lib/db');
        const { users, organizationMemberships } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        // Find first owner membership
        const ownerMembership = await db.query.organizationMemberships.findFirst({
            where: eq(organizationMemberships.role, 'owner'),
            columns: { personId: true, organizationId: true },
        });

        if (!ownerMembership) {
            console.error(
                '❌ No owner found in database. Run: npx tsx scripts/bootstrap-owner.ts'
            );
            return { personId: null, orgId: null, clerkUserId: null };
        }

        // Find user record for this person (may not exist in dev)
        const user = await db.query.users.findFirst({
            where: eq(users.personId, ownerMembership.personId),
            columns: { id: true },
        });

        return {
            personId: ownerMembership.personId,
            orgId: ownerMembership.organizationId,
            clerkUserId: user?.id || 'dev-no-clerk',
        };
    } catch (error) {
        console.error('❌ Dev auth error:', error);
        return { personId: null, orgId: null, clerkUserId: null };
    }
}

// ============================================================================
// MAIN AUTH FUNCTIONS
// ============================================================================

/**
 * Get auth for API routes.
 * Returns personId (canonical identity), orgId, and clerkUserId.
 * 
 * In dev mode, reads owner from database.
 * In production, uses Clerk.
 */
export async function getApiAuth(): Promise<ApiAuth> {
    if (isDevMode) {
        return getDevAuth();
    }

    try {
        const { auth } = await import('@clerk/nextjs/server');
        const result = await auth();

        if (!result.userId) {
            return { personId: null, orgId: null, clerkUserId: null };
        }

        // Resolve personId from users table
        const { db } = await import('@/lib/db');
        const { users } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        const user = await db.query.users.findFirst({
            where: eq(users.id, result.userId),
            columns: { personId: true },
        });

        return {
            personId: user?.personId || null,
            orgId: result.orgId ?? null,
            clerkUserId: result.userId,
        };
    } catch {
        return { personId: null, orgId: null, clerkUserId: null };
    }
}

/**
 * Get auth for API routes with org switcher support.
 * Returns personId, orgId, clerkUserId, and roles[].
 * 
 * Priority for resolving orgId:
 * 1. Active org cookie (set via org switcher)
 * 2. Clerk's orgId (if set)
 * 3. First active membership from database
 * 
 * Throws redirect if not authenticated.
 */
export async function getApiAuthWithOrg(): Promise<ApiAuthWithOrg> {
    const baseAuth = await getApiAuth();

    if (!baseAuth.personId || !baseAuth.clerkUserId) {
        const { redirect } = await import('next/navigation');
        redirect('/sign-in');
        throw new Error('Redirect failed'); // Never reached
    }

    const { db } = await import('@/lib/db');
    const { organizationMemberships } = await import('@/lib/db/schema');
    const { eq, and } = await import('drizzle-orm');

    // Resolve orgId
    let resolvedOrgId: string | null = null;

    // Priority 1: Check for active org cookie
    if (!isDevMode) {
        try {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const activeOrgCookie = cookieStore.get('nodezero_active_org')?.value;

            if (activeOrgCookie) {
                // Verify membership exists
                const membership = await db.query.organizationMemberships.findFirst({
                    where: and(
                        eq(organizationMemberships.personId, baseAuth.personId),
                        eq(organizationMemberships.organizationId, activeOrgCookie),
                        eq(organizationMemberships.status, 'active')
                    ),
                });
                if (membership) {
                    resolvedOrgId = activeOrgCookie;
                }
            }
        } catch {
            // Cookie access failed, continue to other methods
        }
    }

    // Priority 2: Clerk's orgId
    if (!resolvedOrgId && baseAuth.orgId) {
        resolvedOrgId = baseAuth.orgId;
    }

    // Priority 3: First active membership
    if (!resolvedOrgId) {
        const firstMembership = await db.query.organizationMemberships.findFirst({
            where: and(
                eq(organizationMemberships.personId, baseAuth.personId),
                eq(organizationMemberships.status, 'active')
            ),
            columns: { organizationId: true },
        });
        resolvedOrgId = firstMembership?.organizationId || null;
    }

    if (!resolvedOrgId) {
        const { redirect } = await import('next/navigation');
        redirect('/onboarding');
        throw new Error('Redirect failed'); // Never reached
    }

    // Get all roles in this org
    const memberships = await db.select({ role: organizationMemberships.role })
        .from(organizationMemberships)
        .where(and(
            eq(organizationMemberships.personId, baseAuth.personId),
            eq(organizationMemberships.organizationId, resolvedOrgId),
            eq(organizationMemberships.status, 'active')
        ));

    const roles = memberships.map(m => m.role).filter(Boolean) as string[];

    return {
        personId: baseAuth.personId,
        orgId: resolvedOrgId,
        clerkUserId: baseAuth.clerkUserId,
        roles,
    };
}

// ============================================================================
// LEGACY COMPATIBILITY (Will be removed)
// ============================================================================

/**
 * @deprecated Use getApiAuth() and access personId
 */
export async function getAuthUserId(): Promise<string | null> {
    const { clerkUserId } = await getApiAuth();
    return clerkUserId;
}

/**
 * @deprecated Use getApiAuth() and access person data from persons table
 */
export async function getAuthUser() {
    if (isDevMode) {
        // Return minimal dev user structure
        return {
            id: 'dev-owner-clerk-id',
            firstName: 'Dev',
            lastName: 'Owner',
            fullName: 'Dev Owner',
            emailAddresses: [{ emailAddress: 'dev@nodezero.local' }],
            imageUrl: null,
        };
    }

    try {
        const { currentUser } = await import('@clerk/nextjs/server');
        return await currentUser();
    } catch {
        return null;
    }
}

/**
 * Require authentication.
 * Returns personId if authenticated, redirects to sign-in if not.
 */
export async function requireAuth(): Promise<string> {
    const { personId } = await getApiAuth();

    if (!personId) {
        const { redirect } = await import('next/navigation');
        redirect('/sign-in');
        throw new Error('Redirect failed'); // Never reached
    }

    return personId;
}
