'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Badge, Button, Table, Loader, Alert, Center, Select,
    Modal, TextInput, NumberInput, SegmentedControl,
    ActionIcon, Tooltip, Paper, Divider, ScrollArea,
    Tabs, RingProgress, Skeleton,
} from '@mantine/core';
import {
    IconBuildingBank, IconCash, IconArrowUpRight, IconArrowDownLeft,
    IconRefresh, IconAlertCircle, IconWallet, IconFileText,
    IconSend, IconCalendar, IconCopy, IconCheck,
    IconArrowsLeftRight, IconReportMoney, IconDownload,
    IconQrcode, IconReceipt,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ─── Types ──────────────────────────────────────────────

interface AccountCapabilities {
    pix: boolean;
    boleto: boolean;
    creditCard: boolean;
    debitCard: boolean;
    recurring: boolean;
    split: boolean;
    transfer: boolean;
    balance: boolean;
    statement: boolean;
}

interface BankAccount {
    id: string;
    provider: string;
    accountName: string;
    providerLabel: string;
    category: 'psp' | 'bank';
    isProduction: boolean;
    capabilities: AccountCapabilities;
}

interface BalanceData {
    availableCents: number;
    pendingCents: number;
    blockedCents?: number;
    currency: string;
}

interface StatementEntry {
    date: string;
    description: string;
    amountCents: number;
    type: 'credit' | 'debit';
    reference?: string;
}

interface StatementSummary {
    count: number;
    totalCreditsCents: number;
    totalDebitsCents: number;
    netCents: number;
}

// ─── Helpers ────────────────────────────────────────────

const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const providerColors: Record<string, string> = {
    asaas: 'blue', pagarme: 'green', pagbank: 'orange', mercadopago: 'cyan',
    inter: 'teal', bb: 'yellow', itau: 'orange', bradesco: 'red',
    santander: 'red', caixa: 'blue', sicredi: 'green', sicoob: 'green',
    safra: 'indigo', c6bank: 'dark',
};

// ─── Main Component ─────────────────────────────────────

export default function ContasBancariasOperacionalPage() {
    // Account list from API
    const { data: accounts, isLoading: accountsLoading } = useApi<BankAccount[]>('/api/banking');
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    // Balance state
    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [balanceFetchedAt, setBalanceFetchedAt] = useState<string | null>(null);

    // Statement state
    const [entries, setEntries] = useState<StatementEntry[]>([]);
    const [summary, setSummary] = useState<StatementSummary | null>(null);
    const [statementLoading, setStatementLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    // Transfer modal
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferMethod, setTransferMethod] = useState<'pix' | 'ted'>('pix');
    const [transferPixKey, setTransferPixKey] = useState('');
    const [transferAmount, setTransferAmount] = useState<number | ''>(0);
    const [transferDescription, setTransferDescription] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferResult, setTransferResult] = useState<{ status: string; externalId: string } | null>(null);

    // Error handling
    const [error, setError] = useState<string | null>(null);

    // Selected account
    const selectedAccount = accounts?.find(a => a.id === selectedAccountId) || null;

    // Auto-select first account
    useEffect(() => {
        if (accounts && accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    // Fetch balance when account changes
    const fetchBalance = useCallback(async () => {
        if (!selectedAccountId || !selectedAccount?.capabilities.balance) return;
        setBalanceLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/banking/balance?gatewayId=${selectedAccountId}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch balance');
            setBalance(json.data.balance);
            setBalanceFetchedAt(json.data.fetchedAt);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Balance fetch failed');
        } finally {
            setBalanceLoading(false);
        }
    }, [selectedAccountId, selectedAccount?.capabilities.balance]);

    // Fetch statement when account or date changes
    const fetchStatement = useCallback(async () => {
        if (!selectedAccountId || !selectedAccount?.capabilities.statement) return;
        setStatementLoading(true);
        setError(null);
        try {
            const url = `/api/banking/statement?gatewayId=${selectedAccountId}&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            const res = await fetch(url);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch statement');
            setEntries(json.data.entries || []);
            setSummary(json.data.summary || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Statement fetch failed');
        } finally {
            setStatementLoading(false);
        }
    }, [selectedAccountId, selectedAccount?.capabilities.statement, dateRange]);

    // Load data when account changes
    useEffect(() => {
        if (selectedAccountId && selectedAccount) {
            setBalance(null);
            setEntries([]);
            setSummary(null);
            if (selectedAccount.capabilities.balance) fetchBalance();
            if (selectedAccount.capabilities.statement) fetchStatement();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAccountId]);

    // Transfer handler
    const handleTransfer = async () => {
        if (!selectedAccountId || !transferAmount || transferAmount <= 0) return;
        setTransferLoading(true);
        setTransferResult(null);
        try {
            const res = await fetch('/api/banking/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gatewayId: selectedAccountId,
                    method: transferMethod,
                    pixKey: transferMethod === 'pix' ? transferPixKey : undefined,
                    amountCents: Math.round(Number(transferAmount) * 100),
                    description: transferDescription || 'Transferência NodeZero',
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Transfer failed');
            setTransferResult(json.data.transfer);
            fetchBalance(); // Refresh balance after transfer
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Transfer failed');
        } finally {
            setTransferLoading(false);
        }
    };

    // ─── Loading state ──────────────────────────────────────

    if (accountsLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    // ─── Empty state — no accounts ──────────────────────────

    if (!accounts || accounts.length === 0) {
        return (
            <Stack gap="lg">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Contas Bancárias</Title>
                </div>
                <Card withBorder p="xl">
                    <Center>
                        <Stack align="center" gap="xs">
                            <IconWallet size={48} color="gray" />
                            <Text c="dimmed">Nenhuma conta bancária configurada</Text>
                            <Text size="sm" c="dimmed">
                                Configure um gateway de pagamento ou integração bancária para acessar saldo, extratos e transferências.
                            </Text>
                            <Button
                                component="a"
                                href="/admin/financeiro/contas"
                                size="sm"
                                leftSection={<IconBuildingBank size={14} />}
                            >
                                Configurar Contas
                            </Button>
                        </Stack>
                    </Center>
                </Card>
            </Stack>
        );
    }

    // ─── Account selector data ──────────────────────────────

    const accountSelectData = accounts.map(a => ({
        value: a.id,
        label: `${a.providerLabel} — ${a.accountName}${!a.isProduction ? ' (Sandbox)' : ''}`,
    }));

    // Capability counts for the selected account
    const caps = selectedAccount?.capabilities;

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Financeiro</Text>
                    <Title order={2}>Contas Bancárias</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Selecionar conta"
                        data={accountSelectData}
                        value={selectedAccountId}
                        onChange={setSelectedAccountId}
                        w={350}
                        leftSection={<IconBuildingBank size={16} />}
                        styles={{ input: { fontWeight: 500 } }}
                    />
                    {accounts.length > 1 && (
                        <Badge variant="light" size="lg" color="blue">
                            {accounts.length} contas
                        </Badge>
                    )}
                </Group>
            </Group>

            {/* Error alert */}
            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light"
                    withCloseButton onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Selected account details */}
            {selectedAccount && (
                <>
                    {/* Account info bar */}
                    <Paper withBorder p="sm" radius="md">
                        <Group justify="space-between">
                            <Group>
                                <ThemeIcon
                                    variant="light"
                                    color={providerColors[selectedAccount.provider] || 'gray'}
                                    size="lg"
                                    radius="md"
                                >
                                    <IconBuildingBank size={20} />
                                </ThemeIcon>
                                <div>
                                    <Group gap={8}>
                                        <Text fw={600}>{selectedAccount.providerLabel}</Text>
                                        <Badge size="xs" color={selectedAccount.category === 'bank' ? 'teal' : 'violet'} variant="light">
                                            {selectedAccount.category === 'bank' ? 'Banco' : 'PSP'}
                                        </Badge>
                                        <Badge size="xs" color={selectedAccount.isProduction ? 'green' : 'orange'} variant="light">
                                            {selectedAccount.isProduction ? 'Produção' : 'Sandbox'}
                                        </Badge>
                                    </Group>
                                    <Text size="sm" c="dimmed">{selectedAccount.accountName}</Text>
                                </div>
                            </Group>
                            <Group gap={6}>
                                {caps?.pix && <Badge size="sm" variant="dot" color="green">PIX</Badge>}
                                {caps?.boleto && <Badge size="sm" variant="dot" color="blue">Boleto</Badge>}
                                {caps?.balance && <Badge size="sm" variant="dot" color="teal">Saldo</Badge>}
                                {caps?.statement && <Badge size="sm" variant="dot" color="indigo">Extrato</Badge>}
                                {caps?.transfer && <Badge size="sm" variant="dot" color="orange">Transferência</Badge>}
                                {caps?.creditCard && <Badge size="sm" variant="dot" color="violet">Cartão</Badge>}
                                {caps?.recurring && <Badge size="sm" variant="dot" color="pink">Recorrente</Badge>}
                                {caps?.split && <Badge size="sm" variant="dot" color="yellow">Split</Badge>}
                            </Group>
                        </Group>
                    </Paper>

                    {/* Balance section */}
                    {caps?.balance && (
                        <div>
                            <Group justify="space-between" mb="sm">
                                <Group gap="xs">
                                    <IconCash size={18} />
                                    <Text fw={600} size="lg">Saldo</Text>
                                </Group>
                                <Group gap="xs">
                                    {balanceFetchedAt && (
                                        <Text size="xs" c="dimmed">
                                            Atualizado {new Date(balanceFetchedAt).toLocaleTimeString('pt-BR')}
                                        </Text>
                                    )}
                                    <Tooltip label="Atualizar saldo">
                                        <ActionIcon variant="subtle" onClick={fetchBalance} loading={balanceLoading}>
                                            <IconRefresh size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                                <Card withBorder p="md" radius="md">
                                    <Group gap="xs" mb={4}>
                                        <ThemeIcon variant="light" color="green" size="sm" radius="xl">
                                            <IconCheck size={12} />
                                        </ThemeIcon>
                                        <Text size="xs" c="dimmed">Disponível</Text>
                                    </Group>
                                    {balanceLoading ? (
                                        <Skeleton h={32} w={140} />
                                    ) : (
                                        <Text fw={700} size="xl" c="green.7">
                                            {balance ? formatCurrency(balance.availableCents) : '—'}
                                        </Text>
                                    )}
                                </Card>
                                <Card withBorder p="md" radius="md">
                                    <Group gap="xs" mb={4}>
                                        <ThemeIcon variant="light" color="yellow" size="sm" radius="xl">
                                            <IconCalendar size={12} />
                                        </ThemeIcon>
                                        <Text size="xs" c="dimmed">A Liquidar</Text>
                                    </Group>
                                    {balanceLoading ? (
                                        <Skeleton h={32} w={140} />
                                    ) : (
                                        <Text fw={700} size="xl" c="yellow.7">
                                            {balance ? formatCurrency(balance.pendingCents) : '—'}
                                        </Text>
                                    )}
                                </Card>
                                <Card withBorder p="md" radius="md">
                                    <Group gap="xs" mb={4}>
                                        <ThemeIcon variant="light" color="red" size="sm" radius="xl">
                                            <IconAlertCircle size={12} />
                                        </ThemeIcon>
                                        <Text size="xs" c="dimmed">Bloqueado</Text>
                                    </Group>
                                    {balanceLoading ? (
                                        <Skeleton h={32} w={140} />
                                    ) : (
                                        <Text fw={700} size="xl" c="red.7">
                                            {balance ? formatCurrency(balance.blockedCents || 0) : '—'}
                                        </Text>
                                    )}
                                </Card>
                            </SimpleGrid>
                        </div>
                    )}

                    {/* Quick Actions */}
                    {(caps?.transfer || caps?.boleto || caps?.pix) && (
                        <div>
                            <Group gap="xs" mb="sm">
                                <IconArrowsLeftRight size={18} />
                                <Text fw={600} size="lg">Ações Rápidas</Text>
                            </Group>
                            <Group>
                                {caps?.transfer && (
                                    <Button
                                        leftSection={<IconSend size={16} />}
                                        onClick={() => {
                                            setTransferOpen(true);
                                            setTransferResult(null);
                                            setTransferPixKey('');
                                            setTransferAmount(0);
                                            setTransferDescription('');
                                        }}
                                    >
                                        Nova Transferência PIX
                                    </Button>
                                )}
                                {caps?.boleto && (
                                    <Button
                                        variant="light"
                                        leftSection={<IconReceipt size={16} />}
                                        component="a"
                                        href="/admin/financeiro/recebiveis"
                                    >
                                        Gerar Boleto
                                    </Button>
                                )}
                                {caps?.pix && (
                                    <Button
                                        variant="light"
                                        color="green"
                                        leftSection={<IconQrcode size={16} />}
                                        component="a"
                                        href="/admin/financeiro/recebiveis"
                                    >
                                        Gerar QR PIX
                                    </Button>
                                )}
                            </Group>
                        </div>
                    )}

                    <Divider />

                    {/* Statement section */}
                    {caps?.statement && (
                        <div>
                            <Group justify="space-between" mb="sm">
                                <Group gap="xs">
                                    <IconFileText size={18} />
                                    <Text fw={600} size="lg">Extrato</Text>
                                </Group>
                                <Group gap="xs">
                                    <TextInput
                                        type="date"
                                        size="xs"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(d => ({ ...d, start: e.target.value }))}
                                        w={140}
                                    />
                                    <Text size="sm" c="dimmed">até</Text>
                                    <TextInput
                                        type="date"
                                        size="xs"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(d => ({ ...d, end: e.target.value }))}
                                        w={140}
                                    />
                                    <Button size="xs" variant="light" onClick={fetchStatement} loading={statementLoading}>
                                        Buscar
                                    </Button>
                                </Group>
                            </Group>

                            {/* Summary cards */}
                            {summary && (
                                <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
                                    <Card withBorder p="sm" radius="md">
                                        <Text size="xs" c="dimmed">Lançamentos</Text>
                                        <Text fw={700} size="lg">{summary.count}</Text>
                                    </Card>
                                    <Card withBorder p="sm" radius="md">
                                        <Text size="xs" c="dimmed">Total Créditos</Text>
                                        <Text fw={700} size="lg" c="green.7">{formatCurrency(summary.totalCreditsCents)}</Text>
                                    </Card>
                                    <Card withBorder p="sm" radius="md">
                                        <Text size="xs" c="dimmed">Total Débitos</Text>
                                        <Text fw={700} size="lg" c="red.7">{formatCurrency(summary.totalDebitsCents)}</Text>
                                    </Card>
                                    <Card withBorder p="sm" radius="md">
                                        <Text size="xs" c="dimmed">Saldo Período</Text>
                                        <Text fw={700} size="lg" c={summary.netCents >= 0 ? 'green.7' : 'red.7'}>
                                            {formatCurrency(summary.netCents)}
                                        </Text>
                                    </Card>
                                </SimpleGrid>
                            )}

                            {/* Statement table */}
                            {statementLoading ? (
                                <Center h={200}><Loader size="md" /></Center>
                            ) : entries.length > 0 ? (
                                <Card withBorder p={0} radius="md">
                                    <ScrollArea>
                                        <Table striped highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Data</Table.Th>
                                                    <Table.Th>Descrição</Table.Th>
                                                    <Table.Th ta="right">Valor</Table.Th>
                                                    <Table.Th>Tipo</Table.Th>
                                                    <Table.Th>Referência</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {entries.map((entry, i) => (
                                                    <Table.Tr key={i}>
                                                        <Table.Td>
                                                            <Text size="sm">{entry.date}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm" lineClamp={1}>{entry.description}</Text>
                                                        </Table.Td>
                                                        <Table.Td ta="right">
                                                            <Text
                                                                size="sm"
                                                                fw={500}
                                                                c={entry.type === 'credit' ? 'green.7' : 'red.7'}
                                                            >
                                                                {entry.type === 'credit' ? '+' : '-'}
                                                                {formatCurrency(Math.abs(entry.amountCents))}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge size="xs" variant="light"
                                                                color={entry.type === 'credit' ? 'green' : 'red'}
                                                                leftSection={entry.type === 'credit'
                                                                    ? <IconArrowDownLeft size={10} />
                                                                    : <IconArrowUpRight size={10} />
                                                                }
                                                            >
                                                                {entry.type === 'credit' ? 'Crédito' : 'Débito'}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="xs" c="dimmed">{entry.reference || '—'}</Text>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </ScrollArea>
                                </Card>
                            ) : (
                                <Card withBorder p="xl" radius="md">
                                    <Center>
                                        <Stack align="center" gap="xs">
                                            <IconFileText size={36} color="gray" />
                                            <Text c="dimmed" size="sm">Nenhum lançamento encontrado no período</Text>
                                            <Text size="xs" c="dimmed">Ajuste as datas e tente novamente</Text>
                                        </Stack>
                                    </Center>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* No banking features available */}
                    {!caps?.balance && !caps?.statement && !caps?.transfer && (
                        <Card withBorder p="xl" radius="md">
                            <Center>
                                <Stack align="center" gap="xs">
                                    <IconReportMoney size={48} color="gray" />
                                    <Text c="dimmed">
                                        <strong>{selectedAccount.providerLabel}</strong> não oferece APIs bancárias (saldo, extrato, transferência)
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        Este provedor suporta apenas cobranças
                                        ({[
                                            caps?.pix && 'PIX',
                                            caps?.boleto && 'Boleto',
                                            caps?.creditCard && 'Cartão',
                                        ].filter(Boolean).join(', ') || 'nenhum método'}).
                                    </Text>
                                </Stack>
                            </Center>
                        </Card>
                    )}
                </>
            )}

            {/* Transfer Modal */}
            <Modal
                opened={transferOpen}
                onClose={() => setTransferOpen(false)}
                title="Nova Transferência"
                size="md"
            >
                {transferResult ? (
                    <Stack align="center" gap="md" p="md">
                        <ThemeIcon size={60} radius="xl" color="green" variant="light">
                            <IconCheck size={30} />
                        </ThemeIcon>
                        <Text fw={600} size="lg">Transferência Enviada</Text>
                        <Text size="sm" c="dimmed">
                            Status: <Badge color={transferResult.status === 'confirmed' ? 'green' : 'yellow'}>
                                {transferResult.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                            </Badge>
                        </Text>
                        <Text size="xs" c="dimmed">ID: {transferResult.externalId}</Text>
                        <Button fullWidth onClick={() => setTransferOpen(false)}>Fechar</Button>
                    </Stack>
                ) : (
                    <Stack gap="md">
                        <SegmentedControl
                            fullWidth
                            value={transferMethod}
                            onChange={(v) => setTransferMethod(v as 'pix' | 'ted')}
                            data={[
                                { value: 'pix', label: 'PIX' },
                                { value: 'ted', label: 'TED' },
                            ]}
                        />

                        {transferMethod === 'pix' && (
                            <TextInput
                                label="Chave PIX"
                                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                                value={transferPixKey}
                                onChange={(e) => setTransferPixKey(e.target.value)}
                                required
                            />
                        )}

                        <NumberInput
                            label="Valor (R$)"
                            placeholder="0,00"
                            value={transferAmount}
                            onChange={(v) => setTransferAmount(v as number)}
                            min={0.01}
                            decimalScale={2}
                            prefix="R$ "
                            thousandSeparator="."
                            decimalSeparator=","
                            required
                        />

                        <TextInput
                            label="Descrição"
                            placeholder="Transferência para..."
                            value={transferDescription}
                            onChange={(e) => setTransferDescription(e.target.value)}
                        />

                        <Alert icon={<IconAlertCircle size={14} />} color="yellow" variant="light">
                            <Text size="xs">
                                Transferências são processadas imediatamente e não podem ser desfeitas.
                                Verifique os dados antes de confirmar.
                            </Text>
                        </Alert>

                        <Group justify="flex-end">
                            <Button variant="light" onClick={() => setTransferOpen(false)}>Cancelar</Button>
                            <Button
                                leftSection={<IconSend size={16} />}
                                onClick={handleTransfer}
                                loading={transferLoading}
                                disabled={
                                    !transferAmount || Number(transferAmount) <= 0 ||
                                    (transferMethod === 'pix' && !transferPixKey)
                                }
                            >
                                Confirmar Transferência
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
