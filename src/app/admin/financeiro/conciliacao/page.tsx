'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Progress,
} from '@mantine/core';
import {
    IconCheck, IconAlertCircle, IconArrowsExchange, IconX,
    IconRefresh, IconQuestionMark,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface MoneyFlow {
    id: string;
    flowType: string;
    direction: string;
    amountCents: number;
    location: string;
    source: string | null;
    destination: string | null;
    reference: string | null;
    paymentMethod: string | null;
    isReconciled: boolean;
    reconciledAt: number | null;
    reconciledBy: string | null;
    createdAt: number;
}

function formatBRL(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
function formatDateTime(ts: number | null): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleString('pt-BR');
}

const flowTypeLabels: Record<string, string> = {
    tuition_payment: 'Mensalidade', enrollment_fee: 'Matrícula',
    material_fee: 'Material', commission_payout: 'Comissão',
    vendor_payment: 'Fornecedor', refund: 'Estorno',
    transfer: 'Transferência', other: 'Outro',
};

const locationLabels: Record<string, string> = {
    gateway: 'Gateway', bank: 'Banco', cash: 'Caixa', petty_cash: 'Caixa Pequeno',
};

export default function ConciliacaoPage() {
    const { data: flows, isLoading, error, refetch } = useApi<MoneyFlow[]>('/api/money-flows');

    const all = flows || [];
    const reconciled = all.filter(f => f.isReconciled);
    const unreconciled = all.filter(f => !f.isReconciled);

    const totalAmount = all.reduce((s, f) => s + (f.amountCents || 0), 0);
    const reconciledAmount = reconciled.reduce((s, f) => s + (f.amountCents || 0), 0);
    const unreconciledAmount = unreconciled.reduce((s, f) => s + (f.amountCents || 0), 0);
    const reconciliationRate = totalAmount > 0 ? Math.round((reconciledAmount / totalAmount) * 100) : 100;

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Conciliação Bancária</Title>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={refetch}>
                        Atualizar
                    </Button>
                    <Button leftSection={<IconCheck size={16} />} disabled={unreconciled.length === 0}>
                        Conciliar Selecionados
                    </Button>
                </Group>
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
                    <Text size="xs" c="dimmed">Total Movimentos</Text>
                    <Text fw={700} size="xl">{all.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Conciliados</Text>
                    <Text fw={700} size="xl" c="green">{reconciled.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Pendentes</Text>
                    <Text fw={700} size="xl" c="orange">{unreconciled.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Taxa Conciliação</Text>
                    <Group gap="xs">
                        <Text fw={700} size="xl" c={reconciliationRate >= 95 ? 'green' : reconciliationRate >= 70 ? 'yellow' : 'red'}>
                            {reconciliationRate}%
                        </Text>
                    </Group>
                    <Progress value={reconciliationRate} color={reconciliationRate >= 95 ? 'green' : reconciliationRate >= 70 ? 'yellow' : 'red'} size="sm" mt={4} />
                </Card>
            </SimpleGrid>

            {/* Unreconciled first */}
            {unreconciled.length > 0 && (
                <Card withBorder p="md">
                    <Group justify="space-between" mb="sm">
                        <Text fw={600} c="orange">Pendentes de Conciliação ({unreconciled.length})</Text>
                        <Badge color="orange">{formatBRL(unreconciledAmount)}</Badge>
                    </Group>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Direção</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Local</Table.Th>
                                <Table.Th>Referência</Table.Th>
                                <Table.Th>Ação</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {unreconciled.map(f => (
                                <Table.Tr key={f.id}>
                                    <Table.Td>{formatDateTime(f.createdAt)}</Table.Td>
                                    <Table.Td><Badge variant="light">{flowTypeLabels[f.flowType] || f.flowType}</Badge></Table.Td>
                                    <Table.Td>
                                        <Badge color={f.direction === 'inflow' ? 'green' : 'red'} variant="light">
                                            {f.direction === 'inflow' ? 'Entrada' : 'Saída'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatBRL(f.amountCents)}</Table.Td>
                                    <Table.Td>{locationLabels[f.location] || f.location}</Table.Td>
                                    <Table.Td><Text size="sm" c="dimmed">{f.reference || '-'}</Text></Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Button size="xs" variant="light" color="green" leftSection={<IconCheck size={12} />}>
                                                OK
                                            </Button>
                                            <Button size="xs" variant="light" color="red" leftSection={<IconX size={12} />}>
                                                Divergência
                                            </Button>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Reconciled */}
            <Card withBorder p="md">
                <Group justify="space-between" mb="sm">
                    <Text fw={600} c="green">Conciliados ({reconciled.length})</Text>
                    <Badge color="green">{formatBRL(reconciledAmount)}</Badge>
                </Group>
                {reconciled.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Direção</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Local</Table.Th>
                                <Table.Th>Conciliado em</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {reconciled.slice(0, 20).map(f => (
                                <Table.Tr key={f.id}>
                                    <Table.Td>{formatDateTime(f.createdAt)}</Table.Td>
                                    <Table.Td><Badge variant="light">{flowTypeLabels[f.flowType] || f.flowType}</Badge></Table.Td>
                                    <Table.Td>
                                        <Badge color={f.direction === 'inflow' ? 'green' : 'red'} variant="light">
                                            {f.direction === 'inflow' ? 'Entrada' : 'Saída'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatBRL(f.amountCents)}</Table.Td>
                                    <Table.Td>{locationLabels[f.location] || f.location}</Table.Td>
                                    <Table.Td>{formatDateTime(f.reconciledAt)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconQuestionMark size={48} color="gray" />
                            <Text c="dimmed">Nenhum movimento conciliado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Legal */}
            <Alert icon={<IconArrowsExchange size={16} />} color="gray" variant="light" title="Conciliação">
                <Text size="xs">
                    <strong>Res. CFC 1.330/11</strong> — Escrituração contábil, conciliação obrigatória •{' '}
                    <strong>NBC ITG 2000</strong> — Escrituração contábil •{' '}
                    Processar conciliação regularmente para evitar divergências no fechamento contábil
                </Text>
            </Alert>
        </Stack>
    );
}
