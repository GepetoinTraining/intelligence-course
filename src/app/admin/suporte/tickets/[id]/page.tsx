'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Card, Title, Text, Group, Badge, Button, Stack, Avatar,
    ThemeIcon, ActionIcon, Textarea, Paper, Select, Divider,
    Loader, Center, Switch, Tooltip, Timeline, Box, Grid,
} from '@mantine/core';
import {
    IconArrowLeft, IconSend, IconCheck, IconClock,
    IconAlertCircle, IconUser, IconMessageCircle,
    IconLock, IconEye, IconRefresh, IconTag, IconTicket,
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// CONSTANTS
// ============================================================================

const statusColors: Record<string, string> = {
    open: 'blue',
    in_progress: 'yellow',
    waiting_customer: 'orange',
    waiting_internal: 'cyan',
    resolved: 'green',
    closed: 'gray',
};

const statusLabels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Atendimento',
    waiting_customer: 'Aguard. Cliente',
    waiting_internal: 'Aguard. Interno',
    resolved: 'Resolvido',
    closed: 'Fechado',
};

const priorityColors: Record<string, string> = {
    low: 'gray', medium: 'blue', high: 'orange', urgent: 'red',
};

const priorityLabels: Record<string, string> = {
    low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

const categoryLabels: Record<string, string> = {
    technical: 'Técnico', academic: 'Acadêmico', financial: 'Financeiro',
    administrative: 'Administrativo', billing: 'Cobrança', bug: 'Bug',
    feature_request: 'Solicitação', other: 'Outro',
};

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(epoch: number | null) {
    if (!epoch) return '-';
    return new Date(epoch * 1000).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatRelative(epoch: number | null) {
    if (!epoch) return '';
    const diff = Math.floor(Date.now() / 1000) - epoch;
    if (diff < 60) return 'agora mesmo';
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    return `há ${Math.floor(diff / 86400)}d`;
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

function MessageBubble({ message }: { message: any }) {
    const isAgent = message.authorRole === 'agent' || message.authorRole === 'system';
    const isInternal = message.isInternal === 1;

    return (
        <Group align="flex-start" gap="sm" style={{ flexDirection: isAgent ? 'row' : 'row-reverse' }}>
            <Avatar
                size="sm"
                radius="xl"
                color={isAgent ? 'violet' : 'blue'}
                mt={4}
            >
                {isAgent ? <IconUser size={14} /> : (message.authorName || '?').charAt(0)}
            </Avatar>

            <Paper
                p="sm"
                radius="md"
                maw="70%"
                style={{
                    background: isInternal
                        ? 'var(--mantine-color-yellow-light)'
                        : isAgent
                            ? 'var(--mantine-color-dark-6)'
                            : 'var(--mantine-color-blue-light)',
                    border: isInternal ? '1px dashed var(--mantine-color-yellow-5)' : undefined,
                }}
            >
                <Group gap="xs" mb={4}>
                    <Text size="xs" fw={600}>
                        {message.authorName}
                    </Text>
                    {isInternal && (
                        <Tooltip label="Nota interna (não visível ao solicitante)">
                            <Badge size="xs" color="yellow" variant="filled" leftSection={<IconLock size={10} />}>
                                Interno
                            </Badge>
                        </Tooltip>
                    )}
                    <Text size="xs" c="dimmed">{formatRelative(message.createdAt)}</Text>
                </Group>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
            </Paper>
        </Group>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.id as string;
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [ticket, setTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Reply form
    const [replyContent, setReplyContent] = useState('');
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [resolveOnReply, setResolveOnReply] = useState(false);
    const [sending, setSending] = useState(false);

    const fetchTicket = useCallback(async () => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}`);
            if (res.ok) {
                const json = await res.json();
                setTicket(json.data);
                setMessages(json.data.messages || []);
            } else if (res.status === 404) {
                router.push('/admin/suporte/tickets');
            }
        } catch (e) {
            console.error('Failed to fetch ticket:', e);
        } finally {
            setLoading(false);
        }
    }, [ticketId, router]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendReply = async () => {
        if (!replyContent.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: replyContent,
                    authorRole: 'agent',
                    authorName: 'Agente', // Would come from auth in production
                    isInternal: isInternalNote,
                    newStatus: resolveOnReply ? 'resolved' : undefined,
                }),
            });
            if (res.ok) {
                setReplyContent('');
                setIsInternalNote(false);
                setResolveOnReply(false);
                fetchTicket();
            }
        } catch (e) {
            console.error('Error sending reply:', e);
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) fetchTicket();
        } catch (e) {
            console.error('Error updating status:', e);
        }
    };

    const handlePriorityChange = async (newPriority: string | null) => {
        if (!newPriority) return;
        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority: newPriority }),
            });
            if (res.ok) fetchTicket();
        } catch (e) {
            console.error('Error updating priority:', e);
        }
    };

    if (loading) {
        return <Center h={400}><Loader /></Center>;
    }

    if (!ticket) {
        return (
            <Center h={400}>
                <Stack align="center">
                    <IconAlertCircle size={32} />
                    <Text>Ticket não encontrado</Text>
                    <Button component={Link} href="/admin/suporte/tickets" variant="light">
                        Voltar
                    </Button>
                </Stack>
            </Center>
        );
    }

    const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';
    const now = Math.floor(Date.now() / 1000);
    const slaOverdue = ticket.slaDeadline && ticket.slaDeadline < now && !isClosed;

    return (
        <div>
            {/* Header */}
            <Group mb="lg">
                <ActionIcon
                    variant="subtle"
                    component={Link}
                    href="/admin/suporte/tickets"
                >
                    <IconArrowLeft size={18} />
                </ActionIcon>
                <div style={{ flex: 1 }}>
                    <Group gap="sm">
                        <Text c="dimmed" size="sm">{ticket.number}</Text>
                        <Badge color={statusColors[ticket.status]} variant="light">
                            {statusLabels[ticket.status]}
                        </Badge>
                        <Badge color={priorityColors[ticket.priority]} variant="dot">
                            {priorityLabels[ticket.priority]}
                        </Badge>
                        {slaOverdue && (
                            <Badge color="red" variant="filled" size="sm">
                                SLA Vencido
                            </Badge>
                        )}
                    </Group>
                    <Title order={3} mt={4}>{ticket.subject}</Title>
                </div>
                <ActionIcon variant="subtle" onClick={fetchTicket}>
                    <IconRefresh size={18} />
                </ActionIcon>
            </Group>

            <Grid gutter="lg">
                {/* Main Column — Conversation */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    {/* Messages Thread */}
                    <Card withBorder p="md" mb="md" style={{ maxHeight: 500, overflow: 'auto' }}>
                        <Stack gap="md">
                            {messages.length === 0 ? (
                                <Center py="xl">
                                    <Stack align="center" gap="xs">
                                        <IconMessageCircle size={32} color="gray" />
                                        <Text c="dimmed" size="sm">Nenhuma mensagem ainda</Text>
                                    </Stack>
                                </Center>
                            ) : (
                                messages.map((msg) => (
                                    <MessageBubble key={msg.id} message={msg} />
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </Stack>
                    </Card>

                    {/* Reply Box */}
                    {!isClosed ? (
                        <Card withBorder p="md">
                            <Stack gap="sm">
                                <Textarea
                                    placeholder={isInternalNote
                                        ? "Escreva uma nota interna (não visível ao solicitante)..."
                                        : "Escreva uma resposta..."
                                    }
                                    rows={3}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    styles={isInternalNote ? {
                                        input: {
                                            borderColor: 'var(--mantine-color-yellow-5)',
                                            background: 'var(--mantine-color-yellow-light)',
                                        }
                                    } : undefined}
                                />
                                <Group justify="space-between">
                                    <Group gap="lg">
                                        <Switch
                                            label="Nota interna"
                                            size="xs"
                                            checked={isInternalNote}
                                            onChange={(e) => setIsInternalNote(e.currentTarget.checked)}
                                        />
                                        <Switch
                                            label="Resolver ao enviar"
                                            size="xs"
                                            color="green"
                                            checked={resolveOnReply}
                                            onChange={(e) => setResolveOnReply(e.currentTarget.checked)}
                                        />
                                    </Group>
                                    <Button
                                        rightSection={<IconSend size={14} />}
                                        loading={sending}
                                        onClick={handleSendReply}
                                        disabled={!replyContent.trim()}
                                        color={isInternalNote ? 'yellow' : undefined}
                                    >
                                        {isInternalNote ? 'Adicionar Nota' : 'Enviar Resposta'}
                                    </Button>
                                </Group>
                            </Stack>
                        </Card>
                    ) : (
                        <Card withBorder p="md" bg="dark.7">
                            <Center>
                                <Group gap="xs">
                                    <IconCheck size={16} color="green" />
                                    <Text size="sm" c="dimmed">
                                        Ticket {ticket.status === 'resolved' ? 'resolvido' : 'fechado'}
                                        {ticket.resolvedAt ? ` em ${formatDate(ticket.resolvedAt)}` : ''}
                                    </Text>
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        onClick={() => handleStatusChange('open')}
                                    >
                                        Reabrir
                                    </Button>
                                </Group>
                            </Center>
                        </Card>
                    )}
                </Grid.Col>

                {/* Sidebar — Ticket Details */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="md">
                        {/* Requester Info */}
                        <Card withBorder p="md">
                            <Text size="sm" fw={600} mb="sm">Solicitante</Text>
                            <Group gap="sm">
                                <Avatar size="md" radius="xl" color="blue">
                                    {(ticket.requesterName || '?').charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{ticket.requesterName || 'Desconhecido'}</Text>
                                    <Text size="xs" c="dimmed">{ticket.requesterEmail || '-'}</Text>
                                </div>
                            </Group>
                        </Card>

                        {/* Ticket Properties */}
                        <Card withBorder p="md">
                            <Text size="sm" fw={600} mb="sm">Propriedades</Text>
                            <Stack gap="sm">
                                <div>
                                    <Text size="xs" c="dimmed">Status</Text>
                                    <Select
                                        size="xs"
                                        data={Object.entries(statusLabels).map(([v, l]) => ({ value: v, label: l }))}
                                        value={ticket.status}
                                        onChange={(v) => v && handleStatusChange(v)}
                                    />
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed">Prioridade</Text>
                                    <Select
                                        size="xs"
                                        data={[
                                            { value: 'low', label: '⚪ Baixa' },
                                            { value: 'medium', label: '🔵 Média' },
                                            { value: 'high', label: '🟠 Alta' },
                                            { value: 'urgent', label: '🔴 Urgente' },
                                        ]}
                                        value={ticket.priority}
                                        onChange={handlePriorityChange}
                                    />
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed">Categoria</Text>
                                    <Badge variant="light" color="gray" size="sm">
                                        {categoryLabels[ticket.category] || ticket.category}
                                    </Badge>
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed">Canal</Text>
                                    <Badge variant="light" color="violet" size="sm">
                                        {ticket.channel || 'web'}
                                    </Badge>
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed">Responsável</Text>
                                    <Text size="sm">{ticket.assignedToName || 'Não atribuído'}</Text>
                                </div>
                            </Stack>
                        </Card>

                        {/* Timeline */}
                        <Card withBorder p="md">
                            <Text size="sm" fw={600} mb="sm">Histórico</Text>
                            <Timeline active={-1} bulletSize={20} lineWidth={2}>
                                <Timeline.Item
                                    bullet={<IconTicket size={12} />}
                                    title={<Text size="xs">Ticket criado</Text>}
                                >
                                    <Text size="xs" c="dimmed">{formatDate(ticket.createdAt)}</Text>
                                </Timeline.Item>
                                {ticket.firstResponseAt && (
                                    <Timeline.Item
                                        bullet={<IconMessageCircle size={12} />}
                                        title={<Text size="xs">Primeira resposta</Text>}
                                    >
                                        <Text size="xs" c="dimmed">{formatDate(ticket.firstResponseAt)}</Text>
                                    </Timeline.Item>
                                )}
                                {ticket.resolvedAt && (
                                    <Timeline.Item
                                        bullet={<IconCheck size={12} />}
                                        title={<Text size="xs">Resolvido</Text>}
                                        color="green"
                                    >
                                        <Text size="xs" c="dimmed">{formatDate(ticket.resolvedAt)}</Text>
                                    </Timeline.Item>
                                )}
                                {ticket.closedAt && (
                                    <Timeline.Item
                                        bullet={<IconCheck size={12} />}
                                        title={<Text size="xs">Fechado</Text>}
                                        color="gray"
                                    >
                                        <Text size="xs" c="dimmed">{formatDate(ticket.closedAt)}</Text>
                                    </Timeline.Item>
                                )}
                            </Timeline>
                        </Card>

                        {/* SLA Info */}
                        {ticket.slaDeadline && (
                            <Card withBorder p="md" bg={slaOverdue ? 'red.9' : undefined}>
                                <Group gap="xs">
                                    <ThemeIcon
                                        size="sm"
                                        color={slaOverdue ? 'red' : 'green'}
                                        variant="light"
                                    >
                                        <IconClock size={12} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed">SLA Deadline</Text>
                                        <Text size="sm" fw={500} c={slaOverdue ? 'red' : undefined}>
                                            {formatDate(ticket.slaDeadline)}
                                        </Text>
                                    </div>
                                </Group>
                            </Card>
                        )}
                    </Stack>
                </Grid.Col>
            </Grid>
        </div>
    );
}
