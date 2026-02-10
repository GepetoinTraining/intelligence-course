'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Paper, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Progress,
} from '@mantine/core';
import {
    IconAlertCircle, IconCoin, IconPercentage, IconUsers,
    IconCash, IconChartBar, IconTarget,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface PayrollPayment {
    id: string;
    payrollId: string;
    personId: string;
    amountCents: number;
    methodType?: string;
    paymentProvider?: string;
    status: string;
    scheduledFor?: number;
    notes?: string;
    createdAt?: number;
}

interface PayrollRecord {
    id: string;
    personId: string;
    contractId: string;
    payrollType: string;
    grossAmountCents: number;
    netAmountCents: number;
    status: string;
    userName?: string;
    department?: string;
    contractType?: string;
    jobTitle?: string;
}

export default function ComissoesPage() {
    const [payments, setPayments] = useState<PayrollPayment[]>([]);
    const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [paymentsRes, payrollRes] = await Promise.all([
                fetch('/api/payroll-payments?limit=200'),
                fetch('/api/staff-payroll?limit=200'),
            ]);

            if (paymentsRes.ok) {
                const pData = await paymentsRes.json();
                setPayments(pData.data || []);
            }
            if (payrollRes.ok) {
                const prData = await payrollRes.json();
                setPayroll(prData.data || []);
            }
        } catch (err) {
            setError('Falha ao carregar dados de comissões');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (cents: number) => `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString('pt-BR') : '—';

    const stats = useMemo(() => {
        // Commission-type payrolls
        const commissions = payroll.filter(p => p.payrollType === 'commission' || p.payrollType === 'bonus');
        const salaryPayroll = payroll.filter(p => p.payrollType === 'salary');

        const totalCommissions = commissions.reduce((sum, c) => sum + (c.grossAmountCents || 0), 0);
        const totalSalary = salaryPayroll.reduce((sum, s) => sum + (s.grossAmountCents || 0), 0);
        const commissionRate = totalSalary > 0 ? Math.round((totalCommissions / totalSalary) * 100) : 0;

        // By person
        const personMap = new Map<string, { name: string; total: number; count: number; dept: string }>();
        commissions.forEach(c => {
            const key = c.personId;
            const existing = personMap.get(key) || { name: c.userName || key.slice(0, 8), total: 0, count: 0, dept: c.department || 'N/A' };
            existing.total += c.grossAmountCents || 0;
            existing.count += 1;
            personMap.set(key, existing);
        });
        const byPerson = Array.from(personMap.values()).sort((a, b) => b.total - a.total);

        // Completed payments
        const completedPayments = payments.filter(p => p.status === 'completed');
        const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
        const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'scheduled');
        const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);

        return {
            totalCommissions,
            commissionRate,
            uniqueRecipients: personMap.size,
            byPerson,
            totalPaid,
            totalPending,
            pendingCount: pendingPayments.length,
            completedCount: completedPayments.length,
        };
    }, [payroll, payments]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando comissões...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">RH & Pessoas</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Comissões</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Comissões & Bonificações</Title>
                        <Group>
                            <Select
                                size="sm"
                                value={period}
                                onChange={(v) => setPeriod(v || 'all')}
                                data={[
                                    { value: 'all', label: 'Todos os Períodos' },
                                    { value: 'month', label: 'Este Mês' },
                                    { value: 'quarter', label: 'Este Trimestre' },
                                    { value: 'year', label: 'Este Ano' },
                                ]}
                                w={180}
                            />
                            <ExportButton data={stats.byPerson} organizationName="NodeZero" />
                        </Group>
                    </Group>
                    <Text c="dimmed" mt="xs">Gestão de comissões de vendas, bonificações e pagamentos variáveis.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>
                )}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Comissões</Text>
                                <Text size="xl" fw={700}>{fmt(stats.totalCommissions)}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconCoin size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>% da Folha</Text>
                                <Text size="xl" fw={700}>{stats.commissionRate}%</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconPercentage size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Beneficiários</Text>
                                <Text size="xl" fw={700}>{stats.uniqueRecipients}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconUsers size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>A Pagar</Text>
                                <Text size="xl" fw={700} c={stats.totalPending > 0 ? 'orange' : undefined}>
                                    {fmt(stats.totalPending)}
                                </Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconCash size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Payment Status */}
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Status dos Pagamentos</Text>
                        <Stack gap="md">
                            <div>
                                <Group justify="space-between" mb={4}>
                                    <Text size="sm">Pagos</Text>
                                    <Group gap={4}>
                                        <Text size="sm" fw={600}>{stats.completedCount}</Text>
                                        <Text size="xs" c="dimmed">({fmt(stats.totalPaid)})</Text>
                                    </Group>
                                </Group>
                                <Progress
                                    value={payments.length > 0 ? (stats.completedCount / payments.length) * 100 : 0}
                                    color="green"
                                    size="lg"
                                    radius="md"
                                />
                            </div>
                            <div>
                                <Group justify="space-between" mb={4}>
                                    <Text size="sm">Pendentes</Text>
                                    <Group gap={4}>
                                        <Text size="sm" fw={600}>{stats.pendingCount}</Text>
                                        <Text size="xs" c="dimmed">({fmt(stats.totalPending)})</Text>
                                    </Group>
                                </Group>
                                <Progress
                                    value={payments.length > 0 ? (stats.pendingCount / payments.length) * 100 : 0}
                                    color="orange"
                                    size="lg"
                                    radius="md"
                                />
                            </div>
                        </Stack>
                    </Card>

                    {/* Top Earners */}
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Maiores Comissionados</Text>
                            <IconTarget size={20} color="gray" />
                        </Group>
                        {stats.byPerson.length === 0 ? (
                            <Text c="dimmed" ta="center" py="lg">Nenhuma comissão registrada.</Text>
                        ) : (
                            <Stack gap="sm">
                                {stats.byPerson.slice(0, 5).map((person, idx) => (
                                    <div key={idx}>
                                        <Group justify="space-between" mb={4}>
                                            <Group gap="xs">
                                                <Badge size="sm" variant="filled" color="blue" circle>{idx + 1}</Badge>
                                                <Text size="sm">{person.name}</Text>
                                                <Text size="xs" c="dimmed">({person.dept})</Text>
                                            </Group>
                                            <Text size="sm" fw={600}>{fmt(person.total)}</Text>
                                        </Group>
                                        <Progress
                                            value={stats.totalCommissions > 0 ? (person.total / stats.totalCommissions) * 100 : 0}
                                            color="blue"
                                            size="md"
                                            radius="md"
                                        />
                                    </div>
                                ))}
                            </Stack>
                        )}
                    </Card>
                </SimpleGrid>

                {/* Payments Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Histórico de Pagamentos</Text>
                        <Badge variant="light">{payments.length} registros</Badge>
                    </Group>
                    {payments.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhum pagamento de comissão encontrado.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Data</Table.Th>
                                    <Table.Th ta="right">Valor</Table.Th>
                                    <Table.Th>Método</Table.Th>
                                    <Table.Th>Provedor</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                    <Table.Th>Notas</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {payments.slice(0, 30).map(p => (
                                    <Table.Tr key={p.id}>
                                        <Table.Td>
                                            <Text size="sm">{fmtDate(p.createdAt)}</Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Text size="sm" fw={600}>{fmt(p.amountCents || 0)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{p.methodType || '—'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{p.paymentProvider || 'manual'}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={p.status === 'completed' ? 'green' : p.status === 'pending' ? 'yellow' : 'gray'}
                                            >
                                                {p.status === 'completed' ? 'Pago' : p.status === 'pending' ? 'Pendente' : p.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed" lineClamp={1}>{p.notes || '—'}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
