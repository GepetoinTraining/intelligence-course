'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Tabs, Select, TextInput, Modal,
    Avatar, Progress, Divider, Tooltip, Skeleton, Accordion,
    Textarea, RingProgress, Loader, Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconUsers, IconSparkles, IconMessageCircle, IconCheck,
    IconSearch, IconFilter, IconUser, IconPhone, IconMail,
    IconBrandWhatsapp, IconCalendarEvent, IconTarget, IconStar,
    IconHeart, IconBulb, IconTrophy, IconMoodSmile, IconMoodNeutral,
    IconMoodSad, IconMoodHappy, IconBrain, IconRefresh, IconPlus,
    IconChartBar, IconArrowRight, IconX, IconEye
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    source: string | null;
    funnelStage: string | null;
    funnelSegment: string | null;
    currentSentiment: string | null;
    insightDreams: string[];
    insightHobbies: string[];
    insightAspirations: string[];
    hasPersona: boolean;
    personaGeneratedAt: number | null;
    assignedTo: string | null;
    lastContactAt: number | null;
    nextFollowupAt: number | null;
    createdAt: number | null;
    updatedAt: number | null;
    insights3x3Complete: boolean;
}

interface FunnelCounts {
    tofu: number;
    mofu: number;
    bofu: number;
    outcome: number;
}

interface StageCounts {
    [key: string]: number;
}

// ============================================================================
// FUNNEL CONFIGURATION (11-stage topology)
// ============================================================================

const FUNNEL_STAGES = {
    // TOFU - Awareness Field
    small_engagement: { label: 'Pequenos Engajamentos', color: 'blue', segment: 'tofu', icon: <IconSparkles size={14} /> },
    comments_conversations: { label: 'Comentários/Conversas', color: 'cyan', segment: 'tofu', icon: <IconMessageCircle size={14} /> },
    interested: { label: 'Interessados', color: 'teal', segment: 'tofu', icon: <IconStar size={14} /> },
    // MOFU - Consideration Field
    qualifying: { label: 'Qualificando', color: 'violet', segment: 'mofu', icon: <IconTarget size={14} /> },
    more_information: { label: 'Mais Informações', color: 'grape', segment: 'mofu', icon: <IconBulb size={14} /> },
    events_invitations: { label: 'Eventos/Convites', color: 'pink', segment: 'mofu', icon: <IconCalendarEvent size={14} /> },
    // BOFU - Decision Field
    appointments: { label: 'Agendamentos', color: 'orange', segment: 'bofu', icon: <IconCalendarEvent size={14} /> },
    negotiation: { label: 'Negociação', color: 'yellow', segment: 'bofu', icon: <IconTarget size={14} /> },
    counters: { label: 'Contrapropostas', color: 'lime', segment: 'bofu', icon: <IconArrowRight size={14} /> },
    // Outcomes
    won: { label: 'Ganho ✅', color: 'green', segment: 'outcome', icon: <IconCheck size={14} /> },
    lost: { label: 'Pausado 🔄', color: 'gray', segment: 'outcome', icon: <IconX size={14} /> },
};

const SENTIMENT_CONFIG = {
    enthusiastic: { label: 'Entusiasmado', color: 'green', icon: <IconMoodHappy size={16} /> },
    positive: { label: 'Positivo', color: 'teal', icon: <IconMoodSmile size={16} /> },
    neutral: { label: 'Neutro', color: 'gray', icon: <IconMoodNeutral size={16} /> },
    hesitant: { label: 'Hesitante', color: 'yellow', icon: <IconMoodSad size={16} /> },
    negative: { label: 'Negativo', color: 'red', icon: <IconMoodSad size={16} /> },
};

// ============================================================================
// MOCK DATA (for demo/dev mode when API is unavailable)
// ============================================================================

const MOCK_LEADS: Lead[] = [];

// ============================================================================
// LEAD CARD COMPONENT
// ============================================================================

