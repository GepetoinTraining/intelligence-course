'use client';

import React, { useState, ReactNode } from 'react';
import {
    Card, Stack, Group, Text, Badge, Paper, Avatar,
    ActionIcon, Menu, ThemeIcon, Tooltip, Progress
} from '@mantine/core';
import {
    IconDotsVertical, IconArrowRight, IconGripVertical,
    IconPlus, IconCheck
} from '@tabler/icons-react';

// Types
export interface KanbanColumn {
    id: string;
    label: string;
    color: string;
    icon?: ReactNode;
    limit?: number; // WIP limit
}

export interface KanbanItem {
    id: string;
    title: string;
    subtitle?: string;
    badges?: { label: string; color: string }[];
    meta?: string;
    avatar?: {
        text: string;
        color?: string;
        src?: string;
    };
    value?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface KanbanCardAction {
    label: string;
    icon: ReactNode;
    onClick: (itemId: string) => void;
    color?: string;
}

export interface KanbanColumnAction {
    label: string;
    icon: ReactNode;
    onClick: (itemId: string, columnId: string) => void;
}

interface KanbanBoardProps {
    columns: KanbanColumn[];
    items: Record<string, KanbanItem[]>;
    onItemClick?: (item: KanbanItem) => void;
    onMoveItem?: (itemId: string, fromColumn: string, toColumn: string) => void;
    cardActions?: KanbanCardAction[];
    columnActions?: KanbanColumnAction[];
    renderCard?: (item: KanbanItem, column: KanbanColumn) => ReactNode;
    showColumnValues?: boolean;
    emptyMessage?: string;
    columnWidth?: number;
}

// Priority colors
const PRIORITY_COLORS = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
};

