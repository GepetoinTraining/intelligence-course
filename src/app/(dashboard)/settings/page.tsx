'use client';

import { useEffect, useState } from 'react';
import { Container, Title, Text, Stack, Group, Paper, Loader } from '@mantine/core';
import dynamic from 'next/dynamic';
import { ApiKeyInput } from '@/components/ui/ApiKeyInput';

// Dynamically import UserButton to prevent SSR issues
const UserButton = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.UserButton),
    { ssr: false, loading: () => <div style={{ width: 32, height: 32 }} /> }
);

interface ApiKeyInfo {
    provider: string;
    keyHint: string;
    lastUsedAt: number | null;
    totalRequests: number;
}

export default function SettingsPage() {
    const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchKeys = async () => {
        try {
            const response = await fetch('/api/api-keys');
            const data = await response.json();
            setKeys(data.keys || []);
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const getExistingHint = (provider: string) => {
        const key = keys.find((k) => k.provider === provider);
        return key?.keyHint;
    };

    return (
        <Container size="md" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="center">
                    <Stack gap={4}>
                        <Title order={2}>Settings</Title>
                        <Text c="dimmed">Manage your API keys and preferences</Text>
                    </Stack>
                    <UserButton afterSignOutUrl="/" />
                </Group>

                {/* API Keys Section */}
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Stack gap="md">
                        <div>
                            <Title order={4}>API Keys</Title>
                            <Text c="dimmed" size="sm">
                                Your API keys are encrypted and stored securely. We never see your actual keys.
                            </Text>
                        </div>

                        {isLoading ? (
                            <Group justify="center" py="xl">
                                <Loader size="sm" />
                            </Group>
                        ) : (
                            <Stack gap="md">
                                <ApiKeyInput
                                    provider="anthropic"
                                    existingHint={getExistingHint('anthropic')}
                                    onSaved={fetchKeys}
                                />
                                {/* Other providers disabled for MVP */}
                                {/* <ApiKeyInput provider="openai" existingHint={getExistingHint('openai')} onSaved={fetchKeys} /> */}
                            </Stack>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}