function LeadCard({
    lead,
    onViewDetails,
    onUpdateSentiment
}: {
    lead: Lead;
    onViewDetails: (lead: Lead) => void;
    onUpdateSentiment: (leadId: string, sentiment: string) => void;
}) {
    const sentiment = lead.currentSentiment || 'neutral';
    const sentimentConfig = SENTIMENT_CONFIG[sentiment as keyof typeof SENTIMENT_CONFIG] || SENTIMENT_CONFIG.neutral;

    const has3x3 = lead.insightDreams?.length > 0 || lead.insightHobbies?.length > 0 || lead.insightAspirations?.length > 0;
    const insightCount = (lead.insightDreams?.length || 0) + (lead.insightHobbies?.length || 0) + (lead.insightAspirations?.length || 0);

    return (
        <Card shadow="sm" radius="md" p="sm" withBorder mb="xs">
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    <Avatar size="sm" color="blue" radius="xl">
                        {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </Avatar>
                    <div>
                        <Text size="sm" fw={600}>{lead.name}</Text>
                        <Text size="xs" c="dimmed">{lead.email || lead.phone || 'Sem contato'}</Text>
                    </div>
                </Group>
                <Tooltip label={sentimentConfig.label}>
                    <ThemeIcon size="sm" variant="light" color={sentimentConfig.color} radius="xl">
                        {sentimentConfig.icon}
                    </ThemeIcon>
                </Tooltip>
            </Group>

            {/* 3x3 Insights Preview */}
            {has3x3 ? (
                <Group gap={4} mb="xs">
                    {lead.insightDreams?.slice(0, 1).map((d, i) => (
                        <Tooltip key={`d-${i}`} label={`Sonho: ${d}`}>
                            <Badge size="xs" color="violet" variant="dot">💭</Badge>
                        </Tooltip>
                    ))}
                    {lead.insightHobbies?.slice(0, 1).map((h, i) => (
                        <Tooltip key={`h-${i}`} label={`Hobby: ${h}`}>
                            <Badge size="xs" color="blue" variant="dot">🎯</Badge>
                        </Tooltip>
                    ))}
                    {lead.insightAspirations?.slice(0, 1).map((a, i) => (
                        <Tooltip key={`a-${i}`} label={`Aspiração: ${a}`}>
                            <Badge size="xs" color="green" variant="dot">🌟</Badge>
                        </Tooltip>
                    ))}
                    {insightCount > 3 && (
                        <Badge size="xs" color="gray" variant="light">+{insightCount - 3}</Badge>
                    )}
                </Group>
            ) : (
                <Badge size="xs" color="orange" variant="light" mb="xs">
                    Sem insights 3x3
                </Badge>
            )}

            {/* Actions */}
            <Group gap={4}>
                {lead.hasPersona && (
                    <Tooltip label="Persona AI gerada">
                        <ThemeIcon size="xs" variant="light" color="violet">
                            <IconBrain size={10} />
                        </ThemeIcon>
                    </Tooltip>
                )}
                <ActionIcon size="xs" variant="subtle" color="green">
                    <IconBrandWhatsapp size={12} />
                </ActionIcon>
                <ActionIcon size="xs" variant="subtle" color="blue">
                    <IconPhone size={12} />
                </ActionIcon>
                <Box style={{ flex: 1 }} />
                <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<IconEye size={10} />}
                    onClick={() => onViewDetails(lead)}
                >
                    Ver
                </Button>
            </Group>
        </Card>
    );
}

// ============================================================================
// FUNNEL COLUMN COMPONENT
// ============================================================================

