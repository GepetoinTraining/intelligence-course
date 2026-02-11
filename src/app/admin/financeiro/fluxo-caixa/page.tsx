'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Table, Loader, Alert, Center, Select,
} from '@mantine/core';
import {
    IconArrowsExchange, IconAlertCircle, IconArrowUp,
    IconArrowDown, IconReportMoney, IconTrendingUp, IconTrendingDown,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Receivable {
    id: string;
    status: string;
    netAmountCents: number;
    paidAmountCents: number;
    dueDate: number;
    paymentDate: number | null;
}

interface Payable {
    id: string;
    status: string;
    amountCents: number;
    dueDate: number;
    paidDate: number | null;
}

function formatBRL(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function getMonthKey(ts: number): string {
    const d = new Date(ts * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
    const [y, m] = key.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m) - 1]}/${y}`;
}

export default function FluxoCaixaPage() {
    const { data: receivables, isLoading: loadRec } = useApi<Receivable[]>('/api/receivables');
    const { data: payables, isLoading: loadPay } = useApi<Payable[]>('/api/payables');

    const now = Math.floor(Date.now() / 1000);
    const allRec = receivables || [];
    const allPay = payables || [];

    // Calculate cash flow by month
    const months: Record<string, { inflow: number; outflow: number; projected_in: number; projected_out: number }> = {};

    // Actual inflows (paid receivables)
    allRec.forEach(r => {
        if (r.status === 'paid' && r.paymentDate) {
            const key = getMonthKey(r.paymentDate);
            if (!months[key]) months[key] = { inflow: 0, outflow: 0, projected_in: 0, projected_out: 0 };
            months[key].inflow += r.paidAmountCents || r.netAmountCents;
        }
        // Projected inflows (pending)
        if (r.status === 'pending' || r.status === 'overdue') {
            const key = getMonthKey(r.dueDate);
            if (!months[key]) months[key] = { inflow: 0, outflow: 0, projected_in: 0, projected_out: 0 };
            months[key].projected_in += r.netAmountCents;
        }
    });

    // Actual outflows (paid payables)
    allPay.forEach(p => {
        if (p.status === 'paid' && p.paidDate) {
            const key = getMonthKey(p.paidDate);
            if (!months[key]) months[key] = { inflow: 0, outflow: 0, projected_in: 0, projected_out: 0 };
            months[key].outflow += p.amountCents;
        }
        // Projected outflows (pending)
        if (p.status === 'pending' || p.status === 'scheduled') {
            const key = getMonthKey(p.dueDate);
            if (!months[key]) months[key] = { inflow: 0, outflow: 0, projected_in: 0, projected_out: 0 };
            months[key].projected_out += p.amountCents;
        }
    });

    const sortedMonths = Object.keys(months).sort();

    // Totals
    const totalInflow = Object.values(months).reduce((s, m) => s + m.inflow, 0);
    const totalOutflow = Object.values(months).reduce((s, m) => s + m.outflow, 0);
    const totalProjectedIn = Object.values(months).reduce((s, m) => s + m.projected_in, 0);
    const totalProjectedOut = Object.values(months).reduce((s, m) => s + m.projected_out, 0);
    const netCash = totalInflow - totalOutflow;
    const projectedNet = totalProjectedIn - totalProjectedOut;

    const isLoading = loadRec || loadPay;

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Financeiro</Text>
                <Title order={2}>Fluxo de Caixa</Title>
            </div>

            {/* Summary KPIs */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
                <Card withBorder p="sm">
                    <Group gap={6}>
                        <ThemeIcon variant="light" color="green" size="sm"><IconArrowUp size={14} /></ThemeIcon>
                        <Text size="xs" c="dimmed">Entradas Realizadas</Text>
                    </Group>
                    <Text fw={700} c="green">{formatBRL(totalInflow)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Group gap={6}>
                        <ThemeIcon variant="light" color="red" size="sm"><IconArrowDown size={14} /></ThemeIcon>
                        <Text size="xs" c="dimmed">Saídas Realizadas</Text>
                    </Group>
                    <Text fw={700} c="red">{formatBRL(totalOutflow)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Saldo Realizado</Text>
                    <Text fw={700} c={netCash >= 0 ? 'green' : 'red'}>{formatBRL(netCash)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Group gap={6}>
                        <ThemeIcon variant="light" color="blue" size="sm"><IconTrendingUp size={14} /></ThemeIcon>
                        <Text size="xs" c="dimmed">Entradas Previstas</Text>
                    </Group>
                    <Text fw={700} c="blue">{formatBRL(totalProjectedIn)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Group gap={6}>
                        <ThemeIcon variant="light" color="orange" size="sm"><IconTrendingDown size={14} /></ThemeIcon>
                        <Text size="xs" c="dimmed">Saídas Previstas</Text>
                    </Group>
                    <Text fw={700} c="orange">{formatBRL(totalProjectedOut)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Saldo Projetado</Text>
                    <Text fw={700} c={projectedNet >= 0 ? 'green' : 'red'}>{formatBRL(projectedNet)}</Text>
                </Card>
            </SimpleGrid>

            {/* Monthly Breakdown Table */}
            <Card withBorder p="md">
                <Text fw={600} mb="sm">Fluxo Mensal</Text>
                {sortedMonths.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Mês</Table.Th>
                                <Table.Th>Entradas</Table.Th>
                                <Table.Th>Saídas</Table.Th>
                                <Table.Th>Saldo</Table.Th>
                                <Table.Th>Previsto (Entradas)</Table.Th>
                                <Table.Th>Previsto (Saídas)</Table.Th>
                                <Table.Th>Saldo Projetado</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {sortedMonths.map(key => {
                                const m = months[key];
                                const net = m.inflow - m.outflow;
                                const projNet = m.projected_in - m.projected_out;
                                return (
                                    <Table.Tr key={key}>
                                        <Table.Td><Text fw={500}>{getMonthLabel(key)}</Text></Table.Td>
                                        <Table.Td><Text c="green">{formatBRL(m.inflow)}</Text></Table.Td>
                                        <Table.Td><Text c="red">{formatBRL(m.outflow)}</Text></Table.Td>
                                        <Table.Td>
                                            <Badge color={net >= 0 ? 'green' : 'red'} variant="light">
                                                {formatBRL(net)}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td><Text c="blue">{formatBRL(m.projected_in)}</Text></Table.Td>
                                        <Table.Td><Text c="orange">{formatBRL(m.projected_out)}</Text></Table.Td>
                                        <Table.Td>
                                            <Badge color={projNet >= 0 ? 'blue' : 'orange'} variant="light">
                                                {formatBRL(projNet)}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconArrowsExchange size={48} color="gray" />
                            <Text c="dimmed">Nenhum movimento financeiro registrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Info */}
            <Alert icon={<IconReportMoney size={16} />} color="gray" variant="light" title="Fluxo de Caixa">
                <Text size="xs">
                    Dados consolidados de recebíveis e contas a pagar. O saldo projetado considera
                    parcelas pendentes e contas agendadas.
                </Text>
            </Alert>
        </Stack>
    );
}
