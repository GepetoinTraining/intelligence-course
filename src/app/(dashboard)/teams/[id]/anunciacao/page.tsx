'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Container, Title, Text, Paper, Stack, Group, Button,
    Loader, Alert, Tabs, Card, Badge, Avatar, Timeline,
    Box, Divider
} from '@mantine/core';
import {
    IconPencil, IconClock, IconUser, IconCalendar,
    IconLock, IconSparkles, IconHistory
} from '@tabler/icons-react';
import AnunciacaoEditor from '@/components/teams/AnunciacaoEditor';

interface Anunciacao {
    id: string;
    quarter1Content?: string;
    quarter2Content?: string;
    quarter3Content?: string;
    quarter4AiContent?: string;
    closingContent?: string;
    status: 'draft' | 'active' | 'enshrined';
    publishedAt?: number;
    enshrinedAt?: number;
    tenureStartedAt?: number;
    tenureEndedAt?: number;
    tenureStats?: any;
    author?: {
        id: string;
        displayName?: string;
        firstName?: string;
        lastName?: string;
    };
}

interface TeamAnunciacaoData {
    team: { id: string; name: string };
    anunciacao: Anunciacao | null;
    myDraft: Anunciacao | null;
    isLeader: boolean;
    settings: {
        enabled: boolean;
        requiredForTeamAccess: boolean;
        visibility: string;
    };
    isLocked: boolean;
}

