'use client';

import { Paper, Text, Skeleton, Stack, Alert, Code } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface OutputDisplayProps {
    output?: string;
    error?: { code: string; message: string };
    isLoading: boolean;
}

export function OutputDisplay({ output, error, isLoading }: OutputDisplayProps) {
    if (isLoading) {
        return (
            <Stack gap="sm" style={{ flex: 1 }}>
                <Skeleton height={20} width="80%" />
                <Skeleton height={20} width="60%" />
                <Skeleton height={20} width="70%" />
                <Skeleton height={20} width="50%" />
            </Stack>
        );
    }

    if (error) {
        return (
            <Alert
                icon={<IconAlertCircle size={16} />}
                title={`Error (${error.code})`}
                color="red"
                variant="light"
            >
                {error.message}
            </Alert>
        );
    }

    if (!output) {
        return (
            <Paper
                p="xl"
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--mantine-color-gray-0)',
                    border: '2px dashed var(--mantine-color-gray-3)',
                }}
                radius="md"
            >
                <Text c="dimmed" ta="center">
                    Run a prompt to see the output here
                </Text>
            </Paper>
        );
    }

    return (
        <Paper
            p="md"
            style={{
                flex: 1,
                overflow: 'auto',
                background: 'var(--mantine-color-gray-0)',
            }}
            radius="md"
        >
            <Code
                block
                style={{
                    whiteSpace: 'pre-wrap',
                    background: 'transparent',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontSize: '0.9rem',
                }}
            >
                {output}
            </Code>
        </Paper>
    );
}

