'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Paper, ThemeIcon, Progress, Modal, TextInput, Textarea,
    Select, Avatar, ActionIcon, Tooltip, Skeleton, Tabs,
    RingProgress, Accordion, Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconUserPlus, IconBrain, IconHeart, IconTarget, IconPalette,
    IconPhone, IconMail, IconBrandWhatsapp, IconMessage,
    IconMoodSmile, IconMoodSad, IconMoodNeutral, IconRefresh,
    IconArrowLeft, IconChevronRight, IconSearch, IconFilter,
    IconCalendarEvent, IconTrendingUp, IconUsers, IconSparkles
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface LeadInsight {
    id: string;
    type: 'dream' | 'hobby' | 'aspiration';
    content: string;
    createdAt: string;
}

interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    source?: string;
    funnelStage: string;
    funnelSegment: string;
    currentSentiment?: string;
    insightDreams?: string;
    insightHobbies?: string;
    insightAspirations?: string;
    hasPersona?: boolean;
    createdAt: string;
    insights?: LeadInsight[];
}

// Pre-Sales focuses on TOFU and early MOFU stages
const PRESALES_STAGES = [
    { value: 'small_engagement', label: 'Pequenos Engajamentos', segment: 'tofu', color: 'blue' },
    { value: 'comments_conversations', label: 'Comentários/Conversas', segment: 'tofu', color: 'cyan' },
    { value: 'interested', label: 'Interessados', segment: 'tofu', color: 'teal' },
    { value: 'qualifying', label: 'Qualificando', segment: 'mofu', color: 'violet' },
    { value: 'more_information', label: 'Mais Informações', segment: 'mofu', color: 'grape' },
];

const SENTIMENT_OPTIONS = [
    { value: 'enthusiastic', label: 'Entusiasmado', color: 'green', icon: IconMoodSmile },
    { value: 'positive', label: 'Positivo', color: 'teal', icon: IconMoodSmile },
    { value: 'neutral', label: 'Neutro', color: 'gray', icon: IconMoodNeutral },
    { value: 'hesitant', label: 'Hesitante', color: 'yellow', icon: IconMoodSad },
    { value: 'negative', label: 'Negativo', color: 'red', icon: IconMoodSad },
];

