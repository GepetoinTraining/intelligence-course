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
    IconArrowUpRight,
    IconArrowDownRight,
    IconAlertCircle,
    IconCash,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Transaction {
    id: string;
    type: 'payment_received' | 'teacher_payout' | 'school_revenue' | 'platform_fee' | 'service_fee' | 'refund';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    createdAt: number;
}

function formatCurrency(amount: number): string {
    return `R$ ${(amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const typeLabels: Record<string, string> = {
    payment_received: 'Recebimento',
    teacher_payout: 'Pagamento Professor',
    school_revenue: 'Receita Escola',
    platform_fee: 'Taxa Plataforma',
    service_fee: 'Taxa Serviço',
    refund: 'Reembolso',
};

export default function FluxoCaixaPage() {
    const { data: transactions, isLoading, error, refetch } = useApi<Transaction[]>('/api/transactions');

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

    const txs = transactions || [];
    const inflows = txs.filter(t => ['payment_received', 'school_revenue'].includes(t.type));
    const outflows = txs.filter(t => ['teacher_payout', 'platform_fee', 'service_fee', 'refund'].includes(t.type));

    const totalIn = inflows.reduce((sum, t) => sum + t.amount, 0);
    const totalOut = outflows.reduce((sum, t) => sum + t.amount, 0);

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Financeiro</Text>
                <Title order={2}>Fluxo de Caixa</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Entradas</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalIn)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Saídas</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalOut)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Saldo</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalIn - totalOut)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {txs.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {txs.slice(0, 20).map((tx) => (
                                <Table.Tr key={tx.id}>
                                    <Table.Td>{formatDate(tx.createdAt)}</Table.Td>
                                    <Table.Td><Badge variant="light" size="sm">{typeLabels[tx.type] || tx.type}</Badge></Table.Td>
                                    <Table.Td>
                                        <Text c={['payment_received', 'school_revenue'].includes(tx.type) ? 'green' : 'red'}>
                                            {['payment_received', 'school_revenue'].includes(tx.type) ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={tx.status === 'completed' ? 'green' : tx.status === 'pending' ? 'yellow' : 'red'} variant="light">
                                            {tx.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCash size={48} color="gray" />
                            <Text c="dimmed">Nenhuma transação encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

