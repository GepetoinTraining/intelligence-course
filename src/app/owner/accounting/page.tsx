'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader, Text, Stack } from '@mantine/core';

/**
 * Owner Accounting - Redirects to the full Chart of Accounts in admin
 * 
 * The full accounting functionality is in /admin/contabil/plano-contas
 * This page provides a quick link for owners from the dashboard nav.
 */
export default function OwnerAccountingPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the full accounting module
        router.replace('/admin/contabil/plano-contas');
    }, [router]);

    return (
        <Center h="100vh">
            <Stack align="center" gap="xs">
                <Loader size="lg" />
                <Text c="dimmed">Redirecionando para Plano de Contas...</Text>
            </Stack>
        </Center>
    );
}
