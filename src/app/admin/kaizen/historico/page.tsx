'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Table, Loader, Alert, Center, Button, Timeline,
} from '@mantine/core';
import {
    IconHistory, IconAlertCircle, IconCheck, IconX, IconClock,
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
    reviewedAt?: number;
}

const statusColors: Record<string, string> = {
    implemented: 'green', rejected: 'red', deferred: 'gray',
    submitted: 'blue', under_review: 'yellow', approved: 'teal',
    in_progress: 'violet', needs_info: 'orange',
};
const statusLabels: Record<string, string> = {
    implemented: 'Implementada', rejected: 'Rejeitada', deferred: 'Adiada',
    submitted: 'Enviada', under_review: 'Em Revisão', approved: 'Aprovada',
    in_progress: 'Em Progresso', needs_info: 'Info Necessária',
};

export default function HistoricoPage() {
    const { data, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const suggestions = data || [];

    const allSorted = useMemo(() =>
        [...suggestions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
        [suggestions]);

    const stats = {
        total: allSorted.length,
        implemented: allSorted.filter(s => s.status === 'implemented').length,
        rejected: allSorted.filter(s => s.status === 'rejected').length,
        deferred: allSorted.filter(s => s.status === 'deferred').length,
    };

    const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('pt-BR');

    // Group by month
    const byMonth = useMemo(() => {
        const map = new Map<string, Suggestion[]>();
        allSorted.forEach(s => {
            const d = new Date((s.createdAt || 0) * 1000);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const arr = map.get(key) || [];
            arr.push(s);
            map.set(key, arr);
        });
        return Array.from(map.entries());
    }, [allSorted]);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}<Button size="xs" ml="md" onClick={refetch}>Tentar novamente</Button></Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Kaizen</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Histórico</Text></Group>
                    <Title order={2}>Histórico de Sugestões</Title>
                </div>
                <DiagramToggle route="/api/kaizen/suggestions" data={allSorted} title="Linha do Tempo Kaizen" />
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="blue" size="lg"><IconHistory size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Total</Text><Text fw={700} size="xl">{stats.total}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="green" size="lg"><IconCheck size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Implementadas</Text><Text fw={700} size="xl">{stats.implemented}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="red" size="lg"><IconX size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Rejeitadas</Text><Text fw={700} size="xl">{stats.rejected}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="gray" size="lg"><IconClock size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Adiadas</Text><Text fw={700} size="xl">{stats.deferred}</Text></div></Group>
                </Card>
            </SimpleGrid>

            {byMonth.map(([monthKey, items]) => {
                const [y, m] = monthKey.split('-');
                const label = `${monthNames[parseInt(m) - 1]} ${y}`;
                return (
                    <Card key={monthKey} withBorder p="md">
                        <Group justify="space-between" mb="sm">
                            <Text fw={600}>{label}</Text>
                            <Badge size="sm" variant="light">{items.length} sugestões</Badge>
                        </Group>
                        <Table>
                            <Table.Thead><Table.Tr>
                                <Table.Th>Sugestão</Table.Th><Table.Th>Tipo</Table.Th>
                                <Table.Th>Status</Table.Th><Table.Th>Votos</Table.Th><Table.Th>Data</Table.Th>
                            </Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {items.slice(0, 10).map(s => (
                                    <Table.Tr key={s.id}>
                                        <Table.Td><Text size="sm" fw={500}>{s.title}</Text></Table.Td>
                                        <Table.Td><Badge size="xs" variant="light">{s.estimatedImpact}</Badge></Table.Td>
                                        <Table.Td><Badge size="xs" variant="light" color={statusColors[s.status]}>{statusLabels[s.status] || s.status}</Badge></Table.Td>
                                        <Table.Td><Text size="sm">{s.upvotes} 👍</Text></Table.Td>
                                        <Table.Td><Text size="xs" c="dimmed">{fmt(s.createdAt)}</Text></Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                );
            })}

            {allSorted.length === 0 && (
                <Center py="xl"><Stack align="center" gap="xs">
                    <IconHistory size={48} color="gray" /><Text c="dimmed">Nenhum histórico encontrado</Text>
                </Stack></Center>
            )}
        </Stack>
    );
}
