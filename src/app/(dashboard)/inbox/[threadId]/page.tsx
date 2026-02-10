'use client';

import { use, useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Avatar, Paper, Textarea, ActionIcon, Divider, Tooltip
} from '@mantine/core';
import {
    IconArrowLeft, IconStar, IconStarFilled, IconTrash,
    IconArchive, IconCornerDownLeft, IconSend, IconPaperclip,
    IconSchool, IconUser, IconUsers, IconDotsVertical
} from '@tabler/icons-react';
import Link from 'next/link';

interface ThreadMessage {
    id: string;
    sender: {
        name: string;
        role: 'school' | 'teacher' | 'parent';
        avatar?: string;
    };
    content: string;
    date: string;
    time: string;
}

interface Thread {
    id: string;
    subject: string;
    participants: string[];
    messages: ThreadMessage[];
}

// Thread data will be fetched from API
const threads: Record<string, Thread> = {};

interface Props {
    params: Promise<{ threadId: string }>;
}

export default function ThreadPage({ params }: Props) {
    const { threadId } = use(params);
    const thread = threads[threadId] || null;
    const [reply, setReply] = useState('');
    const [isStarred, setIsStarred] = useState(false);

    const getRoleColor = (role: ThreadMessage['sender']['role']) => {
        switch (role) {
            case 'school': return 'blue';
            case 'teacher': return 'violet';
            case 'parent': return 'green';
        }
    };

    const getRoleLabel = (role: ThreadMessage['sender']['role']) => {
        switch (role) {
            case 'school': return 'Escola';
            case 'teacher': return 'Professor';
            case 'parent': return 'Responsável';
        }
    };

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group gap="md">
                    <Link href="/inbox" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconArrowLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>{thread.subject}</Title>
                        <Text size="sm" c="dimmed">
                            {thread.messages.length} mensagens • {thread.participants.join(', ')}
                        </Text>
                    </div>
                </Group>

                <Group>
                    <Tooltip label={isStarred ? 'Remover favorito' : 'Adicionar favorito'}>
                        <ActionIcon
                            variant="subtle"
                            color={isStarred ? 'yellow' : 'gray'}
                            size="lg"
                            onClick={() => setIsStarred(!isStarred)}
                        >
                            {isStarred ? <IconStarFilled size={20} /> : <IconStar size={20} />}
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Arquivar">
                        <ActionIcon variant="subtle" color="gray" size="lg">
                            <IconArchive size={20} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Excluir">
                        <ActionIcon variant="subtle" color="red" size="lg">
                            <IconTrash size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            {/* Messages */}
            <Stack gap="md">
                {thread.messages.map((message, index) => (
                    <Card key={message.id} shadow="xs" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            {/* Message Header */}
                            <Group justify="space-between">
                                <Group gap="sm">
                                    <Avatar size={44} radius="xl" color={getRoleColor(message.sender.role)}>
                                        {message.sender.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </Avatar>
                                    <div>
                                        <Group gap="xs">
                                            <Text fw={600}>{message.sender.name}</Text>
                                            <Badge size="xs" variant="light" color={getRoleColor(message.sender.role)}>
                                                {getRoleLabel(message.sender.role)}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed">{message.date} às {message.time}</Text>
                                    </div>
                                </Group>

                                <ActionIcon variant="subtle" color="gray">
                                    <IconDotsVertical size={16} />
                                </ActionIcon>
                            </Group>

                            {/* Message Content */}
                            <Text
                                size="sm"
                                style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                            >
                                {message.content}
                            </Text>
                        </Stack>
                    </Card>
                ))}
            </Stack>

            {/* Reply Box */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Stack gap="md">
                    <Group gap="xs">
                        <IconCornerDownLeft size={16} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed">Responder a esta conversa</Text>
                    </Group>

                    <Textarea
                        placeholder="Escreva sua resposta..."
                        minRows={4}
                        autosize
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                    />

                    <Group justify="space-between">
                        <Button variant="subtle" leftSection={<IconPaperclip size={16} />}>
                            Anexar
                        </Button>
                        <Button
                            leftSection={<IconSend size={16} />}
                            disabled={!reply.trim()}
                        >
                            Enviar Resposta
                        </Button>
                    </Group>
                </Stack>
            </Card>
        </Stack>
    );
}
