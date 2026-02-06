'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Tabs, Grid, Select, Progress, Table,
    RingProgress, Divider, Avatar
} from '@mantine/core';
import {
    IconChevronLeft, IconChartBar, IconCurrencyDollar,
    IconTrendingUp, IconUsers, IconCalendar, IconSchool, IconClock,
    IconArrowUpRight, IconArrowDownRight, IconReportMoney, IconFileSpreadsheet
} from '@tabler/icons-react';
import Link from 'next/link';
import { ExportButton } from '@/components/shared';

const MONTHS = [
    { value: '2026-02', label: 'Fevereiro 2026' },
    { value: '2026-01', label: 'Janeiro 2026' },
    { value: '2025-12', label: 'Dezembro 2025' },
];

const MOCK_REVENUE_BY_COURSE = [
    { name: 'Alfabetização em IA', revenue: 28000, students: 75, percentage: 62 },
    { name: 'Kids', revenue: 8000, students: 25, percentage: 18 },
    { name: 'Teens', revenue: 6000, students: 15, percentage: 13 },
    { name: 'Adultos', revenue: 3000, students: 5, percentage: 7 },
];

const MOCK_PAYMENT_METHODS = [
    { method: 'PIX', amount: 30000, count: 85, percentage: 67 },
    { method: 'Cartão de Crédito', amount: 10000, count: 25, percentage: 22 },
    { method: 'Boleto', amount: 5000, count: 10, percentage: 11 },
];

const MOCK_DEFAULTERS = [
    { name: 'Carlos Souza', daysPast: 45, amount: 900 },
    { name: 'Fernanda Lima', daysPast: 30, amount: 450 },
    { name: 'Roberto Alves', daysPast: 15, amount: 450 },
    { name: 'Juliana Costa', daysPast: 7, amount: 450 },
];

// Teacher cost analysis data
const MOCK_TEACHERS = [
    {
        id: '1',
        name: 'Maria Santos',
        salary: 4500,
        bonus: 500,
        totalCost: 5000,
        classes: 8,
        students: 48,
        hoursPerWeek: 20,
        revenueGenerated: 14400,
        efficiency: 2.88, // revenue per cost ratio
        costPerStudent: 104.17,
        costPerHour: 62.5,
        trend: 5.2, // improvement from last month
    },
    {
        id: '2',
        name: 'João Oliveira',
        salary: 4000,
        bonus: 300,
        totalCost: 4300,
        classes: 6,
        students: 35,
        hoursPerWeek: 16,
        revenueGenerated: 10500,
        efficiency: 2.44,
        costPerStudent: 122.86,
        costPerHour: 67.19,
        trend: -2.1,
    },
    {
        id: '3',
        name: 'Ana Ferreira',
        salary: 3500,
        bonus: 400,
        totalCost: 3900,
        classes: 5,
        students: 28,
        hoursPerWeek: 14,
        revenueGenerated: 9200,
        efficiency: 2.36,
        costPerStudent: 139.29,
        costPerHour: 69.64,
        trend: 1.8,
    },
    {
        id: '4',
        name: 'Pedro Lima',
        salary: 3000,
        bonus: 200,
        totalCost: 3200,
        classes: 4,
        students: 20,
        hoursPerWeek: 10,
        revenueGenerated: 6000,
        efficiency: 1.88,
        costPerStudent: 160.00,
        costPerHour: 80.00,
        trend: -5.5,
    },
];

// Cost breakdown
const MOCK_COST_BREAKDOWN = {
    salaries: 15000,
    bonuses: 1400,
    benefits: 2500,
    training: 800,
    total: 19700,
    asPercentOfRevenue: 43.8,
};

