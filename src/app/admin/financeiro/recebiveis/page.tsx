'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select,
    Modal, TextInput, NumberInput, Tabs, Progress,
} from '@mantine/core';
import {
    IconReceipt, IconPlus, IconCheck, IconClock, IconAlertCircle,
    IconCash, IconFilter, IconSend, IconX,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Receivable {
    id: string;
    payerUserId: string;
    studentUserId: string | null;
    description: string;
    installmentNumber: number | null;
    totalInstallments: number | null;
    originalAmountCents: number;
    discountCents: number;
    interestCents: number;
    finesCents: number;
    netAmountCents: number;
    paidAmountCents: number;
    remainingAmountCents: number | null;
    dueDate: number;
    paymentDate: number | null;
    status: string;
    paymentMethod: string | null;
    daysOverdue: number;
    remindersSent: number;
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
    paid: { label: 'Pago', color: 'green' },
    partial: { label: 'Parcial', color: 'blue' },
    overdue: { label: 'Vencido', color: 'red' },
    negotiating: { label: 'Negociando', color: 'orange' },
    cancelled: { label: 'Cancelado', color: 'gray' },
    refunded: { label: 'Estornado', color: 'violet' },
};

const methodLabels: Record<string, string> = {
    pix: 'PIX', boleto: 'Boleto', credit_card: 'Cartão Crédito',
    debit_card: 'Cartão Débito', cash: 'Dinheiro', transfer: 'Transferência', check: 'Cheque',
};

export default function RecebiveisPage() {
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const url = statusFilter ? `/api/receivables?status=${statusFilter}` : '/api/receivables';
    const { data: receivables, isLoading, error, refetch } = useApi<Receivable[]>(url);

    const now = Math.floor(Date.now() / 1000);

    // Stats
    const all = receivables || [];
    const totalCount = all.length;
    const pending = all.filter(r => r.status === 'pending');
    const paid = all.filter(r => r.status === 'paid');
    const overdue = all.filter(r => r.status === 'overdue' || (r.status === 'pending' && r.dueDate < now));
    const totalValue = all.reduce((s, r) => s + (r.netAmountCents || 0), 0);
    const paidValue = paid.reduce((s, r) => s + (r.paidAmountCents || r.netAmountCents || 0), 0);
    const overdueValue = overdue.reduce((s, r) => s + (r.netAmountCents || 0), 0);

    // Aging buckets
    const aging = {
        current: all.filter(r => r.status === 'pending' && r.dueDate >= now),
        d30: overdue.filter(r => r.daysOverdue <= 30),
        d60: overdue.filter(r => r.daysOverdue > 30 && r.daysOverdue <= 60),
        d90: overdue.filter(r => r.daysOverdue > 60 && r.daysOverdue <= 90),
        d90plus: overdue.filter(r => r.daysOverdue > 90),
    };

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Recebíveis</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Filtrar status"
                        clearable
                        size="sm"
                        leftSection={<IconFilter size={14} />}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={[
                            { value: 'pending', label: 'Pendentes' },
                            { value: 'paid', label: 'Pagos' },
                            { value: 'overdue', label: 'Vencidos' },
                            { value: 'partial', label: 'Parciais' },
                            { value: 'negotiating', label: 'Negociando' },
                        ]}
                    />
                    <Button leftSection={<IconPlus size={16} />}>Nova Cobrança</Button>
                </Group>
            </Group>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Stats Row */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Total</Text>
                    <Text fw={700} size="lg">{totalCount}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Valor Total</Text>
                    <Text fw={700} size="md">{formatBRL(totalValue)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Recebido</Text>
                    <Text fw={700} size="md" c="green">{formatBRL(paidValue)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Pendentes</Text>
                    <Text fw={700} size="lg" c="yellow">{pending.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Vencidos</Text>
                    <Text fw={700} size="lg" c="red">{overdue.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Valor Vencido</Text>
                    <Text fw={700} size="md" c="red">{formatBRL(overdueValue)}</Text>
                </Card>
            </SimpleGrid>

            {/* Aging Analysis */}
            {overdue.length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="sm">Análise de Aging</Text>
                    <SimpleGrid cols={{ base: 2, sm: 5 }}>
                        <div>
                            <Text size="xs" c="dimmed">A vencer</Text>
                            <Text fw={600} c="green">{aging.current.length} parcelas</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">1-30 dias</Text>
                            <Text fw={600} c="yellow">{aging.d30.length} parcelas</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">31-60 dias</Text>
                            <Text fw={600} c="orange">{aging.d60.length} parcelas</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">61-90 dias</Text>
                            <Text fw={600} c="red">{aging.d90.length} parcelas</Text>
                        </div>
                        <div>
                            <Text size="xs" c="dimmed">90+ dias</Text>
                            <Text fw={600} c="red.9">{aging.d90plus.length} parcelas</Text>
                        </div>
                    </SimpleGrid>
                </Card>
            )}

            {/* Table */}
            <Card withBorder p="md">
                {all.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Parcela</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Pgto</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Método</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {all.map((r) => {
                                const st = statusMap[r.status] || { label: r.status, color: 'gray' };
                                const isOverdue = r.status === 'pending' && r.dueDate < now;
                                return (
                                    <Table.Tr key={r.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{r.description}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {r.installmentNumber && r.totalInstallments
                                                ? `${r.installmentNumber}/${r.totalInstallments}`
                                                : '-'}
                                        </Table.Td>
                                        <Table.Td>{formatBRL(r.netAmountCents)}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c={isOverdue ? 'red' : undefined} fw={isOverdue ? 600 : undefined}>
                                                {formatDate(r.dueDate)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>{formatDate(r.paymentDate)}</Table.Td>
                                        <Table.Td>
                                            <Badge color={isOverdue ? 'red' : st.color} variant="light">
                                                {isOverdue ? 'Vencido' : st.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{r.paymentMethod ? methodLabels[r.paymentMethod] || r.paymentMethod : '-'}</Text>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconReceipt size={48} color="gray" />
                            <Text c="dimmed">Nenhum recebível encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>Criar cobrança</Button>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Legal */}
            <Alert icon={<IconReceipt size={16} />} color="gray" variant="light" title="Base Legal">
                <Text size="xs">
                    <strong>CDC Art. 42</strong> — Cobrança abusiva proibida •{' '}
                    <strong>CC Art. 394-401</strong> — Mora e juros •{' '}
                    <strong>Res. BCB 1/2020</strong> — PIX (arranjo de pagamento instantâneo) •{' '}
                    <strong>LGPD Art. 7°</strong> — Base legal para tratamento de dados financeiros
                </Text>
            </Alert>
        </Stack>
    );
}
