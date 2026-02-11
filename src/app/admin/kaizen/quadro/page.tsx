'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Loader, Alert, Select, Paper,
    ActionIcon, Tooltip,
} from '@mantine/core';
import {
    IconAlertCircle, IconColumns, IconThumbUp, IconArrowRight,
    IconBulb, IconClock, IconCheck, IconX,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

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
    tags: string[];
    createdAt: number;
}

const STATUS_COLORS: Record<string, string> = {
    submitted: 'blue', under_review: 'yellow', needs_info: 'orange',
    approved: 'teal', in_progress: 'violet', implemented: 'green',
    rejected: 'red', deferred: 'gray',
};
const STATUS_LABELS: Record<string, string> = {
    submitted: 'Submetida', under_review: 'Em Análise', needs_info: 'Info',
    approved: 'Aprovada', in_progress: 'Em Progresso', implemented: 'Implementada',
    rejected: 'Rejeitada', deferred: 'Adiada',
};
const IMPACT_COLORS: Record<string, string> = { low: 'gray', medium: 'yellow', high: 'orange', critical: 'red' };

type KanbanColumn = {
    id: string;
    label: string;
    color: string;
    statuses: string[];
};

const KANBAN_COLUMNS: KanbanColumn[] = [
    { id: 'backlog', label: '📦 Backlog', color: 'blue', statuses: ['submitted', 'needs_info'] },
    { id: 'review', label: '🔍 Em Análise', color: 'yellow', statuses: ['under_review'] },
    { id: 'approved', label: '✅ Aprovado', color: 'teal', statuses: ['approved'] },
    { id: 'inprogress', label: '🚀 Em Progresso', color: 'violet', statuses: ['in_progress'] },
    { id: 'done', label: '🎉 Concluído', color: 'green', statuses: ['implemented'] },
    { id: 'closed', label: '🗄️ Fechado', color: 'gray', statuses: ['rejected', 'deferred'] },
];

export default function QuadroPage() {
    const { data: suggestionsData, isLoading: loading } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const suggestions = suggestionsData || [];
    const [error, setError] = useState<string | null>(null);
    const [problemFilter, setProblemFilter] = useState<string | null>(null);

    const columns = useMemo(() => {
        return KANBAN_COLUMNS.map(col => ({
            ...col,
            items: suggestions.filter(s => col.statuses.includes(s.status)).sort((a, b) => b.netVotes - a.netVotes),
        }));
    }, [suggestions]);

    const totalItems = suggestions.length;

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando quadro Kaizen...</Text></Group>
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
                        <Text size="sm" fw={500}>Quadro de Melhorias</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Group align="center">
                            <Title order={1}>Quadro Kaizen</Title>
                            <Badge variant="light" size="lg">{totalItems} itens</Badge>
                        </Group>
                        <DiagramToggle route="/api/kaizen/suggestions" data={suggestions} forceType="stateDiagram" title="Fluxo Kanban" />
                        <Select
                            size="sm"
                            placeholder="Tipo de Problema"
                            clearable
                            value={problemFilter}
                            onChange={setProblemFilter}
                            data={[
                                { value: 'inefficiency', label: 'Ineficiência' },
                                { value: 'error_prone', label: 'Erros Frequentes' },
                                { value: 'bottleneck', label: 'Gargalo' },
                                { value: 'waste', label: 'Desperdício' },
                                { value: 'quality', label: 'Qualidade' },
                                { value: 'cost', label: 'Custo' },
                                { value: 'communication', label: 'Comunicação' },
                            ]}
                            w={200}
                        />
                    </Group>
                    <Text c="dimmed" mt="xs">Visualização Kanban de sugestões de melhoria contínua.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* Kanban Board */}
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: 16, minWidth: columns.length * 280 }}>
                        {columns.map(col => (
                            <Card
                                key={col.id}
                                withBorder
                                padding="md"
                                radius="md"
                                style={{
                                    minWidth: 260,
                                    flex: 1,
                                    backgroundColor: 'var(--mantine-color-body)',
                                }}
                            >
                                <Group justify="space-between" mb="md">
                                    <Text fw={600} size="sm">{col.label}</Text>
                                    <Badge variant="filled" color={col.color} size="sm" circle>{col.items.length}</Badge>
                                </Group>

                                <Stack gap="xs" style={{ minHeight: 200 }}>
                                    {col.items.length === 0 ? (
                                        <Paper
                                            withBorder
                                            p="md"
                                            radius="md"
                                            style={{
                                                textAlign: 'center',
                                                border: '2px dashed var(--mantine-color-gray-3)',
                                                backgroundColor: 'transparent',
                                            }}
                                        >
                                            <Text size="sm" c="dimmed">Vazio</Text>
                                        </Paper>
                                    ) : (
                                        col.items.map(item => (
                                            <Paper
                                                key={item.id}
                                                withBorder
                                                p="sm"
                                                radius="md"
                                                style={{
                                                    cursor: 'default',
                                                    transition: 'box-shadow 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <Text size="sm" fw={500} lineClamp={2} mb={4}>{item.title}</Text>
                                                <Text size="xs" c="dimmed" lineClamp={2} mb="xs">{item.description}</Text>

                                                {item.tags.length > 0 && (
                                                    <Group gap={4} mb="xs">
                                                        {item.tags.slice(0, 2).map(t => (
                                                            <Badge key={t} size="xs" variant="outline">{t}</Badge>
                                                        ))}
                                                    </Group>
                                                )}

                                                <Group justify="space-between">
                                                    <Group gap={4}>
                                                        <IconThumbUp size={14} color={item.netVotes > 0 ? 'green' : 'gray'} />
                                                        <Text size="xs" fw={600} c={item.netVotes > 0 ? 'green' : item.netVotes < 0 ? 'red' : 'dimmed'}>
                                                            {item.netVotes > 0 ? '+' : ''}{item.netVotes}
                                                        </Text>
                                                    </Group>
                                                    {item.estimatedImpact && (
                                                        <Badge size="xs" variant="light" color={IMPACT_COLORS[item.estimatedImpact] || 'gray'}>
                                                            {item.estimatedImpact}
                                                        </Badge>
                                                    )}
                                                </Group>

                                                <Group justify="space-between" mt="xs">
                                                    <Text size="xs" c="dimmed">{item.submitterName}</Text>
                                                    <Text size="xs" c="dimmed">
                                                        {new Date(item.createdAt * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                    </Text>
                                                </Group>
                                            </Paper>
                                        ))
                                    )}
                                </Stack>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <SimpleGrid cols={{ base: 3, md: 6 }}>
                    {columns.map(col => (
                        <Paper key={col.id} withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                            <Text size="xl" fw={700} c={col.color}>{col.items.length}</Text>
                            <Text size="xs" c="dimmed">{col.label.replace(/^[^\s]+\s/, '')}</Text>
                        </Paper>
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
