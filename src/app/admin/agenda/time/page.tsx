'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Loader, Alert, Center, Menu, ActionIcon,
} from '@mantine/core';
import {
    IconCalendar, IconAlertCircle, IconUsers, IconClock,
    IconDotsVertical, IconEye, IconEdit, IconAlertTriangle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Schedule {
    id: string;
    classId: string;
    roomId: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface Meeting {
    id: string;
    title: string;
    meetingType: string;
    scheduledStart: number;
    scheduledEnd: number;
    locationType?: string;
    location?: string;
    status: string;
    organizerName?: string;
}

interface UnifiedEvent {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'class' | 'meeting' | 'event';
    location?: string;
    source: 'schedule' | 'meeting';
    conflict?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const typeColors: Record<string, string> = {
    class: 'green',
    meeting: 'blue',
    event: 'grape',
};

const typeLabels: Record<string, string> = {
    class: 'Aula',
    meeting: 'Reunião',
    event: 'Evento',
};

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function fmtTime(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
    return a1 < b2 && b1 < a2;
}

// ============================================================================
// PAGE
// ============================================================================

export default function AgendaTimePage() {
    const { data: schedules, isLoading: loadingSchedules } = useApi<Schedule[]>('/api/schedules');
    const { data: meetings, isLoading: loadingMeetings, error, refetch } = useApi<Meeting[]>('/api/meetings?limit=100');

    const isLoading = loadingSchedules || loadingMeetings;
    const allSchedules = schedules || [];
    const allMeetings = meetings || [];

    // Merge both data sources into a unified event list
    const { events, conflictCount } = useMemo(() => {
        const merged: UnifiedEvent[] = [];
        const today = new Date();
        const todayDow = today.getDay();

        // Convert schedules (recurring weekly) into events for today
        allSchedules.forEach(s => {
            if (s.dayOfWeek === todayDow) {
                merged.push({
                    id: `sch-${s.id}`,
                    title: `Aula ${s.classId?.slice(0, 6) || ''}`,
                    date: today.toISOString().split('T')[0],
                    startTime: s.startTime,
                    endTime: s.endTime,
                    type: 'class',
                    location: s.roomId || undefined,
                    source: 'schedule',
                });
            }
        });

        // Convert meetings into events
        allMeetings.forEach(m => {
            const start = new Date(m.scheduledStart * 1000);
            merged.push({
                id: `mtg-${m.id}`,
                title: m.title,
                date: start.toISOString().split('T')[0],
                startTime: fmtTime(m.scheduledStart),
                endTime: fmtTime(m.scheduledEnd),
                type: 'meeting',
                location: m.location || undefined,
                source: 'meeting',
            });
        });

        // Sort by date then time
        merged.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

        // Detect conflicts (same date + overlapping time + same location)
        let conflicts = 0;
        for (let i = 0; i < merged.length; i++) {
            for (let j = i + 1; j < merged.length; j++) {
                if (merged[i].date !== merged[j].date) break; // sorted, no more same day
                if (merged[i].location && merged[i].location === merged[j].location) {
                    if (timesOverlap(merged[i].startTime, merged[i].endTime, merged[j].startTime, merged[j].endTime)) {
                        merged[i].conflict = true;
                        merged[j].conflict = true;
                        conflicts++;
                    }
                }
            }
        }

        return { events: merged, conflictCount: conflicts };
    }, [allSchedules, allMeetings]);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(e => e.date === todayStr);
    const upcomingEvents = events.filter(e => e.date > todayStr).slice(0, 10);
    const meetingCount = events.filter(e => e.type === 'meeting').length;

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            <div>
                <Text c="dimmed" size="sm">Agenda</Text>
                <Title order={2}>Agenda do Time</Title>
                <Text c="dimmed" size="sm" mt={4}>
                    Visão unificada: aulas + reuniões em um calendário único
                </Text>
            </div>

            {/* Conflict Alert */}
            {conflictCount > 0 && (
                <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" title="Conflitos Detectados">
                    {conflictCount} conflito(s) de horário no mesmo espaço. Revise a programação.
                </Alert>
            )}

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md"><IconCalendar size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Hoje</Text>
                            <Text fw={700} size="xl">{todayEvents.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md"><IconClock size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Próximos</Text>
                            <Text fw={700} size="xl">{upcomingEvents.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Reuniões</Text>
                            <Text fw={700} size="xl">{meetingCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon color={conflictCount > 0 ? 'red' : 'teal'} size="lg" radius="md">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conflitos</Text>
                            <Text fw={700} size="xl" c={conflictCount > 0 ? 'red' : undefined}>{conflictCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Today's Events */}
            <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Eventos de Hoje ({todayEvents.length})</Text>
                    <Badge variant="light">{DAY_NAMES[new Date().getDay()]}</Badge>
                </Group>

                {todayEvents.length > 0 ? (
                    <Stack gap="sm">
                        {todayEvents.map((event) => (
                            <Card key={event.id} withBorder p="md" style={event.conflict ? { borderColor: 'var(--mantine-color-red-5)' } : undefined}>
                                <Group justify="space-between">
                                    <Group>
                                        <div style={{
                                            width: 4, height: 40, borderRadius: 4,
                                            backgroundColor: `var(--mantine-color-${typeColors[event.type]}-6)`
                                        }} />
                                        <div>
                                            <Group gap="xs">
                                                <Text fw={500}>{event.title}</Text>
                                                {event.conflict && (
                                                    <Badge size="xs" color="red" variant="filled">⚠️ Conflito</Badge>
                                                )}
                                            </Group>
                                            <Group gap="xs">
                                                <Badge size="xs" variant="light" color={typeColors[event.type]}>
                                                    {typeLabels[event.type]}
                                                </Badge>
                                                <Text size="xs" c="dimmed">
                                                    {event.startTime} - {event.endTime}
                                                </Text>
                                                {event.location && (
                                                    <Text size="xs" c="dimmed">• {event.location}</Text>
                                                )}
                                            </Group>
                                        </div>
                                    </Group>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ver</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            </Card>
                        ))}
                    </Stack>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCalendar size={48} color="gray" />
                            <Text c="dimmed">Nenhum evento hoje</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Upcoming */}
            {upcomingEvents.length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="md">Próximos Eventos</Text>
                    <Stack gap="sm">
                        {upcomingEvents.map((event) => (
                            <Group key={event.id} justify="space-between" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                <Group>
                                    <Badge size="sm" variant="light" color={typeColors[event.type]}>
                                        {typeLabels[event.type]}
                                    </Badge>
                                    <div>
                                        <Text size="sm" fw={500}>{event.title}</Text>
                                        <Text size="xs" c="dimmed">{event.date} • {event.startTime}-{event.endTime}</Text>
                                    </div>
                                </Group>
                                {event.location && <Text size="xs" c="dimmed">{event.location}</Text>}
                            </Group>
                        ))}
                    </Stack>
                </Card>
            )}
        </Stack>
    );
}
