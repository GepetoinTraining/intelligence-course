/**
 * Painel de Talentos - Página Principal do Perfil
 * 
 * Usuários com role "talent" podem:
 * - Ver seu lattice de competências em evolução
 * - Enviar documentos comprobatórios
 * - Fazer entrevistas para preencher lacunas
 * - Baixar seu CV
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, Progress, FileInput, ActionIcon,
    Tabs, Loader, Table, ScrollArea, TextInput,
} from '@mantine/core';
import {
    IconUpload, IconFileText, IconMessageCircle, IconDownload,
    IconCheck, IconClock, IconAlertCircle, IconRefresh, IconSend,
    IconChartRadar, IconTarget, IconBrain, IconSparkles,
} from '@tabler/icons-react';

const SkillRadar = dynamic(() => import('@/components/lattice/SkillRadar'), { ssr: false });
const LatticeCV = dynamic(() => import('@/components/lattice/LatticeCV').then(m => m.LatticeCV), { ssr: false });

interface TalentProfileData {
    id: string;
    headline: string | null;
    summary: string | null;
    currentLattice: any | null;
    skillGaps: string[];
    evidenceCount: number;
    profileCompleteness: number;
    status: string;
    documents: Document[];
}

interface Document {
    id: string;
    filename: string;
    documentType: string;
    analysisStatus: string;
    createdAt: number;
    skillsExtracted: string[];
}

interface Message {
    role: 'assistant' | 'user';
    content: string;
    timestamp: string;
}

type TabType = 'overview' | 'documents' | 'interview' | 'cv';

const DOC_TYPE_LABELS: Record<string, string> = {
    resume: 'Currículo',
    certificate: 'Certificado',
    diploma: 'Diploma',
    portfolio: 'Portfólio',
    recommendation: 'Recomendação',
    transcript: 'Histórico',
    other: 'Outro',
};

export default function TalentDashboardPage() {
    const [profile, setProfile] = useState<TalentProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // File upload
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // Gap interview
    const [interviewMode, setInterviewMode] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchProfile() {
        try {
            const res = await fetch('/api/talent/profile');
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
            }
        } catch (error) {
            console.error('Falha ao carregar perfil:', error);
        } finally {
            setLoading(false);
        }
    }

    async function uploadDocument() {
        if (!uploadFile) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);

            const res = await fetch('/api/talent/documents', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                setUploadFile(null);
                await fetchProfile();
            }
        } catch (error) {
            console.error('Falha ao enviar documento:', error);
        } finally {
            setUploading(false);
        }
    }

    async function startGapInterview() {
        setSending(true);
        try {
            const res = await fetch('/api/talent/gap-interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' }),
            });

            const data = await res.json();
            if (data.success) {
                setMessages([{
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                }]);
                setInterviewMode(true);
            }
        } catch (error) {
            console.error('Falha ao iniciar entrevista:', error);
        } finally {
            setSending(false);
        }
    }

    async function sendMessage() {
        if (!inputValue.trim() || sending) return;

        const userMessage: Message = {
            role: 'user',
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setSending(true);

        try {
            const res = await fetch('/api/talent/gap-interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'continue',
                    messages: [...messages, userMessage],
                    response: inputValue,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                }]);

                if (data.isComplete) {
                    await fetchProfile();
                    setInterviewMode(false);
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error('Falha ao enviar mensagem:', error);
        } finally {
            setSending(false);
        }
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <Stack align="center" justify="center" h={400}>
                <Loader size="lg" />
                <Text c="dimmed">Carregando seu perfil...</Text>
            </Stack>
        );
    }

    // Modo Entrevista
    if (interviewMode) {
        return (
            <Stack gap="lg" h="calc(100vh - 140px)">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>Entrevista de Competências 🧠</Title>
                        <Text c="dimmed">Respondendo perguntas para fortalecer seu perfil</Text>
                    </div>
                    <Button
                        variant="subtle"
                        color="red"
                        onClick={() => {
                            setInterviewMode(false);
                            setMessages([]);
                        }}
                    >
                        Sair da Entrevista
                    </Button>
                </Group>

                <Card shadow="sm" radius="md" p={0} withBorder style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <ScrollArea style={{ flex: 1 }} p="md">
                        <Stack gap="md">
                            {messages.map((msg, i) => (
                                <Group key={i} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
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

                    <Group p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                        <TextInput
                            placeholder="Sua resposta..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={sending}
                            style={{ flex: 1 }}
                        />
                        <ActionIcon size="lg" color="blue" onClick={sendMessage} disabled={sending || !inputValue.trim()}>
                            <IconSend size={18} />
                        </ActionIcon>
                    </Group>
                </Card>
            </Stack>
        );
    }

    return (
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v as TabType)}>
            <Stack gap="lg">
                {/* Cabeçalho */}
                <Group justify="space-between">
                    <div>
                        <Title order={2}>Painel de Talentos 🎯</Title>
                        <Text c="dimmed">Seu perfil de competências em evolução</Text>
                    </div>
                    <Tabs.List>
                        <Tabs.Tab value="overview" leftSection={<IconChartRadar size={16} />}>Visão Geral</Tabs.Tab>
                        <Tabs.Tab value="documents" leftSection={<IconFileText size={16} />}>Documentos</Tabs.Tab>
                        <Tabs.Tab value="interview" leftSection={<IconMessageCircle size={16} />}>Entrevista</Tabs.Tab>
                        <Tabs.Tab value="cv" leftSection={<IconDownload size={16} />}>Exportar CV</Tabs.Tab>
                    </Tabs.List>
                </Group>

                {/* Aba Visão Geral */}
                <Tabs.Panel value="overview">
                    <Stack gap="lg">
                        {/* Estatísticas */}
                        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                            <Paper shadow="sm" radius="md" p="lg" withBorder>
                                <Group justify="space-between">
                                    <div>
                                        <Text size="xs" c="dimmed">Completude do Perfil</Text>
                                        <Text size="xl" fw={700}>{Math.round(profile?.profileCompleteness || 0)}%</Text>
                                    </div>
                                    <ThemeIcon size={40} variant="light" color="green">
                                        <IconTarget size={24} />
                                    </ThemeIcon>
                                </Group>
                                <Progress value={profile?.profileCompleteness || 0} mt="sm" size="sm" />
                            </Paper>

                            <Paper shadow="sm" radius="md" p="lg" withBorder>
                                <Group justify="space-between">
                                    <div>
                                        <Text size="xs" c="dimmed">Documentos</Text>
                                        <Text size="xl" fw={700}>{profile?.evidenceCount || 0}</Text>
                                    </div>
                                    <ThemeIcon size={40} variant="light" color="blue">
                                        <IconFileText size={24} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>

                            <Paper shadow="sm" radius="md" p="lg" withBorder>
                                <Group justify="space-between">
                                    <div>
                                        <Text size="xs" c="dimmed">Competências Mapeadas</Text>
                                        <Text size="xl" fw={700}>
                                            {profile?.currentLattice ? Object.keys(profile.currentLattice).length : 0}
                                        </Text>
                                    </div>
                                    <ThemeIcon size={40} variant="light" color="violet">
                                        <IconBrain size={24} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>

                            <Paper shadow="sm" radius="md" p="lg" withBorder>
                                <Group justify="space-between">
                                    <div>
                                        <Text size="xs" c="dimmed">Lacunas</Text>
                                        <Text size="xl" fw={700}>{profile?.skillGaps?.length || 0}</Text>
                                    </div>
                                    <ThemeIcon size={40} variant="light" color="orange">
                                        <IconAlertCircle size={24} />
                                    </ThemeIcon>
                                </Group>
                            </Paper>
                        </SimpleGrid>

                        {/* Visualização do Lattice */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Text fw={600}>Seu Lattice de Competências</Text>
                                <ActionIcon variant="subtle" onClick={fetchProfile}>
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Group>

                            {profile?.currentLattice ? (
                                <Group justify="center">
                                    <SkillRadar shapeData={profile.currentLattice} size={400} />
                                </Group>
                            ) : (
                                <Paper p="xl" bg="gray.0" radius="md" ta="center">
                                    <IconSparkles size={48} color="gray" style={{ marginBottom: 16 }} />
                                    <Text c="dimmed" mb="md">
                                        Seu lattice de competências aparecerá aqui conforme você adicionar evidências
                                    </Text>
                                    <Group justify="center" gap="sm">
                                        <Button variant="light" onClick={() => setActiveTab('documents')}>
                                            Enviar Documentos
                                        </Button>
                                        <Button variant="light" onClick={() => setActiveTab('interview')}>
                                            Fazer Entrevista
                                        </Button>
                                    </Group>
                                </Paper>
                            )}
                        </Card>

                        {/* Ações Rápidas */}
                        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <ThemeIcon size={48} radius="md" variant="light" color="blue" mb="md">
                                    <IconUpload size={28} />
                                </ThemeIcon>
                                <Text fw={600} mb="xs">Enviar Documentos</Text>
                                <Text size="sm" c="dimmed" mb="md">
                                    Adicione certificados, diplomas ou itens de portfólio para fortalecer seu perfil.
                                </Text>
                                <Button fullWidth variant="light" onClick={() => setActiveTab('documents')}>
                                    Enviar Arquivos
                                </Button>
                            </Card>

                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <ThemeIcon size={48} radius="md" variant="light" color="violet" mb="md">
                                    <IconMessageCircle size={28} />
                                </ThemeIcon>
                                <Text fw={600} mb="xs">Entrevista de Lacunas</Text>
                                <Text size="sm" c="dimmed" mb="md">
                                    Responda perguntas direcionadas para preencher lacunas em seu perfil.
                                </Text>
                                <Button
                                    fullWidth
                                    variant="light"
                                    onClick={startGapInterview}
                                    disabled={(profile?.skillGaps?.length || 0) === 0}
                                >
                                    {(profile?.skillGaps?.length || 0) === 0 ? 'Sem Lacunas' : 'Iniciar Entrevista'}
                                </Button>
                            </Card>

                            <Card shadow="sm" radius="md" p="lg" withBorder>
                                <ThemeIcon size={48} radius="md" variant="light" color="green" mb="md">
                                    <IconDownload size={28} />
                                </ThemeIcon>
                                <Text fw={600} mb="xs">Baixar CV</Text>
                                <Text size="sm" c="dimmed" mb="md">
                                    Exporte seu CV baseado em competências para compartilhar com empregadores.
                                </Text>
                                <Button
                                    fullWidth
                                    variant="light"
                                    onClick={() => setActiveTab('cv')}
                                    disabled={!profile?.currentLattice}
                                >
                                    Exportar CV
                                </Button>
                            </Card>
                        </SimpleGrid>
                    </Stack>
                </Tabs.Panel>

                {/* Aba Documentos */}
                <Tabs.Panel value="documents">
                    <Stack gap="lg">
                        {/* Seção de Upload */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Text fw={600} mb="md">Enviar Documento Comprobatório</Text>
                            <Group>
                                <FileInput
                                    placeholder="Selecione um arquivo (PDF, Imagem ou Texto)"
                                    value={uploadFile}
                                    onChange={setUploadFile}
                                    accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    onClick={uploadDocument}
                                    loading={uploading}
                                    disabled={!uploadFile}
                                    leftSection={<IconUpload size={16} />}
                                >
                                    Enviar
                                </Button>
                            </Group>
                            <Text size="xs" c="dimmed" mt="sm">
                                Aceitos: Certificados, diplomas, históricos, itens de portfólio, cartas de recomendação
                            </Text>
                        </Card>

                        {/* Lista de Documentos */}
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group justify="space-between" mb="md">
                                <Text fw={600}>Documentos Enviados</Text>
                                <ActionIcon variant="subtle" onClick={fetchProfile}>
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Group>

                            {(profile?.documents?.length || 0) === 0 ? (
                                <Paper p="xl" bg="gray.0" radius="md" ta="center">
                                    <IconFileText size={48} color="gray" style={{ marginBottom: 16 }} />
                                    <Text c="dimmed">Nenhum documento enviado ainda</Text>
                                </Paper>
                            ) : (
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Documento</Table.Th>
                                            <Table.Th>Tipo</Table.Th>
                                            <Table.Th>Status</Table.Th>
                                            <Table.Th>Enviado em</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {profile?.documents?.map((doc) => (
                                            <Table.Tr key={doc.id}>
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <IconFileText size={16} />
                                                        <Text size="sm">{doc.filename}</Text>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="light">
                                                        {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    {doc.analysisStatus === 'completed' ? (
                                                        <Badge color="green" leftSection={<IconCheck size={12} />}>
                                                            Analisado
                                                        </Badge>
                                                    ) : doc.analysisStatus === 'processing' ? (
                                                        <Badge color="blue" leftSection={<IconClock size={12} />}>
                                                            Processando
                                                        </Badge>
                                                    ) : (
                                                        <Badge color="gray" leftSection={<IconClock size={12} />}>
                                                            Pendente
                                                        </Badge>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">{formatDate(doc.createdAt)}</Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Card>
                    </Stack>
                </Tabs.Panel>

                {/* Aba Entrevista */}
                <Tabs.Panel value="interview">
                    <Stack gap="lg">
                        <Card shadow="sm" radius="md" p="xl" withBorder ta="center">
                            <ThemeIcon size={64} radius="md" variant="light" color="violet" mb="lg" mx="auto">
                                <IconBrain size={36} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Entrevista de Competências</Title>
                            <Text c="dimmed" maw={500} mx="auto" mb="lg">
                                Nossa IA fará perguntas direcionadas sobre competências que ainda não foram
                                verificadas através de documentos. Isso ajuda a construir um perfil mais completo.
                            </Text>

                            {(profile?.skillGaps?.length || 0) > 0 ? (
                                <>
                                    <Text size="sm" c="dimmed" mb="md">
                                        {profile?.skillGaps?.length} competências precisam de mais evidências
                                    </Text>
                                    <Button
                                        size="lg"
                                        leftSection={<IconMessageCircle size={20} />}
                                        onClick={startGapInterview}
                                        loading={sending}
                                    >
                                        Iniciar Entrevista
                                    </Button>
                                </>
                            ) : (
                                <Text c="green">✓ Todas as competências têm evidências suficientes!</Text>
                            )}
                        </Card>
                    </Stack>
                </Tabs.Panel>

                {/* Aba CV */}
                <Tabs.Panel value="cv">
                    <Stack gap="lg">
                        {profile?.currentLattice ? (
                            <LatticeCV
                                personName={profile.headline || 'Perfil Profissional'}
                                shapeData={profile.currentLattice}
                                bio={profile.summary || undefined}
                            />
                        ) : (
                            <Card shadow="sm" radius="md" p="xl" withBorder ta="center">
                                <IconDownload size={48} color="gray" style={{ marginBottom: 16 }} />
                                <Text c="dimmed" mb="md">
                                    Construa seu perfil primeiro enviando documentos ou fazendo uma entrevista.
                                </Text>
                                <Group justify="center" gap="sm">
                                    <Button variant="light" onClick={() => setActiveTab('documents')}>
                                        Enviar Documentos
                                    </Button>
                                    <Button variant="light" onClick={() => setActiveTab('interview')}>
                                        Fazer Entrevista
                                    </Button>
                                </Group>
                            </Card>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Stack>
        </Tabs>
    );
}

