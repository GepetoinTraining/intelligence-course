'use client';

import { useState } from 'react';
import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Group,
    ThemeIcon,
    Loader,
    Alert,
    Center,
    Button,
    Table,
    Select,
} from '@mantine/core';
import {
    IconChartDonut,
    IconAlertCircle,
    IconArrowUpRight,
    IconArrowDownRight,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface DREItem {
    name: string;
    value: number;
    type: 'header' | 'item' | 'subtotal' | 'total';
}

interface AccountingReport {
    data: {
        dre?: DREItem[];
        [key: string]: unknown;
    };
}

function formatCurrency(reais: number): string {
    return `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function DREPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear().toString());
    const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));

    const { data, isLoading, error, refetch } = useApi<AccountingReport>(
        `/api/reports/financial?period=${year}-${month}&section=accounting`,
    );

    const dreItems = data?.data?.dre || [];

    // Extract totals
    const totalReceita = dreItems.find(i => i.name === 'Total Receita')?.value || 0;
    const totalDespesa = dreItems.find(i => i.name === 'Total Despesas')?.value || 0;
    const resultado = dreItems.find(i => i.type === 'total')?.value || 0;

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
                    <Title order={2}>DRE - Demonstração do Resultado</Title>
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

            <SimpleGrid cols={{ base: 2, sm: 3 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Receitas</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalReceita)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Despesas</Text>
                            <Text fw={700} size="lg">{formatCurrency(Math.abs(totalDespesa))}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={resultado >= 0 ? 'teal' : 'orange'} size="lg">
                            <IconChartDonut size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Resultado</Text>
                            <Text fw={700} size="lg" c={resultado >= 0 ? 'teal' : 'red'}>
                                {formatCurrency(resultado)}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">DRE — {months.find(m => m.value === month)?.label}/{year}</Text>

                {dreItems.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconChartDonut size={48} color="gray" />
                            <Text c="dimmed">Nenhum dado para o período selecionado</Text>
                            <Text c="dimmed" size="xs">Crie lançamentos contábeis para preencher a DRE.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table>
                        <Table.Tbody>
                            {dreItems.map((item, i) => (
                                <Table.Tr
                                    key={i}
                                    style={{
                                        backgroundColor:
                                            item.type === 'header' ? 'var(--mantine-color-default-hover)' :
                                                item.type === 'total' ? 'var(--mantine-color-blue-light)' :
                                                    undefined,
                                    }}
                                >
                                    <Table.Td
                                        style={{
                                            fontWeight: item.type !== 'item' ? 700 : 400,
                                            paddingLeft: item.type === 'item' ? 24 : 16,
                                        }}
                                    >
                                        {item.name}
                                    </Table.Td>
                                    <Table.Td ta="right" style={{
                                        fontWeight: item.type !== 'item' ? 700 : 400,
                                        color: item.type === 'header' ? 'transparent' :
                                            item.value >= 0 ? 'var(--mantine-color-green-text)' :
                                                'var(--mantine-color-red-text)',
                                    }}>
                                        {item.type === 'header' ? '' : formatCurrency(item.value)}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>
        </Stack>
    );
}
