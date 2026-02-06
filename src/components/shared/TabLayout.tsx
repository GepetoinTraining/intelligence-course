'use client';

import { useState, ReactNode } from 'react';
import { Tabs, Paper, Box, Group, Text, ThemeIcon, Badge, Stack } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

export interface TabItem {
    value: string;
    label: string;
    icon?: ReactNode;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
    content: ReactNode;
}

export interface TabLayoutProps {
    tabs: TabItem[];
    defaultValue?: string;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'outline' | 'pills';
    grow?: boolean;
    keepMounted?: boolean;
    onChange?: (value: string) => void;
    header?: ReactNode;
    className?: string;
}

export function TabLayout({
    tabs,
    defaultValue,
    orientation = 'horizontal',
    variant = 'default',
    grow = false,
    keepMounted = false,
    onChange,
    header,
    className,
}: TabLayoutProps) {
    const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

    const handleChange = (value: string | null) => {
        if (value) {
            setActiveTab(value);
            onChange?.(value);
        }
    };

    return (
        <Box className={className}>
            {header && <Box mb="md">{header}</Box>}

            <Tabs
                value={activeTab}
                onChange={handleChange}
                orientation={orientation}
                variant={variant}
                keepMounted={keepMounted}
            >
                <Tabs.List grow={grow} mb={orientation === 'horizontal' ? 'md' : undefined}>
                    {tabs.map((tab) => (
                        <Tabs.Tab
                            key={tab.value}
                            value={tab.value}
                            disabled={tab.disabled}
                            leftSection={tab.icon}
                            rightSection={
                                tab.badge !== undefined ? (
                                    <Badge
                                        size="xs"
                                        variant="filled"
                                        color={tab.badgeColor || 'blue'}
                                        radius="xl"
                                    >
                                        {tab.badge}
                                    </Badge>
                                ) : undefined
                            }
                        >
                            {tab.label}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>

                {tabs.map((tab) => (
                    <Tabs.Panel key={tab.value} value={tab.value}>
                        {tab.content}
                    </Tabs.Panel>
                ))}
            </Tabs>
        </Box>
    );
}

// Vertical card-style tabs (for complex navigation)
export interface VerticalTabCardItem {
    value: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
}

export interface VerticalTabCardsProps {
    items: VerticalTabCardItem[];
    activeValue: string;
    onChange: (value: string) => void;
}

export function VerticalTabCards({ items, activeValue, onChange }: VerticalTabCardsProps) {
    return (
        <Stack gap="xs">
            {items.map((item) => (
                <Paper
                    key={item.value}
                    p="sm"
                    radius="md"
                    withBorder
                    onClick={() => !item.disabled && onChange(item.value)}
                    style={{
                        cursor: item.disabled ? 'not-allowed' : 'pointer',
                        opacity: item.disabled ? 0.5 : 1,
                        borderColor: activeValue === item.value ? 'var(--mantine-color-blue-6)' : undefined,
                        backgroundColor: activeValue === item.value ? 'var(--mantine-color-blue-light)' : undefined,
                        transition: 'all 0.15s ease',
                    }}
                >
                    <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap">
                            {item.icon && (
                                <ThemeIcon
                                    size="md"
                                    variant={activeValue === item.value ? 'filled' : 'light'}
                                    color="blue"
                                >
                                    {item.icon}
                                </ThemeIcon>
                            )}
                            <div>
                                <Group gap="xs">
                                    <Text size="sm" fw={500}>{item.label}</Text>
                                    {item.badge !== undefined && (
                                        <Badge size="xs" color={item.badgeColor || 'gray'}>
                                            {item.badge}
                                        </Badge>
                                    )}
                                </Group>
                                {item.description && (
                                    <Text size="xs" c="dimmed">{item.description}</Text>
                                )}
                            </div>
                        </Group>
                        <IconChevronRight
                            size={16}
                            style={{
                                opacity: activeValue === item.value ? 1 : 0.3,
                                color: activeValue === item.value ? 'var(--mantine-color-blue-6)' : undefined,
                            }}
                        />
                    </Group>
                </Paper>
            ))}
        </Stack>
    );
}

export default TabLayout;

