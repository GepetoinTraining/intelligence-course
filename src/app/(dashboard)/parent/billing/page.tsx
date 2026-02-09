'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Avatar, ThemeIcon, Paper, Table, ActionIcon, Tabs, Modal, Divider,
    Switch, Notification, Tooltip, Progress
} from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import {
    IconChevronLeft, IconReceipt, IconCreditCard, IconDownload,
    IconCheck, IconClock, IconAlertTriangle, IconCalendar,
    IconCash, IconFileInvoice, IconHistory, IconQrcode,
    IconRefresh, IconMail, IconPrinter
} from '@tabler/icons-react';
import Link from 'next/link';
import { ExportButton } from '@/components/shared';

interface Invoice {
    id: string;
    description: string;
    studentName: string;
    dueDate: string;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    paidDate?: string;
    paymentMethod?: string;
    installment?: { current: number; total: number };
}

// Mock data
const MOCK_INVOICES: Invoice[] = [];

const statusColors = {
    pending: 'yellow',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
};

const statusLabels = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
};

const statusIcons = {
    pending: IconClock,
    paid: IconCheck,
    overdue: IconAlertTriangle,
    cancelled: IconClock,
};

export default function ParentBillingPage() {
    const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentModal, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
    const [pdfModal, { open: openPdfModal, close: closePdfModal }] = useDisclosure(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Auto-pay settings
    const [autoPay, setAutoPay] = useLocalStorage<boolean>({
        key: 'parent-auto-pay',
        defaultValue: false,
    });
    const [autoPayCard, setAutoPayCard] = useState('**** **** **** 4242');

    const handlePayClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        openPaymentModal();
    };

    // Simulate PDF download
    const handleDownloadPdf = (invoice: Invoice) => {
        setDownloadingId(invoice.id);
        setSelectedInvoice(invoice);

        // Simulate download
        setTimeout(() => {
            setDownloadingId(null);
            openPdfModal();
        }, 1000);
    };

    // Simulate PDF content generation
    const generateInvoicePdf = (invoice: Invoice) => {
        // In a real app, this would generate a PDF blob
        const pdfContent = `
NOTA FISCAL - Intelligence Course

-------------------------------------------
Número: ${invoice.id.toUpperCase()}
Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}
Vencimento: ${formatDate(invoice.dueDate)}
-------------------------------------------

DADOS DO ALUNO
Nome: ${invoice.studentName}
Turma: Turma A - Manhã

DESCRIÇÃO
${invoice.description}
${invoice.installment ? `Parcela: ${invoice.installment.current}/${invoice.installment.total}` : ''}

VALORES
Valor Bruto: ${formatCurrency(invoice.grossAmount)}
Desconto: ${formatCurrency(invoice.discountAmount)}
-------------------------------------------
TOTAL: ${formatCurrency(invoice.netAmount)}
-------------------------------------------

Status: ${statusLabels[invoice.status]}
${invoice.paidDate ? `Pago em: ${formatDate(invoice.paidDate)} via ${invoice.paymentMethod}` : ''}

-------------------------------------------
Intelligence Course - CNPJ: 00.000.000/0001-00
Rua Exemplo, 123 - Centro - São Paulo/SP
        `;

        // Create blob and download
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fatura-${invoice.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Calculate stats
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
    const totalPending = pendingInvoices.reduce((acc, i) => acc + i.netAmount, 0);
    const paidThisYear = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.netAmount, 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/parent" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Financeiro 💳</Title>
                        <Text c="dimmed">Gerencie seus pagamentos e faturas</Text>
                    </div>
                </Group>
                <Group>
                    <ExportButton
                        data={invoices.map(inv => ({
                            descricao: inv.description,
                            aluno: inv.studentName,
                            vencimento: formatDate(inv.dueDate),
                            valorBruto: formatCurrency(inv.grossAmount),
                            desconto: formatCurrency(inv.discountAmount),
                            valorLiquido: formatCurrency(inv.netAmount),
                            status: statusLabels[inv.status],
                            dataPagamento: inv.paidDate ? formatDate(inv.paidDate) : '-',
                            formaPagamento: inv.paymentMethod || '-',
                        }))}
                        columns={[
                            { key: 'descricao', label: 'Descrição' },
                            { key: 'aluno', label: 'Aluno' },
                            { key: 'vencimento', label: 'Vencimento' },
                            { key: 'valorBruto', label: 'Valor Bruto' },
                            { key: 'desconto', label: 'Desconto' },
                            { key: 'valorLiquido', label: 'Valor Líquido' },
                            { key: 'status', label: 'Status' },
                            { key: 'dataPagamento', label: 'Data Pagamento' },
                            { key: 'formaPagamento', label: 'Forma Pagamento' },
                        ]}
                        title="Histórico de Pagamentos"
                        filename="historico_pagamentos"
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar Histórico"
                        variant="light"
                    />
                    <Button leftSection={<IconMail size={16} />} variant="subtle">
                        Enviar por Email
                    </Button>
                </Group>
            </Group>

            {/* Auto-Pay Card */}
            <Card shadow="xs" radius="md" p="lg" withBorder bg="blue.0">
                <Group justify="space-between">
                    <Group gap="md">
                        <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                            <IconRefresh size={24} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Pagamento Automático</Text>
                            <Text size="sm" c="dimmed">
                                {autoPay
                                    ? `Ativo - Cartão ${autoPayCard}`
                                    : 'Configure para nunca esquecer o vencimento'}
                            </Text>
                        </div>
                    </Group>
                    <Group>
                        <Switch
                            checked={autoPay}
                            onChange={(e) => setAutoPay(e.currentTarget.checked)}
                            label={autoPay ? 'Ativo' : 'Inativo'}
                            size="md"
                            color="green"
                        />
                        {autoPay && (
                            <Button variant="subtle" size="xs">
                                Alterar Cartão
                            </Button>
                        )}
                    </Group>
                </Group>
                {autoPay && (
                    <Text size="xs" c="dimmed" mt="xs">
                        💡 Suas faturas serão debitadas automaticamente 3 dias antes do vencimento
                    </Text>
                )}
            </Card>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} variant="light" color="yellow">
                            <IconClock size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700} c="yellow.7">{formatCurrency(totalPending)}</Text>
                            <Text size="sm" c="dimmed">Em Aberto</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconCheck size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700} c="green.7">{formatCurrency(paidThisYear)}</Text>
                            <Text size="sm" c="dimmed">Pago em 2026</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconReceipt size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{invoices.length}</Text>
                            <Text size="sm" c="dimmed">Total de Faturas</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Pending Invoices */}
            {pendingInvoices.length > 0 && (
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Group>
                                <ThemeIcon size="lg" variant="light" color="yellow">
                                    <IconAlertTriangle size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={600}>Faturas Pendentes</Text>
                                    <Text size="sm" c="dimmed">{pendingInvoices.length} fatura(s) aguardando pagamento</Text>
                                </div>
                            </Group>
                        </Group>

                        <Stack gap="sm">
                            {pendingInvoices.map(invoice => {
                                const isOverdue = new Date(invoice.dueDate) < new Date();
                                return (
                                    <Paper
                                        key={invoice.id}
                                        p="md"
                                        withBorder
                                        radius="md"
                                        style={{
                                            borderLeft: isOverdue ? '4px solid var(--mantine-color-red-6)' : '4px solid var(--mantine-color-yellow-6)',
                                        }}
                                    >
                                        <Group justify="space-between">
                                            <div>
                                                <Group gap="xs">
                                                    <Text fw={600}>{invoice.description}</Text>
                                                    {invoice.installment && (
                                                        <Badge size="sm" variant="light">
                                                            {invoice.installment.current}/{invoice.installment.total}
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Text size="sm" c="dimmed">{invoice.studentName}</Text>
                                                <Group gap="xs" mt={4}>
                                                    <IconCalendar size={14} color={isOverdue ? 'var(--mantine-color-red-6)' : 'gray'} />
                                                    <Text size="sm" c={isOverdue ? 'red' : 'dimmed'}>
                                                        Vencimento: {formatDate(invoice.dueDate)}
                                                        {isOverdue && ' (Vencido)'}
                                                    </Text>
                                                </Group>
                                            </div>
                                            <Group>
                                                <Stack gap={0} align="flex-end">
                                                    {invoice.discountAmount > 0 && (
                                                        <Text size="xs" td="line-through" c="dimmed">
                                                            {formatCurrency(invoice.grossAmount)}
                                                        </Text>
                                                    )}
                                                    <Text size="lg" fw={700}>{formatCurrency(invoice.netAmount)}</Text>
                                                </Stack>
                                                <Tooltip label="Baixar PDF">
                                                    <ActionIcon
                                                        variant="subtle"
                                                        size="lg"
                                                        loading={downloadingId === invoice.id}
                                                        onClick={() => handleDownloadPdf(invoice)}
                                                    >
                                                        <IconDownload size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Button
                                                    color={isOverdue ? 'red' : 'green'}
                                                    leftSection={<IconQrcode size={16} />}
                                                    onClick={() => handlePayClick(invoice)}
                                                >
                                                    Pagar
                                                </Button>
                                            </Group>
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Stack>
                </Card>
            )}

            {/* All Invoices */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={600}>Todas as Faturas</Text>
                        <Button variant="subtle" size="xs" leftSection={<IconPrinter size={14} />}>
                            Imprimir Relatório
                        </Button>
                    </Group>

                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th ta="right">Valor</Table.Th>
                                <Table.Th ta="center">Status</Table.Th>
                                <Table.Th ta="center">Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {invoices.map(invoice => {
                                const StatusIcon = statusIcons[invoice.status];
                                return (
                                    <Table.Tr key={invoice.id}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Text size="sm">{invoice.description}</Text>
                                                {invoice.installment && (
                                                    <Badge size="xs" variant="light">
                                                        {invoice.installment.current}/{invoice.installment.total}
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{invoice.studentName}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">
                                                {formatDate(invoice.dueDate)}
                                            </Text>
                                            {invoice.paidDate && (
                                                <Text size="xs" c="dimmed">
                                                    Pago em {formatDate(invoice.paidDate)}
                                                </Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Text size="sm" fw={500}>{formatCurrency(invoice.netAmount)}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                color={statusColors[invoice.status]}
                                                variant="light"
                                                leftSection={<StatusIcon size={12} />}
                                            >
                                                {statusLabels[invoice.status]}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Group gap="xs" justify="center">
                                                <Tooltip label="Baixar PDF">
                                                    <ActionIcon
                                                        variant="subtle"
                                                        loading={downloadingId === invoice.id}
                                                        onClick={() => handleDownloadPdf(invoice)}
                                                    >
                                                        <IconDownload size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                {invoice.status === 'pending' && (
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        color="green"
                                                        onClick={() => handlePayClick(invoice)}
                                                    >
                                                        Pagar
                                                    </Button>
                                                )}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Card>

            {/* Payment Modal */}
            <Modal
                opened={paymentModal}
                onClose={closePaymentModal}
                title="Pagar Fatura"
                centered
                size="md"
            >
                {selectedInvoice && (
                    <Stack gap="md">
                        <Paper p="md" bg="gray.0" radius="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600}>{selectedInvoice.description}</Text>
                                    <Text size="sm" c="dimmed">{selectedInvoice.studentName}</Text>
                                </div>
                                <Text size="xl" fw={700}>{formatCurrency(selectedInvoice.netAmount)}</Text>
                            </Group>
                        </Paper>

                        <Divider label="Escolha a forma de pagamento" labelPosition="center" />

                        <SimpleGrid cols={2} spacing="md">
                            <Button
                                variant="light"
                                size="lg"
                                leftSection={<IconQrcode size={20} />}
                                style={{ height: 80 }}
                            >
                                <Stack gap={0} align="flex-start">
                                    <Text fw={600}>PIX</Text>
                                    <Text size="xs" c="dimmed">Pagamento instantâneo</Text>
                                </Stack>
                            </Button>

                            <Button
                                variant="light"
                                size="lg"
                                leftSection={<IconCreditCard size={20} />}
                                style={{ height: 80 }}
                            >
                                <Stack gap={0} align="flex-start">
                                    <Text fw={600}>Cartão</Text>
                                    <Text size="xs" c="dimmed">Crédito ou débito</Text>
                                </Stack>
                            </Button>

                            <Button
                                variant="light"
                                size="lg"
                                leftSection={<IconFileInvoice size={20} />}
                                style={{ height: 80 }}
                            >
                                <Stack gap={0} align="flex-start">
                                    <Text fw={600}>Boleto</Text>
                                    <Text size="xs" c="dimmed">1-3 dias úteis</Text>
                                </Stack>
                            </Button>

                            <Button
                                variant="light"
                                size="lg"
                                color="gray"
                                leftSection={<IconCash size={20} />}
                                style={{ height: 80 }}
                            >
                                <Stack gap={0} align="flex-start">
                                    <Text fw={600}>Na Escola</Text>
                                    <Text size="xs" c="dimmed">Pagamento presencial</Text>
                                </Stack>
                            </Button>
                        </SimpleGrid>
                    </Stack>
                )}
            </Modal>

            {/* PDF Preview Modal */}
            <Modal
                opened={pdfModal}
                onClose={closePdfModal}
                title="Fatura"
                centered
                size="lg"
            >
                {selectedInvoice && (
                    <Stack gap="md">
                        <Paper p="lg" bg="gray.0" radius="md" style={{ fontFamily: 'monospace' }}>
                            <Stack gap="sm">
                                <Group justify="space-between">
                                    <Text fw={700} size="lg">FATURA</Text>
                                    <Badge>{selectedInvoice.id.toUpperCase()}</Badge>
                                </Group>
                                <Divider />
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Aluno:</Text>
                                    <Text size="sm" fw={500}>{selectedInvoice.studentName}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Descrição:</Text>
                                    <Text size="sm" fw={500}>{selectedInvoice.description}</Text>
                                </Group>
                                {selectedInvoice.installment && (
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Parcela:</Text>
                                        <Text size="sm" fw={500}>
                                            {selectedInvoice.installment.current}/{selectedInvoice.installment.total}
                                        </Text>
                                    </Group>
                                )}
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Vencimento:</Text>
                                    <Text size="sm" fw={500}>{formatDate(selectedInvoice.dueDate)}</Text>
                                </Group>
                                <Divider />
                                {selectedInvoice.discountAmount > 0 && (
                                    <>
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Valor Bruto:</Text>
                                            <Text size="sm">{formatCurrency(selectedInvoice.grossAmount)}</Text>
                                        </Group>
                                        <Group justify="space-between">
                                            <Text size="sm" c="dimmed">Desconto:</Text>
                                            <Text size="sm" c="green">-{formatCurrency(selectedInvoice.discountAmount)}</Text>
                                        </Group>
                                    </>
                                )}
                                <Group justify="space-between">
                                    <Text size="lg" fw={700}>TOTAL:</Text>
                                    <Text size="lg" fw={700}>{formatCurrency(selectedInvoice.netAmount)}</Text>
                                </Group>
                                <Divider />
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Status:</Text>
                                    <Badge color={statusColors[selectedInvoice.status]}>
                                        {statusLabels[selectedInvoice.status]}
                                    </Badge>
                                </Group>
                                {selectedInvoice.paidDate && (
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Pago em:</Text>
                                        <Text size="sm">{formatDate(selectedInvoice.paidDate)} via {selectedInvoice.paymentMethod}</Text>
                                    </Group>
                                )}
                            </Stack>
                        </Paper>
                        <Group justify="flex-end">
                            <Button
                                variant="light"
                                leftSection={<IconPrinter size={16} />}
                                onClick={() => window.print()}
                            >
                                Imprimir
                            </Button>
                            <Button
                                leftSection={<IconDownload size={16} />}
                                onClick={() => generateInvoicePdf(selectedInvoice)}
                            >
                                Baixar PDF
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

