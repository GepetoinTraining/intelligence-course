'use client';

import { useState } from 'react';
import {
    TextInput,
    Button,
    Stack,
    Text,
    Group,
    Badge,
    Paper,
    Alert,
} from '@mantine/core';
import { IconCheck, IconKey, IconAlertCircle } from '@tabler/icons-react';

interface ApiKeyInputProps {
    provider: 'anthropic' | 'openai' | 'google' | 'groq';
    existingHint?: string;
    onSaved?: () => void;
}

const providerLabels = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    groq: 'Groq',
};

const providerPlaceholders = {
    anthropic: 'sk-ant-...',
    openai: 'sk-...',
    google: 'AIza...',
    groq: 'gsk_...',
};

export function ApiKeyInput({ provider, existingHint, onSaved }: ApiKeyInputProps) {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setError('Please enter an API key');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('/api/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, apiKey }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to save API key');
                return;
            }

            setSuccess(true);
            setApiKey('');
            onSaved?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper shadow="xs" radius="md" p="md" withBorder>
            <Stack gap="sm">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconKey size={16} />
                        <Text fw={500}>{providerLabels[provider]}</Text>
                    </Group>
                    {existingHint && (
                        <Badge variant="light" color="green" leftSection={<IconCheck size={12} />}>
                            Configured (...{existingHint})
                        </Badge>
                    )}
                </Group>

                <TextInput
                    type="password"
                    placeholder={providerPlaceholders[provider]}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    rightSection={
                        success ? <IconCheck size={16} color="green" /> : null
                    }
                />

                {error && (
                    <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" py="xs">
                        {error}
                    </Alert>
                )}

                <Button
                    size="sm"
                    variant="light"
                    onClick={handleSave}
                    loading={isLoading}
                    disabled={!apiKey.trim()}
                >
                    {existingHint ? 'Update Key' : 'Save Key'}
                </Button>
            </Stack>
        </Paper>
    );
}

