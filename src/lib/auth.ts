const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

// Dev mode user for local development (server-side)
const DEV_USER = {
    id: 'dev-user-123',
    firstName: 'Dev',
    lastName: 'User',
    fullName: 'Dev User',
    emailAddresses: [{ emailAddress: 'dev@test.local' }],
    imageUrl: null,
};

const DEV_ORG_ID = 'dev-org-123';

/**
 * Get auth for API routes.
 * In dev mode, returns mock userId and orgId.
 * In production, uses Clerk.
 */
export async function getApiAuth(): Promise<{ userId: string | null; orgId: string | null }> {
    if (isDevMode) {
        return { userId: DEV_USER.id, orgId: DEV_ORG_ID };
    }

    try {
        const { auth } = await import('@clerk/nextjs/server');
        const result = await auth();
        return { userId: result.userId, orgId: result.orgId ?? null };
    } catch {
        return { userId: null, orgId: null };
    }
}

/**
 * Get auth for API routes with org switcher support.
 * 
 * Priority for resolving orgId:
 * 1. Active org cookie (set via org switcher)
 * 2. Clerk's orgId (if set)
 * 3. User's organizationId from database
 * 
 * This is the PREFERRED method for API routes that need orgId.
 */
export async function getApiAuthWithOrg(): Promise<{ userId: string | null; orgId: string | null }> {
    if (isDevMode) {
        return { userId: DEV_USER.id, orgId: DEV_ORG_ID };
    }

    try {
        const { auth } = await import('@clerk/nextjs/server');
        const result = await auth();

        if (!result.userId) {
            return { userId: null, orgId: null };
        }

        // Priority 1: Check for active org cookie (org switcher)
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const activeOrgCookie = cookieStore.get('nodezero_active_org')?.value;

        if (activeOrgCookie) {
            // Verify user still has access to this org before using it
            const { db } = await import('@/lib/db');
            const { users, organizationMemberships } = await import('@/lib/db/schema');
            const { eq, and } = await import('drizzle-orm');

            const user = await db.query.users.findFirst({
                where: eq(users.id, result.userId),
                columns: { personId: true, organizationId: true },
            });

            if (user) {
                // Check if active org is user's default org
                if (user.organizationId === activeOrgCookie) {
                    return { userId: result.userId, orgId: activeOrgCookie };
                }

                // Check if user has membership to this org
                if (user.personId) {
                    const membership = await db.query.organizationMemberships.findFirst({
                        where: and(
                            eq(organizationMemberships.personId, user.personId),
                            eq(organizationMemberships.organizationId, activeOrgCookie),
                            eq(organizationMemberships.status, 'active')
                        ),
                    });
                    if (membership) {
                        return { userId: result.userId, orgId: activeOrgCookie };
                    }
                }
            }
            // Cookie org is invalid/inaccessible, fall through to other methods
        }

        // Priority 2: Try Clerk's orgId
        if (result.orgId) {
            return { userId: result.userId, orgId: result.orgId };
        }

        // Priority 3: Fallback to user's organizationId from database
        const { db } = await import('@/lib/db');
        const { users } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        const user = await db.query.users.findFirst({
            where: eq(users.id, result.userId),
            columns: { organizationId: true },
        });

        return {
            userId: result.userId,
            orgId: user?.organizationId ?? null
        };
    } catch {
        return { userId: null, orgId: null };
    }
}

/**
 * Get the current user ID.
 * In dev mode, returns a mock user ID.
 * In production, uses Clerk.
 */
export async function getAuthUserId(): Promise<string | null> {
    if (isDevMode) {
        return DEV_USER.id;
    }

    try {
        const { auth } = await import('@clerk/nextjs/server');
        const { userId } = await auth();
        return userId;
    } catch {
        // If Clerk middleware isn't set up, return null
        return null;
    }
}

/**
 * Get the current user details.
 * In dev mode, returns a mock user.
 * In production, uses Clerk.
 */
export async function getAuthUser() {
    if (isDevMode) {
        return DEV_USER;
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
 * In dev mode, always succeeds.
 * In production, redirects to sign-in if not authenticated.
 */
export async function requireAuth(): Promise<string> {
    const userId = await getAuthUserId();

    if (!userId) {
        const { redirect } = await import('next/navigation');
        redirect('/sign-in');
        // redirect() throws and never returns, but TypeScript doesn't know this
        throw new Error('Redirect failed'); // This line is never reached
    }

    return userId;
}

