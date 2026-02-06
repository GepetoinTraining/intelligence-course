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
    Table,
    Loader,
    Alert,
    Center,
    Button,
} from '@mantine/core';
import {
    IconReceipt,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Invoice {
    id: string;
    status: string;
    dueDate: number | null;
    netAmount: number;
    paidAt: number | null;
    student?: { name: string };
}

function formatCurrency(amount: number): string {
    return `R$ ${(amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    paid: 'Pago',
    pending: 'Pendente',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
};

export default function FaturamentoPage() {
    const { data: invoices, isLoading, error, refetch } = useApi<Invoice[]>('/api/invoices');

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

    const allInvoices = invoices || [];
    const paid = allInvoices.filter(i => i.status === 'paid');
    const totalRevenue = paid.reduce((sum, i) => sum + i.netAmount, 0);

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Financeiro</Text>
                <Title order={2}>Faturamento</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Faturas</Text>
                            <Text fw={700} size="lg">{allInvoices.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Receita Recebida</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalRevenue)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allInvoices.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allInvoices.map((invoice) => (
                                <Table.Tr key={invoice.id}>
                                    <Table.Td><Text fw={500}>{invoice.student?.name || '-'}</Text></Table.Td>
                                    <Table.Td>{formatCurrency(invoice.netAmount)}</Table.Td>
                                    <Table.Td>{formatDate(invoice.dueDate)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={invoice.status === 'paid' ? 'green' : invoice.status === 'pending' ? 'yellow' : 'red'}
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
                            <Text c="dimmed">Nenhuma fatura encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

