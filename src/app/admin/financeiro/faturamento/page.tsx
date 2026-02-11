'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select, Modal,
    TextInput, NumberInput, Textarea,
} from '@mantine/core';
import {
    IconFileInvoice, IconPlus, IconAlertCircle, IconSend,
    IconCheck, IconMail, IconReceipt, IconCalendar,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Invoice {
    id: string;
    payerName: string | null;
    payerEmail: string | null;
    studentName: string | null;
    description: string;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
    installmentNumber: number | null;
    totalInstallments: number | null;
    dueDate: number;
    status: string;
    paymentMethod: string | null;
    currency: string;
    createdAt: number;
}

function formatBRL(val: number): string {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
function formatDate(ts: number | null): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'gray' },
    pending: { label: 'Pendente', color: 'yellow' },
    paid: { label: 'Pago', color: 'green' },
    overdue: { label: 'Vencido', color: 'red' },
    cancelled: { label: 'Cancelado', color: 'gray' },
    refunded: { label: 'Estornado', color: 'violet' },
};

export default function FaturamentoPage() {
    const { data: invoices, isLoading, error, refetch } = useApi<Invoice[]>('/api/invoices');
    const [batchOpen, setBatchOpen] = useState(false);

    const now = Math.floor(Date.now() / 1000);
    const all = invoices || [];
    const totalGross = all.reduce((s, i) => s + (i.grossAmount || 0), 0);
    const totalNet = all.reduce((s, i) => s + (i.netAmount || 0), 0);
    const totalDiscount = all.reduce((s, i) => s + (i.discountAmount || 0), 0);
    const draftCount = all.filter(i => i.status === 'draft').length;
    const pendingCount = all.filter(i => i.status === 'pending').length;

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Faturamento</Title>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconCalendar size={16} />} onClick={() => setBatchOpen(true)}>
                        Faturamento em Lote
                    </Button>
                    <Button leftSection={<IconPlus size={16} />}>Nova Fatura</Button>
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
                    <Text size="xs" c="dimmed">Faturas</Text>
                    <Text fw={700} size="xl">{all.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Valor Bruto</Text>
                    <Text fw={700}>{formatBRL(totalGross)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Descontos</Text>
                    <Text fw={700} c="orange">{formatBRL(totalDiscount)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Valor Líquido</Text>
                    <Text fw={700} c="green">{formatBRL(totalNet)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Rascunhos</Text>
                    <Text fw={700} c="gray">{draftCount}</Text>
                </Card>
            </SimpleGrid>

            {/* Table */}
            <Card withBorder p="md">
                {all.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Responsável</Table.Th>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Parcela</Table.Th>
                                <Table.Th>Bruto</Table.Th>
                                <Table.Th>Líquido</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {all.map(inv => {
                                const st = statusMap[inv.status] || { label: inv.status, color: 'gray' };
                                const isOverdue = inv.status === 'pending' && inv.dueDate < now;
                                return (
                                    <Table.Tr key={inv.id}>
                                        <Table.Td><Text fw={500} size="sm">{inv.payerName || '-'}</Text></Table.Td>
                                        <Table.Td>{inv.studentName || '-'}</Table.Td>
                                        <Table.Td><Text size="sm" c="dimmed">{inv.description}</Text></Table.Td>
                                        <Table.Td>
                                            {inv.installmentNumber && inv.totalInstallments
                                                ? `${inv.installmentNumber}/${inv.totalInstallments}` : '-'}
                                        </Table.Td>
                                        <Table.Td>{formatBRL(inv.grossAmount)}</Table.Td>
                                        <Table.Td>{formatBRL(inv.netAmount)}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c={isOverdue ? 'red' : undefined}>{formatDate(inv.dueDate)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={isOverdue ? 'red' : st.color} variant="light">
                                                {isOverdue ? 'Vencido' : st.label}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconFileInvoice size={48} color="gray" />
                            <Text c="dimmed">Nenhuma fatura emitida</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>Criar fatura</Button>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Batch Modal */}
            <Modal opened={batchOpen} onClose={() => setBatchOpen(false)} title="Faturamento em Lote" size="lg">
                <Stack gap="md">
                    <Alert icon={<IconReceipt size={16} />} color="blue" variant="light">
                        Gere faturas para todos os alunos com contratos ativos. As parcelas serão criadas
                        automaticamente com base nos planos de pagamento configurados.
                    </Alert>
                    <Select
                        label="Mês de Referência"
                        data={[
                            { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
                            { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
                            { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
                            { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
                            { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
                            { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
                        ]}
                    />
                    <NumberInput label="Dia de Vencimento" placeholder="10" min={1} max={28} />
                    <Select
                        label="Métodos de Pagamento Habilitados"
                        data={['PIX', 'Boleto', 'Cartão', 'PIX + Boleto']}
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setBatchOpen(false)}>Cancelar</Button>
                        <Button leftSection={<IconSend size={16} />}>Gerar Faturas</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Legal */}
            <Alert icon={<IconFileInvoice size={16} />} color="gray" variant="light" title="Faturamento">
                <Text size="xs">
                    <strong>RPS → NFS-e</strong>: integração fiscal via módulo Contábil •{' '}
                    <strong>CDC Art. 52</strong> — informação clara de parcelas e juros
                </Text>
            </Alert>
        </Stack>
    );
}
