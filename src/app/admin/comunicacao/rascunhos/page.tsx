'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Paper, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, TextInput, Button,
} from '@mantine/core';
import {
    IconNote, IconAlertCircle, IconSearch, IconPencil,
    IconMessage, IconSend, IconClock,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

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
    isArchived?: boolean;
}

export default function RascunhosPage() {
    const { data: apiData, isLoading: loading, error } = useApi<{ conversations: Conversation[] }>('/api/communicator/conversations?limit=100');
    const allConversations = apiData?.conversations || (Array.isArray(apiData) ? apiData : []);
    const conversations = useMemo(() => allConversations.filter((c: Conversation) => c.messageCount === 0 || c.isArchived), [allConversations]);
    const [search, setSearch] = useState('');

    const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';

    const filtered = useMemo(() => {
        if (!search.trim()) return conversations;
        const q = search.toLowerCase();
        return conversations.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q)
        );
    }, [conversations, search]);

    const stats = useMemo(() => {
        const empty = conversations.filter(c => c.messageCount === 0);
        const archived = conversations.filter(c => c.isArchived);
        return {
            total: conversations.length,
            empty: empty.length,
            archived: archived.length,
        };
    }, [conversations]);

    const TYPE_LABELS: Record<string, string> = {
        direct: 'Direto',
        group: 'Grupo',
        broadcast: 'Broadcast',
        ai_assistant: 'IA',
        meeting: 'Reunião',
        problem_resolution: 'Problema',
    };

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando rascunhos...</Text></Group>
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
                        <Text size="sm" fw={500}>Rascunhos</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Rascunhos</Title>
                    </Group>
                    <Text c="dimmed" mt="xs">Mensagens em rascunho aguardando finalização e envio.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>
                )}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Rascunhos</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="yellow">
                                <IconNote size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Sem Msgs</Text>
                                <Text size="xl" fw={700}>{stats.empty}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="gray">
                                <IconPencil size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Arquivados</Text>
                                <Text size="xl" fw={700}>{stats.archived}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconClock size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Search */}
                <TextInput
                    placeholder="Buscar rascunhos..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                />

                {/* Drafts Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Conversas em Rascunho</Text>
                        <Badge variant="light" color="yellow">{filtered.length} itens</Badge>
                    </Group>
                    {filtered.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconNote size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhum rascunho</Title>
                            <Text c="dimmed" maw={400} mx="auto">
                                Todos os rascunhos foram finalizados ou não há conversas pendentes.
                            </Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Tipo</Table.Th>
                                    <Table.Th>Conversa</Table.Th>
                                    <Table.Th ta="center">Participantes</Table.Th>
                                    <Table.Th>Criada em</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                    <Table.Th ta="center">Ação</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.slice(0, 50).map(conv => (
                                    <Table.Tr key={conv.id}>
                                        <Table.Td>
                                            <Badge size="sm" variant="light">
                                                {TYPE_LABELS[conv.type] || conv.type}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{conv.name || 'Sem título'}</Text>
                                            {conv.description && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>{conv.description}</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Text size="sm">{conv.participantCount || 0}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{fmtDate(conv.createdAt)}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light" color={conv.isArchived ? 'orange' : 'yellow'}>
                                                {conv.isArchived ? 'Arquivado' : 'Rascunho'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Button size="xs" variant="light" leftSection={<IconSend size={12} />}>
                                                Continuar
                                            </Button>
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
