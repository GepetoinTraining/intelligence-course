'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Paper, ThemeIcon, Progress, Modal, TextInput, Textarea,
    Select, Avatar, ActionIcon, Tooltip, Skeleton, NumberInput,
    RingProgress, Divider, Table, Accordion
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconCash, IconBrain, IconCalendarEvent, IconTarget,
    IconPhone, IconMail, IconBrandWhatsapp, IconFileInvoice,
    IconMoodSmile, IconMoodSad, IconMoodNeutral, IconRefresh,
    IconArrowLeft, IconChevronRight, IconSearch, IconCheck,
    IconX, IconTrendingUp, IconUsers, IconClock, IconSparkles,
    IconPercentage
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

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
    // Deal fields (would need to be added to schema)
    dealValue?: number;
    expectedCloseDate?: string;
}

// Sales focuses on late MOFU and BOFU stages
const SALES_STAGES = [
    { value: 'more_information', label: 'Mais Informações', segment: 'mofu', color: 'grape' },
    { value: 'events_invitations', label: 'Eventos/Convites', segment: 'mofu', color: 'violet' },
    { value: 'appointments', label: 'Agendamentos', segment: 'bofu', color: 'orange' },
    { value: 'negotiation', label: 'Negociação', segment: 'bofu', color: 'yellow' },
    { value: 'counters', label: 'Contrapropostas', segment: 'bofu', color: 'red' },
];

const OUTCOME_STAGES = [
    { value: 'won', label: 'Ganho', color: 'green' },
    { value: 'lost', label: 'Pausado', color: 'gray' },
];

