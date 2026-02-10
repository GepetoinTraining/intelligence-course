'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Table, Loader, Alert, Center, Modal, Select, NumberInput, Divider,
    Tooltip, ActionIcon, Collapse, Paper, Progress,
} from '@mantine/core';
import {
    IconCash, IconPlus, IconCheck, IconClock, IconAlertCircle,
    IconChevronDown, IconChevronUp, IconReceipt, IconPercentage,
    IconShieldCheck, IconFileText, IconRefresh, IconCalendar,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Payroll {
    id: string;
    userId: string;
    userName: string | null;
    jobTitle: string | null;
    department: string | null;
    contractType?: string;
    periodStart: number;
    periodEnd: number;
    payrollType: string;
    grossAmountCents: number;
    netAmountCents: number;
    totalDeductionsCents: number;
    totalAdditionsCents: number;
    deductions: string; // JSON: { inss, irrf, vt, vr, saude, ... }
    additions: string;  // JSON: { overtime50, overtime100, dsr, bonus, ... }
    hoursWorked: number | null;
    status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'paid' | 'cancelled';
    paymentDueDate: number | null;
    payslipUrl: string | null;
    calculatedAt: number | null;
    approvedAt: number | null;
    paidAt: number | null;
}

// ============================================================================
// BRAZILIAN LEGISLATION HELPERS
// ============================================================================

/**
 * INSS 2024 progressive rates (employee contribution)
 * Faixa 1: até R$ 1.412,00 → 7,5%
 * Faixa 2: R$ 1.412,01 a R$ 2.666,68 → 9%
 * Faixa 3: R$ 2.666,69 a R$ 4.000,03 → 12%
 * Faixa 4: R$ 4.000,04 a R$ 7.786,02 → 14%
 * Teto: R$ 908,85
 */
const INSS_RANGES = [
    { limit: 141200, rate: 0.075, label: '7,5%' },
    { limit: 266668, rate: 0.09, label: '9%' },
    { limit: 400003, rate: 0.12, label: '12%' },
    { limit: 778602, rate: 0.14, label: '14%' },
];

/**
 * IRRF 2024 progressive rates (after INSS deduction)
 * Isento: até R$ 2.259,20
 * 7,5%: R$ 2.259,21 a R$ 2.826,65 → dedução R$ 169,44
 * 15%: R$ 2.826,66 a R$ 3.751,05 → dedução R$ 381,44
 * 22,5%: R$ 3.751,06 a R$ 4.664,68 → dedução R$ 662,77
 * 27,5%: acima de R$ 4.664,68 → dedução R$ 896,00
 */
const IRRF_RANGES = [
    { limit: 225920, rate: 0, deduction: 0, label: 'Isento' },
    { limit: 282665, rate: 0.075, deduction: 16944, label: '7,5%' },
    { limit: 375105, rate: 0.15, deduction: 38144, label: '15%' },
    { limit: 466468, rate: 0.225, deduction: 66277, label: '22,5%' },
    { limit: Infinity, rate: 0.275, deduction: 89600, label: '27,5%' },
];

// FGTS: 8% employer contribution (not deducted from employee)
const FGTS_RATE = 0.08;
// INSS employer: 20% (not deducted from employee)
const INSS_EMPLOYER_RATE = 0.20;

// ============================================================================
// FORMATTING
// ============================================================================

function fmt(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(ts: number | null): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

function fmtPeriod(start: number, end: number): string {
    const d = new Date(start * 1000);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function parseJSON(json: string | null | undefined): Record<string, number> {
    try { return json ? JSON.parse(json) : {}; } catch { return {}; }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'gray' },
    pending_approval: { label: 'Aguardando Aprovação', color: 'yellow' },
    approved: { label: 'Aprovado', color: 'blue' },
    scheduled: { label: 'Agendado', color: 'cyan' },
    partially_paid: { label: 'Parcial', color: 'orange' },
    paid: { label: 'Pago', color: 'green' },
    cancelled: { label: 'Cancelado', color: 'red' },
    disputed: { label: 'Contestado', color: 'red' },
};

const PAYROLL_TYPE_LABELS: Record<string, string> = {
    salary: 'Salário', hourly: 'Hora', bonus: 'Bônus',
    commission: 'Comissão', reimbursement: 'Reembolso',
    advance: 'Adiantamento', other: 'Outro',
};

const DEDUCTION_LABELS: Record<string, string> = {
    inss: 'INSS (Contribuição)', irrf: 'IRRF',
    vt: 'Vale Transporte (6%)', vr: 'Vale Refeição',
    saude: 'Plano de Saúde', odonto: 'Plano Odontológico',
    pensao: 'Pensão Alimentícia', sindicato: 'Contribuição Sindical',
    emprestimo: 'Empréstimo Consignado', outros: 'Outros Descontos',
};

const ADDITION_LABELS: Record<string, string> = {
    overtime50: 'Hora Extra 50%', overtime100: 'Hora Extra 100%',
    dsr: 'DSR', noturno: 'Adicional Noturno (20%)',
    periculosidade: 'Periculosidade (30%)', insalubridade: 'Insalubridade',
    bonus: 'Bônus', comissao: 'Comissão', gratificacao: 'Gratificação',
    outros: 'Outros Proventos',
};

const DEPT_LABELS: Record<string, string> = {
    admin: 'Administrativo', reception: 'Recepção', marketing: 'Marketing',
    finance: 'Financeiro', maintenance: 'Manutenção', it: 'TI',
    management: 'Gerência', other: 'Outro',
};

// ============================================================================
// HOLERITE (PAYSLIP) DETAIL COMPONENT
// ============================================================================

function HoleriteDetail({ payroll }: { payroll: Payroll }) {
    const deductions = parseJSON(payroll.deductions);
    const additions = parseJSON(payroll.additions);
    const hasDeductions = Object.keys(deductions).length > 0;
    const hasAdditions = Object.keys(additions).length > 0;

    // Estimated employer obligations (not deducted from employee)
    const fgtsEstimate = Math.round(payroll.grossAmountCents * FGTS_RATE);
    const inssEmployer = Math.round(payroll.grossAmountCents * INSS_EMPLOYER_RATE);

    return (
        <Paper p="md" bg="gray.0" radius="sm">
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                {/* Proventos (Earnings) */}
                <div>
                    <Text fw={600} size="sm" mb="xs" c="green.7">
                        <IconCash size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Proventos
                    </Text>
                    <Stack gap={4}>
                        <Group justify="space-between">
                            <Text size="xs">Salário Base</Text>
                            <Text size="xs" fw={500}>{fmt(payroll.grossAmountCents)}</Text>
                        </Group>
                        {hasAdditions && Object.entries(additions).map(([key, val]) => (
                            <Group key={key} justify="space-between">
                                <Text size="xs">{ADDITION_LABELS[key] || key}</Text>
                                <Text size="xs" fw={500} c="green.7">+ {fmt(val)}</Text>
                            </Group>
                        ))}
                        <Divider my={4} />
                        <Group justify="space-between">
                            <Text size="xs" fw={600}>Total Bruto</Text>
                            <Text size="xs" fw={700}>
                                {fmt(payroll.grossAmountCents + (payroll.totalAdditionsCents || 0))}
                            </Text>
                        </Group>
                    </Stack>
                </div>

                {/* Descontos (Deductions) */}
                <div>
                    <Text fw={600} size="sm" mb="xs" c="red.7">
                        <IconPercentage size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Descontos
                    </Text>
                    <Stack gap={4}>
                        {hasDeductions ? Object.entries(deductions).map(([key, val]) => (
                            <Group key={key} justify="space-between">
                                <Text size="xs">{DEDUCTION_LABELS[key] || key}</Text>
                                <Text size="xs" fw={500} c="red.7">- {fmt(val)}</Text>
                            </Group>
                        )) : (
                            <Text size="xs" c="dimmed">Sem descontos detalhados</Text>
                        )}
                        <Divider my={4} />
                        <Group justify="space-between">
                            <Text size="xs" fw={600}>Total Descontos</Text>
                            <Text size="xs" fw={700} c="red.7">
                                - {fmt(payroll.totalDeductionsCents || 0)}
                            </Text>
                        </Group>
                    </Stack>
                </div>

                {/* Encargos Patronais (Employer Obligations) */}
                <div>
                    <Text fw={600} size="sm" mb="xs" c="blue.7">
                        <IconShieldCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Encargos Patronais
                    </Text>
                    <Stack gap={4}>
                        <Group justify="space-between">
                            <Text size="xs">FGTS (8%)</Text>
                            <Text size="xs" fw={500} c="blue.7">{fmt(fgtsEstimate)}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="xs">INSS Patronal (20%)</Text>
                            <Text size="xs" fw={500} c="blue.7">{fmt(inssEmployer)}</Text>
                        </Group>
                        <Divider my={4} />
                        <Group justify="space-between">
                            <Text size="xs" fw={600}>Custo Total Empresa</Text>
                            <Text size="xs" fw={700} c="blue.7">
                                {fmt(payroll.grossAmountCents + fgtsEstimate + inssEmployer)}
                            </Text>
                        </Group>
                    </Stack>
                </div>
            </SimpleGrid>

            {/* Net amount highlight */}
            <Divider my="sm" />
            <Group justify="space-between">
                <Text fw={700}>Valor Líquido a Receber</Text>
                <Text fw={700} size="lg" c="green.7">{fmt(payroll.netAmountCents)}</Text>
            </Group>

            {/* Payslip link */}
            {payroll.payslipUrl && (
                <Button
                    variant="subtle" size="xs" mt="xs"
                    leftSection={<IconFileText size={14} />}
                    component="a" href={payroll.payslipUrl} target="_blank"
                >
                    Baixar Holerite (PDF)
                </Button>
            )}
        </Paper>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function FolhaPage() {
    const { data: payrolls, isLoading, error, refetch } = useApi<Payroll[]>('/api/staff-payroll');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [periodFilter, setPeriodFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Period options from data
    const periodOptions = useMemo(() => {
        if (!payrolls) return [];
        const seen = new Set<string>();
        return payrolls
            .map(p => {
                const d = new Date(p.periodStart * 1000);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                return { key, label };
            })
            .filter(p => { if (seen.has(p.key)) return false; seen.add(p.key); return true; })
            .sort((a, b) => b.key.localeCompare(a.key))
            .map(p => ({ value: p.key, label: p.label }));
    }, [payrolls]);

    // Filtered payrolls
    const filtered = useMemo(() => {
        if (!payrolls) return [];
        return payrolls.filter(p => {
            if (periodFilter) {
                const d = new Date(p.periodStart * 1000);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (key !== periodFilter) return false;
            }
            if (statusFilter && p.status !== statusFilter) return false;
            return true;
        });
    }, [payrolls, periodFilter, statusFilter]);

    // Summary stats
    const stats = useMemo(() => {
        const list = filtered;
        const totalGross = list.reduce((s, p) => s + (p.grossAmountCents || 0), 0);
        const totalDeductions = list.reduce((s, p) => s + (p.totalDeductionsCents || 0), 0);
        const totalNet = list.reduce((s, p) => s + (p.netAmountCents || 0), 0);
        const fgtsEstimate = Math.round(totalGross * FGTS_RATE);
        const pending = list.filter(p => ['draft', 'pending_approval', 'approved'].includes(p.status)).length;
        const paid = list.filter(p => p.status === 'paid').length;
        return { totalGross, totalDeductions, totalNet, fgtsEstimate, pending, paid, total: list.length };
    }, [filtered]);

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar folha" color="red">
            {error}
            <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
        </Alert>
    );

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">RH</Text>
                    <Title order={2}>Folha de Pagamento</Title>
                    <Text size="xs" c="dimmed" mt={2}>
                        CLT • INSS • IRRF • FGTS • 13º Salário
                    </Text>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={refetch}>
                        Atualizar
                    </Button>
                    <Button leftSection={<IconPlus size={16} />}>Nova Folha</Button>
                </Group>
            </Group>

            {/* Filters */}
            <Group>
                <Select
                    placeholder="Período" clearable size="sm" w={200}
                    data={periodOptions} value={periodFilter}
                    onChange={setPeriodFilter}
                    leftSection={<IconCalendar size={14} />}
                />
                <Select
                    placeholder="Status" clearable size="sm" w={200}
                    data={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                    value={statusFilter} onChange={setStatusFilter}
                />
            </Group>

            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Total Registros</Text>
                    <Text fw={700} size="lg">{stats.total}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Pendentes</Text>
                    <Text fw={700} size="lg" c="yellow.7">{stats.pending}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Pagos</Text>
                    <Text fw={700} size="lg" c="green.7">{stats.paid}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Total Bruto</Text>
                    <Text fw={700} size="lg">{fmt(stats.totalGross)}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Total Líquido</Text>
                    <Text fw={700} size="lg" c="green.7">{fmt(stats.totalNet)}</Text>
                </Card>
                <Card withBorder p="md">
                    <Tooltip label="8% sobre salário bruto — Lei 8.036/90" withArrow>
                        <div>
                            <Text size="xs" c="dimmed">FGTS Estimado</Text>
                            <Text fw={700} size="lg" c="blue.7">{fmt(stats.fgtsEstimate)}</Text>
                        </div>
                    </Tooltip>
                </Card>
            </SimpleGrid>

            {/* INSS/IRRF Reference Card */}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Card withBorder p="sm">
                    <Text fw={600} size="sm" mb="xs">
                        <IconShieldCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Tabela INSS 2024 (Empregado)
                    </Text>
                    <Stack gap={2}>
                        {INSS_RANGES.map((r, i) => (
                            <Group key={i} justify="space-between">
                                <Text size="xs">Até {fmt(r.limit)}</Text>
                                <Badge size="xs" variant="light">{r.label}</Badge>
                            </Group>
                        ))}
                        <Text size="xs" c="dimmed" mt={4}>Teto: R$ 908,85 • Cálculo progressivo por faixa</Text>
                    </Stack>
                </Card>
                <Card withBorder p="sm">
                    <Text fw={600} size="sm" mb="xs">
                        <IconReceipt size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Tabela IRRF 2024
                    </Text>
                    <Stack gap={2}>
                        {IRRF_RANGES.map((r, i) => (
                            <Group key={i} justify="space-between">
                                <Text size="xs">
                                    {r.rate === 0 ? 'Isento' : `Até ${fmt(r.limit)}`}
                                </Text>
                                <Badge size="xs" variant="light" color={r.rate === 0 ? 'green' : 'orange'}>
                                    {r.label}
                                </Badge>
                            </Group>
                        ))}
                        <Text size="xs" c="dimmed" mt={4}>Base = Salário Bruto − INSS − Dependentes (R$ 189,59/dep)</Text>
                    </Stack>
                </Card>
            </SimpleGrid>

            {/* Payroll Table */}
            <Card withBorder p="md">
                <Text fw={600} mb="md">Registros da Folha</Text>
                {filtered.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={30}></Table.Th>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Bruto</Table.Th>
                                <Table.Th>Descontos</Table.Th>
                                <Table.Th>Líquido</Table.Th>
                                <Table.Th>Vencimento</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map(p => {
                                const expanded = expandedId === p.id;
                                const sc = STATUS_CONFIG[p.status] || { label: p.status, color: 'gray' };
                                return (
                                    <>
                                        <Table.Tr
                                            key={p.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setExpandedId(expanded ? null : p.id)}
                                        >
                                            <Table.Td>
                                                <ActionIcon variant="subtle" size="xs">
                                                    {expanded ?
                                                        <IconChevronUp size={14} /> :
                                                        <IconChevronDown size={14} />
                                                    }
                                                </ActionIcon>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text fw={500} size="sm">{p.userName || '—'}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {p.jobTitle || ''} {p.department ? `• ${DEPT_LABELS[p.department] || p.department}` : ''}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge size="xs" variant="outline">
                                                    {PAYROLL_TYPE_LABELS[p.payrollType] || p.payrollType}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{fmtPeriod(p.periodStart, p.periodEnd)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{fmt(p.grossAmountCents)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="red.6">- {fmt(p.totalDeductionsCents || 0)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={700} c="green.7">{fmt(p.netAmountCents)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{fmtDate(p.paymentDueDate)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={sc.color} variant="light" size="sm">
                                                    {sc.label}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                        {expanded && (
                                            <Table.Tr key={`${p.id}-detail`}>
                                                <Table.Td colSpan={9} p={0}>
                                                    <HoleriteDetail payroll={p} />
                                                </Table.Td>
                                            </Table.Tr>
                                        )}
                                    </>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCash size={48} color="gray" />
                            <Text c="dimmed">Nenhum registro de folha encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>Criar folha</Button>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Legal Notice */}
            <Alert icon={<IconShieldCheck size={16} />} color="blue" variant="light" title="Obrigações Legais">
                <Text size="xs">
                    <strong>Prazos CLT:</strong> Pagamento até o 5º dia útil do mês subsequente (CLT Art. 459, §1º).
                    13º salário: 1ª parcela até 30/11, 2ª parcela até 20/12 (Lei 4.090/62).
                    FGTS: depósito até o dia 7 do mês seguinte (Lei 8.036/90, Art. 15).
                    INSS/IRRF: recolhimento até o dia 20 do mês seguinte ao da competência.
                </Text>
            </Alert>
        </Stack>
    );
}
