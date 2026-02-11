'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select,
    ActionIcon, Menu,
} from '@mantine/core';
import {
    IconCreditCard, IconPlus, IconAlertCircle, IconCheck,
    IconDotsVertical, IconEdit, IconSend, IconCalendar,
    IconClock, IconCash,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Payable {
    id: string;
    vendorName: string;
    description: string | null;
    category: string;
    amountCents: number;
    dueDate: number;
    paidDate: number | null;
    status: string;
    paymentMethod: string | null;
    paymentReference: string | null;
    isRecurring: number;
}

function formatBRL(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
function formatDate(ts: number | null): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'yellow' },
    scheduled: { label: 'Agendado', color: 'blue' },
    paid: { label: 'Pago', color: 'green' },
    overdue: { label: 'Vencido', color: 'red' },
    cancelled: { label: 'Cancelado', color: 'gray' },
};

export default function ContasPagarPage() {
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const url = statusFilter ? `/api/payables?status=${statusFilter}` : '/api/payables';
    const { data: payables, isLoading, error, refetch } = useApi<Payable[]>(url);

    const now = Math.floor(Date.now() / 1000);
    const all = payables || [];

    // Upcoming 7 days
    const sevenDays = now + 7 * 86400;
    const upcoming = all.filter(p => (p.status === 'pending' || p.status === 'scheduled') && p.dueDate >= now && p.dueDate <= sevenDays);
    const overdue = all.filter(p => p.status === 'overdue' || (p.status === 'pending' && p.dueDate < now));
    const scheduled = all.filter(p => p.status === 'scheduled');

    const totalPending = all.filter(p => p.status !== 'paid' && p.status !== 'cancelled')
        .reduce((s, p) => s + (p.amountCents || 0), 0);
    const overdueTotal = overdue.reduce((s, p) => s + (p.amountCents || 0), 0);

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Contas a Pagar</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Status"
                        clearable size="sm"
                        value={statusFilter} onChange={setStatusFilter}
                        data={Object.entries(statusMap).map(([v, { label }]) => ({ value: v, label }))}
                    />
                    <Button leftSection={<IconPlus size={16} />}>Nova Conta</Button>
                </Group>
            </Group>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="sm">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="md"><IconClock size={16} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Pendente</Text>
                            <Text fw={700}>{formatBRL(totalPending)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="sm">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="md"><IconAlertCircle size={16} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Vencido</Text>
                            <Text fw={700} c="red">{formatBRL(overdueTotal)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="sm">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="md"><IconCalendar size={16} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Próximos 7 dias</Text>
                            <Text fw={700}>{upcoming.length} contas</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="sm">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="md"><IconCheck size={16} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Agendados</Text>
                            <Text fw={700}>{scheduled.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Urgent: overdue */}
            {overdue.length > 0 && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" title={`${overdue.length} Conta(s) Vencida(s)`}>
                    <Text size="sm">Total vencido: {formatBRL(overdueTotal)} — Realize o pagamento para evitar juros e multas.</Text>
                </Alert>
            )}

            {/* Upcoming this week */}
            {upcoming.length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="xs">Vencendo esta semana</Text>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fornecedor</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Ação</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {upcoming.map(p => (
                                <Table.Tr key={p.id}>
                                    <Table.Td><Text fw={500} size="sm">{p.vendorName}</Text></Table.Td>
                                    <Table.Td>{formatBRL(p.amountCents)}</Table.Td>
                                    <Table.Td>{formatDate(p.dueDate)}</Table.Td>
                                    <Table.Td>
                                        <Button size="xs" variant="light" color="green" leftSection={<IconCash size={12} />}>
                                            Pagar
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Full Table */}
            <Card withBorder p="md">
                <Text fw={600} mb="xs">Todas as Contas</Text>
                {all.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fornecedor</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Pagamento</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {all.map(p => {
                                const st = statusMap[p.status] || { label: p.status, color: 'gray' };
                                const isOv = p.status === 'pending' && p.dueDate < now;
                                return (
                                    <Table.Tr key={p.id}>
                                        <Table.Td><Text fw={500} size="sm">{p.vendorName}</Text></Table.Td>
                                        <Table.Td><Text size="sm" c="dimmed">{p.description || '-'}</Text></Table.Td>
                                        <Table.Td>{formatBRL(p.amountCents)}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c={isOv ? 'red' : undefined}>{formatDate(p.dueDate)}</Text>
                                        </Table.Td>
                                        <Table.Td>{formatDate(p.paidDate)}</Table.Td>
                                        <Table.Td>
                                            <Badge color={isOv ? 'red' : st.color} variant="light">
                                                {isOv ? 'Vencido' : st.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu position="bottom-end" withArrow>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" size="sm"><IconDotsVertical size={14} /></ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                    <Menu.Item leftSection={<IconCheck size={14} />} color="green">Marcar Pago</Menu.Item>
                                                    <Menu.Item leftSection={<IconSend size={14} />} color="blue">Agendar PIX</Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCreditCard size={48} color="gray" />
                            <Text c="dimmed">Nenhuma conta a pagar</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}
