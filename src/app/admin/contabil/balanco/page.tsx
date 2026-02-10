'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, SimpleGrid,
    ThemeIcon, Table, Paper, Select, Loader, Center,
    Badge, Divider,
} from '@mantine/core';
import {
    IconScale, IconTrendingUp, IconTrendingDown,
    IconCalendar, IconCurrencyReal, IconBuildingBank,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface LineItem {
    name: string;
    value: number;
}

interface BalancoData {
    ativo: { circulante: LineItem[]; naoCirculante: LineItem[] };
    passivo: { circulante: LineItem[]; naoCirculante: LineItem[] };
    patrimonioLiquido: LineItem[];
}

// ============================================================================
// PAGE
// ============================================================================

export default function BalancoPatrimonialPage() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [balanco, setBalanco] = useState<BalancoData | null>(null);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const sumItems = (items: LineItem[]) => items.reduce((s, i) => s + i.value, 0);

    const totalAtivo = balanco
        ? sumItems(balanco.ativo.circulante) + sumItems(balanco.ativo.naoCirculante)
        : 0;

    const totalPassivo = balanco
        ? sumItems(balanco.passivo.circulante) + sumItems(balanco.passivo.naoCirculante)
        : 0;

    const totalPL = balanco ? sumItems(balanco.patrimonioLiquido) : 0;

    // Period options
    const periodOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        periodOptions.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }

    const renderSection = (title: string, items: LineItem[], color: string) => (
        <div>
            <Text size="sm" fw={600} c={color} tt="uppercase" mb="xs">{title}</Text>
            {items.length === 0 ? (
                <Text size="sm" c="dimmed" ml="md">Nenhuma conta registrada</Text>
            ) : (
                <Table withRowBorders={false}>
                    <Table.Tbody>
                        {items.map((item, i) => (
                            <Table.Tr key={i}>
                                <Table.Td>
                                    <Text size="sm">{item.name}</Text>
                                </Table.Td>
                                <Table.Td style={{ textAlign: 'right' }}>
                                    <Text size="sm" fw={500} c={item.value < 0 ? 'red' : undefined}>
                                        {formatCurrency(item.value)}
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </div>
    );

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Contábil</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Balanço Patrimonial</Text>
                    </Group>
                    <Group justify="space-between" align="flex-end">
                        <div>
                            <Title order={1}>Balanço Patrimonial</Title>
                            <Text c="dimmed" mt="xs">Ativos, passivos e patrimônio líquido acumulados.</Text>
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
                                data={[
                                    ...(balanco?.ativo.circulante || []).map(i => ({ grupo: 'Ativo Circulante', conta: i.name, valor: formatCurrency(i.value) })),
                                    ...(balanco?.ativo.naoCirculante || []).map(i => ({ grupo: 'Ativo Não Circulante', conta: i.name, valor: formatCurrency(i.value) })),
                                    ...(balanco?.passivo.circulante || []).map(i => ({ grupo: 'Passivo Circulante', conta: i.name, valor: formatCurrency(i.value) })),
                                    ...(balanco?.passivo.naoCirculante || []).map(i => ({ grupo: 'Passivo Não Circulante', conta: i.name, valor: formatCurrency(i.value) })),
                                    ...(balanco?.patrimonioLiquido || []).map(i => ({ grupo: 'Patrimônio Líquido', conta: i.name, valor: formatCurrency(i.value) })),
                                ]}
                                columns={[
                                    { key: 'grupo', label: 'Grupo' },
                                    { key: 'conta', label: 'Conta' },
                                    { key: 'valor', label: 'Valor' },
                                ]}
                                title="Balanço Patrimonial"
                                filename={`balanco_patrimonial_${period}`}
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
                        {/* Summary */}
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={44} radius="md" variant="light" color="blue">
                                        <IconTrendingUp size={22} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Ativo</Text>
                                        <Text size="xl" fw={700}>{formatCurrency(totalAtivo)}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={44} radius="md" variant="light" color="red">
                                        <IconTrendingDown size={22} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Passivo</Text>
                                        <Text size="xl" fw={700}>{formatCurrency(totalPassivo)}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={44} radius="md" variant="light" color="green">
                                        <IconScale size={22} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Patr. Líquido</Text>
                                        <Text size="xl" fw={700} c={totalPL >= 0 ? 'green' : 'red'}>
                                            {formatCurrency(totalPL)}
                                        </Text>
                                    </div>
                                </Group>
                            </Card>
                        </SimpleGrid>

                        {/* Balance sheet */}
                        <SimpleGrid cols={{ base: 1, md: 2 }}>
                            {/* Left: Assets */}
                            <Card withBorder radius="md" p="lg">
                                <Group gap="sm" mb="lg">
                                    <ThemeIcon size={32} radius="md" variant="light" color="blue">
                                        <IconBuildingBank size={16} />
                                    </ThemeIcon>
                                    <Title order={4}>ATIVO</Title>
                                </Group>

                                {renderSection('Ativo Circulante', balanco?.ativo.circulante || [], 'blue.6')}
                                <Divider my="sm" />
                                {renderSection('Ativo Não Circulante', balanco?.ativo.naoCirculante || [], 'blue.4')}

                                <Divider my="md" />
                                <Group justify="space-between">
                                    <Text fw={700}>TOTAL DO ATIVO</Text>
                                    <Text fw={700} size="lg">{formatCurrency(totalAtivo)}</Text>
                                </Group>
                            </Card>

                            {/* Right: Liabilities + Equity */}
                            <Card withBorder radius="md" p="lg">
                                <Group gap="sm" mb="lg">
                                    <ThemeIcon size={32} radius="md" variant="light" color="red">
                                        <IconCurrencyReal size={16} />
                                    </ThemeIcon>
                                    <Title order={4}>PASSIVO + PL</Title>
                                </Group>

                                {renderSection('Passivo Circulante', balanco?.passivo.circulante || [], 'red.6')}
                                <Divider my="sm" />
                                {renderSection('Passivo Não Circulante', balanco?.passivo.naoCirculante || [], 'red.4')}
                                <Divider my="sm" />
                                {renderSection('Patrimônio Líquido', balanco?.patrimonioLiquido || [], 'green.6')}

                                <Divider my="md" />
                                <Group justify="space-between">
                                    <Text fw={700}>TOTAL PASSIVO + PL</Text>
                                    <Text fw={700} size="lg">{formatCurrency(totalPassivo + totalPL)}</Text>
                                </Group>
                            </Card>
                        </SimpleGrid>

                        {/* Equation check */}
                        {!loading && balanco && (
                            <Paper withBorder p="md" radius="md" bg={
                                Math.abs(totalAtivo - (totalPassivo + totalPL)) < 0.01 ? 'green.0' : 'red.0'
                            }>
                                <Group justify="center" gap="xs">
                                    <Text fw={500}>
                                        Ativo ({formatCurrency(totalAtivo)}) = Passivo + PL ({formatCurrency(totalPassivo + totalPL)})
                                    </Text>
                                    <Badge
                                        color={Math.abs(totalAtivo - (totalPassivo + totalPL)) < 0.01 ? 'green' : 'red'}
                                        variant="light"
                                    >
                                        {Math.abs(totalAtivo - (totalPassivo + totalPL)) < 0.01 ? '✓ Equilibrado' : '✗ Desequilibrado'}
                                    </Badge>
                                </Group>
                            </Paper>
                        )}
                    </>
                )}
            </Stack>
        </Container>
    );
}