const INSIGHT_TYPES = [
    { value: 'dream', label: 'Sonho', icon: IconSparkles, color: 'violet', emoji: '✨' },
    { value: 'hobby', label: 'Hobby', icon: IconPalette, color: 'teal', emoji: '🎨' },
    { value: 'aspiration', label: 'Aspiração', icon: IconTarget, color: 'orange', emoji: '🎯' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PreSalesPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeStage, setActiveStage] = useState<string | null>(null);

    // Modals
    const [insightModalOpened, { open: openInsightModal, close: closeInsightModal }] = useDisclosure(false);
    const [sentimentModalOpened, { open: openSentimentModal, close: closeSentimentModal }] = useDisclosure(false);

    // Forms
    const [newInsight, setNewInsight] = useState({ type: 'dream', content: '' });
    const [newSentiment, setNewSentiment] = useState({ sentiment: 'neutral', reason: '' });
    const [saving, setSaving] = useState(false);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch only TOFU and early MOFU leads for pre-sales
            const segments = 'tofu,mofu';
            const res = await fetch(`/api/scrm/leads?segment=${segments}&limit=100`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            // Filter to only pre-sales relevant stages
            const presalesStages = PRESALES_STAGES.map(s => s.value);
            const filteredLeads = (data.data || []).filter((l: Lead) =>
                presalesStages.includes(l.funnelStage)
            );
            setLeads(filteredLeads);
        } catch (error) {
            console.error('Error fetching leads:', error);
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível carregar os leads',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Group leads by stage
    const leadsByStage = PRESALES_STAGES.reduce((acc, stage) => {
        acc[stage.value] = leads.filter(l => l.funnelStage === stage.value);
        return acc;
    }, {} as Record<string, Lead[]>);

    // Calculate metrics
    const metrics = {
        totalLeads: leads.length,
        tofuLeads: leads.filter(l => l.funnelSegment === 'tofu').length,
        mofuLeads: leads.filter(l => l.funnelSegment === 'mofu').length,
        with3x3: leads.filter(l => l.insightDreams || l.insightHobbies || l.insightAspirations).length,
        withPersona: leads.filter(l => l.hasPersona).length,
        positivesentiment: leads.filter(l => l.currentSentiment === 'positive' || l.currentSentiment === 'enthusiastic').length,
    };

    // Filter leads by search
    const filteredBySearch = (stageLeads: Lead[]) => {
        if (!searchQuery) return stageLeads;
        const q = searchQuery.toLowerCase();
        return stageLeads.filter(l =>
            l.name.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q) ||
            l.phone?.includes(q)
        );
    };

    // Add insight handler
    const handleAddInsight = async () => {
        if (!selectedLead || !newInsight.content.trim()) return;

        try {
            setSaving(true);
            const res = await fetch(`/api/scrm/insights/${selectedLead.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newInsight.type,
                    content: newInsight.content.trim(),
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to add insight');
            }

            notifications.show({
                title: 'Sucesso',
                message: 'Insight adicionado com sucesso!',
                color: 'green',
            });

            setNewInsight({ type: 'dream', content: '' });
            closeInsightModal();
            fetchLeads();
        } catch (error: any) {
            notifications.show({
                title: 'Erro',
                message: error.message || 'Não foi possível adicionar o insight',
                color: 'red',
            });
        } finally {
            setSaving(false);
        }
    };

    // Update sentiment handler
    const handleUpdateSentiment = async () => {
        if (!selectedLead) return;

        try {
            setSaving(true);
            const res = await fetch(`/api/scrm/sentiment/analyze`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: selectedLead.id,
                    sentiment: newSentiment.sentiment,
                    reason: newSentiment.reason,
                }),
            });

            if (!res.ok) throw new Error('Failed to update sentiment');

            notifications.show({
                title: 'Sucesso',
                message: 'Sentimento atualizado!',
                color: 'green',
            });

            setNewSentiment({ sentiment: 'neutral', reason: '' });
            closeSentimentModal();
            fetchLeads();
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível atualizar o sentimento',
                color: 'red',
            });
        } finally {
            setSaving(false);
        }
    };

    // Move lead to next stage
    const handlePromoteLead = async (lead: Lead) => {
        const currentIndex = PRESALES_STAGES.findIndex(s => s.value === lead.funnelStage);
        if (currentIndex === -1 || currentIndex >= PRESALES_STAGES.length - 1) {
            // If at last pre-sales stage, hand off to sales
            notifications.show({
                title: 'Pronto para Vendas',
                message: `${lead.name} está pronto para o time de vendas!`,
                color: 'teal',
            });
            return;
        }

        const nextStage = PRESALES_STAGES[currentIndex + 1];

        try {
            const res = await fetch(`/api/scrm/leads/${lead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnelStage: nextStage.value,
                }),
            });

            if (!res.ok) throw new Error('Failed to update');

            notifications.show({
                title: 'Lead Avançado',
                message: `${lead.name} agora está em "${nextStage.label}"`,
                color: 'green',
            });

            fetchLeads();
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível avançar o lead',
                color: 'red',
            });
        }
    };

    const getSentimentBadge = (sentiment?: string) => {
        const opt = SENTIMENT_OPTIONS.find(o => o.value === sentiment);
        if (!opt) return null;
        const Icon = opt.icon;
        return (
            <Badge size="xs" color={opt.color} leftSection={<Icon size={10} />}>
                {opt.label}
            </Badge>
        );
    };

    const get3x3Count = (lead: Lead) => {
        let count = 0;
        if (lead.insightDreams) count += lead.insightDreams.split(',').length;
        if (lead.insightHobbies) count += lead.insightHobbies.split(',').length;
        if (lead.insightAspirations) count += lead.insightAspirations.split(',').length;
        return count;
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <Skeleton height={40} width={300} />
                    <Skeleton height={36} width={120} />
                </Group>
                <SimpleGrid cols={4}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={100} radius="md" />
                    ))}
                </SimpleGrid>
                <SimpleGrid cols={5}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} height={400} radius="md" />
                    ))}
                </SimpleGrid>
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/staff"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>Pré-Vendas 🎯</Title>
                    <Text c="dimmed">Qualificação de leads com 3x3 Insights</Text>
                </div>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={fetchLeads}
                    >
                        Atualizar
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/scrm"
                        variant="subtle"
                        rightSection={<IconChevronRight size={16} />}
                    >
                        Ver Pipeline Completo
                    </Button>
                </Group>
            </Group>

            {/* Metrics */}
            <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Total Leads</Text>
                            <Text size="xl" fw={700}>{metrics.totalLeads}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconUsers size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">TOFU</Text>
                            <Text size="xl" fw={700} c="blue">{metrics.tofuLeads}</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={4}
                            sections={[{ value: (metrics.tofuLeads / Math.max(metrics.totalLeads, 1)) * 100, color: 'blue' }]}
                        />
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">MOFU</Text>
                            <Text size="xl" fw={700} c="violet">{metrics.mofuLeads}</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={4}
                            sections={[{ value: (metrics.mofuLeads / Math.max(metrics.totalLeads, 1)) * 100, color: 'violet' }]}
                        />
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Com 3x3</Text>
                            <Text size="xl" fw={700} c="teal">{metrics.with3x3}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="teal">
                            <IconHeart size={20} />
                        </ThemeIcon>
                    </Group>
                    <Progress
                        value={(metrics.with3x3 / Math.max(metrics.totalLeads, 1)) * 100}
                        size="xs"
                        color="teal"
                        mt="xs"
                    />
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Positivos</Text>
                            <Text size="xl" fw={700} c="green">{metrics.positivesentiment}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconMoodSmile size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Search */}
            <TextInput
                placeholder="Buscar por nome, email ou telefone..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Kanban Board */}
            <Group align="flex-start" gap="md" style={{ overflowX: 'auto' }}>
                {PRESALES_STAGES.map(stage => {
                    const stageLeads = filteredBySearch(leadsByStage[stage.value] || []);

                    return (
                        <Card
                            key={stage.value}
                            shadow="sm"
                            radius="md"
                            p="md"
                            withBorder
                            style={{ minWidth: 280, maxWidth: 300 }}
                        >
                            <Group justify="space-between" mb="md">
                                <Group gap="xs">
                                    <Badge color={stage.color} variant="light" size="sm">
                                        {stage.segment.toUpperCase()}
                                    </Badge>
                                    <Text fw={600} size="sm">{stage.label}</Text>
                                </Group>
                                <Badge variant="filled" color={stage.color}>
                                    {stageLeads.length}
                                </Badge>
                            </Group>

                            <Stack gap="xs">
                                {stageLeads.length === 0 ? (
                                    <Text size="sm" c="dimmed" ta="center" py="xl">
                                        Nenhum lead nesta etapa
                                    </Text>
                                ) : (
                                    stageLeads.map(lead => {
                                        const insight3x3Count = get3x3Count(lead);

                                        return (
                                            <Paper key={lead.id} p="sm" withBorder radius="sm">
                                                <Group justify="space-between" mb="xs">
                                                    <Group gap="xs">
                                                        <Avatar size="sm" color="blue" radius="xl">
                                                            {lead.name.charAt(0)}
                                                        </Avatar>
                                                        <div>
                                                            <Text size="sm" fw={500} lineClamp={1}>
                                                                {lead.name}
                                                            </Text>
                                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                                {lead.email}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                </Group>

                                                {/* 3x3 and Sentiment */}
                                                <Group gap={4} mb="xs">
                                                    {getSentimentBadge(lead.currentSentiment)}
                                                    {insight3x3Count > 0 && (
                                                        <Badge size="xs" variant="outline" color="violet">
                                                            {insight3x3Count}/9 insights
                                                        </Badge>
                                                    )}
                                                    {lead.hasPersona && (
                                                        <Badge size="xs" variant="dot" color="grape">
                                                            Persona
                                                        </Badge>
                                                    )}
                                                </Group>

                                                {/* Quick 3x3 Preview */}
                                                {(lead.insightDreams || lead.insightHobbies || lead.insightAspirations) && (
                                                    <Stack gap={2} mb="xs">
                                                        {lead.insightDreams && (
                                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                                ✨ {lead.insightDreams.split(',')[0]}
                                                            </Text>
                                                        )}
                                                        {lead.insightHobbies && (
                                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                                🎨 {lead.insightHobbies.split(',')[0]}
                                                            </Text>
                                                        )}
                                                        {lead.insightAspirations && (
                                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                                🎯 {lead.insightAspirations.split(',')[0]}
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                )}

                                                <Divider my="xs" />

                                                {/* Actions */}
                                                <Group gap={4} justify="space-between">
                                                    <Group gap={4}>
                                                        <Tooltip label="WhatsApp">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="light"
                                                                color="green"
                                                                component="a"
                                                                href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`}
                                                                target="_blank"
                                                            >
                                                                <IconBrandWhatsapp size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Ligar">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="light"
                                                                color="blue"
                                                                component="a"
                                                                href={`tel:${lead.phone}`}
                                                            >
                                                                <IconPhone size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Email">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="light"
                                                                color="violet"
                                                                component="a"
                                                                href={`mailto:${lead.email}`}
                                                            >
                                                                <IconMail size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>

                                                    <Group gap={4}>
                                                        <Tooltip label="Adicionar Insight">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="light"
                                                                color="teal"
                                                                onClick={() => {
                                                                    setSelectedLead(lead);
                                                                    openInsightModal();
                                                                }}
                                                            >
                                                                <IconHeart size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Atualizar Sentimento">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="light"
                                                                color="orange"
                                                                onClick={() => {
                                                                    setSelectedLead(lead);
                                                                    setNewSentiment({
                                                                        sentiment: lead.currentSentiment || 'neutral',
                                                                        reason: ''
                                                                    });
                                                                    openSentimentModal();
                                                                }}
                                                            >
                                                                <IconMoodSmile size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Avançar Etapa">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="filled"
                                                                color={stage.color}
                                                                onClick={() => handlePromoteLead(lead)}
                                                            >
                                                                <IconChevronRight size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                </Group>
                                            </Paper>
                                        );
                                    })
                                )}
                            </Stack>
                        </Card>
                    );
                })}
            </Group>

            {/* Add Insight Modal */}
            <Modal
                opened={insightModalOpened}
                onClose={closeInsightModal}
                title={
                    <Group gap="xs">
                        <IconHeart size={20} />
                        <Text fw={600}>Adicionar Insight 3x3</Text>
                    </Group>
                }
                size="md"
            >
                {selectedLead && (
                    <Stack gap="md">
                        <Paper p="sm" withBorder radius="sm">
                            <Group gap="xs">
                                <Avatar size="sm" color="blue" radius="xl">
                                    {selectedLead.name.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{selectedLead.name}</Text>
                                    <Text size="xs" c="dimmed">{selectedLead.email}</Text>
                                </div>
                            </Group>
                        </Paper>

                        <Select
                            label="Tipo de Insight"
                            data={INSIGHT_TYPES.map(t => ({
                                value: t.value,
                                label: `${t.emoji} ${t.label}`,
                            }))}
                            value={newInsight.type}
                            onChange={(v) => setNewInsight(prev => ({ ...prev, type: v || 'dream' }))}
                        />

                        <Textarea
                            label="O que você descobriu?"
                            placeholder={
                                newInsight.type === 'dream'
                                    ? "Ex: Quer viajar para os EUA e falar inglês fluente..."
                                    : newInsight.type === 'hobby'
                                        ? "Ex: Gosta de assistir séries em inglês..."
                                        : "Ex: Quer uma promoção no trabalho..."
                            }
                            value={newInsight.content}
                            onChange={(e) => setNewInsight(prev => ({ ...prev, content: e.target.value }))}
                            rows={3}
                        />

                        <Text size="xs" c="dimmed">
                            💡 Insights ajudam a personalizar o atendimento.
                            São os sonhos, hobbies e aspirações que tornam cada lead único.
                        </Text>

                        <Group justify="flex-end">
                            <Button variant="subtle" onClick={closeInsightModal}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleAddInsight}
                                loading={saving}
                                disabled={!newInsight.content.trim()}
                            >
                                Salvar Insight
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Update Sentiment Modal */}
            <Modal
                opened={sentimentModalOpened}
                onClose={closeSentimentModal}
                title={
                    <Group gap="xs">
                        <IconMoodSmile size={20} />
                        <Text fw={600}>Atualizar Sentimento</Text>
                    </Group>
                }
                size="md"
            >
                {selectedLead && (
                    <Stack gap="md">
                        <Paper p="sm" withBorder radius="sm">
                            <Group gap="xs">
                                <Avatar size="sm" color="blue" radius="xl">
                                    {selectedLead.name.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{selectedLead.name}</Text>
                                    <Text size="xs" c="dimmed">
                                        Sentimento atual: {getSentimentBadge(selectedLead.currentSentiment) || 'Não definido'}
                                    </Text>
                                </div>
                            </Group>
                        </Paper>

                        <Select
                            label="Novo Sentimento"
                            data={SENTIMENT_OPTIONS.map(s => ({
                                value: s.value,
                                label: s.label,
                            }))}
                            value={newSentiment.sentiment}
                            onChange={(v) => setNewSentiment(prev => ({ ...prev, sentiment: v || 'neutral' }))}
                        />

                        <Textarea
                            label="Motivo (opcional)"
                            placeholder="O que aconteceu na conversa?"
                            value={newSentiment.reason}
                            onChange={(e) => setNewSentiment(prev => ({ ...prev, reason: e.target.value }))}
                            rows={2}
                        />

                        <Group justify="flex-end">
                            <Button variant="subtle" onClick={closeSentimentModal}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUpdateSentiment}
                                loading={saving}
                            >
                                Atualizar
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

