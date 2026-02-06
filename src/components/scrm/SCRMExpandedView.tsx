'use client';

import { useState } from 'react';
import {
    Stack, Group, Text, Badge, Avatar, Paper, Divider, Card,
    Progress, ThemeIcon, Button, Accordion, Timeline, Tabs,
    SimpleGrid, RingProgress, Table, ActionIcon, Tooltip, Box
} from '@mantine/core';
import {
    IconUser, IconMail, IconPhone, IconBrandWhatsapp,
    IconStar, IconHeart, IconBulb, IconTarget, IconBrain,
    IconTrendingUp, IconCalendarEvent, IconMoodSmile,
    IconMoodNeutral, IconMoodSad, IconMoodHappy, IconSparkles,
    IconChartBar, IconMessageCircle, IconX, IconCheck, IconArrowRight,
    IconHistory, IconNote, IconCash, IconClock, IconEdit,
    IconSettings, IconPlayerPlay, IconRefresh
} from '@tabler/icons-react';
import type { SCRMProfile } from './SCRMProfileModal';

// ============================================================================
// TYPES
// ============================================================================

interface TimelineEvent {
    id: string;
    type: 'stage_change' | 'sentiment_update' | 'contact' | 'insight_added' | 'persona_generated' | 'note';
    title: string;
    description?: string;
    timestamp: number;
    data?: Record<string, unknown>;
}

