'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Paper,
} from '@mantine/core';
import {
    IconCalendar, IconAlertCircle, IconClock, IconUsers,
    IconVideo, IconMapPin, IconCalendarEvent,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Meeting {
    id: string;
    title: string;
    description?: string;
    meetingType: string;
    scheduledStart: number;
    scheduledEnd: number;
    locationType?: string;
    location?: string;
    status: string;
    organizerName?: string;
    participants?: Array<{ name: string; responseStatus: string }>;
}

interface ScheduleEntry {
    id: string;
    classId: string;
    roomId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MEETING_COLORS: Record<string, string> = {
    one_on_one: 'blue',
    internal: 'teal',
    external: 'violet',
    parent_meeting: 'orange',
    pedagogical: 'green',
    administrative: 'grape',
};
const MEETING_LABELS: Record<string, string> = {
    one_on_one: '1:1',
    internal: 'Interno',
    external: 'Externo',
    parent_meeting: 'Pais',
    pedagogical: 'Pedagógico',
    administrative: 'Administrativo',
};

export default function AgendaTotalPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weekOffset, setWeekOffset] = useState('current');

    const fmtTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    const fmtDuration = (start: number, end: number) => {
        const mins = Math.round((end - start) / 60);
        if (mins < 60) return `${mins}min`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h${m}min` : `${h}h`;
    };

    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTs = Math.floor(today.getTime() / 1000);
        const tomorrowTs = todayTs + 86400;

        const todayMeetings = meetings.filter(m => m.scheduledStart >= todayTs && m.scheduledStart < tomorrowTs);
        const byType = new Map<string, number>();
        meetings.forEach(m => {
            byType.set(m.meetingType, (byType.get(m.meetingType) || 0) + 1);
        });
        const totalParticipants = meetings.reduce((sum, m) => sum + (m.participants?.length || 0), 0);

        return {
            totalMeetings: meetings.length,
            todayCount: todayMeetings.length,
            totalSchedules: schedules.length,
            totalParticipants,
            byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
        };
    }, [meetings, schedules]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando agenda...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Agenda</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Agenda Total</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Agenda Total</Title>
                        <Select
                            size="sm"
                            value={weekOffset}
                            onChange={(v) => setWeekOffset(v || 'current')}
                            data={[
                                { value: 'last', label: 'Semana Passada' },
                                { value: 'current', label: 'Esta Semana' },
                                { value: 'next', label: 'Próxima Semana' },
                            ]}
                            w={200}
                        />
                    </Group>
                    <Text c="dimmed" mt="xs">Visão consolidada de reuniões, horários e compromissos da instituição.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Reuniões</Text>
                                <Text size="xl" fw={700}>{stats.totalMeetings}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconCalendarEvent size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Hoje</Text>
                                <Text size="xl" fw={700}>{stats.todayCount}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconClock size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Horários</Text>
                                <Text size="xl" fw={700}>{stats.totalSchedules}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconCalendar size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Participantes</Text>
                                <Text size="xl" fw={700}>{stats.totalParticipants}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconUsers size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Meeting Types */}
                {stats.byType.length > 0 && (
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Reuniões por Tipo</Text>
                        <Group gap="md">
                            {stats.byType.map(t => (
                                <Badge key={t.type} size="lg" variant="light" color={MEETING_COLORS[t.type] || 'gray'}>
                                    {MEETING_LABELS[t.type] || t.type}: {t.count}
                                </Badge>
                            ))}
                        </Group>
                    </Card>
                )}

                {/* Meetings List */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Reuniões Agendadas</Text>
                        <Badge variant="light">{meetings.length} reuniões</Badge>
                    </Group>
                    {meetings.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconCalendar size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhuma reunião</Title>
                            <Text c="dimmed">Não há reuniões agendadas neste período.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Data</Table.Th>
                                    <Table.Th>Horário</Table.Th>
                                    <Table.Th>Reunião</Table.Th>
                                    <Table.Th>Tipo</Table.Th>
                                    <Table.Th>Local</Table.Th>
                                    <Table.Th ta="center">Participantes</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {meetings.map(m => (
                                    <Table.Tr key={m.id}>
                                        <Table.Td>
                                            <Text size="sm">{fmtDate(m.scheduledStart)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{fmtTime(m.scheduledStart)} - {fmtTime(m.scheduledEnd)}</Text>
                                            <Text size="xs" c="dimmed">{fmtDuration(m.scheduledStart, m.scheduledEnd)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{m.title}</Text>
                                            {m.organizerName && <Text size="xs" c="dimmed">por {m.organizerName}</Text>}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="light" color={MEETING_COLORS[m.meetingType] || 'gray'}>
                                                {MEETING_LABELS[m.meetingType] || m.meetingType}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {m.locationType === 'video' ? <IconVideo size={14} /> : <IconMapPin size={14} />}
                                                <Text size="sm">{m.location || (m.locationType === 'video' ? 'Online' : 'Presencial')}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light">{m.participants?.length || 0}</Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light"
                                                color={m.status === 'confirmed' ? 'green' : m.status === 'cancelled' ? 'red' : 'yellow'}
                                            >
                                                {m.status === 'confirmed' ? 'Confirmada' : m.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>

                {/* Recurring Schedules */}
                {schedules.length > 0 && (
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Horários Recorrentes</Text>
                            <Badge variant="light" color="violet">{schedules.length} horários</Badge>
                        </Group>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Dia</Table.Th>
                                    <Table.Th>Horário</Table.Th>
                                    <Table.Th>Turma (ID)</Table.Th>
                                    <Table.Th>Sala (ID)</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {schedules.slice(0, 20).map(s => (
                                    <Table.Tr key={s.id}>
                                        <Table.Td>
                                            <Badge size="sm" variant="light">{DAY_NAMES[s.dayOfWeek] || s.dayOfWeek}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{s.startTime} - {s.endTime}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{s.classId?.slice(0, 8)}...</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{s.roomId?.slice(0, 8) || '—'}...</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                )}
            </Stack>
        </Container>
    );
}
