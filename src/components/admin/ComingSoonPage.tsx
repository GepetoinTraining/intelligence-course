'use client';

import {
    Title,
    Text,
    Stack,
    ThemeIcon,
    Paper,
    Group,
    Badge,
} from '@mantine/core';
import { IconTool } from '@tabler/icons-react';

interface ComingSoonPageProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    features?: string[];
}

export function ComingSoonPage({ title, description, icon, color, features }: ComingSoonPageProps) {
    return (
        <Stack align="center" justify="center" h="60vh" gap="lg">
            <ThemeIcon size={80} radius="xl" variant="light" color={color}>
                {icon}
            </ThemeIcon>
            <Stack align="center" gap="xs">
                <Title order={2}>{title}</Title>
                <Text c="dimmed" ta="center" maw={400}>
                    {description}
                </Text>
            </Stack>
            {features && features.length > 0 && (
                <Paper p="lg" radius="md" withBorder maw={400} w="100%">
                    <Text size="sm" fw={500} mb="sm">Recursos planejados:</Text>
                    <Group gap="xs">
                        {features.map((feature, index) => (
                            <Badge key={index} variant="light" color={color}>
                                {feature}
                            </Badge>
                        ))}
                    </Group>
                </Paper>
            )}
            <Badge size="lg" variant="outline" leftSection={<IconTool size={14} />}>
                Em desenvolvimento
            </Badge>
        </Stack>
    );
}

