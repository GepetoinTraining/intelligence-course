'use client';

import {
    Title,
    Text,
    Stack,
    Card,
    Group,
    Button,
    Textarea,
    Avatar,
    ActionIcon,
    Badge,
    ScrollArea,
    Box,
    Paper,
} from '@mantine/core';
import {
    IconSend,
    IconPaperclip,
    IconMicrophone,
    IconRobot,
    IconUser,
    IconSparkles,
    IconDots,
} from '@tabler/icons-react';
import { useState } from 'react';

// Demo chat messages
const initialMessages = [
    { id: 1, role: 'assistant', content: 'Olá! Sou o assistente IA da Node Zero. Como posso ajudar você hoje? Posso ajudar com:\n\n• Análise de dados e relatórios\n• Criação de conteúdo\n• Respostas a dúvidas sobre procedimentos\n• Sugestões de melhorias' },
    { id: 2, role: 'user', content: 'Quais são os alunos com maior risco de cancelamento este mês?' },
    { id: 3, role: 'assistant', content: 'Com base na análise dos dados, identifiquei **8 alunos** com risco elevado de cancelamento:\n\n1. **Maria Silva** - 2 faltas consecutivas, mensalidade atrasada\n2. **João Santos** - Reclamação registrada sobre horário\n3. **Ana Costa** - Baixa frequência (60%)\n\n**Recomendações:**\n- Agendar ligação de acompanhamento\n- Oferecer flexibilidade de horário\n- Verificar situação financeira\n\nDeseja que eu gere um relatório detalhado ou agende ações automáticas?' },
];

export default function AIChatPage() {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { id: messages.length + 1, role: 'user', content: input }]);
        setInput('');
        // In production, this would call the AI API
    };

    return (
        <Stack gap="lg" h="calc(100vh - 120px)">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Assistente IA</Text>
                    <Title order={2}>Chat Inteligente</Title>
                </div>
                <Group>
                    <Badge variant="light" color="green" leftSection={<IconSparkles size={12} />}>
                        GPT-4 Turbo
                    </Badge>
                    <ActionIcon variant="subtle">
                        <IconDots size={18} />
                    </ActionIcon>
                </Group>
            </Group>

            {/* Chat Area */}
            <Card withBorder p={0} style={{ flex: 1 }}>
                <ScrollArea h="calc(100vh - 320px)" p="md">
                    <Stack gap="md">
                        {messages.map((msg) => (
                            <Group key={msg.id} align="flex-start" gap="sm" wrap="nowrap">
                                <Avatar
                                    size={36}
                                    radius="xl"
                                    color={msg.role === 'assistant' ? 'violet' : 'blue'}
                                >
                                    {msg.role === 'assistant' ? <IconRobot size={20} /> : <IconUser size={20} />}
                                </Avatar>
                                <Paper
                                    p="sm"
                                    radius="md"
                                    withBorder={msg.role === 'user'}
                                    bg={msg.role === 'assistant' ? 'var(--mantine-color-violet-0)' : undefined}
                                    style={{ flex: 1, maxWidth: '80%' }}
                                >
                                    <Text size="xs" c="dimmed" mb="xs">
                                        {msg.role === 'assistant' ? 'Assistente IA' : 'Você'}
                                    </Text>
                                    <Text
                                        size="sm"
                                        style={{ whiteSpace: 'pre-wrap' }}
                                        dangerouslySetInnerHTML={{
                                            __html: msg.content
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n/g, '<br>')
                                        }}
                                    />
                                </Paper>
                            </Group>
                        ))}
                    </Stack>
                </ScrollArea>

                {/* Input Area */}
                <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Group gap="sm">
                        <ActionIcon variant="subtle" size="lg">
                            <IconPaperclip size={20} />
                        </ActionIcon>
                        <Textarea
                            placeholder="Digite sua mensagem..."
                            autosize
                            minRows={1}
                            maxRows={4}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            style={{ flex: 1 }}
                        />
                        <ActionIcon variant="subtle" size="lg">
                            <IconMicrophone size={20} />
                        </ActionIcon>
                        <Button
                            leftSection={<IconSend size={16} />}
                            onClick={handleSend}
                            disabled={!input.trim()}
                        >
                            Enviar
                        </Button>
                    </Group>
                </Box>
            </Card>

            {/* Quick Suggestions */}
            <Group gap="xs">
                <Text size="xs" c="dimmed">Sugestões:</Text>
                <Badge variant="light" style={{ cursor: 'pointer' }}>Resumo do dia</Badge>
                <Badge variant="light" style={{ cursor: 'pointer' }}>Análise financeira</Badge>
                <Badge variant="light" style={{ cursor: 'pointer' }}>Alunos em risco</Badge>
                <Badge variant="light" style={{ cursor: 'pointer' }}>Gerar relatório</Badge>
            </Group>
        </Stack>
    );
}

