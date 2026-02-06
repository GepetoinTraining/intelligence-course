'use client';

import { useState } from 'react';
import {
    Modal, Stack, Group, Text, Badge, Avatar, Paper, Divider,
    Progress, ThemeIcon, ActionIcon, Tooltip, Button, Accordion,
    SimpleGrid, RingProgress, Tabs
} from '@mantine/core';
import {
    IconUser, IconMail, IconPhone, IconBrandWhatsapp,
    IconStar, IconHeart, IconBulb, IconTarget, IconBrain,
    IconTrendingUp, IconCalendarEvent, IconMoodSmile,
    IconMoodNeutral, IconMoodSad, IconMoodHappy, IconSparkles,
    IconChartBar, IconMessageCircle, IconX, IconCheck, IconArrowRight
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

export interface SCRMProfile {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    avatarUrl?: string | null;
    source?: string | null;
    funnelStage?: string | null;
    funnelSegment?: string | null;
    currentSentiment?: string | null;
    insightDreams?: string[];
    insightHobbies?: string[];
    insightAspirations?: string[];
    hasPersona?: boolean;
    personaGeneratedAt?: number | null;
    createdAt?: number | null;
    updatedAt?: number | null;
    // Extended fields for student view
    enrollmentDate?: string | null;
    currentLevel?: string | null;
    nextRenewal?: string | null;
    ltv?: number | null;
    npsScore?: number | null;
}

interface SCRMProfileModalProps {
    opened: boolean;
    onClose: () => void;
    profile: SCRMProfile | null;
    onGeneratePersona?: (profileId: string) => void;
    onViewExpanded?: (profile: SCRMProfile) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FUNNEL_STAGES = {
    // TOFU
    small_engagement: { label: 'Pequenos Engajamentos', color: 'blue', segment: 'tofu' },
    comments_conversations: { label: 'Comentários/Conversas', color: 'cyan', segment: 'tofu' },
    interested: { label: 'Interessados', color: 'teal', segment: 'tofu' },
    // MOFU
    qualifying: { label: 'Qualificando', color: 'violet', segment: 'mofu' },
    more_information: { label: 'Mais Informações', color: 'grape', segment: 'mofu' },
    events_invitations: { label: 'Eventos/Convites', color: 'pink', segment: 'mofu' },
    // BOFU
    appointments: { label: 'Agendamentos', color: 'orange', segment: 'bofu' },
    negotiation: { label: 'Negociação', color: 'yellow', segment: 'bofu' },
    counters: { label: 'Contrapropostas', color: 'lime', segment: 'bofu' },
    // Outcomes
    won: { label: 'Matriculado ✅', color: 'green', segment: 'outcome' },
    lost: { label: 'Pausado', color: 'gray', segment: 'outcome' },
    // LTV stages (post-enrollment)
    active_student: { label: 'Aluno Ativo', color: 'green', segment: 'ltv' },
    at_risk: { label: 'Em Risco', color: 'orange', segment: 'ltv' },
    churned: { label: 'Evadido', color: 'red', segment: 'ltv' },
    champion: { label: 'Champion', color: 'violet', segment: 'ltv' },
};

const SENTIMENT_CONFIG = {
    enthusiastic: { label: 'Entusiasmado', color: 'green', icon: IconMoodHappy },
    positive: { label: 'Positivo', color: 'teal', icon: IconMoodSmile },
    neutral: { label: 'Neutro', color: 'gray', icon: IconMoodNeutral },
    hesitant: { label: 'Hesitante', color: 'yellow', icon: IconMoodSad },
    negative: { label: 'Negativo', color: 'red', icon: IconMoodSad },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SCRMProfileModal({
    opened,
    onClose,
    profile,
    onGeneratePersona,
    onViewExpanded,
}: SCRMProfileModalProps) {
    if (!profile) return null;

    const sentimentKey = profile.currentSentiment as keyof typeof SENTIMENT_CONFIG || 'neutral';
    const sentimentConfig = SENTIMENT_CONFIG[sentimentKey] || SENTIMENT_CONFIG.neutral;
    const SentimentIcon = sentimentConfig.icon;

    const stageKey = profile.funnelStage as keyof typeof FUNNEL_STAGES;
    const stageConfig = FUNNEL_STAGES[stageKey];

    const has3x3 = (profile.insightDreams?.length || 0) +
        (profile.insightHobbies?.length || 0) +
        (profile.insightAspirations?.length || 0) > 0;

    const insights3x3Progress = Math.round(
        ((profile.insightDreams?.length || 0) +
            (profile.insightHobbies?.length || 0) +
            (profile.insightAspirations?.length || 0)) / 9 * 100
    );

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconUser size={20} />
                    <Text fw={600}>Perfil SCRM</Text>
                </Group>
            }
            size="lg"
        >
            <Stack gap="md">
                {/* Header with Profile Info */}
                <Paper p="md" withBorder radius="md">
                    <Group>
                        <Avatar
                            size="lg"
                            color={stageConfig?.color || 'blue'}
                            radius="xl"
                            src={profile.avatarUrl}
                        >
                            {getInitials(profile.name)}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600} size="lg">{profile.name}</Text>
                                    {profile.email && (
                                        <Text size="sm" c="dimmed">{profile.email}</Text>
                                    )}
                                </div>
                                <Tooltip label={sentimentConfig.label}>
                                    <ThemeIcon
                                        size="lg"
                                        variant="light"
                                        color={sentimentConfig.color}
                                        radius="xl"
                                    >
                                        <SentimentIcon size={20} />
                                    </ThemeIcon>
                                </Tooltip>
                            </Group>
                            {stageConfig && (
                                <Badge
                                    mt="xs"
                                    color={stageConfig.color}
                                    variant="light"
                                    size="sm"
                                >
                                    {stageConfig.label}
                                </Badge>
                            )}
                        </div>
                    </Group>
                </Paper>

                {/* Contact Actions */}
                <Group gap="xs">
                    {profile.whatsapp && (
                        <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconBrandWhatsapp size={14} />}
                            component="a"
                            href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                        >
                            WhatsApp
                        </Button>
                    )}
                    {profile.phone && (
                        <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            leftSection={<IconPhone size={14} />}
                            component="a"
                            href={`tel:${profile.phone}`}
                        >
                            Ligar
                        </Button>
                    )}
                    {profile.email && (
                        <Button
                            size="xs"
                            variant="light"
                            color="violet"
                            leftSection={<IconMail size={14} />}
                            component="a"
                            href={`mailto:${profile.email}`}
                        >
                            Email
                        </Button>
                    )}
                </Group>

                <Divider />

                {/* 3x3 Insights Summary */}
                <div>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="sm">Insights 3x3</Text>
                        <Badge
                            size="sm"
                            color={insights3x3Progress >= 100 ? 'green' : insights3x3Progress > 33 ? 'yellow' : 'gray'}
                        >
                            {insights3x3Progress}% completo
                        </Badge>
                    </Group>
                    <Progress
                        value={insights3x3Progress}
                        color={insights3x3Progress >= 100 ? 'green' : insights3x3Progress > 33 ? 'yellow' : 'gray'}
                        size="sm"
                        mb="sm"
                    />

                    {has3x3 ? (
                        <SimpleGrid cols={3} spacing="xs">
                            {/* Dreams */}
                            <Paper p="xs" withBorder radius="sm" bg="violet.0">
                                <Group gap={4} mb={4}>
                                    <Text size="xs">💭</Text>
                                    <Text size="xs" fw={500}>Sonhos</Text>
                                </Group>
                                {profile.insightDreams?.slice(0, 2).map((d, i) => (
                                    <Text key={i} size="xs" c="dimmed" lineClamp={1}>
                                        • {d}
                                    </Text>
                                ))}
                                {!profile.insightDreams?.length && (
                                    <Text size="xs" c="dimmed">Não preenchido</Text>
                                )}
                            </Paper>

                            {/* Hobbies */}
                            <Paper p="xs" withBorder radius="sm" bg="blue.0">
                                <Group gap={4} mb={4}>
                                    <Text size="xs">🎯</Text>
                                    <Text size="xs" fw={500}>Hobbies</Text>
                                </Group>
                                {profile.insightHobbies?.slice(0, 2).map((h, i) => (
                                    <Text key={i} size="xs" c="dimmed" lineClamp={1}>
                                        • {h}
                                    </Text>
                                ))}
                                {!profile.insightHobbies?.length && (
                                    <Text size="xs" c="dimmed">Não preenchido</Text>
                                )}
                            </Paper>

                            {/* Aspirations */}
                            <Paper p="xs" withBorder radius="sm" bg="green.0">
                                <Group gap={4} mb={4}>
                                    <Text size="xs">🌟</Text>
                                    <Text size="xs" fw={500}>Aspirações</Text>
                                </Group>
                                {profile.insightAspirations?.slice(0, 2).map((a, i) => (
                                    <Text key={i} size="xs" c="dimmed" lineClamp={1}>
                                        • {a}
                                    </Text>
                                ))}
                                {!profile.insightAspirations?.length && (
                                    <Text size="xs" c="dimmed">Não preenchido</Text>
                                )}
                            </Paper>
                        </SimpleGrid>
                    ) : (
                        <Paper p="md" withBorder radius="sm" ta="center" bg="gray.0">
                            <IconSparkles size={24} color="var(--mantine-color-gray-5)" />
                            <Text size="sm" c="dimmed" mt="xs">
                                Nenhum insight 3x3 capturado ainda
                            </Text>
                        </Paper>
                    )}
                </div>

                {/* Persona AI Status */}
                {profile.hasPersona ? (
                    <Paper p="sm" withBorder radius="sm" bg="grape.0">
                        <Group>
                            <ThemeIcon size="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
                                <IconBrain size={16} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>Persona AI gerada</Text>
                                <Text size="xs" c="dimmed">
                                    Criada em {profile.personaGeneratedAt ? new Date(profile.personaGeneratedAt).toLocaleDateString('pt-BR') : 'data desconhecida'}
                                </Text>
                            </div>
                            <Button size="xs" variant="light">Ver Persona</Button>
                        </Group>
                    </Paper>
                ) : has3x3 && onGeneratePersona ? (
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                        leftSection={<IconBrain size={16} />}
                        onClick={() => onGeneratePersona(profile.id)}
                    >
                        Gerar Persona AI
                    </Button>
                ) : null}

                <Divider />

                {/* Actions */}
                <Group justify="flex-end">
                    <Button variant="subtle" onClick={onClose}>
                        Fechar
                    </Button>
                    {onViewExpanded && (
                        <Button
                            leftSection={<IconChartBar size={16} />}
                            onClick={() => onViewExpanded(profile)}
                        >
                            Ver Completo
                        </Button>
                    )}
                </Group>
            </Stack>
        </Modal>
    );
}

