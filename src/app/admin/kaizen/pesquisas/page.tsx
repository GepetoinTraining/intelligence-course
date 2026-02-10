'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Progress,
    Paper,
} from '@mantine/core';
import {
    IconAlertCircle, IconStars, IconChartBar, IconThumbUp,
    IconThumbDown, IconBulb, IconTrendingUp, IconMoodHappy,
} from '@tabler/icons-react';

interface Suggestion {
    id: string;
    title: string;
    description: string;
    problemType: string;
    impactArea?: string;
    estimatedImpact?: string;
    status: string;
    upvotes: number;
    downvotes: number;
    netVotes: number;
    submitterName: string;
    isOwner: boolean;
    tags: string[];
    createdAt: number;
    reviewedAt?: number;
    implementedAt?: number;
}

const STATUS_COLORS: Record<string, string> = {
    submitted: 'blue', under_review: 'yellow', needs_info: 'orange',
    approved: 'teal', in_progress: 'violet', implemented: 'green',
    rejected: 'red', deferred: 'gray',
};
const STATUS_LABELS: Record<string, string> = {
    submitted: 'Submetida', under_review: 'Em Análise', needs_info: 'Precisa Info',
    approved: 'Aprovada', in_progress: 'Em Progresso', implemented: 'Implementada',
    rejected: 'Rejeitada', deferred: 'Adiada',
};
const IMPACT_LABELS: Record<string, string> = { low: 'Baixo', medium: 'Médio', high: 'Alto', critical: 'Crítico' };
const PROBLEM_LABELS: Record<string, string> = {
    inefficiency: 'Ineficiência', error_prone: 'Erros Frequentes', unclear: 'Confuso',
    bottleneck: 'Gargalo', waste: 'Desperdício', safety: 'Segurança',
    quality: 'Qualidade', cost: 'Custo', communication: 'Comunicação', other: 'Outro',
};

