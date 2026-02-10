'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Tabs,
    TextInput,
    ActionIcon,
    Avatar,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconInbox,
    IconSend,
    IconSearch,
    IconPencil,
    IconStar,
    IconTrash,
    IconMail,
    IconMailOpened,
    IconPaperclip,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useApi } from '@/hooks/useApi';

// Demo messages
const messages = [
    { id: 1, from: 'Maria Silva', subject: 'Dúvida sobre material didático', preview: 'Olá, gostaria de saber sobre...', time: '10:30', unread: true, starred: true },
    { id: 2, from: 'Prof. Carlos', subject: 'Relatório da turma Teens B1', preview: 'Segue o relatório mensal...', time: '09:15', unread: true, starred: false },
    { id: 3, from: 'João Santos', subject: 'Solicitação de troca de horário', preview: 'Preciso mudar o horário da aula...', time: 'Ontem', unread: false, starred: false },
    { id: 4, from: 'Ana Costa', subject: 'Agradecimento', preview: 'Quero agradecer pelo...', time: 'Ontem', unread: false, starred: true },
    { id: 5, from: 'Secretaria', subject: 'Lembrete: Reunião de professores', preview: 'A reunião será realizada...', time: '2 dias', unread: false, starred: false },
];

export default function InboxPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/communicator/conversations');

    const [search, setSearch] = useState('');
    const unreadCount = messages.filter(m => m.unread).length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>Caixa de Entrada</Title>
                </div>
                <Button leftSection={<IconPencil size={16} />}>
                    Nova Mensagem
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconMail size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Não Lidas</Text>
                            <Text fw={700} size="lg">{unreadCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconStar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Destacadas</Text>
                            <Text fw={700} size="lg">{messages.filter(m => m.starred).length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconSend size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Enviadas Hoje</Text>
                            <Text fw={700} size="lg">5</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="gray" size="lg">
                            <IconPaperclip size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Anexos</Text>
                            <Text fw={700} size="lg">12</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Search */}
            <TextInput
                placeholder="Buscar mensagens..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* Messages List */}
            <Card withBorder p="md">
                <Tabs defaultValue="all">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="all" leftSection={<IconInbox size={14} />}>
                            Todas
                        </Tabs.Tab>
                        <Tabs.Tab value="unread" leftSection={<IconMail size={14} />}>
                            Não Lidas ({unreadCount})
                        </Tabs.Tab>
                        <Tabs.Tab value="starred" leftSection={<IconStar size={14} />}>
                            Destacadas
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="all">
                        <Stack gap="xs">
                            {messages.map((msg) => (
                                <Card
                                    key={msg.id}
                                    withBorder
                                    p="sm"
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor: msg.unread ? 'var(--mantine-color-blue-0)' : undefined,
                                    }}
                                >
                                    <Group justify="space-between">
                                        <Group>
                                            <Avatar size={36} radius="xl" color="cyan">
                                                {msg.from.split(' ').map(n => n[0]).join('')}
                                            </Avatar>
                                            <div>
                                                <Group gap="xs">
                                                    <Text fw={msg.unread ? 700 : 500} size="sm">{msg.from}</Text>
                                                    {msg.unread && <Badge size="xs" color="blue">Novo</Badge>}
                                                </Group>
                                                <Text size="sm" fw={msg.unread ? 600 : 400}>{msg.subject}</Text>
                                                <Text size="xs" c="dimmed" lineClamp={1}>{msg.preview}</Text>
                                            </div>
                                        </Group>
                                        <Group gap="xs">
                                            <Text size="xs" c="dimmed">{msg.time}</Text>
                                            <ActionIcon
                                                variant="subtle"
                                                size="sm"
                                                color={msg.starred ? 'yellow' : 'gray'}
                                            >
                                                <IconStar size={16} fill={msg.starred ? 'currentColor' : 'none'} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="unread">
                        <Stack gap="xs">
                            {messages.filter(m => m.unread).map((msg) => (
                                <Card key={msg.id} withBorder p="sm" bg="var(--mantine-color-blue-0)">
                                    <Group justify="space-between">
                                        <Group>
                                            <Avatar size={36} radius="xl" color="cyan">
                                                {msg.from.split(' ').map(n => n[0]).join('')}
                                            </Avatar>
                                            <div>
                                                <Text fw={700} size="sm">{msg.from}</Text>
                                                <Text size="sm" fw={600}>{msg.subject}</Text>
                                            </div>
                                        </Group>
                                        <Text size="xs" c="dimmed">{msg.time}</Text>
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="starred">
                        <Stack gap="xs">
                            {messages.filter(m => m.starred).map((msg) => (
                                <Card key={msg.id} withBorder p="sm">
                                    <Group justify="space-between">
                                        <Group>
                                            <Avatar size={36} radius="xl" color="cyan">
                                                {msg.from.split(' ').map(n => n[0]).join('')}
                                            </Avatar>
                                            <div>
                                                <Text fw={500} size="sm">{msg.from}</Text>
                                                <Text size="sm">{msg.subject}</Text>
                                            </div>
                                        </Group>
                                        <ActionIcon variant="subtle" size="sm" color="yellow">
                                            <IconStar size={16} fill="currentColor" />
                                        </ActionIcon>
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Card>
        </Stack>
    );
}

