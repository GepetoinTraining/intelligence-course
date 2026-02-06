'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, Table, Modal, Divider, ThemeIcon,
    Progress, Alert, Tabs
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconCreditCard, IconReceipt, IconCalendar, IconAlertCircle,
    IconCheck, IconDownload, IconClock, IconDiscount2,
    IconCash, IconQrcode
} from '@tabler/icons-react';
import { PaymentCalendar } from '@/components/calendar/PaymentCalendar';
import {
    formatCurrency,
    PAYMENT_CONFIG,
    PAYMENT_PROVIDER,
    type Invoice,
    type PaymentStatus
} from '@/lib/financial/config';

// Mock invoice data
const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv-001',
        studentId: 'student-1',
        studentName: 'Lucas Silva',
        parentId: 'parent-1',
        parentName: 'Carlos Silva',
        courseId: 'intelligence-course-v1',
        description: 'Intelligence Course - Parcela 1/10',
        amount: 149.70,
        discount: 14.97,
        finalAmount: 134.73,
        dueDate: '2026-02-10',
        paidDate: '2026-02-05',
        status: 'paid',
        installment: { current: 1, total: 10 },
        paymentMethod: 'PIX',
    },
    {
        id: 'inv-002',
        studentId: 'student-1',
        studentName: 'Lucas Silva',
        parentId: 'parent-1',
        parentName: 'Carlos Silva',
        courseId: 'intelligence-course-v1',
        description: 'Intelligence Course - Parcela 2/10',
        amount: 149.70,
        discount: 0,
        finalAmount: 149.70,
        dueDate: '2026-03-10',
        status: 'pending',
        installment: { current: 2, total: 10 },
    },
    {
        id: 'inv-003',
        studentId: 'student-1',
        studentName: 'Lucas Silva',
        parentId: 'parent-1',
        parentName: 'Carlos Silva',
        courseId: 'intelligence-course-v1',
        description: 'Intelligence Course - Parcela 3/10',
        amount: 149.70,
        discount: 0,
        finalAmount: 149.70,
        dueDate: '2026-04-10',
        status: 'pending',
        installment: { current: 3, total: 10 },
    },
];

const getStatusBadge = (status: PaymentStatus) => {
    const configs: Record<PaymentStatus, { color: string; label: string }> = {
        paid: { color: 'green', label: 'Pago' },
        pending: { color: 'yellow', label: 'Pendente' },
        overdue: { color: 'red', label: 'Atrasado' },
        cancelled: { color: 'gray', label: 'Cancelado' },
        refunded: { color: 'blue', label: 'Reembolsado' },
        processing: { color: 'cyan', label: 'Processando' },
    };
    const config = configs[status];
    return <Badge color={config.color} variant="light">{config.label}</Badge>;
};

