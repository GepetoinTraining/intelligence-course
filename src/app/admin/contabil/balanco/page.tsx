'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    SimpleGrid,
    ThemeIcon,
    Loader,
    Alert,
    Center,
    Stack,
    Button,
    Table,
    Select,
    Divider,
} from '@mantine/core';
import {
    IconScale,
    IconArrowUpRight,
    IconArrowDownRight,
    IconAlertCircle,
    IconBuildingBank,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface BalancoItem {
    name: string;
    value: number;
}

interface BalancoData {
    ativo: {
        circulante: BalancoItem[];
        naoCirculante: BalancoItem[];
    };
    passivo: {
        circulante: BalancoItem[];
        naoCirculante: BalancoItem[];
    };
    patrimonioLiquido: BalancoItem[];
}

interface AccountingReport {
    data: {
        balanco?: BalancoData;
        [key: string]: unknown;
    };
}

function formatCurrency(reais: number): string {
    return `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function sumItems(items: BalancoItem[]): number {
    return items.reduce((acc, i) => acc + i.value, 0);
}

function renderSection(title: string, items: BalancoItem[]) {
    const total = sumItems(items);
    return (
        <>
            <Table.Tr style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}>
                <Table.Td><Text fw={700} size="sm">{title}</Text></Table.Td>
                <Table.Td ta="right"><Text fw={700} size="sm">{formatCurrency(total)}</Text></Table.Td>
            </Table.Tr>
            {items.map((item, i) => (
                <Table.Tr key={i}>
                    <Table.Td pl="lg"><Text size="sm">{item.name}</Text></Table.Td>
                    <Table.Td ta="right"><Text size="sm">{formatCurrency(item.value)}</Text></Table.Td>
                </Table.Tr>
            ))}
        </>
    );
}

export default function BalancoPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear().toString());
    const [month, setMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));

    const { data, isLoading, error, refetch } = useApi<AccountingReport>(
        `/api/reports/financial?period=${year}-${month}&section=accounting`,
    );

    const balanco = data?.data?.balanco;

    const totalAtivo = balanco
        ? sumItems(balanco.ativo.circulante) + sumItems(balanco.ativo.naoCirculante)
        : 0;
    const totalPassivo = balanco
        ? sumItems(balanco.passivo.circulante) + sumItems(balanco.passivo.naoCirculante)
        : 0;
    const totalPL = balanco ? sumItems(balanco.patrimonioLiquido) : 0;
    const totalPassivoPL = totalPassivo + totalPL;

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

    const hasData = balanco && (
        balanco.ativo.circulante.length > 0 ||
        balanco.ativo.naoCirculante.length > 0 ||
        balanco.passivo.circulante.length > 0 ||
        balanco.passivo.naoCirculante.length > 0 ||
        balanco.patrimonioLiquido.length > 0
    );

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <div>
                    <Text size="sm" c="dimmed">Contábil</Text>
                    <Title order={2}>Balanço Patrimonial</Title>
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
                            <Text size="xs" c="dimmed">Total Ativo</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalAtivo)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Passivo + PL</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalPassivoPL)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={totalAtivo === totalPassivoPL ? 'green' : 'red'} size="lg">
                            <IconScale size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Equilíbrio</Text>
                            <Text fw={700} size="lg" c={totalAtivo === totalPassivoPL ? 'green' : 'red'}>
                                {totalAtivo === totalPassivoPL ? 'Balanceado ✓' : 'Desbalanceado!'}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {!hasData ? (
                <Card withBorder p="xl">
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBuildingBank size={48} color="gray" />
                            <Text c="dimmed">Sem dados de balanço para o período selecionado</Text>
                            <Text c="dimmed" size="xs">Lançamentos escriturados em contas patrimoniais aparecem aqui.</Text>
                        </Stack>
                    </Center>
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {/* ATIVO */}
                    <Card withBorder p="md">
                        <Text fw={700} size="lg" mb="md" c="blue">ATIVO</Text>
                        <Table>
                            <Table.Tbody>
                                {renderSection('Ativo Circulante', balanco!.ativo.circulante)}
                                {renderSection('Ativo Não Circulante', balanco!.ativo.naoCirculante)}
                                <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-blue-filled)' }}>
                                    <Table.Td><Text fw={700}>TOTAL ATIVO</Text></Table.Td>
                                    <Table.Td ta="right"><Text fw={700} size="lg">{formatCurrency(totalAtivo)}</Text></Table.Td>
                                </Table.Tr>
                            </Table.Tbody>
                        </Table>
                    </Card>

                    {/* PASSIVO + PL */}
                    <Card withBorder p="md">
                        <Text fw={700} size="lg" mb="md" c="red">PASSIVO + PATRIMÔNIO LÍQUIDO</Text>
                        <Table>
                            <Table.Tbody>
                                {renderSection('Passivo Circulante', balanco!.passivo.circulante)}
                                {renderSection('Passivo Não Circulante', balanco!.passivo.naoCirculante)}
                                {renderSection('Patrimônio Líquido', balanco!.patrimonioLiquido)}
                                <Table.Tr style={{ borderTop: '2px solid var(--mantine-color-red-filled)' }}>
                                    <Table.Td><Text fw={700}>TOTAL PASSIVO + PL</Text></Table.Td>
                                    <Table.Td ta="right"><Text fw={700} size="lg">{formatCurrency(totalPassivoPL)}</Text></Table.Td>
                                </Table.Tr>
                            </Table.Tbody>
                        </Table>
                    </Card>
                </SimpleGrid>
            )}
        </Stack>
    );
}
