'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    SimpleGrid, ThemeIcon, Table, Paper, Select, Loader, Center,
    Progress, RingProgress, SegmentedControl, Tooltip,
} from '@mantine/core';
import {
    IconCurrencyReal, IconTrendingUp, IconTrendingDown,
    IconReceipt, IconUsers, IconChartBar, IconCalendar,
    IconCreditCard, IconCash, IconAlertTriangle,
    IconArrowUpRight, IconArrowDownRight,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

// ============================================================================
// TYPES
// ============================================================================

interface RevenueItem {
    name: string;
    revenue: number;
    students: number;
    percentage: number;
    color: string;
}

interface PaymentMethod {
    method: string;
    count: number;
    total: number;
    percentage: number;
}

interface Defaulter {
    studentName: string;
    email: string;
    amount: number;
    dueDate: number;
    daysPastDue: number;
}

interface TeacherCost {
    teacherName: string;
    email: string;
    hoursPerWeek: number;
    monthlyCost: number;
}

// ============================================================================
// PAGE
// ============================================================================

export default function RelatorioFinanceiroPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [data, setData] = useState<Record<string, any>>({});

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/reports/financial?period=${period}&section=all`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Error fetching financial report:', err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);

    const formatDate = (ts: number) =>
        new Date(ts * 1000).toLocaleDateString('pt-BR');

    const revenueByCourse: RevenueItem[] = data.revenueByCourse || [];
    const totalRevenue = data.totalRevenue || 0;
    const paymentMethods: PaymentMethod[] = data.paymentMethods || [];
    const defaulters: Defaulter[] = data.defaulters || [];
    const teacherCosts: TeacherCost[] = data.teacherCosts || [];
    const totalTeacherCosts = data.totalTeacherCosts || 0;

    // Period selection
    const periodOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        periodOptions.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Relatórios & BI</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Relatório Financeiro</Text>
                    </Group>
                    <Group justify="space-between" align="flex-end">
                        <div>
                            <Title order={1}>Relatório Financeiro</Title>
                            <Text c="dimmed" mt="xs">Análise financeira com receitas, despesas e inadimplência.</Text>
                        </div>
                        <Group>
                            <Select
                                value={period}
                                onChange={(v) => v && setPeriod(v)}
                                data={periodOptions}
                                leftSection={<IconCalendar size={16} />}
                                w={220}
                            />
                            <ExportButton
                                data={revenueByCourse.map(r => ({
                                    curso: r.name,
                                    receita: formatCurrency(r.revenue),
                                    alunos: r.students,
                                    percentual: `${r.percentage}%`,
                                }))}
                                columns={[
                                    { key: 'curso', label: 'Curso' },
                                    { key: 'receita', label: 'Receita' },
                                    { key: 'alunos', label: 'Alunos' },
                                    { key: 'percentual', label: '%' },
                                ]}
                                title="Relatório Financeiro"
                                filename={`relatorio_financeiro_${period}`}
                                formats={['csv', 'xlsx', 'pdf']}
                                label="Exportar"
                            />
                        </Group>
                    </Group>
                </div>

                {loading ? (
                    <Center py="xl"><Loader size="lg" /></Center>
                ) : (
                    <>
                        {/* Summary cards */}
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={44} radius="md" variant="light" color="green">
                                        <IconTrendingUp size={22} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Receita Total</Text>
                                        <Text size="xl" fw={700}>{formatCurrency(totalRevenue)}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={44} radius="md" variant="light" color="red">
                                        <IconTrendingDown size={22} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Custo Docente</Text>
                                        <Text size="xl" fw={700}>{formatCurrency(totalTeacherCosts)}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={44} radius="md" variant="light" color="orange">
                                        <IconAlertTriangle size={22} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Inadimplentes</Text>
                                        <Text size="xl" fw={700}>{defaulters.length}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={44} radius="md" variant="light" color="blue">
                                        <IconReceipt size={22} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Cursos Ativos</Text>
                                        <Text size="xl" fw={700}>{revenueByCourse.length}</Text>
                                    </div>
                                </Group>
                            </Card>
                        </SimpleGrid>

                        {/* Revenue by course */}
                        <Card withBorder radius="md" p="lg">
                            <Title order={4} mb="md">Receita por Curso</Title>
                            {revenueByCourse.length === 0 ? (
                                <Text c="dimmed" ta="center" py="md">Nenhuma receita registrada neste período</Text>
                            ) : (
                                <Stack gap="sm">
                                    {revenueByCourse.map((item, i) => (
                                        <div key={i}>
                                            <Group justify="space-between" mb={4}>
                                                <Group gap="xs">
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                                    <Text size="sm" fw={500}>{item.name}</Text>
                                                    <Badge variant="light" size="xs">{item.students} alunos</Badge>
                                                </Group>
                                                <Group gap="xs">
                                                    <Text size="sm" fw={600}>{formatCurrency(item.revenue)}</Text>
                                                    <Text size="xs" c="dimmed">({item.percentage}%)</Text>
                                                </Group>
                                            </Group>
                                            <Progress value={item.percentage} color={item.color} size="sm" radius="xl" />
                                        </div>
                                    ))}
                                </Stack>
                            )}
                        </Card>

                        {/* Payment methods + Defaulters side by side */}
                        <SimpleGrid cols={{ base: 1, md: 2 }}>
                            {/* Payment methods */}
                            <Card withBorder radius="md" p="lg">
                                <Title order={4} mb="md">Métodos de Pagamento</Title>
                                {paymentMethods.length === 0 ? (
                                    <Text c="dimmed" ta="center" py="md">Sem dados</Text>
                                ) : (
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Método</Table.Th>
                                                <Table.Th>Qtd</Table.Th>
                                                <Table.Th>Total</Table.Th>
                                                <Table.Th>%</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {paymentMethods.map((pm, i) => (
                                                <Table.Tr key={i}>
                                                    <Table.Td>
                                                        <Group gap="xs">
                                                            <IconCreditCard size={14} />
                                                            <Text size="sm">{pm.method}</Text>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td><Text size="sm">{pm.count}</Text></Table.Td>
                                                    <Table.Td><Text size="sm" fw={500}>{formatCurrency(pm.total)}</Text></Table.Td>
                                                    <Table.Td><Badge variant="light" size="xs">{pm.percentage}%</Badge></Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                )}
                            </Card>

                            {/* Defaulters */}
                            <Card withBorder radius="md" p="lg">
                                <Group justify="space-between" mb="md">
                                    <Title order={4}>Inadimplentes</Title>
                                    {defaulters.length > 0 && (
                                        <Badge color="red" variant="light">{defaulters.length}</Badge>
                                    )}
                                </Group>
                                {defaulters.length === 0 ? (
                                    <Paper p="lg" radius="md" bg="green.0" style={{ textAlign: 'center' }}>
                                        <Text c="green.8" fw={500}>Nenhum inadimplente! 🎉</Text>
                                    </Paper>
                                ) : (
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Aluno</Table.Th>
                                                <Table.Th>Valor</Table.Th>
                                                <Table.Th>Dias</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {defaulters.slice(0, 10).map((d, i) => (
                                                <Table.Tr key={i}>
                                                    <Table.Td>
                                                        <Text size="sm" fw={500}>{d.studentName}</Text>
                                                        <Text size="xs" c="dimmed">{d.email}</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" fw={500} c="red">
                                                            {formatCurrency(d.amount)}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge
                                                            variant="light"
                                                            color={d.daysPastDue > 30 ? 'red' : 'orange'}
                                                            size="sm"
                                                        >
                                                            {d.daysPastDue}d
                                                        </Badge>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                )}
                            </Card>
                        </SimpleGrid>

                        {/* Teacher costs */}
                        <Card withBorder radius="md" p="lg">
                            <Title order={4} mb="md">Custo por Professor</Title>
                            {teacherCosts.length === 0 ? (
                                <Text c="dimmed" ta="center" py="md">Sem dados de custo docente</Text>
                            ) : (
                                <Table>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Professor</Table.Th>
                                            <Table.Th>Horas/Sem</Table.Th>
                                            <Table.Th>Custo Mensal</Table.Th>
                                            <Table.Th>% do Total</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {teacherCosts.map((tc, i) => (
                                            <Table.Tr key={i}>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>{tc.teacherName}</Text>
                                                    <Text size="xs" c="dimmed">{tc.email}</Text>
                                                </Table.Td>
                                                <Table.Td><Text size="sm">{tc.hoursPerWeek}h</Text></Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>{formatCurrency(tc.monthlyCost)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="light" size="sm">
                                                        {totalTeacherCosts > 0
                                                            ? Math.round((tc.monthlyCost / totalTeacherCosts) * 100)
                                                            : 0}%
                                                    </Badge>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Card>
                    </>
                )}
            </Stack>
        </Container>
    );
}
