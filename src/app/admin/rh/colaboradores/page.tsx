'use client';

import { useState, useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Table, Avatar, Loader, Alert, Center, Select, Modal, TextInput,
    NumberInput, Tooltip, Divider, Progress,
} from '@mantine/core';
import {
    IconUsers, IconPlus, IconAlertCircle, IconRefresh,
    IconBriefcase, IconFileText, IconSearch, IconUserPlus,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface StaffContract {
    id: string;
    userId: string;
    personId?: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    contractType: string;
    salaryCents: number | null;
    weeklyHours: number | null;
    status: 'active' | 'on_leave' | 'suspended' | 'terminated' | 'draft';
    startsAt: number | null;
    endsAt: number | null;
    benefits: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

function fmt(cents: number | null): string {
    if (!cents) return '—';
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(ts: number | null): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

function calcTenure(startsAt: number | null): string {
    if (!startsAt) return '—';
    const months = Math.floor((Date.now() / 1000 - startsAt) / (30 * 86400));
    if (months < 1) return '< 1 mês';
    if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}a ${rem}m` : `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'green' },
    on_leave: { label: 'Afastado', color: 'blue' },
    suspended: { label: 'Suspenso', color: 'orange' },
    terminated: { label: 'Desligado', color: 'red' },
    draft: { label: 'Rascunho', color: 'gray' },
};

const DEPT_LABELS: Record<string, string> = {
    admin: 'Administrativo', reception: 'Recepção', marketing: 'Marketing',
    finance: 'Financeiro', maintenance: 'Manutenção', it: 'TI',
    management: 'Gerência', other: 'Outro',
};

const CONTRACT_TYPE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
    clt: { label: 'CLT', color: 'blue', description: 'Carteira assinada (CTPS), FGTS, INSS, férias, 13º' },
    pj: { label: 'PJ', color: 'orange', description: 'Pessoa jurídica — emite NF, sem vínculo empregatício' },
    freelance: { label: 'Freelancer', color: 'grape', description: 'Autônomo — contrato por projeto/tarefa' },
    intern: { label: 'Estagiário', color: 'green', description: 'Lei 11.788/08 — bolsa auxílio, 6h/dia, seguro' },
    volunteer: { label: 'Voluntário', color: 'gray', description: 'Sem remuneração — Lei 9.608/98' },
};

// ============================================================================
// PAGE
// ============================================================================

