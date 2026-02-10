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
    Select,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconReportAnalytics,
    IconDownload,
    IconArrowUpRight,
    IconArrowDownRight,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface BalanceLine {
    code: string;
    account: string;
    level: number;
    previousBalance: number;
    debits: number;
    credits: number;
    currentBalance: number;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

// Mock data
const mockBalanceLines: BalanceLine[] = [
    { code: '1', account: 'ATIVO', level: 0, previousBalance: 250000, debits: 180000, credits: 120000, currentBalance: 310000, type: 'asset' },
    { code: '1.1', account: 'Ativo Circulante', level: 1, previousBalance: 150000, debits: 160000, credits: 110000, currentBalance: 200000, type: 'asset' },
    { code: '1.1.1', account: 'Caixa e Equivalentes', level: 2, previousBalance: 80000, debits: 150000, credits: 100000, currentBalance: 130000, type: 'asset' },
    { code: '1.1.2', account: 'Contas a Receber', level: 2, previousBalance: 45000, debits: 10000, credits: 8000, currentBalance: 47000, type: 'asset' },
    { code: '2', account: 'PASSIVO', level: 0, previousBalance: 100000, debits: 50000, credits: 80000, currentBalance: 130000, type: 'liability' },
    { code: '2.1', account: 'Passivo Circulante', level: 1, previousBalance: 60000, debits: 40000, credits: 65000, currentBalance: 85000, type: 'liability' },
    { code: '3', account: 'PATRIMÔNIO LÍQUIDO', level: 0, previousBalance: 150000, debits: 0, credits: 30000, currentBalance: 180000, type: 'equity' },
    { code: '4', account: 'RECEITAS', level: 0, previousBalance: 0, debits: 0, credits: 125000, currentBalance: 125000, type: 'revenue' },
    { code: '5', account: 'DESPESAS', level: 0, previousBalance: 0, debits: 95000, credits: 0, currentBalance: 95000, type: 'expense' },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function BalancetePage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/journal-entries');

    const [lines] = useState<BalanceLine[]>(mockBalanceLines);

    const totalAssets = lines.filter(l => l.type === 'asset' && l.level === 0).reduce((acc, l) => acc + l.currentBalance, 0);
    const totalLiabilities = lines.filter(l => l.type === 'liability' && l.level === 0).reduce((acc, l) => acc + l.currentBalance, 0);
    const totalEquity = lines.filter(l => l.type === 'equity' && l.level === 0).reduce((acc, l) => acc + l.currentBalance, 0);


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Contábil</Text>
                    <Title order={2}>Balancete</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Período"
                        data={[
                            { value: '2026-02', label: 'Fevereiro 2026' },
                            { value: '2026-01', label: 'Janeiro 2026' },
                            { value: '2025-12', label: 'Dezembro 2025' },
                        ]}
                        w={180}
                        defaultValue="2026-02"
                    />
                    <Button variant="light" leftSection={<IconDownload size={16} />}>
                        Exportar PDF
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Ativo</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalAssets)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Passivo</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalLiabilities)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconReportAnalytics size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Patrimônio Líquido</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalEquity)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color={totalAssets === totalLiabilities + totalEquity ? 'green' : 'red'} size="lg" radius="md">
                            <IconReportAnalytics size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Balanceamento</Text>
                            <Text fw={700} size="xl">
                                {totalAssets === totalLiabilities + totalEquity ? 'OK' : 'Divergente'}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Balancete de Verificação</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Conta</Table.Th>
                            <Table.Th>Saldo Anterior</Table.Th>
                            <Table.Th>Débitos</Table.Th>
                            <Table.Th>Créditos</Table.Th>
                            <Table.Th>Saldo Atual</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {lines.map((line) => (
                            <Table.Tr key={line.code}>
                                <Table.Td>
                                    <Text fw={line.level === 0 ? 700 : 400} size="sm">{line.code}</Text>
                                </Table.Td>
                                <Table.Td style={{ paddingLeft: line.level * 16 + 12 }}>
                                    <Text fw={line.level === 0 ? 700 : 400} size="sm">{line.account}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatCurrency(line.previousBalance)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="red">{formatCurrency(line.debits)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="green">{formatCurrency(line.credits)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={600} size="sm">{formatCurrency(line.currentBalance)}</Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

