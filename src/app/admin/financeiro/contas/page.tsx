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
} from '@mantine/core';
import {
    IconBuildingBank,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconRefresh,
    IconCreditCard,
    IconArrowUpRight,
    IconArrowDownRight,
} from '@tabler/icons-react';

interface BankAccount {
    id: string;
    name: string;
    bank: string;
    accountNumber: string;
    agency: string;
    type: 'checking' | 'savings';
    balance: number;
    lastSync?: string;
    isActive: boolean;
}

// Mock data for bank accounts
const mockAccounts: BankAccount[] = [
    { id: '1', name: 'Conta Principal', bank: 'Itaú', accountNumber: '12345-6', agency: '1234', type: 'checking', balance: 85420.50, lastSync: '2026-02-05T10:30:00', isActive: true },
    { id: '2', name: 'Reserva', bank: 'Nubank', accountNumber: '9876543-2', agency: '0001', type: 'savings', balance: 25000.00, lastSync: '2026-02-05T09:00:00', isActive: true },
    { id: '3', name: 'Pagamentos', bank: 'Bradesco', accountNumber: '55555-0', agency: '5678', type: 'checking', balance: 12350.75, lastSync: '2026-02-04T18:00:00', isActive: true },
    { id: '4', name: 'Conta Antiga', bank: 'Santander', accountNumber: '11111-1', agency: '1111', type: 'checking', balance: 0, isActive: false },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

const bankColors: Record<string, string> = {
    'Itaú': 'orange',
    'Nubank': 'grape',
    'Bradesco': 'red',
    'Santander': 'red',
    'Banco do Brasil': 'yellow',
    'Caixa': 'blue',
};

export default function ContasBancariasPage() {
    const [accounts] = useState<BankAccount[]>(mockAccounts);

    const totalBalance = accounts
        .filter(a => a.isActive)
        .reduce((acc, a) => acc + a.balance, 0);
    const activeCount = accounts.filter(a => a.isActive).length;
    const checkingTotal = accounts
        .filter(a => a.type === 'checking' && a.isActive)
        .reduce((acc, a) => acc + a.balance, 0);
    const savingsTotal = accounts
        .filter(a => a.type === 'savings' && a.isActive)
        .reduce((acc, a) => acc + a.balance, 0);

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Financeiro</Text>
                    <Title order={2}>Contas Bancárias</Title>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconRefresh size={16} />}>
                        Sincronizar Todas
                    </Button>
                    <Button leftSection={<IconPlus size={16} />}>
                        Nova Conta
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconBuildingBank size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Saldo Total</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalBalance)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconCreditCard size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Contas Ativas</Text>
                            <Text fw={700} size="xl">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conta Corrente</Text>
                            <Text fw={700} size="xl">{formatCurrency(checkingTotal)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="teal" size="lg" radius="md">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Poupança</Text>
                            <Text fw={700} size="xl">{formatCurrency(savingsTotal)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Contas</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Conta</Table.Th>
                            <Table.Th>Banco</Table.Th>
                            <Table.Th>Agência / Conta</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Saldo</Table.Th>
                            <Table.Th>Última Sync</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {accounts.map((account) => (
                            <Table.Tr key={account.id} style={{ opacity: account.isActive ? 1 : 0.5 }}>
                                <Table.Td>
                                    <Text fw={500}>{account.name}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={bankColors[account.bank] || 'gray'} variant="light">
                                        {account.bank}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{account.agency} / {account.accountNumber}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="outline" color="gray">
                                        {account.type === 'checking' ? 'Corrente' : 'Poupança'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={600} c={account.balance >= 0 ? 'green' : 'red'}>
                                        {formatCurrency(account.balance)}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" c="dimmed">
                                        {account.lastSync ? formatDate(account.lastSync) : '-'}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={account.isActive ? 'green' : 'gray'}>
                                        {account.isActive ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" size="sm">
                                                <IconDotsVertical size={14} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ver Extrato</Menu.Item>
                                            <Menu.Item leftSection={<IconRefresh size={14} />}>Sincronizar</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
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

