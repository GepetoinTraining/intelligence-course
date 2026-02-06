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
} from '@tabler/icons-react';

interface JournalEntry {
    id: string;
    number: string;
    date: string;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    type: 'debit' | 'credit';
    status: 'draft' | 'posted' | 'reversed';
    createdBy: string;
}

// Mock data
const mockEntries: JournalEntry[] = [
    { id: '1', number: 'LAN-2026-001', date: '2026-02-05', description: 'Receita de mensalidades', debitAccount: '1.1.1 Caixa', creditAccount: '4.1.1 Receitas', amount: 15000, type: 'credit', status: 'posted', createdBy: 'Sistema' },
    { id: '2', number: 'LAN-2026-002', date: '2026-02-04', description: 'Pagamento aluguel', debitAccount: '3.1.1 Despesas', creditAccount: '1.1.1 Caixa', amount: 5500, type: 'debit', status: 'posted', createdBy: 'Maria' },
    { id: '3', number: 'LAN-2026-003', date: '2026-02-03', description: 'Compra material didático', debitAccount: '1.2.1 Estoque', creditAccount: '2.1.1 Fornecedores', amount: 3200, type: 'debit', status: 'draft', createdBy: 'João' },
    { id: '4', number: 'LAN-2026-004', date: '2026-02-02', description: 'Pagamento energia', debitAccount: '3.1.2 Utilidades', creditAccount: '1.1.2 Banco', amount: 1200, type: 'debit', status: 'posted', createdBy: 'Sistema' },
];

const statusColors: Record<string, string> = {
    draft: 'yellow',
    posted: 'green',
    reversed: 'red',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    posted: 'Lançado',
    reversed: 'Estornado',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function LancamentosPage() {
    const [entries] = useState<JournalEntry[]>(mockEntries);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const filtered = activeTab === 'all'
        ? entries
        : entries.filter(e => e.status === activeTab);

    const totalDebits = entries.filter(e => e.type === 'debit' && e.status === 'posted').reduce((acc, e) => acc + e.amount, 0);
    const totalCredits = entries.filter(e => e.type === 'credit' && e.status === 'posted').reduce((acc, e) => acc + e.amount, 0);
    const draftCount = entries.filter(e => e.status === 'draft').length;

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Contábil</Text>
                    <Title order={2}>Lançamentos</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Fevereiro 2026"
                        data={[
                            { value: '2026-02', label: 'Fevereiro 2026' },
                            { value: '2026-01', label: 'Janeiro 2026' },
                        ]}
                        w={180}
                        defaultValue="2026-02"
                    />
                    <Button leftSection={<IconPlus size={16} />}>
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
                            <Text fw={700} size="xl">{entries.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Débitos</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalDebits)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Créditos</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalCredits)}</Text>
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
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="all">Todos ({entries.length})</Tabs.Tab>
                        <Tabs.Tab value="posted">Lançados</Tabs.Tab>
                        <Tabs.Tab value="draft">Rascunhos</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Número</Table.Th>
                            <Table.Th>Data</Table.Th>
                            <Table.Th>Descrição</Table.Th>
                            <Table.Th>Débito</Table.Th>
                            <Table.Th>Crédito</Table.Th>
                            <Table.Th>Valor</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((entry) => (
                            <Table.Tr key={entry.id}>
                                <Table.Td>
                                    <Text fw={500}>{entry.number}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatDate(entry.date)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" truncate style={{ maxWidth: 200 }}>{entry.description}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">{entry.debitAccount}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">{entry.creditAccount}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={600} c={entry.type === 'credit' ? 'green' : 'red'}>
                                        {formatCurrency(entry.amount)}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[entry.status]} variant="light">
                                        {statusLabels[entry.status]}
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
            </Card>
        </div>
    );
}

