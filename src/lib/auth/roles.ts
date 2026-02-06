import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Role hierarchy - higher roles have access to lower role features
export const ROLE_HIERARCHY = {
    owner: 6,
    admin: 5,
    staff: 4,
    teacher: 3,
    parent: 2,
    student: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

export interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    organizationId: string | null;
}

// Get current user with role from database
export async function getCurrentUser(): Promise<AuthUser | null> {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (user.length === 0) {
        return null;
    }

    return {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        role: (user[0].role as UserRole) || 'student',
        organizationId: user[0].organizationId,
    };
}

// Check if user has required role or higher
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Check if user has any of the specified roles
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(userRole);
}

// Role-based permissions
export const PERMISSIONS = {
    // Course management
    'courses:read': ['student', 'parent', 'teacher', 'staff', 'admin', 'owner'],
    'courses:write': ['teacher', 'admin', 'owner'],
    'courses:delete': ['admin', 'owner'],

    // Student data
    'students:read:own': ['student', 'parent'],
    'students:read:all': ['teacher', 'staff', 'admin', 'owner'],
    'students:write': ['staff', 'admin', 'owner'],

    // Financial
    'invoices:read:own': ['student', 'parent'],
    'invoices:read:all': ['staff', 'admin', 'owner'],
    'invoices:write': ['staff', 'admin', 'owner'],
    'payments:process': ['staff', 'admin', 'owner'],
    'payroll:read': ['teacher', 'admin', 'owner'],
    'payroll:write': ['owner'],

    // CRM
    'leads:read': ['staff', 'admin', 'owner'],
    'leads:write': ['staff', 'admin', 'owner'],
    'campaigns:read': ['staff', 'admin', 'owner'],
    'campaigns:write': ['admin', 'owner'],

    // School operations
    'classes:read': ['teacher', 'staff', 'admin', 'owner'],
    'classes:write': ['staff', 'admin', 'owner'],
    'attendance:read:own': ['student', 'parent', 'teacher'],
    'attendance:read:all': ['staff', 'admin', 'owner'],
    'attendance:write': ['teacher', 'staff', 'admin', 'owner'],
    'rooms:read': ['teacher', 'staff', 'admin', 'owner'],
    'rooms:write': ['admin', 'owner'],

    // Reports
    'reports:basic': ['teacher', 'staff', 'admin', 'owner'],
    'reports:financial': ['admin', 'owner'],
    'reports:full': ['owner'],

    // Settings
    'settings:read': ['admin', 'owner'],
    'settings:write': ['owner'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Check if user has permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
    const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
    return allowedRoles.includes(userRole);
}

// Middleware helper for API routes
export async function requireRole(requiredRole: UserRole) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    if (!hasRole(user.role, requiredRole)) {
        throw new Error('Forbidden');
    }

    return user;
}

// Middleware helper for permissions
export async function requirePermission(permission: Permission) {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    if (!hasPermission(user.role, permission)) {
        throw new Error('Forbidden');
    }

    return user;
}

