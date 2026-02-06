'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, Select, Button, Table, Tabs, ThemeIcon, Progress,
    Modal, TextInput, NumberInput, Textarea, ActionIcon, Alert,
    Divider, SegmentedControl, Switch, CopyButton, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconCreditCard, IconCurrencyDollar, IconReceipt, IconQrcode,
    IconCash, IconArrowLeft, IconPlus, IconDownload, IconRefresh,
    IconCheck, IconX, IconClock, IconAlertTriangle, IconEye,
    IconCopy, IconExternalLink, IconMail, IconBrandWhatsapp,
    IconFileInvoice, IconSettings, IconChartBar, IconFilter
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

type PaymentProvider = 'stripe' | 'asaas' | 'mercado_pago' | 'pagseguro' | 'pagarme';
type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'debit_card';
type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
type TransactionStatus = 'approved' | 'pending' | 'refused' | 'refunded' | 'chargeback';

interface PaymentProviderConfig {
    id: PaymentProvider;
    name: string;
    logo: string;
    enabled: boolean;
    testMode: boolean;
    supportedMethods: PaymentMethod[];
    fees: {
        pix: number;
        credit_card: number;
        boleto: number;
        debit_card: number;
    };
}

interface Invoice {
    id: string;
    studentId: string;
    studentName: string;
    description: string;
    amount: number;
    dueDate: string;
    status: InvoiceStatus;
    paymentMethod?: PaymentMethod;
    provider?: PaymentProvider;
    paidAt?: string;
    pixCode?: string;
    boletoCode?: string;
    createdAt: string;
}

