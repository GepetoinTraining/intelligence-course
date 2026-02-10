'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Paper,
} from '@mantine/core';
import {
    IconAlertCircle, IconUsers, IconCalendar, IconClock,
    IconUser, IconTarget,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Meeting {
    id: string;
    title: string;
    scheduledAt: number;
    duration: number;
    meetingType: string;
    status: string;
    location?: string;
    organizer?: { name: string };
    participants?: { name: string }[];
}

const TYPE_COLORS: Record<string, string> = {
    one_on_one: 'blue', team: 'violet', department: 'teal',
    all_hands: 'orange', parent_teacher: 'green', external: 'grape',
};

export default function LideresPage() {
    const { data: meetingsData, isLoading: loading } = useApi<Meeting[]>('/api/meetings?limit=100');
    const meetings = meetingsData || [];
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<string>('current');

    const stats = useMemo(() => {
        const total = meetings.length;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayTs = Math.floor(today.getTime() / 1000);
        const tomorrowTs = todayTs + 86400;
        const todayMeetings = meetings.filter(m => m.scheduledAt >= todayTs && m.scheduledAt < tomorrowTs).length;
        const uniqueOrganizers = new Set(meetings.map(m => m.organizer?.name).filter(Boolean)).size;
        const totalDuration = meetings.reduce((s, m) => s + (m.duration || 0), 0);
        return { total, todayMeetings, uniqueOrganizers, totalDuration };
    }, [meetings]);

    const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleString('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });

    if (loading) {
        return <Container size="xl" py="xl"><Group justify="center" py={60}><Loader size="lg" /><Text>Carregando agenda...</Text></Group></Container>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Agenda</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Líderes</Text></Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Agenda de Líderes</Title>
                        <Select size="sm" value={period} onChange={v => setPeriod(v || 'current')} w={180}
                            data={[{ value: 'last', label: 'Semana Passada' }, { value: 'current', label: 'Semana Atual' }, { value: 'next', label: 'Próxima Semana' }]} />
                    </Group>
                    <Text c="dimmed" mt="xs">Visualização consolidada das reuniões de líderes e gestores.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Reuniões</Text><Text size="xl" fw={700}>{stats.total}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue"><IconCalendar size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Hoje</Text><Text size="xl" fw={700} c={stats.todayMeetings > 0 ? 'teal' : undefined}>{stats.todayMeetings}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="teal"><IconTarget size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Líderes</Text><Text size="xl" fw={700}>{stats.uniqueOrganizers}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet"><IconUsers size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Horas Totais</Text><Text size="xl" fw={700}>{Math.round(stats.totalDuration / 60)}h</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange"><IconClock size={24} /></ThemeIcon></Group>
                    </Card>
                </SimpleGrid>

                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md"><Text fw={600}>Reuniões de Líderes</Text><Badge variant="light">{meetings.length} reuniões</Badge></Group>
                    {meetings.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md"><IconCalendar size={32} /></ThemeIcon>
                            <Title order={3} mb="xs">Sem reuniões</Title>
                            <Text c="dimmed">Nenhuma reunião de liderança registrada para este período.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr><Table.Th>Data/Hora</Table.Th><Table.Th>Reunião</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Organizador</Table.Th><Table.Th>Participantes</Table.Th><Table.Th ta="center">Status</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {meetings.map(m => (
                                    <Table.Tr key={m.id}>
                                        <Table.Td><Group gap={4}><IconClock size={14} color="gray" /><Text size="sm">{fmtDate(m.scheduledAt)}</Text></Group></Table.Td>
                                        <Table.Td><Text size="sm" fw={500}>{m.title}</Text>{m.location && <Text size="xs" c="dimmed">{m.location}</Text>}</Table.Td>
                                        <Table.Td><Badge size="sm" variant="light" color={TYPE_COLORS[m.meetingType] || 'gray'}>{m.meetingType?.replace('_', ' ')}</Badge></Table.Td>
                                        <Table.Td><Group gap={4}><IconUser size={14} color="gray" /><Text size="sm">{m.organizer?.name || '—'}</Text></Group></Table.Td>
                                        <Table.Td><Text size="sm" c="dimmed">{m.participants?.length || 0} pessoas</Text></Table.Td>
                                        <Table.Td ta="center"><Badge size="sm" variant="light" color={m.status === 'scheduled' ? 'blue' : m.status === 'completed' ? 'green' : 'gray'}>{m.status}</Badge></Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
