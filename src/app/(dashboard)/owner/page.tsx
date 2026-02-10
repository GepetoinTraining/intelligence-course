'use client';

import { useState, useEffect } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, Grid, RingProgress, Progress, Table, Tabs,
    Divider, SegmentedControl
} from '@mantine/core';
import {
    IconChevronLeft, IconCurrencyDollar, IconTrendingUp, IconTrendingDown,
    IconUsers, IconReceipt, IconChartBar, IconCalendar, IconArrowUpRight,
    IconArrowDownRight, IconArrowRight, IconScale, IconCash, IconReportMoney,
    IconBriefcase,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { FinancialSummary, MonthlyFinancial, CashFlowProjection } from '@/types/domain';

export default function OwnerDashboardPage() {
    const [comparisonView, setComparisonView] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
    const [financials, setFinancials] = useState<FinancialSummary>({
        revenue: { current: 0, previous: 0 },
        expenses: { current: 0, previous: 0 },
        profit: { current: 0, previous: 0 },
        students: { current: 0, previous: 0 },
        pendingPayments: 0,
        payrollDue: 0,
    });
    const [monthly2026, setMonthly2026] = useState<MonthlyFinancial[]>([]);
    const [monthly2025, setMonthly2025] = useState<MonthlyFinancial[]>([]);
    const [cashFlow, setCashFlow] = useState<CashFlowProjection>({
        currentBalance: 0,
        projectedInflows: [],
        projectedOutflows: [],
    });

    useEffect(() => {
        const fetchOwnerData = async () => {
            try {
                const res = await fetch('/api/owner/financials');
                if (res.ok) {
                    const json = await res.json();
                    if (json.financials) setFinancials(json.financials);
                    if (json.monthly2026) setMonthly2026(json.monthly2026);
                    if (json.monthly2025) setMonthly2025(json.monthly2025);
                    if (json.cashFlow) setCashFlow(json.cashFlow);
                }
            } catch (err) {
                console.error('Error fetching owner data:', err);
            }
        };
        fetchOwnerData();
    }, []);

    const getGrowth = (current: number, previous: number) => {
        if (previous === 0) return { value: '0', positive: true };
        const growth = ((current - previous) / previous) * 100;
        return { value: growth.toFixed(1), positive: growth >= 0 };
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Calculate YTD totals
    const ytd2026 = monthly2026.slice(0, 2).reduce((acc, m) => ({
        revenue: acc.revenue + m.revenue,
        expenses: acc.expenses + m.expenses,
    }), { revenue: 0, expenses: 0 });

    const ytd2025 = monthly2025.slice(0, 2).reduce((acc, m) => ({
        revenue: acc.revenue + m.revenue,
        expenses: acc.expenses + m.expenses,
    }), { revenue: 0, expenses: 0 });

    // Annual totals
    const annual2025 = monthly2025.reduce((acc, m) => ({
        revenue: acc.revenue + m.revenue,
        expenses: acc.expenses + m.expenses,
    }), { revenue: 0, expenses: 0 });

    const revenueGrowth = getGrowth(financials.revenue.current, financials.revenue.previous);
    const profitGrowth = getGrowth(financials.profit.current, financials.profit.previous);
    const studentGrowth = getGrowth(financials.students.current, financials.students.previous);
    const profitMargin = financials.revenue.current > 0 ? (financials.profit.current / financials.revenue.current) * 100 : 0;

    const ytdRevenueGrowth = getGrowth(ytd2026.revenue, ytd2025.revenue);
    const ytdProfitGrowth = getGrowth(ytd2026.revenue - ytd2026.expenses, ytd2025.revenue - ytd2025.expenses);

    // Cash flow projection
    const projectedBalance = cashFlow.currentBalance
        + cashFlow.projectedInflows.reduce((acc: number, i: any) => acc + i.amount, 0)
        - cashFlow.projectedOutflows.reduce((acc: number, o: any) => acc + o.amount, 0);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between">
                <div>
                    <Title order={2}>Painel do Proprietário 💼</Title>
                    <Text c="dimmed">Visão geral financeira e operacional</Text>
                </div>
                <Group>
                    <Link href="/owner/hiring" passHref legacyBehavior>
                        <Button component="a" variant="filled" color="violet" leftSection={<IconUsers size={16} />}>
                            Gestão de Vagas
                        </Button>
                    </Link>
                    <Link href="/owner/payroll" passHref legacyBehavior>
                        <Button component="a" variant="light" leftSection={<IconUsers size={16} />}>
                            Folha de Pagamento
                        </Button>
                    </Link>
                    <Link href="/owner/reports" passHref legacyBehavior>
                        <Button component="a" variant="light" leftSection={<IconChartBar size={16} />}>
                            Relatórios
                        </Button>
                    </Link>
                </Group>
            </Group>

            {/* Main KPIs */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size={40} variant="light" color="green">
                            <IconCurrencyDollar size={24} />
                        </ThemeIcon>
                        <Badge color={revenueGrowth.positive ? 'green' : 'red'} variant="light" leftSection={revenueGrowth.positive ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />}>
                            {revenueGrowth.value}%
                        </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">Receita Mensal</Text>
                    <Text size="xl" fw={700}>R$ {financials.revenue.current.toLocaleString('pt-BR')}</Text>
                </Paper>

                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size={40} variant="light" color="red">
                            <IconReceipt size={24} />
                        </ThemeIcon>
                        <Badge color="gray" variant="light">
                            {financials.revenue.current > 0 ? ((financials.expenses.current / financials.revenue.current) * 100).toFixed(0) : '0'}%
                        </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">Despesas</Text>
                    <Text size="xl" fw={700}>R$ {financials.expenses.current.toLocaleString('pt-BR')}</Text>
                </Paper>

                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size={40} variant="light" color="blue">
                            <IconTrendingUp size={24} />
                        </ThemeIcon>
                        <Badge color={profitGrowth.positive ? 'green' : 'red'} variant="light" leftSection={profitGrowth.positive ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />}>
                            {profitGrowth.value}%
                        </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">Lucro Líquido</Text>
                    <Text size="xl" fw={700} c="blue">R$ {financials.profit.current.toLocaleString('pt-BR')}</Text>
                </Paper>

                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size={40} variant="light" color="violet">
                            <IconUsers size={24} />
                        </ThemeIcon>
                        <Badge color={studentGrowth.positive ? 'green' : 'red'} variant="light" leftSection={studentGrowth.positive ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />}>
                            {studentGrowth.value}%
                        </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">Alunos Ativos</Text>
                    <Text size="xl" fw={700}>{financials.students.current}</Text>
                </Paper>
            </SimpleGrid>

            {/* Year-over-Year Comparison */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Group gap="xs">
                        <ThemeIcon size="lg" variant="light" color="cyan">
                            <IconScale size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Comparativo Ano a Ano</Text>
                            <Text size="xs" c="dimmed">2026 vs 2025</Text>
                        </div>
                    </Group>
                    <SegmentedControl
                        value={comparisonView}
                        onChange={(v) => setComparisonView(v as typeof comparisonView)}
                        data={[
                            { label: 'Mensal', value: 'monthly' },
                            { label: 'Trimestral', value: 'quarterly' },
                            { label: 'Anual', value: 'annual' },
                        ]}
                        size="xs"
                    />
                </Group>

                {comparisonView === 'monthly' && (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Mês</Table.Th>
                                <Table.Th ta="right">2025</Table.Th>
                                <Table.Th ta="right">2026</Table.Th>
                                <Table.Th ta="center">Variação</Table.Th>
                                <Table.Th>Tendência</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {monthly2026.slice(0, 2).map((month, i) => {
                                const prev = monthly2025[i];
                                const growth = getGrowth(month.revenue, prev.revenue);
                                return (
                                    <Table.Tr key={month.month}>
                                        <Table.Td>
                                            <Text fw={500}>{month.month}</Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Text size="sm" c="dimmed">{formatCurrency(prev.revenue)}</Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Text size="sm" fw={500}>{formatCurrency(month.revenue)}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                color={growth.positive ? 'green' : 'red'}
                                                variant="light"
                                                leftSection={growth.positive ? <IconArrowUpRight size={10} /> : <IconArrowDownRight size={10} />}
                                            >
                                                {growth.value}%
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Progress
                                                value={Math.min(100, (month.revenue / prev.revenue) * 50)}
                                                color={growth.positive ? 'green' : 'red'}
                                                size="sm"
                                                radius="xl"
                                                style={{ width: 80 }}
                                            />
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                        <Table.Tfoot>
                            <Table.Tr style={{ background: 'var(--mantine-color-gray-0)' }}>
                                <Table.Td><Text fw={700}>YTD Total</Text></Table.Td>
                                <Table.Td ta="right"><Text fw={500} c="dimmed">{formatCurrency(ytd2025.revenue)}</Text></Table.Td>
                                <Table.Td ta="right"><Text fw={700}>{formatCurrency(ytd2026.revenue)}</Text></Table.Td>
                                <Table.Td ta="center">
                                    <Badge
                                        color={ytdRevenueGrowth.positive ? 'green' : 'red'}
                                        variant="filled"
                                        leftSection={ytdRevenueGrowth.positive ? <IconArrowUpRight size={10} /> : <IconArrowDownRight size={10} />}
                                    >
                                        {ytdRevenueGrowth.value}%
                                    </Badge>
                                </Table.Td>
                                <Table.Td></Table.Td>
                            </Table.Tr>
                        </Table.Tfoot>
                    </Table>
                )}

                {comparisonView === 'quarterly' && (
                    <SimpleGrid cols={4} spacing="md">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, qi) => {
                            const q2025 = monthly2025.slice(qi * 3, (qi + 1) * 3).reduce((acc: number, m: MonthlyFinancial) => acc + m.revenue, 0);
                            const q2026 = monthly2026.slice(qi * 3, (qi + 1) * 3).reduce((acc: number, m: MonthlyFinancial) => acc + m.revenue, 0);
                            const growth = getGrowth(q2026, q2025);
                            const isFuture = qi > 0; // Only Q1 has data so far

                            return (
                                <Paper key={quarter} p="md" radius="md" withBorder bg={isFuture ? 'gray.0' : undefined}>
                                    <Stack gap="xs">
                                        <Group justify="space-between">
                                            <Text fw={600}>{quarter}</Text>
                                            {!isFuture && (
                                                <Badge
                                                    size="xs"
                                                    color={growth.positive ? 'green' : 'red'}
                                                    variant="light"
                                                >
                                                    {growth.positive ? '+' : ''}{growth.value}%
                                                </Badge>
                                            )}
                                        </Group>
                                        <div>
                                            <Text size="xs" c="dimmed">2025</Text>
                                            <Text size="sm">{formatCurrency(q2025)}</Text>
                                        </div>
                                        <div>
                                            <Text size="xs" c="dimmed">2026</Text>
                                            <Text size="sm" fw={500}>
                                                {isFuture ? '—' : formatCurrency(q2026)}
                                            </Text>
                                        </div>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </SimpleGrid>
                )}

                {comparisonView === 'annual' && (
                    <SimpleGrid cols={3} spacing="md">
                        <Paper p="lg" radius="md" withBorder>
                            <Stack gap="xs" align="center">
                                <Text size="sm" c="dimmed">Receita Anual 2025</Text>
                                <Text size="xl" fw={700}>{formatCurrency(annual2025.revenue)}</Text>
                                <Divider w="100%" />
                                <Text size="sm" c="dimmed">Lucro 2025</Text>
                                <Text size="lg" fw={600} c="green">{formatCurrency(annual2025.revenue - annual2025.expenses)}</Text>
                            </Stack>
                        </Paper>
                        <Paper p="lg" radius="md" withBorder bg="violet.0">
                            <Stack gap="xs" align="center">
                                <Text size="sm" c="dimmed">Projeção 2026</Text>
                                <Text size="xl" fw={700}>{formatCurrency(ytd2026.revenue * 6)}</Text>
                                <Text size="xs" c="dimmed">(baseado em Jan-Fev × 6)</Text>
                                <Divider w="100%" />
                                <Badge
                                    size="lg"
                                    color={getGrowth(ytd2026.revenue * 6, annual2025.revenue).positive ? 'green' : 'red'}
                                >
                                    {getGrowth(ytd2026.revenue * 6, annual2025.revenue).positive ? '+' : ''}
                                    {getGrowth(ytd2026.revenue * 6, annual2025.revenue).value}% vs 2025
                                </Badge>
                            </Stack>
                        </Paper>
                        <Paper p="lg" radius="md" withBorder>
                            <Stack gap="xs" align="center">
                                <Text size="sm" c="dimmed">Meta 2026</Text>
                                <Text size="xl" fw={700}>{formatCurrency(600000)}</Text>
                                <Divider w="100%" />
                                <Progress
                                    value={(ytd2026.revenue / 600000) * 100}
                                    color="violet"
                                    size="lg"
                                    radius="xl"
                                    w="100%"
                                />
                                <Text size="xs" c="dimmed">
                                    {((ytd2026.revenue / 600000) * 100).toFixed(1)}% atingido
                                </Text>
                            </Stack>
                        </Paper>
                    </SimpleGrid>
                )}
            </Card>

            {/* Cash Flow Projection */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Group gap="xs">
                        <ThemeIcon size="lg" variant="light" color="teal">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Projeção de Fluxo de Caixa</Text>
                            <Text size="xs" c="dimmed">Próximos 3 meses</Text>
                        </div>
                    </Group>
                    <Badge color="teal" variant="light" size="lg">
                        Saldo Atual: {formatCurrency(cashFlow.currentBalance)}
                    </Badge>
                </Group>

                <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <SimpleGrid cols={3} spacing="md">
                            {['Fev', 'Mar', 'Abr'].map((month, i) => {
                                const inflow = cashFlow.projectedInflows.find((f: any) => f.month === month)?.amount || 0;
                                const outflow = cashFlow.projectedOutflows
                                    .filter((o: any) => o.month === month)
                                    .reduce((acc: number, o: any) => acc + o.amount, 0);
                                const net = inflow - outflow;
                                const isProjected = i > 0;

                                return (
                                    <Paper key={month} p="md" radius="md" withBorder>
                                        <Stack gap="sm">
                                            <Group justify="space-between">
                                                <Text fw={600}>{month}</Text>
                                                {isProjected && <Badge size="xs" variant="light">Projetado</Badge>}
                                            </Group>
                                            <div>
                                                <Group justify="space-between">
                                                    <Text size="xs" c="dimmed">Entradas</Text>
                                                    <Text size="sm" c="green" fw={500}>+{formatCurrency(inflow)}</Text>
                                                </Group>
                                                <Group justify="space-between">
                                                    <Text size="xs" c="dimmed">Saídas</Text>
                                                    <Text size="sm" c="red" fw={500}>-{formatCurrency(outflow)}</Text>
                                                </Group>
                                            </div>
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text size="xs" fw={500}>Resultado</Text>
                                                <Text size="sm" fw={700} c={net >= 0 ? 'green' : 'red'}>
                                                    {net >= 0 ? '+' : ''}{formatCurrency(net)}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </SimpleGrid>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper p="lg" radius="md" bg="teal.0" h="100%">
                            <Stack gap="md" justify="center" h="100%">
                                <Text size="sm" c="dimmed" ta="center">Saldo Projetado (Abril)</Text>
                                <Text size="xl" fw={700} ta="center" c="teal">
                                    {formatCurrency(projectedBalance)}
                                </Text>
                                <Divider />
                                <Group justify="center" gap="xs">
                                    <Badge color={projectedBalance > cashFlow.currentBalance ? 'green' : 'red'} variant="light">
                                        {projectedBalance > cashFlow.currentBalance ? '+' : ''}
                                        {formatCurrency(projectedBalance - cashFlow.currentBalance)}
                                    </Badge>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>
            </Card>

            {/* Bottom Row */}
            <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                        <Group justify="space-between">
                            <div>
                                <Text size="sm" c="dimmed">Margem de Lucro</Text>
                                <Text size="xl" fw={700} c="blue">{profitMargin.toFixed(1)}%</Text>
                            </div>
                            <RingProgress
                                size={80}
                                thickness={8}
                                roundCaps
                                sections={[{ value: profitMargin, color: 'blue' }]}
                            />
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                        <Text fw={600} mb="md">Pendências</Text>
                        <Stack gap="sm">
                            <Paper p="sm" bg="orange.0" radius="md">
                                <Group justify="space-between">
                                    <Text size="sm">Pagamentos Pendentes</Text>
                                    <Text size="sm" fw={700} c="orange">R$ {financials.pendingPayments.toLocaleString('pt-BR')}</Text>
                                </Group>
                            </Paper>
                            <Paper p="sm" bg="blue.0" radius="md">
                                <Group justify="space-between">
                                    <Text size="sm">Folha a Pagar</Text>
                                    <Text size="sm" fw={700} c="blue">R$ {financials.payrollDue.toLocaleString('pt-BR')}</Text>
                                </Group>
                            </Paper>
                        </Stack>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                        <Text fw={600} mb="md">Ações Rápidas</Text>
                        <Stack gap="xs">
                            <Link href="/owner/hiring" passHref legacyBehavior>
                                <Button component="a" fullWidth variant="filled" color="violet" leftSection={<IconBriefcase size={16} />}>
                                    Gestão de Vagas
                                </Button>
                            </Link>
                            <Link href="/owner/payroll" passHref legacyBehavior>
                                <Button component="a" fullWidth variant="light" leftSection={<IconUsers size={16} />}>
                                    Aprovar Folha
                                </Button>
                            </Link>
                            <Link href="/owner/reports" passHref legacyBehavior>
                                <Button component="a" fullWidth variant="light" leftSection={<IconChartBar size={16} />}>
                                    Ver Relatórios
                                </Button>
                            </Link>
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}

