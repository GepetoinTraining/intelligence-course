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
    IconCash,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Invoice {
    id: string;
    payerName: string | null;
    studentName: string | null;
    description: string | null;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    dueDate: number | null;
    paidAt: number | null;
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
    paid: 'Pago',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
    refunded: 'Estornado',
};

export default function RecebiveisPage() {
    const { data: invoices, isLoading, error, refetch } = useApi<Invoice[]>('/api/invoices');

    const stats = {
        total: invoices?.length || 0,
        pending: invoices?.filter(i => i.status === 'pending').length || 0,
        paid: invoices?.filter(i => i.status === 'paid').length || 0,
        totalValue: invoices?.reduce((sum, i) => sum + (i.netAmount || 0), 0) || 0,
        paidValue: invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.netAmount || 0), 0) || 0,
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
                    <Title order={2}>Recebíveis</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Cobrança
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
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Recebido</Text>
                            <Text fw={700} size="lg">{formatCurrency(stats.paidValue)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Invoices Table */}
            <Card withBorder p="md">
                {invoices && invoices.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Responsável</Table.Th>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {invoices.map((invoice) => (
                                <Table.Tr key={invoice.id}>
                                    <Table.Td>
                                        <Text fw={500}>{invoice.payerName || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>{invoice.studentName || '-'}</Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">{invoice.description}</Text>
                                    </Table.Td>
                                    <Table.Td>{formatCurrency(invoice.netAmount)}</Table.Td>
                                    <Table.Td>{formatDate(invoice.dueDate)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                invoice.status === 'paid' ? 'green' :
                                                    invoice.status === 'pending' ? 'yellow' :
                                                        invoice.status === 'overdue' ? 'red' : 'gray'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[invoice.status] || invoice.status}
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
                            <Text c="dimmed">Nenhum recebível encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Criar cobrança
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

