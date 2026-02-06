'use client';

import { useState, useEffect } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Paper, ThemeIcon, Progress, Modal, TextInput, Textarea,
    Select, Table, Tabs, Skeleton, Divider,
    ActionIcon, Alert, NumberInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChartBar, IconPalette, IconPhoto, IconVideo, IconTarget,
    IconTrendingUp, IconRefresh, IconArrowLeft,
    IconPlus, IconEdit, IconEye, IconCopy, IconExternalLink,
    IconBrandInstagram, IconBrandFacebook, IconBrandGoogle,
    IconMail, IconCoin, IconUsers,
    IconFlame, IconSparkles, IconChartPie, IconLink, IconCalendar
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    channel: 'instagram' | 'facebook' | 'google' | 'email' | 'organic';
    budget: number;
    spent: number;
    startDate: string;
    endDate?: string;
    visitors: number;
    leads: number;
    enrollments: number;
    cac: number;
    roas: number;
}

interface ChannelMetrics {
    channel: string;
    visitors: number;
    leads: number;
    enrollments: number;
    spend: number;
    cac: number;
    cvr: number;
}

interface ContentAsset {
    id: string;
    name: string;
    type: 'image' | 'video' | 'copy' | 'landing_page';
    campaign?: string;
    status: 'draft' | 'approved' | 'live';
    createdAt: string;
    performance?: number;
}

interface ABTest {
    id: string;
    name: string;
    pageA: string;
    pageB: string;
    visitors: { a: number; b: number };
    conversions: { a: number; b: number };
    winner?: 'A' | 'B' | 'no_winner';
    confidence: number;
    status: 'running' | 'concluded';
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: '1',
        name: 'English Adults - Q1 2026',
        status: 'active',
        channel: 'instagram',
        budget: 5000,
        spent: 3200,
        startDate: '2026-01-01',
        visitors: 4500,
        leads: 180,
        enrollments: 25,
        cac: 128,
        roas: 2.8,
    },
    {
        id: '2',
        name: 'Kids English - Férias',
        status: 'active',
        channel: 'facebook',
        budget: 3000,
        spent: 2100,
        startDate: '2026-01-15',
        visitors: 2800,
        leads: 95,
        enrollments: 12,
        cac: 175,
        roas: 1.9,
    },
    {
        id: '3',
        name: 'Business English B2B',
        status: 'paused',
        channel: 'google',
        budget: 8000,
        spent: 4500,
        startDate: '2025-12-01',
        visitors: 3200,
        leads: 65,
        enrollments: 8,
        cac: 562,
        roas: 1.2,
    },
    {
        id: '4',
        name: 'Newsletter Semanal',
        status: 'active',
        channel: 'email',
        budget: 0,
        spent: 0,
        startDate: '2025-01-01',
        visitors: 1200,
        leads: 45,
        enrollments: 15,
        cac: 0,
        roas: 0,
    },
];

const MOCK_CHANNEL_METRICS: ChannelMetrics[] = [
    { channel: 'Instagram', visitors: 12500, leads: 420, enrollments: 55, spend: 8500, cac: 154, cvr: 3.36 },
    { channel: 'Facebook', visitors: 8200, leads: 280, enrollments: 35, spend: 5200, cac: 148, cvr: 3.41 },
    { channel: 'Google Ads', visitors: 5800, leads: 145, enrollments: 18, spend: 7800, cac: 433, cvr: 2.50 },
    { channel: 'Email', visitors: 3200, leads: 180, enrollments: 42, spend: 200, cac: 4.76, cvr: 5.63 },
    { channel: 'Organic', visitors: 15000, leads: 350, enrollments: 68, spend: 0, cac: 0, cvr: 2.33 },
];

const MOCK_ASSETS: ContentAsset[] = [
    { id: '1', name: 'Hero Banner - Adults', type: 'image', campaign: 'English Adults - Q1 2026', status: 'live', createdAt: '2026-01-05', performance: 85 },
    { id: '2', name: 'Testimonial Video - Maria', type: 'video', campaign: 'English Adults - Q1 2026', status: 'live', createdAt: '2026-01-10', performance: 92 },
    { id: '3', name: 'Kids Landing Page', type: 'landing_page', campaign: 'Kids English - Férias', status: 'live', createdAt: '2026-01-12', performance: 78 },
    { id: '4', name: 'Email Copy - Urgência', type: 'copy', campaign: 'Newsletter Semanal', status: 'approved', createdAt: '2026-01-20' },
];

