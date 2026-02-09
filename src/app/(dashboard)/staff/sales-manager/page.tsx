'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Paper, ThemeIcon, Progress, Modal, TextInput, Textarea,
    Select, Table, Tabs, RingProgress, Skeleton, Divider,
    Switch, NumberInput, ActionIcon, Tooltip, Alert
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconChartBar, IconSettings, IconUsers, IconTarget,
    IconTrendingUp, IconTrendingDown, IconRefresh, IconArrowLeft,
    IconPlus, IconTrash, IconEdit, IconBolt, IconClock,
    IconAlertTriangle, IconCheck, IconChevronRight, IconBrain,
    IconFilter, IconCalendar, IconPercentage
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface FunnelRule {
    id: string;
    name: string;
    description: string;
    triggerStage: string;
    condition: string;
    action: string;
    isActive: boolean;
    createdAt: string;
}

interface TeamMemberStats {
    userId: string;
    userName: string;
    tofuCount: number;
    mofuCount: number;
    bofuCount: number;
    wonCount: number;
    lostCount: number;
    conversionRate: number;
    avgDealTime: number; // days
}

interface FunnelMetrics {
    totalLeads: number;
    bySegment: { tofu: number; mofu: number; bofu: number; outcome: number };
    byStage: Record<string, number>;
    conversionRates: {
        tofuToMofu: number;
        mofuToBofu: number;
        bofuToWon: number;
        overall: number;
    };
    avgTimeInStage: Record<string, number>; // days
    bottlenecks: string[];
    wonThisMonth: number;
    lostThisMonth: number;
    pipelineValue: number;
}

// Funnel stages
const ALL_STAGES = [
    { value: 'small_engagement', label: 'Pequenos Engajamentos', segment: 'tofu' },
    { value: 'comments_conversations', label: 'Comentários/Conversas', segment: 'tofu' },
    { value: 'interested', label: 'Interessados', segment: 'tofu' },
    { value: 'qualifying', label: 'Qualificando', segment: 'mofu' },
    { value: 'more_information', label: 'Mais Informações', segment: 'mofu' },
    { value: 'events_invitations', label: 'Eventos/Convites', segment: 'mofu' },
    { value: 'appointments', label: 'Agendamentos', segment: 'bofu' },
    { value: 'negotiation', label: 'Negociação', segment: 'bofu' },
    { value: 'counters', label: 'Contrapropostas', segment: 'bofu' },
    { value: 'won', label: 'Ganho', segment: 'outcome' },
    { value: 'lost', label: 'Pausado', segment: 'outcome' },
];

