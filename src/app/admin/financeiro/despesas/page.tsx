'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Table,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconReceipt,
    IconPlus,
    IconCheck,
    IconClock,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Payable {
    id: string;
    vendorName: string | null;
    description: string | null;
    category: string;
    amountCents: number;
    dueDate: number | null;
    status: 'pending' | 'scheduled' | 'paid' | 'cancelled';
    isRecurring: number;
}

function formatCurrency(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    scheduled: 'Agendado',
    paid: 'Pago',
    cancelled: 'Cancelado',
};

const categoryLabels: Record<string, string> = {
    rent: 'Aluguel',
    utilities: 'Utilidades',
    supplies: 'Materiais',
    marketing: 'Marketing',
    payroll: 'Folha',
    taxes: 'Impostos',
    insurance: 'Seguros',
    maintenance: 'Manutenção',
    software: 'Software',
    other: 'Outros',
};

export default function DespesasPage() {
    const { data: payables, isLoading, error, refetch } = useApi<Payable[]>('/api/payables');

    const stats = {
        total: payables?.length || 0,
        pending: payables?.filter(p => p.status === 'pending').length || 0,
        paid: payables?.filter(p => p.status === 'paid').length || 0,
        totalValue: payables?.reduce((sum, p) => sum + (p.amountCents || 0), 0) || 0,
    };

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Despesas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Despesa
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="lg">{stats.pending}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pagos</Text>
                            <Text fw={700} size="lg">{stats.paid}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total a Pagar</Text>
                            <Text fw={700} size="lg">{formatCurrency(stats.totalValue)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Payables Table */}
            <Card withBorder p="md">
                {payables && payables.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fornecedor</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Categoria</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {payables.map((payable) => (
                                <Table.Tr key={payable.id}>
                                    <Table.Td>
                                        <Text fw={500}>{payable.vendorName || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">{payable.description}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {categoryLabels[payable.category] || payable.category}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatCurrency(payable.amountCents)}</Table.Td>
                                    <Table.Td>{formatDate(payable.dueDate)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                payable.status === 'paid' ? 'green' :
                                                    payable.status === 'scheduled' ? 'blue' :
                                                        payable.status === 'cancelled' ? 'gray' : 'yellow'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[payable.status] || payable.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconReceipt size={48} color="gray" />
                            <Text c="dimmed">Nenhuma despesa encontrada</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Cadastrar despesa
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

