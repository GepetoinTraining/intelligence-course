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
    IconCash,
    IconPlus,
    IconCheck,
    IconClock,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Payroll {
    id: string;
    userId: string;
    userName: string | null;
    jobTitle: string | null;
    department: string | null;
    periodStart: number;
    periodEnd: number;
    grossAmountCents: number;
    netAmountCents: number;
    status: 'draft' | 'approved' | 'paid' | 'cancelled';
    paymentDueDate: number | null;
}

function formatCurrency(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

function formatPeriod(start: number, end: number): string {
    return `${formatDate(start)} - ${formatDate(end)}`;
}

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    approved: 'Aprovado',
    paid: 'Pago',
    cancelled: 'Cancelado',
};

export default function FolhaPage() {
    const { data: payrolls, isLoading, error, refetch } = useApi<Payroll[]>('/api/staff-payroll');

    const stats = {
        total: payrolls?.length || 0,
        pending: payrolls?.filter(p => p.status === 'draft' || p.status === 'approved').length || 0,
        paid: payrolls?.filter(p => p.status === 'paid').length || 0,
        totalValue: payrolls?.reduce((sum, p) => sum + (p.netAmountCents || 0), 0) || 0,
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
                    <Text size="sm" c="dimmed">RH</Text>
                    <Title order={2}>Folha de Pagamento</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Folha
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconCash size={20} />
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
                            <Text size="xs" c="dimmed">Valor Total</Text>
                            <Text fw={700} size="lg">{formatCurrency(stats.totalValue)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Payroll Table */}
            <Card withBorder p="md">
                {payrolls && payrolls.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Cargo</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Bruto</Table.Th>
                                <Table.Th>Líquido</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {payrolls.map((payroll) => (
                                <Table.Tr key={payroll.id}>
                                    <Table.Td>
                                        <Text fw={500}>{payroll.userName || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">{payroll.jobTitle || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatPeriod(payroll.periodStart, payroll.periodEnd)}</Text>
                                    </Table.Td>
                                    <Table.Td>{formatCurrency(payroll.grossAmountCents)}</Table.Td>
                                    <Table.Td>{formatCurrency(payroll.netAmountCents)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                payroll.status === 'paid' ? 'green' :
                                                    payroll.status === 'approved' ? 'blue' :
                                                        payroll.status === 'cancelled' ? 'red' : 'yellow'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[payroll.status] || payroll.status}
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
                            <Text c="dimmed">Nenhum registro de folha encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Criar folha
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

