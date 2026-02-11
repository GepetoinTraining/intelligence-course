'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Loader, Center, Alert, Button, Badge, RingProgress,
} from '@mantine/core';
import {
    IconAlertCircle, IconAlertTriangle, IconArrowDown, IconArrowRight,
    IconArrowsExchange, IconBuildingBank, IconCash, IconCoin,
    IconReceipt, IconReportMoney, IconTargetArrow, IconCheck,
    IconCreditCard, IconFileInvoice,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Receivable {
    id: string;
    status: string;
    netAmountCents: number;
    paidAmountCents: number;
    dueDate: number;
}

interface Payable {
    id: string;
    status: string;
    amountCents: number;
    dueDate: number;
}

interface Gateway {
    id: string;
    provider: string;
    isActive: boolean;
    isDefault: boolean;
    accountName: string;
}

function formatBRL(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

const modules = [
    { label: 'Recebíveis', href: '/admin/financeiro/recebiveis', icon: IconCoin, color: 'green', desc: 'Cobranças e parcelas' },
    { label: 'Pagamentos', href: '/admin/financeiro/pagamentos', icon: IconCash, color: 'teal', desc: 'Confirmações e baixas' },
    { label: 'Faturamento', href: '/admin/financeiro/faturamento', icon: IconFileInvoice, color: 'blue', desc: 'Geração de faturas' },
    { label: 'Despesas', href: '/admin/financeiro/despesas', icon: IconArrowDown, color: 'red', desc: 'Contas e fornecedores' },
    { label: 'Contas Bancárias', href: '/admin/financeiro/contas', icon: IconBuildingBank, color: 'cyan', desc: 'Bancos e gateways' },
    { label: 'Contas a Pagar', href: '/admin/financeiro/contas-pagar', icon: IconCreditCard, color: 'pink', desc: 'Agendamento de pgtos' },
    { label: 'Fluxo de Caixa', href: '/admin/financeiro/fluxo-caixa', icon: IconArrowsExchange, color: 'violet', desc: 'Entradas vs saídas' },
    { label: 'Inadimplência', href: '/admin/financeiro/inadimplencia', icon: IconAlertTriangle, color: 'orange', desc: 'Atrasos e cobranças' },
    { label: 'Conciliação', href: '/admin/financeiro/conciliacao', icon: IconCheck, color: 'lime', desc: 'Conferência bancária' },
];

export default function FinanceiroHubPage() {
    const { data: receivables, isLoading: loadRec } = useApi<Receivable[]>('/api/receivables');
    const { data: payables, isLoading: loadPay } = useApi<Payable[]>('/api/payables');
    const { data: gateways, isLoading: loadGw } = useApi<Gateway[]>('/api/payment-gateways');

    const now = Math.floor(Date.now() / 1000);

    // Receivables stats
    const totalReceivable = receivables?.reduce((s, r) => s + (r.netAmountCents || 0), 0) || 0;
    const totalReceived = receivables?.filter(r => r.status === 'paid').reduce((s, r) => s + (r.paidAmountCents || r.netAmountCents || 0), 0) || 0;
    const overdueCount = receivables?.filter(r => r.status === 'overdue' || (r.status === 'pending' && r.dueDate < now)).length || 0;
    const overdueAmount = receivables?.filter(r => r.status === 'overdue' || (r.status === 'pending' && r.dueDate < now)).reduce((s, r) => s + (r.netAmountCents || 0), 0) || 0;
    const collectionRate = totalReceivable > 0 ? Math.round((totalReceived / totalReceivable) * 100) : 0;

    // Payables stats
    const totalPayable = payables?.reduce((s, p) => s + (p.amountCents || 0), 0) || 0;
    const pendingPayables = payables?.filter(p => p.status === 'pending' || p.status === 'scheduled').length || 0;
    const overduePayables = payables?.filter(p => p.status === 'overdue' || (p.status === 'pending' && p.dueDate < now)).length || 0;

    // Gateway
    const activeGateways = gateways?.filter(g => g.isActive) || [];
    const defaultGateway = gateways?.find(g => g.isDefault);

    const isLoading = loadRec || loadPay || loadGw;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Financeiro</Title>
            </div>

            {/* KPI Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconCoin size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total a Receber</Text>
                            <Text fw={700} size="lg">
                                {isLoading ? <Loader size="sm" /> : formatBRL(totalReceivable)}
                            </Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Recebido</Text>
                            <Text fw={700} size="lg">
                                {isLoading ? <Loader size="sm" /> : formatBRL(totalReceived)}
                            </Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg" radius="md">
                            <IconArrowDown size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total a Pagar</Text>
                            <Text fw={700} size="lg">
                                {isLoading ? <Loader size="sm" /> : formatBRL(totalPayable)}
                            </Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder p="md">
                    <Group>
                        <RingProgress
                            size={50}
                            thickness={5}
                            roundCaps
                            sections={[{ value: collectionRate, color: collectionRate > 80 ? 'green' : collectionRate > 50 ? 'yellow' : 'red' }]}
                            label={<Text size="xs" ta="center" fw={700}>{collectionRate}%</Text>}
                        />
                        <div>
                            <Text size="xs" c="dimmed">Taxa de Recebimento</Text>
                            <Text fw={700} size="lg">{collectionRate}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Alerts Row */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {overdueCount > 0 && (
                    <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light" title="Inadimplência">
                        {overdueCount} parcela{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''} — {formatBRL(overdueAmount)}
                    </Alert>
                )}
                {overduePayables > 0 && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" title="Contas Vencidas">
                        {overduePayables} conta{overduePayables > 1 ? 's' : ''} a pagar vencida{overduePayables > 1 ? 's' : ''}
                    </Alert>
                )}
                {defaultGateway && (
                    <Alert icon={<IconBuildingBank size={16} />} color="blue" variant="light" title="Gateway Ativo">
                        {defaultGateway.provider.charAt(0).toUpperCase() + defaultGateway.provider.slice(1)} — {defaultGateway.accountName}
                    </Alert>
                )}
                {!defaultGateway && !loadGw && (
                    <Alert icon={<IconAlertCircle size={16} />} color="gray" variant="light" title="Sem Gateway">
                        Configure um gateway de pagamento em Contas Bancárias
                    </Alert>
                )}
            </SimpleGrid>

            {/* Quick Links */}
            <Title order={4}>Módulos</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {modules.map((mod) => (
                    <Card
                        key={mod.label}
                        withBorder
                        p="lg"
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.location.href = mod.href}
                    >
                        <Group>
                            <ThemeIcon variant="light" color={mod.color} size="lg" radius="md">
                                <mod.icon size={20} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                                <Text fw={500}>{mod.label}</Text>
                                <Text size="xs" c="dimmed">{mod.desc}</Text>
                            </div>
                            <IconArrowRight size={16} color="gray" />
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            {/* Legal Footer */}
            <Alert icon={<IconReportMoney size={16} />} color="gray" variant="light" title="Compliance Financeiro">
                <Text size="xs">
                    <strong>Lei 10.406/2002</strong> (Código Civil) — Arts. 304-388 (Obrigações e Pagamentos) •{' '}
                    <strong>Resolução BCB 1/2020</strong> — PIX •{' '}
                    <strong>Lei 12.846/2013</strong> (Lei Anticorrupção) •{' '}
                    <strong>LGPD</strong> — Dados financeiros pessoais protegidos •{' '}
                    <strong>CDC Art. 42</strong> — Cobrança indevida/abusiva proibida
                </Text>
            </Alert>
        </Stack>
    );
}
