'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Paper,
} from '@mantine/core';
import {
    IconAlertCircle, IconCalendarEvent, IconTarget, IconClock,
    IconChecklist, IconAlertTriangle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

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
    participants?: Array<{ name: string; responseStatus: string }>;
}

interface ActionItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: number;
    dueTime?: string;
    assignedToName?: string;
    actionTypeName?: string;
    actionTypeColor?: string;
    createdByName?: string;
}

const PRIORITY_COLORS: Record<string, string> = { urgent: 'red', high: 'orange', medium: 'yellow', low: 'gray' };
const PRIORITY_LABELS: Record<string, string> = { urgent: 'Urgente', high: 'Alta', medium: 'Média', low: 'Baixa' };
const STATUS_COLORS: Record<string, string> = { pending: 'yellow', in_progress: 'blue', completed: 'green', cancelled: 'gray' };
const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };

export default function AgendaDirecaoPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [tasks, setTasks] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('week');

    const fmtTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

    const stats = useMemo(() => {
        const urgentTasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
        const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
        const overdue = tasks.filter(t => {
            if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
            return t.dueDate < Math.floor(Date.now() / 1000);
        });

        return {
            totalMeetings: meetings.length,
            totalTasks: tasks.length,
            urgentCount: urgentTasks.length,
            pendingCount: pendingTasks.length,
            overdueCount: overdue.length,
        };
    }, [meetings, tasks]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando agenda da direção...</Text></Group>
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
                        <Text size="sm" fw={500}>Direção</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Agenda da Direção</Title>
                        <Select
                            size="sm"
                            value={period}
                            onChange={(v) => setPeriod(v || 'week')}
                            data={[
                                { value: 'week', label: 'Esta Semana' },
                                { value: 'month', label: 'Este Mês' },
                                { value: 'quarter', label: 'Trimestre' },
                            ]}
                            w={180}
                        />
                    </Group>
                    <Text c="dimmed" mt="xs">Reuniões, compromissos e tarefas da equipe de direção.</Text>
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
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Tarefas Ativas</Text>
                                <Text size="xl" fw={700}>{stats.pendingCount}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconChecklist size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Urgentes</Text>
                                <Text size="xl" fw={700} c={stats.urgentCount > 0 ? 'red' : undefined}>{stats.urgentCount}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="red">
                                <IconTarget size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Atrasadas</Text>
                                <Text size="xl" fw={700} c={stats.overdueCount > 0 ? 'orange' : undefined}>{stats.overdueCount}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconAlertTriangle size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Meetings */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Próximas Reuniões</Text>
                        <Badge variant="light">{meetings.length}</Badge>
                    </Group>
                    {meetings.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhuma reunião agendada para este período.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Data</Table.Th>
                                    <Table.Th>Horário</Table.Th>
                                    <Table.Th>Reunião</Table.Th>
                                    <Table.Th ta="center">Participantes</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {meetings.slice(0, 15).map(m => (
                                    <Table.Tr key={m.id}>
                                        <Table.Td><Text size="sm">{fmtDate(m.scheduledStart)}</Text></Table.Td>
                                        <Table.Td><Text size="sm">{fmtTime(m.scheduledStart)}-{fmtTime(m.scheduledEnd)}</Text></Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{m.title}</Text>
                                            {m.organizerName && <Text size="xs" c="dimmed">por {m.organizerName}</Text>}
                                        </Table.Td>
                                        <Table.Td ta="center"><Badge size="sm" variant="light">{m.participants?.length || 0}</Badge></Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light" color={m.status === 'confirmed' ? 'green' : 'yellow'}>
                                                {m.status === 'confirmed' ? 'Confirmada' : 'Agendada'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>

                {/* Action Items */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Tarefas e Ação</Text>
                        <Badge variant="light">{tasks.length}</Badge>
                    </Group>
                    {tasks.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhuma tarefa encontrada.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Prioridade</Table.Th>
                                    <Table.Th>Tarefa</Table.Th>
                                    <Table.Th>Responsável</Table.Th>
                                    <Table.Th>Prazo</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {tasks.slice(0, 20).map(t => (
                                    <Table.Tr key={t.id}>
                                        <Table.Td>
                                            <Badge size="sm" variant="light" color={PRIORITY_COLORS[t.priority] || 'gray'}>
                                                {PRIORITY_LABELS[t.priority] || t.priority}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{t.title}</Text>
                                            {t.actionTypeName && <Text size="xs" c="dimmed">{t.actionTypeName}</Text>}
                                        </Table.Td>
                                        <Table.Td><Text size="sm">{t.assignedToName || '—'}</Text></Table.Td>
                                        <Table.Td>
                                            {t.dueDate ? (
                                                <Group gap={4}>
                                                    <IconClock size={14} />
                                                    <Text size="sm">{new Date(t.dueDate * 1000).toLocaleDateString('pt-BR')}</Text>
                                                </Group>
                                            ) : <Text size="sm" c="dimmed">Sem prazo</Text>}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light" color={STATUS_COLORS[t.status] || 'gray'}>
                                                {STATUS_LABELS[t.status] || t.status}
                                            </Badge>
                                        </Table.Td>
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
