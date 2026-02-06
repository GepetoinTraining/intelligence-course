'use client';

import { Card, Stack, Group, Text, CardProps } from '@mantine/core';

interface SectionCardProps extends Omit<CardProps, 'children'> {
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    noPadding?: boolean;
}

export function SectionCard({
    title,
    subtitle,
    actions,
    children,
    noPadding = false,
    ...props
}: SectionCardProps) {
    return (
        <Card shadow="xs" radius="md" withBorder {...props} p={noPadding ? 0 : undefined}>
            {(title || actions) && (
                <Card.Section p="md" withBorder={noPadding}>
                    <Group justify="space-between">
                        <div>
                            {title && <Text fw={600}>{title}</Text>}
                            {subtitle && <Text size="sm" c="dimmed">{subtitle}</Text>}
                        </div>
                        {actions}
                    </Group>
                </Card.Section>
            )}
            {noPadding ? children : <Stack gap="md">{children}</Stack>}
        </Card>
    );
}

export default SectionCard;