// ============================================================================
// COMPACT CARD FOR INLINE USE
// ============================================================================

interface SCRMProfileCardProps {
    profile: SCRMProfile;
    onClick?: () => void;
    compact?: boolean;
}

export function SCRMProfileCard({ profile, onClick, compact = false }: SCRMProfileCardProps) {
    const sentimentKey = profile.currentSentiment as keyof typeof SENTIMENT_CONFIG || 'neutral';
    const sentimentConfig = SENTIMENT_CONFIG[sentimentKey] || SENTIMENT_CONFIG.neutral;
    const SentimentIcon = sentimentConfig.icon;

    const stageKey = profile.funnelStage as keyof typeof FUNNEL_STAGES;
    const stageConfig = FUNNEL_STAGES[stageKey];

    const insights3x3Count = (profile.insightDreams?.length || 0) +
        (profile.insightHobbies?.length || 0) +
        (profile.insightAspirations?.length || 0);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (compact) {
        return (
            <Paper
                p="xs"
                withBorder
                radius="sm"
                style={{ cursor: onClick ? 'pointer' : 'default' }}
                onClick={onClick}
            >
                <Group gap="xs">
                    <Avatar size="sm" color={stageConfig?.color || 'blue'} radius="xl">
                        {getInitials(profile.name)}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                        <Text size="sm" fw={500} lineClamp={1}>{profile.name}</Text>
                        {stageConfig && (
                            <Badge size="xs" color={stageConfig.color} variant="dot">
                                {stageConfig.label}
                            </Badge>
                        )}
                    </div>
                    <Group gap={4}>
                        <Tooltip label={sentimentConfig.label}>
                            <ThemeIcon size="xs" variant="light" color={sentimentConfig.color}>
                                <SentimentIcon size={10} />
                            </ThemeIcon>
                        </Tooltip>
                        {insights3x3Count > 0 && (
                            <Badge size="xs" color="violet" variant="light">
                                {insights3x3Count}/9
                            </Badge>
                        )}
                        {profile.hasPersona && (
                            <Tooltip label="Persona AI">
                                <ThemeIcon size="xs" variant="light" color="grape">
                                    <IconBrain size={10} />
                                </ThemeIcon>
                            </Tooltip>
                        )}
                    </Group>
                </Group>
            </Paper>
        );
    }

    return (
        <Paper
            p="md"
            withBorder
            radius="md"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <Group justify="space-between" mb="sm">
                <Group gap="xs">
                    <Avatar size="md" color={stageConfig?.color || 'blue'} radius="xl">
                        {getInitials(profile.name)}
                    </Avatar>
                    <div>
                        <Text fw={600}>{profile.name}</Text>
                        <Text size="xs" c="dimmed">{profile.email || profile.phone || 'Sem contato'}</Text>
                    </div>
                </Group>
                <Tooltip label={sentimentConfig.label}>
                    <ThemeIcon size="md" variant="light" color={sentimentConfig.color} radius="xl">
                        <SentimentIcon size={16} />
                    </ThemeIcon>
                </Tooltip>
            </Group>

            {stageConfig && (
                <Badge mb="sm" color={stageConfig.color} variant="light" size="sm">
                    {stageConfig.label}
                </Badge>
            )}

            {/* 3x3 Quick Preview */}
            <Group gap={4} mb="xs">
                {profile.insightDreams?.slice(0, 1).map((_, i) => (
                    <Badge key={`d-${i}`} size="xs" color="violet" variant="dot">💭</Badge>
                ))}
                {profile.insightHobbies?.slice(0, 1).map((_, i) => (
                    <Badge key={`h-${i}`} size="xs" color="blue" variant="dot">🎯</Badge>
                ))}
                {profile.insightAspirations?.slice(0, 1).map((_, i) => (
                    <Badge key={`a-${i}`} size="xs" color="green" variant="dot">🌟</Badge>
                ))}
                {insights3x3Count === 0 && (
                    <Badge size="xs" color="gray" variant="light">Sem insights</Badge>
                )}
                {profile.hasPersona && (
                    <Badge
                        size="xs"
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                        leftSection={<IconBrain size={8} />}
                    >
                        Persona
                    </Badge>
                )}
            </Group>
        </Paper>
    );
}

export default SCRMProfileModal;

