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
    Loader,
    Alert,
    Select,
    Tabs,
    Center,
} from '@mantine/core';
import {
    IconFileInvoice,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconAlertCircle,
    IconCheck,
    IconClock,
    IconAlertTriangle,
    IconTrash,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Payable {
    id: string;
    description: string;
    vendorName?: string;
    category: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    paidAt?: string;
}

// Mock data for payables
const mockPayables: Payable[] = [
    { id: '1', description: 'Aluguel - Fevereiro', vendorName: 'Imobiliária XYZ', category: 'Aluguel', amount: 5500, dueDate: '2026-02-10', status: 'pending' },
    { id: '2', description: 'Internet + Telefone', vendorName: 'Operadora ABC', category: 'Telecom', amount: 450, dueDate: '2026-02-15', status: 'pending' },
    { id: '3', description: 'Energia Elétrica', vendorName: 'Concessionária', category: 'Utilidades', amount: 1200, dueDate: '2026-02-05', status: 'overdue' },
    { id: '4', description: 'Material Didático', vendorName: 'Editora ABC', category: 'Material', amount: 3200, dueDate: '2026-02-20', status: 'pending' },
    { id: '5', description: 'Manutenção AC', vendorName: 'Técnico João', category: 'Manutenção', amount: 800, dueDate: '2026-01-28', status: 'paid', paidAt: '2026-01-28' },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

const statusColors: Record<string, string> = {
    pending: 'blue',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Atrasado',
    cancelled: 'Cancelado',
};

export default function ContasPagarPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/payables');

    const [payables] = useState<Payable[]>(mockPayables);
    const [activeTab, setActiveTab] = useState<string | null>('pending');

    const filtered = activeTab === 'all'
        ? payables
        : payables.filter(p =>
            activeTab === 'pending' ? (p.status === 'pending' || p.status === 'overdue') : p.status === activeTab
        );

    const pendingAmount = payables
        .filter(p => p.status === 'pending')
        .reduce((acc, p) => acc + p.amount, 0);
    const overdueAmount = payables
        .filter(p => p.status === 'overdue')
        .reduce((acc, p) => acc + p.amount, 0);
    const pendingCount = payables.filter(p => p.status === 'pending').length;
    const overdueCount = payables.filter(p => p.status === 'overdue').length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Financeiro</Text>
                    <Title order={2}>Contas a Pagar</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Despesa
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="xl">{formatCurrency(pendingAmount)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Atraso</Text>
                            <Text fw={700} size="xl">{formatCurrency(overdueAmount)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconFileInvoice size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Contas Pendentes</Text>
                            <Text fw={700} size="xl">{pendingCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconAlertCircle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Atrasadas</Text>
                            <Text fw={700} size="xl">{overdueCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="pending">A Pagar ({pendingCount + overdueCount})</Tabs.Tab>
                        <Tabs.Tab value="paid">Pagas</Tabs.Tab>
                        <Tabs.Tab value="all">Todas</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Descrição</Table.Th>
                            <Table.Th>Fornecedor</Table.Th>
                            <Table.Th>Categoria</Table.Th>
                            <Table.Th>Valor</Table.Th>
                            <Table.Th>Vencimento</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((payable) => (
                            <Table.Tr key={payable.id}>
                                <Table.Td>
                                    <Text fw={500}>{payable.description}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{payable.vendorName || '-'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" color="gray">{payable.category}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={600}>{formatCurrency(payable.amount)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatDate(payable.dueDate)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[payable.status]} variant="light">
                                        {statusLabels[payable.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        {payable.status !== 'paid' && (
                                            <ActionIcon variant="light" color="green" size="sm">
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
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                {payable.status !== 'paid' && (
                                                    <Menu.Item leftSection={<IconCheck size={14} />} color="green">
                                                        Marcar como Pago
                                                    </Menu.Item>
                                                )}
                                                <Menu.Divider />
                                                <Menu.Item leftSection={<IconTrash size={14} />} color="red">Excluir</Menu.Item>
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

