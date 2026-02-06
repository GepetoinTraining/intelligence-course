'use client';

import { useState, useEffect } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, TextInput, Loader, Center,
    ThemeIcon, Tabs, Select, ActionIcon, Tooltip,
    Progress, Skeleton, SegmentedControl
} from '@mantine/core';
import {
    IconBulb, IconSearch, IconPlus, IconFlame,
    IconThumbUp, IconThumbDown, IconClock, IconCheck,
    IconX, IconEye, IconMessage, IconTrendingUp,
    IconFilter, IconChartBar, IconUser, IconUsers
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface KaizenSuggestion {
    id: string;
    title: string;
    description: string;
    problemType: string;
    impactArea: string;
    estimatedImpact: string;
    status: string;
    upvotes: number;
    downvotes: number;
    netVotes: number;
    userVote: number | null;
    submitterName: string;
    isOwner: boolean;
    isAnonymous: boolean;
    tags: string[];
    createdAt: number;
    reviewedAt: number | null;
    implementedAt: number | null;
}

const PROBLEM_TYPES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    inefficiency: { label: 'Ineficiência', color: 'orange', icon: <IconClock size={14} /> },
    error_prone: { label: 'Propenso a Erros', color: 'red', icon: <IconX size={14} /> },
    unclear: { label: 'Processo Confuso', color: 'yellow', icon: <IconEye size={14} /> },
    bottleneck: { label: 'Gargalo', color: 'grape', icon: <IconFlame size={14} /> },
    waste: { label: 'Desperdício', color: 'pink', icon: <IconTrendingUp size={14} /> },
    safety: { label: 'Segurança', color: 'red', icon: <IconX size={14} /> },
    quality: { label: 'Qualidade', color: 'blue', icon: <IconCheck size={14} /> },
    cost: { label: 'Custo', color: 'green', icon: <IconChartBar size={14} /> },
    communication: { label: 'Comunicação', color: 'cyan', icon: <IconMessage size={14} /> },
    other: { label: 'Outro', color: 'gray', icon: <IconBulb size={14} /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    submitted: { label: 'Enviada', color: 'blue' },
    under_review: { label: 'Em Análise', color: 'yellow' },
    needs_info: { label: 'Info Necessária', color: 'orange' },
    approved: { label: 'Aprovada', color: 'green' },
    in_progress: { label: 'Em Andamento', color: 'cyan' },
    implemented: { label: 'Implementada', color: 'teal' },
    rejected: { label: 'Rejeitada', color: 'red' },
    deferred: { label: 'Adiada', color: 'gray' },
};

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixo', color: 'gray' },
    medium: { label: 'Médio', color: 'blue' },
    high: { label: 'Alto', color: 'orange' },
    critical: { label: 'Crítico', color: 'red' },
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
};

const formatRelativeTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return formatDate(timestamp);
};