function FunnelColumn({
    stageId,
    stageConfig,
    leads,
    onViewDetails,
    onUpdateSentiment,
}: {
    stageId: string;
    stageConfig: typeof FUNNEL_STAGES[keyof typeof FUNNEL_STAGES];
    leads: Lead[];
    onViewDetails: (lead: Lead) => void;
    onUpdateSentiment: (leadId: string, sentiment: string) => void;
}) {
    return (
        <Paper
            shadow="sm"
            radius="md"
            p="sm"
            withBorder
            style={{ minWidth: 280, maxWidth: 300, flex: '0 0 280px' }}
        >
            <Group justify="space-between" mb="sm">
                <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color={stageConfig.color}>
                        {stageConfig.icon}
                    </ThemeIcon>
                    <Text size="sm" fw={600}>{stageConfig.label}</Text>
                </Group>
                <Badge size="sm" color={stageConfig.color} variant="light">
                    {leads.length}
                </Badge>
            </Group>

            <Stack gap={0} style={{ maxHeight: 500, overflowY: 'auto' }}>
                {leads.length === 0 ? (
                    <Text size="xs" c="dimmed" ta="center" py="md">
                        Nenhum lead nesta etapa
                    </Text>
                ) : (
                    leads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onViewDetails={onViewDetails}
                            onUpdateSentiment={onUpdateSentiment}
                        />
                    ))
                )}
            </Stack>
        </Paper>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SCRMPipelinePage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [funnelCounts, setFunnelCounts] = useState<FunnelCounts>({ tofu: 0, mofu: 0, bofu: 0, outcome: 0 });
    const [stageCounts, setStageCounts] = useState<StageCounts>({});
    const [activeSegment, setActiveSegment] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false);
    const [newLeadOpened, { open: openNewLead, close: closeNewLead }] = useDisclosure(false);

    // New lead form state
    const [newLeadForm, setNewLeadForm] = useState({
        name: '',
        email: '',
        phone: '',
        source: '',
        funnelStage: 'small_engagement',
    });

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (activeSegment) params.set('segment', activeSegment);

            const res = await fetch(`/api/scrm/leads?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch leads');

            const data = await res.json();
            setLeads(data.data || []);
            setFunnelCounts(data.funnel || { tofu: 0, mofu: 0, bofu: 0, outcome: 0 });
            setStageCounts(data.stages || {});
        } catch (error) {
            console.error('Error fetching leads, using mock data:', error);

            // Use mock data as fallback
            let mockFiltered = MOCK_LEADS;
            if (activeSegment) {
                mockFiltered = MOCK_LEADS.filter(l => l.funnelSegment === activeSegment);
            }
            setLeads(mockFiltered);

            // Calculate funnel counts from mock data
            const mockFunnelCounts = {
                tofu: MOCK_LEADS.filter(l => l.funnelSegment === 'tofu').length,
                mofu: MOCK_LEADS.filter(l => l.funnelSegment === 'mofu').length,
                bofu: MOCK_LEADS.filter(l => l.funnelSegment === 'bofu').length,
                outcome: MOCK_LEADS.filter(l => l.funnelSegment === 'outcome').length,
            };
            setFunnelCounts(mockFunnelCounts);

            // Calculate stage counts from mock data
            const mockStageCounts: StageCounts = {};
            MOCK_LEADS.forEach(l => {
                if (l.funnelStage) {
                    mockStageCounts[l.funnelStage] = (mockStageCounts[l.funnelStage] || 0) + 1;
                }
            });
            setStageCounts(mockStageCounts);

            notifications.show({
                title: '📋 Modo Demo',
                message: 'Exibindo dados de demonstração. Faça login para ver dados reais.',
                color: 'blue',
            });
        } finally {
            setLoading(false);
        }
    }, [activeSegment]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleViewDetails = (lead: Lead) => {
        setSelectedLead(lead);
        openDetails();
    };

    const handleUpdateSentiment = async (leadId: string, sentiment: string) => {
        try {
            const res = await fetch(`/api/scrm/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentSentiment: sentiment }),
            });
            if (!res.ok) throw new Error('Failed to update');
            fetchLeads();
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível atualizar o sentimento',
                color: 'red',
            });
        }
    };

    const handleCreateLead = async () => {
        try {
            const res = await fetch('/api/scrm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLeadForm),
            });
            if (!res.ok) throw new Error('Failed to create');

            notifications.show({
                title: 'Sucesso',
                message: 'Lead criado com sucesso',
                color: 'green',
            });
            closeNewLead();
            setNewLeadForm({ name: '', email: '', phone: '', source: '', funnelStage: 'small_engagement' });
            fetchLeads();
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível criar o lead',
                color: 'red',
            });
        }
    };

    // Filter leads by search
    const filteredLeads = leads.filter(lead =>
        search === '' ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()))
    );

    // Group leads by stage
    const leadsByStage: Record<string, Lead[]> = {};
    Object.keys(FUNNEL_STAGES).forEach(stage => {
        leadsByStage[stage] = filteredLeads.filter(l => l.funnelStage === stage);
    });

    // Get stages for current segment
    const getStagesForSegment = (segment: string | null) => {
        if (!segment) return Object.entries(FUNNEL_STAGES);
        return Object.entries(FUNNEL_STAGES).filter(([_, config]) => config.segment === segment);
    };

    const displayedStages = getStagesForSegment(activeSegment);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Pipeline SCRM 🎯</Title>
                    <Text c="dimmed">Funil de 11 estágios com insights relacionais</Text>
                </div>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={fetchLeads}
                        loading={loading}
                    >
                        Atualizar
                    </Button>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={openNewLead}
                    >
                        Novo Lead
                    </Button>
                </Group>
            </Group>

            {/* Funnel Segment KPIs */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{
                        cursor: 'pointer',
                        borderBottom: activeSegment === 'tofu' ? '3px solid var(--mantine-color-blue-5)' : undefined,
                        opacity: activeSegment && activeSegment !== 'tofu' ? 0.6 : 1,
                    }}
                    onClick={() => setActiveSegment(activeSegment === 'tofu' ? null : 'tofu')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">TOFU - Consciência</Text>
                            <Text size="xl" fw={700}>{funnelCounts.tofu}</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={4}
                            sections={[{ value: (funnelCounts.tofu / Math.max(leads.length, 1)) * 100, color: 'blue' }]}
                            label={<Text size="xs" ta="center">{Math.round((funnelCounts.tofu / Math.max(leads.length, 1)) * 100)}%</Text>}
                        />
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{
                        cursor: 'pointer',
                        borderBottom: activeSegment === 'mofu' ? '3px solid var(--mantine-color-violet-5)' : undefined,
                        opacity: activeSegment && activeSegment !== 'mofu' ? 0.6 : 1,
                    }}
                    onClick={() => setActiveSegment(activeSegment === 'mofu' ? null : 'mofu')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">MOFU - Consideração</Text>
                            <Text size="xl" fw={700}>{funnelCounts.mofu}</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={4}
                            sections={[{ value: (funnelCounts.mofu / Math.max(leads.length, 1)) * 100, color: 'violet' }]}
                            label={<Text size="xs" ta="center">{Math.round((funnelCounts.mofu / Math.max(leads.length, 1)) * 100)}%</Text>}
                        />
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{
                        cursor: 'pointer',
                        borderBottom: activeSegment === 'bofu' ? '3px solid var(--mantine-color-orange-5)' : undefined,
                        opacity: activeSegment && activeSegment !== 'bofu' ? 0.6 : 1,
                    }}
                    onClick={() => setActiveSegment(activeSegment === 'bofu' ? null : 'bofu')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">BOFU - Decisão</Text>
                            <Text size="xl" fw={700}>{funnelCounts.bofu}</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={4}
                            sections={[{ value: (funnelCounts.bofu / Math.max(leads.length, 1)) * 100, color: 'orange' }]}
                            label={<Text size="xs" ta="center">{Math.round((funnelCounts.bofu / Math.max(leads.length, 1)) * 100)}%</Text>}
                        />
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{
                        cursor: 'pointer',
                        borderBottom: activeSegment === 'outcome' ? '3px solid var(--mantine-color-green-5)' : undefined,
                        opacity: activeSegment && activeSegment !== 'outcome' ? 0.6 : 1,
                    }}
                    onClick={() => setActiveSegment(activeSegment === 'outcome' ? null : 'outcome')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Resultados</Text>
                            <Text size="xl" fw={700}>{funnelCounts.outcome}</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={4}
                            sections={[{ value: (funnelCounts.outcome / Math.max(leads.length, 1)) * 100, color: 'green' }]}
                            label={<Text size="xs" ta="center">{Math.round((funnelCounts.outcome / Math.max(leads.length, 1)) * 100)}%</Text>}
                        />
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Search and Filters */}
            <Card shadow="sm" radius="md" p="md" withBorder>
                <Group>
                    <TextInput
                        placeholder="Buscar por nome ou email..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Button
                        variant="light"
                        leftSection={<IconChartBar size={16} />}
                        component={Link}
                        href="/staff/scrm/insights"
                    >
                        Ver Insights
                    </Button>
                </Group>
            </Card>

            {/* Pipeline Kanban */}
            {loading ? (
                <Group gap="md">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={400} width={280} radius="md" />
                    ))}
                </Group>
            ) : (
                <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
                    <Group gap="md" align="flex-start" wrap="nowrap">
                        {displayedStages.map(([stageId, config]) => (
                            <FunnelColumn
                                key={stageId}
                                stageId={stageId}
                                stageConfig={config}
                                leads={leadsByStage[stageId] || []}
                                onViewDetails={handleViewDetails}
                                onUpdateSentiment={handleUpdateSentiment}
                            />
                        ))}
                    </Group>
                </div>
            )}

            {/* Lead Details Modal */}
            <Modal
                opened={detailsOpened}
                onClose={closeDetails}
                title={`Detalhes: ${selectedLead?.name || ''}`}
                size="lg"
            >
                {selectedLead && (
                    <Stack>
                        {/* Basic Info */}
                        <Group>
                            <Avatar size="lg" color="blue" radius="xl">
                                {selectedLead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text fw={600} size="lg">{selectedLead.name}</Text>
                                <Text size="sm" c="dimmed">{selectedLead.email || 'Sem email'}</Text>
                                <Text size="sm" c="dimmed">{selectedLead.phone || selectedLead.whatsapp || 'Sem telefone'}</Text>
                            </div>
                            <Badge
                                size="lg"
                                color={SENTIMENT_CONFIG[selectedLead.currentSentiment as keyof typeof SENTIMENT_CONFIG]?.color || 'gray'}
                            >
                                {SENTIMENT_CONFIG[selectedLead.currentSentiment as keyof typeof SENTIMENT_CONFIG]?.label || 'Neutro'}
                            </Badge>
                        </Group>

                        <Divider />

                        {/* 3x3 Insights */}
                        <Accordion variant="separated">
                            <Accordion.Item value="dreams">
                                <Accordion.Control icon={<Text>💭</Text>}>
                                    Sonhos ({selectedLead.insightDreams?.length || 0}/3)
                                </Accordion.Control>
                                <Accordion.Panel>
                                    {selectedLead.insightDreams?.length > 0 ? (
                                        <Stack gap="xs">
                                            {selectedLead.insightDreams.map((dream, i) => (
                                                <Badge key={i} variant="light" color="violet" size="lg" fullWidth>
                                                    {dream}
                                                </Badge>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Text size="sm" c="dimmed">Nenhum sonho registrado</Text>
                                    )}
                                </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="hobbies">
                                <Accordion.Control icon={<Text>🎯</Text>}>
                                    Hobbies ({selectedLead.insightHobbies?.length || 0}/3)
                                </Accordion.Control>
                                <Accordion.Panel>
                                    {selectedLead.insightHobbies?.length > 0 ? (
                                        <Stack gap="xs">
                                            {selectedLead.insightHobbies.map((hobby, i) => (
                                                <Badge key={i} variant="light" color="blue" size="lg" fullWidth>
                                                    {hobby}
                                                </Badge>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Text size="sm" c="dimmed">Nenhum hobby registrado</Text>
                                    )}
                                </Accordion.Panel>
                            </Accordion.Item>

                            <Accordion.Item value="aspirations">
                                <Accordion.Control icon={<Text>🌟</Text>}>
                                    Aspirações ({selectedLead.insightAspirations?.length || 0}/3)
                                </Accordion.Control>
                                <Accordion.Panel>
                                    {selectedLead.insightAspirations?.length > 0 ? (
                                        <Stack gap="xs">
                                            {selectedLead.insightAspirations.map((aspiration, i) => (
                                                <Badge key={i} variant="light" color="green" size="lg" fullWidth>
                                                    {aspiration}
                                                </Badge>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Text size="sm" c="dimmed">Nenhuma aspiração registrada</Text>
                                    )}
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>

                        <Divider />

                        {/* Actions */}
                        <Group justify="flex-end">
                            <Button
                                variant="light"
                                leftSection={<IconBrain size={16} />}
                                disabled={!selectedLead.insightDreams?.length && !selectedLead.insightHobbies?.length}
                            >
                                Gerar Persona AI
                            </Button>
                            <Button
                                component={Link}
                                href={`/staff/scrm/${selectedLead.id}`}
                            >
                                Ver Perfil Completo
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* New Lead Modal */}
            <Modal opened={newLeadOpened} onClose={closeNewLead} title="Novo Lead SCRM" size="md">
                <Stack>
                    <TextInput
                        label="Nome"
                        placeholder="Nome completo"
                        required
                        value={newLeadForm.name}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    />
                    <TextInput
                        label="Email"
                        placeholder="email@exemplo.com"
                        value={newLeadForm.email}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    />
                    <TextInput
                        label="Telefone"
                        placeholder="(11) 99999-9999"
                        value={newLeadForm.phone}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    />
                    <Select
                        label="Fonte"
                        placeholder="Como nos conheceu?"
                        data={[
                            { value: 'instagram', label: 'Instagram' },
                            { value: 'facebook', label: 'Facebook' },
                            { value: 'google', label: 'Google' },
                            { value: 'referral', label: 'Indicação' },
                            { value: 'walk_in', label: 'Visita Presencial' },
                            { value: 'event', label: 'Evento' },
                            { value: 'website', label: 'Website' },
                            { value: 'other', label: 'Outro' },
                        ]}
                        value={newLeadForm.source}
                        onChange={(value) => setNewLeadForm({ ...newLeadForm, source: value || '' })}
                    />
                    <Select
                        label="Etapa do Funil"
                        data={Object.entries(FUNNEL_STAGES).map(([value, config]) => ({
                            value,
                            label: config.label,
                        }))}
                        value={newLeadForm.funnelStage}
                        onChange={(value) => setNewLeadForm({ ...newLeadForm, funnelStage: value || 'small_engagement' })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeNewLead}>Cancelar</Button>
                        <Button onClick={handleCreateLead} disabled={!newLeadForm.name}>Criar Lead</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

