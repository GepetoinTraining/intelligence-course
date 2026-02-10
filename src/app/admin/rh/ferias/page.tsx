'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Table, Loader, Alert, Center, Select, Modal, TextInput, Textarea,
    Tooltip, Paper, Divider, Progress,
} from '@mantine/core';
import {
    IconBeach, IconPlus, IconAlertCircle, IconCalendar, IconRefresh,
    IconCheck, IconX, IconClock, IconBabyCarriage, IconShieldCheck,
    IconHeartbeat, IconUsers,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface LeaveRequest {
    id: string;
    userId: string;
    userName: string | null;
    leaveType: string;
    startDate: number;
    endDate: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    reason: string | null;
    approvedBy?: string;
    approvedAt?: number;
    contractId?: string;
}

interface StaffContract {
    id: string;
    personId: string;
    name?: string;
    email?: string;
    jobTitle: string;
    department: string;
    contractType: string;
    startsAt: number;
    status: string;
}

// ============================================================================
// BRAZILIAN LEGISLATION — CLT FÉRIAS
// ============================================================================

/**
 * CLT Arts. 129-153 — Direito a Férias
 *
 * Art. 129: Todo empregado tem direito a férias anuais (30 dias)
 * Art. 130: Proporcional a faltas injustificadas:
 *   - Até 5 faltas → 30 dias
 *   - 6-14 faltas → 24 dias
 *   - 15-23 faltas → 18 dias
 *   - 24-32 faltas → 12 dias
 *   - 32+ faltas → perde o direito
 *
 * Art. 134 (Reforma Trabalhista 2017):
 *   - Pode ser dividido em até 3 períodos
 *   - Um período mínimo de 14 dias corridos
 *   - Demais períodos mínimo 5 dias corridos cada
 *   - Vedado início 2 dias antes de feriado ou DSR
 *
 * Art. 7º, XVII CF/88: Remuneração + 1/3 constitucional
 *
 * Art. 137: Férias em dobro se concedidas fora do período concessivo
 *
 * Período Aquisitivo: 12 meses de trabalho
 * Período Concessivo: 12 meses seguintes ao aquisitivo
 */

const LEAVE_TYPE_CONFIG: Record<string, {
    label: string; color: string; icon: any;
    description: string; daysDefault: number; legalRef: string;
}> = {
    vacation: {
        label: 'Férias', color: 'cyan', icon: IconBeach,
        description: '30 dias + 1/3 constitucional. Pode dividir em até 3 períodos (14+5+5).',
        daysDefault: 30,
        legalRef: 'CLT Arts. 129-134, CF Art. 7º XVII',
    },
    sick: {
        label: 'Atestado Médico', color: 'orange', icon: IconHeartbeat,
        description: 'Primeiros 15 dias: empresa paga. A partir do 16º: auxílio-doença INSS (B31).',
        daysDefault: 1,
        legalRef: 'CLT Art. 476, Lei 8.213/91 Art. 59',
    },
    maternity: {
        label: 'Licença Maternidade', color: 'pink', icon: IconBabyCarriage,
        description: '120 dias (CLT Art. 392). Empresa Cidadã: 180 dias (Lei 11.770/08).',
        daysDefault: 120,
        legalRef: 'CLT Art. 392, Lei 11.770/08',
    },
    paternity: {
        label: 'Licença Paternidade', color: 'blue', icon: IconBabyCarriage,
        description: '5 dias (CLT Art. 473). Empresa Cidadã: 20 dias (Lei 11.770/08).',
        daysDefault: 5,
        legalRef: 'CLT Art. 473 III, Lei 11.770/08',
    },
    personal: {
        label: 'Pessoal', color: 'violet', icon: IconUsers,
        description: 'Licença para assuntos pessoais (acordo entre partes).',
        daysDefault: 1,
        legalRef: 'Acordo individual ou coletivo',
    },
    bereavement: {
        label: 'Falecimento (Nojo)', color: 'gray', icon: IconUsers,
        description: '2 dias consecutivos para cônjuge, ascendente, descendente, irmão.',
        daysDefault: 2,
        legalRef: 'CLT Art. 473 I',
    },
    marriage: {
        label: 'Casamento (Gala)', color: 'yellow', icon: IconUsers,
        description: '3 dias consecutivos em virtude de casamento.',
        daysDefault: 3,
        legalRef: 'CLT Art. 473 II',
    },
    unpaid: {
        label: 'Sem Remuneração', color: 'gray', icon: IconClock,
        description: 'Licença não remunerada por acordo entre as partes.',
        daysDefault: 1,
        legalRef: 'CLT Art. 476',
    },
    other: {
        label: 'Outro', color: 'gray', icon: IconCalendar,
        description: 'Outros tipos de afastamento.',
        daysDefault: 1,
        legalRef: '—',
    },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'yellow' },
    approved: { label: 'Aprovado', color: 'green' },
    rejected: { label: 'Rejeitado', color: 'red' },
    cancelled: { label: 'Cancelado', color: 'gray' },
};