// Mock automation rules
const MOCK_RULES: FunnelRule[] = [];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SalesManagerPage() {
    const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
    const [rules, setRules] = useState<FunnelRule[]>(MOCK_RULES);
    const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string | null>('overview');

    // Modals
    const [ruleModalOpened, { open: openRuleModal, close: closeRuleModal }] = useDisclosure(false);

    // Forms
    const [newRule, setNewRule] = useState<Partial<FunnelRule>>({
        name: '',
        description: '',
        triggerStage: 'any',
        condition: '',
        action: '',
        isActive: true,
    });

    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/scrm/crm-insights?days=30');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            // Transform API response to our metrics format
            const apiData = data.data;
            setMetrics({
                totalLeads: apiData.summary?.totalActive || 0,
                bySegment: apiData.distributions?.segment || { tofu: 0, mofu: 0, bofu: 0, outcome: 0 },
                byStage: apiData.distributions?.funnel || {},
                conversionRates: {
                    tofuToMofu: 45, // Placeholder - would calculate from transitions
                    mofuToBofu: 60,
                    bofuToWon: 35,
                    overall: apiData.summary?.conversionRate || 0,
                },
                avgTimeInStage: {
                    small_engagement: 2,
                    interested: 3,
                    qualifying: 5,
                    appointments: 4,
                    negotiation: 7,
                },
                bottlenecks: apiData.bottlenecks || [],
                wonThisMonth: apiData.summary?.wonCount || 0,
                lostThisMonth: apiData.summary?.lostCount || 0,
                pipelineValue: (apiData.summary?.totalActive || 0) * 500, // Placeholder
            });

            // Mock team stats (would come from API)
            setTeamStats([
                { userId: '1', userName: 'Maria Silva', tofuCount: 15, mofuCount: 8, bofuCount: 5, wonCount: 12, lostCount: 3, conversionRate: 80, avgDealTime: 14 },
                { userId: '2', userName: 'João Santos', tofuCount: 12, mofuCount: 10, bofuCount: 3, wonCount: 8, lostCount: 4, conversionRate: 67, avgDealTime: 18 },
                { userId: '3', userName: 'Ana Costa', tofuCount: 20, mofuCount: 15, bofuCount: 8, wonCount: 15, lostCount: 5, conversionRate: 75, avgDealTime: 12 },
            ]);
        } catch (error) {
            console.error('Error fetching metrics:', error);
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível carregar as métricas',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const handleSaveRule = () => {
        const rule: FunnelRule = {
            id: Date.now().toString(),
            name: newRule.name || '',
            description: newRule.description || '',
            triggerStage: newRule.triggerStage || 'any',
            condition: newRule.condition || '',
            action: newRule.action || '',
            isActive: newRule.isActive ?? true,
            createdAt: new Date().toISOString().split('T')[0],
        };

        setRules(prev => [...prev, rule]);
        setNewRule({
            name: '',
            description: '',
            triggerStage: 'any',
            condition: '',
            action: '',
            isActive: true,
        });
        closeRuleModal();

        notifications.show({
            title: 'Regra Criada',
            message: 'A nova regra de automação foi salva',
            color: 'green',
        });
    };

    const toggleRule = (ruleId: string) => {
        setRules(prev => prev.map(r =>
            r.id === ruleId ? { ...r, isActive: !r.isActive } : r
        ));
    };

    const deleteRule = (ruleId: string) => {
        setRules(prev => prev.filter(r => r.id !== ruleId));
        notifications.show({
            title: 'Regra Removida',
            message: 'A regra foi excluída',
            color: 'gray',
        });
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <Skeleton height={40} width={300} />
                    <Skeleton height={36} width={120} />
                </Group>
                <SimpleGrid cols={4}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={120} radius="md" />
                    ))}
                </SimpleGrid>
                <Skeleton height={400} radius="md" />
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/staff"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>Sales Manager 📊</Title>
                    <Text c="dimmed">Gestão de pipeline, regras e equipe</Text>
                </div>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={fetchMetrics}
                    >
                        Atualizar
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/scrm/insights"
                        leftSection={<IconBrain size={16} />}
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                    >
                        Insights AI
                    </Button>
                </Group>
            </Group>

            {/* KPI Cards */}
            {metrics && (
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                    <Paper shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Pipeline Total</Text>
                                <Text size="xl" fw={700}>{metrics.totalLeads}</Text>
                                <Text size="xs" c="dimmed">leads ativos</Text>
                            </div>
                            <ThemeIcon size="lg" variant="light" color="blue">
                                <IconUsers size={20} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Taxa de Conversão</Text>
                                <Text size="xl" fw={700} c={metrics.conversionRates.overall > 30 ? 'green' : 'orange'}>
                                    {metrics.conversionRates.overall.toFixed(1)}%
                                </Text>
                                <Text size="xs" c="dimmed">geral</Text>
                            </div>
                            <RingProgress
                                size={50}
                                thickness={4}
                                sections={[{ value: metrics.conversionRates.overall, color: metrics.conversionRates.overall > 30 ? 'green' : 'orange' }]}
                            />
                        </Group>
                    </Paper>

                    <Paper shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Ganhos/Pausados (Mês)</Text>
                                <Group gap="xs">
                                    <Text size="xl" fw={700} c="green">{metrics.wonThisMonth}</Text>
                                    <Text size="xl" c="dimmed">/</Text>
                                    <Text size="xl" fw={700} c="gray">{metrics.lostThisMonth}</Text>
                                </Group>
                            </div>
                            <Stack gap={2}>
                                <Badge size="xs" color="green" leftSection={<IconCheck size={10} />}>
                                    Ganhos
                                </Badge>
                                <Badge size="xs" color="gray">
                                    Pausados
                                </Badge>
                            </Stack>
                        </Group>
                    </Paper>

                    <Paper
                        shadow="sm"
                        radius="md"
                        p="md"
                        withBorder
                        style={{ background: 'linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-teal-0))' }}
                    >
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Valor do Pipeline</Text>
                                <Text size="xl" fw={700} c="green">
                                    R$ {metrics.pipelineValue.toLocaleString('pt-BR')}
                                </Text>
                            </div>
                            <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                                <IconTrendingUp size={20} />
                            </ThemeIcon>
                        </Group>
                    </Paper>
                </SimpleGrid>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                        Visão Geral
                    </Tabs.Tab>
                    <Tabs.Tab value="team" leftSection={<IconUsers size={16} />}>
                        Time ({teamStats.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="rules" leftSection={<IconBolt size={16} />}>
                        Automações ({rules.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="bottlenecks" leftSection={<IconAlertTriangle size={16} />}>
                        Gargalos
                    </Tabs.Tab>
                </Tabs.List>

                {/* Overview Tab */}
                <Tabs.Panel value="overview" pt="md">
                    {metrics && (
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            {/* Funnel Distribution */}
                            <Card shadow="sm" radius="md" p="md" withBorder>
                                <Text fw={600} mb="md">Distribuição por Segmento</Text>
                                <Stack gap="md">
                                    {['tofu', 'mofu', 'bofu', 'outcome'].map(segment => {
                                        const count = metrics.bySegment[segment as keyof typeof metrics.bySegment] || 0;
                                        const colors: Record<string, string> = {
                                            tofu: 'blue',
                                            mofu: 'violet',
                                            bofu: 'orange',
                                            outcome: 'green',
                                        };
                                        const labels: Record<string, string> = {
                                            tofu: 'TOFU (Consciência)',
                                            mofu: 'MOFU (Consideração)',
                                            bofu: 'BOFU (Decisão)',
                                            outcome: 'Resultado',
                                        };
                                        return (
                                            <div key={segment}>
                                                <Group justify="space-between" mb={4}>
                                                    <Text size="sm">{labels[segment]}</Text>
                                                    <Badge color={colors[segment]}>{count}</Badge>
                                                </Group>
                                                <Progress
                                                    value={(count / Math.max(metrics.totalLeads, 1)) * 100}
                                                    color={colors[segment]}
                                                    size="md"
                                                />
                                            </div>
                                        );
                                    })}
                                </Stack>
                            </Card>

                            {/* Conversion Rates */}
                            <Card shadow="sm" radius="md" p="md" withBorder>
                                <Text fw={600} mb="md">Taxas de Conversão</Text>
                                <Stack gap="md">
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group justify="space-between">
                                            <Text size="sm">TOFU → MOFU</Text>
                                            <Group gap="xs">
                                                <Progress
                                                    value={metrics.conversionRates.tofuToMofu}
                                                    w={100}
                                                    size="sm"
                                                    color="blue"
                                                />
                                                <Text size="sm" fw={500}>{metrics.conversionRates.tofuToMofu}%</Text>
                                            </Group>
                                        </Group>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group justify="space-between">
                                            <Text size="sm">MOFU → BOFU</Text>
                                            <Group gap="xs">
                                                <Progress
                                                    value={metrics.conversionRates.mofuToBofu}
                                                    w={100}
                                                    size="sm"
                                                    color="violet"
                                                />
                                                <Text size="sm" fw={500}>{metrics.conversionRates.mofuToBofu}%</Text>
                                            </Group>
                                        </Group>
                                    </Paper>
                                    <Paper p="sm" withBorder radius="sm">
                                        <Group justify="space-between">
                                            <Text size="sm">BOFU → Won</Text>
                                            <Group gap="xs">
                                                <Progress
                                                    value={metrics.conversionRates.bofuToWon}
                                                    w={100}
                                                    size="sm"
                                                    color="green"
                                                />
                                                <Text size="sm" fw={500}>{metrics.conversionRates.bofuToWon}%</Text>
                                            </Group>
                                        </Group>
                                    </Paper>
                                </Stack>
                            </Card>

                            {/* Stage by Stage */}
                            <Card shadow="sm" radius="md" p="md" withBorder>
                                <Text fw={600} mb="md">Por Etapa</Text>
                                <Stack gap="xs">
                                    {ALL_STAGES.filter(s => s.segment !== 'outcome').map(stage => {
                                        const count = metrics.byStage[stage.value] || 0;
                                        const avgTime = metrics.avgTimeInStage[stage.value] || 0;
                                        return (
                                            <Group key={stage.value} justify="space-between" py={4}>
                                                <Group gap="xs">
                                                    <Badge size="xs" variant="dot" color={
                                                        stage.segment === 'tofu' ? 'blue' :
                                                            stage.segment === 'mofu' ? 'violet' : 'orange'
                                                    }>
                                                        {stage.label}
                                                    </Badge>
                                                </Group>
                                                <Group gap="md">
                                                    <Text size="sm" fw={500}>{count}</Text>
                                                    {avgTime > 0 && (
                                                        <Text size="xs" c="dimmed">
                                                            ~{avgTime}d
                                                        </Text>
                                                    )}
                                                </Group>
                                            </Group>
                                        );
                                    })}
                                </Stack>
                            </Card>

                            {/* Quick Actions */}
                            <Card shadow="sm" radius="md" p="md" withBorder>
                                <Text fw={600} mb="md">Ações Rápidas</Text>
                                <Stack gap="sm">
                                    <Button
                                        component={Link}
                                        href="/staff/presales"
                                        variant="light"
                                        fullWidth
                                        leftSection={<IconUsers size={16} />}
                                        rightSection={<IconChevronRight size={16} />}
                                    >
                                        Ver Pré-Vendas (TOFU/MOFU)
                                    </Button>
                                    <Button
                                        component={Link}
                                        href="/staff/sales"
                                        variant="light"
                                        fullWidth
                                        leftSection={<IconTarget size={16} />}
                                        rightSection={<IconChevronRight size={16} />}
                                    >
                                        Ver Vendas (BOFU)
                                    </Button>
                                    <Button
                                        component={Link}
                                        href="/staff/scrm"
                                        variant="light"
                                        fullWidth
                                        leftSection={<IconChartBar size={16} />}
                                        rightSection={<IconChevronRight size={16} />}
                                    >
                                        Pipeline Completo
                                    </Button>
                                    <Button
                                        onClick={() => setActiveTab('rules')}
                                        variant="outline"
                                        fullWidth
                                        leftSection={<IconBolt size={16} />}
                                    >
                                        Configurar Automações
                                    </Button>
                                </Stack>
                            </Card>
                        </SimpleGrid>
                    )}
                </Tabs.Panel>

                {/* Team Tab */}
                <Tabs.Panel value="team" pt="md">
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Performance do Time</Text>
                            <Badge variant="light">Últimos 30 dias</Badge>
                        </Group>
                        <Table verticalSpacing="sm">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Vendedor</Table.Th>
                                    <Table.Th ta="center">TOFU</Table.Th>
                                    <Table.Th ta="center">MOFU</Table.Th>
                                    <Table.Th ta="center">BOFU</Table.Th>
                                    <Table.Th ta="center">Ganhos</Table.Th>
                                    <Table.Th ta="center">Taxa</Table.Th>
                                    <Table.Th ta="center">Tempo Médio</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {teamStats.map(member => (
                                    <Table.Tr key={member.userId}>
                                        <Table.Td>
                                            <Text fw={500}>{member.userName}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge variant="light" color="blue">{member.tofuCount}</Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge variant="light" color="violet">{member.mofuCount}</Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge variant="light" color="orange">{member.bofuCount}</Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge variant="filled" color="green">{member.wonCount}</Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                variant="light"
                                                color={member.conversionRate >= 75 ? 'green' : member.conversionRate >= 50 ? 'yellow' : 'red'}
                                            >
                                                {member.conversionRate}%
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Text size="sm" c="dimmed">{member.avgDealTime} dias</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                </Tabs.Panel>

                {/* Rules Tab */}
                <Tabs.Panel value="rules" pt="md">
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Regras de Automação</Text>
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={openRuleModal}
                            >
                                Nova Regra
                            </Button>
                        </Group>

                        {rules.length === 0 ? (
                            <Text c="dimmed" ta="center" py="xl">
                                Nenhuma regra configurada
                            </Text>
                        ) : (
                            <Stack gap="md">
                                {rules.map(rule => (
                                    <Paper key={rule.id} p="md" withBorder radius="sm">
                                        <Group justify="space-between">
                                            <div style={{ flex: 1 }}>
                                                <Group gap="xs" mb="xs">
                                                    <Text fw={500}>{rule.name}</Text>
                                                    <Badge
                                                        size="xs"
                                                        color={rule.isActive ? 'green' : 'gray'}
                                                    >
                                                        {rule.isActive ? 'Ativa' : 'Inativa'}
                                                    </Badge>
                                                </Group>
                                                <Text size="sm" c="dimmed" mb="xs">
                                                    {rule.description}
                                                </Text>
                                                <Group gap="xs">
                                                    <Badge size="xs" variant="outline">
                                                        Gatilho: {rule.triggerStage}
                                                    </Badge>
                                                    <Badge size="xs" variant="outline">
                                                        Condição: {rule.condition}
                                                    </Badge>
                                                    <Badge size="xs" variant="outline">
                                                        Ação: {rule.action}
                                                    </Badge>
                                                </Group>
                                            </div>
                                            <Group gap="xs">
                                                <Switch
                                                    checked={rule.isActive}
                                                    onChange={() => toggleRule(rule.id)}
                                                    size="sm"
                                                />
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => deleteRule(rule.id)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Card>
                </Tabs.Panel>

                {/* Bottlenecks Tab */}
                <Tabs.Panel value="bottlenecks" pt="md">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        {metrics && metrics.bottlenecks.length > 0 ? (
                            metrics.bottlenecks.map((bottleneck, i) => {
                                const stage = ALL_STAGES.find(s => s.value === bottleneck);
                                return (
                                    <Alert
                                        key={i}
                                        variant="light"
                                        color="orange"
                                        title={`Gargalo: ${stage?.label || bottleneck}`}
                                        icon={<IconAlertTriangle size={20} />}
                                    >
                                        <Text size="sm">
                                            Muitos leads estagnados nesta etapa. Considere revisar
                                            o processo ou adicionar automações.
                                        </Text>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            mt="sm"
                                            onClick={() => setActiveTab('rules')}
                                        >
                                            Criar Automação
                                        </Button>
                                    </Alert>
                                );
                            })
                        ) : (
                            <Alert
                                variant="light"
                                color="green"
                                title="Nenhum Gargalo Detectado"
                                icon={<IconCheck size={20} />}
                            >
                                O pipeline está fluindo bem! Continue monitorando.
                            </Alert>
                        )}
                    </SimpleGrid>
                </Tabs.Panel>
            </Tabs>

            {/* New Rule Modal */}
            <Modal
                opened={ruleModalOpened}
                onClose={closeRuleModal}
                title={
                    <Group gap="xs">
                        <IconBolt size={20} />
                        <Text fw={600}>Nova Regra de Automação</Text>
                    </Group>
                }
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome da Regra"
                        placeholder="Ex: Auto-Qualificação"
                        value={newRule.name}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    />

                    <Textarea
                        label="Descrição"
                        placeholder="O que esta regra faz?"
                        value={newRule.description}
                        onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    />

                    <Select
                        label="Etapa Gatilho"
                        data={[
                            { value: 'any', label: 'Qualquer etapa' },
                            ...ALL_STAGES.map(s => ({ value: s.value, label: s.label })),
                        ]}
                        value={newRule.triggerStage}
                        onChange={(v) => setNewRule(prev => ({ ...prev, triggerStage: v || 'any' }))}
                    />

                    <TextInput
                        label="Condição"
                        placeholder="Ex: days_in_stage >= 7"
                        value={newRule.condition}
                        onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
                        description="Use: days_in_stage, interactions, sentiment, has_persona, has_3x3"
                    />

                    <Select
                        label="Ação"
                        data={[
                            { value: 'notify:assigned_user', label: 'Notificar usuário atribuído' },
                            { value: 'notify:manager', label: 'Notificar gerente' },
                            { value: 'move_to:next_stage', label: 'Mover para próxima etapa' },
                            { value: 'tag:hot_lead', label: 'Marcar como Hot Lead' },
                            { value: 'tag:at_risk', label: 'Marcar como Em Risco' },
                        ]}
                        value={newRule.action}
                        onChange={(v) => setNewRule(prev => ({ ...prev, action: v || '' }))}
                    />

                    <Switch
                        label="Ativar imediatamente"
                        checked={newRule.isActive}
                        onChange={(e) => setNewRule(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
                    />

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeRuleModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveRule}
                            disabled={!newRule.name || !newRule.condition || !newRule.action}
                        >
                            Criar Regra
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

