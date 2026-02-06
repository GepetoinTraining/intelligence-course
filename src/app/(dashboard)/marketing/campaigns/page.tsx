'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Textarea, Select,
    NumberInput, Grid, Table, Tabs, Progress, Stepper, MultiSelect,
    Slider, RingProgress, Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DateInput } from '@mantine/dates';
import {
    IconChevronLeft, IconPlus, IconEdit, IconPlayerPause, IconPlayerPlay,
    IconTarget, IconMail, IconBrandWhatsapp, IconBrandInstagram,
    IconBrandFacebook, IconSpeakerphone, IconUsers, IconCurrencyDollar,
    IconChartBar, IconCalendar, IconCheck, IconX, IconEye
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Campaign {
    id: string;
    name: string;
    description: string;
    goal: string;
    targetCourses: string[];
    targetDemographics: string[];
    channels: string[];
    budget: number;
    spent: number;
    startDate: string;
    endDate: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    metrics: {
        impressions: number;
        clicks: number;
        leads: number;
        conversions: number;
    };
}

// ============================================================================
// MOCK DATA
// ============================================================================

const COURSES = [
    { value: 'ia-jovens', label: 'Fundamentos de IA para Jovens' },
    { value: 'ai-profissionais', label: 'AI Mastery para Profissionais' },
    { value: 'ia-educadores', label: 'IA para Educadores' },
    { value: 'bootcamp-verao', label: 'Programa Intensivo de Verão' },
];

const DEMOGRAPHICS = [
    { value: 'kids', label: '👧 Crianças (8-12)' },
    { value: 'teens', label: '🧒 Adolescentes (13-17)' },
    { value: 'adults', label: '👨 Adultos (18+)' },
    { value: 'professionals', label: '💼 Profissionais' },
    { value: 'educators', label: '🧑‍🏫 Educadores' },
    { value: 'parents', label: '👨‍👩‍👧 Pais' },
];

const CHANNELS = [
    { value: 'email', label: '📧 Email Marketing', icon: IconMail, color: 'blue' },
    { value: 'whatsapp', label: '💬 WhatsApp', icon: IconBrandWhatsapp, color: 'green' },
    { value: 'instagram', label: '📸 Instagram', icon: IconBrandInstagram, color: 'pink' },
    { value: 'facebook', label: '👥 Facebook', icon: IconBrandFacebook, color: 'indigo' },
    { value: 'referral', label: '🎁 Programa de Indicação', icon: IconUsers, color: 'violet' },
];

const GOALS = [
    { value: 'awareness', label: '📢 Reconhecimento de marca' },
    { value: 'leads', label: '📋 Geração de leads' },
    { value: 'trials', label: '🎯 Agendamento de trials' },
    { value: 'enrollment', label: '✅ Matrículas' },
    { value: 'reactivation', label: '🔄 Reativação de ex-alunos' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: '1',
        name: 'Campanha de Verão 2026',
        description: 'Promoção especial para o programa de férias',
        goal: 'enrollment',
        targetCourses: ['bootcamp-verao'],
        targetDemographics: ['teens', 'adults'],
        channels: ['instagram', 'whatsapp'],
        budget: 5000,
        spent: 3200,
        startDate: '2026-01-15',
        endDate: '2026-02-28',
        status: 'active',
        metrics: { impressions: 45000, clicks: 2800, leads: 156, conversions: 23 },
    },
    {
        id: '2',
        name: 'IA para Profissionais - LinkedIn',
        description: 'Campanha B2B focada em profissionais',
        goal: 'leads',
        targetCourses: ['ai-profissionais'],
        targetDemographics: ['professionals'],
        channels: ['email'],
        budget: 3000,
        spent: 1500,
        startDate: '2026-01-20',
        endDate: '2026-03-20',
        status: 'active',
        metrics: { impressions: 28000, clicks: 1200, leads: 89, conversions: 12 },
    },
    {
        id: '3',
        name: 'Volta às Aulas - Crianças',
        description: 'Campanha para pais de crianças e adolescentes',
        goal: 'trials',
        targetCourses: ['ia-jovens'],
        targetDemographics: ['kids', 'teens', 'parents'],
        channels: ['instagram', 'facebook', 'whatsapp'],
        budget: 8000,
        spent: 0,
        startDate: '2026-02-15',
        endDate: '2026-03-15',
        status: 'draft',
        metrics: { impressions: 0, clicks: 0, leads: 0, conversions: 0 },
    },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignBuilderPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [detailModal, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

    // Wizard state
    const [wizardStep, setWizardStep] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState<string | null>(null);
    const [targetCourses, setTargetCourses] = useState<string[]>([]);
    const [targetDemographics, setTargetDemographics] = useState<string[]>([]);
    const [channels, setChannels] = useState<string[]>([]);
    const [budget, setBudget] = useState<number | ''>(1000);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);

    const handleCreate = () => {
        setWizardStep(0);
        setName('');
        setDescription('');
        setGoal(null);
        setTargetCourses([]);
        setTargetDemographics([]);
        setChannels([]);
        setBudget(1000);
        setStartDate(new Date());
        setEndDate(null);
        openModal();
    };

    const handleSave = () => {
        if (!name || !goal) return;

        const newCampaign: Campaign = {
            id: `camp-${Date.now()}`,
            name,
            description,
            goal,
            targetCourses,
            targetDemographics,
            channels,
            budget: Number(budget) || 0,
            spent: 0,
            startDate: startDate?.toISOString().split('T')[0] || '',
            endDate: endDate?.toISOString().split('T')[0] || '',
            status: 'draft',
            metrics: { impressions: 0, clicks: 0, leads: 0, conversions: 0 },
        };
        setCampaigns(prev => [...prev, newCampaign]);
        closeModal();
    };

    const handleStatusChange = (id: string, status: Campaign['status']) => {
        setCampaigns(prev => prev.map(c =>
            c.id === id ? { ...c, status } : c
        ));
    };

    const handleViewDetails = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        openDetailModal();
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
            draft: { color: 'gray', label: 'Rascunho' },
            active: { color: 'green', label: 'Ativa' },
            paused: { color: 'yellow', label: 'Pausada' },
            completed: { color: 'blue', label: 'Finalizada' },
        };
        return map[status] || map.draft;
    };

    const getGoalLabel = (goalValue: string) => {
        return GOALS.find(g => g.value === goalValue)?.label || goalValue;
    };

    const filteredCampaigns = activeTab === 'all'
        ? campaigns
        : campaigns.filter(c => c.status === activeTab);

    const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + c.spent, 0);
    const totalLeads = campaigns.reduce((acc, c) => acc + c.metrics.leads, 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + c.metrics.conversions, 0);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/school" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Campanhas de Marketing 📣</Title>
                        <Text c="dimmed">Crie e gerencie campanhas multicanal</Text>
                    </div>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreate}
                    variant="gradient"
                    gradient={{ from: 'pink', to: 'grape' }}
                >
                    Nova Campanha
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{campaigns.length}</Text>
                            <Text size="sm" c="dimmed">Campanhas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="pink">
                            <IconSpeakerphone size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">
                                R$ {totalSpent.toLocaleString('pt-BR')}
                            </Text>
                            <Text size="sm" c="dimmed">Investido</Text>
                        </div>
                        <RingProgress
                            size={48}
                            thickness={4}
                            sections={[{ value: (totalSpent / totalBudget) * 100, color: 'green' }]}
                            label={<Text ta="center" size="xs">{Math.round((totalSpent / totalBudget) * 100)}%</Text>}
                        />
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="blue">{totalLeads}</Text>
                            <Text size="sm" c="dimmed">Leads Gerados</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="violet">{totalConversions}</Text>
                            <Text size="sm" c="dimmed">Conversões</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconTarget size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todas ({campaigns.length})</Tabs.Tab>
                    <Tabs.Tab value="active">Ativas ({campaigns.filter(c => c.status === 'active').length})</Tabs.Tab>
                    <Tabs.Tab value="draft">Rascunhos ({campaigns.filter(c => c.status === 'draft').length})</Tabs.Tab>
                    <Tabs.Tab value="paused">Pausadas ({campaigns.filter(c => c.status === 'paused').length})</Tabs.Tab>
                    <Tabs.Tab value="completed">Finalizadas ({campaigns.filter(c => c.status === 'completed').length})</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Campaign Cards */}
            <Stack gap="md">
                {filteredCampaigns.map(campaign => {
                    const statusInfo = getStatusInfo(campaign.status);
                    const budgetProgress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
                    const conversionRate = campaign.metrics.leads > 0
                        ? ((campaign.metrics.conversions / campaign.metrics.leads) * 100).toFixed(1)
                        : '0';

                    return (
                        <Card key={campaign.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Grid>
                                <Grid.Col span={{ base: 12, md: 6 }}>
                                    <Stack gap="xs">
                                        <Group gap="xs">
                                            <Badge color={statusInfo.color} variant="filled" size="sm">
                                                {statusInfo.label}
                                            </Badge>
                                            <Badge variant="outline" color="gray" size="sm">
                                                {getGoalLabel(campaign.goal)}
                                            </Badge>
                                        </Group>
                                        <Text fw={600} size="lg">{campaign.name}</Text>
                                        <Text size="sm" c="dimmed">{campaign.description}</Text>

                                        <Group gap="xs" mt="xs">
                                            {campaign.channels.map(channel => {
                                                const ch = CHANNELS.find(c => c.value === channel);
                                                return ch ? (
                                                    <Badge key={channel} variant="light" color={ch.color} size="sm">
                                                        {ch.label.split(' ')[0]}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </Group>

                                        <Group gap="xs">
                                            <IconCalendar size={14} color="gray" />
                                            <Text size="xs" c="dimmed">
                                                {new Date(campaign.startDate).toLocaleDateString('pt-BR')} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('pt-BR') : 'Sem fim'}
                                            </Text>
                                        </Group>
                                    </Stack>
                                </Grid.Col>

                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <SimpleGrid cols={2} spacing="xs">
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{campaign.metrics.impressions.toLocaleString()}</Text>
                                            <Text size="xs" c="dimmed">Impressões</Text>
                                        </Paper>
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{campaign.metrics.clicks.toLocaleString()}</Text>
                                            <Text size="xs" c="dimmed">Cliques</Text>
                                        </Paper>
                                        <Paper p="sm" bg="blue.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700} c="blue">{campaign.metrics.leads}</Text>
                                            <Text size="xs" c="dimmed">Leads</Text>
                                        </Paper>
                                        <Paper p="sm" bg="green.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700} c="green">{campaign.metrics.conversions}</Text>
                                            <Text size="xs" c="dimmed">Conversões</Text>
                                        </Paper>
                                    </SimpleGrid>

                                    <Paper p="sm" mt="xs" radius="md" withBorder>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="xs">Orçamento</Text>
                                            <Text size="xs" fw={500}>
                                                R$ {campaign.spent.toLocaleString()} / R$ {campaign.budget.toLocaleString()}
                                            </Text>
                                        </Group>
                                        <Progress value={budgetProgress} size="sm" color={budgetProgress > 80 ? 'red' : 'green'} />
                                    </Paper>
                                </Grid.Col>

                                <Grid.Col span={{ base: 12, md: 2 }}>
                                    <Stack gap="xs" h="100%" justify="center">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconEye size={14} />}
                                            onClick={() => handleViewDetails(campaign)}
                                            fullWidth
                                        >
                                            Detalhes
                                        </Button>
                                        {campaign.status === 'draft' && (
                                            <Button
                                                size="xs"
                                                variant="filled"
                                                color="green"
                                                leftSection={<IconPlayerPlay size={14} />}
                                                onClick={() => handleStatusChange(campaign.id, 'active')}
                                                fullWidth
                                            >
                                                Iniciar
                                            </Button>
                                        )}
                                        {campaign.status === 'active' && (
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color="yellow"
                                                leftSection={<IconPlayerPause size={14} />}
                                                onClick={() => handleStatusChange(campaign.id, 'paused')}
                                                fullWidth
                                            >
                                                Pausar
                                            </Button>
                                        )}
                                        {campaign.status === 'paused' && (
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color="green"
                                                leftSection={<IconPlayerPlay size={14} />}
                                                onClick={() => handleStatusChange(campaign.id, 'active')}
                                                fullWidth
                                            >
                                                Retomar
                                            </Button>
                                        )}
                                    </Stack>
                                </Grid.Col>
                            </Grid>
                        </Card>
                    );
                })}
            </Stack>

            {filteredCampaigns.length === 0 && (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconSpeakerphone size={32} />
                    </ThemeIcon>
                    <Text fw={500}>Nenhuma campanha encontrada</Text>
                    <Text size="sm" c="dimmed">Crie uma nova campanha para começar</Text>
                </Paper>
            )}

            {/* Campaign Wizard Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title="Criar Nova Campanha"
                centered
                size="lg"
            >
                <Stack gap="lg">
                    <Stepper active={wizardStep} onStepClick={setWizardStep} size="sm">
                        <Stepper.Step label="Objetivo" description="Defina a meta">
                            <Stack gap="md" mt="lg">
                                <TextInput
                                    label="Nome da Campanha"
                                    placeholder="Ex: Campanha de Verão 2026"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <Textarea
                                    label="Descrição"
                                    placeholder="Descreva o objetivo da campanha..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    minRows={2}
                                />
                                <Select
                                    label="Objetivo Principal"
                                    placeholder="Selecione o objetivo"
                                    data={GOALS}
                                    value={goal}
                                    onChange={setGoal}
                                    required
                                />
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Público" description="Selecione o alvo">
                            <Stack gap="md" mt="lg">
                                <MultiSelect
                                    label="Cursos a Promover"
                                    placeholder="Selecione os cursos"
                                    data={COURSES}
                                    value={targetCourses}
                                    onChange={setTargetCourses}
                                />
                                <MultiSelect
                                    label="Público-Alvo"
                                    placeholder="Selecione as demografias"
                                    data={DEMOGRAPHICS}
                                    value={targetDemographics}
                                    onChange={setTargetDemographics}
                                />
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Canais" description="Escolha onde anunciar">
                            <Stack gap="md" mt="lg">
                                <Text size="sm" fw={500}>Canais de Marketing</Text>
                                <SimpleGrid cols={2}>
                                    {CHANNELS.map(channel => {
                                        const Icon = channel.icon;
                                        const isSelected = channels.includes(channel.value);
                                        return (
                                            <Paper
                                                key={channel.value}
                                                p="md"
                                                radius="md"
                                                withBorder
                                                style={{
                                                    cursor: 'pointer',
                                                    borderColor: isSelected ? `var(--mantine-color-${channel.color}-5)` : undefined,
                                                    backgroundColor: isSelected ? `var(--mantine-color-${channel.color}-0)` : undefined,
                                                }}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setChannels(prev => prev.filter(c => c !== channel.value));
                                                    } else {
                                                        setChannels(prev => [...prev, channel.value]);
                                                    }
                                                }}
                                            >
                                                <Group>
                                                    <ThemeIcon size="lg" variant="light" color={channel.color}>
                                                        <Icon size={20} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Text size="sm" fw={500}>{channel.label}</Text>
                                                    </div>
                                                    {isSelected && (
                                                        <IconCheck size={16} color={`var(--mantine-color-${channel.color}-5)`} style={{ marginLeft: 'auto' }} />
                                                    )}
                                                </Group>
                                            </Paper>
                                        );
                                    })}
                                </SimpleGrid>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Orçamento" description="Configure valores">
                            <Stack gap="md" mt="lg">
                                <NumberInput
                                    label="Orçamento Total (R$)"
                                    min={0}
                                    value={budget}
                                    onChange={(val) => setBudget(val as number)}
                                    leftSection={<IconCurrencyDollar size={16} />}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                />
                                <Grid>
                                    <Grid.Col span={6}>
                                        <DateInput
                                            label="Data de Início"
                                            placeholder="Selecione"
                                            value={startDate}
                                            onChange={(value) => setStartDate(value as Date | null)}
                                            leftSection={<IconCalendar size={16} />}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <DateInput
                                            label="Data de Término"
                                            placeholder="Opcional"
                                            value={endDate}
                                            onChange={(value) => setEndDate(value as Date | null)}
                                            leftSection={<IconCalendar size={16} />}
                                            clearable
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Completed>
                            <Paper p="lg" bg="green.0" radius="md" mt="lg">
                                <Stack gap="sm">
                                    <Group gap="xs">
                                        <ThemeIcon color="green" variant="filled" radius="xl">
                                            <IconCheck size={16} />
                                        </ThemeIcon>
                                        <Text fw={600}>Revisão da Campanha</Text>
                                    </Group>
                                    <Divider />
                                    <Grid>
                                        <Grid.Col span={6}><Text size="sm" c="dimmed">Nome:</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="sm" fw={500}>{name}</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="sm" c="dimmed">Objetivo:</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="sm" fw={500}>{getGoalLabel(goal || '')}</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="sm" c="dimmed">Orçamento:</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="sm" fw={500}>R$ {Number(budget).toLocaleString('pt-BR')}</Text></Grid.Col>
                                        <Grid.Col span={6}><Text size="sm" c="dimmed">Canais:</Text></Grid.Col>
                                        <Grid.Col span={6}>
                                            <Group gap={4}>
                                                {channels.map(ch => {
                                                    const channel = CHANNELS.find(c => c.value === ch);
                                                    return channel ? (
                                                        <Badge key={ch} size="xs" color={channel.color}>{channel.label.split(' ')[0]}</Badge>
                                                    ) : null;
                                                })}
                                            </Group>
                                        </Grid.Col>
                                    </Grid>
                                </Stack>
                            </Paper>
                        </Stepper.Completed>
                    </Stepper>

                    <Group justify="space-between">
                        <Button
                            variant="subtle"
                            onClick={() => setWizardStep(s => Math.max(0, s - 1))}
                            disabled={wizardStep === 0}
                        >
                            Voltar
                        </Button>
                        {wizardStep < 4 ? (
                            <Button
                                onClick={() => setWizardStep(s => s + 1)}
                                variant="gradient"
                                gradient={{ from: 'pink', to: 'grape' }}
                            >
                                Próximo
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSave}
                                variant="gradient"
                                gradient={{ from: 'green', to: 'teal' }}
                                leftSection={<IconCheck size={16} />}
                            >
                                Criar Campanha
                            </Button>
                        )}
                    </Group>
                </Stack>
            </Modal>

            {/* Campaign Detail Modal */}
            <Modal
                opened={detailModal}
                onClose={closeDetailModal}
                title={selectedCampaign?.name}
                centered
                size="lg"
            >
                {selectedCampaign && (
                    <Stack gap="md">
                        <Paper p="md" radius="md" withBorder>
                            <Text size="sm" c="dimmed" mb="xs">Performance</Text>
                            <SimpleGrid cols={4}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="xl" fw={700}>{selectedCampaign.metrics.impressions.toLocaleString()}</Text>
                                    <Text size="xs" c="dimmed">Impressões</Text>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="xl" fw={700}>{selectedCampaign.metrics.clicks.toLocaleString()}</Text>
                                    <Text size="xs" c="dimmed">Cliques</Text>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="xl" fw={700} c="blue">{selectedCampaign.metrics.leads}</Text>
                                    <Text size="xs" c="dimmed">Leads</Text>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="xl" fw={700} c="green">{selectedCampaign.metrics.conversions}</Text>
                                    <Text size="xs" c="dimmed">Conversões</Text>
                                </div>
                            </SimpleGrid>
                        </Paper>

                        <Paper p="md" radius="md" withBorder>
                            <Text size="sm" c="dimmed" mb="xs">Métricas Calculadas</Text>
                            <SimpleGrid cols={3}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="lg" fw={700}>
                                        {selectedCampaign.metrics.impressions > 0
                                            ? ((selectedCampaign.metrics.clicks / selectedCampaign.metrics.impressions) * 100).toFixed(2)
                                            : 0}%
                                    </Text>
                                    <Text size="xs" c="dimmed">CTR</Text>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="lg" fw={700}>
                                        {selectedCampaign.metrics.leads > 0
                                            ? ((selectedCampaign.metrics.conversions / selectedCampaign.metrics.leads) * 100).toFixed(1)
                                            : 0}%
                                    </Text>
                                    <Text size="xs" c="dimmed">Taxa de Conversão</Text>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="lg" fw={700}>
                                        R$ {selectedCampaign.metrics.conversions > 0
                                            ? (selectedCampaign.spent / selectedCampaign.metrics.conversions).toFixed(0)
                                            : 0}
                                    </Text>
                                    <Text size="xs" c="dimmed">Custo por Conversão</Text>
                                </div>
                            </SimpleGrid>
                        </Paper>

                        <Group>
                            <Text size="sm" c="dimmed">Cursos:</Text>
                            <Group gap={4}>
                                {selectedCampaign.targetCourses.map(c => {
                                    const course = COURSES.find(co => co.value === c);
                                    return <Badge key={c} variant="outline">{course?.label || c}</Badge>;
                                })}
                            </Group>
                        </Group>

                        <Group>
                            <Text size="sm" c="dimmed">Público:</Text>
                            <Group gap={4}>
                                {selectedCampaign.targetDemographics.map(d => {
                                    const demo = DEMOGRAPHICS.find(de => de.value === d);
                                    return <Badge key={d} variant="light">{demo?.label || d}</Badge>;
                                })}
                            </Group>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

