'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

export type UserRole = 'student' | 'parent' | 'teacher' | 'staff' | 'admin' | 'owner' | 'accountant';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    role: UserRole;
    organizationId: string | null;
    preferences: Record<string, unknown>;
}

interface UserContextType {
    user: UserData | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole;
    organizationId: string | null;
    needsOnboarding: boolean;
    approvalStatus: 'approved' | 'pending' | 'rejected' | 'unknown';
    refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Dev mode user for local development
const DEV_USER: UserData = {
    id: 'dev-user-123',
    email: 'dev@test.local',
    name: 'Dev User',
    avatarUrl: null,
    role: 'student',
    organizationId: 'dev-org-123',
    preferences: {},
};

export function UserProvider({ children }: { children: ReactNode }) {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

    // In dev mode, don't call Clerk hooks at all
    if (isDevMode) {
        return (
            <UserContext.Provider
                value={{
                    user: DEV_USER,
                    isLoading: false,
                    isAuthenticated: true,
                    role: DEV_USER.role,
                    organizationId: DEV_USER.organizationId,
                    needsOnboarding: false,
                    approvalStatus: 'approved',
                    refetch: async () => { },
                }}
            >
                {children}
            </UserContext.Provider>
        );
    }

    return <ClerkUserProvider>{children}</ClerkUserProvider>;
}

function ClerkUserProvider({ children }: { children: ReactNode }) {
    const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
    const { isSignedIn, orgId } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(true);
    const [approvalStatus, setApprovalStatus] = useState<'approved' | 'pending' | 'rejected' | 'unknown'>('unknown');

    const fetchUserData = async () => {
        if (!clerkUser) {
            setUserData(null);
            setIsLoading(false);
            return;
        }

        try {
            // Fetch user data from our database
            const response = await fetch(`/api/users/${clerkUser.id}`);

            if (response.ok) {
                const { data } = await response.json();
                const prefs = typeof data.preferences === 'string'
                    ? JSON.parse(data.preferences)
                    : data.preferences || {};

                setNeedsOnboarding(!prefs.onboardingCompletedAt);
                setApprovalStatus(prefs.approvalStatus || 'unknown');

                setUserData({
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    avatarUrl: data.avatarUrl || clerkUser.imageUrl,
                    role: data.role || 'student',
                    organizationId: data.organizationId || orgId,
                    preferences: prefs,
                });
            } else if (response.status === 404) {
                // User doesn't exist in DB yet, create them
                const createResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: clerkUser.id,
                        email: clerkUser.emailAddresses[0]?.emailAddress || '',
                        name: clerkUser.fullName || clerkUser.firstName || '',
                        avatarUrl: clerkUser.imageUrl,
                        organizationId: orgId,
                        role: 'student', // Default role for new users
                    }),
                });

                if (createResponse.ok) {
                    const { data } = await createResponse.json();
                    setNeedsOnboarding(true); // New user needs onboarding
                    setApprovalStatus('unknown');
                    setUserData({
                        id: data.id,
                        email: data.email,
                        name: data.name,
                        avatarUrl: data.avatarUrl || clerkUser.imageUrl,
                        role: data.role || 'student',
                        organizationId: data.organizationId || orgId,
                        preferences: {},
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Fallback to Clerk data if DB fetch fails
            setUserData({
                id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                name: clerkUser.fullName || clerkUser.firstName || '',
                avatarUrl: clerkUser.imageUrl,
                role: 'student',
                organizationId: orgId || null,
                preferences: {},
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (clerkLoaded) {
            if (isSignedIn && clerkUser) {
                fetchUserData();
            } else {
                setUserData(null);
                setIsLoading(false);
            }
        }
    }, [clerkLoaded, isSignedIn, clerkUser?.id, orgId]);

    return (
        <UserContext.Provider
            value={{
                user: userData,
                isLoading: isLoading || !clerkLoaded,
                isAuthenticated: !!userData,
                role: userData?.role || 'student',
                organizationId: userData?.organizationId || null,
                needsOnboarding,
                approvalStatus,
                refetch: fetchUserData,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}

// Helper hook for role checking
export function useHasRole(roles: UserRole | UserRole[]) {
    const { role } = useUserContext();
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(role);
}

// Helper hook for admin-like roles
export function useIsAdmin() {
    return useHasRole(['admin', 'owner', 'staff']);
}

