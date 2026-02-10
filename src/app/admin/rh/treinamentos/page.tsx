'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, TextInput,
    Paper, Progress,
} from '@mantine/core';
import {
    IconAlertCircle, IconSchool, IconUsers, IconCertificate,
    IconSearch, IconClock, IconChartBar,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface ActionItem {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: number;
    assignedToName?: string;
    completedAt?: number;
    actionTypeName?: string;
    actionTypeColor?: string;
    linkedEntityType?: string;
}

const STATUS_COLORS: Record<string, string> = { pending: 'yellow', in_progress: 'blue', completed: 'green', cancelled: 'gray' };
const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', in_progress: 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };

export default function TreinamentosPage() {
    const { data: apiData, isLoading: loading, error } = useApi<{ items: ActionItem[] }>('/api/action-items?view=all&limit=100');
    const items = apiData?.items || (Array.isArray(apiData) ? apiData : []);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const searchLower = search.toLowerCase();
    const filtered = useMemo(() => {
        if (!searchLower) return items;
        return items.filter(i =>
            i.title.toLowerCase().includes(searchLower) ||
            (i.assignedToName && i.assignedToName.toLowerCase().includes(searchLower)) ||
            (i.description && i.description.toLowerCase().includes(searchLower))
        );
    }, [items, searchLower]);

    const stats = useMemo(() => {
        const completed = items.filter(i => i.status === 'completed').length;
        const inProgress = items.filter(i => i.status === 'in_progress').length;
        const pending = items.filter(i => i.status === 'pending').length;
        const completionRate = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
        const uniqueAssignees = new Set(items.filter(i => i.assignedToName).map(i => i.assignedToName)).size;

        return { total: items.length, completed, inProgress, pending, completionRate, uniqueAssignees };
    }, [items]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando treinamentos...</Text></Group>
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
                        <Text size="sm" fw={500}>Treinamentos</Text>
                    </Group>
                    <Title order={1}>Gestão de Treinamentos</Title>
                    <Text c="dimmed" mt="xs">Capacitação, cursos obrigatórios e certificações da equipe.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Atividades</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconSchool size={24} />
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
                                <IconCertificate size={24} />
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
                                <IconChartBar size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Participantes</Text>
                                <Text size="xl" fw={700}>{stats.uniqueAssignees}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconUsers size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Progress Overview */}
                <Card withBorder padding="lg" radius="md">
                    <Text fw={600} mb="md">Progresso Geral de Treinamentos</Text>
                    <Stack gap="md">
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Text size="sm">Concluídos</Text>
                                <Text size="sm" fw={600}>{stats.completed} de {stats.total}</Text>
                            </Group>
                            <Progress value={stats.completionRate} color="green" size="xl" radius="md" />
                        </div>
                        <SimpleGrid cols={3}>
                            <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="yellow">{stats.pending}</Text>
                                <Text size="xs" c="dimmed">Pendentes</Text>
                            </Paper>
                            <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="blue">{stats.inProgress}</Text>
                                <Text size="xs" c="dimmed">Em Andamento</Text>
                            </Paper>
                            <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                                <Text size="xl" fw={700} c="green">{stats.completed}</Text>
                                <Text size="xs" c="dimmed">Concluídos</Text>
                            </Paper>
                        </SimpleGrid>
                    </Stack>
                </Card>

                {/* Search + Filter */}
                <Group>
                    <TextInput
                        leftSection={<IconSearch size={16} />}
                        placeholder="Buscar treinamento..."
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Filtrar Status"
                        clearable
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={[
                            { value: 'pending', label: 'Pendentes' },
                            { value: 'in_progress', label: 'Em Andamento' },
                            { value: 'completed', label: 'Concluídos' },
                        ]}
                        w={180}
                    />
                </Group>

                {/* Training Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Atividades de Treinamento</Text>
                        <Badge variant="light">{filtered.length} atividades</Badge>
                    </Group>
                    {filtered.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconSchool size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhum treinamento</Title>
                            <Text c="dimmed">Crie atividades de capacitação para a equipe usando o módulo de ações.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Treinamento</Table.Th>
                                    <Table.Th>Participante</Table.Th>
                                    <Table.Th>Prazo</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.slice(0, 30).map(item => (
                                    <Table.Tr key={item.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{item.title}</Text>
                                            {item.description && <Text size="xs" c="dimmed" lineClamp={1}>{item.description}</Text>}
                                            {item.actionTypeName && <Badge size="xs" variant="outline" mt={4}>{item.actionTypeName}</Badge>}
                                        </Table.Td>
                                        <Table.Td><Text size="sm">{item.assignedToName || '—'}</Text></Table.Td>
                                        <Table.Td>
                                            {item.dueDate ? (
                                                <Group gap={4}>
                                                    <IconClock size={14} color="gray" />
                                                    <Text size="sm" c={item.dueDate < Math.floor(Date.now() / 1000) && item.status !== 'completed' ? 'red' : undefined}>
                                                        {new Date(item.dueDate * 1000).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                </Group>
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

                {/* NR Compliance Alert */}
                <Alert
                    icon={<IconSchool size={16} />}
                    color="teal"
                    variant="light"
                    title="Treinamentos Obrigatórios — Normas Regulamentadoras"
                >
                    <Text size="xs">
                        <strong>NR-1 (GRO):</strong> Gerenciamento de riscos ocupacionais — treinamento inicial obrigatório.
                        <strong> NR-5 (CIPA):</strong> Comissão Interna — treinamento anual de 20h para cipeiros.
                        <strong> NR-7 (PCMSO):</strong> Primeiro socorros — equipe treinada obrigatória.
                        <strong> NR-35:</strong> Trabalho em altura — reciclagem a cada 2 anos.
                        <strong> Integração:</strong> Todo novo colaborador deve receber treinamento de integração com orientações de segurança (CLT Art. 157).
                    </Text>
                </Alert>
            </Stack>
        </Container>
    );
}
