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


