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

// Mock thread data
const MOCK_THREADS: Record<string, Thread> = {
    'thread-1': {
        id: 'thread-1',
        subject: 'Reunião de pais - Módulo 1',
        participants: ['Coordenação Pedagógica', 'Prof. Maria Santos', 'Prof. João Lima'],
        messages: [
            {
                id: 'm1',
                sender: { name: 'Coordenação Pedagógica', role: 'school' },
                content: `Prezados professores,

Gostaríamos de agendar uma reunião para discutir o progresso dos alunos no primeiro módulo do curso Intelligence.

A reunião está prevista para o dia 10 de Fevereiro às 14h, na sala de conferências.

Por favor, confirmem suas presenças.

Atenciosamente,
Coordenação Pedagógica`,
                date: '2 Fev 2026',
                time: '09:15',
            },
            {
                id: 'm2',
                sender: { name: 'Prof. João Lima', role: 'teacher' },
                content: `Olá,

Confirmo minha presença na reunião. 

Gostaria de sugerir que também incluamos na pauta a discussão sobre os materiais complementares que estamos desenvolvendo.

Abs,
João`,
                date: '2 Fev 2026',
                time: '10:02',
            },
            {
                id: 'm3',
                sender: { name: 'Prof. Maria Santos', role: 'teacher' },
                content: `Bom dia,

Também confirmo presença. Excelente sugestão do Prof. João!

Prepararei um relatório com o progresso das minhas turmas para compartilhar na reunião.

Maria`,
                date: '2 Fev 2026',
                time: '10:30',
            },
        ],
    },
    'thread-2': {
        id: 'thread-2',
        subject: 'Dúvida sobre o Capstone do Lucas',
        participants: ['Carlos Silva', 'Prof. Maria Santos'],
        messages: [
            {
                id: 'm1',
                sender: { name: 'Carlos Silva', role: 'parent' },
                content: `Olá Professora Maria,

Sou pai do Lucas Silva, da Turma A. Gostaria de entender melhor como funciona a avaliação do projeto final (Capstone) do Módulo 1.

O Lucas está animado com o projeto, mas ficamos com algumas dúvidas sobre os critérios de avaliação e o prazo de entrega.

Poderia nos explicar?

Obrigado,
Carlos`,
                date: '1 Fev 2026',
                time: '18:45',
            },
            {
                id: 'm2',
                sender: { name: 'Prof. Maria Santos', role: 'teacher' },
                content: `Olá Sr. Carlos,

Que bom saber que o Lucas está animado! O Capstone "The World Builder" é realmente uma experiência incrível para os alunos.

Os critérios de avaliação são:
- Criatividade do mundo (20%)
- Consistência das regras (30%)
- Resistência a quebra de personagem (30%)
- Engajamento da turma (20%)

O prazo de entrega é dia 15 de Fevereiro.

Estou à disposição para mais esclarecimentos!

Profª Maria`,
                date: '1 Fev 2026',
                time: '19:30',
            },
            {
                id: 'm3',
                sender: { name: 'Carlos Silva', role: 'parent' },
                content: `Muito obrigado pela explicação detalhada, professora!

O Lucas já começou a desenhar as regras do "planeta" dele. Está criando um mundo onde o tempo funciona ao contrário - achei muito criativo!

Vou incentivá-lo a continuar.

Abraços,
Carlos`,
                date: '1 Fev 2026',
                time: '20:15',
            },
            {
                id: 'm4',
                sender: { name: 'Prof. Maria Santos', role: 'teacher' },
                content: `Que incrível! O conceito de tempo invertido tem muito potencial.

Sugiro que ele pense em como essa regra afeta todos os aspectos do mundo - comunicação, memória, relacionamentos. Isso vai tornar o Context Stack bem robusto!

Qualquer dúvida, estamos aqui.

Profª Maria`,
                date: '1 Fev 2026',
                time: '21:00',
            },
            {
                id: 'm5',
                sender: { name: 'Carlos Silva', role: 'parent' },
                content: `Excelente sugestão! Vou passar para ele.

Muito obrigado pelo suporte e dedicação. É muito bom ver professores tão engajados!

Carlos`,
                date: '2 Fev 2026',
                time: '08:30',
            },
        ],
    },
};

interface Props {
    params: Promise<{ threadId: string }>;
}

export default function ThreadPage({ params }: Props) {
    const { threadId } = use(params);
    const thread = MOCK_THREADS[threadId] || MOCK_THREADS['thread-1'];
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
