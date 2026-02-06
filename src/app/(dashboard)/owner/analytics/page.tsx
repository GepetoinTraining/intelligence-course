'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Paper,
    Loader, Center, SimpleGrid, ThemeIcon, SegmentedControl,
    RingProgress, Table, Progress
} from '@mantine/core';
import {
    IconChartBar, IconTrendingUp, IconUsers, IconCash,
    IconReportAnalytics, IconTarget, IconBook
} from '@tabler/icons-react';

interface KPI {
    label: string;
    value: string | number;
    target: string | number;
    progress: number;
    trend: 'up' | 'down' | 'stable';
    color: string;
}

interface Metric {
    name: string;
    current: number;
    previous: number;
    change: number;
}

export default function OwnerAnalyticsPage() {
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch various data to compile analytics
            const [usersRes, transactionsRes, enrollmentsRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/transactions'),
                fetch('/api/enrollments'),
            ]);

            const users = await usersRes.json();
            const transactions = await transactionsRes.json();
            const enrollments = await enrollmentsRes.json();

            // Calculate KPIs
            const studentCount = users.data?.filter((u: any) => u.role === 'student').length || 0;
            const activeEnrollments = enrollments.data?.filter((e: any) => e.status === 'active').length || 0;
            const totalRevenue = transactions.data?.reduce((acc: number, t: any) => acc + Math.abs(t.amount || 0), 0) || 0;

            setKpis([
                {
                    label: 'Alunos Ativos',
                    value: activeEnrollments,
                    target: 100,
                    progress: (activeEnrollments / 100) * 100,
                    trend: 'up',
                    color: 'blue',
                },
                {
                    label: 'Taxa de Retenção',
                    value: '0%',
                    target: '90%',
                    progress: 0,
                    trend: 'stable',
                    color: 'green',
                },
                {
                    label: 'NPS Score',
                    value: '-',
                    target: '70',
                    progress: 0,
                    trend: 'stable',
                    color: 'violet',
                },
                {
                    label: 'Receita Mensal',
                    value: formatCurrency(totalRevenue),
                    target: formatCurrency(5000000),
                    progress: (totalRevenue / 5000000) * 100,
                    trend: 'up',
                    color: 'orange',
                },
            ]);

            setMetrics([
                { name: 'Novos Leads', current: 0, previous: 0, change: 0 },
                { name: 'Taxa de Conversão', current: 0, previous: 0, change: 0 },
                { name: 'Ticket Médio', current: 0, previous: 0, change: 0 },
                { name: 'Churn Rate', current: 0, previous: 0, change: 0 },
                { name: 'LTV Médio', current: 0, previous: 0, change: 0 },
                { name: 'CAC', current: 0, previous: 0, change: 0 },
            ]);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Business Intelligence</Title>
                    <Text c="dimmed">Métricas e indicadores de negócio</Text>
                </div>
                <SegmentedControl
                    value={period}
                    onChange={(v) => setPeriod(v as typeof period)}
                    data={[
                        { label: 'Mês', value: 'month' },
                        { label: 'Trimestre', value: 'quarter' },
                        { label: 'Ano', value: 'year' },
                    ]}
                />
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : (
                <Stack>
                    {/* KPI Cards */}
                    <SimpleGrid cols={4}>
                        {kpis.map((kpi) => (
                            <Card key={kpi.label} withBorder p="lg">
                                <Group justify="space-between" mb="md">
                                    <Text size="sm" c="dimmed">{kpi.label}</Text>
                                    <ThemeIcon size="sm" variant="light" color={kpi.color}>
                                        <IconTarget size={14} />
                                    </ThemeIcon>
                                </Group>
                                <Group justify="space-between" align="flex-end">
                                    <div>
                                        <Text size="xl" fw={700}>{kpi.value}</Text>
                                        <Text size="xs" c="dimmed">Meta: {kpi.target}</Text>
                                    </div>
                                    <RingProgress
                                        size={50}
                                        thickness={4}
                                        roundCaps
                                        sections={[{ value: Math.min(kpi.progress, 100), color: kpi.color }]}
                                    />
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>

                    {/* Metrics Table */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Métricas de Negócio</Title>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Métrica</Table.Th>
                                    <Table.Th ta="right">Atual</Table.Th>
                                    <Table.Th ta="right">Anterior</Table.Th>
                                    <Table.Th ta="right">Variação</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {metrics.map((metric) => (
                                    <Table.Tr key={metric.name}>
                                        <Table.Td fw={500}>{metric.name}</Table.Td>
                                        <Table.Td ta="right">{metric.current || '-'}</Table.Td>
                                        <Table.Td ta="right">{metric.previous || '-'}</Table.Td>
                                        <Table.Td ta="right">
                                            <Text
                                                c={metric.change > 0 ? 'green' : metric.change < 0 ? 'red' : 'gray'}
                                            >
                                                {metric.change > 0 ? '+' : ''}{metric.change}%
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>

                    {/* Charts Section */}
                    <SimpleGrid cols={2}>
                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Funil de Vendas</Title>
                            <Paper withBorder p="xl" ta="center" bg="gray.0">
                                <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                    <IconChartBar size={30} />
                                </ThemeIcon>
                                <Text c="dimmed">
                                    Gráfico de funil será exibido com dados reais
                                </Text>
                            </Paper>
                        </Card>

                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Cohort de Retenção</Title>
                            <Paper withBorder p="xl" ta="center" bg="gray.0">
                                <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                    <IconUsers size={30} />
                                </ThemeIcon>
                                <Text c="dimmed">
                                    Análise de cohort será exibida com dados reais
                                </Text>
                            </Paper>
                        </Card>

                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Receita por Curso</Title>
                            <Paper withBorder p="xl" ta="center" bg="gray.0">
                                <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                    <IconBook size={30} />
                                </ThemeIcon>
                                <Text c="dimmed">
                                    Distribuição por curso será exibida com dados reais
                                </Text>
                            </Paper>
                        </Card>

                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Tendência de Crescimento</Title>
                            <Paper withBorder p="xl" ta="center" bg="gray.0">
                                <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                    <IconTrendingUp size={30} />
                                </ThemeIcon>
                                <Text c="dimmed">
                                    Gráfico de tendência será exibido com dados reais
                                </Text>
                            </Paper>
                        </Card>
                    </SimpleGrid>
                </Stack>
            )}
        </Container>
    );
}

