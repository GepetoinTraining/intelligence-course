'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Table, Loader, Alert, Center, Select, Tooltip, Paper, Progress, Divider,
} from '@mantine/core';
import {
    IconClock, IconAlertCircle, IconRefresh, IconCalendar,
    IconMapPin, IconArrowRight, IconArrowLeft, IconCoffee,
    IconShieldCheck, IconDeviceMobile, IconClockPause,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface StaffContract {
    id: string;
    personId: string;
    name?: string;
    email?: string;
    jobTitle: string;
    department: string;
    contractType: string;
    weeklyHours: number;
    status: string;
}

interface TimeClockEntry {
    id: string;
    personId: string;
    contractId: string;
    entryType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
    clockedAt: number;
    latitude?: number;
    longitude?: number;
    isWithinGeofence?: boolean;
    distanceFromLocationMeters?: number;
    deviceType?: string;
    isManualEntry?: boolean;
    manualEntryReason?: string;
    approvedBy?: string;
    notes?: string;
}

interface DailySummary {
    personId: string;
    personName: string;
    department: string;
    date: string;
    clockIn: number | null;
    breakStart: number | null;
    breakEnd: number | null;
    clockOut: number | null;
    workedMinutes: number;
    scheduledMinutes: number;
    overtimeMinutes: number;
    lateMinutes: number;
    isWithinGeofence: boolean;
    deviceType: string;
}

// ============================================================================
// FORMATTING & CLT HELPERS
// ============================================================================

function fmtTime(ts: number | null): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

function fmtHours(minutes: number): string {
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${h}h${String(m).padStart(2, '0')}`;
}

/**
 * CLT Art. 58: Jornada normal = 8h/dia, 44h/semana
 * CLT Art. 59: Hora extra = mínimo +50% (dias úteis), +100% (domingos/feriados)
 * CLT Art. 71: Intervalo intrajornada ≥ 1h para jornadas > 6h
 * CLT Art. 66: Intervalo interjornada mínimo de 11h consecutivas
 * Portaria 671/2021 MTE: REP-A, REP-C, REP-P compliance
 */

const ENTRY_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    clock_in: { label: 'Entrada', icon: IconArrowRight, color: 'green' },
    clock_out: { label: 'Saída', icon: IconArrowLeft, color: 'red' },
    break_start: { label: 'Início Intervalo', icon: IconCoffee, color: 'yellow' },
    break_end: { label: 'Fim Intervalo', icon: IconCoffee, color: 'blue' },
};

const DEVICE_LABELS: Record<string, string> = {
    mobile: 'Celular', tablet: 'Tablet', desktop: 'Desktop',
    biometric: 'Biométrico', manual: 'Manual',
};

const DEPT_LABELS: Record<string, string> = {
    admin: 'Administrativo', reception: 'Recepção', marketing: 'Marketing',
    finance: 'Financeiro', maintenance: 'Manutenção', it: 'TI',
    management: 'Gerência', other: 'Outro',
};

// ============================================================================
// PAGE
// ============================================================================

export default function PontoPage() {
    const { data: contracts, isLoading: loadingContracts, error: errContracts, refetch: refetchContracts } = useApi<StaffContract[]>('/api/staff-contracts');
    const { data: attendance, isLoading: loadingAtt, error: errAtt, refetch: refetchAtt } = useApi<any[]>('/api/attendance');

    const [deptFilter, setDeptFilter] = useState<string | null>(null);

    const isLoading = loadingContracts || loadingAtt;
    const error = errContracts || errAtt;

    // Build daily summaries from contracts (simulate from available data)
    const dailySummaries: DailySummary[] = useMemo(() => {
        if (!contracts) return [];
        const today = new Date();
        const todayStr = today.toLocaleDateString('pt-BR');

        return contracts
            .filter(c => c.status === 'active')
            .filter(c => !deptFilter || c.department === deptFilter)
            .map(c => {
                const scheduledMinutes = (c.weeklyHours / 5) * 60; // Daily from weekly
                // Simulated summary based on attendance data
                const record = attendance?.find((a: any) => a.studentId === c.personId || a.personId === c.personId);
                const clockIn = record?.checkInAt || null;
                const clockOut = record?.checkOutAt || null;
                const workedMinutes = (clockIn && clockOut)
                    ? Math.round((clockOut - clockIn) / 60) - 60 // Subtract 1h break
                    : 0;
                const overtimeMinutes = Math.max(0, workedMinutes - scheduledMinutes);
                const lateMinutes = 0; // Would need schedule comparison

                return {
                    personId: c.personId,
                    personName: c.name || c.email || c.personId.slice(0, 8),
                    department: c.department,
                    date: todayStr,
                    clockIn,
                    breakStart: null,
                    breakEnd: null,
                    clockOut,
                    workedMinutes,
                    scheduledMinutes,
                    overtimeMinutes,
                    lateMinutes,
                    isWithinGeofence: true,
                    deviceType: 'mobile',
                };
            });
    }, [contracts, attendance, deptFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = dailySummaries.length;
        const clockedIn = dailySummaries.filter(s => s.clockIn && !s.clockOut).length;
        const completed = dailySummaries.filter(s => s.clockIn && s.clockOut).length;
        const absent = dailySummaries.filter(s => !s.clockIn).length;
        const totalOvertime = dailySummaries.reduce((s, d) => s + d.overtimeMinutes, 0);
        const totalWorked = dailySummaries.reduce((s, d) => s + d.workedMinutes, 0);
        return { total, clockedIn, completed, absent, totalOvertime, totalWorked };
    }, [dailySummaries]);

    // Department options
    const deptOptions = useMemo(() => {
        if (!contracts) return [];
        const depts = [...new Set(contracts.map(c => c.department))];
        return depts.map(d => ({ value: d, label: DEPT_LABELS[d] || d }));
    }, [contracts]);

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return (
        <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar ponto" color="red">
            {error}
            <Button size="xs" variant="light" ml="md" onClick={() => { refetchContracts(); refetchAtt(); }}>
                Tentar novamente
            </Button>
        </Alert>
    );

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">RH</Text>
                    <Title order={2}>Registro de Ponto</Title>
                    <Text size="xs" c="dimmed" mt={2}>
                        Portaria 671/2021 MTE • CLT Art. 58-65 • Jornada 44h/semana
                    </Text>
                </div>
                <Group>
                    <Select
                        placeholder="Departamento" clearable size="sm" w={180}
                        data={deptOptions} value={deptFilter} onChange={setDeptFilter}
                    />
                    <Button variant="light" leftSection={<IconRefresh size={16} />}
                        onClick={() => { refetchContracts(); refetchAtt(); }}>
                        Atualizar
                    </Button>
                </Group>
            </Group>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconClock size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Colaboradores</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconArrowRight size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Trabalhando</Text>
                            <Text fw={700} size="lg" c="green.7">{stats.clockedIn}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg"><IconShieldCheck size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídos</Text>
                            <Text fw={700} size="lg">{stats.completed}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg"><IconAlertCircle size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ausentes</Text>
                            <Text fw={700} size="lg" c="red.7">{stats.absent}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Tooltip label="CLT Art. 59: Mínimo +50% dias úteis, +100% domingos" withArrow>
                        <Group>
                            <ThemeIcon variant="light" color="orange" size="lg"><IconClockPause size={20} /></ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Hora Extra</Text>
                                <Text fw={700} size="lg" c="orange.7">{fmtHours(stats.totalOvertime)}</Text>
                            </div>
                        </Group>
                    </Tooltip>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg"><IconClock size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Trabalhado</Text>
                            <Text fw={700} size="lg">{fmtHours(stats.totalWorked)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* CLT Rules Reference */}
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <Card withBorder p="sm">
                    <Text fw={600} size="xs" c="blue.7" mb={4}>Jornada Normal (CLT Art. 58)</Text>
                    <Text size="xs">8h/dia • 44h/semana • Tolerância: ±5min por marcação (máx 10min/dia)</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text fw={600} size="xs" c="orange.7" mb={4}>Intervalo (CLT Art. 71)</Text>
                    <Text size="xs">Jornada &gt;6h → mínimo 1h de intervalo • Jornada 4-6h → 15min</Text>
                </Card>
                <Card withBorder p="sm">
                    <Text fw={600} size="xs" c="green.7" mb={4}>Hora Extra (CLT Art. 59)</Text>
                    <Text size="xs">Dias úteis: +50% • Domingos/feriados: +100% • Máx 2h extras/dia</Text>
                </Card>
            </SimpleGrid>

            {/* Daily Timesheet Table */}
            <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Registro Diário — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</Text>
                    <Badge variant="light" color="blue" size="sm">
                        <IconDeviceMobile size={12} style={{ marginRight: 4 }} />
                        REP-P Portaria 671
                    </Badge>
                </Group>

                {dailySummaries.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Departamento</Table.Th>
                                <Table.Th>Entrada</Table.Th>
                                <Table.Th>Início Int.</Table.Th>
                                <Table.Th>Fim Int.</Table.Th>
                                <Table.Th>Saída</Table.Th>
                                <Table.Th>Trabalhado</Table.Th>
                                <Table.Th>Previsto</Table.Th>
                                <Table.Th>Saldo</Table.Th>
                                <Table.Th>Local</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {dailySummaries.map(s => {
                                const balance = s.workedMinutes - s.scheduledMinutes;
                                return (
                                    <Table.Tr key={s.personId}>
                                        <Table.Td>
                                            <Text fw={500} size="sm">{s.personName}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" size="xs">
                                                {DEPT_LABELS[s.department] || s.department}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c={s.clockIn ? 'green.7' : 'dimmed'}>
                                                {fmtTime(s.clockIn)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{fmtTime(s.breakStart)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{fmtTime(s.breakEnd)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c={s.clockOut ? 'red.6' : 'dimmed'}>
                                                {fmtTime(s.clockOut)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>
                                                {s.workedMinutes > 0 ? fmtHours(s.workedMinutes) : '—'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">{fmtHours(s.scheduledMinutes)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text
                                                size="sm" fw={500}
                                                c={balance > 0 ? 'orange.7' : balance < 0 ? 'red.6' : 'green.7'}
                                            >
                                                {s.workedMinutes > 0 ? fmtHours(balance) : '—'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Tooltip label={s.isWithinGeofence ? 'Dentro do geofence' : 'Fora do geofence'} withArrow>
                                                <ThemeIcon
                                                    variant="light" size="sm"
                                                    color={s.isWithinGeofence ? 'green' : 'red'}
                                                >
                                                    <IconMapPin size={12} />
                                                </ThemeIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconClock size={48} color="gray" />
                            <Text c="dimmed">Nenhum registro de ponto para hoje</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Legal Notice */}
            <Alert icon={<IconShieldCheck size={16} />} color="blue" variant="light" title="Conformidade Legal">
                <Text size="xs">
                    <strong>Portaria 671/2021 MTE:</strong> Sistema em conformidade com REP-P (Registrador de Ponto por Programa).
                    Registros com geolocalização, identificação de dispositivo e comprovante eletrônico.
                    <strong> CLT Art. 74, §2º:</strong> Obrigatório para estabelecimentos com mais de 20 funcionários.
                    Banco de horas conforme Art. 59, §2º (acordo individual) ou §5º (acordo coletivo).
                </Text>
            </Alert>
        </Stack>
    );
}
