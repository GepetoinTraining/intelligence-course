'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, Table, Tabs, Select, ThemeIcon,
    Progress, RingProgress
} from '@mantine/core';
import {
    IconCash, IconTrendingUp, IconTrendingDown, IconUsers,
    IconReceipt, IconCalendar, IconChartBar, IconAlertCircle,
    IconCheck, IconClock, IconSettings, IconBook, IconChartPie,
    IconTarget, IconDoor, IconBriefcase, IconArrowUpRight
} from '@tabler/icons-react';
import { PaymentCalendar } from '@/components/calendar/PaymentCalendar';
import { formatCurrency } from '@/lib/financial/config';
import Link from 'next/link';
import type { SchoolCashflow, Payment, CourseSummary } from '@/types/domain';

// Empty data — will be populated from API
const MOCK_CASHFLOW: SchoolCashflow = {
    currentMonth: { expected: 0, received: 0, pending: 0, overdue: 0 },
    lastMonth: { expected: 0, received: 0, pending: 0, overdue: 0 },
    students: { total: 0, active: 0, defaulting: 0 },
    revenue: { current: 0, previous: 0 },
};

const MOCK_PAYMENTS: Payment[] = [];

const MONTHLY_REVENUE = [
    { month: 'Set/25', expected: 12000, received: 11500 },
    { month: 'Out/25', expected: 13500, received: 12800 },
    { month: 'Nov/25', expected: 14200, received: 13900 },
    { month: 'Dez/25', expected: 14500, received: 14100 },
    { month: 'Jan/26', expected: 14850, received: 14100 },
    { month: 'Fev/26', expected: 15420, received: 8940 },
];

const MOCK_COURSES: CourseSummary[] = [];

// Analytics Data
const REVENUE_BY_COURSE = [
    { course: 'Fundamentos IA', revenue: 48500, percentage: 42, color: '#7950f2' },
    { course: 'AI Mastery', revenue: 32000, percentage: 28, color: '#228be6' },
    { course: 'IA Educadores', revenue: 18500, percentage: 16, color: '#40c057' },
    { course: 'Bootcamp Verão', revenue: 16200, percentage: 14, color: '#fd7e14' },
];

const ENROLLMENT_TRENDS = [
    { month: 'Set', newEnrollments: 12, dropouts: 2, netGrowth: 10 },
    { month: 'Out', newEnrollments: 18, dropouts: 3, netGrowth: 15 },
    { month: 'Nov', newEnrollments: 15, dropouts: 1, netGrowth: 14 },
    { month: 'Dez', newEnrollments: 8, dropouts: 4, netGrowth: 4 },
    { month: 'Jan', newEnrollments: 22, dropouts: 2, netGrowth: 20 },
    { month: 'Fev', newEnrollments: 28, dropouts: 1, netGrowth: 27 },
];

const CAMPAIGN_ROI = [
    { campaign: 'Verão 2026', spent: 3200, leads: 156, conversions: 23, revenue: 34431, roi: 976 },
    { campaign: 'LinkedIn B2B', spent: 1500, leads: 89, conversions: 12, revenue: 17964, roi: 1098 },
    { campaign: 'Instagram Jovens', spent: 2800, leads: 210, conversions: 18, revenue: 26946, roi: 862 },
    { campaign: 'Referral Program', spent: 800, leads: 45, conversions: 28, revenue: 41916, roi: 5140 },
];

const TEACHER_WORKLOAD = [
    { name: 'Prof. Maria Santos', classes: 4, hoursWeek: 16, students: 32, utilization: 80 },
    { name: 'Prof. João Silva', classes: 3, hoursWeek: 12, students: 24, utilization: 60 },
    { name: 'Prof. Ana Costa', classes: 5, hoursWeek: 20, students: 40, utilization: 100 },
    { name: 'Prof. Carlos Mendes', classes: 2, hoursWeek: 8, students: 18, utilization: 40 },
];

