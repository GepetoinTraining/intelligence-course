/**
 * Permission Middleware for API Routes
 * 
 * Wraps API route handlers to enforce permission checks.
 * Uses the hasPermission utility to verify access before
 * allowing the handler to execute.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { hasPermission, PermissionContext, PermissionCheckResult } from './permissions';

export interface WithPermissionOptions {
    /** The action code to check (e.g., 'wiki.create') */
    action: string;
    /** Optional: Extract resource context from the request */
    getContext?: (req: NextRequest, params?: Record<string, string>) => Promise<Partial<PermissionContext>>;
    /** Optional: Custom unauthorized response */
    onUnauthorized?: (result: PermissionCheckResult) => NextResponse;
    /** If true, skip check for specific roles (e.g., 'owner') */
    skipForRoles?: string[];
}

export type ProtectedHandler = (
    req: NextRequest,
    context: {
        params?: Record<string, string>;
        permission: PermissionCheckResult;
        userId: string;
        orgId: string;
    }
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with permission checking
 * 
 * @example
 * ```ts
 * export const DELETE = withPermission({
 *   action: 'wiki.delete',
 *   getContext: async (req) => ({
 *     resourceOwnerId: req.nextUrl.searchParams.get('ownerId') || undefined,
 *   }),
 * })(async (req, { permission, userId }) => {
 *   // Handler code - permission already verified
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withPermission(options: WithPermissionOptions) {
    return (handler: ProtectedHandler) => {
        return async (req: NextRequest, routeContext?: { params?: Record<string, string> }) => {
            try {
                // Get authentication
                const { userId, orgId } = await auth();

                if (!userId) {
                    return NextResponse.json(
                        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
                        { status: 401 }
                    );
                }

                if (!orgId) {
                    return NextResponse.json(
                        { error: 'Organization required', code: 'ORG_REQUIRED' },
                        { status: 403 }
                    );
                }

                // Build permission context
                const baseContext: PermissionContext = { userId, orgId };

                if (options.getContext) {
                    const additionalContext = await options.getContext(req, routeContext?.params);
                    Object.assign(baseContext, additionalContext);
                }

                // Check permission
                const result = await hasPermission(options.action, baseContext);

                if (!result.allowed) {
                    if (options.onUnauthorized) {
                        return options.onUnauthorized(result);
                    }

                    return NextResponse.json(
                        {
                            error: 'Permission denied',
                            code: 'PERMISSION_DENIED',
                            action: options.action,
                            scope: result.scope,
                        },
                        { status: 403 }
                    );
                }

                // Permission granted - call the handler
                return handler(req, {
                    params: routeContext?.params,
                    permission: result,
                    userId,
                    orgId,
                });
            } catch (error) {
                console.error('Permission middleware error:', error);
                return NextResponse.json(
                    { error: 'Internal server error' },
                    { status: 500 }
                );
            }
        };
    };
}

/**
 * Check multiple permissions (all must pass)
 */
export function withPermissions(actions: string[]) {
    return (handler: ProtectedHandler) => {
        return async (req: NextRequest, routeContext?: { params?: Record<string, string> }) => {
            const { userId, orgId } = await auth();

            if (!userId || !orgId) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            const ctx: PermissionContext = { userId, orgId };
            const results: PermissionCheckResult[] = [];

            for (const action of actions) {
                const result = await hasPermission(action, ctx);
                results.push(result);

                if (!result.allowed) {
                    return NextResponse.json(
                        {
                            error: 'Permission denied',
                            action,
                            requiredActions: actions,
                        },
                        { status: 403 }
                    );
                }
            }

            // Use the most permissive result
            const bestResult = results.reduce((best, curr) =>
                (curr.scope === 'global' || curr.scope === 'organization') ? curr : best
                , results[0]);

            return handler(req, {
                params: routeContext?.params,
                permission: bestResult,
                userId,
                orgId,
            });
        };
    };
}

/**
 * Check any of multiple permissions (at least one must pass)
 */
export function withAnyPermission(actions: string[]) {
    return (handler: ProtectedHandler) => {
        return async (req: NextRequest, routeContext?: { params?: Record<string, string> }) => {
            const { userId, orgId } = await auth();

            if (!userId || !orgId) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }

            const ctx: PermissionContext = { userId, orgId };
            let grantedResult: PermissionCheckResult | null = null;

            for (const action of actions) {
                const result = await hasPermission(action, ctx);
                if (result.allowed) {
                    grantedResult = result;
                    break;
                }
            }

            if (!grantedResult) {
                return NextResponse.json(
                    {
                        error: 'Permission denied',
                        requiredAnyOf: actions,
                    },
                    { status: 403 }
                );
            }

            return handler(req, {
                params: routeContext?.params,
                permission: grantedResult,
                userId,
                orgId,
            });
        };
    };
}

/**
 * Helper to create permission-checking middleware for common patterns
 */
export const protect = {
    /** Require create permission */
    create: (module: string) => withPermission({ action: `${module}.create` }),

    /** Require read permission */
    read: (module: string) => withPermission({ action: `${module}.read` }),

    /** Require update permission */
    update: (module: string) => withPermission({ action: `${module}.update` }),

    /** Require delete permission */
    delete: (module: string) => withPermission({ action: `${module}.delete` }),

    /** Require manage permission (typically for admin actions) */
    manage: (module: string) => withPermission({ action: `${module}.manage` }),

    /** Require approve permission */
    approve: (module: string) => withPermission({ action: `${module}.approve` }),
};

/**
 * Example usage in API routes:
 * 
 * ```ts
 * // Simple protection
 * export const POST = protect.create('wiki')(async (req, { userId, orgId, permission }) => {
 *   const body = await req.json();
 *   // ... create wiki entry
 *   return NextResponse.json({ success: true });
 * });
 * 
 * // With resource context (for scope checking)
 * export const DELETE = withPermission({
 *   action: 'wiki.delete',
 *   getContext: async (req, params) => ({
 *     resourceOwnerId: params?.ownerId,
 *     resourceTeamId: params?.teamId,
 *   }),
 * })(async (req, { permission }) => {
 *   // If we get here, user has permission within the appropriate scope
 *   return NextResponse.json({ deleted: true });
 * });
 * 
 * // Require multiple permissions
 * export const PUT = withPermissions(['wiki.update', 'wiki.publish'])(
 *   async (req, ctx) => { ... }
 * );
 * 
 * // Require any of multiple permissions
 * export const GET = withAnyPermission(['wiki.read', 'wiki.manage'])(
 *   async (req, ctx) => { ... }
 * );
 * ```
 */

