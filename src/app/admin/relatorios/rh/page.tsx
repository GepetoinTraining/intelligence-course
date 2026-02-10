'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Paper, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Select, Loader, Alert, Progress,
} from '@mantine/core';
import {
    IconUsers, IconAlertCircle, IconCoin, IconFileText,
    IconBriefcase, IconCash, IconCalendar, IconClock,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface PayrollRecord {
    id: string;
    personId: string;
    contractId: string;
    periodStart: number;
    periodEnd: number;
    payrollType: string;
    grossAmountCents: number;
    totalDeductionsCents: number;
    totalAdditionsCents: number;
    netAmountCents: number;
    status: string;
    userName?: string;
    personEmail?: string;
    jobTitle?: string;
    department?: string;
    contractType?: string;
}

interface ContractRecord {
    id: string;
    personId: string;
    jobTitle: string;
    department: string;
    contractType: string;
    status: string;
    baseSalaryCents: number;
    startDate: number;
    endDate?: number;
}

export default function RelatorioRHPage() {
    const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
    const [contracts, setContracts] = useState<ContractRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState('current');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [payrollRes, contractsRes] = await Promise.all([
                fetch('/api/staff-payroll?limit=200'),
                fetch('/api/staff-contracts?limit=200'),
            ]);

            if (payrollRes.ok) {
                const pData = await payrollRes.json();
                setPayroll(pData.data || []);
            }
            if (contractsRes.ok) {
                const cData = await contractsRes.json();
                setContracts(cData.data || []);
            }
        } catch (err) {
            setError('Falha ao carregar dados de RH');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (cents: number) => `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const stats = useMemo(() => {
        const activeContracts = contracts.filter(c => c.status === 'active');
        const cltContracts = activeContracts.filter(c => c.contractType === 'clt');
        const pjContracts = activeContracts.filter(c => c.contractType === 'pj');
        const freelanceContracts = activeContracts.filter(c => c.contractType === 'freelance');
        const internContracts = activeContracts.filter(c => c.contractType === 'intern');

        // Department breakdown
        const deptMap = new Map<string, number>();
        activeContracts.forEach(c => {
            const dept = c.department || 'Sem Departamento';
            deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });
        const departments = Array.from(deptMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Payroll totals
        const totalGross = payroll.reduce((sum, p) => sum + (p.grossAmountCents || 0), 0);
        const totalNet = payroll.reduce((sum, p) => sum + (p.netAmountCents || 0), 0);
        const totalDeductions = payroll.reduce((sum, p) => sum + (p.totalDeductionsCents || 0), 0);
        const avgSalary = activeContracts.length > 0
            ? Math.round(activeContracts.reduce((sum, c) => sum + (c.baseSalaryCents || 0), 0) / activeContracts.length)
            : 0;

        // Payroll by status
        const pendingPayroll = payroll.filter(p => p.status === 'draft' || p.status === 'pending');
        const paidPayroll = payroll.filter(p => p.status === 'paid');
        const approvedPayroll = payroll.filter(p => p.status === 'approved');

        // Payroll by department
        const deptPayroll = new Map<string, number>();
        payroll.forEach(p => {
            const dept = p.department || 'Sem Departamento';
            deptPayroll.set(dept, (deptPayroll.get(dept) || 0) + (p.netAmountCents || 0));
        });
        const departmentCosts = Array.from(deptPayroll.entries())
            .map(([name, totalCents]) => ({ name, totalCents }))
            .sort((a, b) => b.totalCents - a.totalCents);

        return {
            totalActive: activeContracts.length,
            clt: cltContracts.length,
            pj: pjContracts.length,
            freelance: freelanceContracts.length,
            intern: internContracts.length,
            departments,
            totalGross,
            totalNet,
            totalDeductions,
            avgSalary,
            pendingPayroll: pendingPayroll.length,
            paidPayroll: paidPayroll.length,
            approvedPayroll: approvedPayroll.length,
            departmentCosts,
        };
    }, [contracts, payroll]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando relatório de RH...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Relatórios & BI</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>RH & Pessoas</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Relatório de RH</Title>
                        <Group>
                            <Select
                                size="sm"
                                value={period}
                                onChange={(v) => setPeriod(v || 'current')}
                                data={[
                                    { value: 'current', label: 'Mês Atual' },
                                    { value: 'last_month', label: 'Mês Passado' },
                                    { value: 'last_quarter', label: 'Último Trimestre' },
                                    { value: 'year', label: 'Ano' },
                                ]}
                                w={180}
                            />
                            <ExportButton
                                data={contracts}
                                organizationName="NodeZero"
                            />
                        </Group>
                    </Group>
                    <Text c="dimmed" mt="xs">Indicadores de quadro de pessoal, folha de pagamento e custos por departamento.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>
                )}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Colaboradores</Text>
                                <Text size="xl" fw={700}>{stats.totalActive}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconUsers size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Folha Bruta Total</Text>
                                <Text size="xl" fw={700}>{fmt(stats.totalGross)}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconCash size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Folha Líquida</Text>
                                <Text size="xl" fw={700}>{fmt(stats.totalNet)}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="teal">
                                <IconCoin size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Salário Médio</Text>
                                <Text size="xl" fw={700}>{fmt(stats.avgSalary)}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconBriefcase size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {/* Contract Types */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Tipos de Contrato</Text>
                        <Stack gap="sm">
                            {[
                                { label: 'CLT', count: stats.clt, color: 'blue' },
                                { label: 'PJ', count: stats.pj, color: 'green' },
                                { label: 'Freelance', count: stats.freelance, color: 'orange' },
                                { label: 'Estágio', count: stats.intern, color: 'violet' },
                            ].map(t => (
                                <div key={t.label}>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm">{t.label}</Text>
                                        <Group gap={4}>
                                            <Text size="sm" fw={600}>{t.count}</Text>
                                            <Text size="xs" c="dimmed">
                                                ({stats.totalActive > 0 ? Math.round((t.count / stats.totalActive) * 100) : 0}%)
                                            </Text>
                                        </Group>
                                    </Group>
                                    <Progress
                                        value={stats.totalActive > 0 ? (t.count / stats.totalActive) * 100 : 0}
                                        color={t.color}
                                        size="lg"
                                        radius="md"
                                    />
                                </div>
                            ))}
                        </Stack>
                    </Card>

                    {/* Departments */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Quadro por Departamento</Text>
                        {stats.departments.length === 0 ? (
                            <Text c="dimmed" ta="center" py="lg">Nenhum departamento encontrado.</Text>
                        ) : (
                            <Stack gap="sm">
                                {stats.departments.slice(0, 8).map(dept => (
                                    <div key={dept.name}>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">{dept.name}</Text>
                                            <Text size="sm" fw={600}>{dept.count}</Text>
                                        </Group>
                                        <Progress
                                            value={stats.totalActive > 0 ? (dept.count / stats.totalActive) * 100 : 0}
                                            color="blue"
                                            size="lg"
                                            radius="md"
                                        />
                                    </div>
                                ))}
                            </Stack>
                        )}
                    </Card>
                </SimpleGrid>

                {/* Payroll Status */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Status da Folha de Pagamento</Text>
                        <Badge variant="light">{payroll.length} registros</Badge>
                    </Group>
                    <SimpleGrid cols={{ base: 3 }}>
                        <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={40} radius="md" variant="light" color="yellow" mx="auto" mb="sm">
                                <IconClock size={20} />
                            </ThemeIcon>
                            <Text size="xl" fw={700}>{stats.pendingPayroll}</Text>
                            <Text size="sm" c="dimmed">Pendentes</Text>
                        </Paper>
                        <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={40} radius="md" variant="light" color="blue" mx="auto" mb="sm">
                                <IconFileText size={20} />
                            </ThemeIcon>
                            <Text size="xl" fw={700}>{stats.approvedPayroll}</Text>
                            <Text size="sm" c="dimmed">Aprovadas</Text>
                        </Paper>
                        <Paper withBorder p="md" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={40} radius="md" variant="light" color="green" mx="auto" mb="sm">
                                <IconCalendar size={20} />
                            </ThemeIcon>
                            <Text size="xl" fw={700}>{stats.paidPayroll}</Text>
                            <Text size="sm" c="dimmed">Pagas</Text>
                        </Paper>
                    </SimpleGrid>
                </Card>

                {/* Department Costs */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Custo por Departamento</Text>
                    </Group>
                    {stats.departmentCosts.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhum dado de custos disponível.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Departamento</Table.Th>
                                    <Table.Th ta="right">Custo Total (Líquido)</Table.Th>
                                    <Table.Th>% do Total</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {stats.departmentCosts.map(dept => (
                                    <Table.Tr key={dept.name}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{dept.name}</Text>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Text size="sm" fw={600}>{fmt(dept.totalCents)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Progress
                                                    value={stats.totalNet > 0 ? (dept.totalCents / stats.totalNet) * 100 : 0}
                                                    size="lg"
                                                    radius="md"
                                                    color="blue"
                                                    style={{ flex: 1 }}
                                                />
                                                <Text size="xs" fw={600} w={40} ta="right">
                                                    {stats.totalNet > 0 ? Math.round((dept.totalCents / stats.totalNet) * 100) : 0}%
                                                </Text>
                                            </Group>
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