export default function TeamAnunciacaoPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [data, setData] = useState<TeamAnunciacaoData | null>(null);
    const [history, setHistory] = useState<Anunciacao[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string | null>('current');
    const [showEditor, setShowEditor] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [mainRes, historyRes] = await Promise.all([
                fetch(`/api/teams/${teamId}/anunciacao`),
                fetch(`/api/teams/${teamId}/anunciacao/history`),
            ]);

            if (mainRes.ok) {
                const mainData = await mainRes.json();
                setData(mainData);

                // If user is leader and has no anunciação, show editor
                if (mainData.isLeader && !mainData.anunciacao) {
                    setShowEditor(true);
                }
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setHistory(historyData.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch anunciação data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [teamId]);

    if (isLoading) {
        return (
            <Container size="md" py="xl">
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Carregando...</Text>
                </Stack>
            </Container>
        );
    }

    if (!data) {
        return (
            <Container size="md" py="xl">
                <Alert color="red" title="Erro">
                    Não foi possível carregar os dados da equipe.
                </Alert>
            </Container>
        );
    }

    // Show locked state
    if (data.isLocked && !data.isLeader) {
        return (
            <Container size="md" py="xl">
                <Paper p="xl" withBorder radius="md" ta="center">
                    <Stack align="center" gap="lg">
                        <IconLock size={48} color="var(--mantine-color-orange-5)" />
                        <Title order={2}>Equipe Bloqueada</Title>
                        <Text c="dimmed" maw={400}>
                            Esta equipe requer que o líder escreva sua Anunciação antes
                            de ser totalmente ativada.
                        </Text>
                        <Badge color="orange" size="lg">Aguardando Anunciação do Líder</Badge>
                    </Stack>
                </Paper>
            </Container>
        );
    }

    // Show editor for leader writing their anunciação
    if (showEditor || (data.isLeader && data.myDraft)) {
        return (
            <AnunciacaoEditor
                teamId={teamId}
                teamName={data.team.name}
                anunciacaoId={data.myDraft?.id}
                initialData={data.myDraft ? {
                    quarter1Content: data.myDraft.quarter1Content,
                    quarter2Content: data.myDraft.quarter2Content,
                    quarter3Content: data.myDraft.quarter3Content,
                    quarter4AiContent: data.myDraft.quarter4AiContent,
                    closingContent: data.myDraft.closingContent,
                } : undefined}
                onPublish={() => {
                    setShowEditor(false);
                    fetchData();
                }}
            />
        );
    }

    return (
        <Container size="md" py="xl">
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Anunciação</Title>
                        <Text c="dimmed">{data.team.name}</Text>
                    </div>
                    {data.isLeader && !data.anunciacao && (
                        <Button
                            leftSection={<IconPencil size={16} />}
                            onClick={() => setShowEditor(true)}
                        >
                            Escrever Anunciação
                        </Button>
                    )}
                </Group>

                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="current" leftSection={<IconSparkles size={16} />}>
                            Atual
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="history"
                            leftSection={<IconHistory size={16} />}
                            disabled={history.length === 0}
                        >
                            Histórico ({history.length})
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="current" pt="md">
                        {data.anunciacao ? (
                            <AnunciacaoViewer anunciacao={data.anunciacao} />
                        ) : (
                            <Paper p="xl" withBorder radius="md" ta="center">
                                <Stack align="center" gap="md">
                                    <Text c="dimmed">
                                        Esta equipe ainda não tem uma Anunciação.
                                    </Text>
                                </Stack>
                            </Paper>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="history" pt="md">
                        <Stack gap="md">
                            {history.length === 0 ? (
                                <Paper p="xl" withBorder ta="center">
                                    <Text c="dimmed">Nenhum histórico disponível.</Text>
                                </Paper>
                            ) : (
                                history.map((a) => (
                                    <AnunciacaoHistoryCard key={a.id} anunciacao={a} />
                                ))
                            )}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}

function AnunciacaoViewer({ anunciacao }: { anunciacao: Anunciacao }) {
    const authorName = anunciacao.author?.displayName ||
        `${anunciacao.author?.firstName || ''} ${anunciacao.author?.lastName || ''}`.trim() ||
        'Autor Desconhecido';

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return '';
        return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <Paper p="xl" withBorder radius="md">
            <Stack gap="xl">
                {/* Author Info */}
                <Group gap="md">
                    <Avatar size="lg" radius="xl" color="violet">
                        {authorName.charAt(0)}
                    </Avatar>
                    <div>
                        <Text fw={600}>{authorName}</Text>
                        {anunciacao.publishedAt && (
                            <Text c="dimmed" size="sm">
                                <IconCalendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                                {formatDate(anunciacao.publishedAt)}
                            </Text>
                        )}
                    </div>
                </Group>

                <Divider />

                {/* Quarter 1 */}
                {anunciacao.quarter1Content && (
                    <Box>
                        <Group gap="xs" mb="sm">
                            <Text size="lg">🌱</Text>
                            <Title order={4}>Quem Eu Sou</Title>
                        </Group>
                        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {anunciacao.quarter1Content}
                        </Text>
                    </Box>
                )}

                {/* Quarter 2 */}
                {anunciacao.quarter2Content && (
                    <Box>
                        <Group gap="xs" mb="sm">
                            <Text size="lg">💡</Text>
                            <Title order={4}>O Que Eu Acredito</Title>
                        </Group>
                        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {anunciacao.quarter2Content}
                        </Text>
                    </Box>
                )}

                {/* Quarter 3 */}
                {anunciacao.quarter3Content && (
                    <Box>
                        <Group gap="xs" mb="sm">
                            <Text size="lg">🚀</Text>
                            <Title order={4}>O Que Eu Estou Construindo</Title>
                        </Group>
                        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {anunciacao.quarter3Content}
                        </Text>
                    </Box>
                )}

                <Divider label="A Perspectiva da IA" labelPosition="center" />

                {/* Quarter 4 - AI */}
                {anunciacao.quarter4AiContent && (
                    <Box
                        p="lg"
                        style={{
                            backgroundColor: 'var(--mantine-color-violet-0)',
                            borderRadius: 'var(--mantine-radius-md)',
                        }}
                    >
                        <Group gap="xs" mb="sm">
                            <Text size="lg">🤖</Text>
                            <Title order={4}>A Voz da IA</Title>
                        </Group>
                        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {anunciacao.quarter4AiContent}
                        </Text>
                    </Box>
                )}

                {/* Closing */}
                {anunciacao.closingContent && (
                    <Box>
                        <Group gap="xs" mb="sm">
                            <Text size="lg">✍️</Text>
                            <Title order={4}>Encerramento</Title>
                        </Group>
                        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {anunciacao.closingContent}
                        </Text>
                    </Box>
                )}
            </Stack>
        </Paper>
    );
}

function AnunciacaoHistoryCard({ anunciacao }: { anunciacao: Anunciacao }) {
    const authorName = anunciacao.author?.displayName ||
        `${anunciacao.author?.firstName || ''} ${anunciacao.author?.lastName || ''}`.trim() ||
        'Autor Desconhecido';

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return '';
        return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
            month: 'short',
            year: 'numeric',
        });
    };

    const tenureDuration = () => {
        if (!anunciacao.tenureStartedAt || !anunciacao.tenureEndedAt) return '';
        const days = Math.floor((anunciacao.tenureEndedAt - anunciacao.tenureStartedAt) / 86400);
        if (days < 30) return `${days} dias`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} mês${months > 1 ? 'es' : ''}`;
        const years = Math.floor(months / 12);
        return `${years} ano${years > 1 ? 's' : ''}`;
    };

    return (
        <Card withBorder radius="md" p="md">
            <Group justify="space-between">
                <Group gap="md">
                    <Avatar size="md" radius="xl" color="gray">
                        {authorName.charAt(0)}
                    </Avatar>
                    <div>
                        <Text fw={500}>{authorName}</Text>
                        <Text c="dimmed" size="sm">
                            {formatDate(anunciacao.tenureStartedAt)} — {formatDate(anunciacao.tenureEndedAt)}
                        </Text>
                    </div>
                </Group>
                <Badge color="gray" variant="light">
                    {tenureDuration()}
                </Badge>
            </Group>

            {anunciacao.tenureStats && (
                <Group gap="xs" mt="sm">
                    {/* Display tenure stats here when available */}
                </Group>
            )}
        </Card>
    );
}
