'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Paper,
    Loader, Center, SimpleGrid, ThemeIcon, SegmentedControl,
    Table, Progress, RingProgress
} from '@mantine/core';
import {
    IconReceipt, IconTrendingUp, IconUsers, IconBook,
    IconCash, IconChartBar
} from '@tabler/icons-react';

interface RevenueBySource {
    source: string;
    amount: number;
    percentage: number;
    color: string;
}

interface RevenueSummary {
    totalRevenue: number;
    previousPeriod: number;
    growth: number;
    bySource: RevenueBySource[];
}

const sourceColors: Record<string, string> = {
    tuition: '#22c55e',
    materials: '#3b82f6',
    events: '#8b5cf6',
    other: '#6b7280',
};

export default function OwnerRevenuePage() {
    const [summary, setSummary] = useState<RevenueSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

    useEffect(() => {
        fetchRevenue();
    }, [period]);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transactions?type=inflow&period=${period}`);
            const data = await res.json();

            if (data.data) {
                const total = data.data.reduce((acc: number, t: any) => acc + Math.abs(t.amount), 0);

                // Group by category
                const byCategory: Record<string, number> = {};
                data.data.forEach((t: any) => {
                    const cat = t.category || 'other';
                    byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.amount);
                });

                const sources: RevenueBySource[] = Object.entries(byCategory).map(([source, amount]) => ({
                    source,
                    amount,
                    percentage: total > 0 ? (amount / total) * 100 : 0,
                    color: sourceColors[source] || sourceColors.other,
                })).sort((a, b) => b.amount - a.amount);

                setSummary({
                    totalRevenue: total,
                    previousPeriod: total * 0.9, // Placeholder
                    growth: 10, // Placeholder
                    bySource: sources,
                });
            } else {
                setSummary({
                    totalRevenue: 0,
                    previousPeriod: 0,
                    growth: 0,
                    bySource: [],
                });
            }
        } catch (error) {
            console.error('Failed to fetch revenue:', error);
            setSummary({
                totalRevenue: 0,
                previousPeriod: 0,
                growth: 0,
                bySource: [],
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
    };

    const sourceLabels: Record<string, string> = {
        tuition: 'Mensalidades',
        materials: 'Materiais',
        events: 'Eventos',
        other: 'Outros',
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Receitas</Title>
                    <Text c="dimmed">Análise de receitas por período</Text>
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
                    {/* Summary Cards */}
                    <SimpleGrid cols={3}>
                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Receita Total</Text>
                                    <Text size="xl" fw={700}>
                                        {formatCurrency(summary?.totalRevenue || 0)}
                                    </Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="green" radius="xl">
                                    <IconReceipt size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Período Anterior</Text>
                                    <Text size="xl" fw={700}>
                                        {formatCurrency(summary?.previousPeriod || 0)}
                                    </Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                                    <IconCash size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Crescimento</Text>
                                    <Text
                                        size="xl"
                                        fw={700}
                                        c={(summary?.growth || 0) >= 0 ? 'green' : 'red'}
                                    >
                                        {(summary?.growth || 0) >= 0 ? '+' : ''}{summary?.growth || 0}%
                                    </Text>
                                </div>
                                <ThemeIcon
                                    size={48}
                                    variant="light"
                                    color={(summary?.growth || 0) >= 0 ? 'green' : 'red'}
                                    radius="xl"
                                >
                                    <IconTrendingUp size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    </SimpleGrid>

                    {/* Revenue by Source */}
                    <SimpleGrid cols={2}>
                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Receita por Fonte</Title>
                            {summary?.bySource && summary.bySource.length > 0 ? (
                                <Stack>
                                    {summary.bySource.map((source) => (
                                        <div key={source.source}>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm">
                                                    {sourceLabels[source.source] || source.source}
                                                </Text>
                                                <Text size="sm" fw={500}>
                                                    {formatCurrency(source.amount)}
                                                </Text>
                                            </Group>
                                            <Progress
                                                value={source.percentage}
                                                color={source.color.replace('#', '')}
                                                size="lg"
                                            />
                                        </div>
                                    ))}
                                </Stack>
                            ) : (
                                <Paper withBorder p="xl" ta="center">
                                    <Text c="dimmed">Sem dados de receita para o período</Text>
                                </Paper>
                            )}
                        </Card>

                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Distribuição</Title>
                            {summary?.bySource && summary.bySource.length > 0 ? (
                                <Center>
                                    <RingProgress
                                        size={200}
                                        thickness={30}
                                        roundCaps
                                        sections={summary.bySource.map((s) => ({
                                            value: s.percentage,
                                            color: s.color,
                                            tooltip: `${sourceLabels[s.source] || s.source}: ${s.percentage.toFixed(1)}%`,
                                        }))}
                                        label={
                                            <Stack align="center" gap={0}>
                                                <Text size="xl" fw={700}>100%</Text>
                                                <Text size="xs" c="dimmed">Total</Text>
                                            </Stack>
                                        }
                                    />
                                </Center>
                            ) : (
                                <Paper withBorder p="xl" ta="center">
                                    <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                        <IconChartBar size={30} />
                                    </ThemeIcon>
                                    <Text c="dimmed">Sem dados para exibir</Text>
                                </Paper>
                            )}

                            {/* Legend */}
                            {summary?.bySource && summary.bySource.length > 0 && (
                                <Group justify="center" mt="md">
                                    {summary.bySource.map((s) => (
                                        <Group key={s.source} gap={4}>
                                            <div style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 4,
                                                background: s.color
                                            }} />
                                            <Text size="xs">{sourceLabels[s.source] || s.source}</Text>
                                        </Group>
                                    ))}
                                </Group>
                            )}
                        </Card>
                    </SimpleGrid>

                    {/* Chart Placeholder */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Tendência de Receitas</Title>
                        <Paper withBorder p="xl" ta="center" bg="gray.0">
                            <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                <IconTrendingUp size={30} />
                            </ThemeIcon>
                            <Text c="dimmed">
                                Gráfico de tendência será exibido quando conectado ao banco de dados
                            </Text>
                        </Paper>
                    </Card>
                </Stack>
            )}
        </Container>
    );
}