const MOCK_AB_TESTS: ABTest[] = [
    {
        id: '1',
        name: 'Landing Page - CTA Color',
        pageA: 'Verde (Matricule-se)',
        pageB: 'Laranja (Comece Agora)',
        visitors: { a: 1250, b: 1280 },
        conversions: { a: 42, b: 58 },
        winner: 'B',
        confidence: 94,
        status: 'concluded',
    },
    {
        id: '2',
        name: 'Hero Image - Style',
        pageA: 'Foto com pessoas',
        pageB: 'Ilustração abstrata',
        visitors: { a: 850, b: 820 },
        conversions: { a: 28, b: 25 },
        confidence: 62,
        status: 'running',
    },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MarketingPage() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string | null>('analytics');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [channelMetrics, setChannelMetrics] = useState<ChannelMetrics[]>([]);
    const [assets, setAssets] = useState<ContentAsset[]>([]);
    const [abTests, setAbTests] = useState<ABTest[]>([]);

    // Modals
    const [campaignModalOpened, { open: openCampaignModal, close: closeCampaignModal }] = useDisclosure(false);

    useEffect(() => {
        // Simulate API fetch
        setTimeout(() => {
            setCampaigns(MOCK_CAMPAIGNS);
            setChannelMetrics(MOCK_CHANNEL_METRICS);
            setAssets(MOCK_ASSETS);
            setAbTests(MOCK_AB_TESTS);
            setLoading(false);
        }, 500);
    }, []);

    // Calculate aggregate metrics
    const totalMetrics = {
        totalVisitors: channelMetrics.reduce((s, c) => s + c.visitors, 0),
        totalLeads: channelMetrics.reduce((s, c) => s + c.leads, 0),
        totalEnrollments: channelMetrics.reduce((s, c) => s + c.enrollments, 0),
        totalSpend: channelMetrics.reduce((s, c) => s + c.spend, 0),
        blendedCAC: channelMetrics.reduce((s, c) => s + c.spend, 0) / channelMetrics.reduce((s, c) => s + c.enrollments, 0),
        overallCVR: (channelMetrics.reduce((s, c) => s + c.leads, 0) / channelMetrics.reduce((s, c) => s + c.visitors, 0)) * 100,
    };

    const getChannelIcon = (channel: string) => {
        switch (channel.toLowerCase()) {
            case 'instagram': return IconBrandInstagram;
            case 'facebook': return IconBrandFacebook;
            case 'google':
            case 'google ads': return IconBrandGoogle;
            case 'email': return IconMail;
            default: return IconUsers;
        }
    };

    const getChannelColor = (channel: string) => {
        switch (channel.toLowerCase()) {
            case 'instagram': return 'pink';
            case 'facebook': return 'blue';
            case 'google':
            case 'google ads': return 'red';
            case 'email': return 'violet';
            default: return 'teal';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
            case 'live': return 'green';
            case 'paused': return 'yellow';
            case 'draft': return 'gray';
            case 'completed':
            case 'approved': return 'blue';
            default: return 'gray';
        }
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <Skeleton height={40} width={300} />
                </Group>
                <SimpleGrid cols={4}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={120} radius="md" />
                    ))}
                </SimpleGrid>
                <Skeleton height={400} radius="md" />
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
                    <Title order={2}>Marketing Command 🎯</Title>
                    <Text c="dimmed">Campanhas, Analytics e Conteúdo Criativo</Text>
                </div>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconLink size={16} />}
                        component={Link}
                        href="/staff/marketing/utm-builder"
                    >
                        UTM Builder
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconSparkles size={16} />}
                        component={Link}
                        href="/staff/marketing/copy-generator"
                    >
                        AI Copy
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconCalendar size={16} />}
                        component={Link}
                        href="/staff/marketing/calendar"
                    >
                        Calendário
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconPalette size={16} />}
                        component={Link}
                        href="/staff/marketing/landing-builder"
                    >
                        Landing Pages
                    </Button>
                    <Divider orientation="vertical" />
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={() => setLoading(true)}
                    >
                        Atualizar
                    </Button>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={openCampaignModal}
                    >
                        Nova Campanha
                    </Button>
                </Group>
            </Group>

            {/* Aggregate KPIs */}
            <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Visitantes</Text>
                            <Text size="xl" fw={700}>{totalMetrics.totalVisitors.toLocaleString()}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconEye size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Leads</Text>
                            <Text size="xl" fw={700}>{totalMetrics.totalLeads.toLocaleString()}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="violet">
                            <IconUsers size={20} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>
                        CVR: {totalMetrics.overallCVR.toFixed(2)}%
                    </Text>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Matrículas</Text>
                            <Text size="xl" fw={700} c="green">{totalMetrics.totalEnrollments}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconTarget size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="sm" radius="md" p="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Investimento</Text>
                            <Text size="xl" fw={700}>R$ {totalMetrics.totalSpend.toLocaleString()}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="orange">
                            <IconCoin size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{ background: 'linear-gradient(135deg, var(--mantine-color-teal-0), var(--mantine-color-green-0))' }}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">CAC Blended</Text>
                            <Text size="xl" fw={700} c={totalMetrics.blendedCAC < 150 ? 'green' : 'orange'}>
                                R$ {totalMetrics.blendedCAC.toFixed(0)}
                            </Text>
                        </div>
                        <ThemeIcon
                            size="lg"
                            variant="gradient"
                            gradient={{ from: 'teal', to: 'green' }}
                        >
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
                        Analytics
                    </Tabs.Tab>
                    <Tabs.Tab value="campaigns" leftSection={<IconTarget size={16} />}>
                        Campanhas ({campaigns.filter(c => c.status === 'active').length} ativas)
                    </Tabs.Tab>
                    <Tabs.Tab value="creative" leftSection={<IconPalette size={16} />}>
                        Conteúdo ({assets.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="ab-tests" leftSection={<IconChartPie size={16} />}>
                        A/B Tests ({abTests.filter(t => t.status === 'running').length} rodando)
                    </Tabs.Tab>
                </Tabs.List>

                {/* Analytics Tab */}
                <Tabs.Panel value="analytics" pt="md">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        {/* Channel Performance */}
                        <Card shadow="sm" radius="md" p="md" withBorder>
                            <Text fw={600} mb="md">Performance por Canal</Text>
                            <Table verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Canal</Table.Th>
                                        <Table.Th ta="center">Visitantes</Table.Th>
                                        <Table.Th ta="center">Leads</Table.Th>
                                        <Table.Th ta="center">CVR</Table.Th>
                                        <Table.Th ta="center">CAC</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {channelMetrics.map(channel => {
                                        const Icon = getChannelIcon(channel.channel);
                                        return (
                                            <Table.Tr key={channel.channel}>
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <ThemeIcon
                                                            size="sm"
                                                            variant="light"
                                                            color={getChannelColor(channel.channel)}
                                                        >
                                                            <Icon size={14} />
                                                        </ThemeIcon>
                                                        <Text size="sm">{channel.channel}</Text>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Text size="sm">{channel.visitors.toLocaleString()}</Text>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Text size="sm">{channel.leads}</Text>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Badge
                                                        size="sm"
                                                        color={channel.cvr > 3 ? 'green' : channel.cvr > 2 ? 'yellow' : 'red'}
                                                    >
                                                        {channel.cvr.toFixed(2)}%
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    {channel.cac > 0 ? (
                                                        <Badge
                                                            size="sm"
                                                            variant="light"
                                                            color={channel.cac < 150 ? 'green' : channel.cac < 300 ? 'yellow' : 'red'}
                                                        >
                                                            R$ {channel.cac.toFixed(0)}
                                                        </Badge>
                                                    ) : (
                                                        <Badge size="sm" variant="light" color="teal">Orgânico</Badge>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Card>

                        {/* Funnel */}
                        <Card shadow="sm" radius="md" p="md" withBorder>
                            <Text fw={600} mb="md">Funil de Marketing</Text>
                            <Stack gap="md">
                                <div>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm">Visitantes</Text>
                                        <Text size="sm" fw={500}>{totalMetrics.totalVisitors.toLocaleString()}</Text>
                                    </Group>
                                    <Progress value={100} color="blue" size="lg" />
                                </div>
                                <div>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm">Leads</Text>
                                        <Group gap="xs">
                                            <Text size="sm" fw={500}>{totalMetrics.totalLeads.toLocaleString()}</Text>
                                            <Text size="xs" c="dimmed">
                                                ({((totalMetrics.totalLeads / totalMetrics.totalVisitors) * 100).toFixed(1)}%)
                                            </Text>
                                        </Group>
                                    </Group>
                                    <Progress
                                        value={(totalMetrics.totalLeads / totalMetrics.totalVisitors) * 100}
                                        color="violet"
                                        size="lg"
                                    />
                                </div>
                                <div>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm">Matrículas</Text>
                                        <Group gap="xs">
                                            <Text size="sm" fw={500}>{totalMetrics.totalEnrollments}</Text>
                                            <Text size="xs" c="dimmed">
                                                ({((totalMetrics.totalEnrollments / totalMetrics.totalLeads) * 100).toFixed(1)}% de leads)
                                            </Text>
                                        </Group>
                                    </Group>
                                    <Progress
                                        value={(totalMetrics.totalEnrollments / totalMetrics.totalVisitors) * 100}
                                        color="green"
                                        size="lg"
                                    />
                                </div>
                            </Stack>

                            <Divider my="md" />

                            <Group justify="space-between">
                                <div>
                                    <Text size="xs" c="dimmed">Lead → Matrícula</Text>
                                    <Text size="lg" fw={700} c="green">
                                        {((totalMetrics.totalEnrollments / totalMetrics.totalLeads) * 100).toFixed(1)}%
                                    </Text>
                                </div>
                                <div>
                                    <Text size="xs" c="dimmed">Custo por Lead</Text>
                                    <Text size="lg" fw={700}>
                                        R$ {(totalMetrics.totalSpend / totalMetrics.totalLeads).toFixed(0)}
                                    </Text>
                                </div>
                            </Group>
                        </Card>

                        {/* Attribution */}
                        <Card shadow="sm" radius="md" p="md" withBorder>
                            <Text fw={600} mb="md">Atribuição de Matrículas</Text>
                            <Stack gap="sm">
                                {channelMetrics
                                    .sort((a, b) => b.enrollments - a.enrollments)
                                    .map(channel => {
                                        const Icon = getChannelIcon(channel.channel);
                                        const percentage = (channel.enrollments / totalMetrics.totalEnrollments) * 100;
                                        return (
                                            <div key={channel.channel}>
                                                <Group justify="space-between" mb={4}>
                                                    <Group gap="xs">
                                                        <Icon size={14} />
                                                        <Text size="sm">{channel.channel}</Text>
                                                    </Group>
                                                    <Group gap="xs">
                                                        <Text size="sm" fw={500}>{channel.enrollments}</Text>
                                                        <Text size="xs" c="dimmed">({percentage.toFixed(0)}%)</Text>
                                                    </Group>
                                                </Group>
                                                <Progress
                                                    value={percentage}
                                                    color={getChannelColor(channel.channel)}
                                                    size="sm"
                                                />
                                            </div>
                                        );
                                    })
                                }
                            </Stack>
                        </Card>

                        {/* Insights */}
                        <Card shadow="sm" radius="md" p="md" withBorder>
                            <Group gap="xs" mb="md">
                                <IconSparkles size={20} />
                                <Text fw={600}>Insights AI</Text>
                            </Group>
                            <Stack gap="sm">
                                <Alert variant="light" color="green" title="Email tem melhor ROI">
                                    <Text size="sm">
                                        O canal de Email tem CAC próximo de zero e CVR de 5.63%,
                                        o maior entre todos os canais. Considere aumentar a frequência de envios.
                                    </Text>
                                </Alert>
                                <Alert variant="light" color="yellow" title="Google Ads com CAC alto">
                                    <Text size="sm">
                                        O CAC de Google Ads (R$433) está 3x maior que Instagram.
                                        Revise as palavras-chave e landing pages para otimizar.
                                    </Text>
                                </Alert>
                                <Alert variant="light" color="blue" title="Orgânico forte">
                                    <Text size="sm">
                                        O tráfego orgânico representa 31% das matrículas sem custo.
                                        Invista em SEO e conteúdo para escalar.
                                    </Text>
                                </Alert>
                            </Stack>
                        </Card>
                    </SimpleGrid>
                </Tabs.Panel>

                {/* Campaigns Tab */}
                <Tabs.Panel value="campaigns" pt="md">
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Campanhas Ativas</Text>
                            <Button
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={openCampaignModal}
                            >
                                Nova
                            </Button>
                        </Group>
                        <Table verticalSpacing="md">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Campanha</Table.Th>
                                    <Table.Th>Canal</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                    <Table.Th ta="center">Budget/Gasto</Table.Th>
                                    <Table.Th ta="center">Leads</Table.Th>
                                    <Table.Th ta="center">Matrículas</Table.Th>
                                    <Table.Th ta="center">CAC</Table.Th>
                                    <Table.Th ta="center">ROAS</Table.Th>
                                    <Table.Th></Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {campaigns.map(campaign => {
                                    const Icon = getChannelIcon(campaign.channel);
                                    const budgetProgress = (campaign.spent / campaign.budget) * 100;
                                    return (
                                        <Table.Tr key={campaign.id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{campaign.name}</Text>
                                                <Text size="xs" c="dimmed">Início: {campaign.startDate}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <ThemeIcon
                                                        size="sm"
                                                        variant="light"
                                                        color={getChannelColor(campaign.channel)}
                                                    >
                                                        <Icon size={14} />
                                                    </ThemeIcon>
                                                    <Text size="sm" tt="capitalize">{campaign.channel}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Badge size="sm" color={getStatusColor(campaign.status)}>
                                                    {campaign.status === 'active' ? 'Ativa' :
                                                        campaign.status === 'paused' ? 'Pausada' :
                                                            campaign.status === 'draft' ? 'Rascunho' : 'Concluída'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                {campaign.budget > 0 ? (
                                                    <div>
                                                        <Text size="xs">
                                                            R${campaign.spent.toLocaleString()} / R${campaign.budget.toLocaleString()}
                                                        </Text>
                                                        <Progress
                                                            value={budgetProgress}
                                                            size="xs"
                                                            color={budgetProgress > 80 ? 'red' : 'blue'}
                                                            mt={4}
                                                        />
                                                    </div>
                                                ) : (
                                                    <Text size="xs" c="dimmed">Sem custo</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Text size="sm" fw={500}>{campaign.leads}</Text>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Badge color="green">{campaign.enrollments}</Badge>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                {campaign.cac > 0 ? (
                                                    <Badge
                                                        variant="light"
                                                        color={campaign.cac < 150 ? 'green' : campaign.cac < 300 ? 'yellow' : 'red'}
                                                    >
                                                        R$ {campaign.cac}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="light" color="teal">R$ 0</Badge>
                                                )}
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                {campaign.roas > 0 ? (
                                                    <Badge
                                                        variant="light"
                                                        color={campaign.roas > 2 ? 'green' : campaign.roas > 1 ? 'yellow' : 'red'}
                                                    >
                                                        {campaign.roas.toFixed(1)}x
                                                    </Badge>
                                                ) : (
                                                    <Text size="xs" c="dimmed">-</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    <ActionIcon size="sm" variant="subtle">
                                                        <IconEdit size={14} />
                                                    </ActionIcon>
                                                    <ActionIcon size="sm" variant="subtle">
                                                        <IconChartBar size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </Card>
                </Tabs.Panel>

                {/* Creative Tab */}
                <Tabs.Panel value="creative" pt="md">
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                        {assets.map(asset => (
                            <Card key={asset.id} shadow="sm" radius="md" p="md" withBorder>
                                <Group justify="space-between" mb="sm">
                                    <Badge
                                        size="sm"
                                        leftSection={
                                            asset.type === 'image' ? <IconPhoto size={10} /> :
                                                asset.type === 'video' ? <IconVideo size={10} /> :
                                                    asset.type === 'landing_page' ? <IconExternalLink size={10} /> :
                                                        <IconEdit size={10} />
                                        }
                                    >
                                        {asset.type === 'image' ? 'Imagem' :
                                            asset.type === 'video' ? 'Vídeo' :
                                                asset.type === 'landing_page' ? 'Landing Page' : 'Copy'}
                                    </Badge>
                                    <Badge size="sm" color={getStatusColor(asset.status)}>
                                        {asset.status === 'live' ? 'Ao vivo' :
                                            asset.status === 'approved' ? 'Aprovado' : 'Rascunho'}
                                    </Badge>
                                </Group>

                                <Text fw={500} mb="xs">{asset.name}</Text>

                                {asset.campaign && (
                                    <Text size="xs" c="dimmed" mb="sm">
                                        📍 {asset.campaign}
                                    </Text>
                                )}

                                {asset.performance && (
                                    <div>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="xs">Performance</Text>
                                            <Text size="xs" fw={500}>{asset.performance}%</Text>
                                        </Group>
                                        <Progress
                                            value={asset.performance}
                                            color={asset.performance > 80 ? 'green' : asset.performance > 60 ? 'yellow' : 'red'}
                                            size="sm"
                                        />
                                    </div>
                                )}

                                <Group mt="md" gap="xs">
                                    <Button size="xs" variant="light" leftSection={<IconEye size={14} />}>
                                        Ver
                                    </Button>
                                    <Button size="xs" variant="subtle" leftSection={<IconCopy size={14} />}>
                                        Duplicar
                                    </Button>
                                </Group>
                            </Card>
                        ))}

                        {/* Add new asset card */}
                        <Card
                            shadow="sm"
                            radius="md"
                            p="md"
                            withBorder
                            style={{
                                border: '2px dashed var(--mantine-color-gray-4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 200,
                                cursor: 'pointer',
                            }}
                        >
                            <Stack align="center" gap="sm">
                                <ThemeIcon size="xl" variant="light" color="gray">
                                    <IconPlus size={24} />
                                </ThemeIcon>
                                <Text size="sm" c="dimmed">Adicionar Conteúdo</Text>
                            </Stack>
                        </Card>
                    </SimpleGrid>
                </Tabs.Panel>

                {/* A/B Tests Tab */}
                <Tabs.Panel value="ab-tests" pt="md">
                    <Stack gap="md">
                        {abTests.map(test => {
                            const cvrA = (test.conversions.a / test.visitors.a) * 100;
                            const cvrB = (test.conversions.b / test.visitors.b) * 100;
                            const improvement = ((cvrB - cvrA) / cvrA) * 100;

                            return (
                                <Card key={test.id} shadow="sm" radius="md" p="md" withBorder>
                                    <Group justify="space-between" mb="md">
                                        <div>
                                            <Group gap="xs">
                                                <Text fw={600}>{test.name}</Text>
                                                <Badge
                                                    color={test.status === 'running' ? 'blue' : 'green'}
                                                >
                                                    {test.status === 'running' ? 'Rodando' : 'Concluído'}
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                Confiança estatística: {test.confidence}%
                                            </Text>
                                        </div>
                                        {test.winner && (
                                            <Badge
                                                size="lg"
                                                variant="gradient"
                                                gradient={{ from: 'green', to: 'teal' }}
                                            >
                                                🏆 Vencedor: {test.winner}
                                            </Badge>
                                        )}
                                    </Group>

                                    <SimpleGrid cols={2} spacing="md">
                                        <Paper
                                            p="md"
                                            withBorder
                                            radius="sm"
                                            style={test.winner === 'A' ? { borderColor: 'var(--mantine-color-green-6)', borderWidth: 2 } : {}}
                                        >
                                            <Group justify="space-between" mb="sm">
                                                <Badge>Variante A</Badge>
                                                {test.winner === 'A' && <IconFlame size={16} color="green" />}
                                            </Group>
                                            <Text size="sm" mb="md">{test.pageA}</Text>
                                            <Group gap="xl">
                                                <div>
                                                    <Text size="xs" c="dimmed">Visitantes</Text>
                                                    <Text fw={500}>{test.visitors.a.toLocaleString()}</Text>
                                                </div>
                                                <div>
                                                    <Text size="xs" c="dimmed">Conversões</Text>
                                                    <Text fw={500}>{test.conversions.a}</Text>
                                                </div>
                                                <div>
                                                    <Text size="xs" c="dimmed">CVR</Text>
                                                    <Text fw={700} c={cvrA > cvrB ? 'green' : 'gray'}>{cvrA.toFixed(2)}%</Text>
                                                </div>
                                            </Group>
                                        </Paper>

                                        <Paper
                                            p="md"
                                            withBorder
                                            radius="sm"
                                            style={test.winner === 'B' ? { borderColor: 'var(--mantine-color-green-6)', borderWidth: 2 } : {}}
                                        >
                                            <Group justify="space-between" mb="sm">
                                                <Badge color="violet">Variante B</Badge>
                                                {test.winner === 'B' && <IconFlame size={16} color="green" />}
                                            </Group>
                                            <Text size="sm" mb="md">{test.pageB}</Text>
                                            <Group gap="xl">
                                                <div>
                                                    <Text size="xs" c="dimmed">Visitantes</Text>
                                                    <Text fw={500}>{test.visitors.b.toLocaleString()}</Text>
                                                </div>
                                                <div>
                                                    <Text size="xs" c="dimmed">Conversões</Text>
                                                    <Text fw={500}>{test.conversions.b}</Text>
                                                </div>
                                                <div>
                                                    <Text size="xs" c="dimmed">CVR</Text>
                                                    <Text fw={700} c={cvrB > cvrA ? 'green' : 'gray'}>{cvrB.toFixed(2)}%</Text>
                                                </div>
                                            </Group>
                                            {improvement > 0 && (
                                                <Badge
                                                    size="sm"
                                                    color="green"
                                                    variant="light"
                                                    mt="sm"
                                                    leftSection={<IconTrendingUp size={10} />}
                                                >
                                                    +{improvement.toFixed(0)}% vs A
                                                </Badge>
                                            )}
                                        </Paper>
                                    </SimpleGrid>

                                    {test.status === 'running' && (
                                        <Group mt="md" justify="flex-end">
                                            <Button size="xs" variant="subtle" color="red">
                                                Parar Teste
                                            </Button>
                                            <Button size="xs" variant="light">
                                                Declarar Vencedor
                                            </Button>
                                        </Group>
                                    )}
                                </Card>
                            );
                        })}

                        {/* Create new test */}
                        <Card
                            shadow="sm"
                            radius="md"
                            p="xl"
                            withBorder
                            style={{
                                border: '2px dashed var(--mantine-color-gray-4)',
                                cursor: 'pointer',
                            }}
                        >
                            <Group justify="center" gap="md">
                                <ThemeIcon size="lg" variant="light" color="gray">
                                    <IconPlus size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={500}>Criar Novo A/B Test</Text>
                                    <Text size="sm" c="dimmed">Teste variações de páginas e conteúdos</Text>
                                </div>
                            </Group>
                        </Card>
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            {/* Campaign Modal - Placeholder */}
            <Modal
                opened={campaignModalOpened}
                onClose={closeCampaignModal}
                title={
                    <Group gap="xs">
                        <IconTarget size={20} />
                        <Text fw={600}>Nova Campanha</Text>
                    </Group>
                }
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome da Campanha"
                        placeholder="Ex: English Adults - Q1 2026"
                    />
                    <Select
                        label="Canal"
                        data={[
                            { value: 'instagram', label: '📸 Instagram' },
                            { value: 'facebook', label: '📘 Facebook' },
                            { value: 'google', label: '🔍 Google Ads' },
                            { value: 'email', label: '📧 Email Marketing' },
                            { value: 'organic', label: '🌱 Orgânico' },
                        ]}
                    />
                    <Group grow>
                        <TextInput label="Data de Início" type="date" />
                        <TextInput label="Data de Fim" type="date" />
                    </Group>
                    <NumberInput
                        label="Budget (R$)"
                        placeholder="5000"
                        prefix="R$ "
                        thousandSeparator="."
                        decimalSeparator=","
                    />
                    <Textarea
                        label="Objetivo"
                        placeholder="Descreva o objetivo da campanha..."
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeCampaignModal}>
                            Cancelar
                        </Button>
                        <Button onClick={closeCampaignModal}>
                            Criar Campanha
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack >
    );
}

