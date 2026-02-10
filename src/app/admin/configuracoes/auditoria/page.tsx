'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, TextInput,
    Paper,
} from '@mantine/core';
import {
    IconAlertCircle, IconShieldCheck, IconBell, IconEye,
    IconSearch, IconClock, IconUser, IconFilter,
} from '@tabler/icons-react';

interface NotificationEntry {
    id: string;
    title: string;
    message: string;
    category: string;
    priority: string;
    source_type?: string;
    source_id?: string;
    action_label?: string;
    action_url?: string;
    is_read: number;
    created_at: number;
    recipient_id: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    general: 'gray', enrollment: 'blue', contract: 'violet', payment: 'green',
    academic: 'teal', system: 'grape', security: 'red', communication: 'orange',
};
const PRIORITY_COLORS: Record<string, string> = { low: 'gray', normal: 'blue', high: 'orange', urgent: 'red' };

export default function AuditoriaPage() {
    const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (categoryFilter) params.set('category', categoryFilter);
            const res = await fetch(`/api/notifications?${params}`);
            if (!res.ok) throw new Error('Falha ao buscar auditoria');
            const data = await res.json();
            setNotifications(data.data || []);
        } catch (err) {
            setError('Falha ao carregar trilha de auditoria');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const searchLower = search.toLowerCase();
    const filtered = useMemo(() => {
        if (!searchLower) return notifications;
        return notifications.filter(n =>
            n.title.toLowerCase().includes(searchLower) ||
            n.message.toLowerCase().includes(searchLower) ||
            (n.source_type && n.source_type.toLowerCase().includes(searchLower))
        );
    }, [notifications, searchLower]);

    const stats = useMemo(() => {
        const total = notifications.length;
        const unread = notifications.filter(n => !n.is_read).length;
        const byCategory = new Map<string, number>();
        notifications.forEach(n => {
            byCategory.set(n.category, (byCategory.get(n.category) || 0) + 1);
        });
        const categories = Array.from(byCategory.entries())
            .map(([cat, count]) => ({ cat, count }))
            .sort((a, b) => b.count - a.count);

        const highPriority = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;

        return { total, unread, categories, highPriority };
    }, [notifications]);

    const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando auditoria...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Configurações</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Auditoria</Text>
                    </Group>
                    <Title order={1}>Trilha de Auditoria</Title>
                    <Text c="dimmed" mt="xs">Log de notificações, ações e eventos do sistema.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Eventos</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconShieldCheck size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Não Lidos</Text>
                                <Text size="xl" fw={700}>{stats.unread}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconBell size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Categorias</Text>
                                <Text size="xl" fw={700}>{stats.categories.length}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconFilter size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Alta Prioridade</Text>
                                <Text size="xl" fw={700} c={stats.highPriority > 0 ? 'red' : undefined}>{stats.highPriority}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="red">
                                <IconEye size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Category breakdown */}
                {stats.categories.length > 0 && (
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Eventos por Categoria</Text>
                        <Group gap="md">
                            {stats.categories.map(c => (
                                <Badge key={c.cat} size="lg" variant="light" color={CATEGORY_COLORS[c.cat] || 'gray'}>
                                    {c.cat}: {c.count}
                                </Badge>
                            ))}
                        </Group>
                    </Card>
                )}

                {/* Search + Filter */}
                <Group>
                    <TextInput
                        leftSection={<IconSearch size={16} />}
                        placeholder="Buscar eventos..."
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Categoria"
                        clearable
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        data={[
                            { value: 'general', label: 'Geral' },
                            { value: 'enrollment', label: 'Matrículas' },
                            { value: 'payment', label: 'Pagamentos' },
                            { value: 'contract', label: 'Contratos' },
                            { value: 'academic', label: 'Acadêmico' },
                            { value: 'security', label: 'Segurança' },
                            { value: 'system', label: 'Sistema' },
                        ]}
                        w={180}
                    />
                </Group>

                {/* Audit Log Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Log de Eventos</Text>
                        <Badge variant="light">{filtered.length} eventos</Badge>
                    </Group>
                    {filtered.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconShieldCheck size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhum evento</Title>
                            <Text c="dimmed">A trilha de auditoria está vazia ou não há resultados para o filtro aplicado.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th w={160}>Data/Hora</Table.Th>
                                    <Table.Th>Evento</Table.Th>
                                    <Table.Th>Categoria</Table.Th>
                                    <Table.Th>Prioridade</Table.Th>
                                    <Table.Th>Origem</Table.Th>
                                    <Table.Th ta="center">Lido</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.slice(0, 50).map(n => (
                                    <Table.Tr key={n.id} style={{ opacity: n.is_read ? 0.7 : 1 }}>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconClock size={14} color="gray" />
                                                <Text size="sm">{fmtDate(n.created_at)}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={n.is_read ? 400 : 600}>{n.title}</Text>
                                            <Text size="xs" c="dimmed" lineClamp={1}>{n.message}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="light" color={CATEGORY_COLORS[n.category] || 'gray'}>
                                                {n.category}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="dot" color={PRIORITY_COLORS[n.priority] || 'gray'}>
                                                {n.priority}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {n.source_type ? (
                                                <Group gap={4}>
                                                    <IconUser size={14} color="gray" />
                                                    <Text size="sm" c="dimmed">{n.source_type}</Text>
                                                </Group>
                                            ) : <Text size="sm" c="dimmed">—</Text>}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light" color={n.is_read ? 'green' : 'yellow'}>
                                                {n.is_read ? 'Sim' : 'Não'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
