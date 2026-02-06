'use client';

import { useState } from 'react';
import {
    Paper, Group, Text, Badge, Stack, ThemeIcon,
    Button, Popover, ActionIcon
} from '@mantine/core';
import {
    IconChevronLeft, IconChevronRight, IconCircleFilled,
    IconCoin, IconAlertCircle, IconCheck
} from '@tabler/icons-react';

interface CalendarEvent {
    date: string; // YYYY-MM-DD
    type: 'payment_due' | 'payment_paid' | 'payment_overdue' | 'class' | 'holiday';
    title: string;
    amount?: number;
    status?: string;
}

interface PaymentCalendarProps {
    events: CalendarEvent[];
    onDateClick?: (date: string, events: CalendarEvent[]) => void;
}

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function PaymentCalendar({ events, onDateClick }: PaymentCalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const getEventsForDate = (day: number): CalendarEvent[] => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const getEventIndicator = (event: CalendarEvent) => {
        switch (event.type) {
            case 'payment_due':
                return <IconCoin size={10} color="var(--mantine-color-yellow-6)" />;
            case 'payment_paid':
                return <IconCheck size={10} color="var(--mantine-color-green-6)" />;
            case 'payment_overdue':
                return <IconAlertCircle size={10} color="var(--mantine-color-red-6)" />;
            default:
                return <IconCircleFilled size={6} color="var(--mantine-color-blue-6)" />;
        }
    };

    const isToday = (day: number) => {
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    };

    // Generate calendar grid
    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(
            <div key={`empty-${i}`} style={{ aspectRatio: '1', padding: 4 }} />
        );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = getEventsForDate(day);
        const hasEvents = dayEvents.length > 0;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        calendarDays.push(
            <Popover
                key={day}
                width={250}
                position="bottom"
                withArrow
                shadow="md"
                disabled={!hasEvents}
            >
                <Popover.Target>
                    <Paper
                        p={4}
                        radius="sm"
                        style={{
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: hasEvents ? 'pointer' : 'default',
                            background: isToday(day)
                                ? 'var(--mantine-color-violet-light)'
                                : hasEvents
                                    ? 'var(--mantine-color-gray-0)'
                                    : 'transparent',
                            border: isToday(day) ? '2px solid var(--mantine-color-violet-6)' : 'none',
                        }}
                        onClick={() => hasEvents && onDateClick && onDateClick(dateStr, dayEvents)}
                    >
                        <Text
                            size="sm"
                            fw={isToday(day) ? 700 : 400}
                            c={isToday(day) ? 'violet' : undefined}
                        >
                            {day}
                        </Text>
                        {hasEvents && (
                            <Group gap={2} mt={2}>
                                {dayEvents.slice(0, 3).map((event, i) => (
                                    <span key={i}>{getEventIndicator(event)}</span>
                                ))}
                            </Group>
                        )}
                    </Paper>
                </Popover.Target>
                <Popover.Dropdown>
                    <Stack gap="xs">
                        <Text size="sm" fw={600}>{day} de {MONTHS_PT[currentMonth]}</Text>
                        {dayEvents.map((event, i) => (
                            <Group key={i} gap="xs">
                                {getEventIndicator(event)}
                                <div>
                                    <Text size="xs">{event.title}</Text>
                                    {event.amount && (
                                        <Text size="xs" c="dimmed">
                                            R$ {event.amount.toFixed(2).replace('.', ',')}
                                        </Text>
                                    )}
                                </div>
                            </Group>
                        ))}
                    </Stack>
                </Popover.Dropdown>
            </Popover>
        );
    }

    return (
        <Paper shadow="xs" radius="md" p="md" withBorder>
            {/* Header */}
            <Group justify="space-between" mb="md">
                <ActionIcon variant="subtle" onClick={prevMonth}>
                    <IconChevronLeft size={18} />
                </ActionIcon>
                <Text fw={600}>
                    {MONTHS_PT[currentMonth]} {currentYear}
                </Text>
                <ActionIcon variant="subtle" onClick={nextMonth}>
                    <IconChevronRight size={18} />
                </ActionIcon>
            </Group>

            {/* Day headers */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                marginBottom: 8
            }}>
                {DAYS_PT.map(day => (
                    <Text key={day} size="xs" c="dimmed" ta="center" fw={500}>
                        {day}
                    </Text>
                ))}
            </div>

            {/* Calendar grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4
            }}>
                {calendarDays}
            </div>

            {/* Legend */}
            <Group gap="lg" mt="md" justify="center">
                <Group gap={4}>
                    <IconCoin size={12} color="var(--mantine-color-yellow-6)" />
                    <Text size="xs" c="dimmed">Vencimento</Text>
                </Group>
                <Group gap={4}>
                    <IconCheck size={12} color="var(--mantine-color-green-6)" />
                    <Text size="xs" c="dimmed">Pago</Text>
                </Group>
                <Group gap={4}>
                    <IconAlertCircle size={12} color="var(--mantine-color-red-6)" />
                    <Text size="xs" c="dimmed">Atrasado</Text>
                </Group>
            </Group>
        </Paper>
    );
}

