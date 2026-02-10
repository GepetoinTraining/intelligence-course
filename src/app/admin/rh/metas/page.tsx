'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Progress, Paper,
} from '@mantine/core';
import {
    IconAlertCircle, IconTarget, IconChecklist, IconTrophy,
    IconClock, IconChartBar,
} from '@tabler/icons-react';

interface ActionItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: number;
    startDate?: number;
    endDate?: number;
    completedAt?: number;
    assignedToName?: string;
    assignedToAvatar?: string;
    createdByName?: string;
    actionTypeName?: string;
    actionTypeColor?: string;
}

const STATUS_COLORS: Record<string, string> = { pending: 'yellow', in_progress: 'blue', completed: 'green', cancelled: 'gray' };
const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const PRIORITY_COLORS: Record<string, string> = { urgent: 'red', high: 'orange', medium: 'yellow', low: 'gray' };

export default function MetasPage() {
    const [items, setItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ view: 'all', limit: '100' });
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`/api/action-items?${params}`);
            if (!res.ok) throw new Error('Falha ao buscar metas');
            const data = await res.json();
            setItems(data.items || []);
        } catch (err) {
            setError('Falha ao carregar metas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = useMemo(() => {
        const completed = items.filter(i => i.status === 'completed');
        const inProgress = items.filter(i => i.status === 'in_progress');
        const pending = items.filter(i => i.status === 'pending');
        const overdue = items.filter(i => {
            if (!i.dueDate || i.status === 'completed' || i.status === 'cancelled') return false;
            return i.dueDate < Math.floor(Date.now() / 1000);
        });
        const completionRate = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;

        // By assignee
        const byPerson = new Map<string, { completed: number; total: number }>();
        items.forEach(i => {
            const name = i.assignedToName || 'Sem Responsável';
            const existing = byPerson.get(name) || { completed: 0, total: 0 };
            existing.total++;
            if (i.status === 'completed') existing.completed++;
            byPerson.set(name, existing);
        });
        const personStats = Array.from(byPerson.entries())
            .map(([name, s]) => ({ name, ...s, rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0 }))
            .sort((a, b) => b.rate - a.rate);

        return {
            total: items.length,
            completed: completed.length,
            inProgress: inProgress.length,
            pending: pending.length,
            overdue: overdue.length,
            completionRate,
            personStats,
        };
    }, [items]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando metas...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">RH & Pessoas</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Metas & OKRs</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Metas & OKRs</Title>
                        <Select
                            size="sm"
                            placeholder="Filtrar Status"
                            clearable
                            value={statusFilter}
                            onChange={setStatusFilter}
                            data={[
                                { value: 'pending', label: 'Pendentes' },
                                { value: 'in_progress', label: 'Em Andamento' },
                                { value: 'completed', label: 'Concluídas' },
                            ]}
                            w={180}
                        />
                    </Group>
                    <Text c="dimmed" mt="xs">Acompanhamento de metas, objetivos e resultados-chave da equipe.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Metas</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconTarget size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>% Conclusão</Text>
                                <Text size="xl" fw={700} c={stats.completionRate >= 80 ? 'green' : stats.completionRate >= 50 ? 'yellow' : 'red'}>
                                    {stats.completionRate}%
                                </Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconTrophy size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Em Andamento</Text>
                                <Text size="xl" fw={700}>{stats.inProgress}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconChecklist size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Atrasadas</Text>
                                <Text size="xl" fw={700} c={stats.overdue > 0 ? 'red' : undefined}>{stats.overdue}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="red">
                                <IconClock size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Overall Progress */}
                <Card withBorder padding="lg" radius="md">
                    <Text fw={600} mb="md">Progresso Geral</Text>
                    <Stack gap="md">
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Text size="sm">Concluídas</Text>
                                <Text size="sm" fw={600}>{stats.completed} de {stats.total}</Text>
                            </Group>
                            <Progress value={stats.completionRate} color="green" size="xl" radius="md" />
                        </div>
                        <SimpleGrid cols={3}>
                            <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="yellow">{stats.pending}</Text>
                                <Text size="sm" c="dimmed">Pendentes</Text>
                            </Paper>
                            <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="blue">{stats.inProgress}</Text>
                                <Text size="sm" c="dimmed">Em Andamento</Text>
                            </Paper>
                            <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="green">{stats.completed}</Text>
                                <Text size="sm" c="dimmed">Concluídas</Text>
                            </Paper>
                        </SimpleGrid>
                    </Stack>
                </Card>

                {/* Per-Person Performance */}
                {stats.personStats.length > 0 && (
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Desempenho por Colaborador</Text>
                            <IconChartBar size={20} color="gray" />
                        </Group>
                        <Stack gap="sm">
                            {stats.personStats.slice(0, 10).map(p => (
                                <div key={p.name}>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm">{p.name}</Text>
                                        <Group gap={4}>
                                            <Text size="sm" fw={600}>{p.completed}/{p.total}</Text>
                                            <Text size="xs" c={p.rate >= 80 ? 'green' : p.rate >= 50 ? 'yellow' : 'red'}>({p.rate}%)</Text>
                                        </Group>
                                    </Group>
                                    <Progress value={p.rate} color={p.rate >= 80 ? 'green' : p.rate >= 50 ? 'yellow' : 'red'} size="lg" radius="md" />
                                </div>
                            ))}
                        </Stack>
                    </Card>
                )}

                {/* Goals Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Lista de Metas</Text>
                        <Badge variant="light">{items.length} metas</Badge>
                    </Group>
                    {items.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconTarget size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhuma meta</Title>
                            <Text c="dimmed">Crie metas e OKRs para acompanhar o progresso da equipe.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Prioridade</Table.Th>
                                    <Table.Th>Meta</Table.Th>
                                    <Table.Th>Responsável</Table.Th>
                                    <Table.Th>Prazo</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {items.map(item => (
                                    <Table.Tr key={item.id}>
                                        <Table.Td>
                                            <Badge size="sm" variant="dot" color={PRIORITY_COLORS[item.priority] || 'gray'}>
                                                {item.priority}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{item.title}</Text>
                                            {item.actionTypeName && <Text size="xs" c="dimmed">{item.actionTypeName}</Text>}
                                        </Table.Td>
                                        <Table.Td><Text size="sm">{item.assignedToName || '—'}</Text></Table.Td>
                                        <Table.Td>
                                            {item.dueDate ? (
                                                <Text size="sm" c={item.dueDate < Math.floor(Date.now() / 1000) && item.status !== 'completed' ? 'red' : undefined}>
                                                    {new Date(item.dueDate * 1000).toLocaleDateString('pt-BR')}
                                                </Text>
                                            ) : <Text size="sm" c="dimmed">—</Text>}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light" color={STATUS_COLORS[item.status] || 'gray'}>
                                                {STATUS_LABELS[item.status] || item.status}
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
