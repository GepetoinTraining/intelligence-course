'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Stack, Group, Text, Button, Loader, Paper, Breadcrumbs, Anchor,
    Modal, TextInput, Select, Textarea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconArrowLeft, IconChevronRight
} from '@tabler/icons-react';
import Link from 'next/link';
import { SCRMExpandedView } from '@/components/scrm/SCRMExpandedView';
import type { SCRMProfile } from '@/components/scrm/SCRMProfileModal';

// ============================================================================
// MOCK DATA (for dev mode when API unavailable)
// ============================================================================

const MOCK_PROFILES: Record<string, SCRMProfile> = {
    '1': {
        id: '1',
        name: 'Maria Silva',
        email: 'maria@email.com',
        phone: '(11) 99999-1234',
        whatsapp: '5511999991234',
        source: 'instagram',
        funnelStage: 'interested',
        funnelSegment: 'tofu',
        currentSentiment: 'positive',
        insightDreams: ['Viajar para o exterior', 'Trabalhar em multinacional'],
        insightHobbies: ['Séries em inglês', 'Yoga'],
        insightAspirations: ['Fluência em 1 ano'],
        hasPersona: true,
        personaGeneratedAt: Date.now() - 86400000,
        createdAt: Date.now() - 604800000,
        updatedAt: Date.now() - 3600000,
    },
    '2': {
        id: '2',
        name: 'João Santos',
        email: 'joao@empresa.com.br',
        phone: '(21) 98888-5678',
        whatsapp: '5521988885678',
        source: 'google',
        funnelStage: 'qualifying',
        funnelSegment: 'mofu',
        currentSentiment: 'neutral',
        insightDreams: ['Promoção no trabalho'],
        insightHobbies: [],
        insightAspirations: [],
        hasPersona: false,
        personaGeneratedAt: null,
        createdAt: Date.now() - 1209600000,
        updatedAt: Date.now() - 7200000,
    },
    '3': {
        id: '3',
        name: 'Ana Costa',
        email: 'ana.costa@gmail.com',
        phone: '(31) 97777-9012',
        whatsapp: null,
        source: 'referral',
        funnelStage: 'appointments',
        funnelSegment: 'bofu',
        currentSentiment: 'enthusiastic',
        insightDreams: ['Morar fora', 'Doutorado no exterior', 'Ensinar os filhos'],
        insightHobbies: ['Leitura', 'Filmes', 'Culinária'],
        insightAspirations: ['Certificação Cambridge', 'Viagem em família', 'Carreira internacional'],
        hasPersona: true,
        personaGeneratedAt: Date.now() - 172800000,
        createdAt: Date.now() - 2592000000,
        updatedAt: Date.now() - 1800000,
    },
    '4': {
        id: '4',
        name: 'Pedro Oliveira',
        email: 'pedro@email.com',
        phone: '(11) 96666-3456',
        whatsapp: '5511966663456',
        source: 'facebook',
        funnelStage: 'small_engagement',
        funnelSegment: 'tofu',
        currentSentiment: 'hesitant',
        insightDreams: [],
        insightHobbies: [],
        insightAspirations: [],
        hasPersona: false,
        personaGeneratedAt: null,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
    },
    '5': {
        id: '5',
        name: 'Carla Mendes',
        email: 'carla.m@hotmail.com',
        phone: '(19) 95555-7890',
        whatsapp: '5519955557890',
        source: 'event',
        funnelStage: 'negotiation',
        funnelSegment: 'bofu',
        currentSentiment: 'positive',
        insightDreams: ['Intercâmbio do filho'],
        insightHobbies: ['Música', 'Viagens'],
        insightAspirations: ['Educação bilíngue'],
        hasPersona: false,
        personaGeneratedAt: null,
        createdAt: Date.now() - 1814400000,
        updatedAt: Date.now() - 14400000,
    },
    '6': {
        id: '6',
        name: 'Roberto Lima',
        email: 'roberto@corporate.com',
        phone: '(11) 94444-1111',
        whatsapp: null,
        source: 'walk_in',
        funnelStage: 'more_information',
        funnelSegment: 'mofu',
        currentSentiment: 'neutral',
        insightDreams: ['Business English'],
        insightHobbies: ['Golf', 'Networking'],
        insightAspirations: [],
        hasPersona: false,
        personaGeneratedAt: null,
        createdAt: Date.now() - 604800000,
        updatedAt: Date.now() - 259200000,
    },
    '7': {
        id: '7',
        name: 'Fernanda Gomes',
        email: 'fer.gomes@email.com',
        phone: '(21) 93333-2222',
        whatsapp: '5521933332222',
        source: 'instagram',
        funnelStage: 'won',
        funnelSegment: 'outcome',
        currentSentiment: 'enthusiastic',
        insightDreams: ['Fluência total', 'Viagem dos sonhos', 'Nova carreira'],
        insightHobbies: ['Dança', 'Cinema', 'Podcasts'],
        insightAspirations: ['IELTS 7.0', 'Trabalho remoto', 'Mestrado'],
        hasPersona: true,
        personaGeneratedAt: Date.now() - 604800000,
        createdAt: Date.now() - 7776000000,
        updatedAt: Date.now() - 86400000,
    },
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SCRMLeadDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const leadId = params.id as string;

    const [profile, setProfile] = useState<SCRMProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    // Add Insight Modal
    const [insightModalOpened, { open: openInsightModal, close: closeInsightModal }] = useDisclosure(false);
    const [insightType, setInsightType] = useState<'dream' | 'hobby' | 'aspiration'>('dream');
    const [insightContent, setInsightContent] = useState('');

    // Fetch lead data
    const fetchLead = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/scrm/leads/${leadId}`);
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();

            // Parse JSON fields
            const enrichedProfile: SCRMProfile = {
                ...data.data,
                insightDreams: data.data.insightDreams ? JSON.parse(data.data.insightDreams) : [],
                insightHobbies: data.data.insightHobbies ? JSON.parse(data.data.insightHobbies) : [],
                insightAspirations: data.data.insightAspirations ? JSON.parse(data.data.insightAspirations) : [],
            };

            setProfile(enrichedProfile);
            setIsDemo(false);
        } catch (error) {
            console.error('Error fetching lead, using mock data:', error);

            // Use mock data as fallback
            const mockProfile = MOCK_PROFILES[leadId];
            if (mockProfile) {
                setProfile(mockProfile);
                setIsDemo(true);
                notifications.show({
                    title: '📋 Modo Demo',
                    message: 'Exibindo dados de demonstração',
                    color: 'blue',
                });
            } else {
                notifications.show({
                    title: 'Erro',
                    message: 'Lead não encontrado',
                    color: 'red',
                });
                router.push('/staff/scrm');
            }
        } finally {
            setLoading(false);
        }
    }, [leadId, router]);

    useEffect(() => {
        if (leadId) {
            fetchLead();
        }
    }, [leadId, fetchLead]);

    // Action handlers
    const handleUpdateSentiment = async (sentiment: string) => {
        if (isDemo) {
            // Update local state for demo mode
            setProfile(prev => prev ? { ...prev, currentSentiment: sentiment } : null);
            notifications.show({
                title: '✅ Demo',
                message: `Sentimento atualizado para ${sentiment}`,
                color: 'green',
            });
            return;
        }

        try {
            const res = await fetch(`/api/scrm/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentSentiment: sentiment }),
            });
            if (!res.ok) throw new Error('Failed to update');
            fetchLead();
            notifications.show({
                title: 'Sucesso',
                message: 'Sentimento atualizado',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível atualizar',
                color: 'red',
            });
        }
    };

    const handleAddInsight = (type: 'dream' | 'hobby' | 'aspiration', _content: string) => {
        setInsightType(type);
        setInsightContent('');
        openInsightModal();
    };

    const submitInsight = async () => {
        if (!insightContent.trim()) return;

        if (isDemo) {
            // Update local state for demo mode
            setProfile(prev => {
                if (!prev) return null;
                const key = insightType === 'dream' ? 'insightDreams'
                    : insightType === 'hobby' ? 'insightHobbies'
                        : 'insightAspirations';
                const current = prev[key] || [];
                if (current.length >= 3) {
                    notifications.show({
                        title: 'Limite atingido',
                        message: `Máximo de 3 ${key === 'insightDreams' ? 'sonhos' : key === 'insightHobbies' ? 'hobbies' : 'aspirações'}`,
                        color: 'yellow',
                    });
                    return prev;
                }
                return { ...prev, [key]: [...current, insightContent.trim()] };
            });
            closeInsightModal();
            notifications.show({
                title: '✅ Demo',
                message: 'Insight adicionado',
                color: 'green',
            });
            return;
        }

        try {
            const res = await fetch(`/api/scrm/leads/${leadId}/insights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: insightType, content: insightContent.trim() }),
            });
            if (!res.ok) throw new Error('Failed to add insight');
            fetchLead();
            closeInsightModal();
            notifications.show({
                title: 'Sucesso',
                message: 'Insight adicionado',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível adicionar o insight',
                color: 'red',
            });
        }
    };

    const handleGeneratePersona = async () => {
        if (isDemo) {
            setProfile(prev => prev ? {
                ...prev,
                hasPersona: true,
                personaGeneratedAt: Date.now()
            } : null);
            notifications.show({
                title: '🧠 Demo',
                message: 'Persona AI gerada com sucesso!',
                color: 'violet',
            });
            return;
        }

        try {
            notifications.show({
                title: 'Gerando Persona',
                message: 'Isso pode levar alguns segundos...',
                color: 'blue',
                loading: true,
                id: 'persona-gen',
            });

            const res = await fetch(`/api/scrm/persona/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId }),
            });
            if (!res.ok) throw new Error('Failed to generate persona');

            fetchLead();
            notifications.update({
                id: 'persona-gen',
                title: 'Sucesso',
                message: 'Persona AI gerada com sucesso!',
                color: 'green',
                loading: false,
            });
        } catch (error) {
            notifications.update({
                id: 'persona-gen',
                title: 'Erro',
                message: 'Não foi possível gerar a persona',
                color: 'red',
                loading: false,
            });
        }
    };

    const handleMoveStage = async (stage: string) => {
        if (isDemo) {
            const segmentMap: Record<string, string> = {
                'small_engagement': 'tofu', 'comments_conversations': 'tofu', 'interested': 'tofu',
                'qualifying': 'mofu', 'more_information': 'mofu', 'events_invitations': 'mofu',
                'appointments': 'bofu', 'negotiation': 'bofu', 'counters': 'bofu',
                'won': 'outcome', 'lost': 'outcome',
            };
            setProfile(prev => prev ? {
                ...prev,
                funnelStage: stage,
                funnelSegment: segmentMap[stage] || prev.funnelSegment,
            } : null);
            notifications.show({
                title: '✅ Demo',
                message: `Movido para ${stage}`,
                color: 'green',
            });
            return;
        }

        try {
            const res = await fetch(`/api/scrm/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funnelStage: stage }),
            });
            if (!res.ok) throw new Error('Failed to move stage');
            fetchLead();
            notifications.show({
                title: 'Sucesso',
                message: 'Lead movido para nova etapa',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível mover o lead',
                color: 'red',
            });
        }
    };

    // Loading state
    if (loading) {
        return (
            <Stack align="center" justify="center" h={400}>
                <Loader size="lg" />
                <Text c="dimmed">Carregando perfil...</Text>
            </Stack>
        );
    }

    // Not found
    if (!profile) {
        return (
            <Paper p="xl" ta="center">
                <Text size="lg" fw={500} mb="md">Lead não encontrado</Text>
                <Button component={Link} href="/staff/scrm">
                    Voltar para Pipeline
                </Button>
            </Paper>
        );
    }

    const insightLabels = {
        dream: { emoji: '💭', label: 'Sonho' },
        hobby: { emoji: '🎯', label: 'Hobby' },
        aspiration: { emoji: '🌟', label: 'Aspiração' },
    };

    return (
        <Stack gap="lg">
            {/* Breadcrumbs */}
            <Group justify="space-between">
                <Breadcrumbs separator={<IconChevronRight size={14} />}>
                    <Anchor component={Link} href="/staff" size="sm">
                        Staff
                    </Anchor>
                    <Anchor component={Link} href="/staff/scrm" size="sm">
                        Pipeline SCRM
                    </Anchor>
                    <Text size="sm" c="dimmed">{profile.name}</Text>
                </Breadcrumbs>
                <Button
                    variant="light"
                    leftSection={<IconArrowLeft size={16} />}
                    component={Link}
                    href="/staff/scrm"
                >
                    Voltar
                </Button>
            </Group>

            {/* Demo Mode Banner */}
            {isDemo && (
                <Paper p="sm" bg="blue.0" radius="md" withBorder>
                    <Group gap="xs">
                        <Text size="sm">📋</Text>
                        <Text size="sm" c="blue">
                            Modo demonstração - alterações são locais apenas
                        </Text>
                    </Group>
                </Paper>
            )}

            {/* Main Content */}
            <SCRMExpandedView
                profile={profile}
                onUpdateSentiment={handleUpdateSentiment}
                onAddInsight={handleAddInsight}
                onGeneratePersona={handleGeneratePersona}
                onMoveStage={handleMoveStage}
            />

            {/* Add Insight Modal */}
            <Modal
                opened={insightModalOpened}
                onClose={closeInsightModal}
                title={
                    <Group gap="xs">
                        <Text>{insightLabels[insightType].emoji}</Text>
                        <Text fw={600}>Adicionar {insightLabels[insightType].label}</Text>
                    </Group>
                }
            >
                <Stack>
                    <Select
                        label="Tipo de Insight"
                        value={insightType}
                        onChange={(v) => setInsightType(v as typeof insightType)}
                        data={[
                            { value: 'dream', label: '💭 Sonho' },
                            { value: 'hobby', label: '🎯 Hobby' },
                            { value: 'aspiration', label: '🌟 Aspiração' },
                        ]}
                    />
                    <Textarea
                        label="Conteúdo"
                        placeholder={`Descreva o ${insightLabels[insightType].label.toLowerCase()} do lead...`}
                        value={insightContent}
                        onChange={(e) => setInsightContent(e.target.value)}
                        minRows={3}
                        required
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeInsightModal}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={submitInsight}
                            disabled={!insightContent.trim()}
                        >
                            Adicionar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
