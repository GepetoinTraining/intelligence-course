'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Center,
} from '@mantine/core';
import {
    IconAlertCircle, IconCalculator, IconReceipt, IconBook,
    IconCalendarStats, IconCash, IconArrowUp, IconArrowDown,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface JournalEntry {
    id: string;
    entryNumber: number;
    referenceDate: number;
    postingDate?: number;
    fiscalYear: number;
    fiscalMonth: number;
    description: string;
    memo?: string;
    sourceType: string;
    status: string;
    createdBy?: string;
}

interface FinancialReport {
    totalRevenue?: number;
    totalExpenses?: number;
    netIncome?: number;
    revenueBySource?: Array<{ source: string; amount: number }>;
    [key: string]: unknown;
}

export default function ContadorPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [financialData, setFinancialData] = useState<FinancialReport>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [entriesRes, financialRes] = await Promise.all([
                fetch(`/api/journal-entries?year=${year}&month=${month}&limit=100`),
                fetch(`/api/reports/financial?period=month`),
            ]);

            if (entriesRes.ok) {
                const eData = await entriesRes.json();
                setEntries(eData.data || []);
            }
            if (financialRes.ok) {
                const fData = await financialRes.json();
                setFinancialData(fData);
            }
        } catch (err) {
            setError('Falha ao carregar dados contábeis');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (cents: number) => `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const fmtDate = (ts: number) => ts ? new Date(ts).toLocaleDateString('pt-BR') : '—';

    const stats = useMemo(() => {
        const posted = entries.filter(e => e.status === 'posted');
        const draft = entries.filter(e => e.status === 'draft');
        const manual = entries.filter(e => e.sourceType === 'manual');
        const automatic = entries.filter(e => e.sourceType !== 'manual');

        return {
            total: entries.length,
            posted: posted.length,
            draft: draft.length,
            manual: manual.length,
            automatic: automatic.length,
        };
    }, [entries]);

    const months = [
        { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
        { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
        { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
        { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
        { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
    ];

    const SOURCE_LABELS: Record<string, string> = {
        manual: 'Manual',
        invoice: 'Fatura',
        payroll: 'Folha',
        payable: 'Despesa',
        transfer: 'Transferência',
        closing: 'Fechamento',
    };

    if (loading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Contábil</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Portal do Contador</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Portal do Contador</Title>
                        <Group>
                            <Select
                                size="sm"
                                value={month}
                                onChange={(v) => setMonth(v || '1')}
                                data={months}
                                w={140}
                            />
                            <Select
                                size="sm"
                                value={year}
                                onChange={(v) => setYear(v || '2026')}
                                data={['2024', '2025', '2026'].map(y => ({ value: y, label: y }))}
                                w={100}
                            />
                            <ExportButton
                                data={entries}
                                organizationName="NodeZero"
                            />
                        </Group>
                    </Group>
                    <Text c="dimmed" mt="xs">Lançamentos contábeis, DRE resumida e controle da escrituração fiscal.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>
                )}

                {/* DRE Summary */}
                <SimpleGrid cols={{ base: 1, md: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Receita</Text>
                                <Text size="xl" fw={700} c="green">
                                    {fmt(financialData.totalRevenue || 0)}
                                </Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconArrowUp size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Despesas</Text>
                                <Text size="xl" fw={700} c="red">
                                    {fmt(financialData.totalExpenses || 0)}
                                </Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="red">
                                <IconArrowDown size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Resultado</Text>
                                <Text size="xl" fw={700} c={(financialData.netIncome || 0) >= 0 ? 'green' : 'red'}>
                                    {fmt(financialData.netIncome || 0)}
                                </Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconCash size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Journal Entry Stats */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Lançamentos</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconBook size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Escriturados</Text>
                                <Text size="xl" fw={700}>{stats.posted}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconReceipt size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Rascunhos</Text>
                                <Text size="xl" fw={700} c={stats.draft > 0 ? 'yellow' : undefined}>{stats.draft}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="yellow">
                                <IconCalendarStats size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Automáticos</Text>
                                <Text size="xl" fw={700}>{stats.automatic}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconCalculator size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Journal Entries Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Diário Contábil — {months.find(m => m.value === month)?.label}/{year}</Text>
                        <Badge variant="light">{entries.length} lançamentos</Badge>
                    </Group>
                    {entries.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhum lançamento neste período.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Nº</Table.Th>
                                    <Table.Th>Data</Table.Th>
                                    <Table.Th>Descrição</Table.Th>
                                    <Table.Th>Origem</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {entries.slice(0, 50).map(entry => (
                                    <Table.Tr key={entry.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={600} ff="monospace">{entry.entryNumber}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{fmtDate(entry.referenceDate)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500} lineClamp={1}>{entry.description || '—'}</Text>
                                            {entry.memo && <Text size="xs" c="dimmed" lineClamp={1}>{entry.memo}</Text>}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="light" color={entry.sourceType === 'manual' ? 'blue' : 'grape'}>
                                                {SOURCE_LABELS[entry.sourceType] || entry.sourceType}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={entry.status === 'posted' ? 'green' : entry.status === 'draft' ? 'yellow' : 'gray'}
                                            >
                                                {entry.status === 'posted' ? 'Escriturado' : entry.status === 'draft' ? 'Rascunho' : entry.status}
                                            </Badge>
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
