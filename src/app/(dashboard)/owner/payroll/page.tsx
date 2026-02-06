'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Button, Badge, Table, ActionIcon,
    Menu, Modal, TextInput, Select, NumberInput, Tabs, Paper, SimpleGrid, ThemeIcon,
    Progress, Divider, Avatar, Tooltip, Alert, Loader, Center
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconDots, IconEdit, IconCheck, IconX, IconCash, IconBuildingBank,
    IconCreditCard, IconReceipt, IconCalendar, IconUser, IconCurrencyReal,
    IconAlertCircle, IconFileInvoice, IconEye, IconSend, IconDownload,
    IconWallet, IconQrcode, IconClock, IconTrendingUp, IconUsers, IconChevronLeft
} from '@tabler/icons-react';
import Link from 'next/link';
import { ExportButton } from '@/components/shared';

interface PayrollRecord {
    id: string;
    userId: string;
    contractId: string;
    userName?: string;
    userEmail?: string;
    jobTitle?: string;
    department?: string;
    periodStart: number;
    periodEnd: number;
    paymentDueDate: number;
    payrollType: string;
    grossAmountCents: number;
    totalDeductionsCents: number;
    totalAdditionsCents: number;
    netAmountCents: number;
    paidAmountCents: number;
    status: string;
    hoursWorked?: number;
    createdAt: number;
}

interface StaffContract {
    id: string;
    userId: string;
    name?: string;
    email?: string;
    jobTitle: string;
    department: string;
    salaryCents?: number;
    hourlyRateCents?: number;
    status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'gray' },
    pending_approval: { label: 'Aguardando Aprovação', color: 'yellow' },
    approved: { label: 'Aprovado', color: 'blue' },
    scheduled: { label: 'Agendado', color: 'cyan' },
    partially_paid: { label: 'Pago Parcialmente', color: 'orange' },
    paid: { label: 'Pago', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
    disputed: { label: 'Contestado', color: 'pink' },
};

const payrollTypeConfig: Record<string, string> = {
    salary: 'Salário',
    hourly: 'Hora Trabalhada',
    bonus: 'Bônus',
    commission: 'Comissão',
    reimbursement: 'Reembolso',
    advance: 'Adiantamento',
    other: 'Outro',
};

const departmentConfig: Record<string, string> = {
    admin: 'Administrativo',
    reception: 'Recepção',
    marketing: 'Marketing',
    finance: 'Financeiro',
    maintenance: 'Manutenção',
    it: 'TI',
    management: 'Gestão',
    other: 'Outro',
};

const methodTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    bank_transfer: { label: 'Transferência Bancária', icon: <IconBuildingBank size={16} /> },
    pix: { label: 'PIX', icon: <IconQrcode size={16} /> },
    cash: { label: 'Dinheiro', icon: <IconCash size={16} /> },
    credit_card: { label: 'Cartão de Crédito', icon: <IconCreditCard size={16} /> },
    debit_card: { label: 'Cartão de Débito', icon: <IconCreditCard size={16} /> },
    digital_wallet: { label: 'Carteira Digital', icon: <IconWallet size={16} /> },
    check: { label: 'Cheque', icon: <IconReceipt size={16} /> },
};

