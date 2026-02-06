'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    Avatar,
    Progress,
    RingProgress,
    Select,
} from '@mantine/core';
import {
    IconTrendingUp,
    IconTarget,
    IconUsers,
    IconCurrencyDollar,
    IconChartBar,
    IconTrophy,
    IconArrowUpRight,
    IconArrowDownRight,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface SalesRep {
    id: string;
    name: string;
    avatar?: string;
    leadsAssigned: number;
    leadsConverted: number;
    revenue: number;
    target: number;
    conversionRate: number;
}

// Mock data for sales performance
const mockSalesReps: SalesRep[] = [
    { id: '1', name: 'João Silva', leadsAssigned: 45, leadsConverted: 12, revenue: 36000, target: 50000, conversionRate: 26.7 },
    { id: '2', name: 'Maria Santos', leadsAssigned: 38, leadsConverted: 15, revenue: 45000, target: 50000, conversionRate: 39.5 },
    { id: '3', name: 'Pedro Costa', leadsAssigned: 52, leadsConverted: 8, revenue: 24000, target: 50000, conversionRate: 15.4 },
    { id: '4', name: 'Ana Oliveira', leadsAssigned: 30, leadsConverted: 10, revenue: 30000, target: 40000, conversionRate: 33.3 },
    { id: '5', name: 'Carlos Lima', leadsAssigned: 42, leadsConverted: 14, revenue: 42000, target: 45000, conversionRate: 33.3 },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function DesempenhoPage() {
    const [period, setPeriod] = useState<string | null>('month');
    const [salesReps] = useState<SalesRep[]>(mockSalesReps);

    const totalRevenue = salesReps.reduce((acc, s) => acc + s.revenue, 0);
    const totalTarget = salesReps.reduce((acc, s) => acc + s.target, 0);
    const totalConverted = salesReps.reduce((acc, s) => acc + s.leadsConverted, 0);
    const totalLeads = salesReps.reduce((acc, s) => acc + s.leadsAssigned, 0);
    const overallConversion = totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0;
    const targetProgress = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

    const topPerformer = salesReps.sort((a, b) => b.revenue - a.revenue)[0];

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Comercial</Text>
                    <Title order={2}>Desempenho da Equipe</Title>
                </div>
                <Select
                    value={period}
                    onChange={setPeriod}
                    data={[
                        { value: 'week', label: 'Esta Semana' },
                        { value: 'month', label: 'Este Mês' },
                        { value: 'quarter', label: 'Este Trimestre' },
                        { value: 'year', label: 'Este Ano' },
                    ]}
                    w={150}
                />
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCurrencyDollar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Receita Total</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalRevenue)}</Text>
                        </div>
                    </Group>
                    <Group gap={4} mt="sm">
                        <IconArrowUpRight size={14} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="green">+12.5% vs período anterior</Text>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconTarget size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Progresso da Meta</Text>
                            <Text fw={700} size="xl">{targetProgress.toFixed(0)}%</Text>
                        </div>
                    </Group>
                    <Progress value={targetProgress} mt="sm" size="sm" color={targetProgress >= 100 ? 'green' : 'blue'} />
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Taxa de Conversão</Text>
                            <Text fw={700} size="xl">{overallConversion.toFixed(1)}%</Text>
                        </div>
                    </Group>
                    <Group gap={4} mt="sm">
                        <IconArrowUpRight size={14} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="green">+3.2% vs período anterior</Text>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="yellow" size="lg" radius="md">
                            <IconTrophy size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Top Vendedor</Text>
                            <Text fw={700} size="xl">{topPerformer?.name.split(' ')[0]}</Text>
                        </div>
                    </Group>
                    <Text size="xs" c="dimmed" mt="sm">
                        {formatCurrency(topPerformer?.revenue || 0)} em vendas
                    </Text>
                </Card>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} mb="xl">
                <Card withBorder>
                    <Title order={4} mb="md">Meta vs Realizado</Title>
                    <Group justify="center">
                        <RingProgress
                            size={180}
                            thickness={20}
                            roundCaps
                            sections={[
                                { value: targetProgress, color: targetProgress >= 100 ? 'green' : 'blue' },
                            ]}
                            label={
                                <Text ta="center" fw={700} size="xl">
                                    {targetProgress.toFixed(0)}%
                                </Text>
                            }
                        />
                    </Group>
                    <Group justify="center" mt="md" gap="xl">
                        <div>
                            <Text size="xs" c="dimmed">Meta</Text>
                            <Text fw={600}>{formatCurrency(totalTarget)}</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">Realizado</Text>
                            <Text fw={600} c="green">{formatCurrency(totalRevenue)}</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">Faltam</Text>
                            <Text fw={600} c={totalTarget - totalRevenue > 0 ? 'red' : 'green'}>
                                {formatCurrency(Math.max(0, totalTarget - totalRevenue))}
                            </Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Title order={4} mb="md">Conversões por Vendedor</Title>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {salesReps.slice(0, 5).map((rep) => (
                            <div key={rep.id}>
                                <Group justify="space-between" mb={4}>
                                    <Group gap="xs">
                                        <Avatar size="sm" radius="xl" color="blue">
                                            {rep.name.charAt(0)}
                                        </Avatar>
                                        <Text size="sm">{rep.name}</Text>
                                    </Group>
                                    <Text size="sm" fw={500}>{rep.leadsConverted} / {rep.leadsAssigned}</Text>
                                </Group>
                                <Progress
                                    value={rep.conversionRate}
                                    size="sm"
                                    color={rep.conversionRate > 30 ? 'green' : rep.conversionRate > 20 ? 'yellow' : 'red'}
                                />
                            </div>
                        ))}
                    </div>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Ranking de Vendedores</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>#</Table.Th>
                            <Table.Th>Vendedor</Table.Th>
                            <Table.Th>Leads</Table.Th>
                            <Table.Th>Conversões</Table.Th>
                            <Table.Th>Taxa</Table.Th>
                            <Table.Th>Receita</Table.Th>
                            <Table.Th>Meta</Table.Th>
                            <Table.Th>Progresso</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {salesReps
                            .sort((a, b) => b.revenue - a.revenue)
                            .map((rep, index) => {
                                const progress = (rep.revenue / rep.target) * 100;
                                return (
                                    <Table.Tr key={rep.id}>
                                        <Table.Td>
                                            {index === 0 ? (
                                                <ThemeIcon color="yellow" size="sm" radius="xl">
                                                    <IconTrophy size={12} />
                                                </ThemeIcon>
                                            ) : (
                                                <Text fw={500}>{index + 1}</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size="sm" radius="xl" color="blue">
                                                    {rep.name.charAt(0)}
                                                </Avatar>
                                                <Text size="sm" fw={500}>{rep.name}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>{rep.leadsAssigned}</Table.Td>
                                        <Table.Td>{rep.leadsConverted}</Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={rep.conversionRate > 30 ? 'green' : rep.conversionRate > 20 ? 'yellow' : 'red'}
                                                variant="light"
                                            >
                                                {rep.conversionRate.toFixed(1)}%
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text fw={600}>{formatCurrency(rep.revenue)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text c="dimmed">{formatCurrency(rep.target)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Progress
                                                    value={progress}
                                                    size="sm"
                                                    w={80}
                                                    color={progress >= 100 ? 'green' : progress >= 70 ? 'yellow' : 'red'}
                                                />
                                                <Text size="sm">{progress.toFixed(0)}%</Text>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