const ROOM_UTILIZATION = [
    { room: 'Sala 101', capacity: 12, hoursBooked: 32, hoursAvailable: 50, utilization: 64, popular: true },
    { room: 'Sala 102', capacity: 8, hoursBooked: 18, hoursAvailable: 50, utilization: 36, popular: false },
    { room: 'Lab A', capacity: 20, hoursBooked: 45, hoursAvailable: 50, utilization: 90, popular: true },
    { room: 'Auditório', capacity: 50, hoursBooked: 8, hoursAvailable: 50, utilization: 16, popular: false },
];

const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
        paid: { color: 'green', label: 'Pago' },
        pending: { color: 'yellow', label: 'Pendente' },
        overdue: { color: 'red', label: 'Atrasado' },
    };
    const config = configs[status] || { color: 'gray', label: status };
    return <Badge color={config.color} variant="light">{config.label}</Badge>;
};

export default function SchoolDashboard() {
    const [period, setPeriod] = useState('current');

    const data = period === 'current' ? MOCK_CASHFLOW.currentMonth : MOCK_CASHFLOW.lastMonth;
    const collectionRate = Math.round((data.received / data.expected) * 100);

    const calendarEvents = MOCK_PAYMENTS.map(p => ({
        date: p.dueDate,
        type: p.status === 'paid' ? 'payment_paid' as const :
            p.status === 'overdue' ? 'payment_overdue' as const :
                'payment_due' as const,
        title: p.student,
        amount: p.amount,
        status: p.status,
    }));

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Fluxo de Caixa 🏫</Title>
                    <Text c="dimmed">Visão financeira da escola</Text>
                </div>
                <Select
                    value={period}
                    onChange={(v) => setPeriod(v || 'current')}
                    data={[
                        { value: 'current', label: 'Fevereiro 2026' },
                        { value: 'last', label: 'Janeiro 2026' },
                    ]}
                    w={180}
                />
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="violet">
                            <IconReceipt size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{formatCurrency(data.expected)}</Text>
                            <Text size="sm" c="dimmed">Receita Esperada</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="green">
                            <IconTrendingUp size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{formatCurrency(data.received)}</Text>
                            <Text size="sm" c="dimmed">Recebido</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="yellow">
                            <IconClock size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{formatCurrency(data.pending)}</Text>
                            <Text size="sm" c="dimmed">A Receber</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="red">
                            <IconTrendingDown size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{formatCurrency(data.overdue)}</Text>
                            <Text size="sm" c="dimmed">Em Atraso</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Collection Rate & Student Stats */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {/* Collection Rate */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Text fw={500} mb="xs">Taxa de Arrecadação</Text>
                            <Text size="xl" fw={700} c={collectionRate >= 80 ? 'green' : collectionRate >= 60 ? 'yellow' : 'red'}>
                                {collectionRate}%
                            </Text>
                            <Text size="sm" c="dimmed">
                                {formatCurrency(data.received)} de {formatCurrency(data.expected)}
                            </Text>
                        </div>
                        <RingProgress
                            size={120}
                            thickness={12}
                            roundCaps
                            sections={[
                                { value: (data.received / data.expected) * 100, color: 'green' },
                                { value: (data.pending / data.expected) * 100, color: 'yellow' },
                                { value: (data.overdue / data.expected) * 100, color: 'red' },
                            ]}
                            label={
                                <Text ta="center" size="lg" fw={700}>{collectionRate}%</Text>
                            }
                        />
                    </Group>
                    <Group gap="lg" mt="md">
                        <Group gap={4}>
                            <ThemeIcon size={12} radius="xl" color="green" />
                            <Text size="xs" c="dimmed">Recebido</Text>
                        </Group>
                        <Group gap={4}>
                            <ThemeIcon size={12} radius="xl" color="yellow" />
                            <Text size="xs" c="dimmed">Pendente</Text>
                        </Group>
                        <Group gap={4}>
                            <ThemeIcon size={12} radius="xl" color="red" />
                            <Text size="xs" c="dimmed">Atrasado</Text>
                        </Group>
                    </Group>
                </Card>

                {/* Student Stats */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Text fw={500} mb="md">Alunos</Text>
                    <SimpleGrid cols={3}>
                        <Paper p="md" radius="md" withBorder ta="center">
                            <ThemeIcon size={36} radius="xl" variant="light" color="violet" mx="auto" mb="xs">
                                <IconUsers size={18} />
                            </ThemeIcon>
                            <Text size="xl" fw={700}>{MOCK_CASHFLOW.students.total}</Text>
                            <Text size="xs" c="dimmed">Total</Text>
                        </Paper>
                        <Paper p="md" radius="md" withBorder ta="center">
                            <ThemeIcon size={36} radius="xl" variant="light" color="green" mx="auto" mb="xs">
                                <IconCheck size={18} />
                            </ThemeIcon>
                            <Text size="xl" fw={700}>{MOCK_CASHFLOW.students.active}</Text>
                            <Text size="xs" c="dimmed">Em dia</Text>
                        </Paper>
                        <Paper p="md" radius="md" withBorder ta="center">
                            <ThemeIcon size={36} radius="xl" variant="light" color="red" mx="auto" mb="xs">
                                <IconAlertCircle size={18} />
                            </ThemeIcon>
                            <Text size="xl" fw={700}>{MOCK_CASHFLOW.students.defaulting}</Text>
                            <Text size="xs" c="dimmed">Inadimplentes</Text>
                        </Paper>
                    </SimpleGrid>
                </Card>
            </SimpleGrid>

            {/* Revenue Chart Placeholder */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Text fw={500} mb="md">Evolução da Receita (últimos 6 meses)</Text>
                <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
                    {MONTHLY_REVENUE.map((month) => (
                        <Paper
                            key={month.month}
                            p="md"
                            radius="md"
                            withBorder
                            style={{ minWidth: 120, flex: 1 }}
                        >
                            <Text size="xs" c="dimmed" mb="xs">{month.month}</Text>
                            <Progress.Root size="xl" radius="xl">
                                <Progress.Section
                                    value={(month.received / month.expected) * 100}
                                    color="green"
                                />
                            </Progress.Root>
                            <Group justify="space-between" mt="xs">
                                <Text size="xs" c="green">{formatCurrency(month.received)}</Text>
                                <Text size="xs" c="dimmed">{Math.round((month.received / month.expected) * 100)}%</Text>
                            </Group>
                        </Paper>
                    ))}
                </Group>
            </Card>

            {/* Tabs: Analytics, Payments & Calendar */}
            <Tabs defaultValue="analytics">
                <Tabs.List>
                    <Tabs.Tab value="analytics" leftSection={<IconChartPie size={14} />}>
                        📊 Analytics
                    </Tabs.Tab>
                    <Tabs.Tab value="payments" leftSection={<IconReceipt size={14} />}>
                        Pagamentos do Mês
                    </Tabs.Tab>
                    <Tabs.Tab value="calendar" leftSection={<IconCalendar size={14} />}>
                        Calendário
                    </Tabs.Tab>
                    <Tabs.Tab value="defaulters" leftSection={<IconAlertCircle size={14} />}>
                        Inadimplentes
                    </Tabs.Tab>
                    <Tabs.Tab value="courses" leftSection={<IconBook size={14} />}>
                        Cursos
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="analytics" pt="md">
                    <Stack gap="lg">
                        {/* Revenue by Course Type */}
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600}>Receita por Curso</Text>
                                    <Badge variant="light" color="violet">Este mês</Badge>
                                </Group>
                                <Stack gap="sm">
                                    {REVENUE_BY_COURSE.map((item) => (
                                        <div key={item.course}>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm">{item.course}</Text>
                                                <Text size="sm" fw={600}>{formatCurrency(item.revenue)}</Text>
                                            </Group>
                                            <Progress.Root size="lg" radius="xl">
                                                <Progress.Section value={item.percentage} color={item.color}>
                                                    <Progress.Label>{item.percentage}%</Progress.Label>
                                                </Progress.Section>
                                            </Progress.Root>
                                        </div>
                                    ))}
                                </Stack>
                                <Text size="xl" fw={700} mt="md" ta="right">
                                    {formatCurrency(REVENUE_BY_COURSE.reduce((acc, i) => acc + i.revenue, 0))}
                                </Text>
                            </Card>

                            {/* Enrollment Trends */}
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600}>Tendência de Matrículas</Text>
                                    <Badge variant="light" color="green">Últimos 6 meses</Badge>
                                </Group>
                                <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
                                    {ENROLLMENT_TRENDS.map((item) => (
                                        <Paper key={item.month} p="sm" radius="md" withBorder style={{ minWidth: 80, textAlign: 'center' }}>
                                            <Text size="xs" c="dimmed" mb={4}>{item.month}</Text>
                                            <div style={{ height: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                                                <div style={{
                                                    height: Math.min(item.newEnrollments * 2, 50),
                                                    width: 20,
                                                    background: 'var(--mantine-color-green-5)',
                                                    borderRadius: 4
                                                }} />
                                            </div>
                                            <Text size="lg" fw={700} c="green">+{item.netGrowth}</Text>
                                            <Text size="xs" c="dimmed">{item.newEnrollments} novos</Text>
                                        </Paper>
                                    ))}
                                </Group>
                                <Group justify="space-between" mt="md">
                                    <Text size="sm" c="dimmed">Total novos: {ENROLLMENT_TRENDS.reduce((acc, i) => acc + i.newEnrollments, 0)}</Text>
                                    <Text size="sm" c="green" fw={600}>
                                        <IconArrowUpRight size={14} style={{ verticalAlign: 'middle' }} />
                                        Crescimento: +{ENROLLMENT_TRENDS.reduce((acc, i) => acc + i.netGrowth, 0)}
                                    </Text>
                                </Group>
                            </Card>
                        </SimpleGrid>

                        {/* Campaign ROI */}
                        <Card shadow="xs" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <IconTarget size={20} />
                                    <Text fw={600}>ROI das Campanhas</Text>
                                </Group>
                                <Badge variant="light" color="pink">Marketing</Badge>
                            </Group>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Campanha</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Investido</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Leads</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Conversões</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Receita Gerada</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>ROI</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {CAMPAIGN_ROI.map((c) => (
                                        <Table.Tr key={c.campaign}>
                                            <Table.Td><Text size="sm" fw={500}>{c.campaign}</Text></Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{formatCurrency(c.spent)}</Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>{c.leads}</Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Badge variant="light" color="green">{c.conversions}</Badge>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text fw={600} c="green">{formatCurrency(c.revenue)}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Badge
                                                    variant="filled"
                                                    color={c.roi > 1000 ? 'green' : c.roi > 500 ? 'blue' : 'gray'}
                                                >
                                                    {c.roi}%
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Card>

                        {/* Teacher Workload & Room Utilization */}
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            {/* Teacher Workload */}
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Group gap="xs">
                                        <IconBriefcase size={20} />
                                        <Text fw={600}>Carga dos Professores</Text>
                                    </Group>
                                </Group>
                                <Stack gap="sm">
                                    {TEACHER_WORKLOAD.map((t) => (
                                        <Paper key={t.name} p="sm" radius="md" withBorder>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm" fw={500}>{t.name}</Text>
                                                <Badge
                                                    variant="light"
                                                    color={t.utilization >= 80 ? 'red' : t.utilization >= 60 ? 'yellow' : 'green'}
                                                >
                                                    {t.utilization}% carga
                                                </Badge>
                                            </Group>
                                            <Progress value={t.utilization} color={t.utilization >= 80 ? 'red' : t.utilization >= 60 ? 'yellow' : 'green'} size="sm" radius="xl" />
                                            <Group gap="lg" mt="xs">
                                                <Text size="xs" c="dimmed">{t.classes} turmas</Text>
                                                <Text size="xs" c="dimmed">{t.hoursWeek}h/sem</Text>
                                                <Text size="xs" c="dimmed">{t.students} alunos</Text>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Card>

                            {/* Room Utilization */}
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Group gap="xs">
                                        <IconDoor size={20} />
                                        <Text fw={600}>Utilização das Salas</Text>
                                    </Group>
                                </Group>
                                <Stack gap="sm">
                                    {ROOM_UTILIZATION.map((r) => (
                                        <Paper key={r.room} p="sm" radius="md" withBorder>
                                            <Group justify="space-between" mb={4}>
                                                <Group gap="xs">
                                                    <Text size="sm" fw={500}>{r.room}</Text>
                                                    {r.popular && <Badge size="xs" variant="light" color="pink">Popular</Badge>}
                                                </Group>
                                                <Text size="sm" c="dimmed">{r.hoursBooked}h/{r.hoursAvailable}h</Text>
                                            </Group>
                                            <Progress value={r.utilization} color={r.utilization >= 80 ? 'green' : r.utilization >= 50 ? 'blue' : 'gray'} size="sm" radius="xl" />
                                            <Group gap="lg" mt="xs">
                                                <Text size="xs" c="dimmed">Capacidade: {r.capacity}</Text>
                                                <Text size="xs" fw={500} c={r.utilization >= 80 ? 'green' : r.utilization >= 50 ? 'blue' : 'gray'}>
                                                    {r.utilization}% ocupação
                                                </Text>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Card>
                        </SimpleGrid>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="payments" pt="md">
                    <Card shadow="xs" radius="md" p={0} withBorder>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Aluno</Table.Th>
                                    <Table.Th>Responsável</Table.Th>
                                    <Table.Th>Valor</Table.Th>
                                    <Table.Th>Vencimento</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {MOCK_PAYMENTS.map((payment) => (
                                    <Table.Tr key={payment.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{payment.student}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{payment.parent}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{formatCurrency(payment.amount)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">
                                                {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                                            </Text>
                                            {payment.paidDate && (
                                                <Text size="xs" c="green">
                                                    Pago em {new Date(payment.paidDate).toLocaleDateString('pt-BR')}
                                                </Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            {getStatusBadge(payment.status)}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="calendar" pt="md">
                    <PaymentCalendar events={calendarEvents} />
                </Tabs.Panel>

                <Tabs.Panel value="defaulters" pt="md">
                    <Card shadow="xs" radius="md" p={0} withBorder>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Aluno</Table.Th>
                                    <Table.Th>Responsável</Table.Th>
                                    <Table.Th>Valor em Atraso</Table.Th>
                                    <Table.Th>Dias em Atraso</Table.Th>
                                    <Table.Th>Ações</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {MOCK_PAYMENTS.filter(p => p.status === 'overdue').map((payment) => (
                                    <Table.Tr key={payment.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{payment.student}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{payment.parent}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="red" fw={500}>{formatCurrency(payment.amount)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color="red" variant="light">
                                                {Math.ceil((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Badge
                                                    variant="outline"
                                                    color="blue"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    Enviar Lembrete
                                                </Badge>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="courses" pt="md">
                    <Card shadow="xs" radius="md" p={0} withBorder>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Curso</Table.Th>
                                    <Table.Th>Professor</Table.Th>
                                    <Table.Th>Modelo</Table.Th>
                                    <Table.Th>Alunos</Table.Th>
                                    <Table.Th>Preço</Table.Th>
                                    <Table.Th></Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {MOCK_COURSES.map((course) => (
                                    <Table.Tr key={course.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{course.title}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{course.teacher}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={course.model === 'school_course' ? 'blue' : course.model === 'hired_teacher' ? 'violet' : 'orange'}
                                                variant="light"
                                            >
                                                {course.model === 'school_course' ? 'Escola' : course.model === 'hired_teacher' ? 'Contratado' : 'Externo'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{course.students}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{formatCurrency(course.price)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Link href={`/school/courses/${course.id}`} passHref legacyBehavior>
                                                <Button component="a" size="xs" variant="light" leftSection={<IconSettings size={14} />}>
                                                    Configurar
                                                </Button>
                                            </Link>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}

