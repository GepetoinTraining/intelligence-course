'use client';

import { Stack, Group, Title, Text, Button, Paper, Breadcrumbs, Anchor, ActionIcon } from '@mantine/core';
import { IconChevronLeft, TablerIcon } from '@tabler/icons-react';
import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: TablerIcon;
    backHref?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: React.ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    backHref,
    breadcrumbs,
    actions,
}: PageHeaderProps) {
    return (
        <Stack gap="xs">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs>
                    {breadcrumbs.map((item, index) => (
                        item.href ? (
                            <Link key={index} href={item.href} passHref legacyBehavior>
                                <Anchor size="sm" component="a">{item.label}</Anchor>
                            </Link>
                        ) : (
                            <Text key={index} size="sm" c="dimmed">{item.label}</Text>
                        )
                    ))}
                </Breadcrumbs>
            )}

            <Group justify="space-between" align="flex-start">
                <Group>
                    {backHref && (
                        <Link href={backHref} passHref legacyBehavior>
                            <ActionIcon component="a" variant="subtle" size="lg">
                                <IconChevronLeft size={20} />
                            </ActionIcon>
                        </Link>
                    )}
                    {Icon && (
                        <Paper p="xs" radius="md" withBorder>
                            <Icon size={24} />
                        </Paper>
                    )}
                    <div>
                        <Title order={2}>{title}</Title>
                        {subtitle && <Text c="dimmed">{subtitle}</Text>}
                    </div>
                </Group>
                {actions && (
                    <Group gap="sm">
                        {actions}
                    </Group>
                )}
            </Group>
        </Stack>
    );
}

export default PageHeader;

