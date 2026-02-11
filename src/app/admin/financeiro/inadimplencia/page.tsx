'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select,
    Progress,
} from '@mantine/core';
import {
    IconAlertTriangle, IconAlertCircle, IconSend, IconMail,
    IconPhone, IconClock, IconCoin, IconFilter,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Receivable {
    id: string;
    payerUserId: string;
    description: string;
    netAmountCents: number;
    dueDate: number;
    status: string;
    daysOverdue: number;
    remindersSent: number;
    lastReminderAt: number | null;
    installmentNumber: number | null;
    totalInstallments: number | null;
}

function formatBRL(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}
function formatDate(ts: number | null): string {
    if (!ts) return '-';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

export default function InadimplenciaPage() {
    const [agingFilter, setAgingFilter] = useState<string | null>(null);
    const { data: receivables, isLoading, error, refetch } = useApi<Receivable[]>('/api/receivables?status=overdue');

    const now = Math.floor(Date.now() / 1000);
    const all = (receivables || []).map(r => ({
        ...r,
        daysOverdue: r.daysOverdue || Math.max(0, Math.floor((now - r.dueDate) / 86400)),
    }));

    // Aging buckets
    const d30 = all.filter(r => r.daysOverdue <= 30);
    const d60 = all.filter(r => r.daysOverdue > 30 && r.daysOverdue <= 60);
    const d90 = all.filter(r => r.daysOverdue > 60 && r.daysOverdue <= 90);
    const d90plus = all.filter(r => r.daysOverdue > 90);

    const totalOverdue = all.reduce((s, r) => s + (r.netAmountCents || 0), 0);
    const totalDebtors = new Set(all.map(r => r.payerUserId)).size;

    const filtered = agingFilter
        ? all.filter(r => {
            if (agingFilter === '30') return r.daysOverdue <= 30;
            if (agingFilter === '60') return r.daysOverdue > 30 && r.daysOverdue <= 60;
            if (agingFilter === '90') return r.daysOverdue > 60 && r.daysOverdue <= 90;
            if (agingFilter === '90+') return r.daysOverdue > 90;
            return true;
        })
        : all;

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Inadimplência</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Faixa de atraso"
                        clearable size="sm"
                        leftSection={<IconFilter size={14} />}
                        value={agingFilter} onChange={setAgingFilter}
                        data={[
                            { value: '30', label: '1-30 dias' },
                            { value: '60', label: '31-60 dias' },
                            { value: '90', label: '61-90 dias' },
                            { value: '90+', label: '90+ dias' },
                        ]}
                    />
                    <Button leftSection={<IconSend size={16} />}>Enviar Lembretes</Button>
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
                    <Text size="xs" c="dimmed">Parcelas Vencidas</Text>
                    <Text fw={700} size="xl" c="red">{all.length}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Valor Total Vencido</Text>
                    <Text fw={700} c="red">{formatBRL(totalOverdue)}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Devedores Únicos</Text>
                    <Text fw={700} size="xl">{totalDebtors}</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text size="xs" c="dimmed">Atraso Médio</Text>
                    <Text fw={700} size="xl">
                        {all.length > 0 ? Math.round(all.reduce((s, r) => s + r.daysOverdue, 0) / all.length) : 0} dias
                    </Text>
                </Card>
            </SimpleGrid>

            {/* Aging Distribution */}
            <Card withBorder p="md">
                <Text fw={600} mb="sm">Distribuição por Aging</Text>
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                    <div>
                        <Group justify="space-between">
                            <Text size="sm">1-30 dias</Text>
                            <Badge size="sm" color="yellow">{d30.length}</Badge>
                        </Group>
                        <Progress value={all.length > 0 ? (d30.length / all.length) * 100 : 0} color="yellow" mt={4} />
                        <Text size="xs" c="dimmed" mt={2}>{formatBRL(d30.reduce((s, r) => s + r.netAmountCents, 0))}</Text>
                    </div>
                    <div>
                        <Group justify="space-between">
                            <Text size="sm">31-60 dias</Text>
                            <Badge size="sm" color="orange">{d60.length}</Badge>
                        </Group>
                        <Progress value={all.length > 0 ? (d60.length / all.length) * 100 : 0} color="orange" mt={4} />
                        <Text size="xs" c="dimmed" mt={2}>{formatBRL(d60.reduce((s, r) => s + r.netAmountCents, 0))}</Text>
                    </div>
                    <div>
                        <Group justify="space-between">
                            <Text size="sm">61-90 dias</Text>
                            <Badge size="sm" color="red">{d90.length}</Badge>
                        </Group>
                        <Progress value={all.length > 0 ? (d90.length / all.length) * 100 : 0} color="red" mt={4} />
                        <Text size="xs" c="dimmed" mt={2}>{formatBRL(d90.reduce((s, r) => s + r.netAmountCents, 0))}</Text>
                    </div>
                    <div>
                        <Group justify="space-between">
                            <Text size="sm">90+ dias</Text>
                            <Badge size="sm" color="red.9">{d90plus.length}</Badge>
                        </Group>
                        <Progress value={all.length > 0 ? (d90plus.length / all.length) * 100 : 0} color="red.9" mt={4} />
                        <Text size="xs" c="dimmed" mt={2}>{formatBRL(d90plus.reduce((s, r) => s + r.netAmountCents, 0))}</Text>
                    </div>
                </SimpleGrid>
            </Card>

            {/* Table */}
            <Card withBorder p="md">
                {filtered.length > 0 ? (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Parcela</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Dias Atraso</Table.Th>
                                <Table.Th>Lembretes</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.sort((a, b) => b.daysOverdue - a.daysOverdue).map(r => (
                                <Table.Tr key={r.id}>
                                    <Table.Td><Text fw={500} size="sm">{r.description}</Text></Table.Td>
                                    <Table.Td>
                                        {r.installmentNumber && r.totalInstallments
                                            ? `${r.installmentNumber}/${r.totalInstallments}` : '-'}
                                    </Table.Td>
                                    <Table.Td>{formatBRL(r.netAmountCents)}</Table.Td>
                                    <Table.Td><Text c="red" size="sm">{formatDate(r.dueDate)}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={r.daysOverdue > 90 ? 'red.9' : r.daysOverdue > 60 ? 'red' : r.daysOverdue > 30 ? 'orange' : 'yellow'}
                                            variant="light"
                                        >
                                            {r.daysOverdue}d
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge size="sm" variant="light">{r.remindersSent || 0}x</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Button size="xs" variant="light" leftSection={<IconMail size={12} />}>
                                                Email
                                            </Button>
                                            <Button size="xs" variant="light" color="green" leftSection={<IconPhone size={12} />}>
                                                WhatsApp
                                            </Button>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <ThemeIcon variant="light" color="green" size={48} radius="xl">
                                <IconCoin size={24} />
                            </ThemeIcon>
                            <Text c="dimmed">Sem inadimplência — parabéns!</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Legal */}
            <Alert icon={<IconAlertTriangle size={16} />} color="gray" variant="light" title="Cobrança Responsável">
                <Text size="xs">
                    <strong>CDC Art. 42</strong> — Proibida cobrança abusiva, vexatória ou ameaçadora •{' '}
                    <strong>CDC Art. 42-A</strong> — Banco de dados deve ser comunicado ao consumidor •{' '}
                    <strong>CC Art. 395</strong> — Mora do devedor •{' '}
                    <strong>LGPD</strong> — Dados de inadimplência são dados pessoais sensíveis
                </Text>
            </Alert>
        </Stack>
    );
}
