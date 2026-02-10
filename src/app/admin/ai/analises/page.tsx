'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Paper,
} from '@mantine/core';
import {
    IconAlertCircle, IconBrain, IconAlertTriangle, IconShieldCheck,
    IconEye, IconUser, IconClock,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface SafetyAlert {
    id: string;
    studentId: string;
    sessionId?: string;
    level: 'green' | 'yellow' | 'orange' | 'red';
    category?: string;
    description?: string;
    detectedAt: number;
    acknowledgedAt?: number;
    resolvedAt?: number;
    acknowledgedBy?: string;
}

interface AlertSummary {
    green: number;
    yellow: number;
    orange: number;
    red: number;
    unacknowledged: number;
    unresolved: number;
}

const LEVEL_COLORS: Record<string, string> = { green: 'green', yellow: 'yellow', orange: 'orange', red: 'red' };
const LEVEL_LABELS: Record<string, string> = { green: 'Normal', yellow: 'Atenção', orange: 'Alerta', red: 'Crítico' };

export default function AnalisesPage() {
    const { data: alertsData, isLoading: loading } = useApi<any>('/api/auditor/alerts?limit=50');
    const alerts: SafetyAlert[] = alertsData?.data || [];
    const summary: AlertSummary | null = alertsData?.summary || null;
    const error: string | null = null;
    const [levelFilter, setLevelFilter] = useState<string | null>(null);

    const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });

    if (loading) {
        return <Container size="xl" py="xl"><Group justify="center" py={60}><Loader size="lg" /><Text>Carregando análises IA...</Text></Group></Container>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Inteligência Artificial</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Análises</Text></Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Análises de IA</Title>
                        <Select size="sm" placeholder="Nível" clearable value={levelFilter} onChange={setLevelFilter} w={160}
                            data={[{ value: 'green', label: '🟢 Normal' }, { value: 'yellow', label: '🟡 Atenção' }, { value: 'orange', label: '🟠 Alerta' }, { value: 'red', label: '🔴 Crítico' }]} />
                    </Group>
                    <Text c="dimmed" mt="xs">Monitoramento de alertas de segurança e análise de padrões das sessões de chat.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Alertas</Text><Text size="xl" fw={700}>{alerts.length}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue"><IconBrain size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Não Reconhecidos</Text><Text size="xl" fw={700} c={summary?.unacknowledged ? 'orange' : undefined}>{summary?.unacknowledged ?? 0}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange"><IconEye size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Não Resolvidos</Text><Text size="xl" fw={700} c={summary?.unresolved ? 'red' : undefined}>{summary?.unresolved ?? 0}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="red"><IconAlertTriangle size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Críticos</Text><Text size="xl" fw={700} c={summary?.red ? 'red' : undefined}>{summary?.red ?? 0}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="grape"><IconShieldCheck size={24} /></ThemeIcon></Group>
                    </Card>
                </SimpleGrid>

                {/* Level Summary */}
                {summary && (
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Distribuição por Nível</Text>
                        <Group gap="lg">
                            {(['green', 'yellow', 'orange', 'red'] as const).map(lvl => (
                                <Badge key={lvl} size="xl" variant="light" color={LEVEL_COLORS[lvl]}>
                                    {LEVEL_LABELS[lvl]}: {summary[lvl]}
                                </Badge>
                            ))}
                        </Group>
                    </Card>
                )}

                {/* Alerts Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md"><Text fw={600}>Alertas de Segurança</Text><Badge variant="light">{alerts.length} alertas</Badge></Group>
                    {alerts.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="green" mx="auto" mb="md"><IconShieldCheck size={32} /></ThemeIcon>
                            <Title order={3} mb="xs">Nenhum alerta</Title>
                            <Text c="dimmed">O sistema de monitoramento de IA não detectou alertas para o período.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr>
                                <Table.Th w={140}>Data/Hora</Table.Th><Table.Th>Nível</Table.Th><Table.Th>Descrição</Table.Th><Table.Th>Aluno</Table.Th><Table.Th ta="center">Status</Table.Th>
                            </Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {alerts.map(a => (
                                    <Table.Tr key={a.id}>
                                        <Table.Td><Group gap={4}><IconClock size={14} color="gray" /><Text size="sm">{fmtDate(a.detectedAt)}</Text></Group></Table.Td>
                                        <Table.Td><Badge size="sm" variant="filled" color={LEVEL_COLORS[a.level]}>{LEVEL_LABELS[a.level]}</Badge></Table.Td>
                                        <Table.Td><Text size="sm" lineClamp={2}>{a.description || a.category || 'Alerta detectado'}</Text></Table.Td>
                                        <Table.Td><Group gap={4}><IconUser size={14} color="gray" /><Text size="sm" c="dimmed">{a.studentId?.slice(0, 8)}...</Text></Group></Table.Td>
                                        <Table.Td ta="center">
                                            {a.resolvedAt ? <Badge size="sm" variant="light" color="green">Resolvido</Badge>
                                                : a.acknowledgedAt ? <Badge size="sm" variant="light" color="blue">Reconhecido</Badge>
                                                    : <Badge size="sm" variant="light" color="orange">Pendente</Badge>}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>

                {/* Privacy Note */}
                <Paper withBorder p="lg" radius="md">
                    <Group gap="md">
                        <ThemeIcon size={40} radius="md" variant="light" color="blue"><IconShieldCheck size={20} /></ThemeIcon>
                        <div><Text fw={600}>Nota de Privacidade</Text>
                            <Text size="sm" c="dimmed">As análises são baseadas exclusivamente em metadados das sessões (frequência, duração, padrões). O conteúdo das conversas é criptografado e nunca acessado.</Text></div>
                    </Group>
                </Paper>
            </Stack>
        </Container>
    );
}
