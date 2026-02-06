'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

export type UserRole = 'student' | 'parent' | 'teacher' | 'staff' | 'admin' | 'owner';

const ROLE_HIERARCHY: Record<UserRole, number> = {
    owner: 6,
    admin: 5,
    staff: 4,
    teacher: 3,
    parent: 2,
    student: 1,
};

interface UseRoleReturn {
    role: UserRole;
    isLoading: boolean;
    hasRole: (requiredRole: UserRole) => boolean;
    hasAnyRole: (roles: UserRole[]) => boolean;
    isStudent: boolean;
    isParent: boolean;
    isTeacher: boolean;
    isStaff: boolean;
    isAdmin: boolean;
    isOwner: boolean;
}

export function useRole(): UseRoleReturn {
    const { user, isLoaded } = useUser();
    const [role, setRole] = useState<UserRole>('student');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && user) {
            // Get role from user metadata or fetch from API
            const userRole = (user.publicMetadata?.role as UserRole) || 'student';
            setRole(userRole);
            setIsLoading(false);
        } else if (isLoaded && !user) {
            setIsLoading(false);
        }
    }, [isLoaded, user]);

    const hasRole = (requiredRole: UserRole): boolean => {
        return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
    };

    const hasAnyRole = (roles: UserRole[]): boolean => {
        return roles.includes(role);
    };

    return {
        role,
        isLoading,
        hasRole,
        hasAnyRole,
        isStudent: role === 'student',
        isParent: role === 'parent',
        isTeacher: role === 'teacher',
        isStaff: role === 'staff',
        isAdmin: role === 'admin',
        isOwner: role === 'owner',
    };
}

// Component for role-based rendering
interface RequireRoleProps {
    role: UserRole | UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
    const { hasRole, hasAnyRole, isLoading } = useRole();

    if (isLoading) {
        return null;
    }

    const hasAccess = Array.isArray(role)
        ? hasAnyRole(role)
        : hasRole(role);

    if (!hasAccess) {
        return <>{ fallback } </>;
    }

    return <>{ children } </>;
}

// Hook for checking specific permissions
export function usePermission(permission: string): boolean {
    const { role } = useRole();

    const PERMISSIONS: Record<string, UserRole[]> = {
        'courses:read': ['student', 'parent', 'teacher', 'staff', 'admin', 'owner'],
        'courses:write': ['teacher', 'admin', 'owner'],
        'students:read:all': ['teacher', 'staff', 'admin', 'owner'],
        'invoices:read:all': ['staff', 'admin', 'owner'],
        'leads:read': ['staff', 'admin', 'owner'],
        'leads:write': ['staff', 'admin', 'owner'],
        'classes:write': ['staff', 'admin', 'owner'],
        'attendance:write': ['teacher', 'staff', 'admin', 'owner'],
        'reports:financial': ['admin', 'owner'],
        'settings:write': ['owner'],
    };

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;

    return allowedRoles.includes(role);
}

