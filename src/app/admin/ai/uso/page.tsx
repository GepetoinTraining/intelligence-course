'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Paper, Progress,
} from '@mantine/core';
import {
    IconAlertCircle, IconChartBar, IconMessage, IconClock,
    IconUsers, IconBrain, IconCoin,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface ChatSession {
    id: string;
    startedAt: number;
    endedAt?: number;
    messageCount: number;
    metadata?: string;
}

export default function UsoPage() {
    const { data: sessionsData, isLoading: loading } = useApi<ChatSession[]>('/api/chat/sessions?limit=100');
    const sessions = sessionsData || [];
    const error: string | null = null;

    const stats = useMemo(() => {
        const totalSessions = sessions.length;
        const totalMessages = sessions.reduce((s, sess) => s + (sess.messageCount || 0), 0);
        const totalTokens = sessions.reduce((s, sess) => {
            try { const m = sess.metadata ? JSON.parse(sess.metadata) : {}; return s + (m.tokens || 0); } catch { return s; }
        }, 0);
        const avgMessages = totalSessions > 0 ? Math.round(totalMessages / totalSessions * 10) / 10 : 0;
        const activeSessions = sessions.filter(s => !s.endedAt).length;

        // Sessions by day (last 7)
        const byDay = new Map<string, number>();
        sessions.forEach(s => {
            const d = new Date(s.startedAt * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            byDay.set(d, (byDay.get(d) || 0) + 1);
        });
        const dailyUsage = Array.from(byDay.entries()).slice(-7).map(([day, count]) => ({ day, count }));

        // Cost estimate (very rough: $0.003 per 1K tokens for Claude Haiku)
        const estimatedCost = (totalTokens / 1000) * 0.003;

        return { totalSessions, totalMessages, totalTokens, avgMessages, activeSessions, dailyUsage, estimatedCost };
    }, [sessions]);

    const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });

    if (loading) {
        return <Container size="xl" py="xl"><Group justify="center" py={60}><Loader size="lg" /><Text>Carregando uso de IA...</Text></Group></Container>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Inteligência Artificial</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Uso & Custos</Text></Group>
                    <Title order={1}>Uso de IA & Custos</Title>
                    <Text c="dimmed" mt="xs">Dashboard de utilização da IA, sessões de chat e estimativa de custos.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Sessões</Text><Text size="xl" fw={700}>{stats.totalSessions}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue"><IconUsers size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Mensagens</Text><Text size="xl" fw={700}>{stats.totalMessages.toLocaleString('pt-BR')}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green"><IconMessage size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Tokens</Text><Text size="xl" fw={700}>{stats.totalTokens.toLocaleString('pt-BR')}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet"><IconBrain size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Custo Estimado</Text><Text size="xl" fw={700} c={stats.estimatedCost > 10 ? 'orange' : 'green'}>US$ {stats.estimatedCost.toFixed(2)}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange"><IconCoin size={24} /></ThemeIcon></Group>
                    </Card>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {/* Usage Metrics */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Métricas de Uso</Text>
                        <Stack gap="md">
                            <Group justify="space-between"><Text size="sm">Média msgs/sessão</Text><Text fw={600}>{stats.avgMessages}</Text></Group>
                            <Group justify="space-between"><Text size="sm">Sessões ativas</Text><Badge variant="light" color={stats.activeSessions > 0 ? 'green' : 'gray'}>{stats.activeSessions}</Badge></Group>
                            <Group justify="space-between"><Text size="sm">Custo por sessão</Text><Text fw={600}>US$ {stats.totalSessions > 0 ? (stats.estimatedCost / stats.totalSessions).toFixed(4) : '0.00'}</Text></Group>
                            <Group justify="space-between"><Text size="sm">Custo por mensagem</Text><Text fw={600}>US$ {stats.totalMessages > 0 ? (stats.estimatedCost / stats.totalMessages).toFixed(4) : '0.00'}</Text></Group>
                        </Stack>
                    </Card>

                    {/* Daily Usage */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Sessões por Dia (Recentes)</Text>
                        {stats.dailyUsage.length === 0 ? (
                            <Text c="dimmed" ta="center">Nenhum dado de uso disponível.</Text>
                        ) : (
                            <Stack gap="sm">
                                {stats.dailyUsage.map(d => {
                                    const maxCount = Math.max(...stats.dailyUsage.map(x => x.count), 1);
                                    return (
                                        <div key={d.day}>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm">{d.day}</Text>
                                                <Text size="sm" fw={600}>{d.count} sessão(ões)</Text>
                                            </Group>
                                            <Progress value={(d.count / maxCount) * 100} color="blue" size="md" radius="md" />
                                        </div>
                                    );
                                })}
                            </Stack>
                        )}
                    </Card>
                </SimpleGrid>

                {/* Sessions Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md"><Text fw={600}>Sessões Recentes</Text><Badge variant="light">{sessions.length} sessões</Badge></Group>
                    {sessions.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md"><IconBrain size={32} /></ThemeIcon>
                            <Title order={3} mb="xs">Sem sessões</Title>
                            <Text c="dimmed">Nenhuma sessão de IA registrada ainda.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr><Table.Th>Início</Table.Th><Table.Th>Duração</Table.Th><Table.Th>Mensagens</Table.Th><Table.Th>Tokens</Table.Th><Table.Th ta="center">Status</Table.Th></Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {sessions.slice(0, 20).map(s => {
                                    const tokens = (() => { try { return JSON.parse(s.metadata || '{}').tokens || 0; } catch { return 0; } })();
                                    const duration = s.endedAt ? Math.round((s.endedAt - s.startedAt) / 60) : null;
                                    return (
                                        <Table.Tr key={s.id}>
                                            <Table.Td><Group gap={4}><IconClock size={14} color="gray" /><Text size="sm">{fmtDate(s.startedAt)}</Text></Group></Table.Td>
                                            <Table.Td><Text size="sm">{duration !== null ? `${duration} min` : '—'}</Text></Table.Td>
                                            <Table.Td><Text size="sm" fw={500}>{s.messageCount}</Text></Table.Td>
                                            <Table.Td><Text size="sm" c="dimmed">{tokens.toLocaleString('pt-BR')}</Text></Table.Td>
                                            <Table.Td ta="center"><Badge size="sm" variant="light" color={s.endedAt ? 'gray' : 'green'}>{s.endedAt ? 'Encerrada' : 'Ativa'}</Badge></Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