export default function OwnerPayrollPage() {
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [contracts, setContracts] = useState<StaffContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

    const [formData, setFormData] = useState({
        contractId: '',
        payrollType: 'salary',
        periodStart: null as Date | null,
        periodEnd: null as Date | null,
        paymentDueDate: null as Date | null,
        grossAmountCents: 0,
        hoursWorked: 0,
        deductions: {} as Record<string, number>,
        additions: {} as Record<string, number>,
        notes: '',
    });

    const [paymentData, setPaymentData] = useState({
        amountCents: 0,
        methodType: 'pix',
        notes: '',
    });

    useEffect(() => {
        fetchPayrolls();
        fetchContracts();
    }, []);

    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/staff-payroll');
            const json = await res.json();
            if (json.data) {
                setPayrolls(json.data);
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContracts = async () => {
        try {
            const res = await fetch('/api/staff-contracts?status=active');
            const json = await res.json();
            if (json.data) {
                setContracts(json.data);
            }
        } catch (error) {
            console.error('Error fetching contracts:', error);
        }
    };

    const handleOpenCreate = () => {
        setSelectedPayroll(null);
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);

        setFormData({
            contractId: '',
            payrollType: 'salary',
            periodStart: firstDay,
            periodEnd: lastDay,
            paymentDueDate: dueDate,
            grossAmountCents: 0,
            hoursWorked: 0,
            deductions: {},
            additions: {},
            notes: '',
        });
        openModal();
    };

    const handleContractSelect = (contractId: string | null) => {
        if (!contractId) return;
        const contract = contracts.find(c => c.id === contractId);
        if (contract) {
            setFormData(prev => ({
                ...prev,
                contractId,
                grossAmountCents: contract.salaryCents || 0,
            }));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const contract = contracts.find(c => c.id === formData.contractId);
            if (!contract) return;

            const totalDeductions = Object.values(formData.deductions).reduce((a, b) => a + b, 0);
            const totalAdditions = Object.values(formData.additions).reduce((a, b) => a + b, 0);

            const payload = {
                contractId: formData.contractId,
                userId: contract.userId,
                payrollType: formData.payrollType,
                periodStart: formData.periodStart?.getTime(),
                periodEnd: formData.periodEnd?.getTime(),
                paymentDueDate: formData.paymentDueDate?.getTime(),
                grossAmountCents: formData.grossAmountCents,
                hoursWorked: formData.hoursWorked || null,
                deductions: formData.deductions,
                totalDeductionsCents: totalDeductions,
                additions: formData.additions,
                totalAdditionsCents: totalAdditions,
                netAmountCents: formData.grossAmountCents - totalDeductions + totalAdditions,
                notes: formData.notes || null,
            };

            await fetch('/api/staff-payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            await fetchPayrolls();
            closeModal();
        } catch (error) {
            console.error('Error saving payroll:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await fetch(`/api/staff-payroll/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' }),
            });
            await fetchPayrolls();
        } catch (error) {
            console.error('Error approving payroll:', error);
        }
    };

    const handleOpenPayment = (payroll: PayrollRecord) => {
        setSelectedPayroll(payroll);
        const remaining = payroll.netAmountCents - (payroll.paidAmountCents || 0);
        setPaymentData({
            amountCents: remaining,
            methodType: 'pix',
            notes: '',
        });
        openPaymentModal();
    };

    const handlePayment = async () => {
        if (!selectedPayroll) return;
        try {
            setSaving(true);
            await fetch('/api/payroll-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payrollId: selectedPayroll.id,
                    amountCents: paymentData.amountCents,
                    methodType: paymentData.methodType,
                    status: 'completed',
                    notes: paymentData.notes || null,
                }),
            });
            await fetchPayrolls();
            closePaymentModal();
        } catch (error) {
            console.error('Error creating payment:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await fetch(`/api/staff-payroll/${id}`, { method: 'DELETE' });
            await fetchPayrolls();
        } catch (error) {
            console.error('Error cancelling payroll:', error);
        }
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100);
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('pt-BR');
    };

    const formatPeriod = (start: number, end: number) => {
        const startDate = new Date(start);
        return `${startDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
    };

    // Stats
    const totalPending = payrolls
        .filter(p => ['draft', 'pending_approval', 'approved'].includes(p.status))
        .reduce((sum, p) => sum + p.netAmountCents, 0);

    const totalPaid = payrolls
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.netAmountCents, 0);

    const pendingCount = payrolls.filter(p => ['pending_approval', 'approved'].includes(p.status)).length;

    const filteredPayrolls = activeTab === 'all'
        ? payrolls
        : payrolls.filter(p => {
            if (activeTab === 'pending') return ['draft', 'pending_approval', 'approved', 'scheduled'].includes(p.status);
            if (activeTab === 'partial') return p.status === 'partially_paid';
            if (activeTab === 'paid') return p.status === 'paid';
            return true;
        });

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Center h={400}>
                    <Loader size="lg" />
                </Center>
            </Container>
        );
    }

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/owner" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Folha de Pagamento 💰</Title>
                        <Text c="dimmed">Gestão de salários, pagamentos e holerites</Text>
                    </div>
                </Group>
                <Group>
                    <ExportButton
                        data={filteredPayrolls.map(p => ({
                            userName: p.userName || '-',
                            userEmail: p.userEmail || '-',
                            jobTitle: p.jobTitle || '-',
                            department: departmentConfig[p.department || ''] || p.department || '-',
                            payrollType: payrollTypeConfig[p.payrollType] || p.payrollType,
                            period: formatPeriod(p.periodStart, p.periodEnd),
                            grossAmount: formatCurrency(p.grossAmountCents),
                            deductions: formatCurrency(p.totalDeductionsCents),
                            additions: formatCurrency(p.totalAdditionsCents),
                            netAmount: formatCurrency(p.netAmountCents),
                            paidAmount: formatCurrency(p.paidAmountCents),
                            status: statusConfig[p.status]?.label || p.status,
                            dueDate: formatDate(p.paymentDueDate),
                        }))}
                        columns={[
                            { key: 'userName', label: 'Funcionário' },
                            { key: 'jobTitle', label: 'Cargo' },
                            { key: 'department', label: 'Departamento' },
                            { key: 'payrollType', label: 'Tipo' },
                            { key: 'period', label: 'Período' },
                            { key: 'grossAmount', label: 'Bruto' },
                            { key: 'deductions', label: 'Descontos' },
                            { key: 'additions', label: 'Adicionais' },
                            { key: 'netAmount', label: 'Líquido' },
                            { key: 'paidAmount', label: 'Pago' },
                            { key: 'status', label: 'Status' },
                            { key: 'dueDate', label: 'Vencimento' },
                        ]}
                        title="Folha de Pagamento"
                        filename="folha_pagamento"
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar"
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
                        Nova Folha
                    </Button>
                </Group>
            </Group>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                Total Pendente
                            </Text>
                            <Text size="xl" fw={700} c="orange">
                                {formatCurrency(totalPending)}
                            </Text>
                        </div>
                        <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                            <IconClock size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                Total Pago (Mês)
                            </Text>
                            <Text size="xl" fw={700} c="green">
                                {formatCurrency(totalPaid)}
                            </Text>
                        </div>
                        <ThemeIcon size="lg" radius="md" variant="light" color="green">
                            <IconCheck size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                Aguardando Aprovação
                            </Text>
                            <Text size="xl" fw={700} c="blue">
                                {pendingCount}
                            </Text>
                        </div>
                        <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                            <IconFileInvoice size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                Funcionários Ativos
                            </Text>
                            <Text size="xl" fw={700}>
                                {contracts.length}
                            </Text>
                        </div>
                        <ThemeIcon size="lg" radius="md" variant="light">
                            <IconUsers size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todos</Tabs.Tab>
                    <Tabs.Tab value="pending" rightSection={
                        pendingCount > 0 && <Badge size="xs" variant="filled" color="orange">{pendingCount}</Badge>
                    }>
                        Pendentes
                    </Tabs.Tab>
                    <Tabs.Tab value="partial">Pagos Parcialmente</Tabs.Tab>
                    <Tabs.Tab value="paid">Pagos</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Payroll List */}
            {filteredPayrolls.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <IconFileInvoice size={48} color="gray" style={{ margin: '0 auto' }} />
                    <Text mt="md" c="dimmed">Nenhuma folha de pagamento encontrada</Text>
                    <Button mt="md" variant="light" onClick={handleOpenCreate}>
                        Criar Primeira Folha
                    </Button>
                </Card>
            ) : (
                <Card withBorder p={0}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Funcionário</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Valor Líquido</Table.Th>
                                <Table.Th>Progresso</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredPayrolls.map((payroll) => {
                                const status = statusConfig[payroll.status] || { label: payroll.status, color: 'gray' };
                                const paidPercent = payroll.netAmountCents > 0
                                    ? Math.round((payroll.paidAmountCents / payroll.netAmountCents) * 100)
                                    : 0;
                                const remaining = payroll.netAmountCents - (payroll.paidAmountCents || 0);

                                return (
                                    <Table.Tr key={payroll.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size="sm" radius="xl" color="blue">
                                                    {payroll.userName?.charAt(0) || '?'}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>{payroll.userName || 'Não definido'}</Text>
                                                    <Text size="xs" c="dimmed">
                                                        {payroll.jobTitle} • {departmentConfig[payroll.department || ''] || payroll.department}
                                                    </Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{formatPeriod(payroll.periodStart, payroll.periodEnd)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" size="sm">
                                                {payrollTypeConfig[payroll.payrollType] || payroll.payrollType}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={600}>{formatCurrency(payroll.netAmountCents)}</Text>
                                            {payroll.paidAmountCents > 0 && payroll.paidAmountCents < payroll.netAmountCents && (
                                                <Text size="xs" c="dimmed">
                                                    Pago: {formatCurrency(payroll.paidAmountCents)}
                                                </Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td style={{ width: 120 }}>
                                            <Tooltip label={`${paidPercent}% pago`}>
                                                <Progress
                                                    value={paidPercent}
                                                    size="sm"
                                                    color={paidPercent === 100 ? 'green' : paidPercent > 0 ? 'orange' : 'gray'}
                                                />
                                            </Tooltip>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={status.color}>{status.label}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconCalendar size={14} />
                                                <Text size="sm">{formatDate(payroll.paymentDueDate)}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle">
                                                        <IconDots size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<IconEye size={14} />}>
                                                        Ver Detalhes
                                                    </Menu.Item>
                                                    {payroll.status === 'draft' && (
                                                        <Menu.Item
                                                            leftSection={<IconSend size={14} />}
                                                            onClick={() => handleApprove(payroll.id)}
                                                        >
                                                            Enviar para Aprovação
                                                        </Menu.Item>
                                                    )}
                                                    {payroll.status === 'pending_approval' && (
                                                        <Menu.Item
                                                            leftSection={<IconCheck size={14} />}
                                                            color="green"
                                                            onClick={() => handleApprove(payroll.id)}
                                                        >
                                                            Aprovar
                                                        </Menu.Item>
                                                    )}
                                                    {['approved', 'scheduled', 'partially_paid'].includes(payroll.status) && (
                                                        <Menu.Item
                                                            leftSection={<IconCash size={14} />}
                                                            color="green"
                                                            onClick={() => handleOpenPayment(payroll)}
                                                        >
                                                            Registrar Pagamento {remaining > 0 && `(${formatCurrency(remaining)})`}
                                                        </Menu.Item>
                                                    )}
                                                    <Menu.Item leftSection={<IconDownload size={14} />}>
                                                        Baixar Holerite
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    {payroll.status !== 'paid' && (
                                                        <Menu.Item
                                                            color="red"
                                                            leftSection={<IconX size={14} />}
                                                            onClick={() => handleCancel(payroll.id)}
                                                        >
                                                            Cancelar
                                                        </Menu.Item>
                                                    )}
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

            {/* Create Payroll Modal */}
            <Modal
                opened={modalOpened}
                onClose={closeModal}
                title="Nova Folha de Pagamento"
                size="lg"
            >
                <Stack>
                    <Select
                        label="Funcionário"
                        placeholder="Selecione o funcionário"
                        data={contracts.map(c => ({
                            value: c.id,
                            label: `${c.name || c.email} - ${c.jobTitle}`,
                        }))}
                        value={formData.contractId}
                        onChange={handleContractSelect}
                        searchable
                        required
                    />
                    <Group grow>
                        <Select
                            label="Tipo"
                            data={Object.entries(payrollTypeConfig).map(([value, label]) => ({ value, label }))}
                            value={formData.payrollType}
                            onChange={(v) => setFormData({ ...formData, payrollType: v || 'salary' })}
                            required
                        />
                        <DateInput
                            label="Vencimento"
                            placeholder="Data de pagamento"
                            value={formData.paymentDueDate}
                            onChange={(v) => setFormData({ ...formData, paymentDueDate: v ? (typeof v === 'string' ? new Date(v) : v) : null })}
                            required
                        />
                    </Group>
                    <Group grow>
                        <DateInput
                            label="Período Início"
                            value={formData.periodStart}
                            onChange={(v) => setFormData({ ...formData, periodStart: v ? (typeof v === 'string' ? new Date(v) : v) : null })}
                            required
                        />
                        <DateInput
                            label="Período Fim"
                            value={formData.periodEnd}
                            onChange={(v) => setFormData({ ...formData, periodEnd: v ? (typeof v === 'string' ? new Date(v) : v) : null })}
                            required
                        />
                    </Group>
                    <Divider label="Valores" labelPosition="center" />
                    <Group grow>
                        <NumberInput
                            label="Valor Bruto (R$)"
                            placeholder="0,00"
                            value={formData.grossAmountCents / 100}
                            onChange={(v) => setFormData({ ...formData, grossAmountCents: (Number(v) || 0) * 100 })}
                            decimalScale={2}
                            fixedDecimalScale
                            leftSection={<IconCurrencyReal size={16} />}
                            required
                        />
                        {formData.payrollType === 'hourly' && (
                            <NumberInput
                                label="Horas Trabalhadas"
                                placeholder="0"
                                value={formData.hoursWorked}
                                onChange={(v) => setFormData({ ...formData, hoursWorked: Number(v) || 0 })}
                            />
                        )}
                    </Group>

                    <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />}>
                        <Text size="sm">
                            Valor Líquido: <strong>{formatCurrency(
                                formData.grossAmountCents -
                                Object.values(formData.deductions).reduce((a, b) => a + b, 0) +
                                Object.values(formData.additions).reduce((a, b) => a + b, 0)
                            )}</strong>
                        </Text>
                    </Alert>

                    <TextInput
                        label="Observações"
                        placeholder="Notas adicionais..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.currentTarget.value })}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave} loading={saving}>
                            Criar Folha
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Payment Modal */}
            <Modal
                opened={paymentModalOpened}
                onClose={closePaymentModal}
                title={`Registrar Pagamento - ${selectedPayroll?.userName}`}
                size="md"
            >
                <Stack>
                    {selectedPayroll && (
                        <Alert variant="light" color="blue">
                            <Group justify="space-between">
                                <Text size="sm">Valor Total:</Text>
                                <Text size="sm" fw={600}>{formatCurrency(selectedPayroll.netAmountCents)}</Text>
                            </Group>
                            <Group justify="space-between">
                                <Text size="sm">Já Pago:</Text>
                                <Text size="sm">{formatCurrency(selectedPayroll.paidAmountCents || 0)}</Text>
                            </Group>
                            <Divider my="xs" />
                            <Group justify="space-between">
                                <Text size="sm" fw={600}>Restante:</Text>
                                <Text size="sm" fw={600} c="orange">
                                    {formatCurrency(selectedPayroll.netAmountCents - (selectedPayroll.paidAmountCents || 0))}
                                </Text>
                            </Group>
                        </Alert>
                    )}

                    <NumberInput
                        label="Valor do Pagamento (R$)"
                        placeholder="0,00"
                        value={paymentData.amountCents / 100}
                        onChange={(v) => setPaymentData({ ...paymentData, amountCents: (Number(v) || 0) * 100 })}
                        decimalScale={2}
                        fixedDecimalScale
                        leftSection={<IconCurrencyReal size={16} />}
                        required
                    />

                    <Select
                        label="Método de Pagamento"
                        data={Object.entries(methodTypeConfig).map(([value, { label }]) => ({ value, label }))}
                        value={paymentData.methodType}
                        onChange={(v) => setPaymentData({ ...paymentData, methodType: v || 'pix' })}
                        leftSection={methodTypeConfig[paymentData.methodType]?.icon}
                        required
                    />

                    <TextInput
                        label="Observações"
                        placeholder="Referência, comprovante, etc."
                        value={paymentData.notes}
                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.currentTarget.value })}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closePaymentModal}>Cancelar</Button>
                        <Button
                            onClick={handlePayment}
                            loading={saving}
                            leftSection={<IconCheck size={16} />}
                            color="green"
                        >
                            Confirmar Pagamento
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

