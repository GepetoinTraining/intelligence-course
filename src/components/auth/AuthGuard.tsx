'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserContext } from '@/hooks/useUser';
import { Center, Loader, Stack, Text, Alert, Button, Container, Card } from '@mantine/core';
import { IconClock, IconInfoCircle } from '@tabler/icons-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isLoading, isAuthenticated, needsOnboarding, approvalStatus } = useUserContext();

    useEffect(() => {
        if (!isLoading && isAuthenticated && needsOnboarding) {
            // Redirect to onboarding if not already there
            if (!pathname.startsWith('/onboarding')) {
                router.push('/onboarding');
            }
        }
    }, [isLoading, isAuthenticated, needsOnboarding, pathname, router]);

    // Show loading state
    if (isLoading) {
        return (
            <Center h="100vh">
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Carregando...</Text>
                </Stack>
            </Center>
        );
    }

    // Show pending approval state
    if (isAuthenticated && !needsOnboarding && approvalStatus === 'pending') {
        return (
            <Center h="100vh" bg="gray.1">
                <Container size="sm">
                    <Card shadow="lg" radius="lg" p="xl">
                        <Stack align="center" gap="lg">
                            <IconClock size={60} color="var(--mantine-color-blue-5)" />
                            <Text size="xl" fw={600} ta="center">
                                Aguardando Aprovação
                            </Text>
                            <Text c="dimmed" ta="center">
                                Sua solicitação de acesso está sendo analisada.
                                Você receberá um email quando for aprovado.
                            </Text>
                            <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                                Enquanto aguarda, você pode explorar nossa página inicial
                                ou entrar em contato conosco.
                            </Alert>
                            <Button variant="light" onClick={() => router.push('/')}>
                                Voltar para Home
                            </Button>
                        </Stack>
                    </Card>
                </Container>
            </Center>
        );
    }

    // Redirect to onboarding if needed
    if (isAuthenticated && needsOnboarding && !pathname.startsWith('/onboarding')) {
        return (
            <Center h="100vh">
                <Loader size="lg" />
            </Center>
        );
    }

    return <>{children}</>;
}