// Default card component
function DefaultKanbanCard({
    item,
    column,
    cardActions,
    columnActions,
    columns,
    onClick,
}: {
    item: KanbanItem;
    column: KanbanColumn;
    cardActions?: KanbanCardAction[];
    columnActions?: KanbanColumnAction[];
    columns: KanbanColumn[];
    onClick?: () => void;
}) {
    return (
        <Paper
            p="sm"
            withBorder
            radius="md"
            style={{
                cursor: onClick ? 'pointer' : 'grab',
                borderLeft: item.priority ? `3px solid var(--mantine-color-${PRIORITY_COLORS[item.priority]}-5)` : undefined,
            }}
            onClick={onClick}
        >
            <Group justify="space-between" mb="xs" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    {item.avatar && (
                        <Avatar size="sm" color={item.avatar.color || 'blue'} radius="xl" src={item.avatar.src}>
                            {item.avatar.text}
                        </Avatar>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={500} lineClamp={1}>{item.title}</Text>
                        {item.subtitle && (
                            <Text size="xs" c="dimmed" lineClamp={1}>{item.subtitle}</Text>
                        )}
                    </div>
                </Group>
                {(cardActions || columnActions) && (
                    <Menu withinPortal position="bottom-end" shadow="sm">
                        <Menu.Target>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <IconDotsVertical size={14} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {cardActions?.map((action, i) => (
                                <Menu.Item
                                    key={i}
                                    leftSection={action.icon}
                                    color={action.color}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick(item.id);
                                    }}
                                >
                                    {action.label}
                                </Menu.Item>
                            ))}
                            {cardActions && columnActions && <Menu.Divider />}
                            {columnActions && (
                                <>
                                    <Menu.Label>Mover para</Menu.Label>
                                    {columns
                                        .filter(c => c.id !== column.id)
                                        .map((targetColumn) => (
                                            <Menu.Item
                                                key={targetColumn.id}
                                                leftSection={<IconArrowRight size={14} />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    columnActions[0]?.onClick(item.id, targetColumn.id);
                                                }}
                                            >
                                                {targetColumn.label}
                                            </Menu.Item>
                                        ))}
                                </>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                )}
            </Group>

            {item.badges && item.badges.length > 0 && (
                <Group gap="xs" mb="xs">
                    {item.badges.map((badge, i) => (
                        <Badge key={i} size="xs" color={badge.color} variant="light">
                            {badge.label}
                        </Badge>
                    ))}
                </Group>
            )}

            {(item.meta || item.value !== undefined) && (
                <Group justify="space-between">
                    {item.meta && <Text size="xs" c="dimmed">{item.meta}</Text>}
                    {item.value !== undefined && (
                        <Text size="xs" fw={500} c="green">
                            R$ {item.value.toLocaleString('pt-BR')}
                        </Text>
                    )}
                </Group>
            )}
        </Paper>
    );
}

export function KanbanBoard({
    columns,
    items,
    onItemClick,
    onMoveItem,
    cardActions,
    columnActions,
    renderCard,
    showColumnValues = false,
    emptyMessage = 'Nenhum item',
    columnWidth = 280,
}: KanbanBoardProps) {
    // Calculate column totals
    const getColumnTotal = (columnId: string) => {
        const columnItems = items[columnId] || [];
        return columnItems.reduce((acc, item) => acc + (item.value || 0), 0);
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <Group align="flex-start" wrap="nowrap" gap="md" style={{ minWidth: 'max-content' }}>
                {columns.map((column) => {
                    const columnItems = items[column.id] || [];
                    const isOverLimit = column.limit && columnItems.length > column.limit;
                    const columnTotal = getColumnTotal(column.id);

                    return (
                        <Card
                            key={column.id}
                            shadow="sm"
                            radius="md"
                            p="md"
                            withBorder
                            style={{
                                width: columnWidth,
                                flexShrink: 0,
                                borderTop: `3px solid var(--mantine-color-${column.color}-5)`,
                            }}
                        >
                            {/* Column Header */}
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    {column.icon && (
                                        <ThemeIcon size="sm" variant="light" color={column.color}>
                                            {column.icon}
                                        </ThemeIcon>
                                    )}
                                    <Text fw={600}>{column.label}</Text>
                                    <Badge
                                        color={isOverLimit ? 'red' : column.color}
                                        variant="filled"
                                        size="lg"
                                    >
                                        {columnItems.length}
                                        {column.limit && `/${column.limit}`}
                                    </Badge>
                                </Group>
                            </Group>

                            {/* Column Value */}
                            {showColumnValues && columnTotal > 0 && (
                                <Paper p="xs" bg={`${column.color}.0`} radius="md" mb="sm">
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">Valor total</Text>
                                        <Text size="sm" fw={600} c={column.color}>
                                            R$ {columnTotal.toLocaleString('pt-BR')}
                                        </Text>
                                    </Group>
                                </Paper>
                            )}

                            {/* WIP Limit Warning */}
                            {isOverLimit && (
                                <Paper p="xs" bg="red.0" radius="md" mb="sm">
                                    <Text size="xs" c="red" ta="center">
                                        ⚠️ Limite WIP excedido
                                    </Text>
                                </Paper>
                            )}

                            {/* Cards */}
                            <Stack gap="sm">
                                {columnItems.length === 0 ? (
                                    <Text c="dimmed" ta="center" py="xl" size="sm">
                                        {emptyMessage}
                                    </Text>
                                ) : (
                                    columnItems.map((item) =>
                                        renderCard ? (
                                            <div key={item.id}>{renderCard(item, column)}</div>
                                        ) : (
                                            <DefaultKanbanCard
                                                key={item.id}
                                                item={item}
                                                column={column}
                                                columns={columns}
                                                cardActions={cardActions}
                                                columnActions={columnActions ? [{
                                                    label: 'Mover',
                                                    icon: <IconArrowRight size={14} />,
                                                    onClick: (itemId, targetColumn) => onMoveItem?.(itemId, column.id, targetColumn)
                                                }] : undefined}
                                                onClick={onItemClick ? () => onItemClick(item) : undefined}
                                            />
                                        )
                                    )
                                )}
                            </Stack>
                        </Card>
                    );
                })}
            </Group>
        </div>
    );
}

// Export types for reuse
export type { KanbanBoardProps };

