'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/hooks/useUser';
import { Center, Loader, Stack, Text } from '@mantine/core';

// Map roles to their dashboard routes
const ROLE_DASHBOARDS: Record<string, string> = {
    student: '/student',
    parent: '/parent',
    teacher: '/teacher',
    staff: '/school',      // Sales/marketing staff uses school dashboard
    admin: '/school',      // Admin uses school dashboard
    owner: '/school',      // Owner uses school dashboard
    accountant: '/school', // Accountant uses school dashboard
    talent: '/talent',     // Talent role uses talent dashboard
};

export default function GoRedirect() {
    const router = useRouter();
    const { user, isLoading, role, needsOnboarding, approvalStatus } = useUserContext();

    useEffect(() => {
        if (isLoading) return;

        // If user needs onboarding, redirect there
        if (needsOnboarding) {
            router.replace('/onboarding');
            return;
        }

        // If approval is pending, stay on pending page
        if (approvalStatus === 'pending') {
            // The AuthGuard will show the pending screen
            return;
        }

        // Redirect to role-specific dashboard
        const dashboard = ROLE_DASHBOARDS[role] || '/student';
        router.replace(dashboard);
    }, [isLoading, needsOnboarding, approvalStatus, role, router]);

    return (
        <Center h="100vh">
            <Stack align="center" gap="md">
                <Loader size="lg" color="violet" />
                <Text c="dimmed">Redirecionando para seu painel...</Text>
            </Stack>
        </Center>
    );
}

