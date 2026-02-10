'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Avatar,
    Tabs,
} from '@mantine/core';
import {
    IconMail,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconSend,
    IconInbox,
    IconTrash,
    IconArrowBackUp,
} from '@tabler/icons-react';

interface Message {
    id: string;
    from: string;
    to: string;
    subject: string;
    preview: string;
    status: 'unread' | 'read' | 'replied';
    type: 'inbox' | 'sent';
    createdAt: string;
}



const statusColors: Record<string, string> = {
    unread: 'blue',
    read: 'gray',
    replied: 'green',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function MensagensPage() {
    const { data: messagesData, isLoading } = useApi<any>('/api/communicator/conversations');
    const messages: Message[] = messagesData?.data || [];
    const [activeTab, setActiveTab] = useState<string | null>('inbox');

    const filtered = activeTab === 'inbox'
        ? messages.filter(m => m.type === 'inbox')
        : messages.filter(m => m.type === 'sent');

    const unreadCount = messages.filter(m => m.status === 'unread').length;
    const inboxCount = messages.filter(m => m.type === 'inbox').length;
    const sentCount = messages.filter(m => m.type === 'sent').length;

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Comunicações</Text>
                    <Title order={2}>Mensagens</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Mensagem
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconInbox size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Caixa de Entrada</Text>
                            <Text fw={700} size="xl">{inboxCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconMail size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Não Lidas</Text>
                            <Text fw={700} size="xl">{unreadCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconSend size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Enviadas</Text>
                            <Text fw={700} size="xl">{sentCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconArrowBackUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Taxa de Resposta</Text>
                            <Text fw={700} size="xl">85%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="inbox" leftSection={<IconInbox size={14} />}>
                            Entrada ({inboxCount})
                        </Tabs.Tab>
                        <Tabs.Tab value="sent" leftSection={<IconSend size={14} />}>
                            Enviadas ({sentCount})
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>{activeTab === 'inbox' ? 'De' : 'Para'}</Table.Th>
                            <Table.Th>Assunto</Table.Th>
                            <Table.Th>Data</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((message) => (
                            <Table.Tr
                                key={message.id}
                                style={{ fontWeight: message.status === 'unread' ? 600 : 400 }}
                            >
                                <Table.Td>
                                    <Group gap="sm">
                                        <Avatar size="sm" radius="xl" color="blue">
                                            {(activeTab === 'inbox' ? message.from : message.to).charAt(0)}
                                        </Avatar>
                                        <Text size="sm">
                                            {activeTab === 'inbox' ? message.from : message.to}
                                        </Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <div>
                                        <Text size="sm" fw={message.status === 'unread' ? 600 : 400}>
                                            {message.subject}
                                        </Text>
                                        <Text size="xs" c="dimmed" truncate style={{ maxWidth: 300 }}>
                                            {message.preview}
                                        </Text>
                                    </div>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatDate(message.createdAt)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={statusColors[message.status]}
                                        variant="light"
                                        size="sm"
                                    >
                                        {message.status === 'unread' ? 'Nova' : message.status === 'replied' ? 'Respondida' : 'Lida'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" size="sm">
                                                <IconDotsVertical size={14} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ler</Menu.Item>
                                            <Menu.Item leftSection={<IconArrowBackUp size={14} />}>Responder</Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item leftSection={<IconTrash size={14} />} color="red">Excluir</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

