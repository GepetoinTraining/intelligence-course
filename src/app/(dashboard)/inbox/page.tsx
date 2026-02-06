'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Avatar, ThemeIcon, Paper, TextInput, ActionIcon,
    Tabs, Menu, Modal, Textarea, Select, Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch, IconPlus, IconDots, IconMail, IconMailOpened,
    IconStar, IconStarFilled, IconTrash, IconArchive, IconSchool,
    IconUsers, IconUser, IconSend, IconPaperclip, IconFilter
} from '@tabler/icons-react';
import Link from 'next/link';

interface Message {
    id: string;
    subject: string;
    preview: string;
    sender: {
        name: string;
        role: 'school' | 'teacher' | 'parent';
        avatar?: string;
    };
    recipients: string[];
    isRead: boolean;
    isStarred: boolean;
    date: string;
    threadCount: number;
}

// Mock data
const MOCK_MESSAGES: Message[] = [
    {
        id: 'thread-1',
        subject: 'Reunião de pais - Módulo 1',
        preview: 'Gostaríamos de agendar uma reunião para discutir o progresso dos alunos no primeiro módulo do curso...',
        sender: { name: 'Coordenação Pedagógica', role: 'school' },
        recipients: ['Todos os Professores'],
        isRead: false,
        isStarred: true,
        date: '10:30',
        threadCount: 3,
    },
    {
        id: 'thread-2',
        subject: 'Dúvida sobre o Capstone do Lucas',
        preview: 'Olá professora, gostaria de entender melhor como funciona a avaliação do projeto final...',
        sender: { name: 'Carlos Silva', role: 'parent' },
        recipients: ['Prof. Maria Santos'],
        isRead: false,
        isStarred: false,
        date: 'Ontem',
        threadCount: 5,
    },
    {
        id: 'thread-3',
        subject: 'Material complementar - Lição 1.4',
        preview: 'Segue o material adicional que preparei para a aula sobre Context Stacking. Pode ser útil para suas turmas...',
        sender: { name: 'Prof. João Lima', role: 'teacher' },
        recipients: ['Prof. Maria Santos'],
        isRead: true,
        isStarred: false,
        date: '28 Jan',
        threadCount: 2,
    },
    {
        id: 'thread-4',
        subject: 'Atualização do currículo - Módulo 2',
        preview: 'Informamos que o Módulo 2 (The Slingshot) estará disponível a partir de 15 de Fevereiro...',
        sender: { name: 'Direção Acadêmica', role: 'school' },
        recipients: ['Todos os Professores', 'Todos os Responsáveis'],
        isRead: true,
        isStarred: true,
        date: '25 Jan',
        threadCount: 1,
    },
    {
        id: 'thread-5',
        subject: 'Aluno com dificuldades',
        preview: 'Percebi que o aluno Daniel Costa está com dificuldades nas últimas lições. Gostaria de alinhar uma estratégia...',
        sender: { name: 'Prof. Maria Santos', role: 'teacher' },
        recipients: ['Coordenação Pedagógica'],
        isRead: true,
        isStarred: false,
        date: '22 Jan',
        threadCount: 8,
    },
];