export default function ColaboradoresPage() {
    const { data: contracts, isLoading, error, refetch } = useApi<StaffContract[]>('/api/staff-contracts');
    const [deptFilter, setDeptFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showHire, setShowHire] = useState(false);
    const [hiring, setHiring] = useState(false);
    const [newHire, setNewHire] = useState({
        name: '', email: '', jobTitle: '', department: 'admin',
        contractType: 'clt', salaryCents: 0, startDate: '',
    });

    // Filtered list
    const filtered = useMemo(() => {
        if (!contracts) return [];
        return contracts.filter(c => {
            if (deptFilter && c.department !== deptFilter) return false;
            if (typeFilter && c.contractType !== typeFilter) return false;
            if (statusFilter && c.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                const matchName = c.name?.toLowerCase().includes(q);
                const matchEmail = c.email?.toLowerCase().includes(q);
                const matchTitle = c.jobTitle?.toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchTitle) return false;
            }
            return true;
        });
    }, [contracts, deptFilter, typeFilter, statusFilter, search]);

    // Stats
    const stats = useMemo(() => {
        const all = contracts || [];
        const active = all.filter(c => c.status === 'active');
        return {
            total: all.length,
            active: active.length,
            onLeave: all.filter(c => c.status === 'on_leave').length,
            clt: active.filter(c => c.contractType === 'clt').length,
            pj: active.filter(c => c.contractType === 'pj').length,
            intern: active.filter(c => c.contractType === 'intern').length,
            totalPayroll: active.reduce((s, c) => s + (c.salaryCents || 0), 0),
        };
    }, [contracts]);

    // Department options
    const deptOptions = useMemo(() => {
        if (!contracts) return [];
        const depts = [...new Set(contracts.map(c => c.department).filter(Boolean))];
        return depts.map(d => ({ value: d!, label: DEPT_LABELS[d!] || d! }));
    }, [contracts]);

    const handleHire = async () => {
        setHiring(true);
        try {
            await fetch('/api/staff-contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHire),
            });
            refetch();
            setShowHire(false);
        } catch (e) { console.error(e); }
        finally { setHiring(false); }
    };

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
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
                    <Title order={2}>Colaboradores</Title>
                    <Text size="xs" c="dimmed" mt={2}>
                        Quadro de pessoal • CLT, PJ, Estagiários
                    </Text>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={refetch}>
                        Atualizar
                    </Button>
                    <Button leftSection={<IconUserPlus size={16} />} onClick={() => setShowHire(true)}>
                        Admitir
                    </Button>
                </Group>
            </Group>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 2, sm: 4, md: 7 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="lg" c="green.7">{stats.active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Afastados</Text>
                    <Text fw={700} size="lg" c="blue.7">{stats.onLeave}</Text>
                </Card>
                <Card withBorder p="md">
                    <Tooltip label="CLT — carteira assinada" withArrow>
                        <div>
                            <Text size="xs" c="dimmed">CLT</Text>
                            <Text fw={700} size="lg" c="blue.7">{stats.clt}</Text>
                        </div>
                    </Tooltip>
                </Card>
                <Card withBorder p="md">
                    <Tooltip label="Pessoa Jurídica — sem vínculo" withArrow>
                        <div>
                            <Text size="xs" c="dimmed">PJ</Text>
                            <Text fw={700} size="lg" c="orange.7">{stats.pj}</Text>
                        </div>
                    </Tooltip>
                </Card>
                <Card withBorder p="md">
                    <Tooltip label="Lei 11.788/08" withArrow>
                        <div>
                            <Text size="xs" c="dimmed">Estagiários</Text>
                            <Text fw={700} size="lg" c="green.7">{stats.intern}</Text>
                        </div>
                    </Tooltip>
                </Card>
                <Card withBorder p="md">
                    <Text size="xs" c="dimmed">Folha Mensal</Text>
                    <Text fw={700} size="lg">{fmt(stats.totalPayroll)}</Text>
                </Card>
            </SimpleGrid>

            {/* Filters */}
            <Group>
                <TextInput
                    placeholder="Buscar por nome, email ou cargo..."
                    leftSection={<IconSearch size={14} />}
                    size="sm" w={280}
                    value={search} onChange={e => setSearch(e.target.value)}
                />
                <Select
                    placeholder="Departamento" clearable size="sm" w={180}
                    data={deptOptions} value={deptFilter} onChange={setDeptFilter}
                />
                <Select
                    placeholder="Tipo" clearable size="sm" w={150}
                    data={Object.entries(CONTRACT_TYPE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                    value={typeFilter} onChange={setTypeFilter}
                />
                <Select
                    placeholder="Status" clearable size="sm" w={150}
                    data={Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                    value={statusFilter} onChange={setStatusFilter}
                />
            </Group>

            {/* Staff Table */}
            <Card withBorder p="md">
                <Text fw={600} mb="md">Quadro de Pessoal ({filtered.length})</Text>
                {filtered.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Cargo</Table.Th>
                                <Table.Th>Departamento</Table.Th>
                                <Table.Th>Vínculo</Table.Th>
                                <Table.Th>Salário</Table.Th>
                                <Table.Th>Admissão</Table.Th>
                                <Table.Th>Tempo</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map(c => {
                                const sc = STATUS_CONFIG[c.status] || { label: c.status, color: 'gray' };
                                const tc = CONTRACT_TYPE_CONFIG[c.contractType] || { label: c.contractType, color: 'gray', description: '' };
                                return (
                                    <Table.Tr key={c.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size={32} radius="xl" src={c.avatarUrl} color="blue">
                                                    {c.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                                </Avatar>
                                                <div>
                                                    <Text fw={500} size="sm">{c.name || '—'}</Text>
                                                    <Text size="xs" c="dimmed">{c.email || ''}</Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{c.jobTitle || '—'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" size="xs">
                                                {DEPT_LABELS[c.department || ''] || c.department || '—'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Tooltip label={tc.description} withArrow multiline w={220}>
                                                <Badge variant="outline" size="xs" color={tc.color}>
                                                    {tc.label}
                                                </Badge>
                                            </Tooltip>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{fmt(c.salaryCents)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{fmtDate(c.startsAt)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{calcTenure(c.startsAt)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={sc.color} variant="light" size="sm">{sc.label}</Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUsers size={48} color="gray" />
                            <Text c="dimmed">Nenhum colaborador encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setShowHire(true)}>
                                Cadastrar colaborador
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Hire Modal */}
            <Modal opened={showHire} onClose={() => setShowHire(false)} title="Admitir Colaborador" size="lg">
                <Stack gap="md">
                    <SimpleGrid cols={2}>
                        <TextInput label="Nome Completo" required
                            value={newHire.name} onChange={e => setNewHire(p => ({ ...p, name: e.target.value }))} />
                        <TextInput label="E-mail" type="email"
                            value={newHire.email} onChange={e => setNewHire(p => ({ ...p, email: e.target.value }))} />
                    </SimpleGrid>
                    <SimpleGrid cols={2}>
                        <TextInput label="Cargo"
                            value={newHire.jobTitle} onChange={e => setNewHire(p => ({ ...p, jobTitle: e.target.value }))} />
                        <Select label="Departamento"
                            data={Object.entries(DEPT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                            value={newHire.department} onChange={v => setNewHire(p => ({ ...p, department: v || 'admin' }))} />
                    </SimpleGrid>
                    <SimpleGrid cols={2}>
                        <Select label="Tipo de Contrato"
                            data={Object.entries(CONTRACT_TYPE_CONFIG).map(([v, c]) => ({
                                value: v, label: `${c.label} — ${c.description}`,
                            }))}
                            value={newHire.contractType}
                            onChange={v => setNewHire(p => ({ ...p, contractType: v || 'clt' }))} />
                        <TextInput label="Data de Admissão" type="date"
                            value={newHire.startDate} onChange={e => setNewHire(p => ({ ...p, startDate: e.target.value }))} />
                    </SimpleGrid>
                    <NumberInput label="Salário (R$)" prefix="R$ " decimalScale={2} thousandSeparator="."
                        decimalSeparator="," min={0}
                        value={newHire.salaryCents / 100}
                        onChange={v => setNewHire(p => ({ ...p, salaryCents: Math.round(Number(v || 0) * 100) }))} />

                    {newHire.contractType === 'clt' && (
                        <Alert variant="light" color="blue">
                            <Text size="xs">
                                <strong>Obrigações CLT:</strong> CTPS digital (eSocial), exame admissional (NR-7),
                                registro no eSocial até véspera da admissão, vale transporte (6% desconto).
                            </Text>
                        </Alert>
                    )}
                    {newHire.contractType === 'intern' && (
                        <Alert variant="light" color="green">
                            <Text size="xs">
                                <strong>Lei 11.788/08:</strong> Máx 6h/dia, 30h/semana. Obrigatório seguro de acidentes pessoais.
                                Contrato máx 2 anos. Supervisor obrigatório. Recesso de 30 dias a cada 12 meses.
                            </Text>
                        </Alert>
                    )}

                    <Button onClick={handleHire} loading={hiring} fullWidth>
                        Registrar Admissão
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
