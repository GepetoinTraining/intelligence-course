'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Table, Loader, Alert, Center,
} from '@mantine/core';
import {
    IconCalendar, IconPlus, IconAlertCircle, IconAlertTriangle,
    IconUsers, IconClock,
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
    validFrom: number | null;
    validUntil: number | null;
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

interface CalendarEntry {
    id: string;
    title: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    type: 'class' | 'meeting';
    roomId?: string | null;
    conflict?: boolean;
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

function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
    return a1 < b2 && b1 < a2;
}

function fmtTime(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// PAGE
// ============================================================================

export default function CalendarioPage() {
    const { data: schedules, isLoading: sl, error, refetch } = useApi<Schedule[]>('/api/schedules');
    const { data: meetings, isLoading: ml } = useApi<Meeting[]>('/api/meetings?limit=100');

    const isLoading = sl || ml;
    const allSchedules = schedules || [];
    const allMeetings = meetings || [];

    // Merge schedules + meetings into unified calendar entries
    const { entries, conflictCount } = useMemo(() => {
        const merged: CalendarEntry[] = [];

        allSchedules.forEach(s => {
            merged.push({
                id: `sch-${s.id}`,
                title: `Aula ${s.classId?.slice(0, 6) || ''}`,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                type: 'class',
                roomId: s.roomId,
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
                roomId: m.location || null,
            });
        });

        // Sort by day, then start time
        merged.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

        // Detect room conflicts
        let conflicts = 0;
        for (let i = 0; i < merged.length; i++) {
            for (let j = i + 1; j < merged.length; j++) {
                if (merged[i].dayOfWeek !== merged[j].dayOfWeek) break;
                if (merged[i].roomId && merged[i].roomId === merged[j].roomId) {
                    if (timesOverlap(merged[i].startTime, merged[i].endTime, merged[j].startTime, merged[j].endTime)) {
                        merged[i].conflict = true;
                        merged[j].conflict = true;
                        conflicts++;
                    }
                }
            }
        }

        return { entries: merged, conflictCount: conflicts };
    }, [allSchedules, allMeetings]);

    // Stats by day
    const byDay = entries.reduce((acc, e) => {
        acc[e.dayOfWeek] = (acc[e.dayOfWeek] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    const classCount = entries.filter(e => e.type === 'class').length;
    const meetingCount = entries.filter(e => e.type === 'meeting').length;

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
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Agenda</Text>
                    <Title order={2}>Calendário Unificado</Title>
                    <Text size="sm" c="dimmed" mt={4}>Aulas + reuniões em uma visão semanal</Text>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Horário</Button>
            </Group>

            {conflictCount > 0 && (
                <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" title="Conflitos">
                    {conflictCount} conflito(s) detectado(s) na mesma sala com horários sobrepostos.
                </Alert>
            )}

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconCalendar size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{entries.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconClock size={20} /></ThemeIcon>
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
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={conflictCount > 0 ? 'red' : 'green'} size="lg">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conflitos</Text>
                            <Text fw={700} size="lg" c={conflictCount > 0 ? 'red' : undefined}>{conflictCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {entries.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Dia</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Horário</Table.Th>
                                <Table.Th>Sala</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {entries.map((entry) => (
                                <Table.Tr key={entry.id} style={entry.conflict ? { backgroundColor: 'var(--mantine-color-red-0)' } : undefined}>
                                    <Table.Td>
                                        <Badge variant="light" size="sm" color={entry.dayOfWeek === new Date().getDay() ? 'blue' : 'gray'}>
                                            {dayLabels[entry.dayOfWeek]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm" color={typeColors[entry.type]}>
                                            {typeLabels[entry.type]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td><Text fw={500} size="sm">{entry.title}</Text></Table.Td>
                                    <Table.Td>{entry.startTime} - {entry.endTime}</Table.Td>
                                    <Table.Td>{entry.roomId || '-'}</Table.Td>
                                    <Table.Td>
                                        {entry.conflict ? (
                                            <Badge color="red" variant="filled" size="sm">⚠️ Conflito</Badge>
                                        ) : (
                                            <Badge color="green" variant="light" size="sm">OK</Badge>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCalendar size={48} color="gray" />
                            <Text c="dimmed">Nenhum horário encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}
