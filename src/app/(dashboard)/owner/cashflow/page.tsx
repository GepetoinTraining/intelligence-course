'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Paper,
    Loader, Center, SimpleGrid, ThemeIcon, SegmentedControl,
    Table, Progress
} from '@mantine/core';
import {
    IconCash, IconArrowUpRight, IconArrowDownRight, IconWallet,
    IconCalendar, IconTrendingUp, IconTrendingDown
} from '@tabler/icons-react';

interface CashFlowItem {
    id: string;
    date: string;
    description: string;
    category: 'tuition' | 'materials' | 'salaries' | 'rent' | 'utilities' | 'other';
    type: 'inflow' | 'outflow';
    amount: number;
    status: 'pending' | 'completed';
}

interface CashFlowSummary {
    totalInflow: number;
    totalOutflow: number;
    netFlow: number;
    pendingInflow: number;
    pendingOutflow: number;
}

const categoryConfig = {
    tuition: { label: 'Mensalidades', color: 'green' },
    materials: { label: 'Materiais', color: 'blue' },
    salaries: { label: 'Salários', color: 'red' },
    rent: { label: 'Aluguel', color: 'orange' },
    utilities: { label: 'Utilidades', color: 'yellow' },
    other: { label: 'Outros', color: 'gray' },
};

export default function OwnerCashFlowPage() {
    const [transactions, setTransactions] = useState<CashFlowItem[]>([]);
    const [summary, setSummary] = useState<CashFlowSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

    useEffect(() => {
        fetchCashFlow();
    }, [period]);

    const fetchCashFlow = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transactions?period=${period}`);
            const data = await res.json();
            if (data.data) {
                const items = data.data.map((t: any) => ({
                    id: t.id,
                    date: new Date(t.createdAt * 1000).toLocaleDateString('pt-BR'),
                    description: t.description || 'Transação',
                    category: t.category || 'other',
                    type: t.amount > 0 ? 'inflow' : 'outflow',
                    amount: Math.abs(t.amount),
                    status: t.status || 'completed',
                }));
                setTransactions(items);

                // Calculate summary
                const inflows = items.filter((t: CashFlowItem) => t.type === 'inflow');
                const outflows = items.filter((t: CashFlowItem) => t.type === 'outflow');
                setSummary({
                    totalInflow: inflows.reduce((acc: number, t: CashFlowItem) => acc + t.amount, 0),
                    totalOutflow: outflows.reduce((acc: number, t: CashFlowItem) => acc + t.amount, 0),
                    netFlow: inflows.reduce((acc: number, t: CashFlowItem) => acc + t.amount, 0) -
                        outflows.reduce((acc: number, t: CashFlowItem) => acc + t.amount, 0),
                    pendingInflow: inflows.filter((t: CashFlowItem) => t.status === 'pending').reduce((acc: number, t: CashFlowItem) => acc + t.amount, 0),
                    pendingOutflow: outflows.filter((t: CashFlowItem) => t.status === 'pending').reduce((acc: number, t: CashFlowItem) => acc + t.amount, 0),
                });
            }
        } catch (error) {
            console.error('Failed to fetch cash flow:', error);
            setSummary({
                totalInflow: 0,
                totalOutflow: 0,
                netFlow: 0,
                pendingInflow: 0,
                pendingOutflow: 0,
            });
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
                    <Title order={2}>Fluxo de Caixa</Title>
                    <Text c="dimmed">Acompanhe entradas e saídas</Text>
                </div>
                <SegmentedControl
                    value={period}
                    onChange={(v) => setPeriod(v as typeof period)}
                    data={[
                        { label: 'Semana', value: 'week' },
                        { label: 'Mês', value: 'month' },
                        { label: 'Trimestre', value: 'quarter' },
                    ]}
                />
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : (
                <Stack>
                    {/* Summary Cards */}
                    <SimpleGrid cols={4}>
                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Entradas</Text>
                                    <Text size="xl" fw={700} c="green">
                                        {formatCurrency(summary?.totalInflow || 0)}
                                    </Text>
                                    {summary?.pendingInflow ? (
                                        <Text size="xs" c="dimmed">
                                            {formatCurrency(summary.pendingInflow)} pendente
                                        </Text>
                                    ) : null}
                                </div>
                                <ThemeIcon size={48} variant="light" color="green" radius="xl">
                                    <IconArrowUpRight size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Saídas</Text>
                                    <Text size="xl" fw={700} c="red">
                                        {formatCurrency(summary?.totalOutflow || 0)}
                                    </Text>
                                    {summary?.pendingOutflow ? (
                                        <Text size="xs" c="dimmed">
                                            {formatCurrency(summary.pendingOutflow)} pendente
                                        </Text>
                                    ) : null}
                                </div>
                                <ThemeIcon size={48} variant="light" color="red" radius="xl">
                                    <IconArrowDownRight size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Saldo Líquido</Text>
                                    <Text
                                        size="xl"
                                        fw={700}
                                        c={(summary?.netFlow || 0) >= 0 ? 'green' : 'red'}
                                    >
                                        {formatCurrency(summary?.netFlow || 0)}
                                    </Text>
                                </div>
                                <ThemeIcon
                                    size={48}
                                    variant="light"
                                    color={(summary?.netFlow || 0) >= 0 ? 'green' : 'red'}
                                    radius="xl"
                                >
                                    {(summary?.netFlow || 0) >= 0 ? <IconTrendingUp size={24} /> : <IconTrendingDown size={24} />}
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Transações</Text>
                                    <Text size="xl" fw={700}>{transactions.length}</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                                    <IconWallet size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    </SimpleGrid>

                    {/* Chart Placeholder */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Fluxo por Período</Title>
                        <Paper withBorder p="xl" ta="center" bg="gray.0">
                            <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                <IconCash size={30} />
                            </ThemeIcon>
                            <Text c="dimmed">
                                Gráfico de fluxo de caixa será exibido aqui quando conectado ao banco de dados
                            </Text>
                        </Paper>
                    </Card>

                    {/* Transactions Table */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Transações Recentes</Title>
                        {transactions.length === 0 ? (
                            <Paper withBorder p="xl" ta="center">
                                <Text c="dimmed">Nenhuma transação encontrada no período</Text>
                            </Paper>
                        ) : (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Data</Table.Th>
                                        <Table.Th>Descrição</Table.Th>
                                        <Table.Th>Categoria</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th ta="right">Valor</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {transactions.slice(0, 10).map((t) => {
                                        const catConfig = categoryConfig[t.category];
                                        return (
                                            <Table.Tr key={t.id}>
                                                <Table.Td>{t.date}</Table.Td>
                                                <Table.Td>{t.description}</Table.Td>
                                                <Table.Td>
                                                    <Badge color={catConfig.color} variant="light">
                                                        {catConfig.label}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color={t.status === 'completed' ? 'green' : 'yellow'}
                                                        variant="light"
                                                    >
                                                        {t.status === 'completed' ? 'Concluído' : 'Pendente'}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Text
                                                        fw={500}
                                                        c={t.type === 'inflow' ? 'green' : 'red'}
                                                    >
                                                        {t.type === 'inflow' ? '+' : '-'}{formatCurrency(t.amount)}
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        )}
                    </Card>
                </Stack>
            )}
        </Container>
    );
}