// ============================================================================
// HELPERS
// ============================================================================

function fmtDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

function calcDays(start: number, end: number): number {
    return Math.ceil((end - start) / 86400) + 1;
}

function calcVacationBalance(hiringDate: number): { accrued: number; taken: number; balance: number; monthsWorked: number } {
    const now = Date.now() / 1000;
    const monthsWorked = Math.floor((now - hiringDate) / (30 * 86400));
    const accrued = Math.min(30, Math.floor(monthsWorked * 2.5)); // 2.5 days/month
    return { accrued, taken: 0, balance: accrued, monthsWorked };
}

// ============================================================================
// PAGE
// ============================================================================

export default function FeriasPage() {
    const { data: leaves, isLoading: loadingLeaves, error: errLeaves, refetch: refetchLeaves } = useApi<LeaveRequest[]>('/api/staff-leave');
    const { data: contracts, isLoading: loadingContracts } = useApi<StaffContract[]>('/api/staff-contracts');

    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newLeave, setNewLeave] = useState({
        userId: '', leaveType: 'vacation', startDate: '', endDate: '', reason: '',
    });

    const isLoading = loadingLeaves || loadingContracts;

    const leaveRequests = useMemo(() => {
        if (!leaves) return [];
        return leaves.filter(l => {
            if (typeFilter && l.leaveType !== typeFilter) return false;
            if (statusFilter && l.status !== statusFilter) return false;
            return true;
        });
    }, [leaves, typeFilter, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        const all = leaves || [];
        return {
            total: all.length,
            pending: all.filter(l => l.status === 'pending').length,
            approved: all.filter(l => l.status === 'approved').length,
            onLeaveNow: all.filter(l => {
                const now = Date.now() / 1000;
                return l.status === 'approved' && l.startDate <= now && l.endDate >= now;
            }).length,
            vacationRequests: all.filter(l => l.leaveType === 'vacation').length,
            sickLeave: all.filter(l => l.leaveType === 'sick').length,
        };
    }, [leaves]);

    // Vacation balances for active contracts
    const vacationBalances = useMemo(() => {
        if (!contracts) return [];
        return contracts
            .filter(c => c.status === 'active' && c.contractType === 'clt')
            .map(c => {
                const balance = calcVacationBalance(c.startsAt);
                const name = c.name || c.email || c.personId;
                return { ...balance, name, department: c.department, personId: c.personId };
            })
            .sort((a, b) => b.balance - a.balance);
    }, [contracts]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            await fetch('/api/staff-leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLeave),
            });
            refetchLeaves();
            setShowCreate(false);
            setNewLeave({ userId: '', leaveType: 'vacation', startDate: '', endDate: '', reason: '' });
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleApprove = async (id: string) => {
        try {
            await fetch(`/api/staff-leave/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' }),
            });
            refetchLeaves();
        } catch (e) { console.error(e); }
    };

    const handleReject = async (id: string) => {
        try {
            await fetch(`/api/staff-leave/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' }),
            });
            refetchLeaves();
        } catch (e) { console.error(e); }
    };

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (errLeaves) return (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar férias" color="red">
            {errLeaves}
            <Button size="xs" variant="light" ml="md" onClick={refetchLeaves}>Tentar novamente</Button>
        </Alert>
    );

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">RH</Text>
                    <Title order={2}>Férias e Afastamentos</Title>
                    <Text size="xs" c="dimmed" mt={2}>
                        CLT Arts. 129-153 • CF Art. 7º XVII (+1/3) • Reforma Trabalhista 2017
                    </Text>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={refetchLeaves}>
                        Atualizar
                    </Button>
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setShowCreate(true)}>
                        Novo Pedido
                    </Button>
                </Group>
            </Group>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Total</Text>
                    <Text fw={700} size="lg">{stats.total}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Pendentes</Text>
                    <Text fw={700} size="lg" c="yellow.7">{stats.pending}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Aprovados</Text>
                    <Text fw={700} size="lg" c="green.7">{stats.approved}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Em Afastamento</Text>
                    <Text fw={700} size="lg" c="blue.7">{stats.onLeaveNow}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Férias</Text>
                    <Text fw={700} size="lg" c="cyan.7">{stats.vacationRequests}</Text>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Atestados</Text>
                    <Text fw={700} size="lg" c="orange.7">{stats.sickLeave}</Text>
                </Card>
            </SimpleGrid>

            {/* CLT Leave Type Reference Cards */}
            <Text fw={600} size="sm">Tipos de Afastamento (Base Legal)</Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                {['vacation', 'sick', 'maternity', 'paternity'].map(type => {
                    const cfg = LEAVE_TYPE_CONFIG[type];
                    const Icon = cfg.icon;
                    return (
                        <Card key={type} withBorder p="sm">
                            <Group gap="xs" mb={4}>
                                <ThemeIcon variant="light" color={cfg.color} size="sm">
                                    <Icon size={14} />
                                </ThemeIcon>
                                <Text fw={600} size="xs">{cfg.label}</Text>
                            </Group>
                            <Text size="xs" c="dimmed" mb={4}>{cfg.description}</Text>
                            <Badge size="xs" variant="outline">{cfg.legalRef}</Badge>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {/* Vacation Balance Table (CLT employees only) */}
            {vacationBalances.length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="md">
                        Saldo de Férias — CLT (Período Aquisitivo)
                    </Text>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Meses Trabalhados</Table.Th>
                                <Table.Th>Dias Adquiridos</Table.Th>
                                <Table.Th>Dias Gozados</Table.Th>
                                <Table.Th>Saldo</Table.Th>
                                <Table.Th>Progresso</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {vacationBalances.slice(0, 10).map(v => (
                                <Table.Tr key={v.personId}>
                                    <Table.Td><Text fw={500} size="sm">{v.name}</Text></Table.Td>
                                    <Table.Td><Text size="sm">{v.monthsWorked}</Text></Table.Td>
                                    <Table.Td><Text size="sm">{v.accrued} dias</Text></Table.Td>
                                    <Table.Td><Text size="sm">{v.taken} dias</Text></Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={700} c={v.balance >= 30 ? 'orange.7' : 'green.7'}>
                                            {v.balance} dias
                                        </Text>
                                    </Table.Td>
                                    <Table.Td w={120}>
                                        <Tooltip label={`${Math.round((v.accrued / 30) * 100)}% do período`} withArrow>
                                            <Progress
                                                value={(v.accrued / 30) * 100}
                                                color={v.accrued >= 30 ? 'orange' : 'cyan'}
                                                size="sm"
                                            />
                                        </Tooltip>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Filters */}
            <Group>
                <Select
                    placeholder="Tipo" clearable size="sm" w={180}
                    data={Object.entries(LEAVE_TYPE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                    value={typeFilter} onChange={setTypeFilter}
                />
                <Select
                    placeholder="Status" clearable size="sm" w={180}
                    data={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                    value={statusFilter} onChange={setStatusFilter}
                />
            </Group>

            {/* Leave Requests Table */}
            <Card withBorder p="md">
                <Text fw={600} mb="md">Solicitações de Afastamento</Text>
                {leaveRequests.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Dias</Table.Th>
                                <Table.Th>Motivo</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {leaveRequests.map(leave => {
                                const cfg = LEAVE_TYPE_CONFIG[leave.leaveType] || LEAVE_TYPE_CONFIG.other;
                                const sc = STATUS_CONFIG[leave.status] || { label: leave.status, color: 'gray' };
                                const days = calcDays(leave.startDate, leave.endDate);
                                return (
                                    <Table.Tr key={leave.id}>
                                        <Table.Td><Text fw={500} size="sm">{leave.userName || '—'}</Text></Table.Td>
                                        <Table.Td>
                                            <Tooltip label={cfg.legalRef} withArrow>
                                                <Badge variant="light" size="sm" color={cfg.color}>
                                                    {cfg.label}
                                                </Badge>
                                            </Tooltip>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{fmtDate(leave.startDate)} — {fmtDate(leave.endDate)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{days} {days === 1 ? 'dia' : 'dias'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed" lineClamp={1}>{leave.reason || '—'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={sc.color} variant="light" size="sm">{sc.label}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {leave.status === 'pending' && (
                                                <Group gap={4}>
                                                    <Tooltip label="Aprovar" withArrow>
                                                        <Button size="xs" variant="light" color="green"
                                                            onClick={() => handleApprove(leave.id)}>
                                                            <IconCheck size={14} />
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip label="Rejeitar" withArrow>
                                                        <Button size="xs" variant="light" color="red"
                                                            onClick={() => handleReject(leave.id)}>
                                                            <IconX size={14} />
                                                        </Button>
                                                    </Tooltip>
                                                </Group>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBeach size={48} color="gray" />
                            <Text c="dimmed">Nenhuma solicitação encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Legal Notice */}
            <Alert icon={<IconShieldCheck size={16} />} color="cyan" variant="light" title="Regras de Férias — Reforma Trabalhista">
                <Text size="xs">
                    <strong>Fracionamento (CLT Art. 134, §1º):</strong> Até 3 períodos: mínimo 14 dias corridos no 1º período,
                    e 5 dias corridos nos demais. <strong>Abono pecuniário (Art. 143):</strong> Converter 1/3 em dinheiro
                    (requerimento até 15 dias antes do fim do aquisitivo).
                    <strong> Período concessivo:</strong> 12 meses após o aquisitivo — ultrapassagem gera pagamento em dobro (Art. 137).
                    <strong> Vedações:</strong> Não pode iniciar 2 dias antes de feriado ou DSR. Menores de 18 e maiores de 50
                    devem gozar férias integrais (revogado pela Reforma, agora sem restrição de idade).
                </Text>
            </Alert>

            {/* Create Modal */}
            <Modal opened={showCreate} onClose={() => setShowCreate(false)} title="Nova Solicitação de Afastamento" size="md">
                <Stack gap="md">
                    <Select
                        label="Colaborador" placeholder="Selecione"
                        data={contracts?.filter(c => c.status === 'active').map(c => ({
                            value: c.personId, label: c.name || c.email || c.personId,
                        })) || []}
                        value={newLeave.userId}
                        onChange={v => setNewLeave(p => ({ ...p, userId: v || '' }))}
                    />
                    <Select
                        label="Tipo de Afastamento"
                        data={Object.entries(LEAVE_TYPE_CONFIG).map(([v, c]) => ({
                            value: v, label: `${c.label} — ${c.legalRef}`,
                        }))}
                        value={newLeave.leaveType}
                        onChange={v => setNewLeave(p => ({ ...p, leaveType: v || 'vacation' }))}
                    />
                    {newLeave.leaveType && (
                        <Alert variant="light" color={LEAVE_TYPE_CONFIG[newLeave.leaveType]?.color || 'gray'}>
                            <Text size="xs">{LEAVE_TYPE_CONFIG[newLeave.leaveType]?.description}</Text>
                        </Alert>
                    )}
                    <Group grow>
                        <TextInput
                            label="Data Início" type="date"
                            value={newLeave.startDate}
                            onChange={e => setNewLeave(p => ({ ...p, startDate: e.target.value }))}
                        />
                        <TextInput
                            label="Data Fim" type="date"
                            value={newLeave.endDate}
                            onChange={e => setNewLeave(p => ({ ...p, endDate: e.target.value }))}
                        />
                    </Group>
                    <Textarea
                        label="Motivo / Justificativa"
                        value={newLeave.reason}
                        onChange={e => setNewLeave(p => ({ ...p, reason: e.target.value }))}
                    />
                    <Button onClick={handleCreate} loading={creating} fullWidth>
                        Solicitar Afastamento
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
