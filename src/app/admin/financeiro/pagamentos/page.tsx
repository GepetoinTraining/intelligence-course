'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Loader,
    Alert,
    Select,
} from '@mantine/core';
import {
    IconCash,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconAlertCircle,
    IconCheck,
    IconReceipt,
    IconCreditCard,
    IconBuildingBank,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Payment {
    invoiceId: string;
    number: string;
    customerName: string;
    amount: number;
    paidAmount: number;
    paymentMethod: string;
    paidAt: string;
    status: string;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

const paymentMethodIcons: Record<string, React.ReactNode> = {
    pix: <IconBuildingBank size={16} />,
    credit_card: <IconCreditCard size={16} />,
    boleto: <IconReceipt size={16} />,
    cash: <IconCash size={16} />,
};

const paymentMethodLabels: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão',
    boleto: 'Boleto',
    cash: 'Dinheiro',
    transfer: 'Transferência',
};

export default function PagamentosPage() {
    const { data: invoices, isLoading, error, refetch } = useApi<any[]>('/api/invoices');

    // Filter only paid invoices
    const payments = invoices?.filter(inv => inv.status === 'paid' || inv.paidAt) || [];

    const totalReceived = payments.reduce((acc, p) => acc + (p.paidAmount || p.total || 0), 0);
    const todayPayments = payments.filter(p =>
        p.paidAt && new Date(p.paidAt).toDateString() === new Date().toDateString()
    );
    const todayTotal = todayPayments.reduce((acc, p) => acc + (p.paidAmount || p.total || 0), 0);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar pagamentos" color="red">
                Não foi possível carregar os pagamentos recebidos.
                <Button variant="light" color="red" size="xs" mt="sm" onClick={() => refetch()}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Financeiro</Text>
                    <Title order={2}>Pagamentos Recebidos</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Este mês"
                        data={[
                            { value: 'today', label: 'Hoje' },
                            { value: 'week', label: 'Esta Semana' },
                            { value: 'month', label: 'Este Mês' },
                            { value: 'year', label: 'Este Ano' },
                        ]}
                        w={150}
                        defaultValue="month"
                    />
                    <Button leftSection={<IconPlus size={16} />}>
                        Registrar Pagamento
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Recebido</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalReceived)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconReceipt size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pagamentos</Text>
                            <Text fw={700} size="xl">{payments.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Hoje</Text>
                            <Text fw={700} size="xl">{formatCurrency(todayTotal)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconCreditCard size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ticket Médio</Text>
                            <Text fw={700} size="xl">
                                {payments.length > 0 ? formatCurrency(totalReceived / payments.length) : 'R$ 0'}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Pagamentos Recentes</Title>

                {payments.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        Nenhum pagamento recebido encontrado
                    </Text>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fatura</Table.Th>
                                <Table.Th>Cliente</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Método</Table.Th>
                                <Table.Th>Data Pagamento</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {payments.slice(0, 20).map((payment) => (
                                <Table.Tr key={payment.id}>
                                    <Table.Td>
                                        <Text fw={500}>#{payment.number || payment.id?.slice(0, 8)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{payment.customerName || 'Cliente'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={600} c="green">{formatCurrency(payment.paidAmount || payment.total || 0)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            variant="light"
                                            leftSection={paymentMethodIcons[payment.paymentMethod] || <IconCash size={14} />}
                                        >
                                            {paymentMethodLabels[payment.paymentMethod] || 'Outro'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{payment.paidAt ? formatDate(payment.paidAt) : '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconDotsVertical size={14} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Fatura</Menu.Item>
                                                <Menu.Item leftSection={<IconReceipt size={14} />}>Comprovante</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>
        </div>
    );
}