export default function FinancialPage() {
    const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);

    const paidTotal = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.finalAmount, 0);
    const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + i.finalAmount, 0);
    const overdueTotal = invoices.filter(i => i.status === 'overdue').reduce((acc, i) => acc + i.finalAmount, 0);
    const totalCourse = 1497.00; // Full course price

    const calendarEvents = invoices.map(inv => ({
        date: inv.dueDate,
        type: inv.status === 'paid' ? 'payment_paid' as const :
            inv.status === 'overdue' ? 'payment_overdue' as const :
                'payment_due' as const,
        title: inv.description,
        amount: inv.finalAmount,
        status: inv.status,
    }));

    const handlePayInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        openPaymentModal();
    };

    const nextPending = invoices.find(i => i.status === 'pending');

    return (
        <>
            <Stack gap="xl">
                {/* Header */}
                <div>
                    <Title order={2}>Financeiro 💳</Title>
                    <Text c="dimmed">Gerencie pagamentos e visualize seu histórico</Text>
                </div>

                {/* Alert for next payment */}
                {nextPending && (
                    <Alert
                        icon={<IconClock size={18} />}
                        color="yellow"
                        variant="light"
                        title="Próximo vencimento"
                    >
                        <Group justify="space-between" align="center">
                            <div>
                                <Text size="sm">
                                    {nextPending.description} - Vencimento: {new Date(nextPending.dueDate).toLocaleDateString('pt-BR')}
                                </Text>
                                <Text size="sm" fw={600}>
                                    {formatCurrency(nextPending.finalAmount)}
                                    {PAYMENT_CONFIG.earlyPaymentDiscount > 0 && (
                                        <Text span size="xs" c="green" ml="xs">
                                            Pague até 5 dias antes e ganhe {PAYMENT_CONFIG.earlyPaymentDiscount}% de desconto!
                                        </Text>
                                    )}
                                </Text>
                            </div>
                            <Button
                                size="sm"
                                leftSection={<IconCreditCard size={16} />}
                                onClick={() => handlePayInvoice(nextPending)}
                            >
                                Pagar Agora
                            </Button>
                        </Group>
                    </Alert>
                )}

                {/* Stats */}
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                    <Paper shadow="xs" radius="md" p="lg" withBorder>
                        <Group>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconReceipt size={24} />
                            </ThemeIcon>
                            <div>
                                <Text size="xl" fw={700}>{formatCurrency(totalCourse)}</Text>
                                <Text size="sm" c="dimmed">Valor Total</Text>
                            </div>
                        </Group>
                    </Paper>

                    <Paper shadow="xs" radius="md" p="lg" withBorder>
                        <Group>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconCheck size={24} />
                            </ThemeIcon>
                            <div>
                                <Text size="xl" fw={700}>{formatCurrency(paidTotal)}</Text>
                                <Text size="sm" c="dimmed">Pago</Text>
                            </div>
                        </Group>
                    </Paper>

                    <Paper shadow="xs" radius="md" p="lg" withBorder>
                        <Group>
                            <ThemeIcon size={48} radius="md" variant="light" color="yellow">
                                <IconClock size={24} />
                            </ThemeIcon>
                            <div>
                                <Text size="xl" fw={700}>{formatCurrency(pendingTotal)}</Text>
                                <Text size="sm" c="dimmed">Pendente</Text>
                            </div>
                        </Group>
                    </Paper>

                    <Paper shadow="xs" radius="md" p="lg" withBorder>
                        <Group>
                            <ThemeIcon size={48} radius="md" variant="light" color="red">
                                <IconAlertCircle size={24} />
                            </ThemeIcon>
                            <div>
                                <Text size="xl" fw={700}>{formatCurrency(overdueTotal)}</Text>
                                <Text size="sm" c="dimmed">Em Atraso</Text>
                            </div>
                        </Group>
                    </Paper>
                </SimpleGrid>

                {/* Progress */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text fw={500}>Progresso do Pagamento</Text>
                            <Text size="sm" c="dimmed">
                                {invoices.filter(i => i.status === 'paid').length} de {invoices.length} parcelas
                            </Text>
                        </Group>
                        <Progress.Root size="xl" radius="xl">
                            <Progress.Section
                                value={(paidTotal / totalCourse) * 100}
                                color="green"
                            >
                                <Progress.Label>Pago</Progress.Label>
                            </Progress.Section>
                            <Progress.Section
                                value={(pendingTotal / totalCourse) * 100}
                                color="yellow"
                            >
                                <Progress.Label>Pendente</Progress.Label>
                            </Progress.Section>
                        </Progress.Root>
                    </Stack>
                </Card>

                {/* Main Content */}
                <Tabs defaultValue="invoices">
                    <Tabs.List>
                        <Tabs.Tab value="invoices" leftSection={<IconReceipt size={14} />}>
                            Faturas
                        </Tabs.Tab>
                        <Tabs.Tab value="calendar" leftSection={<IconCalendar size={14} />}>
                            Calendário
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="invoices" pt="md">
                        <Card shadow="xs" radius="md" p={0} withBorder>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Descrição</Table.Th>
                                        <Table.Th>Vencimento</Table.Th>
                                        <Table.Th>Valor</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {invoices.map((invoice) => (
                                        <Table.Tr key={invoice.id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{invoice.description}</Text>
                                                {invoice.discount > 0 && (
                                                    <Group gap={4}>
                                                        <IconDiscount2 size={12} color="var(--mantine-color-green-6)" />
                                                        <Text size="xs" c="green">
                                                            Desconto aplicado: {formatCurrency(invoice.discount)}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">
                                                    {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                                                </Text>
                                                {invoice.paidDate && (
                                                    <Text size="xs" c="green">
                                                        Pago em {new Date(invoice.paidDate).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{formatCurrency(invoice.finalAmount)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                {getStatusBadge(invoice.status)}
                                            </Table.Td>
                                            <Table.Td>
                                                {invoice.status === 'pending' && (
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        onClick={() => handlePayInvoice(invoice)}
                                                    >
                                                        Pagar
                                                    </Button>
                                                )}
                                                {invoice.status === 'paid' && (
                                                    <Button
                                                        size="xs"
                                                        variant="subtle"
                                                        leftSection={<IconDownload size={14} />}
                                                    >
                                                        Recibo
                                                    </Button>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Card>
                    </Tabs.Panel>

                    <Tabs.Panel value="calendar" pt="md">
                        <PaymentCalendar events={calendarEvents} />
                    </Tabs.Panel>
                </Tabs>
            </Stack>

            {/* Payment Modal */}
            <Modal
                opened={paymentModalOpened}
                onClose={closePaymentModal}
                title="Realizar Pagamento"
                size="md"
            >
                {selectedInvoice && (
                    <Stack gap="md">
                        <Paper p="md" radius="md" withBorder>
                            <Stack gap="xs">
                                <Text size="sm" c="dimmed">Fatura</Text>
                                <Text fw={600}>{selectedInvoice.description}</Text>
                                <Divider />
                                <Group justify="space-between">
                                    <Text size="sm">Valor original:</Text>
                                    <Text size="sm">{formatCurrency(selectedInvoice.amount)}</Text>
                                </Group>
                                {PAYMENT_CONFIG.earlyPaymentDiscount > 0 && (
                                    <Group justify="space-between">
                                        <Text size="sm" c="green">
                                            Desconto ({PAYMENT_CONFIG.earlyPaymentDiscount}%):
                                        </Text>
                                        <Text size="sm" c="green">
                                            -{formatCurrency(selectedInvoice.amount * PAYMENT_CONFIG.earlyPaymentDiscount / 100)}
                                        </Text>
                                    </Group>
                                )}
                                <Divider />
                                <Group justify="space-between">
                                    <Text fw={600}>Total a pagar:</Text>
                                    <Text fw={700} size="lg" c="violet">
                                        {formatCurrency(selectedInvoice.amount * (1 - PAYMENT_CONFIG.earlyPaymentDiscount / 100))}
                                    </Text>
                                </Group>
                            </Stack>
                        </Paper>

                        <Text fw={500}>Escolha a forma de pagamento:</Text>

                        <Stack gap="sm">
                            {/* PIX Option */}
                            <Button
                                variant="outline"
                                leftSection={<IconQrcode size={20} />}
                                size="lg"
                                fullWidth
                                styles={{ inner: { justifyContent: 'flex-start' } }}
                            >
                                <div style={{ textAlign: 'left' }}>
                                    <Text>PIX</Text>
                                    <Text size="xs" c="dimmed">Aprovação instantânea</Text>
                                </div>
                            </Button>

                            {/* Card Option */}
                            <Button
                                variant="outline"
                                leftSection={<IconCreditCard size={20} />}
                                size="lg"
                                fullWidth
                                styles={{ inner: { justifyContent: 'flex-start' } }}
                            >
                                <div style={{ textAlign: 'left' }}>
                                    <Text>Cartão de Crédito</Text>
                                    <Text size="xs" c="dimmed">Parcele em até 3x sem juros</Text>
                                </div>
                            </Button>

                            {/* Boleto Option */}
                            <Button
                                variant="outline"
                                leftSection={<IconCash size={20} />}
                                size="lg"
                                fullWidth
                                styles={{ inner: { justifyContent: 'flex-start' } }}
                            >
                                <div style={{ textAlign: 'left' }}>
                                    <Text>Boleto Bancário</Text>
                                    <Text size="xs" c="dimmed">Compensação em até 3 dias úteis</Text>
                                </div>
                            </Button>
                        </Stack>

                        {PAYMENT_PROVIDER !== 'internal' && (
                            <Text size="xs" c="dimmed" ta="center">
                                Pagamento processado por {PAYMENT_PROVIDER.toUpperCase()}
                            </Text>
                        )}
                    </Stack>
                )}
            </Modal>
        </>
    );
}