export default function KaizenPage() {
    const router = useRouter();
    const [suggestions, setSuggestions] = useState<KaizenSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'votes'>('recent');
    const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');

    useEffect(() => {
        loadSuggestions();
    }, [statusFilter, sortBy, viewMode]);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (sortBy === 'votes') params.set('topVoted', 'true');
            if (viewMode === 'mine') params.set('mine', 'true');
            params.set('limit', '50');

            const res = await fetch(`/api/kaizen/suggestions?${params}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.data || []);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (id: string, vote: 'up' | 'down') => {
        try {
            const res = await fetch(`/api/kaizen/suggestions/${id}?action=vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vote }),
            });
            if (res.ok) {
                const data = await res.json();
                setSuggestions(prev => prev.map(s =>
                    s.id === id
                        ? {
                            ...s,
                            upvotes: data.upvotes,
                            downvotes: data.downvotes,
                            netVotes: data.netVotes,
                            userVote: vote === 'up' ? 1 : -1,
                        }
                        : s
                ));
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    // Stats
    const stats = {
        total: suggestions.length,
        pending: suggestions.filter(s => ['submitted', 'under_review'].includes(s.status)).length,
        approved: suggestions.filter(s => ['approved', 'in_progress'].includes(s.status)).length,
        implemented: suggestions.filter(s => s.status === 'implemented').length,
    };

    // Filter by search
    const filteredSuggestions = suggestions.filter(s =>
        !searchQuery ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && suggestions.length === 0) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>🛠️ Kaizen - Melhorias</Title>
                        <Text c="dimmed">Carregando...</Text>
                    </div>
                </Group>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={150} radius="md" />
                    ))}
                </SimpleGrid>
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>🛠️ Kaizen - Melhorias Contínuas</Title>
                    <Text c="dimmed">Sugira melhorias e vote nas melhores ideias</Text>
                </div>
                <Button
                    component={Link}
                    href="/kaizen/new"
                    leftSection={<IconPlus size={16} />}
                    variant="filled"
                    color="teal"
                >
                    Nova Sugestão
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="blue">
                            <IconBulb size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.total}</Text>
                            <Text size="sm" c="dimmed">Total</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="yellow">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.pending}</Text>
                            <Text size="sm" c="dimmed">Pendentes</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="green">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.approved}</Text>
                            <Text size="sm" c="dimmed">Aprovadas</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="teal">
                            <IconFlame size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.implemented}</Text>
                            <Text size="sm" c="dimmed">Implementadas</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Filters */}
            <Card shadow="xs" radius="md" p="md" withBorder>
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md">
                        <TextInput
                            placeholder="Buscar sugestões..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            w={250}
                        />
                        <Select
                            placeholder="Status"
                            leftSection={<IconFilter size={16} />}
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v || 'all')}
                            data={[
                                { value: 'all', label: 'Todos' },
                                { value: 'submitted', label: 'Enviadas' },
                                { value: 'under_review', label: 'Em Análise' },
                                { value: 'approved', label: 'Aprovadas' },
                                { value: 'in_progress', label: 'Em Andamento' },
                                { value: 'implemented', label: 'Implementadas' },
                            ]}
                            w={160}
                            clearable
                        />
                    </Group>
                    <Group gap="md">
                        <SegmentedControl
                            value={viewMode}
                            onChange={(v) => setViewMode(v as 'all' | 'mine')}
                            data={[
                                { value: 'all', label: <Group gap={4}><IconUsers size={14} /> Todas</Group> },
                                { value: 'mine', label: <Group gap={4}><IconUser size={14} /> Minhas</Group> },
                            ]}
                        />
                        <SegmentedControl
                            value={sortBy}
                            onChange={(v) => setSortBy(v as 'recent' | 'votes')}
                            data={[
                                { value: 'recent', label: 'Recentes' },
                                { value: 'votes', label: 'Mais Votadas' },
                            ]}
                        />
                    </Group>
                </Group>
            </Card>

            {/* Suggestions List */}
            {filteredSuggestions.length === 0 ? (
                <Card shadow="xs" radius="md" p="xl" withBorder>
                    <Center py="xl">
                        <Stack align="center" gap="md">
                            <ThemeIcon size={64} radius="xl" variant="light" color="teal">
                                <IconBulb size={32} />
                            </ThemeIcon>
                            <Title order={4}>Nenhuma sugestão encontrada</Title>
                            <Text c="dimmed" ta="center" maw={400}>
                                {viewMode === 'mine'
                                    ? 'Você ainda não enviou sugestões. Que tal compartilhar uma ideia de melhoria?'
                                    : 'Seja o primeiro a sugerir uma melhoria!'}
                            </Text>
                            <Button
                                component={Link}
                                href="/kaizen/new"
                                leftSection={<IconPlus size={16} />}
                                color="teal"
                            >
                                Criar Sugestão
                            </Button>
                        </Stack>
                    </Center>
                </Card>
            ) : (
                <Stack gap="md">
                    {filteredSuggestions.map(suggestion => {
                        const problemConfig = PROBLEM_TYPES[suggestion.problemType] || PROBLEM_TYPES.other;
                        const statusConfig = STATUS_CONFIG[suggestion.status] || STATUS_CONFIG.submitted;
                        const impactConfig = IMPACT_CONFIG[suggestion.estimatedImpact] || IMPACT_CONFIG.medium;

                        return (
                            <Paper
                                key={suggestion.id}
                                p="md"
                                radius="md"
                                withBorder
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push(`/kaizen/${suggestion.id}`)}
                            >
                                <Group justify="space-between" wrap="nowrap" align="flex-start">
                                    {/* Vote Section */}
                                    <Stack gap={4} align="center" miw={60} onClick={(e) => e.stopPropagation()}>
                                        <ActionIcon
                                            variant={suggestion.userVote === 1 ? 'filled' : 'light'}
                                            color="green"
                                            size="lg"
                                            onClick={() => handleVote(suggestion.id, 'up')}
                                        >
                                            <IconThumbUp size={18} />
                                        </ActionIcon>
                                        <Text
                                            fw={700}
                                            size="lg"
                                            c={suggestion.netVotes > 0 ? 'green' : suggestion.netVotes < 0 ? 'red' : 'dimmed'}
                                        >
                                            {suggestion.netVotes > 0 ? '+' : ''}{suggestion.netVotes}
                                        </Text>
                                        <ActionIcon
                                            variant={suggestion.userVote === -1 ? 'filled' : 'light'}
                                            color="red"
                                            size="lg"
                                            onClick={() => handleVote(suggestion.id, 'down')}
                                        >
                                            <IconThumbDown size={18} />
                                        </ActionIcon>
                                    </Stack>

                                    {/* Content */}
                                    <Stack gap="xs" style={{ flex: 1 }}>
                                        <Group gap="xs" wrap="wrap">
                                            <Badge
                                                color={statusConfig.color}
                                                variant="light"
                                                size="sm"
                                            >
                                                {statusConfig.label}
                                            </Badge>
                                            <Badge
                                                color={problemConfig.color}
                                                variant="outline"
                                                size="sm"
                                                leftSection={problemConfig.icon}
                                            >
                                                {problemConfig.label}
                                            </Badge>
                                            <Badge
                                                color={impactConfig.color}
                                                variant="dot"
                                                size="sm"
                                            >
                                                Impacto {impactConfig.label}
                                            </Badge>
                                        </Group>

                                        <Text fw={600} size="lg" lineClamp={1}>
                                            {suggestion.title}
                                        </Text>
                                        <Text size="sm" c="dimmed" lineClamp={2}>
                                            {suggestion.description}
                                        </Text>

                                        <Group gap="lg" mt={4}>
                                            <Text size="xs" c="dimmed">
                                                Por {suggestion.submitterName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatRelativeTime(suggestion.createdAt)}
                                            </Text>
                                            {suggestion.tags.length > 0 && (
                                                <Group gap={4}>
                                                    {suggestion.tags.slice(0, 2).map(tag => (
                                                        <Badge key={tag} variant="light" size="xs" color="gray">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                            )}
                                        </Group>
                                    </Stack>

                                    {/* Status indicator */}
                                    {suggestion.status === 'implemented' && (
                                        <ThemeIcon size={32} radius="xl" color="teal" variant="light">
                                            <IconCheck size={18} />
                                        </ThemeIcon>
                                    )}
                                </Group>
                            </Paper>
                        );
                    })}
                </Stack>
            )}
        </Stack>
    );
}

