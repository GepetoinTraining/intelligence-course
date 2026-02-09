'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, RingProgress, Progress, Divider, Table, Tabs,
    ThemeIcon, Tooltip, Button, Select, SegmentedControl
} from '@mantine/core';
import {
    IconCurrencyDollar, IconTrendingUp, IconTrendingDown,
    IconUsers, IconUserPlus, IconTarget, IconChartBar,
    IconArrowUpRight, IconArrowDownRight, IconEqual,
    IconClock, IconAlertTriangle, IconCheck, IconCalendar,
    IconBrandGoogle, IconBrandFacebook, IconBrandInstagram,
    IconWorld, IconUserHeart, IconSchool, IconRefresh,
    IconChartLine, IconChartPie, IconChartAreaLine
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

interface ChannelMetrics {
    channel: string;
    icon: React.ReactNode;
    spend: number;
    visitors: number;
    leads: number;
    trials: number;
    enrollments: number;
    cac: number;
    roas: number;
}

interface CohortData {
    month: string;
    enrollments: number;
    month1: number;
    month2: number;
    month3: number;
    month6: number;
    month12: number;
    avgLtv: number;
}

interface UnitEconomicsData {
    blendedCac: number;
    avgLtv: number;
    cacLtvRatio: number;
    paybackMonths: number;
    customerLifespanMonths: number;
    monthlyArpu: number;
}

interface CustomerHealth {
    id: string;
    name: string;
    email: string;
    enrollmentDate: string;
    currentMonth: number;
    healthScore: number;  // 0-100
    churnRisk: 'low' | 'medium' | 'high' | 'critical';
    churnProbability: number;  // 0-100
    lastActivity: string;
    attendanceRate: number;
    paymentStatus: 'current' | 'late' | 'at_risk';
    engagementLevel: 'high' | 'medium' | 'low' | 'declining';
    ltv: number;
    projectedLtv: number;
    riskFactors: string[];
    positiveFactors: string[];
}

interface ExpansionRevenue {
    id: string;
    type: 'upsell' | 'cross_sell' | 'add_on';
    name: string;
    description: string;
    price: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    avgTimeToConvert: number; // months
    targetSegment: string;
}

interface ExpansionEvent {
    id: string;
    studentName: string;
    productName: string;
    type: 'upsell' | 'cross_sell' | 'add_on';
    value: number;
    date: string;
    monthInJourney: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CHANNEL_METRICS: ChannelMetrics[] = [];

const MOCK_COHORTS: CohortData[] = [];

const MOCK_UNIT_ECONOMICS: UnitEconomicsData = {} as UnitEconomicsData as UnitEconomicsData;

const MOCK_CUSTOMER_HEALTH: CustomerHealth[] = [];

const MOCK_EXPANSION_PRODUCTS: ExpansionRevenue[] = [];

const MOCK_EXPANSION_EVENTS: ExpansionEvent[] = [];

// ============================================================================
// METRIC CARDS
// ============================================================================

function MetricCard({
    title,
    value,
    suffix,
    change,
    changeLabel,
    color,
    icon,
}: {
    title: string;
    value: string | number;
    suffix?: string;
    change?: number;
    changeLabel?: string;
    color: string;
    icon: React.ReactNode;
}) {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <Card shadow="sm" p="md" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">{title}</Text>
                <ThemeIcon variant="light" color={color} size="md" radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
            <Group align="flex-end" gap={4}>
                <Text size="xl" fw={700}>{value}</Text>
                {suffix && <Text size="sm" c="dimmed" mb={2}>{suffix}</Text>}
            </Group>
            {change !== undefined && (
                <Group gap={4} mt="xs">
                    {isPositive && <IconArrowUpRight size={14} color="green" />}
                    {isNegative && <IconArrowDownRight size={14} color="red" />}
                    {!isPositive && !isNegative && <IconEqual size={14} color="gray" />}
                    <Text size="xs" c={isPositive ? 'green' : isNegative ? 'red' : 'dimmed'}>
                        {change > 0 ? '+' : ''}{change}% {changeLabel || 'vs mês anterior'}
                    </Text>
                </Group>
            )}
        </Card>
    );
}

// ============================================================================
// FUNNEL VISUALIZATION
// ============================================================================

function FunnelVisualization({ channels }: { channels: ChannelMetrics[] }) {
    const totals = channels.reduce((acc, ch) => ({
        spend: acc.spend + ch.spend,
        visitors: acc.visitors + ch.visitors,
        leads: acc.leads + ch.leads,
        trials: acc.trials + ch.trials,
        enrollments: acc.enrollments + ch.enrollments,
    }), { spend: 0, visitors: 0, leads: 0, trials: 0, enrollments: 0 });

    const stages = [
        { label: 'Visitantes', value: totals.visitors, color: 'gray', pct: 100 },
        { label: 'Leads', value: totals.leads, color: 'blue', pct: (totals.leads / totals.visitors * 100) },
        { label: 'Trials', value: totals.trials, color: 'violet', pct: (totals.trials / totals.leads * 100) },
        { label: 'Matriculados', value: totals.enrollments, color: 'green', pct: (totals.enrollments / totals.trials * 100) },
    ];

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Text fw={600} mb="md">Funil de Conversão Agregado</Text>
            <Stack gap="md">
                {stages.map((stage, i) => (
                    <div key={stage.label}>
                        <Group justify="space-between" mb={4}>
                            <Group gap="xs">
                                <Badge color={stage.color} size="sm">{stage.label}</Badge>
                                <Text size="lg" fw={600}>{stage.value.toLocaleString('pt-BR')}</Text>
                            </Group>
                            {i > 0 && (
                                <Text size="sm" c="dimmed">
                                    CVR: {stage.pct.toFixed(1)}%
                                </Text>
                            )}
                        </Group>
                        <Progress
                            value={i === 0 ? 100 : (stage.value / stages[0].value * 100)}
                            color={stage.color}
                            size="xl"
                            radius="xl"
                        />
                    </div>
                ))}
            </Stack>
            <Divider my="md" />
            <Group justify="space-between">
                <div>
                    <Text size="sm" c="dimmed">Investimento Total</Text>
                    <Text size="lg" fw={600}>R$ {totals.spend.toLocaleString('pt-BR')}</Text>
                </div>
                <div>
                    <Text size="sm" c="dimmed">CAC Blended</Text>
                    <Text size="lg" fw={600}>R$ {(totals.spend / totals.enrollments).toFixed(0)}</Text>
                </div>
                <div>
                    <Text size="sm" c="dimmed">Custo por Lead</Text>
                    <Text size="lg" fw={600}>R$ {(totals.spend / totals.leads).toFixed(0)}</Text>
                </div>
            </Group>
        </Card>
    );
}

