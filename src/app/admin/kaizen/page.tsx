'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Loader, Center, Alert, Button, Badge,
} from '@mantine/core';
import {
    IconAlertCircle, IconArrowRight, IconBulb, IconChartBar,
    IconHistory, IconLayout, IconRecycle, IconStar, IconUsers,
    IconTrendingUp, IconMessage2,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

// ============================================================================
// TYPES
// ============================================================================

interface Suggestion {
    id: string;
    title: string;
    status: string;
    problemType: string;
    estimatedImpact: string;
    upvotes: number;
    createdAt: number;
}

// ============================================================================
// PAGE
// ============================================================================

export default function KaizenHubPage() {
    const { data, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const suggestions = data || [];

    const stats = {
        total: suggestions.length,
        pending: suggestions.filter(s => ['submitted', 'under_review', 'needs_info'].includes(s.status)).length,
        inProgress: suggestions.filter(s => ['approved', 'in_progress'].includes(s.status)).length,
        implemented: suggestions.filter(s => s.status === 'implemented').length,
        highImpact: suggestions.filter(s => s.estimatedImpact === 'high' || s.estimatedImpact === 'critical').length,
    };

    const quickLinks = [
        { label: 'Sugestões', href: '/admin/kaizen/sugestoes', icon: IconBulb, color: 'yellow', badge: `${stats.total}` },
        { label: 'Feedback', href: '/admin/kaizen/feedback', icon: IconStar, color: 'orange' },
        { label: 'Quadro Kanban', href: '/admin/kaizen/quadro', icon: IconLayout, color: 'grape' },
        { label: 'Melhorias', href: '/admin/kaizen/melhorias', icon: IconTrendingUp, color: 'teal', badge: `${stats.inProgress}` },
        { label: 'NPS', href: '/admin/kaizen/nps', icon: IconChartBar, color: 'green' },
        { label: 'Pesquisas', href: '/admin/kaizen/pesquisas', icon: IconMessage2, color: 'blue' },
        { label: 'Retrospectivas', href: '/admin/kaizen/retrospectivas', icon: IconHistory, color: 'indigo' },
        { label: 'Histórico', href: '/admin/kaizen/historico', icon: IconRecycle, color: 'gray' },
    ];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Administração</Text>
                    <Title order={2}>Kaizen — Melhoria Contínua</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Sugestões, feedback e melhorias inspiradas na metodologia Toyota
                    </Text>
                </div>
                <DiagramToggle
                    route="/api/kaizen/suggestions"
                    data={suggestions}
                    title="Ciclo de Sugestões Kaizen"
                />
            </Group>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                    Dados offline — {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconBulb size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Sugestões</Text>
                            <Text fw={700} size="xl">{isLoading ? <Loader size="sm" /> : stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                            <IconRecycle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="xl">{isLoading ? <Loader size="sm" /> : stats.pending}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Progresso</Text>
                            <Text fw={700} size="xl">{isLoading ? <Loader size="sm" /> : stats.inProgress}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Implementadas</Text>
                            <Text fw={700} size="xl">{isLoading ? <Loader size="sm" /> : stats.implemented}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Title order={4}>Acesso Rápido</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {quickLinks.map((link) => (
                    <Card key={link.label} withBorder p="lg" style={{ cursor: 'pointer' }}
                        onClick={() => window.location.href = link.href}>
                        <Group>
                            <ThemeIcon variant="light" color={link.color} size="lg" radius="md">
                                <link.icon size={20} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                                <Group gap="xs">
                                    <Text fw={500}>{link.label}</Text>
                                    {link.badge && <Badge size="xs" variant="light">{link.badge}</Badge>}
                                </Group>
                            </div>
                            <IconArrowRight size={16} color="gray" />
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
