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
    ActionIcon,
    Menu,
    Tabs,
    Select,
    Loader,
    Alert,
    Center,
    Modal,
    Stack,
    TextInput,
    Textarea,
    NumberInput,
} from '@mantine/core';
import {
    IconReceipt2,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconArrowUpRight,
    IconArrowDownRight,
    IconTrash,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface JournalEntry {
    id: string;
    entryNumber: number;
    referenceDate: number;
    postingDate: number | null;
    fiscalYear: number;
    fiscalMonth: number;
    description: string;
    memo: string | null;
    sourceType: string;
    status: string;
    createdBy: string | null;
}

const statusColors: Record<string, string> = {
    draft: 'yellow',
    posted: 'green',
    reversed: 'red',
    voided: 'gray',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    posted: 'Lançado',
    reversed: 'Estornado',
    voided: 'Anulado',
};

const sourceLabels: Record<string, string> = {
    manual: 'Manual',
    invoice: 'Fatura',
    payroll: 'Folha',
    payable: 'Despesa',
    transfer: 'Transferência',
    closing: 'Fechamento',
};

function formatCurrency(cents: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('pt-BR');
}

export default function LancamentosPage() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear().toString());
    const [month, setMonth] = useState((now.getMonth() + 1).toString());

    const { data, isLoading, error, refetch } = useApi<{ data: JournalEntry[] }>(
        `/api/journal-entries?year=${year}&month=${month}&limit=100`,
    );

    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [createOpen, createHandlers] = useDisclosure(false);

    // Create form
    const [description, setDescription] = useState('');
    const [debitAccountId, setDebitAccountId] = useState('');
    const [creditAccountId, setCreditAccountId] = useState('');
    const [amountCents, setAmountCents] = useState<number | string>('');
    const [creating, setCreating] = useState(false);

    // Accounts for select
    const { data: accountsData } = useApi<{ data: any[] }>('/api/chart-of-accounts');
    const accounts = accountsData?.data || [];

    const entries = data?.data || [];

    const filtered = activeTab === 'all'
        ? entries
        : entries.filter(e => e.status === activeTab);

    const totalEntries = entries.length;
    const postedCount = entries.filter(e => e.status === 'posted').length;
    const draftCount = entries.filter(e => e.status === 'draft').length;

    const months = [
        { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
        { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
        { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
        { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
        { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
    ];

    const handleCreate = async () => {
        if (!description.trim() || !debitAccountId || !creditAccountId || !amountCents) return;
        setCreating(true);
        try {
            const res = await fetch('/api/journal-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    referenceDate: Date.now(),
                    fiscalYear: parseInt(year),
                    fiscalMonth: parseInt(month),
                    autoPost: false,
                    lines: [
                        { accountId: debitAccountId, entryType: 'debit', amountCents: Number(amountCents) },
                        { accountId: creditAccountId, entryType: 'credit', amountCents: Number(amountCents) },
                    ],
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erro ao criar');
            }
            refetch();
            createHandlers.close();
            setDescription('');
            setDebitAccountId('');
            setCreditAccountId('');
            setAmountCents('');
            notifications.show({ title: 'Criado', message: 'Lançamento criado com sucesso', color: 'green' });
        } catch (err: any) {
            notifications.show({ title: 'Erro', message: err.message || 'Erro ao criar lançamento', color: 'red' });
        } finally {
            setCreating(false);
        }
    };

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
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Contábil</Text>
                    <Title order={2}>Lançamentos</Title>
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
                    <Button leftSection={<IconPlus size={16} />} onClick={createHandlers.open}>
                        Novo Lançamento
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconReceipt2 size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Lançamentos</Text>
                            <Text fw={700} size="xl">{totalEntries}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Escriturados</Text>
                            <Text fw={700} size="xl">{postedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="yellow" size="lg" radius="md">
                            <IconReceipt2 size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Rascunhos</Text>
                            <Text fw={700} size="xl">{draftCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Período</Text>
                            <Text fw={700} size="xl">{months.find(m => m.value === month)?.label.slice(0, 3)}/{year}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="all">Todos ({totalEntries})</Tabs.Tab>
                        <Tabs.Tab value="posted">Lançados ({postedCount})</Tabs.Tab>
                        <Tabs.Tab value="draft">Rascunhos ({draftCount})</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                {filtered.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconReceipt2 size={48} color="gray" />
                            <Text c="dimmed">Nenhum lançamento neste período</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nº</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Origem</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map((entry) => (
                                <Table.Tr key={entry.id}>
                                    <Table.Td>
                                        <Text fw={500} ff="monospace">{entry.entryNumber}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatDate(entry.referenceDate)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" truncate style={{ maxWidth: 300 }}>{entry.description}</Text>
                                        {entry.memo && <Text size="xs" c="dimmed" lineClamp={1}>{entry.memo}</Text>}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge size="sm" variant="light" color={entry.sourceType === 'manual' ? 'blue' : 'grape'}>
                                            {sourceLabels[entry.sourceType] || entry.sourceType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={statusColors[entry.status] || 'gray'} variant="light">
                                            {statusLabels[entry.status] || entry.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item leftSection={<IconTrash size={14} />} color="red">Estornar</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Create Modal */}
            <Modal opened={createOpen} onClose={createHandlers.close} title="Novo Lançamento" size="lg">
                <Stack gap="md">
                    <Textarea
                        label="Descrição"
                        placeholder="Descrição do lançamento"
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        required
                    />
                    <Select
                        label="Conta Débito"
                        placeholder="Selecionar conta"
                        data={accounts.map((a: any) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                        value={debitAccountId}
                        onChange={(v) => setDebitAccountId(v || '')}
                        searchable
                        required
                    />
                    <Select
                        label="Conta Crédito"
                        placeholder="Selecionar conta"
                        data={accounts.map((a: any) => ({ value: a.id, label: `${a.code} - ${a.name}` }))}
                        value={creditAccountId}
                        onChange={(v) => setCreditAccountId(v || '')}
                        searchable
                        required
                    />
                    <NumberInput
                        label="Valor (centavos)"
                        placeholder="Ex: 150000 (= R$ 1.500,00)"
                        value={amountCents}
                        onChange={setAmountCents}
                        min={1}
                        required
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={createHandlers.close}>Cancelar</Button>
                        <Button
                            onClick={handleCreate}
                            loading={creating}
                            disabled={!description.trim() || !debitAccountId || !creditAccountId || !amountCents}
                        >
                            Criar Lançamento
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
}
