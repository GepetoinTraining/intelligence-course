'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select, Modal,
    TextInput, NumberInput, Textarea, ActionIcon, Menu,
} from '@mantine/core';
import {
    IconReceipt, IconPlus, IconAlertCircle, IconArrowDown,
    IconDotsVertical, IconEdit, IconCheck, IconTrash, IconFilter,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Payable {
    id: string;
    vendorName: string;
    vendorDocument: string | null;
    invoiceNumber: string | null;
    description: string | null;
    category: string;
    amountCents: number;
    issueDate: number | null;
    dueDate: number;
    paidDate: number | null;
    status: string;
    paymentMethod: string | null;
    isRecurring: number;
    recurrenceInterval: string | null;
    notes: string | null;
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
    disputed: { label: 'Disputado', color: 'orange' },
};

const categoryLabels: Record<string, string> = {
    rent: 'Aluguel', utilities: 'Utilidades', supplies: 'Materiais',
    marketing: 'Marketing', software: 'Software', maintenance: 'Manutenção',
    insurance: 'Seguros', taxes: 'Impostos', payroll: 'Folha', other: 'Outros',
};

export default function DespesasPage() {
    const [catFilter, setCatFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);

    let url = '/api/payables?limit=200';
    if (catFilter) url += `&category=${catFilter}`;
    if (statusFilter) url += `&status=${statusFilter}`;

    const { data: payables, isLoading, error, refetch } = useApi<Payable[]>(url);

    const now = Math.floor(Date.now() / 1000);
    const all = payables || [];
    const totalAmount = all.reduce((s, p) => s + (p.amountCents || 0), 0);
    const pendingAmount = all.filter(p => p.status === 'pending' || p.status === 'scheduled').reduce((s, p) => s + (p.amountCents || 0), 0);
    const paidAmount = all.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amountCents || 0), 0);
    const overdueCount = all.filter(p => p.status === 'overdue' || (p.status === 'pending' && p.dueDate < now)).length;
    const recurringCount = all.filter(p => p.isRecurring).length;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    all.forEach(p => {
        byCategory[p.category] = (byCategory[p.category] || 0) + p.amountCents;
    });

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Despesas</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Categoria"
                        clearable size="sm"
                        value={catFilter} onChange={setCatFilter}
                        data={Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))}
                    />
                    <Select
                        placeholder="Status"
                        clearable size="sm"
                        value={statusFilter} onChange={setStatusFilter}
                        data={Object.entries(statusMap).map(([v, { label }]) => ({ value: v, label }))}
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setAddOpen(true)}>Nova Despesa</Button>
                </Group>
            </Group>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 5 }}>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Total</Text>
                    <Text fw={700}>{formatBRL(totalAmount)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">A Pagar</Text>
                    <Text fw={700} c="yellow">{formatBRL(pendingAmount)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Pago</Text>
                    <Text fw={700} c="green">{formatBRL(paidAmount)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Vencidas</Text>
                    <Text fw={700} c="red">{overdueCount}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Recorrentes</Text>
                    <Text fw={700}>{recurringCount}</Text>
                </Card>
            </SimpleGrid>

            {/* Category breakdown */}
            {Object.keys(byCategory).length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="xs">Por Categoria</Text>
                    <SimpleGrid cols={{ base: 2, sm: 5 }}>
                        {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                            <div key={cat}>
                                <Text size="xs" c="dimmed">{categoryLabels[cat] || cat}</Text>
                                <Text size="sm" fw={500}>{formatBRL(val)}</Text>
                            </div>
                        ))}
                    </SimpleGrid>
                </Card>
            )}

            {/* Table */}
            <Card withBorder p="md">
                {all.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fornecedor</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Categoria</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Recorrente</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {all.map((p) => {
                                const st = statusMap[p.status] || { label: p.status, color: 'gray' };
                                const isOverdue = p.status === 'pending' && p.dueDate < now;
                                return (
                                    <Table.Tr key={p.id}>
                                        <Table.Td><Text fw={500} size="sm">{p.vendorName}</Text></Table.Td>
                                        <Table.Td><Text size="sm" c="dimmed">{p.description || '-'}</Text></Table.Td>
                                        <Table.Td><Badge size="sm" variant="light">{categoryLabels[p.category] || p.category}</Badge></Table.Td>
                                        <Table.Td>{formatBRL(p.amountCents)}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c={isOverdue ? 'red' : undefined} fw={isOverdue ? 600 : undefined}>
                                                {formatDate(p.dueDate)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={isOverdue ? 'red' : st.color} variant="light">
                                                {isOverdue ? 'Vencido' : st.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{p.isRecurring ? <Badge size="xs" color="violet">Sim</Badge> : '-'}</Table.Td>
                                        <Table.Td>
                                            <Menu position="bottom-end" withArrow>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" size="sm"><IconDotsVertical size={14} /></ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                    <Menu.Item leftSection={<IconCheck size={14} />} color="green">Marcar Pago</Menu.Item>
                                                    <Menu.Item leftSection={<IconTrash size={14} />} color="red">Cancelar</Menu.Item>
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
                            <IconArrowDown size={48} color="gray" />
                            <Text c="dimmed">Nenhuma despesa encontrada</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setAddOpen(true)}>
                                Registrar despesa
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Add Modal */}
            <Modal opened={addOpen} onClose={() => setAddOpen(false)} title="Nova Despesa" size="lg">
                <Stack gap="md">
                    <TextInput label="Fornecedor" placeholder="Nome do fornecedor" required />
                    <TextInput label="CNPJ/CPF" placeholder="00.000.000/0001-00" />
                    <Textarea label="Descrição" placeholder="Detalhes da despesa" />
                    <Select
                        label="Categoria" required
                        data={Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))}
                    />
                    <NumberInput label="Valor (R$)" placeholder="0,00" decimalScale={2} required prefix="R$ " />
                    <TextInput label="Nº da Nota Fiscal" placeholder="NF-e 000001" />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setAddOpen(false)}>Cancelar</Button>
                        <Button>Salvar Despesa</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