export default function InboxPage() {
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [composeOpened, { open: openCompose, close: closeCompose }] = useDisclosure(false);

    const toggleStar = (id: string) => {
        setMessages(prev => prev.map(m =>
            m.id === id ? { ...m, isStarred: !m.isStarred } : m
        ));
    };

    const markAsRead = (id: string) => {
        setMessages(prev => prev.map(m =>
            m.id === id ? { ...m, isRead: true } : m
        ));
    };

    const filteredMessages = messages.filter(m => {
        const matchesSearch = m.subject.toLowerCase().includes(search.toLowerCase()) ||
            m.sender.name.toLowerCase().includes(search.toLowerCase());

        if (activeTab === 'unread') return matchesSearch && !m.isRead;
        if (activeTab === 'starred') return matchesSearch && m.isStarred;
        if (activeTab === 'school') return matchesSearch && m.sender.role === 'school';
        if (activeTab === 'teachers') return matchesSearch && m.sender.role === 'teacher';
        if (activeTab === 'parents') return matchesSearch && m.sender.role === 'parent';
        return matchesSearch;
    });

    const unreadCount = messages.filter(m => !m.isRead).length;

    const getRoleIcon = (role: Message['sender']['role']) => {
        switch (role) {
            case 'school': return <IconSchool size={14} />;
            case 'teacher': return <IconUser size={14} />;
            case 'parent': return <IconUsers size={14} />;
        }
    };

    const getRoleColor = (role: Message['sender']['role']) => {
        switch (role) {
            case 'school': return 'blue';
            case 'teacher': return 'violet';
            case 'parent': return 'green';
        }
    };

    return (
        <>
            <Stack gap="lg">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Caixa de Entrada 📬</Title>
                        <Text c="dimmed">
                            {unreadCount > 0 ? `${unreadCount} mensagens não lidas` : 'Todas as mensagens lidas'}
                        </Text>
                    </div>
                    <Button leftSection={<IconPlus size={16} />} onClick={openCompose}>
                        Nova Mensagem
                    </Button>
                </Group>

                {/* Search & Filters */}
                <Group>
                    <TextInput
                        placeholder="Buscar mensagens..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                </Group>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="all" leftSection={<IconMail size={14} />}>
                            Todas
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="unread"
                            leftSection={<IconMailOpened size={14} />}
                            rightSection={unreadCount > 0 ? <Badge size="xs" color="red">{unreadCount}</Badge> : null}
                        >
                            Não Lidas
                        </Tabs.Tab>
                        <Tabs.Tab value="starred" leftSection={<IconStarFilled size={14} />}>
                            Favoritas
                        </Tabs.Tab>
                        <Tabs.Tab value="school" leftSection={<IconSchool size={14} />}>
                            Escola
                        </Tabs.Tab>
                        <Tabs.Tab value="teachers" leftSection={<IconUser size={14} />}>
                            Professores
                        </Tabs.Tab>
                        <Tabs.Tab value="parents" leftSection={<IconUsers size={14} />}>
                            Responsáveis
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                {/* Message List */}
                <Stack gap={0}>
                    {filteredMessages.map((message) => (
                        <Link
                            key={message.id}
                            href={`/inbox/${message.id}`}
                            style={{ textDecoration: 'none' }}
                            onClick={() => markAsRead(message.id)}
                        >
                            <Paper
                                p="md"
                                withBorder
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: 0,
                                    borderBottom: 'none',
                                    background: message.isRead ? 'transparent' : 'var(--mantine-color-blue-0)',
                                }}
                            >
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                        {/* Star */}
                                        <ActionIcon
                                            variant="subtle"
                                            color={message.isStarred ? 'yellow' : 'gray'}
                                            onClick={(e) => { e.preventDefault(); toggleStar(message.id); }}
                                        >
                                            {message.isStarred ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                                        </ActionIcon>

                                        {/* Avatar */}
                                        <Avatar size={40} radius="xl" color={getRoleColor(message.sender.role)}>
                                            {message.sender.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                        </Avatar>

                                        {/* Content */}
                                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                            <Group gap="xs" wrap="nowrap">
                                                <Text
                                                    size="sm"
                                                    fw={message.isRead ? 400 : 600}
                                                    style={{ whiteSpace: 'nowrap' }}
                                                >
                                                    {message.sender.name}
                                                </Text>
                                                <Badge
                                                    size="xs"
                                                    variant="light"
                                                    color={getRoleColor(message.sender.role)}
                                                    leftSection={getRoleIcon(message.sender.role)}
                                                >
                                                    {message.sender.role === 'school' ? 'Escola' :
                                                        message.sender.role === 'teacher' ? 'Professor' : 'Responsável'}
                                                </Badge>
                                                {message.threadCount > 1 && (
                                                    <Badge size="xs" variant="outline" color="gray">
                                                        {message.threadCount}
                                                    </Badge>
                                                )}
                                            </Group>
                                            <Text
                                                size="sm"
                                                fw={message.isRead ? 400 : 600}
                                                lineClamp={1}
                                            >
                                                {message.subject}
                                            </Text>
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {message.preview}
                                            </Text>
                                        </Stack>
                                    </Group>

                                    {/* Date & Actions */}
                                    <Group gap="xs" wrap="nowrap">
                                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                            {message.date}
                                        </Text>
                                        <Menu shadow="md" width={150} position="bottom-end">
                                            <Menu.Target>
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="gray"
                                                    onClick={(e) => e.preventDefault()}
                                                >
                                                    <IconDots size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown onClick={(e) => e.preventDefault()}>
                                                <Menu.Item leftSection={<IconArchive size={14} />}>
                                                    Arquivar
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                                                    Excluir
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Group>
                            </Paper>
                        </Link>
                    ))}

                    {filteredMessages.length === 0 && (
                        <Paper p="xl" ta="center" withBorder>
                            <Text c="dimmed">Nenhuma mensagem encontrada</Text>
                        </Paper>
                    )}
                </Stack>
            </Stack>

            {/* Compose Modal */}
            <Modal
                opened={composeOpened}
                onClose={closeCompose}
                title="Nova Mensagem"
                size="lg"
            >
                <Stack gap="md">
                    <Select
                        label="Para"
                        placeholder="Selecione os destinatários"
                        data={[
                            {
                                group: 'Escola', items: [
                                    { value: 'coord', label: 'Coordenação Pedagógica' },
                                    { value: 'dir', label: 'Direção Acadêmica' },
                                ]
                            },
                            {
                                group: 'Professores', items: [
                                    { value: 'prof-joao', label: 'Prof. João Lima' },
                                    { value: 'prof-ana', label: 'Prof. Ana Costa' },
                                ]
                            },
                            {
                                group: 'Responsáveis', items: [
                                    { value: 'parent-carlos', label: 'Carlos Silva (pai de Lucas)' },
                                    { value: 'parent-maria', label: 'Maria Oliveira (mãe de Carla)' },
                                ]
                            },
                        ]}
                        searchable
                        clearable
                    />

                    <TextInput
                        label="Assunto"
                        placeholder="Digite o assunto da mensagem"
                    />

                    <Textarea
                        label="Mensagem"
                        placeholder="Escreva sua mensagem..."
                        minRows={6}
                        autosize
                    />

                    <Group justify="space-between">
                        <Button variant="subtle" leftSection={<IconPaperclip size={16} />}>
                            Anexar
                        </Button>
                        <Group>
                            <Button variant="light" onClick={closeCompose}>
                                Cancelar
                            </Button>
                            <Button leftSection={<IconSend size={16} />}>
                                Enviar
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}