// ============================================================================
// CHANNEL BREAKDOWN TABLE
// ============================================================================

function ChannelBreakdownTable({ channels }: { channels: ChannelMetrics[] }) {
    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Text fw={600} mb="md">Performance por Canal</Text>
            <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Canal</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Investimento</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Visitantes</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Leads</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Trials</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Matrículas</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>CAC</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>ROAS</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {channels.map((ch) => (
                            <Table.Tr key={ch.channel}>
                                <Table.Td>
                                    <Group gap="xs">
                                        <ThemeIcon variant="light" color="gray" size="sm" radius="xl">
                                            {ch.icon}
                                        </ThemeIcon>
                                        {ch.channel}
                                    </Group>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                    {ch.spend > 0 ? `R$ ${ch.spend.toLocaleString('pt-BR')}` : '-'}
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>{ch.visitors.toLocaleString('pt-BR')}</Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>{ch.leads}</Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>{ch.trials}</Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                    <Badge color="green" size="sm">{ch.enrollments}</Badge>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                    {ch.cac > 0 ? (
                                        <Badge color={ch.cac < 200 ? 'green' : ch.cac < 400 ? 'yellow' : 'red'} variant="light">
                                            R$ {ch.cac.toFixed(0)}
                                        </Badge>
                                    ) : (
                                        <Badge color="green" variant="light">∞</Badge>
                                    )}
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                    {ch.roas === Infinity ? (
                                        <Badge color="green" variant="filled">Orgânico</Badge>
                                    ) : (
                                        <Badge color={ch.roas > 3 ? 'green' : ch.roas > 1.5 ? 'yellow' : 'red'} variant="light">
                                            {ch.roas.toFixed(1)}x
                                        </Badge>
                                    )}
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Card>
    );
}

// ============================================================================
// COHORT ANALYSIS
// ============================================================================

function CohortAnalysis({ cohorts }: { cohorts: CohortData[] }) {
    const getRetentionColor = (value: number) => {
        if (value === 0) return 'gray.1';
        if (value >= 80) return 'green.3';
        if (value >= 60) return 'teal.3';
        if (value >= 40) return 'yellow.3';
        return 'red.3';
    };

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Text fw={600}>Análise de Cohorts (Retenção %)</Text>
                <Badge color="blue" variant="light">Últimos 6 meses</Badge>
            </Group>
            <Table.ScrollContainer minWidth={700}>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Cohort</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>Matrículas</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>M1</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>M2</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>M3</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>M6</Table.Th>
                            <Table.Th style={{ textAlign: 'center' }}>M12</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>LTV Médio</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {cohorts.map((c) => (
                            <Table.Tr key={c.month}>
                                <Table.Td>
                                    <Text size="sm" fw={500}>{c.month}</Text>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'center' }}>
                                    <Badge color="blue">{c.enrollments}</Badge>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'center' }}>
                                    <Paper p={4} bg={getRetentionColor(c.month1)} radius="sm">
                                        <Text size="xs" fw={500} ta="center">{c.month1}%</Text>
                                    </Paper>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'center' }}>
                                    <Paper p={4} bg={getRetentionColor(c.month2)} radius="sm">
                                        <Text size="xs" fw={500} ta="center">{c.month2 || '-'}%</Text>
                                    </Paper>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'center' }}>
                                    <Paper p={4} bg={getRetentionColor(c.month3)} radius="sm">
                                        <Text size="xs" fw={500} ta="center">{c.month3 || '-'}%</Text>
                                    </Paper>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'center' }}>
                                    <Paper p={4} bg={getRetentionColor(c.month6)} radius="sm">
                                        <Text size="xs" fw={500} ta="center">{c.month6 || '-'}%</Text>
                                    </Paper>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'center' }}>
                                    <Paper p={4} bg={getRetentionColor(c.month12)} radius="sm">
                                        <Text size="xs" fw={500} ta="center">{c.month12 || '-'}%</Text>
                                    </Paper>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                    <Text size="sm" fw={600} c="green">
                                        R$ {c.avgLtv.toLocaleString('pt-BR')}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Card>
    );
}

