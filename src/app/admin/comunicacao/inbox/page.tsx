'use client';

import { useState, useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Tabs, TextInput, ActionIcon, Avatar, Loader, Center,
    Alert, Modal, Textarea, Select, Tooltip,
} from '@mantine/core';
import {
    IconInbox, IconSend, IconSearch, IconPencil, IconStar, IconMail,
    IconMailOpened, IconPaperclip, IconAlertCircle, IconMessage,
    IconBrandWhatsapp, IconHash, IconUsers,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Participant {
    id: string;
    name: string;
    role: string;
}

interface LastMessage {
    content: string;
    senderName: string;
    createdAt: number;
}

interface Conversation {
    id: string;
    type: 'direct' | 'ai_assistant' | 'broadcast' | 'group' | 'meeting' | 'problem_resolution' | 'support';
    name?: string;
    description?: string;
    messageCount: number;
    lastMessageAt?: number;
    createdAt?: number;
    participants?: Participant[];
    participantCount?: number;
    lastMessage?: LastMessage;
    broadcastScope?: string;
    isPinned?: boolean;
    isArchived?: boolean;
    channel?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const CHANNEL_CONFIG: Record<string, { icon: typeof IconMessage; color: string; label: string }> = {
    direct: { icon: IconMessage, color: 'blue', label: 'Direto' },
    group: { icon: IconUsers, color: 'grape', label: 'Grupo' },
    broadcast: { icon: IconSend, color: 'orange', label: 'Comunicado' },
    ai_assistant: { icon: IconMessage, color: 'violet', label: 'IA' },
    meeting: { icon: IconMessage, color: 'teal', label: 'Reunião' },
    problem_resolution: { icon: IconAlertCircle, color: 'red', label: 'Problema' },
    support: { icon: IconMessage, color: 'cyan', label: 'Suporte' },
};

function fmtRelativeTime(ts?: number): string {
    if (!ts) return '';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - ts;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(ts * 1000).toLocaleDateString('pt-BR');
}

function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// ============================================================================
// PAGE
// ============================================================================

export default function InboxPage() {
    const { data: conversations, isLoading, error, refetch } = useApi<Conversation[]>('/api/communicator/conversations');

    const [search, setSearch] = useState('');
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeType, setComposeType] = useState<string>('direct');
    const [composeRecipient, setComposeRecipient] = useState('');
    const [composeMessage, setComposeMessage] = useState('');

    const allConversations = conversations || [];

    // Search filter
    const filtered = useMemo(() => {
        if (!search.trim()) return allConversations;
        const q = search.toLowerCase();
        return allConversations.filter(c =>
            c.name?.toLowerCase().includes(q) ||
            c.lastMessage?.content?.toLowerCase().includes(q) ||
            c.lastMessage?.senderName?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        );
    }, [allConversations, search]);

    // Stats
    const totalCount = allConversations.length;
    const directCount = allConversations.filter(c => c.type === 'direct').length;
    const groupCount = allConversations.filter(c => c.type === 'group' || c.type === 'broadcast').length;
    const recentCount = allConversations.filter(c => {
        if (!c.lastMessageAt) return false;
        const hourAgo = Math.floor(Date.now() / 1000) - 3600;
        return c.lastMessageAt > hourAgo;
    }).length;

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    // Render conversation card
    const renderConversation = (conv: Conversation) => {
        const cfg = CHANNEL_CONFIG[conv.type] || CHANNEL_CONFIG.direct;
        const ChannelIcon = cfg.icon;
        const displayName = conv.name ||
            conv.participants?.map(p => p.name).join(', ') ||
            `Conversa #${conv.id.substring(0, 6)}`;

        return (
            <Card key={conv.id} withBorder p="sm" style={{ cursor: 'pointer' }}>
                <Group justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <Avatar size={40} radius="xl" color={cfg.color}>
                            {conv.type === 'group' || conv.type === 'broadcast'
                                ? <ChannelIcon size={18} />
                                : getInitials(displayName)
                            }
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Group gap="xs" wrap="nowrap">
                                <Text fw={600} size="sm" lineClamp={1}>{displayName}</Text>
                                <Badge size="xs" variant="light" color={cfg.color}>{cfg.label}</Badge>
                                {conv.isPinned && (
                                    <Tooltip label="Fixada">
                                        <IconStar size={12} fill="currentColor" color="var(--mantine-color-yellow-6)" />
                                    </Tooltip>
                                )}
                            </Group>
                            {conv.lastMessage && (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                    <Text span fw={500} size="xs">{conv.lastMessage.senderName}: </Text>
                                    {conv.lastMessage.content}
                                </Text>
                            )}
                            {!conv.lastMessage && conv.description && (
                                <Text size="xs" c="dimmed" lineClamp={1}>{conv.description}</Text>
                            )}
                        </div>
                    </Group>
                    <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
                        <Text size="xs" c="dimmed">{fmtRelativeTime(conv.lastMessageAt || conv.createdAt)}</Text>
                        {conv.messageCount > 0 && (
                            <Badge size="xs" variant="filled" circle>{conv.messageCount}</Badge>
                        )}
                    </Stack>
                </Group>
            </Card>
        );
    };

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>Caixa de Entrada</Title>
                </div>
                <Button leftSection={<IconPencil size={16} />} onClick={() => setComposeOpen(true)}>
                    Nova Mensagem
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconInbox size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Conversas</Text>
                            <Text fw={700} size="lg">{totalCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="cyan" size="lg"><IconMessage size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Diretas</Text>
                            <Text fw={700} size="lg">{directCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Grupos / Comunicados</Text>
                            <Text fw={700} size="lg">{groupCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconSend size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas (1h)</Text>
                            <Text fw={700} size="lg">{recentCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Search */}
            <TextInput
                placeholder="Buscar conversas..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* Conversation List */}
            <Card withBorder p="md">
                <Tabs defaultValue="all">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="all" leftSection={<IconInbox size={14} />}>
                            Todas ({totalCount})
                        </Tabs.Tab>
                        <Tabs.Tab value="direct" leftSection={<IconMessage size={14} />}>
                            Diretas ({directCount})
                        </Tabs.Tab>
                        <Tabs.Tab value="groups" leftSection={<IconUsers size={14} />}>
                            Grupos ({groupCount})
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="all">
                        <Stack gap="xs">
                            {filtered.length > 0 ? (
                                filtered.map(renderConversation)
                            ) : (
                                <Center py="xl">
                                    <Stack align="center" gap="xs">
                                        <IconInbox size={48} color="gray" />
                                        <Text c="dimmed">
                                            {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                                        </Text>
                                    </Stack>
                                </Center>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="direct">
                        <Stack gap="xs">
                            {filtered.filter(c => c.type === 'direct').length > 0 ? (
                                filtered.filter(c => c.type === 'direct').map(renderConversation)
                            ) : (
                                <Center py="xl">
                                    <Stack align="center" gap="xs">
                                        <IconMessage size={48} color="gray" />
                                        <Text c="dimmed">Nenhuma conversa direta</Text>
                                    </Stack>
                                </Center>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="groups">
                        <Stack gap="xs">
                            {filtered.filter(c => c.type === 'group' || c.type === 'broadcast').length > 0 ? (
                                filtered.filter(c => c.type === 'group' || c.type === 'broadcast').map(renderConversation)
                            ) : (
                                <Center py="xl">
                                    <Stack align="center" gap="xs">
                                        <IconUsers size={48} color="gray" />
                                        <Text c="dimmed">Nenhum grupo ou comunicado</Text>
                                    </Stack>
                                </Center>
                            )}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Card>

            {/* Compose Modal */}
            <Modal
                opened={composeOpen}
                onClose={() => setComposeOpen(false)}
                title="Nova Mensagem"
                size="lg"
            >
                <Stack gap="md">
                    <Select
                        label="Tipo"
                        value={composeType}
                        onChange={(v) => setComposeType(v || 'direct')}
                        data={[
                            { value: 'direct', label: 'Mensagem Direta' },
                            { value: 'group', label: 'Grupo' },
                            { value: 'broadcast', label: 'Comunicado' },
                        ]}
                    />
                    <TextInput
                        label="Destinatário"
                        placeholder={composeType === 'broadcast'
                            ? 'Todos, Equipe, ou #handle da escola...'
                            : 'Nome ou #handle do destinatário...'
                        }
                        leftSection={<IconHash size={16} />}
                        value={composeRecipient}
                        onChange={(e) => setComposeRecipient(e.target.value)}
                    />
                    <Textarea
                        label="Mensagem"
                        placeholder="Escreva sua mensagem..."
                        minRows={4}
                        value={composeMessage}
                        onChange={(e) => setComposeMessage(e.target.value)}
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setComposeOpen(false)}>Cancelar</Button>
                        <Button
                            leftSection={<IconSend size={16} />}
                            disabled={!composeRecipient.trim() || !composeMessage.trim()}
                        >
                            Enviar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
