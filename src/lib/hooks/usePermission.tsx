/**
 * Permission System Hooks & Utilities
 * 
 * Use these to check if the current user can perform actions on modules.
 */

import { useCallback, useEffect, useState } from 'react';
import type { PermissionModule } from '@/lib/db/schema';

// ============================================================================
// Types
// ============================================================================

export interface Permission {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

export interface UserPermissionSet {
    module: PermissionModule;
    permissions: Permission;
}

// ============================================================================
// Hook: usePermission
// ============================================================================

/**
 * Hook to check if current user has permission for a specific module
 * 
 * @example
 * const { canRead, canCreate } = usePermission('teacher_attendance');
 * if (!canRead) return <AccessDenied />;
 */
export function usePermission(module: PermissionModule): Permission & { loading: boolean } {
    const [permission, setPermission] = useState<Permission>({
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermission() {
            try {
                const res = await fetch(`/api/permissions/check?module=${module}`);
                if (res.ok) {
                    const data = await res.json();
                    setPermission(data);
                }
            } catch (error) {
                console.error('Failed to check permission:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPermission();
    }, [module]);

    return { ...permission, loading };
}

// ============================================================================
// Hook: usePermissions (multiple modules)
// ============================================================================

/**
 * Hook to check permissions for multiple modules at once
 * 
 * @example
 * const permissions = usePermissions(['teacher_attendance', 'teacher_grades']);
 * if (!permissions['teacher_grades']?.canRead) { ... }
 */
export function usePermissions(modules: PermissionModule[]): {
    permissions: Record<PermissionModule, Permission>;
    loading: boolean;
} {
    const [permissions, setPermissions] = useState<Record<PermissionModule, Permission>>(
        {} as Record<PermissionModule, Permission>
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            try {
                const res = await fetch(`/api/permissions/check?modules=${modules.join(',')}`);
                if (res.ok) {
                    const data = await res.json();
                    setPermissions(data);
                }
            } catch (error) {
                console.error('Failed to check permissions:', error);
            } finally {
                setLoading(false);
            }
        }
        if (modules.length > 0) {
            fetchPermissions();
        } else {
            setLoading(false);
        }
    }, [modules.join(',')]);

    return { permissions, loading };
}

// ============================================================================
// Component: RequirePermission
// ============================================================================

interface RequirePermissionProps {
    module: PermissionModule;
    action: 'create' | 'read' | 'update' | 'delete';
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Wrapper component that only renders children if user has permission
 * 
 * @example
 * <RequirePermission module="teacher_grades" action="update">
 *   <EditButton />
 * </RequirePermission>
 */
export function RequirePermission({
    module,
    action,
    children,
    fallback = null
}: RequirePermissionProps) {
    const permission = usePermission(module);

    if (permission.loading) {
        return null; // Or a loading spinner
    }

    const hasPermission =
        (action === 'create' && permission.canCreate) ||
        (action === 'read' && permission.canRead) ||
        (action === 'update' && permission.canUpdate) ||
        (action === 'delete' && permission.canDelete);

    return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// ============================================================================
// Utility: checkPermission (server-side)
// ============================================================================

/**
 * Server-side permission check
 * Use in API routes to verify permissions
 * 
 * @example
 * const hasPermission = await checkPermission(userId, 'teacher_grades', 'update');
 * if (!hasPermission) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 */
export async function checkPermissionServer(
    userId: string,
    module: PermissionModule,
    action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
    // This would be implemented with direct DB access
    // For now, placeholder that always returns true
    // TODO: Implement actual server-side check
    return true;
}

// ============================================================================
// Access Denied Component
// ============================================================================

export function AccessDenied({
    message = 'Você não tem permissão para acessar esta página.',
    showBackButton = true,
}: {
    message?: string;
    showBackButton?: boolean;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10 max-w-md">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
                <p className="text-white/60 mb-6">{message}</p>
                {showBackButton && (
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                    >
                        Voltar
                    </button>
                )}
            </div>
        </div>
    );
}