// ============================================================================
// CAC:LTV HEALTH GAUGE
// ============================================================================

function CacLtvHealthGauge({ economics }: { economics: UnitEconomicsData }) {
    const ratio = economics.cacLtvRatio;
    const isHealthy = ratio > 3;
    const isWarning = ratio >= 1.5 && ratio <= 3;
    const isDanger = ratio < 1.5;

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Text fw={600} mb="md" ta="center">Saúde Unit Economics</Text>
            <Stack align="center" gap="md">
                <RingProgress
                    size={180}
                    thickness={20}
                    roundCaps
                    sections={[
                        { value: Math.min(ratio * 10, 100), color: isHealthy ? 'green' : isWarning ? 'yellow' : 'red' },
                    ]}
                    label={
                        <Stack gap={0} align="center">
                            <Text size="xl" fw={700}>{ratio.toFixed(1)}:1</Text>
                            <Text size="xs" c="dimmed">LTV:CAC</Text>
                        </Stack>
                    }
                />
                <Group justify="center" gap="xl">
                    <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={700} c="red">R$ {economics.blendedCac}</Text>
                        <Text size="xs" c="dimmed">CAC Blended</Text>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Text size="lg" fw={700} c="green">R$ {economics.avgLtv.toLocaleString('pt-BR')}</Text>
                        <Text size="xs" c="dimmed">LTV Médio</Text>
                    </div>
                </Group>
                <Divider w="100%" />
                <SimpleGrid cols={2} spacing="lg">
                    <Paper p="sm" withBorder radius="md" ta="center">
                        <ThemeIcon variant="light" color="blue" size="md" radius="xl" mx="auto" mb="xs">
                            <IconClock size={16} />
                        </ThemeIcon>
                        <Text size="lg" fw={600}>{economics.paybackMonths.toFixed(1)} meses</Text>
                        <Text size="xs" c="dimmed">Payback Period</Text>
                    </Paper>
                    <Paper p="sm" withBorder radius="md" ta="center">
                        <ThemeIcon variant="light" color="violet" size="md" radius="xl" mx="auto" mb="xs">
                            <IconCalendar size={16} />
                        </ThemeIcon>
                        <Text size="lg" fw={600}>{economics.customerLifespanMonths.toFixed(1)} meses</Text>
                        <Text size="xs" c="dimmed">Tempo Médio Aluno</Text>
                    </Paper>
                </SimpleGrid>

                {/* Health Indicator */}
                <Paper p="md" radius="md" withBorder w="100%">
                    <Group gap="sm">
                        <ThemeIcon
                            variant="filled"
                            color={isHealthy ? 'green' : isWarning ? 'yellow' : 'red'}
                            size="lg"
                            radius="xl"
                        >
                            {isHealthy ? <IconCheck size={18} /> : isWarning ? <IconAlertTriangle size={18} /> : <IconTrendingDown size={18} />}
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                {isHealthy ? 'Excelente Saúde Financeira' : isWarning ? 'Atenção: Margem Apertada' : 'Crítico: CAC Alto'}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {isHealthy
                                    ? 'Cada R$1 investido retorna R$' + ratio.toFixed(1) + ' em valor de cliente'
                                    : isWarning
                                        ? 'Considere otimizar canais com CAC alto'
                                        : 'Ação urgente: revisar estratégia de aquisição'
                                }
                            </Text>
                        </div>
                    </Group>
                </Paper>
            </Stack>
        </Card>
    );
}

