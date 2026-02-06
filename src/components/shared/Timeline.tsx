'use client';

import { Stack, Paper, Text, Timeline as MantineTimeline, ThemeIcon, Badge, Group } from '@mantine/core';
import {
    IconCheck, IconX, IconClock, IconMail, IconPhone, IconMessage,
    IconNote, IconCalendar, IconUser, IconCash, IconBook
} from '@tabler/icons-react';

interface TimelineEvent {
    id: string;
    type: 'note' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'payment' | 'enrollment' | 'lesson' | 'system';
    title: string;
    description?: string;
    timestamp: string;
    user?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
}

interface TimelineProps {
    events: TimelineEvent[];
    maxItems?: number;
}

const TYPE_CONFIG: Record<string, { icon: typeof IconCheck; color: string }> = {
    note: { icon: IconNote, color: 'gray' },
    call: { icon: IconPhone, color: 'blue' },
    email: { icon: IconMail, color: 'cyan' },
    whatsapp: { icon: IconMessage, color: 'green' },
    meeting: { icon: IconCalendar, color: 'violet' },
    payment: { icon: IconCash, color: 'green' },
    enrollment: { icon: IconUser, color: 'blue' },
    lesson: { icon: IconBook, color: 'violet' },
    system: { icon: IconClock, color: 'gray' },
};

const STATUS_COLORS: Record<string, string> = {
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
};

export function Timeline({ events, maxItems }: TimelineProps) {
    const displayEvents = maxItems ? events.slice(0, maxItems) : events;

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return (
        <MantineTimeline bulletSize={28} lineWidth={2}>
            {displayEvents.map((event) => {
                const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.system;
                const Icon = config.icon;
                const bulletColor = event.status ? STATUS_COLORS[event.status] : config.color;

                return (
                    <MantineTimeline.Item
                        key={event.id}
                        bullet={
                            <ThemeIcon size={28} variant="light" color={bulletColor} radius="xl">
                                <Icon size={14} />
                            </ThemeIcon>
                        }
                    >
                        <Group justify="space-between" wrap="nowrap">
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text size="sm" fw={500}>{event.title}</Text>
                                {event.description && (
                                    <Text size="xs" c="dimmed" lineClamp={2}>{event.description}</Text>
                                )}
                                {event.user && (
                                    <Text size="xs" c="dimmed" mt={2}>por {event.user}</Text>
                                )}
                            </div>
                            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                {formatTime(event.timestamp)}
                            </Text>
                        </Group>
                    </MantineTimeline.Item>
                );
            })}
        </MantineTimeline>
    );
}

export default Timeline;

