'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    SimpleGrid,
    ThemeIcon,
    Select,
    Loader,
    Alert,
    Center,
    Stack,
} from '@mantine/core';
import {
    IconReportAnalytics,
    IconAlertCircle,
    IconArrowUpRight,
    IconArrowDownRight,
    IconEqual,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@mantine/core';

interface BalanceteLine {
    code: string;
    name: string;
    type: 'group' | 'subgroup' | 'account';
    balance: number;
    debit: number;
    credit: number;
}

interface AccountingReport {
    data: {
        balancete?: BalanceteLine[];
        [key: string]: unknown;
    };
}

function formatCurrency(reais: number): string {
    return `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function BalancetePage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear().toString());
    const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));

    const { data, isLoading, error, refetch } = useApi<AccountingReport>(
        `/api/reports/financial?period=${year}-${month}&section=accounting`,
    );

    const lines = data?.data?.balancete || [];

    const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
    const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);

    const months = [
        { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
        { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
    ];

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <div>
                    <Text size="sm" c="dimmed">Contábil</Text>
                    <Title order={2}>Balancete de Verificação</Title>
                </div>
                <Group>
                    <Select
                        value={month}
                        onChange={(v) => v && setMonth(v)}
                        data={months}
                        w={140}
                    />
                    <Select
                        value={year}
                        onChange={(v) => v && setYear(v)}
                        data={['2024', '2025', '2026'].map(y => ({ value: y, label: y }))}
                        w={100}
                    />
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xs">
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Débitos</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalDebit)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Créditos</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalCredit)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={totalDebit === totalCredit ? 'green' : 'red'} size="lg">
                            <IconEqual size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Diferença</Text>
                            <Text fw={700} size="lg" c={totalDebit === totalCredit ? 'green' : 'red'}>
                                {formatCurrency(Math.abs(totalDebit - totalCredit))}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Contas — {months.find(m => m.value === month)?.label}/{year}</Text>
                    <Badge variant="light">{lines.length} contas</Badge>
                </Group>

                {lines.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconReportAnalytics size={48} color="gray" />
                            <Text c="dimmed">Sem movimentação no período selecionado</Text>
                            <Text c="dimmed" size="xs">Lançamentos escriturados aparecem aqui.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Código</Table.Th>
                                <Table.Th>Conta</Table.Th>
                                <Table.Th ta="right">Débito</Table.Th>
                                <Table.Th ta="right">Crédito</Table.Th>
                                <Table.Th ta="right">Saldo</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {lines.map((line) => (
                                <Table.Tr
                                    key={line.code}
                                    style={{
                                        fontWeight: line.type === 'group' ? 700 : line.type === 'subgroup' ? 600 : 400,
                                        backgroundColor: line.type === 'group' ? 'var(--mantine-color-default-hover)' : undefined,
                                    }}
                                >
                                    <Table.Td>
                                        <Text ff="monospace" size="sm">{line.code}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" pl={line.type === 'account' ? 'md' : line.type === 'subgroup' ? 'xs' : 0}>
                                            {line.name}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <Text size="sm">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</Text>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <Text size="sm">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</Text>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <Text size="sm" fw={500} c={line.balance >= 0 ? 'green' : 'red'}>
                                            {formatCurrency(Math.abs(line.balance))}
                                            {line.balance < 0 ? ' C' : line.balance > 0 ? ' D' : ''}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                            {/* Totals row */}
                            <Table.Tr style={{ fontWeight: 700, borderTop: '2px solid var(--mantine-color-default-border)' }}>
                                <Table.Td colSpan={2}>
                                    <Text fw={700}>TOTAL</Text>
                                </Table.Td>
                                <Table.Td ta="right">
                                    <Text fw={700}>{formatCurrency(totalDebit)}</Text>
                                </Table.Td>
                                <Table.Td ta="right">
                                    <Text fw={700}>{formatCurrency(totalCredit)}</Text>
                                </Table.Td>
                                <Table.Td ta="right">
                                    <Text fw={700} c={totalDebit === totalCredit ? 'green' : 'red'}>
                                        {formatCurrency(Math.abs(totalDebit - totalCredit))}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                )}
            </Card>
        </Stack>
    );
}
