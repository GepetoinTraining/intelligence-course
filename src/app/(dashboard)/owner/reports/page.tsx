'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Tabs, Grid, Select, Progress, Table,
    RingProgress, Divider, Avatar, Loader, Center
} from '@mantine/core';
import {
    IconChevronLeft, IconChartBar, IconCurrencyDollar,
    IconTrendingUp, IconUsers, IconCalendar, IconSchool, IconClock,
    IconArrowUpRight, IconArrowDownRight, IconReportMoney, IconFileSpreadsheet
} from '@tabler/icons-react';
import Link from 'next/link';
import { ExportButton } from '@/components/shared';
import type { RevenueByCourse, PaymentMethodSummary, Defaulter, TeacherRef, CostBreakdown, BalanceteItem, DREItem, BalancoPatrimonial } from '@/types/domain';

const MONTHS = [
    { value: '2026-02', label: 'Fevereiro 2026' },
    { value: '2026-01', label: 'Janeiro 2026' },
    { value: '2025-12', label: 'Dezembro 2025' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function FinancialReportsPage() {
    const [selectedMonth, setSelectedMonth] = useState<string | null>('2026-02');
    const [activeTab, setActiveTab] = useState<string | null>('revenue');
    const [loading, setLoading] = useState(true);

    // --- DATA STATE (populated from API) ---
    const [revenueByCourse, setRevenueByCourse] = useState<RevenueByCourse[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([]);
    const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
    const [teachers, setTeachers] = useState<TeacherRef[]>([]);
    const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({
        salaries: 0, bonuses: 0, benefits: 0, training: 0, total: 1, asPercentOfRevenue: 0,
    });
    const [balancete, setBalancete] = useState<BalanceteItem[]>([]);
    const [dre, setDre] = useState<DREItem[]>([]);
    const [balanco, setBalanco] = useState<BalancoPatrimonial>({
        ativo: { circulante: [], naoCirculante: [] },
        passivo: { circulante: [], naoCirculante: [] },
        patrimonioLiquido: [],
    });

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        if (!selectedMonth) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/financial?period=${selectedMonth}&section=all`);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            const d = json.data || {};

            if (d.revenueByCourse) setRevenueByCourse(d.revenueByCourse);
            if (d.paymentMethods) setPaymentMethods(d.paymentMethods);
            if (d.defaulters) setDefaulters(d.defaulters);
            if (d.teachers) setTeachers(d.teachers);
            if (d.costBreakdown) setCostBreakdown(d.costBreakdown);
            if (d.balancete) setBalancete(d.balancete);
            if (d.dre) setDre(d.dre);
            if (d.balanco) setBalanco(d.balanco);
        } catch (err) {
            console.error('Error loading financial reports:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- COMPUTED VALUES ---
    const totalRevenue = revenueByCourse.reduce((acc, c) => acc + c.revenue, 0);
    const totalDefaulted = defaulters.reduce((acc, d) => acc + d.amount, 0);
    const totalTeacherCost = teachers.reduce((acc, t) => acc + t.totalCost, 0);
    const totalRevenueFromTeachers = teachers.reduce((acc, t) => acc + t.revenueGenerated, 0);
    const avgEfficiency = teachers.length > 0
        ? teachers.reduce((acc, t) => acc + t.efficiency, 0) / teachers.length
        : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/owner" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Relatórios Financeiros 📊</Title>
                        <Text c="dimmed">Análise detalhada de receitas e despesas</Text>
                    </div>
                </Group>
                <Group>
                    <Select
                        placeholder="Período"
                        data={MONTHS}
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        w={180}
                    />
                    <ExportButton
                        data={activeTab === 'teachers'
                            ? teachers.map(t => ({
                                name: t.name,
                                salary: formatCurrency(t.salary),
                                bonus: formatCurrency(t.bonus),
                                totalCost: formatCurrency(t.totalCost),
                                classes: t.classes,
                                students: t.students,
                                hoursPerWeek: t.hoursPerWeek,
                                revenueGenerated: formatCurrency(t.revenueGenerated),
                                efficiency: `${t.efficiency.toFixed(2)}x`,
                                costPerStudent: formatCurrency(t.costPerStudent),
                                trend: `${t.trend > 0 ? '+' : ''}${t.trend}%`,
                            }))
                            : activeTab === 'defaulters'
                                ? defaulters.map(d => ({
                                    name: d.name,
                                    daysPast: d.daysPast,
                                    amount: formatCurrency(d.amount),
                                }))
                                : activeTab === 'payments'
                                    ? paymentMethods.map(p => ({
                                        method: p.method,
                                        amount: formatCurrency(p.amount),
                                        count: p.count,
                                        percentage: `${p.percentage}%`,
                                    }))
                                    : revenueByCourse.map(c => ({
                                        name: c.name,
                                        revenue: formatCurrency(c.revenue),
                                        students: c.students,
                                        percentage: `${c.percentage}%`,
                                    }))
                        }
                        columns={
                            activeTab === 'teachers'
                                ? [
                                    { key: 'name', label: 'Professor' },
                                    { key: 'salary', label: 'Salário' },
                                    { key: 'bonus', label: 'Bônus' },
                                    { key: 'totalCost', label: 'Custo Total' },
                                    { key: 'classes', label: 'Turmas' },
                                    { key: 'students', label: 'Alunos' },
                                    { key: 'hoursPerWeek', label: 'Horas/Sem' },
                                    { key: 'revenueGenerated', label: 'Receita Gerada' },
                                    { key: 'efficiency', label: 'Eficiência' },
                                    { key: 'costPerStudent', label: 'Custo/Aluno' },
                                    { key: 'trend', label: 'Tendência' },
                                ]
                                : activeTab === 'defaulters'
                                    ? [
                                        { key: 'name', label: 'Responsável' },
                                        { key: 'daysPast', label: 'Dias em Atraso' },
                                        { key: 'amount', label: 'Valor' },
                                    ]
                                    : activeTab === 'payments'
                                        ? [
                                            { key: 'method', label: 'Forma' },
                                            { key: 'amount', label: 'Valor' },
                                            { key: 'count', label: 'Transações' },
                                            { key: 'percentage', label: 'Porcentagem' },
                                        ]
                                        : [
                                            { key: 'name', label: 'Curso' },
                                            { key: 'revenue', label: 'Receita' },
                                            { key: 'students', label: 'Alunos' },
                                            { key: 'percentage', label: 'Porcentagem' },
                                        ]
                        }
                        title={`Relatório Financeiro - ${MONTHS.find(m => m.value === selectedMonth)?.label || selectedMonth}`}
                        filename={`relatorio_${activeTab || 'geral'}_${selectedMonth}`}
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar PDF"
                    />
                </Group>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="revenue" leftSection={<IconCurrencyDollar size={14} />}>
                        Receita
                    </Tabs.Tab>
                    <Tabs.Tab value="payments" leftSection={<IconChartBar size={14} />}>
                        Formas de Pagamento
                    </Tabs.Tab>
                    <Tabs.Tab value="defaulters" leftSection={<IconUsers size={14} />}>
                        Inadimplência
                    </Tabs.Tab>
                    <Tabs.Tab value="teachers" leftSection={<IconSchool size={14} />}>
                        Análise de Professores
                    </Tabs.Tab>
                    <Tabs.Tab value="accounting" leftSection={<IconFileSpreadsheet size={14} />}>
                        Contábil
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {loading ? (
                <Center py="xl">
                    <Stack align="center" gap="md">
                        <Loader size="lg" />
                        <Text c="dimmed" size="sm">Carregando relatórios...</Text>
                    </Stack>
                </Center>
            ) : (
                <>
                    {activeTab === 'revenue' && (
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 8 }}>
                                <Card shadow="sm" radius="md" p="lg" withBorder>
                                    <Text fw={600} mb="lg">Receita por Tipo de Curso</Text>
                                    {revenueByCourse.length === 0 ? (
                                        <Text c="dimmed" ta="center" py="xl">Nenhum dado de receita para este período</Text>
                                    ) : (
                                        <Stack gap="md">
                                            {revenueByCourse.map((course, i) => (
                                                <div key={i}>
                                                    <Group justify="space-between" mb={4}>
                                                        <Text size="sm" fw={500}>{course.name}</Text>
                                                        <Group gap="lg">
                                                            <Badge variant="light">{course.students} alunos</Badge>
                                                            <Text size="sm" fw={600}>R$ {course.revenue.toLocaleString('pt-BR')}</Text>
                                                        </Group>
                                                    </Group>
                                                    <Progress value={course.percentage} size="lg" radius="xl" color={['blue', 'green', 'violet', 'orange'][i % 4]} />
                                                </div>
                                            ))}
                                        </Stack>
                                    )}
                                </Card>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                                    <Text fw={600} mb="lg">Resumo</Text>
                                    <Stack gap="md">
                                        <Paper p="md" bg="green.0" radius="md">
                                            <Text size="sm" c="dimmed">Total do Período</Text>
                                            <Text size="xl" fw={700} c="green">R$ {totalRevenue.toLocaleString('pt-BR')}</Text>
                                        </Paper>
                                        <Paper p="md" bg="blue.0" radius="md">
                                            <Text size="sm" c="dimmed">Ticket Médio</Text>
                                            <Text size="xl" fw={700} c="blue">R$ {(revenueByCourse.length > 0 ? totalRevenue / revenueByCourse.reduce((a, c) => a + c.students, 0) || 0 : 0).toFixed(2)}</Text>
                                        </Paper>
                                    </Stack>
                                </Card>
                            </Grid.Col>
                        </Grid>
                    )}

                    {activeTab === 'payments' && (
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Text fw={600} mb="lg">Distribuição por Forma de Pagamento</Text>
                            {paymentMethods.length === 0 ? (
                                <Text c="dimmed" ta="center" py="xl">Nenhum dado de pagamento para este período</Text>
                            ) : (
                                <Stack gap="md">
                                    {paymentMethods.map((method, i) => (
                                        <Paper key={i} p="md" withBorder radius="md">
                                            <Group justify="space-between" mb="xs">
                                                <Text fw={500}>{method.method}</Text>
                                                <Badge variant="light">{method.percentage}%</Badge>
                                            </Group>
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">{method.count} transações</Text>
                                                <Text fw={600}>R$ {method.amount.toLocaleString('pt-BR')}</Text>
                                            </Group>
                                            <Progress value={method.percentage} size="sm" radius="xl" mt="xs" />
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Card>
                    )}

                    {activeTab === 'defaulters' && (
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 8 }}>
                                <Card shadow="sm" radius="md" p="lg" withBorder>
                                    <Text fw={600} mb="lg">Lista de Inadimplentes</Text>
                                    {defaulters.length === 0 ? (
                                        <Text c="dimmed" ta="center" py="xl">🎉 Nenhum inadimplente encontrado!</Text>
                                    ) : (
                                        <Table striped highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Responsável</Table.Th>
                                                    <Table.Th ta="center">Dias em Atraso</Table.Th>
                                                    <Table.Th ta="right">Valor</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {defaulters.map((d, i) => (
                                                    <Table.Tr key={i}>
                                                        <Table.Td>{d.name}</Table.Td>
                                                        <Table.Td ta="center">
                                                            <Badge color={d.daysPast > 30 ? 'red' : d.daysPast > 14 ? 'orange' : 'yellow'} variant="light">
                                                                {d.daysPast} dias
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td ta="right">
                                                            <Text fw={600}>R$ {d.amount.toLocaleString('pt-BR')}</Text>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    )}
                                </Card>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Card shadow="sm" radius="md" p="lg" withBorder bg="red.0">
                                    <ThemeIcon size={48} variant="light" color="red" mb="md">
                                        <IconTrendingUp size={24} />
                                    </ThemeIcon>
                                    <Text size="sm" c="dimmed">Total Inadimplente</Text>
                                    <Text size="xl" fw={700} c="red">R$ {totalDefaulted.toLocaleString('pt-BR')}</Text>
                                    <Text size="sm" c="dimmed" mt="xs">{defaulters.length} responsáveis</Text>
                                </Card>
                            </Grid.Col>
                        </Grid>
                    )}

                    {activeTab === 'teachers' && (
                        <Stack gap="md">
                            {/* KPI Cards */}
                            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                                <Paper shadow="sm" radius="md" p="lg" withBorder>
                                    <Group justify="space-between" mb="xs">
                                        <ThemeIcon size={40} variant="light" color="violet">
                                            <IconUsers size={24} />
                                        </ThemeIcon>
                                    </Group>
                                    <Text size="xs" c="dimmed">Total de Professores</Text>
                                    <Text size="xl" fw={700}>{teachers.length}</Text>
                                </Paper>

                                <Paper shadow="sm" radius="md" p="lg" withBorder>
                                    <Group justify="space-between" mb="xs">
                                        <ThemeIcon size={40} variant="light" color="red">
                                            <IconCurrencyDollar size={24} />
                                        </ThemeIcon>
                                    </Group>
                                    <Text size="xs" c="dimmed">Custo Total Mensal</Text>
                                    <Text size="xl" fw={700}>{formatCurrency(totalTeacherCost)}</Text>
                                </Paper>

                                <Paper shadow="sm" radius="md" p="lg" withBorder>
                                    <Group justify="space-between" mb="xs">
                                        <ThemeIcon size={40} variant="light" color="green">
                                            <IconReportMoney size={24} />
                                        </ThemeIcon>
                                    </Group>
                                    <Text size="xs" c="dimmed">Receita Gerada</Text>
                                    <Text size="xl" fw={700} c="green">{formatCurrency(totalRevenueFromTeachers)}</Text>
                                </Paper>

                                <Paper shadow="sm" radius="md" p="lg" withBorder>
                                    <Group justify="space-between" mb="xs">
                                        <ThemeIcon size={40} variant="light" color="blue">
                                            <IconTrendingUp size={24} />
                                        </ThemeIcon>
                                    </Group>
                                    <Text size="xs" c="dimmed">Eficiência Média</Text>
                                    <Text size="xl" fw={700} c="blue">{avgEfficiency.toFixed(2)}x</Text>
                                </Paper>
                            </SimpleGrid>

                            {/* Cost Breakdown */}
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                                        <Text fw={600} mb="md">Composição de Custos</Text>
                                        <Stack gap="sm">
                                            <Group justify="space-between">
                                                <Text size="sm">Salários Base</Text>
                                                <Text size="sm" fw={500}>{formatCurrency(costBreakdown.salaries)}</Text>
                                            </Group>
                                            <Progress value={(costBreakdown.salaries / (costBreakdown.total || 1)) * 100} size="sm" color="blue" />

                                            <Group justify="space-between">
                                                <Text size="sm">Bônus</Text>
                                                <Text size="sm" fw={500}>{formatCurrency(costBreakdown.bonuses)}</Text>
                                            </Group>
                                            <Progress value={(costBreakdown.bonuses / (costBreakdown.total || 1)) * 100} size="sm" color="green" />

                                            <Group justify="space-between">
                                                <Text size="sm">Benefícios</Text>
                                                <Text size="sm" fw={500}>{formatCurrency(costBreakdown.benefits)}</Text>
                                            </Group>
                                            <Progress value={(costBreakdown.benefits / (costBreakdown.total || 1)) * 100} size="sm" color="violet" />

                                            <Group justify="space-between">
                                                <Text size="sm">Treinamento</Text>
                                                <Text size="sm" fw={500}>{formatCurrency(costBreakdown.training)}</Text>
                                            </Group>
                                            <Progress value={(costBreakdown.training / (costBreakdown.total || 1)) * 100} size="sm" color="orange" />

                                            <Divider my="xs" />

                                            <Paper p="sm" bg="gray.0" radius="md">
                                                <Group justify="space-between">
                                                    <Text size="sm" fw={600}>Total</Text>
                                                    <Text size="sm" fw={700}>{formatCurrency(costBreakdown.total)}</Text>
                                                </Group>
                                                <Text size="xs" c="dimmed" mt={4}>
                                                    {costBreakdown.asPercentOfRevenue}% da receita
                                                </Text>
                                            </Paper>
                                        </Stack>
                                    </Card>
                                </Grid.Col>

                                <Grid.Col span={{ base: 12, md: 8 }}>
                                    <Card shadow="sm" radius="md" p="lg" withBorder>
                                        <Text fw={600} mb="md">Análise por Professor</Text>
                                        {teachers.length === 0 ? (
                                            <Text c="dimmed" ta="center" py="xl">Nenhum professor encontrado</Text>
                                        ) : (
                                            <Table striped highlightOnHover>
                                                <Table.Thead>
                                                    <Table.Tr>
                                                        <Table.Th>Professor</Table.Th>
                                                        <Table.Th ta="center">Turmas</Table.Th>
                                                        <Table.Th ta="center">Alunos</Table.Th>
                                                        <Table.Th ta="right">Custo</Table.Th>
                                                        <Table.Th ta="right">Receita</Table.Th>
                                                        <Table.Th ta="center">Eficiência</Table.Th>
                                                        <Table.Th ta="center">Tendência</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {teachers.map((teacher) => (
                                                        <Table.Tr key={teacher.id}>
                                                            <Table.Td>
                                                                <Group gap="sm">
                                                                    <Avatar size="sm" color="violet" radius="xl">
                                                                        {teacher.name.split(' ').map((n: string) => n[0]).join('')}
                                                                    </Avatar>
                                                                    <Text size="sm" fw={500}>{teacher.name}</Text>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td ta="center">
                                                                <Badge variant="light">{teacher.classes}</Badge>
                                                            </Table.Td>
                                                            <Table.Td ta="center">
                                                                <Text size="sm">{teacher.students}</Text>
                                                            </Table.Td>
                                                            <Table.Td ta="right">
                                                                <Stack gap={0}>
                                                                    <Text size="sm" fw={500}>{formatCurrency(teacher.totalCost)}</Text>
                                                                    <Text size="xs" c="dimmed">{formatCurrency(teacher.costPerStudent)}/aluno</Text>
                                                                </Stack>
                                                            </Table.Td>
                                                            <Table.Td ta="right">
                                                                <Text size="sm" fw={500} c="green">{formatCurrency(teacher.revenueGenerated)}</Text>
                                                            </Table.Td>
                                                            <Table.Td ta="center">
                                                                <Badge
                                                                    color={teacher.efficiency >= 2.5 ? 'green' : teacher.efficiency >= 2 ? 'yellow' : 'red'}
                                                                    variant="filled"
                                                                >
                                                                    {teacher.efficiency.toFixed(2)}x
                                                                </Badge>
                                                            </Table.Td>
                                                            <Table.Td ta="center">
                                                                <Badge
                                                                    color={teacher.trend > 0 ? 'green' : 'red'}
                                                                    variant="light"
                                                                    leftSection={teacher.trend > 0 ? <IconArrowUpRight size={10} /> : <IconArrowDownRight size={10} />}
                                                                >
                                                                    {teacher.trend > 0 ? '+' : ''}{teacher.trend}%
                                                                </Badge>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))}
                                                </Table.Tbody>
                                            </Table>
                                        )}
                                    </Card>
                                </Grid.Col>
                            </Grid>

                            {/* Efficiency Comparison */}
                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <Text fw={600} mb="md">Comparativo de Eficiência (Receita/Custo)</Text>
                                {teachers.length === 0 ? (
                                    <Text c="dimmed" ta="center" py="xl">Nenhum dados para exibir</Text>
                                ) : (
                                    <Stack gap="md">
                                        {[...teachers].sort((a, b) => b.efficiency - a.efficiency).map((teacher, i) => (
                                            <div key={teacher.id}>
                                                <Group justify="space-between" mb={4}>
                                                    <Group gap="sm">
                                                        <Badge color={['gold', 'gray', 'orange', 'blue'][i] || 'gray'} variant="filled" size="sm">
                                                            #{i + 1}
                                                        </Badge>
                                                        <Text size="sm" fw={500}>{teacher.name}</Text>
                                                    </Group>
                                                    <Group gap="lg">
                                                        <Text size="xs" c="dimmed">{teacher.hoursPerWeek}h/semana</Text>
                                                        <Text size="sm" fw={600}>{teacher.efficiency.toFixed(2)}x</Text>
                                                    </Group>
                                                </Group>
                                                <Progress
                                                    value={(teacher.efficiency / 3) * 100}
                                                    size="lg"
                                                    radius="xl"
                                                    color={teacher.efficiency >= 2.5 ? 'green' : teacher.efficiency >= 2 ? 'yellow' : 'red'}
                                                />
                                            </div>
                                        ))}
                                    </Stack>
                                )}
                                <Paper p="sm" bg="blue.0" radius="md" mt="md">
                                    <Group justify="space-between">
                                        <Text size="sm">Meta de Eficiência</Text>
                                        <Text size="sm" fw={700} c="blue">2.5x ou mais</Text>
                                    </Group>
                                    <Text size="xs" c="dimmed" mt={4}>
                                        {teachers.filter(t => t.efficiency >= 2.5).length} de {teachers.length} professores atingem a meta
                                    </Text>
                                </Paper>
                            </Card>
                        </Stack>
                    )}

                    {activeTab === 'accounting' && (
                        <Stack gap="lg">
                            {/* DRE - Income Statement */}
                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600}>DRE - Demonstração do Resultado do Exercício</Text>
                                    <Badge variant="light" color="blue">
                                        {MONTHS.find(m => m.value === selectedMonth)?.label}
                                    </Badge>
                                </Group>
                                {dre.length === 0 ? (
                                    <Text c="dimmed" ta="center" py="xl">Nenhum lançamento contábil para este período</Text>
                                ) : (
                                    <Table>
                                        <Table.Tbody>
                                            {dre.map((item, i) => (
                                                <Table.Tr
                                                    key={i}
                                                    bg={item.type === 'header' || item.type === 'total' ? 'blue.0' : item.type === 'subtotal' ? 'gray.0' : undefined}
                                                >
                                                    <Table.Td
                                                        fw={item.type === 'header' || item.type === 'subtotal' || item.type === 'total' ? 600 : 400}
                                                        pl={item.indent ? 32 : undefined}
                                                    >
                                                        {item.name}
                                                    </Table.Td>
                                                    <Table.Td
                                                        ta="right"
                                                        fw={item.type === 'total' ? 700 : item.type === 'subtotal' ? 600 : 400}
                                                        c={item.value < 0 ? 'red' : item.type === 'total' ? 'green' : undefined}
                                                    >
                                                        {formatCurrency(item.value)}
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                )}
                            </Card>

                            {/* Balanço Patrimonial */}
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                                        <Text fw={600} mb="md">ATIVO</Text>

                                        <Text size="sm" fw={500} c="dimmed" mb="xs">Ativo Circulante</Text>
                                        <Stack gap="xs" mb="md">
                                            {balanco.ativo.circulante.map((item, i) => (
                                                <Group key={i} justify="space-between">
                                                    <Text size="sm" pl="md">{item.name}</Text>
                                                    <Text size="sm">{formatCurrency(item.value)}</Text>
                                                </Group>
                                            ))}
                                            {balanco.ativo.circulante.length === 0 && (
                                                <Text size="sm" c="dimmed" pl="md">Nenhum dado</Text>
                                            )}
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text size="sm" fw={500}>Subtotal Circulante</Text>
                                                <Text size="sm" fw={500}>
                                                    {formatCurrency(balanco.ativo.circulante.reduce((a, b) => a + b.value, 0))}
                                                </Text>
                                            </Group>
                                        </Stack>

                                        <Text size="sm" fw={500} c="dimmed" mb="xs">Ativo Não Circulante</Text>
                                        <Stack gap="xs" mb="md">
                                            {balanco.ativo.naoCirculante.map((item, i) => (
                                                <Group key={i} justify="space-between">
                                                    <Text size="sm" pl="md">{item.name}</Text>
                                                    <Text size="sm">{formatCurrency(item.value)}</Text>
                                                </Group>
                                            ))}
                                            {balanco.ativo.naoCirculante.length === 0 && (
                                                <Text size="sm" c="dimmed" pl="md">Nenhum dado</Text>
                                            )}
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text size="sm" fw={500}>Subtotal Não Circulante</Text>
                                                <Text size="sm" fw={500}>
                                                    {formatCurrency(balanco.ativo.naoCirculante.reduce((a, b) => a + b.value, 0))}
                                                </Text>
                                            </Group>
                                        </Stack>

                                        <Paper p="sm" bg="green.0" radius="md">
                                            <Group justify="space-between">
                                                <Text fw={600}>TOTAL DO ATIVO</Text>
                                                <Text fw={700} c="green">
                                                    {formatCurrency(
                                                        balanco.ativo.circulante.reduce((a, b) => a + b.value, 0) +
                                                        balanco.ativo.naoCirculante.reduce((a, b) => a + b.value, 0)
                                                    )}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    </Card>
                                </Grid.Col>

                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                                        <Text fw={600} mb="md">PASSIVO + PATRIMÔNIO LÍQUIDO</Text>

                                        <Text size="sm" fw={500} c="dimmed" mb="xs">Passivo Circulante</Text>
                                        <Stack gap="xs" mb="md">
                                            {balanco.passivo.circulante.map((item, i) => (
                                                <Group key={i} justify="space-between">
                                                    <Text size="sm" pl="md">{item.name}</Text>
                                                    <Text size="sm">{formatCurrency(item.value)}</Text>
                                                </Group>
                                            ))}
                                            {balanco.passivo.circulante.length === 0 && (
                                                <Text size="sm" c="dimmed" pl="md">Nenhum dado</Text>
                                            )}
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text size="sm" fw={500}>Subtotal Circulante</Text>
                                                <Text size="sm" fw={500}>
                                                    {formatCurrency(balanco.passivo.circulante.reduce((a, b) => a + b.value, 0))}
                                                </Text>
                                            </Group>
                                        </Stack>

                                        <Text size="sm" fw={500} c="dimmed" mb="xs">Passivo Não Circulante</Text>
                                        <Stack gap="xs" mb="md">
                                            {balanco.passivo.naoCirculante.map((item, i) => (
                                                <Group key={i} justify="space-between">
                                                    <Text size="sm" pl="md">{item.name}</Text>
                                                    <Text size="sm">{formatCurrency(item.value)}</Text>
                                                </Group>
                                            ))}
                                            {balanco.passivo.naoCirculante.length === 0 && (
                                                <Text size="sm" c="dimmed" pl="md">Nenhum dado</Text>
                                            )}
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text size="sm" fw={500}>Subtotal Não Circulante</Text>
                                                <Text size="sm" fw={500}>
                                                    {formatCurrency(balanco.passivo.naoCirculante.reduce((a, b) => a + b.value, 0))}
                                                </Text>
                                            </Group>
                                        </Stack>

                                        <Text size="sm" fw={500} c="dimmed" mb="xs">Patrimônio Líquido</Text>
                                        <Stack gap="xs" mb="md">
                                            {balanco.patrimonioLiquido.map((item, i) => (
                                                <Group key={i} justify="space-between">
                                                    <Text size="sm" pl="md">{item.name}</Text>
                                                    <Text size="sm">{formatCurrency(item.value)}</Text>
                                                </Group>
                                            ))}
                                            {balanco.patrimonioLiquido.length === 0 && (
                                                <Text size="sm" c="dimmed" pl="md">Nenhum dado</Text>
                                            )}
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text size="sm" fw={500}>Subtotal PL</Text>
                                                <Text size="sm" fw={500}>
                                                    {formatCurrency(balanco.patrimonioLiquido.reduce((a, b) => a + b.value, 0))}
                                                </Text>
                                            </Group>
                                        </Stack>

                                        <Paper p="sm" bg="blue.0" radius="md">
                                            <Group justify="space-between">
                                                <Text fw={600}>TOTAL PASSIVO + PL</Text>
                                                <Text fw={700} c="blue">
                                                    {formatCurrency(
                                                        balanco.passivo.circulante.reduce((a, b) => a + b.value, 0) +
                                                        balanco.passivo.naoCirculante.reduce((a, b) => a + b.value, 0) +
                                                        balanco.patrimonioLiquido.reduce((a, b) => a + b.value, 0)
                                                    )}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    </Card>
                                </Grid.Col>
                            </Grid>

                            {/* Balancete - Trial Balance */}
                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600}>Balancete de Verificação</Text>
                                    <Badge variant="light">
                                        {MONTHS.find(m => m.value === selectedMonth)?.label}
                                    </Badge>
                                </Group>
                                {balancete.length === 0 ? (
                                    <Text c="dimmed" ta="center" py="xl">Nenhum lançamento contábil para este período</Text>
                                ) : (
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Código</Table.Th>
                                                <Table.Th>Conta</Table.Th>
                                                <Table.Th ta="right">Débito</Table.Th>
                                                <Table.Th ta="right">Crédito</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {balancete.map((item, i) => (
                                                <Table.Tr
                                                    key={i}
                                                    bg={item.type === 'group' ? 'blue.0' : item.type === 'subgroup' ? 'gray.0' : undefined}
                                                >
                                                    <Table.Td fw={item.type === 'group' ? 600 : 400}>{item.code}</Table.Td>
                                                    <Table.Td
                                                        fw={item.type === 'group' ? 600 : item.type === 'subgroup' ? 500 : 400}
                                                        pl={item.type === 'account' ? 32 : item.type === 'subgroup' ? 16 : undefined}
                                                    >
                                                        {item.name}
                                                    </Table.Td>
                                                    <Table.Td ta="right">
                                                        {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                                                    </Table.Td>
                                                    <Table.Td ta="right">
                                                        {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                            <Table.Tr bg="green.0">
                                                <Table.Td colSpan={2} fw={700}>TOTAL</Table.Td>
                                                <Table.Td ta="right" fw={700}>
                                                    {formatCurrency(balancete.filter(b => b.type === 'group').reduce((a, b) => a + b.debit, 0))}
                                                </Table.Td>
                                                <Table.Td ta="right" fw={700}>
                                                    {formatCurrency(balancete.filter(b => b.type === 'group').reduce((a, b) => a + b.credit, 0))}
                                                </Table.Td>
                                            </Table.Tr>
                                        </Table.Tbody>
                                    </Table>
                                )}
                            </Card>
                        </Stack>
                    )}
                </>
            )}
        </Stack>
    );
}
