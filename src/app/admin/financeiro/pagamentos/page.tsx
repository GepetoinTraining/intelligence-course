'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select,
    ActionIcon, Menu,
} from '@mantine/core';
import {
    IconCash, IconAlertCircle, IconCheck, IconReceipt,
    IconBuildingBank, IconCreditCard, IconDotsVertical,
    IconEye, IconDownload, IconQrcode,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Payment {
    id: string;
    receivableId: string;
    amountCents: number;
    paymentMethod: string;
    status: string;
    externalTransactionId: string | null;
    initiatedAt: number;
    confirmedAt: number | null;
    failedAt: number | null;
    failureReason: string | null;
}

interface Receivable {
    id: string;
    description: string;
    netAmountCents: number;
    paidAmountCents: number;
    status: string;
    paymentMethod: string | null;
    paymentDate: number | null;
    externalPixCode: string | null;
    externalBoletoUrl: string | null;
}

function formatBRL(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
function formatDate(ts: number | null): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}
function formatDateTime(ts: number | null): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString('pt-BR');
}

const methodIcons: Record<string, React.ReactNode> = {
    pix: <IconQrcode size={16} />,
    boleto: <IconReceipt size={16} />,
    credit_card: <IconCreditCard size={16} />,
    debit_card: <IconCreditCard size={16} />,
    cash: <IconCash size={16} />,
    transfer: <IconBuildingBank size={16} />,
};

const methodLabels: Record<string, string> = {
    pix: 'PIX', boleto: 'Boleto', credit_card: 'Cartão Crédito',
    debit_card: 'Cartão Débito', cash: 'Dinheiro', transfer: 'Transferência', check: 'Cheque',
};

const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'yellow' },
    paid: { label: 'Confirmado', color: 'green' },
    partial: { label: 'Parcial', color: 'blue' },
    overdue: { label: 'Vencido', color: 'red' },
};

export default function PagamentosPage() {
    const [methodFilter, setMethodFilter] = useState<string | null>(null);
    const { data: receivables, isLoading, error, refetch } = useApi<Receivable[]>('/api/receivables?status=paid');

    const all = receivables || [];

    // Stats
    const totalPaid = all.reduce((s, r) => s + (r.paidAmountCents || r.netAmountCents || 0), 0);
    const byMethod: Record<string, number> = {};
    all.forEach(r => {
        const m = r.paymentMethod || 'other';
        byMethod[m] = (byMethod[m] || 0) + (r.paidAmountCents || r.netAmountCents || 0);
    });

    const filtered = methodFilter
        ? all.filter(r => r.paymentMethod === methodFilter)
        : all;

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Pagamentos Recebidos</Title>
                </div>
                <Select
                    placeholder="Método"
                    clearable size="sm"
                    value={methodFilter} onChange={setMethodFilter}
                    data={Object.entries(methodLabels).map(([v, l]) => ({ value: v, label: l }))}
                />
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
                    <Text size="xs" c="dimmed">Total Recebido</Text>
                    <Text fw={700} size="lg" c="green">{formatBRL(totalPaid)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Pagamentos</Text>
                    <Text fw={700} size="xl">{all.length}</Text>
                </Card>
                {byMethod.pix != null && (
                    <Card withBorder p="sm">
                        <Group gap={6}>
                            <IconQrcode size={14} color="green" />
                            <Text size="xs" c="dimmed">Via PIX</Text>
                        </Group>
                        <Text fw={700}>{formatBRL(byMethod.pix || 0)}</Text>
                    </Card>
                )}
                {byMethod.boleto != null && (
                    <Card withBorder p="sm">
                        <Group gap={6}>
                            <IconReceipt size={14} color="blue" />
                            <Text size="xs" c="dimmed">Via Boleto</Text>
                        </Group>
                        <Text fw={700}>{formatBRL(byMethod.boleto || 0)}</Text>
                    </Card>
                )}
            </SimpleGrid>

            {/* Payment Method Breakdown */}
            {Object.keys(byMethod).length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="xs">Por Método de Pagamento</Text>
                    <SimpleGrid cols={{ base: 2, sm: 6 }}>
                        {Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
                            <div key={method}>
                                <Group gap={4}>
                                    {methodIcons[method]}
                                    <Text size="xs" c="dimmed">{methodLabels[method] || method}</Text>
                                </Group>
                                <Text size="sm" fw={500}>{formatBRL(amount)}</Text>
                            </div>
                        ))}
                    </SimpleGrid>
                </Card>
            )}

            {/* Table */}
            <Card withBorder p="md">
                {filtered.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Método</Table.Th>
                                <Table.Th>Data Pgto</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map(r => (
                                <Table.Tr key={r.id}>
                                    <Table.Td><Text fw={500} size="sm">{r.description}</Text></Table.Td>
                                    <Table.Td>{formatBRL(r.paidAmountCents || r.netAmountCents)}</Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {r.paymentMethod && methodIcons[r.paymentMethod]}
                                            <Text size="sm">{r.paymentMethod ? methodLabels[r.paymentMethod] || r.paymentMethod : '-'}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>{formatDate(r.paymentDate)}</Table.Td>
                                    <Table.Td>
                                        <Badge color="green" variant="light">
                                            <Group gap={4}>
                                                <IconCheck size={10} />
                                                Confirmado
                                            </Group>
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" size="sm"><IconDotsVertical size={14} /></ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                                <Menu.Item leftSection={<IconDownload size={14} />}>Gerar Recibo</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCash size={48} color="gray" />
                            <Text c="dimmed">Nenhum pagamento encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}