export default function PesquisasPage() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`/api/kaizen/suggestions?${params}`);
            if (!res.ok) throw new Error('Falha ao buscar pesquisas');
            const data = await res.json();
            setSuggestions(data.data || []);
            setTotal(data.meta?.total || 0);
        } catch (err) {
            setError('Falha ao carregar pesquisas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = useMemo(() => {
        const implemented = suggestions.filter(s => s.status === 'implemented').length;
        const approved = suggestions.filter(s => s.status === 'approved' || s.status === 'in_progress').length;
        const totalVotes = suggestions.reduce((sum, s) => sum + s.upvotes + s.downvotes, 0);
        const avgSentiment = suggestions.length > 0
            ? Math.round(suggestions.reduce((sum, s) => sum + s.netVotes, 0) / suggestions.length * 10) / 10
            : 0;
        const implementationRate = total > 0 ? Math.round((implemented / total) * 100) : 0;

        // By problem type
        const byType = new Map<string, number>();
        suggestions.forEach(s => {
            byType.set(s.problemType, (byType.get(s.problemType) || 0) + 1);
        });
        const typeBreakdown = Array.from(byType.entries())
            .map(([type, count]) => ({ type, label: PROBLEM_LABELS[type] || type, count }))
            .sort((a, b) => b.count - a.count);

        // By status
        const byStatus = new Map<string, number>();
        suggestions.forEach(s => {
            byStatus.set(s.status, (byStatus.get(s.status) || 0) + 1);
        });
        const statusBreakdown = Array.from(byStatus.entries())
            .map(([status, count]) => ({ status, label: STATUS_LABELS[status] || status, count }))
            .sort((a, b) => b.count - a.count);

        return { total, implemented, approved, totalVotes, avgSentiment, implementationRate, typeBreakdown, statusBreakdown };
    }, [suggestions, total]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando pesquisas...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Kaizen</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Pesquisas & NPS</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Pesquisas & Feedback</Title>
                        <Select
                            size="sm"
                            placeholder="Filtrar Status"
                            clearable
                            value={statusFilter}
                            onChange={setStatusFilter}
                            data={Object.entries(STATUS_LABELS).map(([val, label]) => ({ value: val, label }))}
                            w={180}
                        />
                    </Group>
                    <Text c="dimmed" mt="xs">Sugestões de melhoria contínua, feedback e análise de sentimento.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Sugestões</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconBulb size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Implementadas</Text>
                                <Text size="xl" fw={700} c="green">{stats.implemented}</Text>
                                <Text size="xs" c="dimmed">{stats.implementationRate}% taxa</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconTrendingUp size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Votos</Text>
                                <Text size="xl" fw={700}>{stats.totalVotes}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconStars size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Sentimento Médio</Text>
                                <Text size="xl" fw={700} c={stats.avgSentiment > 0 ? 'green' : stats.avgSentiment < 0 ? 'red' : 'gray'}>
                                    {stats.avgSentiment > 0 ? '+' : ''}{stats.avgSentiment}
                                </Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color={stats.avgSentiment >= 0 ? 'green' : 'red'}>
                                <IconMoodHappy size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {/* Status Breakdown */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Por Status</Text>
                        <Stack gap="sm">
                            {stats.statusBreakdown.map(s => (
                                <Group key={s.status} justify="space-between">
                                    <Badge variant="light" color={STATUS_COLORS[s.status] || 'gray'}>{s.label}</Badge>
                                    <Text fw={600}>{s.count}</Text>
                                </Group>
                            ))}
                            {stats.statusBreakdown.length === 0 && <Text c="dimmed" ta="center">Nenhum dado.</Text>}
                        </Stack>
                    </Card>

                    {/* Problem Type Breakdown */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Por Tipo de Problema</Text>
                        <Stack gap="sm">
                            {stats.typeBreakdown.map(t => {
                                const maxCount = stats.typeBreakdown[0]?.count || 1;
                                return (
                                    <div key={t.type}>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">{t.label}</Text>
                                            <Text size="sm" fw={600}>{t.count}</Text>
                                        </Group>
                                        <Progress value={(t.count / maxCount) * 100} color="blue" size="md" radius="md" />
                                    </div>
                                );
                            })}
                            {stats.typeBreakdown.length === 0 && <Text c="dimmed" ta="center">Nenhum dado.</Text>}
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* Suggestions Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Sugestões</Text>
                        <Badge variant="light">{suggestions.length} exibidas de {stats.total}</Badge>
                    </Group>
                    {suggestions.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconBulb size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhuma sugestão</Title>
                            <Text c="dimmed">Ainda não há sugestões de melhoria registradas.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Votos</Table.Th>
                                    <Table.Th>Sugestão</Table.Th>
                                    <Table.Th>Tipo</Table.Th>
                                    <Table.Th>Autor</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {suggestions.map(s => (
                                    <Table.Tr key={s.id}>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconThumbUp size={14} color="green" />
                                                <Text size="sm" fw={600} c={s.netVotes > 0 ? 'green' : s.netVotes < 0 ? 'red' : undefined}>
                                                    {s.netVotes > 0 ? '+' : ''}{s.netVotes}
                                                </Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">{s.upvotes}↑ {s.downvotes}↓</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{s.title}</Text>
                                            <Text size="xs" c="dimmed" lineClamp={1}>{s.description}</Text>
                                            {s.tags.length > 0 && (
                                                <Group gap={4} mt={4}>
                                                    {s.tags.slice(0, 3).map(t => (
                                                        <Badge key={t} size="xs" variant="outline">{t}</Badge>
                                                    ))}
                                                </Group>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="light">{PROBLEM_LABELS[s.problemType] || s.problemType}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{s.submitterName}</Text>
                                            <Text size="xs" c="dimmed">{new Date(s.createdAt * 1000).toLocaleDateString('pt-BR')}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light" color={STATUS_COLORS[s.status] || 'gray'}>
                                                {STATUS_LABELS[s.status] || s.status}
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
