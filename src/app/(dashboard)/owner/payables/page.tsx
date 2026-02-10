'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Modal, Loader, Center, Table, ActionIcon, Menu,
    ThemeIcon, Select, SimpleGrid, Tabs, Progress, NumberInput,
    FileInput, Textarea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DateInput } from '@mantine/dates';
import {
    IconPlus, IconSearch, IconDots, IconEdit, IconTrash, IconCheck,
    IconReceipt, IconUpload, IconCalendar, IconFilter,
    IconAlertCircle, IconClock, IconCash, IconBuilding, IconRefresh
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface Payable {
    id: string;
    vendorName: string;
    vendorDocument: string | null;
    invoiceNumber: string | null;
    description: string | null;
    category: string;
    amountCents: number;
    dueDate: number;
    paidDate: number | null;
    status: 'pending' | 'scheduled' | 'paid' | 'overdue' | 'cancelled';
    isRecurring: boolean;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
    rent: { label: 'Aluguel', color: 'blue' },
    utilities: { label: 'Utilidades', color: 'cyan' },
    supplies: { label: 'Suprimentos', color: 'green' },
    marketing: { label: 'Marketing', color: 'pink' },
    software: { label: 'Software', color: 'violet' },
    maintenance: { label: 'Manutenção', color: 'orange' },
    insurance: { label: 'Seguro', color: 'teal' },
    taxes: { label: 'Impostos', color: 'red' },
    payroll: { label: 'Folha', color: 'indigo' },
    other: { label: 'Outros', color: 'gray' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'yellow' },
    scheduled: { label: 'Agendado', color: 'blue' },
    paid: { label: 'Pago', color: 'green' },
    overdue: { label: 'Vencido', color: 'red' },
    cancelled: { label: 'Cancelado', color: 'gray' },
};



export default function OwnerPayablesPage() {
    const [payables, setPayables] = useState<Payable[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
    const [formData, setFormData] = useState({
        vendorName: '',
        vendorDocument: '',
        invoiceNumber: '',
        description: '',
        category: 'other',
        amountCents: 0,
        dueDate: null as Date | null,
        isRecurring: false,
        recurrenceInterval: '',
    });

    // Fetch payables on mount
    useEffect(() => {
        fetchPayables();
    }, []);

    const fetchPayables = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/payables');
            const json = await res.json();
            if (json.data) {
                setPayables(json.data.map((p: any) => ({
                    ...p,
                    isRecurring: p.isRecurring === 1,
                })));
            }
        } catch (error) {
            console.error('Error fetching payables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingPayable(null);
        setFormData({
            vendorName: '',
            vendorDocument: '',
            invoiceNumber: '',
            description: '',
            category: 'other',
            amountCents: 0,
            dueDate: null,
            isRecurring: false,
            recurrenceInterval: '',
        });
        openModal();
    };

    const handleOpenEdit = (payable: Payable) => {
        setEditingPayable(payable);
        setFormData({
            vendorName: payable.vendorName,
            vendorDocument: payable.vendorDocument || '',
            invoiceNumber: payable.invoiceNumber || '',
            description: payable.description || '',
            category: payable.category,
            amountCents: payable.amountCents,
            dueDate: new Date(payable.dueDate),
            isRecurring: payable.isRecurring,
            recurrenceInterval: '',
        });
        openModal();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                vendorName: formData.vendorName,
                vendorDocument: formData.vendorDocument || null,
                invoiceNumber: formData.invoiceNumber || null,
                description: formData.description || null,
                category: formData.category,
                amountCents: formData.amountCents,
                dueDate: formData.dueDate?.getTime() || Date.now(),
                isRecurring: formData.isRecurring,
                recurrenceInterval: formData.recurrenceInterval || null,
            };

            if (editingPayable) {
                // Update existing
                await fetch(`/api/payables/${editingPayable.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                // Create new
                await fetch('/api/payables', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            await fetchPayables();
            closeModal();
        } catch (error) {
            console.error('Error saving payable:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = async (id: string) => {
        try {
            await fetch(`/api/payables/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid', paidDate: Date.now() }),
            });
            await fetchPayables();
        } catch (error) {
            console.error('Error marking payable as paid:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/payables/${id}`, { method: 'DELETE' });
            await fetchPayables();
        } catch (error) {
            console.error('Error deleting payable:', error);
        }
    };

    const formatCurrency = (cents: number) => {
        return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('pt-BR');
    };

    const filteredPayables = payables.filter(p => {
        const matchesSearch = p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
            (p.description?.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = !statusFilter || p.status === statusFilter;
        const matchesCategory = !categoryFilter || p.category === categoryFilter;
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'pending' && (p.status === 'pending' || p.status === 'overdue')) ||
            (activeTab === 'paid' && p.status === 'paid') ||
            (activeTab === 'recurring' && p.isRecurring);
        return matchesSearch && matchesStatus && matchesCategory && matchesTab;
    });

    const stats = {
        totalPending: payables.filter(p => p.status === 'pending' || p.status === 'overdue')
            .reduce((sum, p) => sum + p.amountCents, 0),
        overdue: payables.filter(p => p.status === 'overdue').length,
        dueThisWeek: payables.filter(p => {
            const dueDate = new Date(p.dueDate);
            const now = new Date();
            const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return p.status === 'pending' && dueDate <= weekAhead && dueDate >= now;
        }).length,
        paidThisMonth: payables.filter(p => {
            if (!p.paidDate) return false;
            const paidDate = new Date(p.paidDate);
            const now = new Date();
            return p.status === 'paid' &&
                paidDate.getMonth() === now.getMonth() &&
                paidDate.getFullYear() === now.getFullYear();
        }).reduce((sum, p) => sum + p.amountCents, 0),
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Contas a Pagar</Title>
                    <Text c="dimmed">Gerencie despesas e pagamentos de fornecedores</Text>
                </div>
                <Group>
                    <ExportButton
                        data={filteredPayables.map(p => ({
                            vendorName: p.vendorName,
                            vendorDocument: p.vendorDocument || '-',
                            invoiceNumber: p.invoiceNumber || '-',
                            description: p.description || '-',
                            category: categoryConfig[p.category]?.label || p.category,
                            amount: formatCurrency(p.amountCents),
                            dueDate: new Date(p.dueDate).toLocaleDateString('pt-BR'),
                            paidDate: p.paidDate ? new Date(p.paidDate).toLocaleDateString('pt-BR') : '-',
                            status: statusConfig[p.status]?.label || p.status,
                            isRecurring: p.isRecurring ? 'Sim' : 'Não',
                        }))}
                        columns={[
                            { key: 'vendorName', label: 'Fornecedor' },
                            { key: 'vendorDocument', label: 'CNPJ/CPF' },
                            { key: 'invoiceNumber', label: 'Nº Nota' },
                            { key: 'description', label: 'Descrição' },
                            { key: 'category', label: 'Categoria' },
                            { key: 'amount', label: 'Valor' },
                            { key: 'dueDate', label: 'Vencimento' },
                            { key: 'paidDate', label: 'Data Pgto' },
                            { key: 'status', label: 'Status' },
                            { key: 'isRecurring', label: 'Recorrente' },
                        ]}
                        title="Contas a Pagar"
                        filename="contas_pagar"
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar"
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
                        Nova Despesa
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="yellow">
                            <IconClock size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{formatCurrency(stats.totalPending)}</Text>
                            <Text size="xs" c="dimmed">A Pagar</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="red">
                            <IconAlertCircle size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.overdue}</Text>
                            <Text size="xs" c="dimmed">Vencidas</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconCalendar size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.dueThisWeek}</Text>
                            <Text size="xs" c="dimmed">Vencem esta semana</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconCash size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{formatCurrency(stats.paidThisMonth)}</Text>
                            <Text size="xs" c="dimmed">Pago este mês</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab} mb="lg">
                <Tabs.List>
                    <Tabs.Tab value="all">Todas</Tabs.Tab>
                    <Tabs.Tab value="pending" leftSection={<IconClock size={14} />}>
                        Pendentes ({payables.filter(p => p.status === 'pending' || p.status === 'overdue').length})
                    </Tabs.Tab>
                    <Tabs.Tab value="paid" leftSection={<IconCheck size={14} />}>
                        Pagas
                    </Tabs.Tab>
                    <Tabs.Tab value="recurring" leftSection={<IconRefresh size={14} />}>
                        Recorrentes
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Filters */}
            <Group mb="lg">
                <TextInput
                    placeholder="Buscar fornecedor..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="Categoria"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    data={Object.entries(categoryConfig).map(([value, { label }]) => ({ value, label }))}
                    w={180}
                />
                <Select
                    placeholder="Status"
                    leftSection={<IconFilter size={16} />}
                    clearable
                    value={statusFilter}
                    onChange={setStatusFilter}
                    data={Object.entries(statusConfig).map(([value, { label }]) => ({ value, label }))}
                    w={150}
                />
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredPayables.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconReceipt size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhuma despesa encontrada</Title>
                    <Text c="dimmed" mb="lg">
                        {payables.length === 0
                            ? 'Cadastre a primeira despesa'
                            : 'Tente ajustar os filtros'}
                    </Text>
                </Card>
            ) : (
                <Card withBorder p={0}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fornecedor</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Categoria</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredPayables.map((payable) => {
                                const category = categoryConfig[payable.category] || categoryConfig.other;
                                const status = statusConfig[payable.status];
                                return (
                                    <Table.Tr key={payable.id}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <ThemeIcon size="sm" variant="light" color="gray">
                                                    <IconBuilding size={14} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={500} size="sm">{payable.vendorName}</Text>
                                                    {payable.invoiceNumber && (
                                                        <Text size="xs" c="dimmed">NF: {payable.invoiceNumber}</Text>
                                                    )}
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" lineClamp={1}>
                                                {payable.description || '-'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={category.color} variant="light" size="sm">
                                                {category.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text fw={600}>{formatCurrency(payable.amountCents)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconCalendar size={14} />
                                                <Text size="sm">{formatDate(payable.dueDate)}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={status.color}>{status.label}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle">
                                                        <IconDots size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    {payable.status !== 'paid' && (
                                                        <Menu.Item
                                                            leftSection={<IconCheck size={14} />}
                                                            onClick={() => handleMarkPaid(payable.id)}
                                                        >
                                                            Marcar como Pago
                                                        </Menu.Item>
                                                    )}
                                                    <Menu.Item
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => handleOpenEdit(payable)}
                                                    >
                                                        Editar
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(payable.id)}>
                                                        Excluir
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                opened={modalOpened}
                onClose={closeModal}
                title={editingPayable ? 'Editar Despesa' : 'Nova Despesa'}
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Fornecedor"
                        placeholder="Nome do fornecedor"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        required
                    />
                    <Group grow>
                        <TextInput
                            label="CNPJ/CPF"
                            placeholder="XX.XXX.XXX/XXXX-XX"
                            value={formData.vendorDocument}
                            onChange={(e) => setFormData({ ...formData, vendorDocument: e.target.value })}
                        />
                        <TextInput
                            label="Número da NF"
                            placeholder="Número da nota fiscal"
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        />
                    </Group>
                    <Textarea
                        label="Descrição"
                        placeholder="Descrição da despesa"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <Group grow>
                        <Select
                            label="Categoria"
                            data={Object.entries(categoryConfig).map(([value, { label }]) => ({ value, label }))}
                            value={formData.category}
                            onChange={(v) => setFormData({ ...formData, category: v || 'other' })}
                            required
                        />
                        <NumberInput
                            label="Valor (R$)"
                            placeholder="0,00"
                            value={formData.amountCents / 100}
                            onChange={(v) => setFormData({ ...formData, amountCents: (Number(v) || 0) * 100 })}
                            decimalScale={2}
                            fixedDecimalScale
                            required
                        />
                    </Group>
                    <Group grow>
                        <DateInput
                            label="Data de Vencimento"
                            placeholder="Selecione a data"
                            value={formData.dueDate}
                            onChange={(v) => setFormData({ ...formData, dueDate: v ? (typeof v === 'string' ? new Date(v) : v) : null })}
                            required
                        />
                        <Select
                            label="Recorrência"
                            placeholder="Selecione"
                            data={[
                                { value: '', label: 'Não recorrente' },
                                { value: 'monthly', label: 'Mensal' },
                                { value: 'quarterly', label: 'Trimestral' },
                                { value: 'annually', label: 'Anual' },
                            ]}
                            value={formData.recurrenceInterval}
                            onChange={(v) => setFormData({ ...formData, recurrenceInterval: v || '', isRecurring: !!v })}
                        />
                    </Group>
                    <FileInput
                        label="Anexar Nota Fiscal"
                        placeholder="Clique para enviar arquivo"
                        leftSection={<IconUpload size={16} />}
                        accept="application/pdf,image/*"
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave}>
                            {editingPayable ? 'Salvar' : 'Criar Despesa'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