interface Transaction {
    id: string;
    invoiceId: string;
    studentName: string;
    amount: number;
    fee: number;
    netAmount: number;
    provider: PaymentProvider;
    method: PaymentMethod;
    status: TransactionStatus;
    createdAt: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const PROVIDERS: PaymentProviderConfig[] = [
    {
        id: 'stripe',
        name: 'Stripe',
        logo: '💳',
        enabled: true,
        testMode: true,
        supportedMethods: ['credit_card', 'pix'],
        fees: { pix: 0.4, credit_card: 3.99, boleto: 0, debit_card: 2.5 },
    },
    {
        id: 'asaas',
        name: 'Asaas',
        logo: '🅰️',
        enabled: true,
        testMode: true,
        supportedMethods: ['pix', 'credit_card', 'boleto'],
        fees: { pix: 1.99, credit_card: 3.49, boleto: 2.99, debit_card: 0 },
    },
    {
        id: 'mercado_pago',
        name: 'Mercado Pago',
        logo: '🤝',
        enabled: true,
        testMode: false,
        supportedMethods: ['pix', 'credit_card', 'boleto', 'debit_card'],
        fees: { pix: 0.99, credit_card: 4.99, boleto: 3.49, debit_card: 2.99 },
    },
    {
        id: 'pagseguro',
        name: 'PagSeguro',
        logo: '🔒',
        enabled: false,
        testMode: true,
        supportedMethods: ['pix', 'credit_card', 'boleto'],
        fees: { pix: 0.99, credit_card: 4.79, boleto: 2.99, debit_card: 0 },
    },
    {
        id: 'pagarme',
        name: 'Pagar.me',
        logo: '💰',
        enabled: false,
        testMode: true,
        supportedMethods: ['pix', 'credit_card', 'boleto'],
        fees: { pix: 0.99, credit_card: 2.99, boleto: 3.49, debit_card: 0 },
    },
];

const MOCK_INVOICES: Invoice[] = [
    {
        id: 'INV-001',
        studentId: '1',
        studentName: 'Maria Silva',
        description: 'Mensalidade Fevereiro 2026',
        amount: 335,
        dueDate: '2026-02-10',
        status: 'paid',
        paymentMethod: 'pix',
        provider: 'asaas',
        paidAt: '2026-02-08',
        createdAt: '2026-02-01',
    },
    {
        id: 'INV-002',
        studentId: '2',
        studentName: 'João Santos',
        description: 'Mensalidade Fevereiro 2026',
        amount: 450,
        dueDate: '2026-02-10',
        status: 'pending',
        pixCode: '00020126580014br.gov.bcb.pix0136...',
        createdAt: '2026-02-01',
    },
    {
        id: 'INV-003',
        studentId: '3',
        studentName: 'Ana Costa',
        description: 'Mensalidade Fevereiro 2026',
        amount: 335,
        dueDate: '2026-02-05',
        status: 'overdue',
        boletoCode: '23793.38128 60000.000003 00000.000400 1 84340000033500',
        createdAt: '2026-02-01',
    },
    {
        id: 'INV-004',
        studentId: '4',
        studentName: 'Pedro Lima',
        description: 'Mensalidade Fevereiro 2026',
        amount: 280,
        dueDate: '2026-02-10',
        status: 'paid',
        paymentMethod: 'credit_card',
        provider: 'stripe',
        paidAt: '2026-02-03',
        createdAt: '2026-02-01',
    },
    {
        id: 'INV-005',
        studentId: '5',
        studentName: 'Fernanda Rocha',
        description: 'Mensalidade Fevereiro 2026',
        amount: 335,
        dueDate: '2026-02-15',
        status: 'pending',
        pixCode: '00020126580014br.gov.bcb.pix0136...',
        createdAt: '2026-02-01',
    },
    {
        id: 'INV-006',
        studentId: '6',
        studentName: 'Lucas Oliveira',
        description: 'Material Didático',
        amount: 180,
        dueDate: '2026-02-20',
        status: 'pending',
        createdAt: '2026-02-05',
    },
    {
        id: 'INV-007',
        studentId: '1',
        studentName: 'Maria Silva',
        description: 'Upgrade Plano Premium',
        amount: 150,
        dueDate: '2026-02-15',
        status: 'paid',
        paymentMethod: 'pix',
        provider: 'mercado_pago',
        paidAt: '2026-02-04',
        createdAt: '2026-02-04',
    },
];

const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: 'TXN-001',
        invoiceId: 'INV-001',
        studentName: 'Maria Silva',
        amount: 335,
        fee: 6.68,
        netAmount: 328.32,
        provider: 'asaas',
        method: 'pix',
        status: 'approved',
        createdAt: '2026-02-08T14:32:00',
    },
    {
        id: 'TXN-002',
        invoiceId: 'INV-004',
        studentName: 'Pedro Lima',
        amount: 280,
        fee: 11.17,
        netAmount: 268.83,
        provider: 'stripe',
        method: 'credit_card',
        status: 'approved',
        createdAt: '2026-02-03T10:15:00',
    },
    {
        id: 'TXN-003',
        invoiceId: 'INV-007',
        studentName: 'Maria Silva',
        amount: 150,
        fee: 1.49,
        netAmount: 148.51,
        provider: 'mercado_pago',
        method: 'pix',
        status: 'approved',
        createdAt: '2026-02-04T09:45:00',
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusBadge(status: InvoiceStatus) {
    const config: Record<InvoiceStatus, { color: string; label: string }> = {
        pending: { color: 'yellow', label: 'Pendente' },
        paid: { color: 'green', label: 'Pago' },
        overdue: { color: 'red', label: 'Vencido' },
        cancelled: { color: 'gray', label: 'Cancelado' },
        refunded: { color: 'orange', label: 'Reembolsado' },
    };
    return <Badge color={config[status].color}>{config[status].label}</Badge>;
}

function getMethodBadge(method: PaymentMethod) {
    const config: Record<PaymentMethod, { color: string; label: string; icon: string }> = {
        pix: { color: 'teal', label: 'PIX', icon: '⚡' },
        credit_card: { color: 'blue', label: 'Cartão Crédito', icon: '💳' },
        boleto: { color: 'orange', label: 'Boleto', icon: '📄' },
        debit_card: { color: 'violet', label: 'Cartão Débito', icon: '💳' },
    };
    return (
        <Badge color={config[method].color} leftSection={config[method].icon} variant="light">
            {config[method].label}
        </Badge>
    );
}

function getProviderBadge(provider: PaymentProvider) {
    const config: Record<PaymentProvider, { color: string; label: string }> = {
        stripe: { color: 'violet', label: 'Stripe' },
        asaas: { color: 'blue', label: 'Asaas' },
        mercado_pago: { color: 'cyan', label: 'Mercado Pago' },
        pagseguro: { color: 'green', label: 'PagSeguro' },
        pagarme: { color: 'lime', label: 'Pagar.me' },
    };
    return <Badge color={config[provider].color} variant="dot">{config[provider].label}</Badge>;
}

// ============================================================================
// PROVIDER CARD
// ============================================================================

function ProviderCard({
    provider,
    onToggle
}: {
    provider: PaymentProviderConfig;
    onToggle: (id: PaymentProvider, enabled: boolean) => void;
}) {
    return (
        <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
                <Group gap="sm">
                    <Text size="xl">{provider.logo}</Text>
                    <div>
                        <Text fw={600}>{provider.name}</Text>
                        {provider.testMode && (
                            <Badge color="yellow" size="xs" variant="light">Modo Teste</Badge>
                        )}
                    </div>
                </Group>
                <Switch
                    checked={provider.enabled}
                    onChange={(e) => onToggle(provider.id, e.currentTarget.checked)}
                    color="green"
                />
            </Group>

            <Text size="xs" fw={500} c="dimmed" mb="xs">Métodos Suportados:</Text>
            <Group gap={4} mb="md">
                {provider.supportedMethods.map(method => (
                    <Badge key={method} size="xs" variant="light" color="gray">
                        {method === 'pix' && '⚡ PIX'}
                        {method === 'credit_card' && '💳 Crédito'}
                        {method === 'boleto' && '📄 Boleto'}
                        {method === 'debit_card' && '💳 Débito'}
                    </Badge>
                ))}
            </Group>

            <Divider mb="md" />

            <Text size="xs" fw={500} c="dimmed" mb="xs">Taxas:</Text>
            <Stack gap={4}>
                {provider.supportedMethods.map(method => (
                    <Group key={method} justify="space-between">
                        <Text size="xs">
                            {method === 'pix' && 'PIX'}
                            {method === 'credit_card' && 'Cartão Crédito'}
                            {method === 'boleto' && 'Boleto'}
                            {method === 'debit_card' && 'Cartão Débito'}
                        </Text>
                        <Badge size="xs" color={provider.fees[method] < 2 ? 'green' : provider.fees[method] < 4 ? 'yellow' : 'red'}>
                            {provider.fees[method]}%
                        </Badge>
                    </Group>
                ))}
            </Stack>

            <Button
                variant="light"
                fullWidth
                mt="md"
                leftSection={<IconSettings size={14} />}
                disabled={!provider.enabled}
            >
                Configurar
            </Button>
        </Card>
    );
}

// ============================================================================
// INVOICE MODAL
// ============================================================================

function CreateInvoiceModal({
    opened,
    onClose,
    onCreate,
}: {
    opened: boolean;
    onClose: () => void;
    onCreate: (invoice: Partial<Invoice>) => void;
}) {
    const [studentName, setStudentName] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | string>(335);
    const [dueDate, setDueDate] = useState('');

    const handleCreate = () => {
        if (!studentName || !description || !amount || !dueDate) {
            notifications.show({
                title: 'Erro',
                message: 'Preencha todos os campos',
                color: 'red',
            });
            return;
        }

        onCreate({
            studentName,
            description,
            amount: Number(amount),
            dueDate,
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
        });

        setStudentName('');
        setDescription('');
        setAmount(335);
        setDueDate('');
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Nova Cobrança" size="md">
            <Stack gap="md">
                <Select
                    label="Aluno"
                    placeholder="Selecione o aluno"
                    data={[
                        'Maria Silva',
                        'João Santos',
                        'Ana Costa',
                        'Pedro Lima',
                        'Fernanda Rocha',
                        'Lucas Oliveira',
                    ]}
                    value={studentName}
                    onChange={(v) => setStudentName(v || '')}
                    searchable
                />
                <TextInput
                    label="Descrição"
                    placeholder="Ex: Mensalidade Março 2026"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <NumberInput
                    label="Valor (R$)"
                    value={amount}
                    onChange={setAmount}
                    min={1}
                    decimalScale={2}
                    prefix="R$ "
                    thousandSeparator="."
                    decimalSeparator=","
                />
                <TextInput
                    label="Data de Vencimento"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />

                <Divider />

                <Group justify="flex-end">
                    <Button variant="light" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleCreate} leftSection={<IconPlus size={16} />}>
                        Criar Cobrança
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PaymentsPage() {
    const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
    const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
    const [providers, setProviders] = useState<PaymentProviderConfig[]>(PROVIDERS);
    const [activeTab, setActiveTab] = useState<string | null>('invoices');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
    const [period, setPeriod] = useState('current');

    // Toggle provider
    const handleToggleProvider = (id: PaymentProvider, enabled: boolean) => {
        setProviders(providers.map(p =>
            p.id === id ? { ...p, enabled } : p
        ));
        notifications.show({
            title: enabled ? 'Provedor Ativado' : 'Provedor Desativado',
            message: `${providers.find(p => p.id === id)?.name} foi ${enabled ? 'ativado' : 'desativado'}`,
            color: enabled ? 'green' : 'gray',
        });
    };

    // Create invoice
    const handleCreateInvoice = (data: Partial<Invoice>) => {
        const newInvoice: Invoice = {
            id: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
            studentId: Date.now().toString(),
            studentName: data.studentName!,
            description: data.description!,
            amount: data.amount!,
            dueDate: data.dueDate!,
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
        };
        setInvoices([newInvoice, ...invoices]);
        notifications.show({
            title: 'Cobrança Criada',
            message: `${newInvoice.id} criada para ${newInvoice.studentName}`,
            color: 'green',
        });
    };

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv =>
            statusFilter === 'all' || inv.status === statusFilter
        );
    }, [invoices, statusFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
        const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
        const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
        const totalFees = transactions.reduce((s, t) => s + t.fee, 0);
        const conversionRate = invoices.length > 0
            ? (invoices.filter(i => i.status === 'paid').length / invoices.length * 100)
            : 0;

        return { totalPending, totalPaid, totalOverdue, totalFees, conversionRate };
    }, [invoices, transactions]);

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/staff"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>💳 Pagamentos</Title>
                    <Text c="dimmed">Gerencie cobranças, transações e provedores</Text>
                </div>
                <Group>
                    <SegmentedControl
                        value={period}
                        onChange={setPeriod}
                        data={[
                            { value: 'current', label: 'Este Mês' },
                            { value: 'last', label: 'Mês Passado' },
                            { value: 'all', label: 'Todos' },
                        ]}
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
                        Nova Cobrança
                    </Button>
                </Group>
            </Group>

            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 2, md: 5 }} mb="lg">
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">A Receber</Text>
                        <ThemeIcon variant="light" color="yellow" size="md">
                            <IconClock size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        R$ {stats.totalPending.toLocaleString('pt-BR')}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {invoices.filter(i => i.status === 'pending').length} faturas
                    </Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Recebido</Text>
                        <ThemeIcon variant="light" color="green" size="md">
                            <IconCheck size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700} c="green">
                        R$ {stats.totalPaid.toLocaleString('pt-BR')}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {invoices.filter(i => i.status === 'paid').length} pagos
                    </Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Vencido</Text>
                        <ThemeIcon variant="light" color="red" size="md">
                            <IconAlertTriangle size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700} c="red">
                        R$ {stats.totalOverdue.toLocaleString('pt-BR')}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {invoices.filter(i => i.status === 'overdue').length} faturas
                    </Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Taxas Pagas</Text>
                        <ThemeIcon variant="light" color="gray" size="md">
                            <IconCurrencyDollar size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        R$ {stats.totalFees.toFixed(2).replace('.', ',')}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Custo de processamento
                    </Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Taxa de Pagamento</Text>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconChartBar size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {stats.conversionRate.toFixed(0)}%
                    </Text>
                    <Progress
                        value={stats.conversionRate}
                        color={stats.conversionRate > 80 ? 'green' : stats.conversionRate > 60 ? 'yellow' : 'red'}
                        size="sm"
                        mt="xs"
                    />
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab value="invoices" leftSection={<IconFileInvoice size={14} />}>
                        Cobranças ({invoices.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="transactions" leftSection={<IconReceipt size={14} />}>
                        Transações ({transactions.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="providers" leftSection={<IconCreditCard size={14} />}>
                        Provedores ({providers.filter(p => p.enabled).length}/{providers.length})
                    </Tabs.Tab>
                </Tabs.List>

                {/* Invoices Tab */}
                <Tabs.Panel value="invoices">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Cobranças</Text>
                            <Group>
                                <Select
                                    size="xs"
                                    value={statusFilter}
                                    onChange={(v) => setStatusFilter(v || 'all')}
                                    data={[
                                        { value: 'all', label: 'Todos os Status' },
                                        { value: 'pending', label: 'Pendente' },
                                        { value: 'paid', label: 'Pago' },
                                        { value: 'overdue', label: 'Vencido' },
                                    ]}
                                    leftSection={<IconFilter size={14} />}
                                    style={{ width: 180 }}
                                />
                                <Button variant="light" size="xs" leftSection={<IconDownload size={14} />}>
                                    Exportar
                                </Button>
                            </Group>
                        </Group>

                        <Table.ScrollContainer minWidth={800}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>ID</Table.Th>
                                        <Table.Th>Aluno</Table.Th>
                                        <Table.Th>Descrição</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Vencimento</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Método</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Ações</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredInvoices.map(invoice => (
                                        <Table.Tr key={invoice.id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{invoice.id}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{invoice.studentName}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">{invoice.description}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text size="sm" fw={600}>
                                                    R$ {invoice.amount.toLocaleString('pt-BR')}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Text size="sm">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {getStatusBadge(invoice.status)}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {invoice.paymentMethod ? (
                                                    getMethodBadge(invoice.paymentMethod)
                                                ) : (
                                                    <Text size="xs" c="dimmed">-</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Group gap={4} justify="center">
                                                    {invoice.pixCode && (
                                                        <Tooltip label="Copiar PIX">
                                                            <CopyButton value={invoice.pixCode}>
                                                                {({ copied, copy }) => (
                                                                    <ActionIcon
                                                                        variant="light"
                                                                        color={copied ? 'green' : 'teal'}
                                                                        size="sm"
                                                                        onClick={copy}
                                                                    >
                                                                        {copied ? <IconCheck size={14} /> : <IconQrcode size={14} />}
                                                                    </ActionIcon>
                                                                )}
                                                            </CopyButton>
                                                        </Tooltip>
                                                    )}
                                                    {invoice.boletoCode && (
                                                        <Tooltip label="Copiar código do boleto">
                                                            <CopyButton value={invoice.boletoCode}>
                                                                {({ copied, copy }) => (
                                                                    <ActionIcon
                                                                        variant="light"
                                                                        color={copied ? 'green' : 'orange'}
                                                                        size="sm"
                                                                        onClick={copy}
                                                                    >
                                                                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                                    </ActionIcon>
                                                                )}
                                                            </CopyButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip label="Enviar lembrete">
                                                        <ActionIcon variant="light" color="green" size="sm">
                                                            <IconBrandWhatsapp size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Enviar por email">
                                                        <ActionIcon variant="light" color="blue" size="sm">
                                                            <IconMail size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                </Tabs.Panel>

                {/* Transactions Tab */}
                <Tabs.Panel value="transactions">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Transações Recentes</Text>
                            <Button variant="light" size="xs" leftSection={<IconRefresh size={14} />}>
                                Atualizar
                            </Button>
                        </Group>

                        <Table.ScrollContainer minWidth={700}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>ID</Table.Th>
                                        <Table.Th>Aluno</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Valor</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Taxa</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Líquido</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Provedor</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Método</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Data</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {transactions.map(txn => (
                                        <Table.Tr key={txn.id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{txn.id}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{txn.studentName}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text size="sm">R$ {txn.amount.toLocaleString('pt-BR')}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text size="sm" c="red">-R$ {txn.fee.toFixed(2)}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text size="sm" fw={600} c="green">
                                                    R$ {txn.netAmount.toFixed(2)}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {getProviderBadge(txn.provider)}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {getMethodBadge(txn.method)}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Badge color="green" variant="light">Aprovado</Badge>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>
                                                <Text size="xs" c="dimmed">
                                                    {new Date(txn.createdAt).toLocaleString('pt-BR')}
                                                </Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                </Tabs.Panel>

                {/* Providers Tab */}
                <Tabs.Panel value="providers">
                    <Alert color="blue" variant="light" mb="lg" icon={<IconCreditCard size={16} />}>
                        <Text size="sm">
                            Configure seus provedores de pagamento. Você pode ter múltiplos provedores ativos simultaneamente.
                            Cada provedor suporta diferentes métodos de pagamento com taxas variadas.
                        </Text>
                    </Alert>

                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {providers.map(provider => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                onToggle={handleToggleProvider}
                            />
                        ))}
                    </SimpleGrid>

                    <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
                        <Text fw={600} mb="md">📊 Comparativo de Taxas</Text>
                        <Table.ScrollContainer minWidth={600}>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Provedor</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>PIX</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Cartão Crédito</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Boleto</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Cartão Débito</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {providers.map(p => (
                                        <Table.Tr key={p.id}>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Text>{p.logo}</Text>
                                                    <Text size="sm" fw={500}>{p.name}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {p.supportedMethods.includes('pix') ? (
                                                    <Badge color={p.fees.pix < 1 ? 'green' : p.fees.pix < 2 ? 'yellow' : 'orange'} variant="light">
                                                        {p.fees.pix}%
                                                    </Badge>
                                                ) : <Text size="xs" c="dimmed">-</Text>}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {p.supportedMethods.includes('credit_card') ? (
                                                    <Badge color={p.fees.credit_card < 3.5 ? 'green' : p.fees.credit_card < 4.5 ? 'yellow' : 'orange'} variant="light">
                                                        {p.fees.credit_card}%
                                                    </Badge>
                                                ) : <Text size="xs" c="dimmed">-</Text>}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {p.supportedMethods.includes('boleto') ? (
                                                    <Badge color={p.fees.boleto < 3 ? 'green' : 'yellow'} variant="light">
                                                        {p.fees.boleto}%
                                                    </Badge>
                                                ) : <Text size="xs" c="dimmed">-</Text>}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                {p.supportedMethods.includes('debit_card') ? (
                                                    <Badge color={p.fees.debit_card < 3 ? 'green' : 'yellow'} variant="light">
                                                        {p.fees.debit_card}%
                                                    </Badge>
                                                ) : <Text size="xs" c="dimmed">-</Text>}
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <Badge color={p.enabled ? 'green' : 'gray'} variant={p.enabled ? 'filled' : 'light'}>
                                                    {p.enabled ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                </Tabs.Panel>
            </Tabs>

            {/* Create Invoice Modal */}
            <CreateInvoiceModal
                opened={createModalOpened}
                onClose={closeCreateModal}
                onCreate={handleCreateInvoice}
            />
        </Container>
    );
}