const SENTIMENT_OPTIONS = [
    { value: 'enthusiastic', label: 'Entusiasmado', color: 'green', icon: IconMoodSmile },
    { value: 'positive', label: 'Positivo', color: 'teal', icon: IconMoodSmile },
    { value: 'neutral', label: 'Neutro', color: 'gray', icon: IconMoodNeutral },
    { value: 'hesitant', label: 'Hesitante', color: 'yellow', icon: IconMoodSad },
    { value: 'negative', label: 'Negativo', color: 'red', icon: IconMoodSad },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SalesPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [closeModalOpened, { open: openCloseModal, close: closeCloseModal }] = useDisclosure(false);
    const [personaModalOpened, { open: openPersonaModal, close: closePersonaModal }] = useDisclosure(false);

    // Forms
    const [closeAs, setCloseAs] = useState<'won' | 'lost'>('won');
    const [dealValue, setDealValue] = useState<number | string>(0);
    const [persona, setPersona] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [generatingPersona, setGeneratingPersona] = useState(false);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch MOFU and BOFU leads for sales
            const segments = 'mofu,bofu';
            const res = await fetch(`/api/scrm/leads?segment=${segments}&limit=100`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            // Filter to only sales-relevant stages
            const salesStages = SALES_STAGES.map(s => s.value);
            const filteredLeads = (data.data || []).filter((l: Lead) =>
                salesStages.includes(l.funnelStage)
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
    const leadsByStage = SALES_STAGES.reduce((acc, stage) => {
        acc[stage.value] = leads.filter(l => l.funnelStage === stage.value);
        return acc;
    }, {} as Record<string, Lead[]>);

    // Calculate metrics
    const metrics = {
        totalDeals: leads.length,
        mofuLeads: leads.filter(l => l.funnelSegment === 'mofu').length,
        bofuLeads: leads.filter(l => l.funnelSegment === 'bofu').length,
        inNegotiation: leads.filter(l => l.funnelStage === 'negotiation' || l.funnelStage === 'counters').length,
        appointments: leads.filter(l => l.funnelStage === 'appointments').length,
        pipelineValue: leads.reduce((sum, l) => sum + (l.dealValue || 500), 0), // Placeholder value
        withPersona: leads.filter(l => l.hasPersona).length,
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

    // Move lead to next stage
    const handlePromoteLead = async (lead: Lead) => {
        const currentIndex = SALES_STAGES.findIndex(s => s.value === lead.funnelStage);
        if (currentIndex === -1 || currentIndex >= SALES_STAGES.length - 1) {
            // At last stage, open close modal
            setSelectedLead(lead);
            openCloseModal();
            return;
        }

        const nextStage = SALES_STAGES[currentIndex + 1];

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

    // Close deal
    const handleCloseDeal = async () => {
        if (!selectedLead) return;

        try {
            setSaving(true);
            const res = await fetch(`/api/scrm/leads/${selectedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    funnelStage: closeAs,
                }),
            });

            if (!res.ok) throw new Error('Failed to close');

            notifications.show({
                title: closeAs === 'won' ? '🎉 Venda Fechada!' : 'Lead Pausado',
                message: closeAs === 'won'
                    ? `Parabéns! ${selectedLead.name} foi convertido.`
                    : `${selectedLead.name} foi movido para pausados.`,
                color: closeAs === 'won' ? 'green' : 'gray',
            });

            closeCloseModal();
            fetchLeads();
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível fechar o deal',
                color: 'red',
            });
        } finally {
            setSaving(false);
        }
    };

    // Generate persona
    const handleGeneratePersona = async () => {
        if (!selectedLead) return;

        try {
            setGeneratingPersona(true);
            const res = await fetch('/api/scrm/persona/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId: selectedLead.id }),
            });

            if (!res.ok) throw new Error('Failed to generate');

            const data = await res.json();
            setPersona(data.data);

            notifications.show({
                title: 'Persona Gerada',
                message: 'A persona AI foi criada com sucesso!',
                color: 'green',
            });

            fetchLeads();
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível gerar a persona',
                color: 'red',
            });
        } finally {
            setGeneratingPersona(false);
        }
    };

    // Fetch existing persona
    const handleViewPersona = async (lead: Lead) => {
        setSelectedLead(lead);
        setPersona(null);
        openPersonaModal();

        if (lead.hasPersona) {
            try {
                const res = await fetch(`/api/scrm/persona/generate?leadId=${lead.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setPersona(data.data);
                }
            } catch (error) {
                console.error('Error fetching persona:', error);
            }
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

    const get3x3Summary = (lead: Lead) => {
        const items = [];
        if (lead.insightDreams) items.push(`✨ ${lead.insightDreams.split(',')[0]}`);
        if (lead.insightHobbies) items.push(`🎨 ${lead.insightHobbies.split(',')[0]}`);
        if (lead.insightAspirations) items.push(`🎯 ${lead.insightAspirations.split(',')[0]}`);
        return items;
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <Skeleton height={40} width={300} />
                    <Skeleton height={36} width={120} />
                </Group>
                <SimpleGrid cols={5}>
                    {[1, 2, 3, 4, 5].map(i => (
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
                    <Title order={2}>Vendas 💰</Title>
                    <Text c="dimmed">Negociação e fechamento de deals</Text>
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
                        href="/staff/presales"
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                    >
                        Pré-Vendas
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/scrm"
                        variant="subtle"
                        rightSection={<IconChevronRight size={16} />}
                    >
                        Pipeline Completo
                    </Button>
                </Group>
            </Group>

            {/* Metrics */}
            <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Pipeline Total</Text>
                            <Text size="xl" fw={700}>{metrics.totalDeals}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconUsers size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Em BOFU</Text>
                            <Text size="xl" fw={700} c="orange">{metrics.bofuLeads}</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={4}
                            sections={[{ value: (metrics.bofuLeads / Math.max(metrics.totalDeals, 1)) * 100, color: 'orange' }]}
                        />
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Agendamentos</Text>
                            <Text size="xl" fw={700} c="violet">{metrics.appointments}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="violet">
                            <IconCalendarEvent size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Em Negociação</Text>
                            <Text size="xl" fw={700} c="yellow">{metrics.inNegotiation}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="yellow">
                            <IconCash size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder style={{ background: 'linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-teal-0))' }}>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Valor Pipeline</Text>
                            <Text size="xl" fw={700} c="green">
                                R$ {metrics.pipelineValue.toLocaleString('pt-BR')}
                            </Text>
                        </div>
                        <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
                            <IconTrendingUp size={20} />
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
                {SALES_STAGES.map(stage => {
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
                                        const insights3x3 = get3x3Summary(lead);

                                        return (
                                            <Paper key={lead.id} p="sm" withBorder radius="sm">
                                                <Group justify="space-between" mb="xs">
                                                    <Group gap="xs">
                                                        <Avatar size="sm" color={stage.color} radius="xl">
                                                            {lead.name.charAt(0)}
                                                        </Avatar>
                                                        <div>
                                                            <Text size="sm" fw={500} lineClamp={1}>
                                                                {lead.name}
                                                            </Text>
                                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                                {lead.phone || lead.email}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                </Group>

                                                {/* Deal value placeholder */}
                                                <Group gap={4} mb="xs">
                                                    <Badge size="xs" variant="light" color="green" leftSection="R$">
                                                        {(lead.dealValue || 500).toLocaleString('pt-BR')}
                                                    </Badge>
                                                    {getSentimentBadge(lead.currentSentiment)}
                                                </Group>

                                                {/* 3x3 Quick View */}
                                                {insights3x3.length > 0 && (
                                                    <Paper p="xs" radius="sm" withBorder mb="xs" bg="gray.0">
                                                        <Text size="xs" c="dimmed" fw={500} mb={4}>
                                                            Insights para negociação:
                                                        </Text>
                                                        {insights3x3.slice(0, 2).map((item, i) => (
                                                            <Text key={i} size="xs" c="dimmed" lineClamp={1}>
                                                                {item}
                                                            </Text>
                                                        ))}
                                                    </Paper>
                                                )}

                                                {/* Persona indicator */}
                                                {lead.hasPersona && (
                                                    <Badge
                                                        size="xs"
                                                        variant="gradient"
                                                        gradient={{ from: 'violet', to: 'grape' }}
                                                        leftSection={<IconBrain size={10} />}
                                                        fullWidth
                                                        mb="xs"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleViewPersona(lead)}
                                                    >
                                                        Ver Persona AI
                                                    </Badge>
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
                                                        {!lead.hasPersona && (
                                                            <Tooltip label="Gerar Persona AI">
                                                                <ActionIcon
                                                                    size="sm"
                                                                    variant="light"
                                                                    color="grape"
                                                                    onClick={() => {
                                                                        setSelectedLead(lead);
                                                                        openPersonaModal();
                                                                    }}
                                                                >
                                                                    <IconBrain size={14} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </Group>

                                                    <Group gap={4}>
                                                        <Tooltip label="Pausar">
                                                            <ActionIcon
                                                                size="sm"
                                                                variant="light"
                                                                color="gray"
                                                                onClick={() => {
                                                                    setSelectedLead(lead);
                                                                    setCloseAs('lost');
                                                                    openCloseModal();
                                                                }}
                                                            >
                                                                <IconX size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        {stage.value === 'counters' ? (
                                                            <Tooltip label="Fechar Venda">
                                                                <ActionIcon
                                                                    size="sm"
                                                                    variant="gradient"
                                                                    gradient={{ from: 'green', to: 'teal' }}
                                                                    onClick={() => {
                                                                        setSelectedLead(lead);
                                                                        setCloseAs('won');
                                                                        openCloseModal();
                                                                    }}
                                                                >
                                                                    <IconCheck size={14} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        ) : (
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
                                                        )}
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

            {/* Close Deal Modal */}
            <Modal
                opened={closeModalOpened}
                onClose={closeCloseModal}
                title={
                    <Group gap="xs">
                        {closeAs === 'won' ? <IconCheck size={20} color="green" /> : <IconX size={20} />}
                        <Text fw={600}>{closeAs === 'won' ? 'Fechar Venda' : 'Pausar Lead'}</Text>
                    </Group>
                }
                size="md"
            >
                {selectedLead && (
                    <Stack gap="md">
                        <Paper p="md" withBorder radius="sm" bg={closeAs === 'won' ? 'green.0' : 'gray.0'}>
                            <Group gap="xs">
                                <Avatar size="md" color={closeAs === 'won' ? 'green' : 'gray'} radius="xl">
                                    {selectedLead.name.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{selectedLead.name}</Text>
                                    <Text size="xs" c="dimmed">{selectedLead.email}</Text>
                                </div>
                            </Group>
                        </Paper>

                        <Select
                            label="Resultado"
                            data={[
                                { value: 'won', label: '✅ Venda Fechada' },
                                { value: 'lost', label: '⏸️ Pausado (para retomar depois)' },
                            ]}
                            value={closeAs}
                            onChange={(v) => setCloseAs(v as 'won' | 'lost')}
                        />

                        {closeAs === 'won' && (
                            <NumberInput
                                label="Valor da Venda (R$)"
                                value={dealValue}
                                onChange={setDealValue}
                                min={0}
                                step={100}
                                prefix="R$ "
                                thousandSeparator="."
                                decimalSeparator=","
                            />
                        )}

                        {closeAs === 'lost' && (
                            <Text size="sm" c="dimmed">
                                💡 Leads pausados não são deletados. Você pode retomá-los quando o timing melhorar.
                                Os insights 3x3 permanecem para facilitar a reconexão.
                            </Text>
                        )}

                        <Group justify="flex-end">
                            <Button variant="subtle" onClick={closeCloseModal}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCloseDeal}
                                loading={saving}
                                color={closeAs === 'won' ? 'green' : 'gray'}
                                leftSection={closeAs === 'won' ? <IconCheck size={16} /> : <IconX size={16} />}
                            >
                                {closeAs === 'won' ? 'Confirmar Venda' : 'Pausar Lead'}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Persona Modal */}
            <Modal
                opened={personaModalOpened}
                onClose={closePersonaModal}
                title={
                    <Group gap="xs">
                        <IconBrain size={20} />
                        <Text fw={600}>Persona AI</Text>
                    </Group>
                }
                size="lg"
            >
                {selectedLead && (
                    <Stack gap="md">
                        <Paper p="md" withBorder radius="sm">
                            <Group gap="xs">
                                <Avatar size="md" color="grape" radius="xl">
                                    {selectedLead.name.charAt(0)}
                                </Avatar>
                                <div>
                                    <Text size="sm" fw={500}>{selectedLead.name}</Text>
                                    <Text size="xs" c="dimmed">{selectedLead.email}</Text>
                                </div>
                            </Group>
                        </Paper>

                        {!persona && !selectedLead.hasPersona && (
                            <Paper p="lg" withBorder radius="md" ta="center">
                                <IconSparkles size={40} color="var(--mantine-color-grape-6)" style={{ marginBottom: 12 }} />
                                <Text fw={500} mb="xs">Nenhuma persona gerada ainda</Text>
                                <Text size="sm" c="dimmed" mb="md">
                                    A persona AI é criada a partir dos insights 3x3 do lead.
                                    Ela ajuda a personalizar a abordagem de vendas.
                                </Text>
                                <Button
                                    onClick={handleGeneratePersona}
                                    loading={generatingPersona}
                                    leftSection={<IconBrain size={16} />}
                                    variant="gradient"
                                    gradient={{ from: 'violet', to: 'grape' }}
                                >
                                    Gerar Persona AI
                                </Button>
                            </Paper>
                        )}

                        {persona && (
                            <Accordion variant="separated">
                                <Accordion.Item value="profile">
                                    <Accordion.Control icon={<IconUsers size={16} />}>
                                        Perfil de Personalidade
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Text size="sm">{persona.personalityProfile}</Text>
                                    </Accordion.Panel>
                                </Accordion.Item>

                                <Accordion.Item value="communication">
                                    <Accordion.Control icon={<IconBrandWhatsapp size={16} />}>
                                        Estilo de Comunicação
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Text size="sm">{persona.communicationStyle}</Text>
                                    </Accordion.Panel>
                                </Accordion.Item>

                                <Accordion.Item value="starters">
                                    <Accordion.Control icon={<IconTarget size={16} />}>
                                        Iniciadores de Conversa
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Stack gap="xs">
                                            {persona.conversationStarters?.map((starter: string, i: number) => (
                                                <Paper key={i} p="xs" withBorder radius="sm">
                                                    <Text size="sm">💬 "{starter}"</Text>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>

                                {persona.approachRecommendations && (
                                    <Accordion.Item value="approach">
                                        <Accordion.Control icon={<IconTrendingUp size={16} />}>
                                            Recomendações de Abordagem
                                        </Accordion.Control>
                                        <Accordion.Panel>
                                            <Text size="sm">{persona.approachRecommendations}</Text>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                )}
                            </Accordion>
                        )}
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

