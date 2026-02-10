'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, TextInput, Select,
} from '@mantine/core';
import {
    IconSend, IconAlertCircle, IconSearch, IconMail,
    IconBrandWhatsapp, IconMessage, IconCheck, IconClock,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface Conversation {
    id: string;
    type: string;
    name?: string;
    description?: string;
    messageCount: number;
    lastMessageAt?: number;
    createdAt?: number;
    participants?: Array<{ id: string; name: string; role: string }>;
    participantCount?: number;
    lastMessage?: { content: string; senderName: string; createdAt: number };
    broadcastScope?: string;
    isPinned?: boolean;
    isArchived?: boolean;
}

const CHANNEL_ICONS: Record<string, { icon: any; color: string; label: string }> = {
    direct: { icon: IconMessage, color: 'blue', label: 'Direto' },
    group: { icon: IconMessage, color: 'grape', label: 'Grupo' },
    broadcast: { icon: IconSend, color: 'orange', label: 'Broadcast' },
    ai_assistant: { icon: IconMessage, color: 'violet', label: 'IA' },
    meeting: { icon: IconMessage, color: 'teal', label: 'Reunião' },
    problem_resolution: { icon: IconAlertTriangle, color: 'red', label: 'Problema' },
};

export default function EnviadosPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (typeFilter) params.set('type', typeFilter);

            const res = await fetch(`/api/communicator/conversations?${params}`);
            if (!res.ok) throw new Error('Falha ao buscar mensagens');

            const data = await res.json();
            // Filter to conversations with messages (sent)
            const withMessages = (data.conversations || []).filter((c: Conversation) => c.messageCount > 0);
            setConversations(withMessages);
        } catch (err) {
            setError('Falha ao carregar mensagens enviadas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [typeFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';

    const filtered = useMemo(() => {
        if (!search.trim()) return conversations;
        const q = search.toLowerCase();
        return conversations.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.lastMessage?.content || '').toLowerCase().includes(q) ||
            (c.lastMessage?.senderName || '').toLowerCase().includes(q)
        );
    }, [conversations, search]);

    const stats = useMemo(() => {
        const totalMessages = conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0);
        const broadcasts = conversations.filter(c => c.type === 'broadcast');
        const direct = conversations.filter(c => c.type === 'direct');
        const groups = conversations.filter(c => c.type === 'group');
        return { totalMessages, broadcasts: broadcasts.length, direct: direct.length, groups: groups.length };
    }, [conversations]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando mensagens enviadas...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Comunicação</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Enviados</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Mensagens Enviadas</Title>
                        <ExportButton data={filtered} organizationName="NodeZero" />
                    </Group>
                    <Text c="dimmed" mt="xs">Histórico de mensagens enviadas e suas conversas ativas.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>
                )}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Conversas</Text>
                                <Text size="xl" fw={700}>{conversations.length}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconMessage size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Msgs Enviadas</Text>
                                <Text size="xl" fw={700}>{stats.totalMessages}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconSend size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Broadcasts</Text>
                                <Text size="xl" fw={700}>{stats.broadcasts}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconMail size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Diretas</Text>
                                <Text size="xl" fw={700}>{stats.direct}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="teal">
                                <IconCheck size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Filters */}
                <Group>
                    <TextInput
                        placeholder="Buscar por nome, conteúdo ou remetente..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Tipo"
                        clearable
                        value={typeFilter}
                        onChange={setTypeFilter}
                        data={[
                            { value: 'direct', label: 'Direto' },
                            { value: 'group', label: 'Grupo' },
                            { value: 'broadcast', label: 'Broadcast' },
                            { value: 'ai_assistant', label: 'IA' },
                        ]}
                        w={160}
                    />
                </Group>

                {/* Conversations Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Conversas com Mensagens</Text>
                        <Badge variant="light">{filtered.length} conversas</Badge>
                    </Group>
                    {filtered.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhuma mensagem enviada encontrada.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Canal</Table.Th>
                                    <Table.Th>Conversa</Table.Th>
                                    <Table.Th>Última Mensagem</Table.Th>
                                    <Table.Th ta="center">Msgs</Table.Th>
                                    <Table.Th>Data</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.slice(0, 50).map(conv => {
                                    const channel = CHANNEL_ICONS[conv.type] || CHANNEL_ICONS.direct;
                                    const ChannelIcon = channel.icon;
                                    return (
                                        <Table.Tr key={conv.id}>
                                            <Table.Td>
                                                <Badge size="sm" variant="light" color={channel.color}
                                                    leftSection={<ChannelIcon size={12} />}
                                                >
                                                    {channel.label}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{conv.name || 'Conversa Direta'}</Text>
                                                {conv.participantCount && (
                                                    <Text size="xs" c="dimmed">{conv.participantCount} participantes</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                {conv.lastMessage ? (
                                                    <div>
                                                        <Text size="xs" c="dimmed">{conv.lastMessage.senderName}</Text>
                                                        <Text size="sm" lineClamp={1}>{conv.lastMessage.content}</Text>
                                                    </div>
                                                ) : (
                                                    <Text size="sm" c="dimmed">—</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Badge size="sm" variant="light">{conv.messageCount}</Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{fmtDate(conv.lastMessageAt)}</Text>
                                            </Table.Td>
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
