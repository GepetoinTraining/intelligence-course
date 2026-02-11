'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Table, Progress, Loader, Alert, Center, Button,
} from '@mantine/core';
import {
    IconTrendingUp, IconAlertCircle, IconCheck, IconClock,
    IconTarget,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

interface Suggestion {
    id: string;
    title: string;
    description: string;
    status: string;
    estimatedImpact: string;
    upvotes: number;
    createdAt: number;
    implementedAt?: number;
}

const statusColors: Record<string, string> = { approved: 'teal', in_progress: 'violet', implemented: 'green' };
const statusLabels: Record<string, string> = { approved: 'Aprovada', in_progress: 'Em Andamento', implemented: 'Concluída' };
const impactColors: Record<string, string> = { low: 'gray', medium: 'yellow', high: 'orange', critical: 'red' };

export default function MelhoriasPage() {
    const { data, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const suggestions = data || [];

    const improvements = useMemo(() =>
        suggestions.filter(s => ['approved', 'in_progress', 'implemented'].includes(s.status))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
        [suggestions]);

    const stats = {
        total: improvements.length,
        approved: improvements.filter(s => s.status === 'approved').length,
        inProgress: improvements.filter(s => s.status === 'in_progress').length,
        completed: improvements.filter(s => s.status === 'implemented').length,
    };

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('pt-BR');

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red">{error}<Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button></Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Kaizen</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Melhorias</Text></Group>
                    <Title order={2}>Melhorias em Andamento</Title>
                </div>
                <DiagramToggle route="/api/kaizen/suggestions" data={improvements} title="Fluxo de Melhorias" />
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="blue" size="lg"><IconTrendingUp size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Total</Text><Text fw={700} size="xl">{stats.total}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="teal" size="lg"><IconCheck size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Aprovadas</Text><Text fw={700} size="xl">{stats.approved}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="violet" size="lg"><IconClock size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Em Andamento</Text><Text fw={700} size="xl">{stats.inProgress}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="green" size="lg"><IconTarget size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Concluídas</Text><Text fw={700} size="xl">{stats.completed}</Text></div></Group>
                    <Progress value={completionRate} color="green" size="xs" mt="xs" />
                    <Text size="xs" c="dimmed" mt={2}>{completionRate}% taxa de conclusão</Text>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">Melhorias ({improvements.length})</Text>
                {improvements.length > 0 ? (
                    <Table>
                        <Table.Thead><Table.Tr>
                            <Table.Th>Melhoria</Table.Th><Table.Th>Impacto</Table.Th><Table.Th>Votos</Table.Th>
                            <Table.Th>Status</Table.Th><Table.Th>Data</Table.Th>
                        </Table.Tr></Table.Thead>
                        <Table.Tbody>
                            {improvements.map(s => (
                                <Table.Tr key={s.id}>
                                    <Table.Td><Text fw={500} size="sm">{s.title}</Text>
                                        <Text size="xs" c="dimmed" lineClamp={1}>{s.description}</Text></Table.Td>
                                    <Table.Td><Badge size="sm" variant="light" color={impactColors[s.estimatedImpact] || 'gray'}>{s.estimatedImpact}</Badge></Table.Td>
                                    <Table.Td><Text size="sm">{s.upvotes} 👍</Text></Table.Td>
                                    <Table.Td><Badge size="sm" variant="light" color={statusColors[s.status] || 'gray'}>{statusLabels[s.status] || s.status}</Badge></Table.Td>
                                    <Table.Td><Text size="sm" c="dimmed">{fmt(s.createdAt)}</Text></Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl"><Stack align="center" gap="xs">
                        <IconTrendingUp size={48} color="gray" /><Text c="dimmed">Nenhuma melhoria em andamento</Text>
                    </Stack></Center>
                )}
            </Card>
        </Stack>
    );
}
