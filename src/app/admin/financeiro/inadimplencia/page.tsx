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
    IconAlertCircle,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Invoice {
    id: string;
    status: string;
    dueDate: number | null;
    netAmount: number;
    student?: { name: string; email: string };
}

function formatCurrency(amount: number): string {
    return `R$ ${(amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

function daysOverdue(dueDate: number | null): number {
    if (!dueDate) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.floor((now - dueDate) / (24 * 60 * 60));
}

export default function InadimplenciaPage() {
    const { data: invoices, isLoading, error, refetch } = useApi<Invoice[]>('/api/invoices');

    // Filter overdue invoices
    const now = Math.floor(Date.now() / 1000);
    const overdue = invoices?.filter(inv =>
        inv.status === 'pending' && inv.dueDate && inv.dueDate < now
    ) || [];

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

    const totalOverdue = overdue.reduce((sum, inv) => sum + inv.netAmount, 0);

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Financeiro</Text>
                <Title order={2}>Inadimplência</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Faturas Vencidas</Text>
                            <Text fw={700} size="lg">{overdue.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Valor Total</Text>
                            <Text fw={700} size="lg">{formatCurrency(totalOverdue)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {overdue.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Dias Atraso</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {overdue.map((invoice) => {
                                const days = daysOverdue(invoice.dueDate);
                                return (
                                    <Table.Tr key={invoice.id}>
                                        <Table.Td><Text fw={500}>{invoice.student?.name || '-'}</Text></Table.Td>
                                        <Table.Td>{formatCurrency(invoice.netAmount)}</Table.Td>
                                        <Table.Td>{formatDate(invoice.dueDate)}</Table.Td>
                                        <Table.Td>
                                            <Badge color={days > 30 ? 'red' : days > 7 ? 'orange' : 'yellow'} variant="light">
                                                {days} dias
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconAlertTriangle size={48} color="gray" />
                            <Text c="dimmed">Nenhuma fatura vencida</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