// ============================================================================
// BUDGET REALLOCATION SUGGESTIONS
// ============================================================================

function BudgetSuggestions({ channels }: { channels: ChannelMetrics[] }) {
    // Sort by efficiency (ROAS)
    const sortedChannels = [...channels]
        .filter(c => c.spend > 0)
        .sort((a, b) => b.roas - a.roas);

    const bestPerformer = sortedChannels[0];
    const worstPerformer = sortedChannels[sortedChannels.length - 1];

    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Text fw={600}>📊 Recomendações de Orçamento</Text>
                <Badge color="violet" variant="light">AI Insights</Badge>
            </Group>
            <Stack gap="md">
                {bestPerformer && (
                    <Paper p="md" withBorder radius="md" bg="green.0">
                        <Group gap="sm">
                            <ThemeIcon variant="light" color="green" size="lg" radius="xl">
                                <IconTrendingUp size={18} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>Aumentar investimento em {bestPerformer.channel}</Text>
                                <Text size="xs" c="dimmed">
                                    ROAS de {bestPerformer.roas.toFixed(1)}x - melhor retorno do portfólio.
                                    Considere aumentar 20% do orçamento.
                                </Text>
                            </div>
                            <Badge color="green">{bestPerformer.roas.toFixed(1)}x</Badge>
                        </Group>
                    </Paper>
                )}

                {worstPerformer && worstPerformer.roas < 2 && (
                    <Paper p="md" withBorder radius="md" bg="red.0">
                        <Group gap="sm">
                            <ThemeIcon variant="light" color="red" size="lg" radius="xl">
                                <IconTrendingDown size={18} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>Revisar {worstPerformer.channel}</Text>
                                <Text size="xs" c="dimmed">
                                    CAC de R${worstPerformer.cac} está acima do ideal.
                                    Considere realocar para canais orgânicos.
                                </Text>
                            </div>
                            <Badge color="red">R$ {worstPerformer.cac}</Badge>
                        </Group>
                    </Paper>
                )}

                <Paper p="md" withBorder radius="md" bg="blue.0">
                    <Group gap="sm">
                        <ThemeIcon variant="light" color="blue" size="lg" radius="xl">
                            <IconUserHeart size={18} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>Fortalecer programa de indicações</Text>
                            <Text size="xs" c="dimmed">
                                CAC mais baixo (R$18) e maior conversão (33%).
                                Considere incentivos para alunos indicarem.
                            </Text>
                        </div>
                        <Badge color="blue">48.5x</Badge>
                    </Group>
                </Paper>
            </Stack>
        </Card>
    );
}

// ============================================================================
// CUSTOMER HEALTH DASHBOARD
// ============================================================================

