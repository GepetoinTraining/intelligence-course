'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Table, Loader, Alert, Center, Button,
} from '@mantine/core';
import {
    IconUser, IconAlertCircle, IconCalendar, IconClock, IconUsers,
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
    location?: string;
    status: string;
}

interface PersonalEvent {
    id: string;
    title: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    type: 'class' | 'meeting';
    location?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const dayLabels: Record<number, string> = {
    0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta',
    4: 'Quinta', 5: 'Sexta', 6: 'Sábado',
};

const typeColors: Record<string, string> = { class: 'green', meeting: 'blue' };
const typeLabels: Record<string, string> = { class: 'Aula', meeting: 'Reunião' };

function fmtTime(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// PAGE
// ============================================================================

export default function PessoalPage() {
    const { data: schedules, isLoading: sl, error, refetch } = useApi<Schedule[]>('/api/schedules');
    const { data: meetings, isLoading: ml } = useApi<Meeting[]>('/api/meetings?scope=personal&limit=100');

    const isLoading = sl || ml;
    const allSchedules = schedules || [];
    const allMeetings = meetings || [];
    const today = new Date().getDay();

    // Merge into personal agenda
    const events = useMemo(() => {
        const merged: PersonalEvent[] = [];

        allSchedules.forEach(s => {
            merged.push({
                id: `sch-${s.id}`,
                title: `Aula ${s.classId?.slice(0, 6) || ''}`,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                type: 'class',
                location: s.roomId || undefined,
            });
        });

        allMeetings.forEach(m => {
            const d = new Date(m.scheduledStart * 1000);
            merged.push({
                id: `mtg-${m.id}`,
                title: m.title,
                dayOfWeek: d.getDay(),
                startTime: fmtTime(m.scheduledStart),
                endTime: fmtTime(m.scheduledEnd),
                type: 'meeting',
                location: m.location || undefined,
            });
        });

        merged.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
        return merged;
    }, [allSchedules, allMeetings]);

    const todayEvents = events.filter(e => e.dayOfWeek === today);
    const classCount = events.filter(e => e.type === 'class').length;
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
                <Text size="sm" c="dimmed">Agenda</Text>
                <Title order={2}>Minha Agenda</Title>
                <Text size="sm" c="dimmed" mt={4}>Aulas + reuniões pessoais em uma visão unificada</Text>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconCalendar size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Semana</Text>
                            <Text fw={700} size="lg">{events.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconUser size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Hoje</Text>
                            <Text fw={700} size="lg">{todayEvents.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg"><IconClock size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Aulas</Text>
                            <Text fw={700} size="lg">{classCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Reuniões</Text>
                            <Text fw={700} size="lg">{meetingCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">Meus Compromissos</Text>
                {events.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Dia</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Horário</Table.Th>
                                <Table.Th>Local</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {events.map((event) => (
                                <Table.Tr key={event.id}>
                                    <Table.Td>
                                        <Badge
                                            color={event.dayOfWeek === today ? 'blue' : 'gray'}
                                            variant="light"
                                            size="sm"
                                        >
                                            {dayLabels[event.dayOfWeek]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm" color={typeColors[event.type]}>
                                            {typeLabels[event.type]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td><Text size="sm" fw={500}>{event.title}</Text></Table.Td>
                                    <Table.Td>{event.startTime} - {event.endTime}</Table.Td>
                                    <Table.Td>{event.location || '-'}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUser size={48} color="gray" />
                            <Text c="dimmed">Nenhum compromisso encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}
