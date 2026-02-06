/**
 * Hiring Dashboard - Owner Role
 * 
 * Create job openings, interview for ideal candidate, manage applications
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, Table, Modal, TextInput, Textarea, ActionIcon,
    Switch, Tabs, Progress, Loader, ScrollArea,
} from '@mantine/core';
import {
    IconBriefcase, IconPlus, IconMessageCircle, IconUsers,
    IconEye, IconEyeOff, IconTrash, IconChartBar, IconCheck,
    IconX, IconSend, IconArrowLeft, IconRefresh,
} from '@tabler/icons-react';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    description: string | null;
    hasIdealLattice: boolean;
    createdAt: number;
    isPublic?: boolean;
    applicantCount?: number;
}

interface Message {
    role: 'assistant' | 'user';
    content: string;
    timestamp: string;
}

type ViewState = 'list' | 'creating' | 'interviewing';

export default function HiringDashboardPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewState>('list');

    // New job creation
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newJobDesc, setNewJobDesc] = useState('');
    const [creating, setCreating] = useState(false);

    // Interview state
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [currentJobTitle, setCurrentJobTitle] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [interviewComplete, setInterviewComplete] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchJobs() {
        try {
            const res = await fetch('/api/lattice/jobs');
            const data = await res.json();
            if (data.success) {
                setJobs(data.jobs);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    }

    async function createJob() {
        if (!newJobTitle.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/lattice/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newJobTitle,
                    description: newJobDesc,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setCurrentJobId(data.jobId);
                setCurrentJobTitle(newJobTitle);
                setMessages([{
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                }]);
                setView('interviewing');
                setNewJobTitle('');
                setNewJobDesc('');
            }
        } catch (error) {
            console.error('Failed to create job:', error);
        } finally {
            setCreating(false);
        }
    }

    async function sendMessage() {
        if (!inputValue.trim() || sending || !currentJobId) return;

        const userMessage: Message = {
            role: 'user',
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setSending(true);

        try {
            const res = await fetch(`/api/lattice/jobs/${currentJobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'continue',
                    messages: [...messages, userMessage],
                    userResponse: userMessage.content,
                }),
            });

            const data = await res.json();
            if (data.success) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, assistantMessage]);

                if (data.isComplete) {
                    setInterviewComplete(true);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    }

    async function extractRequirements() {
        if (!currentJobId) return;

        setSending(true);
        try {
            const res = await fetch(`/api/lattice/jobs/${currentJobId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'extract',
                    messages,
                }),
            });

            const data = await res.json();
            if (data.success) {
                // Refresh jobs list and go back
                await fetchJobs();
                setView('list');
                setMessages([]);
                setCurrentJobId(null);
                setInterviewComplete(false);
            }
        } catch (error) {
            console.error('Failed to extract requirements:', error);
        } finally {
            setSending(false);
        }
    }

    async function deleteJob(id: string) {
        if (!confirm('Delete this job opening?')) return;

        try {
            await fetch(`/api/lattice/jobs/${id}`, { method: 'DELETE' });
            setJobs(prev => prev.filter(j => j.id !== id));
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    // Interview View
    if (view === 'interviewing') {
        return (
            <Stack gap="lg">
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => {
                            if (confirm('Exit interview? Progress will be saved.')) {
                                setView('list');
                                setMessages([]);
                                setCurrentJobId(null);
                                setInterviewComplete(false);
                                fetchJobs();
                            }
                        }}
                    >
                        Voltar
                    </Button>
                </Group>

                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="md">
                        <div>
                            <Text size="sm" c="dimmed">Definindo candidato ideal para:</Text>
                            <Title order={3}>{currentJobTitle}</Title>
                        </div>
                        {interviewComplete && (
                            <Badge color="green" size="lg">Entrevista Completa</Badge>
                        )}
                    </Group>

                    <ScrollArea h={400} mb="md">
                        <Stack gap="md" p="sm">
                            {messages.map((msg, i) => (
                                <Group
                                    key={i}
                                    justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                                >
                                    <Paper
                                        p="md"
                                        radius="md"
                                        maw="80%"
                                        bg={msg.role === 'user' ? 'blue.6' : 'gray.1'}
                                        c={msg.role === 'user' ? 'white' : 'dark'}
                                    >
                                        <Text size="sm">{msg.content}</Text>
                                    </Paper>
                                </Group>
                            ))}
                            {sending && (
                                <Group justify="flex-start">
                                    <Paper p="md" radius="md" bg="gray.1">
                                        <Loader size="sm" />
                                    </Paper>
                                </Group>
                            )}
                            <div ref={messagesEndRef} />
                        </Stack>
                    </ScrollArea>

                    {interviewComplete ? (
                        <Button
                            fullWidth
                            size="lg"
                            color="green"
                            leftSection={<IconCheck size={20} />}
                            onClick={extractRequirements}
                            loading={sending}
                        >
                            Gerar Perfil Ideal do Candidato
                        </Button>
                    ) : (
                        <Group>
                            <TextInput
                                placeholder="Descreva o que você precisa..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                disabled={sending}
                                style={{ flex: 1 }}
                            />
                            <ActionIcon
                                size="lg"
                                color="blue"
                                onClick={sendMessage}
                                disabled={sending || !inputValue.trim()}
                            >
                                <IconSend size={18} />
                            </ActionIcon>
                        </Group>
                    )}
                </Card>
            </Stack>
        );
    }

    // Create New Job View
    if (view === 'creating') {
        return (
            <Stack gap="lg">
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => setView('list')}
                    >
                        Voltar
                    </Button>
                </Group>

                <Card shadow="sm" radius="md" p="xl" withBorder maw={600}>
                    <Stack gap="lg">
                        <div>
                            <Title order={3} mb="xs">Nova Vaga</Title>
                            <Text c="dimmed" size="sm">
                                Crie uma vaga e defina o candidato ideal através de uma entrevista com IA.
                            </Text>
                        </div>

                        <TextInput
                            label="Título da Vaga"
                            placeholder="Ex: Desenvolvedor Full-Stack Sênior"
                            value={newJobTitle}
                            onChange={(e) => setNewJobTitle(e.target.value)}
                            required
                        />

                        <Textarea
                            label="Descrição (opcional)"
                            placeholder="Breve descrição da vaga..."
                            value={newJobDesc}
                            onChange={(e) => setNewJobDesc(e.target.value)}
                            rows={4}
                        />

                        <Button
                            size="lg"
                            leftSection={<IconMessageCircle size={20} />}
                            onClick={createJob}
                            loading={creating}
                            disabled={!newJobTitle.trim()}
                        >
                            Iniciar Entrevista de Definição
                        </Button>

                        <Text c="dimmed" size="xs" ta="center">
                            A IA vai fazer perguntas para entender o candidato ideal para esta vaga.
                        </Text>
                    </Stack>
                </Card>
            </Stack>
        );
    }

    // Jobs List View
    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between">
                <div>
                    <Title order={2}>Gestão de Vagas 👔</Title>
                    <Text c="dimmed">Crie vagas e defina o candidato ideal com IA</Text>
                </div>
                <Group>
                    <Link href="/careers" target="_blank">
                        <Button variant="light" leftSection={<IconEye size={16} />}>
                            Ver Portal Público
                        </Button>
                    </Link>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setView('creating')}
                    >
                        Nova Vaga
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Total de Vagas</Text>
                            <Text size="xl" fw={700}>{jobs.length}</Text>
                        </div>
                        <ThemeIcon size={40} variant="light" color="blue">
                            <IconBriefcase size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Com Perfil Definido</Text>
                            <Text size="xl" fw={700}>
                                {jobs.filter(j => j.hasIdealLattice).length}
                            </Text>
                        </div>
                        <ThemeIcon size={40} variant="light" color="green">
                            <IconCheck size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Publicadas</Text>
                            <Text size="xl" fw={700}>
                                {jobs.filter(j => j.isPublic).length}
                            </Text>
                        </div>
                        <ThemeIcon size={40} variant="light" color="violet">
                            <IconEye size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Candidaturas</Text>
                            <Text size="xl" fw={700}>—</Text>
                        </div>
                        <ThemeIcon size={40} variant="light" color="orange">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Jobs Table */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Vagas Cadastradas</Text>
                    <ActionIcon variant="subtle" onClick={fetchJobs}>
                        <IconRefresh size={18} />
                    </ActionIcon>
                </Group>

                {loading ? (
                    <Group justify="center" p="xl">
                        <Loader />
                    </Group>
                ) : jobs.length === 0 ? (
                    <Paper p="xl" bg="gray.0" radius="md" ta="center">
                        <IconBriefcase size={48} color="gray" style={{ marginBottom: 16 }} />
                        <Text c="dimmed" mb="md">Nenhuma vaga cadastrada ainda</Text>
                        <Button
                            variant="light"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setView('creating')}
                        >
                            Criar Primeira Vaga
                        </Button>
                    </Paper>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Vaga</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Criada em</Table.Th>
                                <Table.Th ta="right">Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {jobs.map(job => (
                                <Table.Tr key={job.id}>
                                    <Table.Td>
                                        <Text fw={500}>{job.title}</Text>
                                        {job.description && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {job.description}
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {job.hasIdealLattice ? (
                                            <Badge color="green" variant="light">
                                                Perfil Definido
                                            </Badge>
                                        ) : (
                                            <Badge color="orange" variant="light">
                                                Pendente
                                            </Badge>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">
                                            {formatDate(job.createdAt)}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group justify="flex-end" gap="xs">
                                            {!job.hasIdealLattice && (
                                                <ActionIcon
                                                    variant="light"
                                                    color="blue"
                                                    onClick={() => {
                                                        // Resume interview - would need to load messages
                                                        setCurrentJobId(job.id);
                                                        setCurrentJobTitle(job.title);
                                                        setMessages([]);
                                                        setView('interviewing');
                                                    }}
                                                >
                                                    <IconMessageCircle size={16} />
                                                </ActionIcon>
                                            )}
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => deleteJob(job.id)}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>
        </Stack>
    );
}