function CustomerHealthDashboard({ customers }: { customers: CustomerHealth[] }) {
    // Calculate health distribution
    const healthDistribution = {
        healthy: customers.filter(c => c.healthScore >= 70).length,
        warning: customers.filter(c => c.healthScore >= 40 && c.healthScore < 70).length,
        critical: customers.filter(c => c.healthScore < 40).length,
    };

    const churnDistribution = {
        low: customers.filter(c => c.churnRisk === 'low').length,
        medium: customers.filter(c => c.churnRisk === 'medium').length,
        high: customers.filter(c => c.churnRisk === 'high').length,
        critical: customers.filter(c => c.churnRisk === 'critical').length,
    };

    const atRiskCustomers = customers
        .filter(c => c.churnRisk === 'high' || c.churnRisk === 'critical')
        .sort((a, b) => b.churnProbability - a.churnProbability);

    const atRiskValue = atRiskCustomers.reduce((sum, c) => sum + c.projectedLtv, 0);

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'green';
        if (score >= 60) return 'teal';
        if (score >= 40) return 'yellow';
        if (score >= 20) return 'orange';
        return 'red';
    };

    const getRiskBadge = (risk: CustomerHealth['churnRisk']) => {
        const colors = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };
        const labels = { low: 'Baixo', medium: 'Médio', high: 'Alto', critical: 'Crítico' };
        return <Badge color={colors[risk]} variant="filled" size="xs">{labels[risk]}</Badge>;
    };

    const getPaymentBadge = (status: CustomerHealth['paymentStatus']) => {
        const colors = { current: 'green', late: 'yellow', at_risk: 'red' };
        const labels = { current: 'Em dia', late: 'Atrasado', at_risk: 'Em risco' };
        return <Badge color={colors[status]} variant="light" size="xs">{labels[status]}</Badge>;
    };

    return (
        <Stack gap="lg">
            {/* Health Summary Cards */}
            <SimpleGrid cols={{ base: 2, md: 4 }}>
                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Health Score Médio</Text>
                        <ThemeIcon variant="light" color="blue" size="md" radius="md">
                            <IconTarget size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {Math.round(customers.reduce((sum, c) => sum + c.healthScore, 0) / customers.length)}%
                    </Text>
                    <Progress
                        value={customers.reduce((sum, c) => sum + c.healthScore, 0) / customers.length}
                        color="blue"
                        size="sm"
                        mt="xs"
                    />
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Alunos em Risco</Text>
                        <ThemeIcon variant="light" color="red" size="md" radius="md">
                            <IconAlertTriangle size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700} c="red">
                        {healthDistribution.critical + healthDistribution.warning}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {healthDistribution.critical} críticos • {healthDistribution.warning} atenção
                    </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">LTV em Risco</Text>
                        <ThemeIcon variant="light" color="orange" size="md" radius="md">
                            <IconCurrencyDollar size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700} c="orange">
                        R$ {atRiskValue.toLocaleString('pt-BR')}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Valor potencial em risco de churn
                    </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Churn Previsto</Text>
                        <ThemeIcon variant="light" color="violet" size="md" radius="md">
                            <IconTrendingDown size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {((churnDistribution.high + churnDistribution.critical) / customers.length * 100).toFixed(0)}%
                    </Text>
                    <Text size="xs" c="dimmed">
                        Taxa de churn projetada
                    </Text>
                </Card>
            </SimpleGrid>

            {/* Risk Distribution */}
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                <Card shadow="sm" p="lg" radius="md" withBorder>
                    <Text fw={600} mb="md">📊 Distribuição de Risco de Churn</Text>
                    <Stack gap="md">
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Group gap="xs">
                                    <Badge color="green" size="sm">Baixo Risco</Badge>
                                    <Text size="sm" fw={500}>{churnDistribution.low} alunos</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {(churnDistribution.low / customers.length * 100).toFixed(0)}%
                                </Text>
                            </Group>
                            <Progress value={churnDistribution.low / customers.length * 100} color="green" size="lg" radius="xl" />
                        </div>
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Group gap="xs">
                                    <Badge color="yellow" size="sm">Médio Risco</Badge>
                                    <Text size="sm" fw={500}>{churnDistribution.medium} alunos</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {(churnDistribution.medium / customers.length * 100).toFixed(0)}%
                                </Text>
                            </Group>
                            <Progress value={churnDistribution.medium / customers.length * 100} color="yellow" size="lg" radius="xl" />
                        </div>
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Group gap="xs">
                                    <Badge color="orange" size="sm">Alto Risco</Badge>
                                    <Text size="sm" fw={500}>{churnDistribution.high} alunos</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {(churnDistribution.high / customers.length * 100).toFixed(0)}%
                                </Text>
                            </Group>
                            <Progress value={churnDistribution.high / customers.length * 100} color="orange" size="lg" radius="xl" />
                        </div>
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Group gap="xs">
                                    <Badge color="red" size="sm">Crítico</Badge>
                                    <Text size="sm" fw={500}>{churnDistribution.critical} alunos</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {(churnDistribution.critical / customers.length * 100).toFixed(0)}%
                                </Text>
                            </Group>
                            <Progress value={churnDistribution.critical / customers.length * 100} color="red" size="lg" radius="xl" />
                        </div>
                    </Stack>
                </Card>

                <Card shadow="sm" p="lg" radius="md" withBorder>
                    <Text fw={600} mb="md">💡 Ações Recomendadas</Text>
                    <Stack gap="sm">
                        {atRiskCustomers.slice(0, 4).map(customer => (
                            <Paper key={customer.id} p="sm" withBorder radius="sm" bg={customer.churnRisk === 'critical' ? 'red.0' : 'orange.0'}>
                                <Group justify="space-between" mb={4}>
                                    <Group gap="xs">
                                        <Text size="sm" fw={500}>{customer.name}</Text>
                                        {getRiskBadge(customer.churnRisk)}
                                    </Group>
                                    <Text size="xs" c="dimmed">{customer.churnProbability}% prob.</Text>
                                </Group>
                                <Text size="xs" c="dimmed" mb="xs">
                                    {customer.riskFactors.slice(0, 2).join(' • ')}
                                </Text>
                                <Group gap="xs">
                                    <Button size="xs" variant="light" color="blue">Contatar</Button>
                                    <Button size="xs" variant="subtle">Ver Perfil</Button>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Card>
            </SimpleGrid>

            {/* At-Risk Customer Table */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={600}>📋 Alunos em Risco - Monitoramento</Text>
                    <Badge color="red" variant="light">{atRiskCustomers.length} alunos requerem atenção</Badge>
                </Group>
                <Table.ScrollContainer minWidth={900}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Health Score</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Risco Churn</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Frequência</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Pagamento</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Última Atividade</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>LTV Projetado</Table.Th>
                                <Table.Th>Fatores de Risco</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {customers
                                .sort((a, b) => a.healthScore - b.healthScore)
                                .slice(0, 10)
                                .map(customer => (
                                    <Table.Tr key={customer.id}>
                                        <Table.Td>
                                            <div>
                                                <Text size="sm" fw={500}>{customer.name}</Text>
                                                <Text size="xs" c="dimmed">Mês {customer.currentMonth}</Text>
                                            </div>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            <RingProgress
                                                size={45}
                                                thickness={4}
                                                sections={[{ value: customer.healthScore, color: getHealthColor(customer.healthScore) }]}
                                                label={<Text size="xs" ta="center" fw={600}>{customer.healthScore}</Text>}
                                            />
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            {getRiskBadge(customer.churnRisk)}
                                            <Text size="xs" c="dimmed" mt={2}>{customer.churnProbability}%</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            <Badge
                                                color={customer.attendanceRate >= 75 ? 'green' : customer.attendanceRate >= 50 ? 'yellow' : 'red'}
                                                variant="light"
                                            >
                                                {customer.attendanceRate}%
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            {getPaymentBadge(customer.paymentStatus)}
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            <Text size="xs">{customer.lastActivity}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'right' }}>
                                            <Text size="sm" fw={500}>R$ {customer.projectedLtv.toLocaleString('pt-BR')}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                {customer.riskFactors.slice(0, 2).map((factor, i) => (
                                                    <Text key={i} size="xs" c="red">• {factor}</Text>
                                                ))}
                                            </Stack>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Card>
        </Stack>
    );
}

// ============================================================================
// EXPANSION REVENUE DASHBOARD
// ============================================================================

function ExpansionRevenueDashboard({
    products,
    events
}: {
    products: ExpansionRevenue[];
    events: ExpansionEvent[];
}) {
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalConversions = products.reduce((sum, p) => sum + p.conversions, 0);

    const revenueByType = {
        upsell: products.filter(p => p.type === 'upsell').reduce((sum, p) => sum + p.revenue, 0),
        cross_sell: products.filter(p => p.type === 'cross_sell').reduce((sum, p) => sum + p.revenue, 0),
        add_on: products.filter(p => p.type === 'add_on').reduce((sum, p) => sum + p.revenue, 0),
    };

    const getTypeBadge = (type: ExpansionRevenue['type']) => {
        const colors = { upsell: 'blue', cross_sell: 'violet', add_on: 'teal' };
        const labels = { upsell: 'Upsell', cross_sell: 'Cross-sell', add_on: 'Add-on' };
        return <Badge color={colors[type]} variant="light" size="sm">{labels[type]}</Badge>;
    };

    return (
        <Stack gap="lg">
            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 2, md: 4 }}>
                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Receita de Expansão</Text>
                        <ThemeIcon variant="light" color="green" size="md" radius="md">
                            <IconTrendingUp size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700} c="green">
                        R$ {totalRevenue.toLocaleString('pt-BR')}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Últimos 30 dias
                    </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Conversões</Text>
                        <ThemeIcon variant="light" color="blue" size="md" radius="md">
                            <IconUsers size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {totalConversions}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Upgrades realizados
                    </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Ticket Médio</Text>
                        <ThemeIcon variant="light" color="orange" size="md" radius="md">
                            <IconCurrencyDollar size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        R$ {Math.round(totalRevenue / totalConversions)}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Por conversão
                    </Text>
                </Card>

                <Card shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">% da Base</Text>
                        <ThemeIcon variant="light" color="violet" size="md" radius="md">
                            <IconTarget size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {(totalConversions / 130 * 100).toFixed(1)}%
                    </Text>
                    <Text size="xs" c="dimmed">
                        Alunos com expansão
                    </Text>
                </Card>
            </SimpleGrid>

            {/* Revenue by Type */}
            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                <Card shadow="sm" p="lg" radius="md" withBorder>
                    <Text fw={600} mb="md">📊 Receita por Tipo</Text>
                    <Stack gap="md">
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Group gap="xs">
                                    <Badge color="blue" size="sm">Upsell</Badge>
                                    <Text size="sm" fw={500}>R$ {revenueByType.upsell.toLocaleString('pt-BR')}</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {(revenueByType.upsell / totalRevenue * 100).toFixed(0)}%
                                </Text>
                            </Group>
                            <Progress value={revenueByType.upsell / totalRevenue * 100} color="blue" size="lg" radius="xl" />
                        </div>
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Group gap="xs">
                                    <Badge color="violet" size="sm">Cross-sell</Badge>
                                    <Text size="sm" fw={500}>R$ {revenueByType.cross_sell.toLocaleString('pt-BR')}</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {(revenueByType.cross_sell / totalRevenue * 100).toFixed(0)}%
                                </Text>
                            </Group>
                            <Progress value={revenueByType.cross_sell / totalRevenue * 100} color="violet" size="lg" radius="xl" />
                        </div>
                        <div>
                            <Group justify="space-between" mb={4}>
                                <Group gap="xs">
                                    <Badge color="teal" size="sm">Add-on</Badge>
                                    <Text size="sm" fw={500}>R$ {revenueByType.add_on.toLocaleString('pt-BR')}</Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    {(revenueByType.add_on / totalRevenue * 100).toFixed(0)}%
                                </Text>
                            </Group>
                            <Progress value={revenueByType.add_on / totalRevenue * 100} color="teal" size="lg" radius="xl" />
                        </div>
                    </Stack>
                </Card>

                <Card shadow="sm" p="lg" radius="md" withBorder>
                    <Text fw={600} mb="md">🎯 Últimas Conversões</Text>
                    <Stack gap="sm">
                        {events.slice(0, 5).map(event => (
                            <Paper key={event.id} p="sm" withBorder radius="sm">
                                <Group justify="space-between">
                                    <div>
                                        <Group gap="xs" mb={2}>
                                            <Text size="sm" fw={500}>{event.studentName}</Text>
                                            {getTypeBadge(event.type)}
                                        </Group>
                                        <Text size="xs" c="dimmed">{event.productName}</Text>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text size="sm" fw={600} c="green">+R$ {event.value}</Text>
                                        <Text size="xs" c="dimmed">Mês {event.monthInJourney}</Text>
                                    </div>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Card>
            </SimpleGrid>

            {/* Products Table */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={600}>📦 Produtos de Expansão</Text>
                    <Badge color="blue">{products.length} produtos</Badge>
                </Group>
                <Table.ScrollContainer minWidth={800}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Produto</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Preço</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Conversões</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>CVR</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Receita</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Tempo Médio</Table.Th>
                                <Table.Th>Segmento</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {products.map(product => (
                                <Table.Tr key={product.id}>
                                    <Table.Td>
                                        <div>
                                            <Text size="sm" fw={500}>{product.name}</Text>
                                            <Text size="xs" c="dimmed" lineClamp={1}>{product.description}</Text>
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        {getTypeBadge(product.type)}
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>
                                        <Text size="sm" fw={500}>R$ {product.price}</Text>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Badge color="blue">{product.conversions}</Badge>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Badge
                                            color={product.conversionRate > 15 ? 'green' : product.conversionRate > 8 ? 'yellow' : 'gray'}
                                            variant="light"
                                        >
                                            {product.conversionRate}%
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>
                                        <Text size="sm" fw={600} c="green">
                                            R$ {product.revenue.toLocaleString('pt-BR')}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Text size="sm">{product.avgTimeToConvert} meses</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">{product.targetSegment}</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Card>
        </Stack>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function UnitEconomicsPage() {
    const [loading, setLoading] = useState(true);
    const [channels, setChannels] = useState<ChannelMetrics[]>([]);
    const [cohorts, setCohorts] = useState<CohortData[]>([]);
    const [economics, setEconomics] = useState<UnitEconomicsData>(MOCK_UNIT_ECONOMICS);
    const [customerHealth, setCustomerHealth] = useState<CustomerHealth[]>([]);
    const [expansionProducts, setExpansionProducts] = useState<ExpansionRevenue[]>([]);
    const [expansionEvents, setExpansionEvents] = useState<ExpansionEvent[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('overview');
    const [period, setPeriod] = useState('30d');

    useEffect(() => {
        // Simulate API load with mock data
        const timer = setTimeout(() => {
            setChannels(MOCK_CHANNEL_METRICS);
            setCohorts(MOCK_COHORTS);
            setEconomics(MOCK_UNIT_ECONOMICS);
            setCustomerHealth(MOCK_CUSTOMER_HEALTH);
            setExpansionProducts(MOCK_EXPANSION_PRODUCTS);
            setExpansionEvents(MOCK_EXPANSION_EVENTS);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Calculate totals
    const totalSpend = channels.reduce((s, c) => s + c.spend, 0);
    const totalEnrollments = channels.reduce((s, c) => s + c.enrollments, 0);
    const totalLeads = channels.reduce((s, c) => s + c.leads, 0);
    const blendedCac = totalEnrollments > 0 ? totalSpend / totalEnrollments : 0;

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>📈 Unit Economics</Title>
                    <Text c="dimmed" size="sm">
                        Análise de CAC, LTV e eficiência por canal de aquisição
                    </Text>
                </div>
                <Group>
                    <SegmentedControl
                        value={period}
                        onChange={setPeriod}
                        data={[
                            { value: '7d', label: '7 dias' },
                            { value: '30d', label: '30 dias' },
                            { value: '90d', label: '90 dias' },
                            { value: 'ytd', label: 'YTD' },
                        ]}
                        size="sm"
                    />
                    <Button variant="light" leftSection={<IconRefresh size={16} />} size="sm">
                        Atualizar
                    </Button>
                </Group>
            </Group>

            {/* Summary Metrics */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="lg">
                <MetricCard
                    title="CAC Blended"
                    value={`R$ ${blendedCac.toFixed(0)}`}
                    color="orange"
                    icon={<IconCurrencyDollar size={18} />}
                    change={-8}
                    changeLabel="vs mês anterior"
                />
                <MetricCard
                    title="LTV Médio"
                    value={`R$ ${economics.avgLtv.toLocaleString('pt-BR')}`}
                    color="green"
                    icon={<IconTrendingUp size={18} />}
                    change={12}
                />
                <MetricCard
                    title="Matrículas"
                    value={totalEnrollments}
                    suffix="no período"
                    color="blue"
                    icon={<IconUsers size={18} />}
                    change={15}
                />
                <MetricCard
                    title="Investimento"
                    value={`R$ ${totalSpend.toLocaleString('pt-BR')}`}
                    color="violet"
                    icon={<IconTarget size={18} />}
                    change={5}
                />
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab value="overview" leftSection={<IconChartBar size={14} />}>
                        Visão Geral
                    </Tabs.Tab>
                    <Tabs.Tab value="channels" leftSection={<IconChartPie size={14} />}>
                        Por Canal
                    </Tabs.Tab>
                    <Tabs.Tab value="cohorts" leftSection={<IconChartAreaLine size={14} />}>
                        Cohorts
                    </Tabs.Tab>
                    <Tabs.Tab value="optimization" leftSection={<IconChartLine size={14} />}>
                        Otimização
                    </Tabs.Tab>
                    <Tabs.Tab value="health" leftSection={<IconUsers size={14} />}>
                        Saúde do Cliente
                    </Tabs.Tab>
                    <Tabs.Tab value="expansion" leftSection={<IconTrendingUp size={14} />}>
                        Expansão
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                        <FunnelVisualization channels={channels} />
                        <CacLtvHealthGauge economics={economics} />
                    </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="channels">
                    <ChannelBreakdownTable channels={channels} />
                </Tabs.Panel>

                <Tabs.Panel value="cohorts">
                    <CohortAnalysis cohorts={cohorts} />
                </Tabs.Panel>

                <Tabs.Panel value="optimization">
                    <BudgetSuggestions channels={channels} />
                </Tabs.Panel>

                <Tabs.Panel value="health">
                    <CustomerHealthDashboard customers={customerHealth} />
                </Tabs.Panel>

                <Tabs.Panel value="expansion">
                    <ExpansionRevenueDashboard products={expansionProducts} events={expansionEvents} />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}

