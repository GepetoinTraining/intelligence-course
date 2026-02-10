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
    Checkbox,
    Select,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconArrowsLeftRight,
    IconCheck,
    IconX,
    IconEye,
    IconDotsVertical,
    IconBuildingBank,
    IconReceipt,
    IconAlertTriangle,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    bankAccountId: string;
    bankName: string;
    matched: boolean;
    systemRecord?: {
        id: string;
        type: 'invoice' | 'payable';
        reference: string;
    };
}

// Mock data for reconciliation
const mockTransactions: Transaction[] = [
    { id: '1', date: '2026-02-05', description: 'PIX Recebido - Maria Silva', amount: 1200, type: 'income', bankAccountId: '1', bankName: 'Itaú', matched: true, systemRecord: { id: 'inv1', type: 'invoice', reference: 'FAT-2026-001' } },
    { id: '2', date: '2026-02-05', description: 'TED Recebido - Pedro Santos', amount: 850, type: 'income', bankAccountId: '1', bankName: 'Itaú', matched: false },
    { id: '3', date: '2026-02-04', description: 'Pagamento Fornecedor X', amount: 2500, type: 'expense', bankAccountId: '1', bankName: 'Itaú', matched: true, systemRecord: { id: 'pay1', type: 'payable', reference: 'PAG-2026-015' } },
    { id: '4', date: '2026-02-04', description: 'Boleto Pago - Aluguel', amount: 3500, type: 'expense', bankAccountId: '1', bankName: 'Itaú', matched: false },
    { id: '5', date: '2026-02-03', description: 'Cartão Crédito - Ana Costa', amount: 2400, type: 'income', bankAccountId: '2', bankName: 'Nubank', matched: true, systemRecord: { id: 'inv2', type: 'invoice', reference: 'FAT-2026-002' } },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function ConciliacaoPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/transactions');

    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

    const filtered = selectedAccount
        ? transactions.filter(t => t.bankAccountId === selectedAccount)
        : transactions;

    const matchedCount = transactions.filter(t => t.matched).length;
    const unmatchedCount = transactions.filter(t => !t.matched).length;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const handleMatch = (id: string) => {
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, matched: true } : t
        ));
    };


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Financeiro</Text>
                    <Title order={2}>Conciliação Bancária</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Todas as contas"
                        data={[
                            { value: '1', label: 'Itaú - Conta Principal' },
                            { value: '2', label: 'Nubank - Reserva' },
                        ]}
                        value={selectedAccount}
                        onChange={setSelectedAccount}
                        w={200}
                        clearable
                    />
                    <Button variant="light" leftSection={<IconArrowsLeftRight size={16} />}>
                        Importar Extrato
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conciliados</Text>
                            <Text fw={700} size="xl">{matchedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="xl">{unmatchedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Entradas</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalIncome)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Saídas</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalExpense)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Transações para Conciliar</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 40 }}></Table.Th>
                            <Table.Th>Data</Table.Th>
                            <Table.Th>Descrição</Table.Th>
                            <Table.Th>Banco</Table.Th>
                            <Table.Th>Valor</Table.Th>
                            <Table.Th>Registro Sistema</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((transaction) => (
                            <Table.Tr key={transaction.id}>
                                <Table.Td>
                                    <Checkbox checked={transaction.matched} readOnly />
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatDate(transaction.date)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{transaction.description}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light">{transaction.bankName}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text
                                        fw={600}
                                        c={transaction.type === 'income' ? 'green' : 'red'}
                                    >
                                        {transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    {transaction.systemRecord ? (
                                        <Badge variant="outline" color="blue">
                                            {transaction.systemRecord.reference}
                                        </Badge>
                                    ) : (
                                        <Text size="sm" c="dimmed">Não vinculado</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={transaction.matched ? 'green' : 'yellow'}>
                                        {transaction.matched ? 'Conciliado' : 'Pendente'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        {!transaction.matched && (
                                            <ActionIcon
                                                variant="light"
                                                color="green"
                                                size="sm"
                                                onClick={() => handleMatch(transaction.id)}
                                            >
                                                <IconCheck size={14} />
                                            </ActionIcon>
                                        )}
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconDotsVertical size={14} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                                <Menu.Item leftSection={<IconArrowsLeftRight size={14} />}>Vincular Registro</Menu.Item>
                                                <Menu.Item leftSection={<IconX size={14} />} color="red">Ignorar</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

