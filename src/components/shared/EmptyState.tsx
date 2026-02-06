'use client';

import { Stack, Text, ThemeIcon, Button, Paper, PaperProps } from '@mantine/core';
import { IconMoodEmpty, IconPlus, TablerIcon } from '@tabler/icons-react';
import Link from 'next/link';

interface EmptyStateProps extends Omit<PaperProps, 'children'> {
    icon?: TablerIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon = IconMoodEmpty,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    ...props
}: EmptyStateProps) {
    const actionButton = actionLabel && (
        actionHref ? (
            <Link href={actionHref} passHref legacyBehavior>
                <Button component="a" leftSection={<IconPlus size={16} />} variant="light">
                    {actionLabel}
                </Button>
            </Link>
        ) : (
            <Button leftSection={<IconPlus size={16} />} variant="light" onClick={onAction}>
                {actionLabel}
            </Button>
        )
    );

    return (
        <Paper p="xl" radius="md" withBorder {...props}>
            <Stack align="center" gap="md" py="xl">
                <ThemeIcon size={64} variant="light" color="gray" radius="xl">
                    <Icon size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                    <Text size="lg" fw={600} c="dimmed">{title}</Text>
                    {description && (
                        <Text size="sm" c="dimmed" mt={4}>{description}</Text>
                    )}
                </div>
                {actionButton}
            </Stack>
        </Paper>
    );
}

export default EmptyState;