// Accounting data - Balancete (Trial Balance)
const MOCK_BALANCETE = [
    { code: '1', name: 'ATIVO', debit: 185000, credit: 0, type: 'group' },
    { code: '1.1', name: 'Ativo Circulante', debit: 95000, credit: 0, type: 'subgroup' },
    { code: '1.1.1', name: 'Caixa e Equivalentes', debit: 45000, credit: 0, type: 'account' },
    { code: '1.1.2', name: 'Contas a Receber', debit: 32000, credit: 0, type: 'account' },
    { code: '1.1.3', name: 'Adiantamentos', debit: 18000, credit: 0, type: 'account' },
    { code: '1.2', name: 'Ativo Não Circulante', debit: 90000, credit: 0, type: 'subgroup' },
    { code: '1.2.1', name: 'Imobilizado', debit: 75000, credit: 0, type: 'account' },
    { code: '1.2.2', name: 'Intangível', debit: 15000, credit: 0, type: 'account' },
    { code: '2', name: 'PASSIVO', debit: 0, credit: 65000, type: 'group' },
    { code: '2.1', name: 'Passivo Circulante', debit: 0, credit: 45000, type: 'subgroup' },
    { code: '2.1.1', name: 'Fornecedores', debit: 0, credit: 12000, type: 'account' },
    { code: '2.1.2', name: 'Obrigações Trabalhistas', debit: 0, credit: 18000, type: 'account' },
    { code: '2.1.3', name: 'Obrigações Tributárias', debit: 0, credit: 15000, type: 'account' },
    { code: '2.2', name: 'Passivo Não Circulante', debit: 0, credit: 20000, type: 'subgroup' },
    { code: '2.2.1', name: 'Financiamentos', debit: 0, credit: 20000, type: 'account' },
    { code: '3', name: 'PATRIMÔNIO LÍQUIDO', debit: 0, credit: 120000, type: 'group' },
    { code: '3.1', name: 'Capital Social', debit: 0, credit: 80000, type: 'account' },
    { code: '3.2', name: 'Lucros Acumulados', debit: 0, credit: 40000, type: 'account' },
];

// DRE - Demonstração do Resultado do Exercício
const MOCK_DRE = [
    { name: 'RECEITA OPERACIONAL BRUTA', value: 55000, type: 'header' },
    { name: 'Mensalidades', value: 45000, type: 'item', indent: 1 },
    { name: 'Matrículas', value: 8000, type: 'item', indent: 1 },
    { name: 'Outros Serviços', value: 2000, type: 'item', indent: 1 },
    { name: '(-) Deduções', value: -5500, type: 'deduction' },
    { name: 'Impostos s/ Receita (ISS, PIS, COFINS)', value: -5500, type: 'item', indent: 1 },
    { name: 'RECEITA OPERACIONAL LÍQUIDA', value: 49500, type: 'subtotal' },
    { name: '(-) Custos dos Serviços Prestados', value: -19700, type: 'deduction' },
    { name: 'Custos com Pessoal Docente', value: -15000, type: 'item', indent: 1 },
    { name: 'Material Didático', value: -3200, type: 'item', indent: 1 },
    { name: 'Outros Custos', value: -1500, type: 'item', indent: 1 },
    { name: 'LUCRO BRUTO', value: 29800, type: 'subtotal' },
    { name: '(-) Despesas Operacionais', value: -18500, type: 'deduction' },
    { name: 'Despesas Administrativas', value: -8000, type: 'item', indent: 1 },
    { name: 'Despesas com Pessoal Administrativo', value: -6500, type: 'item', indent: 1 },
    { name: 'Despesas com Marketing', value: -2500, type: 'item', indent: 1 },
    { name: 'Despesas Financeiras', value: -1500, type: 'item', indent: 1 },
    { name: 'LUCRO OPERACIONAL (EBIT)', value: 11300, type: 'subtotal' },
    { name: '(-) Provisão para IR/CSLL', value: -2712, type: 'deduction' },
    { name: 'LUCRO LÍQUIDO DO EXERCÍCIO', value: 8588, type: 'total' },
];

// Balanço Patrimonial
const MOCK_BALANCO = {
    ativo: {
        circulante: [
            { name: 'Caixa e Equivalentes', value: 45000 },
            { name: 'Contas a Receber', value: 32000 },
            { name: 'Adiantamentos', value: 18000 },
        ],
        naoCirculante: [
            { name: 'Imobilizado', value: 75000 },
            { name: 'Intangível', value: 15000 },
        ],
    },
    passivo: {
        circulante: [
            { name: 'Fornecedores', value: 12000 },
            { name: 'Obrigações Trabalhistas', value: 18000 },
            { name: 'Obrigações Tributárias', value: 15000 },
        ],
        naoCirculante: [
            { name: 'Financiamentos LP', value: 20000 },
        ],
    },
    patrimonioLiquido: [
        { name: 'Capital Social', value: 80000 },
        { name: 'Lucros Acumulados', value: 40000 },
    ],
};