interface SCRMExpandedViewProps {
    profile: SCRMProfile;
    events?: TimelineEvent[];
    onClose?: () => void;
    onUpdateSentiment?: (sentiment: string) => void;
    onAddInsight?: (type: 'dream' | 'hobby' | 'aspiration', content: string) => void;
    onGeneratePersona?: () => void;
    onMoveStage?: (stage: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FUNNEL_STAGES = {
    // TOFU
    small_engagement: { label: 'Pequenos Engajamentos', color: 'blue', segment: 'tofu', order: 1 },
    comments_conversations: { label: 'Comentários/Conversas', color: 'cyan', segment: 'tofu', order: 2 },
    interested: { label: 'Interessados', color: 'teal', segment: 'tofu', order: 3 },
    // MOFU
    qualifying: { label: 'Qualificando', color: 'violet', segment: 'mofu', order: 4 },
    more_information: { label: 'Mais Informações', color: 'grape', segment: 'mofu', order: 5 },
    events_invitations: { label: 'Eventos/Convites', color: 'pink', segment: 'mofu', order: 6 },
    // BOFU
    appointments: { label: 'Agendamentos', color: 'orange', segment: 'bofu', order: 7 },
    negotiation: { label: 'Negociação', color: 'yellow', segment: 'bofu', order: 8 },
    counters: { label: 'Contrapropostas', color: 'lime', segment: 'bofu', order: 9 },
    // Outcomes
    won: { label: 'Matriculado ✅', color: 'green', segment: 'outcome', order: 10 },
    lost: { label: 'Pausado', color: 'gray', segment: 'outcome', order: 11 },
};

const SENTIMENT_CONFIG = {
    enthusiastic: { label: 'Entusiasmado', color: 'green', icon: IconMoodHappy },
    positive: { label: 'Positivo', color: 'teal', icon: IconMoodSmile },
    neutral: { label: 'Neutro', color: 'gray', icon: IconMoodNeutral },
    hesitant: { label: 'Hesitante', color: 'yellow', icon: IconMoodSad },
    negative: { label: 'Negativo', color: 'red', icon: IconMoodSad },
};

const SEGMENT_COLORS = {
    tofu: 'blue',
    mofu: 'violet',
    bofu: 'orange',
    outcome: 'green',
    ltv: 'cyan',
};

// ============================================================================
// MOCK TIMELINE DATA
// ============================================================================

const MOCK_EVENTS: TimelineEvent[] = [
    {
        id: '1',
        type: 'stage_change',
        title: 'Avançou para Interessados',
        description: 'Lead demonstrou interesse ativo após responder stories',
        timestamp: Date.now() - 86400000 * 2,
    },
    {
        id: '2',
        type: 'insight_added',
        title: 'Insight capturado: Sonho',
        description: 'Cliente mencionou desejo de trabalhar em multinacional',
        timestamp: Date.now() - 86400000 * 3,
    },
    {
        id: '3',
        type: 'contact',
        title: 'Contato via WhatsApp',
        description: 'Enviou informações sobre horários e valores',
        timestamp: Date.now() - 86400000 * 4,
    },
    {
        id: '4',
        type: 'sentiment_update',
        title: 'Sentimento atualizado',
        description: 'De Neutro para Positivo',
        timestamp: Date.now() - 86400000 * 5,
    },
    {
        id: '5',
        type: 'persona_generated',
        title: 'Persona AI gerada',
        description: 'Perfil de comunicação identificado: Analítico-Motivado',
        timestamp: Date.now() - 86400000 * 6,
    },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SCRMExpandedView({
    profile,
    events = MOCK_EVENTS,
    onClose,
    onUpdateSentiment,
    onAddInsight,
    onGeneratePersona,
    onMoveStage,
}: SCRMExpandedViewProps) {
    const [activeTab, setActiveTab] = useState<string | null>('overview');

    const sentimentKey = profile.currentSentiment as keyof typeof SENTIMENT_CONFIG || 'neutral';
    const sentimentConfig = SENTIMENT_CONFIG[sentimentKey] || SENTIMENT_CONFIG.neutral;
    const SentimentIcon = sentimentConfig.icon;

    const stageKey = profile.funnelStage as keyof typeof FUNNEL_STAGES;
    const stageConfig = FUNNEL_STAGES[stageKey];
    const currentOrder = stageConfig?.order || 0;

    const insights3x3Progress = Math.round(
        ((profile.insightDreams?.length || 0) +
            (profile.insightHobbies?.length || 0) +
            (profile.insightAspirations?.length || 0)) / 9 * 100
    );

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getEventIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'stage_change': return <IconArrowRight size={12} />;
            case 'sentiment_update': return <IconMoodSmile size={12} />;
            case 'contact': return <IconMessageCircle size={12} />;
            case 'insight_added': return <IconSparkles size={12} />;
            case 'persona_generated': return <IconBrain size={12} />;
            case 'note': return <IconNote size={12} />;
            default: return <IconHistory size={12} />;
        }
    };

    const getEventColor = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'stage_change': return 'blue';
            case 'sentiment_update': return 'green';
            case 'contact': return 'cyan';
            case 'insight_added': return 'violet';
            case 'persona_generated': return 'grape';
            case 'note': return 'gray';
            default: return 'gray';
        }
    };

    return (
        <Stack gap="lg">
            {/* Header Card */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Group justify="space-between" align="flex-start">
                    <Group>
                        <Avatar
                            size="xl"
                            color={stageConfig?.color || 'blue'}
                            radius="xl"
                            src={profile.avatarUrl}
                        >
                            {getInitials(profile.name)}
                        </Avatar>
                        <div>
                            <Text fw={700} size="xl">{profile.name}</Text>
                            <Group gap="xs" mt={4}>
                                {profile.email && (
                                    <Badge size="sm" variant="light" leftSection={<IconMail size={10} />}>
                                        {profile.email}
                                    </Badge>
                                )}
                                {profile.phone && (
                                    <Badge size="sm" variant="light" color="green" leftSection={<IconPhone size={10} />}>
                                        {profile.phone}
                                    </Badge>
                                )}
                            </Group>
                            <Group gap="xs" mt="sm">
                                {stageConfig && (
                                    <Badge size="lg" color={stageConfig.color} variant="filled">
                                        {stageConfig.label}
                                    </Badge>
                                )}
                                <Badge
                                    size="lg"
                                    color={sentimentConfig.color}
                                    variant="light"
                                    leftSection={<SentimentIcon size={12} />}
                                >
                                    {sentimentConfig.label}
                                </Badge>
                                {profile.hasPersona && (
                                    <Badge
                                        size="lg"
                                        variant="gradient"
                                        gradient={{ from: 'violet', to: 'grape' }}
                                        leftSection={<IconBrain size={12} />}
                                    >
                                        Persona AI
                                    </Badge>
                                )}
                            </Group>
                        </div>
                    </Group>
                    <Group>
                        <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconBrandWhatsapp size={16} />}
                            color="green"
                            component="a"
                            href={profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}` : '#'}
                            target="_blank"
                            disabled={!profile.whatsapp}
                        >
                            WhatsApp
                        </Button>
                        <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconPhone size={16} />}
                            component="a"
                            href={profile.phone ? `tel:${profile.phone}` : '#'}
                            disabled={!profile.phone}
                        >
                            Ligar
                        </Button>
                    </Group>
                </Group>

                {/* Funnel Progress */}
                <Box mt="lg">
                    <Text size="sm" fw={500} mb="xs">Progresso no Funil (11 Estágios)</Text>
                    <Progress.Root size="xl">
                        <Tooltip label="TOFU - Consciência">
                            <Progress.Section
                                value={currentOrder >= 3 ? 27.3 : (currentOrder / 11) * 100}
                                color="blue"
                            >
                                {currentOrder <= 3 && <Progress.Label>{stageConfig?.label}</Progress.Label>}
                            </Progress.Section>
                        </Tooltip>
                        <Tooltip label="MOFU - Consideração">
                            <Progress.Section
                                value={currentOrder >= 6 ? 27.3 : Math.max(0, ((currentOrder - 3) / 11) * 100)}
                                color="violet"
                            >
                                {currentOrder > 3 && currentOrder <= 6 && <Progress.Label>{stageConfig?.label}</Progress.Label>}
                            </Progress.Section>
                        </Tooltip>
                        <Tooltip label="BOFU - Decisão">
                            <Progress.Section
                                value={currentOrder >= 9 ? 27.3 : Math.max(0, ((currentOrder - 6) / 11) * 100)}
                                color="orange"
                            >
                                {currentOrder > 6 && currentOrder <= 9 && <Progress.Label>{stageConfig?.label}</Progress.Label>}
                            </Progress.Section>
                        </Tooltip>
                        <Tooltip label="Resultado">
                            <Progress.Section
                                value={currentOrder >= 10 ? 18.1 : 0}
                                color="green"
                            >
                                {currentOrder >= 10 && <Progress.Label>{stageConfig?.label}</Progress.Label>}
                            </Progress.Section>
                        </Tooltip>
                    </Progress.Root>
                </Box>
            </Card>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="overview" leftSection={<IconUser size={14} />}>
                        Visão Geral
                    </Tabs.Tab>
                    <Tabs.Tab value="insights" leftSection={<IconSparkles size={14} />}>
                        Insights 3x3
                    </Tabs.Tab>
                    <Tabs.Tab value="timeline" leftSection={<IconHistory size={14} />}>
                        Histórico
                    </Tabs.Tab>
                    <Tabs.Tab value="persona" leftSection={<IconBrain size={14} />}>
                        Persona AI
                    </Tabs.Tab>
                </Tabs.List>

                {/* OVERVIEW TAB */}
                <Tabs.Panel value="overview" pt="md">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        {/* 3x3 Summary Card */}
                        <Card shadow="sm" radius="md" p="md" withBorder>
                            <Group justify="space-between" mb="md">
                                <Text fw={600}>Insights 3x3</Text>
                                <RingProgress
                                    size={60}
                                    thickness={6}
                                    sections={[{ value: insights3x3Progress, color: insights3x3Progress >= 100 ? 'green' : 'violet' }]}
                                    label={<Text size="xs" ta="center" fw={700}>{insights3x3Progress}%</Text>}
                                />
                            </Group>
                            <Stack gap="xs">
                                <Paper p="xs" withBorder radius="sm" bg="violet.0">
                                    <Group gap="xs">
                                        <Text size="xs">💭</Text>
                                        <Text size="sm" fw={500}>Sonhos</Text>
                                        <Badge size="xs" ml="auto">{profile.insightDreams?.length || 0}/3</Badge>
                                    </Group>
                                    {profile.insightDreams?.map((d, i) => (
                                        <Text key={i} size="xs" c="dimmed" ml="lg">• {d}</Text>
                                    ))}
                                </Paper>
                                <Paper p="xs" withBorder radius="sm" bg="blue.0">
                                    <Group gap="xs">
                                        <Text size="xs">🎯</Text>
                                        <Text size="sm" fw={500}>Hobbies</Text>
                                        <Badge size="xs" ml="auto">{profile.insightHobbies?.length || 0}/3</Badge>
                                    </Group>
                                    {profile.insightHobbies?.map((h, i) => (
                                        <Text key={i} size="xs" c="dimmed" ml="lg">• {h}</Text>
                                    ))}
                                </Paper>
                                <Paper p="xs" withBorder radius="sm" bg="green.0">
                                    <Group gap="xs">
                                        <Text size="xs">🌟</Text>
                                        <Text size="sm" fw={500}>Aspirações</Text>
                                        <Badge size="xs" ml="auto">{profile.insightAspirations?.length || 0}/3</Badge>
                                    </Group>
                                    {profile.insightAspirations?.map((a, i) => (
                                        <Text key={i} size="xs" c="dimmed" ml="lg">• {a}</Text>
                                    ))}
                                </Paper>
                            </Stack>
                        </Card>

                        {/* Quick Stats Card */}
                        <Card shadow="sm" radius="md" p="md" withBorder>
                            <Text fw={600} mb="md">Métricas do Lead</Text>
                            <SimpleGrid cols={2} spacing="sm">
                                <Paper p="sm" withBorder radius="sm" ta="center">
                                    <Text size="xs" c="dimmed">Dias no Funil</Text>
                                    <Text size="xl" fw={700}>
                                        {profile.createdAt ? Math.floor((Date.now() - profile.createdAt) / 86400000) : '-'}
                                    </Text>
                                </Paper>
                                <Paper p="sm" withBorder radius="sm" ta="center">
                                    <Text size="xs" c="dimmed">Último Contato</Text>
                                    <Text size="xl" fw={700}>
                                        {profile.updatedAt ? `${Math.floor((Date.now() - profile.updatedAt) / 3600000)}h` : '-'}
                                    </Text>
                                </Paper>
                                <Paper p="sm" withBorder radius="sm" ta="center">
                                    <Text size="xs" c="dimmed">Fonte</Text>
                                    <Text size="lg" fw={600} tt="capitalize">
                                        {profile.source || 'Desconhecida'}
                                    </Text>
                                </Paper>
                                <Paper p="sm" withBorder radius="sm" ta="center">
                                    <Text size="xs" c="dimmed">LTV Potencial</Text>
                                    <Text size="xl" fw={700} c="green">
                                        {profile.ltv ? `R$ ${profile.ltv.toLocaleString('pt-BR')}` : 'N/A'}
                                    </Text>
                                </Paper>
                            </SimpleGrid>
                        </Card>
                    </SimpleGrid>

                    {/* Recent Activity */}
                    <Card shadow="sm" radius="md" p="md" withBorder mt="md">
                        <Text fw={600} mb="md">Atividade Recente</Text>
                        <Timeline active={events.length - 1} bulletSize={20} lineWidth={2}>
                            {events.slice(0, 4).map((event) => (
                                <Timeline.Item
                                    key={event.id}
                                    bullet={getEventIcon(event.type)}
                                    color={getEventColor(event.type)}
                                >
                                    <Text size="sm" fw={500}>{event.title}</Text>
                                    {event.description && (
                                        <Text size="xs" c="dimmed">{event.description}</Text>
                                    )}
                                    <Text size="xs" c="dimmed" mt={4}>
                                        {new Date(event.timestamp).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>
                </Tabs.Panel>

                {/* INSIGHTS TAB */}
                <Tabs.Panel value="insights" pt="md">
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                        {/* Dreams Column */}
                        <Card shadow="sm" radius="md" p="md" withBorder bg="violet.0">
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <Text size="lg">💭</Text>
                                    <Text fw={600}>Sonhos</Text>
                                </Group>
                                <Badge color="violet">{profile.insightDreams?.length || 0}/3</Badge>
                            </Group>
                            <Stack gap="sm">
                                {profile.insightDreams?.map((dream, i) => (
                                    <Paper key={i} p="sm" withBorder radius="sm" bg="white">
                                        <Group justify="space-between">
                                            <Text size="sm">{dream}</Text>
                                            <ActionIcon size="xs" variant="subtle">
                                                <IconEdit size={12} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                ))}
                                {(profile.insightDreams?.length || 0) < 3 && (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        fullWidth
                                        onClick={() => onAddInsight?.('dream', '')}
                                    >
                                        + Adicionar Sonho
                                    </Button>
                                )}
                            </Stack>
                        </Card>

                        {/* Hobbies Column */}
                        <Card shadow="sm" radius="md" p="md" withBorder bg="blue.0">
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <Text size="lg">🎯</Text>
                                    <Text fw={600}>Hobbies</Text>
                                </Group>
                                <Badge color="blue">{profile.insightHobbies?.length || 0}/3</Badge>
                            </Group>
                            <Stack gap="sm">
                                {profile.insightHobbies?.map((hobby, i) => (
                                    <Paper key={i} p="sm" withBorder radius="sm" bg="white">
                                        <Group justify="space-between">
                                            <Text size="sm">{hobby}</Text>
                                            <ActionIcon size="xs" variant="subtle">
                                                <IconEdit size={12} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                ))}
                                {(profile.insightHobbies?.length || 0) < 3 && (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        fullWidth
                                        onClick={() => onAddInsight?.('hobby', '')}
                                    >
                                        + Adicionar Hobby
                                    </Button>
                                )}
                            </Stack>
                        </Card>

                        {/* Aspirations Column */}
                        <Card shadow="sm" radius="md" p="md" withBorder bg="green.0">
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <Text size="lg">🌟</Text>
                                    <Text fw={600}>Aspirações</Text>
                                </Group>
                                <Badge color="green">{profile.insightAspirations?.length || 0}/3</Badge>
                            </Group>
                            <Stack gap="sm">
                                {profile.insightAspirations?.map((aspiration, i) => (
                                    <Paper key={i} p="sm" withBorder radius="sm" bg="white">
                                        <Group justify="space-between">
                                            <Text size="sm">{aspiration}</Text>
                                            <ActionIcon size="xs" variant="subtle">
                                                <IconEdit size={12} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                ))}
                                {(profile.insightAspirations?.length || 0) < 3 && (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        fullWidth
                                        onClick={() => onAddInsight?.('aspiration', '')}
                                    >
                                        + Adicionar Aspiração
                                    </Button>
                                )}
                            </Stack>
                        </Card>
                    </SimpleGrid>

                    {/* 3x3 Completion Status */}
                    <Card shadow="sm" radius="md" p="md" withBorder mt="md">
                        <Group justify="space-between">
                            <div>
                                <Text fw={600}>Status do 3x3</Text>
                                <Text size="sm" c="dimmed">
                                    {insights3x3Progress >= 100
                                        ? '✅ Todos os 9 insights capturados!'
                                        : `Faltam ${9 - ((profile.insightDreams?.length || 0) + (profile.insightHobbies?.length || 0) + (profile.insightAspirations?.length || 0))} insights`
                                    }
                                </Text>
                            </div>
                            <RingProgress
                                size={80}
                                thickness={8}
                                sections={[{ value: insights3x3Progress, color: insights3x3Progress >= 100 ? 'green' : 'violet' }]}
                                label={<Text size="sm" ta="center" fw={700}>{insights3x3Progress}%</Text>}
                            />
                        </Group>
                        {insights3x3Progress >= 33 && !profile.hasPersona && (
                            <Button
                                mt="md"
                                fullWidth
                                variant="gradient"
                                gradient={{ from: 'violet', to: 'grape' }}
                                leftSection={<IconBrain size={16} />}
                                onClick={onGeneratePersona}
                            >
                                Gerar Persona AI com Insights Atuais
                            </Button>
                        )}
                    </Card>
                </Tabs.Panel>

                {/* TIMELINE TAB */}
                <Tabs.Panel value="timeline" pt="md">
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Text fw={600} mb="lg">Histórico Completo do Lead</Text>
                        <Timeline active={events.length - 1} bulletSize={24} lineWidth={2}>
                            {events.map((event) => (
                                <Timeline.Item
                                    key={event.id}
                                    bullet={getEventIcon(event.type)}
                                    color={getEventColor(event.type)}
                                    title={event.title}
                                >
                                    {event.description && (
                                        <Text size="sm" c="dimmed" mt={4}>{event.description}</Text>
                                    )}
                                    <Text size="xs" c="dimmed" mt={4}>
                                        {new Date(event.timestamp).toLocaleDateString('pt-BR', {
                                            weekday: 'long',
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>
                </Tabs.Panel>

                {/* PERSONA TAB */}
                <Tabs.Panel value="persona" pt="md">
                    {profile.hasPersona ? (
                        <Card shadow="sm" radius="md" p="lg" withBorder>
                            <Group mb="lg">
                                <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'violet', to: 'grape' }} radius="xl">
                                    <IconBrain size={24} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={600} size="lg">Persona AI - {profile.name}</Text>
                                    <Text size="sm" c="dimmed">
                                        Gerada em {profile.personaGeneratedAt
                                            ? new Date(profile.personaGeneratedAt).toLocaleDateString('pt-BR')
                                            : 'data desconhecida'
                                        }
                                    </Text>
                                </div>
                            </Group>

                            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <Paper p="md" withBorder radius="md">
                                    <Text fw={500} mb="sm">🎯 Perfil de Comunicação</Text>
                                    <Text size="sm" c="dimmed">
                                        Baseado nos insights capturados, esta pessoa responde melhor a
                                        comunicação focada em resultados práticos e benefícios tangíveis.
                                    </Text>
                                </Paper>
                                <Paper p="md" withBorder radius="md">
                                    <Text fw={500} mb="sm">💡 Gatilhos Motivacionais</Text>
                                    <Stack gap={4}>
                                        {profile.insightDreams?.slice(0, 2).map((d, i) => (
                                            <Badge key={i} size="sm" variant="light" color="violet">
                                                {d}
                                            </Badge>
                                        ))}
                                        {profile.insightAspirations?.slice(0, 2).map((a, i) => (
                                            <Badge key={i} size="sm" variant="light" color="green">
                                                {a}
                                            </Badge>
                                        ))}
                                    </Stack>
                                </Paper>
                                <Paper p="md" withBorder radius="md">
                                    <Text fw={500} mb="sm">🤝 Abordagem Recomendada</Text>
                                    <Text size="sm" c="dimmed">
                                        Conectar benefícios do serviço diretamente aos sonhos pessoais.
                                        Usar exemplos práticos e cases de sucesso similares.
                                    </Text>
                                </Paper>
                                <Paper p="md" withBorder radius="md">
                                    <Text fw={500} mb="sm">⚠️ Evitar</Text>
                                    <Text size="sm" c="dimmed">
                                        Pressão excessiva, foco apenas em preço, comparações genéricas
                                        com concorrentes.
                                    </Text>
                                </Paper>
                            </SimpleGrid>

                            <Button
                                mt="lg"
                                variant="light"
                                leftSection={<IconRefresh size={16} />}
                                onClick={onGeneratePersona}
                            >
                                Regenerar Persona
                            </Button>
                        </Card>
                    ) : (
                        <Card shadow="sm" radius="md" p="xl" withBorder ta="center">
                            <ThemeIcon size={80} variant="light" color="gray" radius="xl" mx="auto">
                                <IconBrain size={40} />
                            </ThemeIcon>
                            <Text fw={600} size="lg" mt="md">Persona AI não gerada</Text>
                            <Text size="sm" c="dimmed" maw={400} mx="auto" mt="xs">
                                Capture pelo menos 3 insights (33% do 3x3) para gerar uma persona AI
                                personalizada para este lead.
                            </Text>
                            <Group justify="center" mt="lg">
                                <Badge size="lg" color={insights3x3Progress >= 33 ? 'green' : 'orange'}>
                                    {insights3x3Progress}% dos insights capturados
                                </Badge>
                            </Group>
                            {insights3x3Progress >= 33 && (
                                <Button
                                    mt="lg"
                                    variant="gradient"
                                    gradient={{ from: 'violet', to: 'grape' }}
                                    leftSection={<IconBrain size={16} />}
                                    onClick={onGeneratePersona}
                                >
                                    Gerar Persona AI
                                </Button>
                            )}
                        </Card>
                    )}
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}

export default SCRMExpandedView;

