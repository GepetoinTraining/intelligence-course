'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Paper, ThemeIcon, SimpleGrid, Loader, Center,
    Avatar, Tabs, ActionIcon, Tooltip, Textarea, Divider,
} from '@mantine/core';
import {
    IconMessage, IconSearch, IconSend, IconUsers,
    IconInbox, IconMail, IconBrandWhatsapp, IconPhone,
    IconRefresh, IconPlus, IconArrowLeft,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    type: string;
    lastSeen: number | null;
}

interface Conversation {
    id: string;
    participantIds: string;
    title: string | null;
    channel: string;
    status: string;
    lastMessageAt: number | null;
    createdAt: number | null;
}

// ============================================================================
// PAGE
// ============================================================================

export default function ComunicadorPage() {
    const { data: contactsData, isLoading: loadingContacts, refetch } = useApi<Contact[]>('/api/communicator/contacts');
    const { data: convsData, isLoading: loadingConvs } = useApi<Conversation[]>('/api/communicator/conversations');

    const contacts = contactsData || [];
    const conversations = convsData || [];
    const loading = loadingContacts || loadingConvs;
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('conversations');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messageText, setMessageText] = useState('');

    const filteredContacts = contacts.filter((c: Contact) =>
        !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredConversations = conversations.filter(c =>
        !search || (c.title || '').toLowerCase().includes(search.toLowerCase())
    );

    const channelIcon = (channel: string) => {
        switch (channel) {
            case 'whatsapp': return <IconBrandWhatsapp size={14} color="green" />;
            case 'email': return <IconMail size={14} color="blue" />;
            case 'sms': return <IconPhone size={14} color="orange" />;
            default: return <IconMessage size={14} />;
        }
    };

    const formatDate = (ts: number | null) => {
        if (!ts) return '';
        const d = new Date(ts * 1000);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Center py="xl"><Loader size="lg" /></Center>
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
                        <Text size="sm" fw={500}>Comunicador</Text>
                    </Group>
                    <Group justify="space-between" align="flex-end">
                        <div>
                            <Title order={1}>Comunicador</Title>
                            <Text c="dimmed" mt="xs">Central de comunicação multicanal.</Text>
                        </div>
                        <Group>
                            <Tooltip label="Atualizar">
                                <ActionIcon variant="subtle" onClick={refetch} size="lg">
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Group>
                </div>

                {/* Stats */}
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="blue">
                                <IconUsers size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Contatos</Text>
                                <Text size="xl" fw={700}>{contacts.length}</Text>
                            </div>
                        </Group>
                    </Card>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="violet">
                                <IconMessage size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Conversas</Text>
                                <Text size="xl" fw={700}>{conversations.length}</Text>
                            </div>
                        </Group>
                    </Card>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="green">
                                <IconBrandWhatsapp size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>WhatsApp</Text>
                                <Text size="xl" fw={700}>
                                    {conversations.filter(c => c.channel === 'whatsapp').length}
                                </Text>
                            </div>
                        </Group>
                    </Card>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="orange">
                                <IconInbox size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Abertos</Text>
                                <Text size="xl" fw={700}>
                                    {conversations.filter(c => c.status === 'active').length}
                                </Text>
                            </div>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Search */}
                <TextInput
                    placeholder="Buscar contatos ou conversas..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                />

                {/* Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="conversations" leftSection={<IconMessage size={14} />}>
                            Conversas ({conversations.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="contacts" leftSection={<IconUsers size={14} />}>
                            Contatos ({contacts.length})
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Conversations tab */}
                    <Tabs.Panel value="conversations" pt="md">
                        {filteredConversations.length === 0 ? (
                            <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                                <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                    <IconMessage size={24} />
                                </ThemeIcon>
                                <Text fw={500} mb="xs">Nenhuma conversa encontrada</Text>
                                <Text size="sm" c="dimmed">Inicie uma nova conversa ou aguarde mensagens</Text>
                            </Paper>
                        ) : (
                            <Stack gap="xs">
                                {filteredConversations.map(conv => (
                                    <Paper
                                        key={conv.id}
                                        withBorder
                                        p="md"
                                        radius="md"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedConversation(conv)}
                                    >
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                <Avatar size={40} radius="xl" color="violet">
                                                    {channelIcon(conv.channel)}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        {conv.title || `Conversa #${conv.id.slice(0, 8)}`}
                                                    </Text>
                                                    <Group gap={6}>
                                                        {channelIcon(conv.channel)}
                                                        <Text size="xs" c="dimmed">{conv.channel}</Text>
                                                        <Badge
                                                            variant="light"
                                                            size="xs"
                                                            color={conv.status === 'active' ? 'green' : 'gray'}
                                                        >
                                                            {conv.status === 'active' ? 'Ativo' : conv.status}
                                                        </Badge>
                                                    </Group>
                                                </div>
                                            </Group>
                                            <Text size="xs" c="dimmed">{formatDate(conv.lastMessageAt)}</Text>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Tabs.Panel>

                    {/* Contacts tab */}
                    <Tabs.Panel value="contacts" pt="md">
                        {filteredContacts.length === 0 ? (
                            <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                                <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                    <IconUsers size={24} />
                                </ThemeIcon>
                                <Text fw={500} mb="xs">Nenhum contato encontrado</Text>
                                <Text size="sm" c="dimmed">Adicione contatos para iniciar comunicações</Text>
                            </Paper>
                        ) : (
                            <Card withBorder radius="md" p={0}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--mantine-color-dimmed)' }}>Contato</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--mantine-color-dimmed)' }}>Email</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--mantine-color-dimmed)' }}>Telefone</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.8rem', color: 'var(--mantine-color-dimmed)' }}>Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredContacts.map(contact => (
                                            <tr key={contact.id} style={{ borderBottom: '1px solid var(--mantine-color-gray-1)' }}>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <Group gap="sm">
                                                        <Avatar size={32} radius="xl" color="blue">
                                                            {contact.name[0]}
                                                        </Avatar>
                                                        <Text size="sm" fw={500}>{contact.name}</Text>
                                                    </Group>
                                                </td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <Text size="sm" c="dimmed">{contact.email || '–'}</Text>
                                                </td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <Text size="sm" c="dimmed">{contact.phone || '–'}</Text>
                                                </td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <Badge variant="light" size="sm">{contact.type}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