export default function FinancialReportsPage() {
    const [selectedMonth, setSelectedMonth] = useState<string | null>('2026-02');
    const [activeTab, setActiveTab] = useState<string | null>('revenue');

    const totalRevenue = MOCK_REVENUE_BY_COURSE.reduce((acc, c) => acc + c.revenue, 0);
    const totalDefaulted = MOCK_DEFAULTERS.reduce((acc, d) => acc + d.amount, 0);
    const totalTeacherCost = MOCK_TEACHERS.reduce((acc, t) => acc + t.totalCost, 0);
    const totalRevenueFromTeachers = MOCK_TEACHERS.reduce((acc, t) => acc + t.revenueGenerated, 0);
    const avgEfficiency = MOCK_TEACHERS.reduce((acc, t) => acc + t.efficiency, 0) / MOCK_TEACHERS.length;

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
                            ? MOCK_TEACHERS.map(t => ({
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
                                ? MOCK_DEFAULTERS.map(d => ({
                                    name: d.name,
                                    daysPast: d.daysPast,
                                    amount: formatCurrency(d.amount),
                                }))
                                : activeTab === 'payments'
                                    ? MOCK_PAYMENT_METHODS.map(p => ({
                                        method: p.method,
                                        amount: formatCurrency(p.amount),
                                        count: p.count,
                                        percentage: `${p.percentage}%`,
                                    }))
                                    : MOCK_REVENUE_BY_COURSE.map(c => ({
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

            {activeTab === 'revenue' && (
                <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Text fw={600} mb="lg">Receita por Tipo de Curso</Text>
                            <Stack gap="md">
                                {MOCK_REVENUE_BY_COURSE.map((course, i) => (
                                    <div key={i}>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm" fw={500}>{course.name}</Text>
                                            <Group gap="lg">
                                                <Badge variant="light">{course.students} alunos</Badge>
                                                <Text size="sm" fw={600}>R$ {course.revenue.toLocaleString('pt-BR')}</Text>
                                            </Group>
                                        </Group>
                                        <Progress value={course.percentage} size="lg" radius="xl" color={['blue', 'green', 'violet', 'orange'][i]} />
                                    </div>
                                ))}
                            </Stack>
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
                                    <Text size="xl" fw={700} c="blue">R$ {(totalRevenue / 120).toFixed(2)}</Text>
                                </Paper>
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>
            )}

            {activeTab === 'payments' && (
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Text fw={600} mb="lg">Distribuição por Forma de Pagamento</Text>
                    <Stack gap="md">
                        {MOCK_PAYMENT_METHODS.map((method, i) => (
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
                </Card>
            )}

            {activeTab === 'defaulters' && (
                <Grid>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Text fw={600} mb="lg">Lista de Inadimplentes</Text>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Responsável</Table.Th>
                                        <Table.Th ta="center">Dias em Atraso</Table.Th>
                                        <Table.Th ta="right">Valor</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {MOCK_DEFAULTERS.map((d, i) => (
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
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Card shadow="sm" radius="md" p="lg" withBorder bg="red.0">
                            <ThemeIcon size={48} variant="light" color="red" mb="md">
                                <IconTrendingUp size={24} />
                            </ThemeIcon>
                            <Text size="sm" c="dimmed">Total Inadimplente</Text>
                            <Text size="xl" fw={700} c="red">R$ {totalDefaulted.toLocaleString('pt-BR')}</Text>
                            <Text size="sm" c="dimmed" mt="xs">{MOCK_DEFAULTERS.length} responsáveis</Text>
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
                            <Text size="xl" fw={700}>{MOCK_TEACHERS.length}</Text>
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
                                        <Text size="sm" fw={500}>{formatCurrency(MOCK_COST_BREAKDOWN.salaries)}</Text>
                                    </Group>
                                    <Progress value={(MOCK_COST_BREAKDOWN.salaries / MOCK_COST_BREAKDOWN.total) * 100} size="sm" color="blue" />

                                    <Group justify="space-between">
                                        <Text size="sm">Bônus</Text>
                                        <Text size="sm" fw={500}>{formatCurrency(MOCK_COST_BREAKDOWN.bonuses)}</Text>
                                    </Group>
                                    <Progress value={(MOCK_COST_BREAKDOWN.bonuses / MOCK_COST_BREAKDOWN.total) * 100} size="sm" color="green" />

                                    <Group justify="space-between">
                                        <Text size="sm">Benefícios</Text>
                                        <Text size="sm" fw={500}>{formatCurrency(MOCK_COST_BREAKDOWN.benefits)}</Text>
                                    </Group>
                                    <Progress value={(MOCK_COST_BREAKDOWN.benefits / MOCK_COST_BREAKDOWN.total) * 100} size="sm" color="violet" />

                                    <Group justify="space-between">
                                        <Text size="sm">Treinamento</Text>
                                        <Text size="sm" fw={500}>{formatCurrency(MOCK_COST_BREAKDOWN.training)}</Text>
                                    </Group>
                                    <Progress value={(MOCK_COST_BREAKDOWN.training / MOCK_COST_BREAKDOWN.total) * 100} size="sm" color="orange" />

                                    <Divider my="xs" />

                                    <Paper p="sm" bg="gray.0" radius="md">
                                        <Group justify="space-between">
                                            <Text size="sm" fw={600}>Total</Text>
                                            <Text size="sm" fw={700}>{formatCurrency(MOCK_COST_BREAKDOWN.total)}</Text>
                                        </Group>
                                        <Text size="xs" c="dimmed" mt={4}>
                                            {MOCK_COST_BREAKDOWN.asPercentOfRevenue}% da receita
                                        </Text>
                                    </Paper>
                                </Stack>
                            </Card>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <Text fw={600} mb="md">Análise por Professor</Text>
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
                                        {MOCK_TEACHERS.map((teacher) => (
                                            <Table.Tr key={teacher.id}>
                                                <Table.Td>
                                                    <Group gap="sm">
                                                        <Avatar size="sm" color="violet" radius="xl">
                                                            {teacher.name.split(' ').map(n => n[0]).join('')}
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
                            </Card>
                        </Grid.Col>
                    </Grid>

                    {/* Efficiency Comparison */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Text fw={600} mb="md">Comparativo de Eficiência (Receita/Custo)</Text>
                        <Stack gap="md">
                            {MOCK_TEACHERS.sort((a, b) => b.efficiency - a.efficiency).map((teacher, i) => (
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
                        <Paper p="sm" bg="blue.0" radius="md" mt="md">
                            <Group justify="space-between">
                                <Text size="sm">Meta de Eficiência</Text>
                                <Text size="sm" fw={700} c="blue">2.5x ou mais</Text>
                            </Group>
                            <Text size="xs" c="dimmed" mt={4}>
                                {MOCK_TEACHERS.filter(t => t.efficiency >= 2.5).length} de {MOCK_TEACHERS.length} professores atingem a meta
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
                        <Table>
                            <Table.Tbody>
                                {MOCK_DRE.map((item, i) => (
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
                    </Card>

                    {/* Balanço Patrimonial */}
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Card shadow="sm" radius="md" p="lg" withBorder h="100%">
                                <Text fw={600} mb="md">ATIVO</Text>

                                <Text size="sm" fw={500} c="dimmed" mb="xs">Ativo Circulante</Text>
                                <Stack gap="xs" mb="md">
                                    {MOCK_BALANCO.ativo.circulante.map((item, i) => (
                                        <Group key={i} justify="space-between">
                                            <Text size="sm" pl="md">{item.name}</Text>
                                            <Text size="sm">{formatCurrency(item.value)}</Text>
                                        </Group>
                                    ))}
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="sm" fw={500}>Subtotal Circulante</Text>
                                        <Text size="sm" fw={500}>
                                            {formatCurrency(MOCK_BALANCO.ativo.circulante.reduce((a, b) => a + b.value, 0))}
                                        </Text>
                                    </Group>
                                </Stack>

                                <Text size="sm" fw={500} c="dimmed" mb="xs">Ativo Não Circulante</Text>
                                <Stack gap="xs" mb="md">
                                    {MOCK_BALANCO.ativo.naoCirculante.map((item, i) => (
                                        <Group key={i} justify="space-between">
                                            <Text size="sm" pl="md">{item.name}</Text>
                                            <Text size="sm">{formatCurrency(item.value)}</Text>
                                        </Group>
                                    ))}
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="sm" fw={500}>Subtotal Não Circulante</Text>
                                        <Text size="sm" fw={500}>
                                            {formatCurrency(MOCK_BALANCO.ativo.naoCirculante.reduce((a, b) => a + b.value, 0))}
                                        </Text>
                                    </Group>
                                </Stack>

                                <Paper p="sm" bg="green.0" radius="md">
                                    <Group justify="space-between">
                                        <Text fw={600}>TOTAL DO ATIVO</Text>
                                        <Text fw={700} c="green">
                                            {formatCurrency(
                                                MOCK_BALANCO.ativo.circulante.reduce((a, b) => a + b.value, 0) +
                                                MOCK_BALANCO.ativo.naoCirculante.reduce((a, b) => a + b.value, 0)
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
                                    {MOCK_BALANCO.passivo.circulante.map((item, i) => (
                                        <Group key={i} justify="space-between">
                                            <Text size="sm" pl="md">{item.name}</Text>
                                            <Text size="sm">{formatCurrency(item.value)}</Text>
                                        </Group>
                                    ))}
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="sm" fw={500}>Subtotal Circulante</Text>
                                        <Text size="sm" fw={500}>
                                            {formatCurrency(MOCK_BALANCO.passivo.circulante.reduce((a, b) => a + b.value, 0))}
                                        </Text>
                                    </Group>
                                </Stack>

                                <Text size="sm" fw={500} c="dimmed" mb="xs">Passivo Não Circulante</Text>
                                <Stack gap="xs" mb="md">
                                    {MOCK_BALANCO.passivo.naoCirculante.map((item, i) => (
                                        <Group key={i} justify="space-between">
                                            <Text size="sm" pl="md">{item.name}</Text>
                                            <Text size="sm">{formatCurrency(item.value)}</Text>
                                        </Group>
                                    ))}
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="sm" fw={500}>Subtotal Não Circulante</Text>
                                        <Text size="sm" fw={500}>
                                            {formatCurrency(MOCK_BALANCO.passivo.naoCirculante.reduce((a, b) => a + b.value, 0))}
                                        </Text>
                                    </Group>
                                </Stack>

                                <Text size="sm" fw={500} c="dimmed" mb="xs">Patrimônio Líquido</Text>
                                <Stack gap="xs" mb="md">
                                    {MOCK_BALANCO.patrimonioLiquido.map((item, i) => (
                                        <Group key={i} justify="space-between">
                                            <Text size="sm" pl="md">{item.name}</Text>
                                            <Text size="sm">{formatCurrency(item.value)}</Text>
                                        </Group>
                                    ))}
                                    <Divider />
                                    <Group justify="space-between">
                                        <Text size="sm" fw={500}>Subtotal PL</Text>
                                        <Text size="sm" fw={500}>
                                            {formatCurrency(MOCK_BALANCO.patrimonioLiquido.reduce((a, b) => a + b.value, 0))}
                                        </Text>
                                    </Group>
                                </Stack>

                                <Paper p="sm" bg="blue.0" radius="md">
                                    <Group justify="space-between">
                                        <Text fw={600}>TOTAL PASSIVO + PL</Text>
                                        <Text fw={700} c="blue">
                                            {formatCurrency(
                                                MOCK_BALANCO.passivo.circulante.reduce((a, b) => a + b.value, 0) +
                                                MOCK_BALANCO.passivo.naoCirculante.reduce((a, b) => a + b.value, 0) +
                                                MOCK_BALANCO.patrimonioLiquido.reduce((a, b) => a + b.value, 0)
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
                                {MOCK_BALANCETE.map((item, i) => (
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
                                        {formatCurrency(MOCK_BALANCETE.filter(b => b.type === 'group').reduce((a, b) => a + b.debit, 0))}
                                    </Table.Td>
                                    <Table.Td ta="right" fw={700}>
                                        {formatCurrency(MOCK_BALANCETE.filter(b => b.type === 'group').reduce((a, b) => a + b.credit, 0))}
                                    </Table.Td>
                                </Table.Tr>
                            </Table.Tbody>
                        </Table>
                    </Card>
                </Stack>
            )}
        </Stack>
    );
}

