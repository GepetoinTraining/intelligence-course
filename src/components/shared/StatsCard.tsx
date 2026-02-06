'use client';

import { Paper, Group, Stack, Text, ThemeIcon, RingProgress, PaperProps } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight, IconMinus, TablerIcon } from '@tabler/icons-react';

interface StatsCardProps extends Omit<PaperProps, 'children'> {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: TablerIcon;
    color?: string;
    trend?: { value: number; label?: string };
    progress?: { value: number; max: number };
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    trend,
    progress,
    ...props
}: StatsCardProps) {
    const TrendIcon = trend
        ? trend.value > 0
            ? IconArrowUpRight
            : trend.value < 0
                ? IconArrowDownRight
                : IconMinus
        : null;

    const trendColor = trend
        ? trend.value > 0
            ? 'green'
            : trend.value < 0
                ? 'red'
                : 'gray'
        : 'gray';

    return (
        <Paper shadow="xs" radius="md" p="lg" withBorder {...props}>
            <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                        {title}
                    </Text>
                    <Text size="xl" fw={700}>
                        {value}
                    </Text>
                    {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}

                    {trend && (
                        <Group gap={4}>
                            {TrendIcon && (
                                <ThemeIcon size="xs" variant="light" color={trendColor} radius="xl">
                                    <TrendIcon size={10} />
                                </ThemeIcon>
                            )}
                            <Text size="xs" c={trendColor} fw={500}>
                                {trend.value > 0 ? '+' : ''}{trend.value}%
                            </Text>
                            {trend.label && (
                                <Text size="xs" c="dimmed">{trend.label}</Text>
                            )}
                        </Group>
                    )}
                </Stack>

                {Icon && !progress && (
                    <ThemeIcon size={48} variant="light" color={color} radius="md">
                        <Icon size={24} />
                    </ThemeIcon>
                )}

                {progress && (
                    <RingProgress
                        size={60}
                        thickness={6}
                        roundCaps
                        sections={[{ value: (progress.value / progress.max) * 100, color }]}
                        label={
                            <Text ta="center" size="xs" fw={700}>
                                {Math.round((progress.value / progress.max) * 100)}%
                            </Text>
                        }
                    />
                )}
            </Group>
        </Paper>
    );
}

export default StatsCard;

