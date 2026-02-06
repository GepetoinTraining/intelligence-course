'use client';

import {
    Title,
    Text,
    Card,
    SimpleGrid,
    Stack,
    Group,
    Badge,
    Progress,
    Avatar,
    Paper,
    ThemeIcon,
    Timeline,
    Button,
    ActionIcon,
} from '@mantine/core';
import {
    IconUsers,
    IconUserPlus,
    IconCalendarEvent,
    IconPhone,
    IconMail,
    IconMessageCircle,
    IconArrowRight,
    IconTrendingUp,
    IconClock,
    IconCheck,
    IconBrain,
    IconTarget,
    IconChartBar,
    IconPalette,
} from '@tabler/icons-react';
import Link from 'next/link';

// Mock data - will be replaced with API calls
const stats = {
    newLeads: 12,
    contactedToday: 8,
    trialsScheduled: 5,
    conversionsThisMonth: 15,
    conversionRate: 32,
};

const todayTrials = [
    { id: '1', name: 'Maria Silva', time: '10:00', class: 'English A1', room: 'Sala 1', status: 'confirmed' },
    { id: '2', name: 'João Santos', time: '14:30', class: 'Spanish A1', room: 'Sala 2', status: 'pending' },
    { id: '3', name: 'Ana Oliveira', time: '16:00', class: 'Intelligence', room: 'Lab', status: 'confirmed' },
];

const pendingFollowups = [
    { id: '1', name: 'Pedro Costa', daysAgo: 3, interest: 'English B1', lastContact: 'WhatsApp' },
    { id: '2', name: 'Carla Mendes', daysAgo: 5, interest: 'Spanish A2', lastContact: 'Call' },
    { id: '3', name: 'Rafael Lima', daysAgo: 7, interest: 'English A1', lastContact: 'Email' },
];

const recentActivity = [
    { id: '1', type: 'lead', text: 'Novo lead: Fernanda Rocha', time: '10 min atrás', source: 'Instagram' },
    { id: '2', type: 'trial', text: 'Trial confirmado: Maria Silva', time: '25 min atrás' },
    { id: '3', type: 'conversion', text: 'João matriculado em English A1', time: '1h atrás' },
    { id: '4', type: 'contact', text: 'WhatsApp enviado para 3 leads', time: '2h atrás' },
];

const statusColors: Record<string, string> = {
    confirmed: 'green',
    pending: 'yellow',
    cancelled: 'red',
};

const activityIcons: Record<string, any> = {
    lead: IconUserPlus,
    trial: IconCalendarEvent,
    conversion: IconCheck,
    contact: IconMessageCircle,
};

export default function StaffDashboardPage() {
    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={1}>Dashboard da Recepção</Title>
                    <Text c="dimmed" size="lg">
                        Acompanhe leads, trials e conversões
                    </Text>
                </div>
                <Group>
                    <Button
                        component={Link}
                        href="/staff/scrm"
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'indigo' }}
                        leftSection={<IconBrain size={18} />}
                    >
                        SCRM Pipeline
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/leads"
                        variant="filled"
                        leftSection={<IconUsers size={18} />}
                    >
                        Ver Pipeline
                    </Button>
                </Group>
            </Group>

            {/* Commercial Ops Navigation */}
            <Card shadow="sm" radius="md" p="md" withBorder>
                <Text fw={600} mb="md">Commercial Operations</Text>
                <SimpleGrid cols={{ base: 2, md: 5 }} spacing="sm">
                    <Button
                        component={Link}
                        href="/staff/presales"
                        variant="light"
                        color="blue"
                        fullWidth
                        leftSection={<IconUserPlus size={16} />}
                    >
                        Pré-Vendas
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/sales"
                        variant="light"
                        color="orange"
                        fullWidth
                        leftSection={<IconTarget size={16} />}
                    >
                        Vendas
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/sales-manager"
                        variant="light"
                        color="violet"
                        fullWidth
                        leftSection={<IconChartBar size={16} />}
                    >
                        Sales Manager
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/marketing"
                        variant="light"
                        color="pink"
                        fullWidth
                        leftSection={<IconPalette size={16} />}
                    >
                        Marketing
                    </Button>
                    <Button
                        component={Link}
                        href="/staff/scrm/insights"
                        variant="light"
                        color="grape"
                        fullWidth
                        leftSection={<IconBrain size={16} />}
                    >
                        SCRM Insights
                    </Button>
                </SimpleGrid>
            </Card>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconUserPlus size={20} />
                        </ThemeIcon>
                        <Badge color="blue" variant="light">Hoje</Badge>
                    </Group>
                    <Text size="xl" fw={700}>{stats.newLeads}</Text>
                    <Text size="sm" c="dimmed">Novos Leads</Text>
                </Card>

                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size="lg" variant="light" color="teal">
                            <IconPhone size={20} />
                        </ThemeIcon>
                        <Badge color="teal" variant="light">Hoje</Badge>
                    </Group>
                    <Text size="xl" fw={700}>{stats.contactedToday}</Text>
                    <Text size="sm" c="dimmed">Contatos Feitos</Text>
                </Card>

                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size="lg" variant="light" color="violet">
                            <IconCalendarEvent size={20} />
                        </ThemeIcon>
                        <Badge color="violet" variant="light">Semana</Badge>
                    </Group>
                    <Text size="xl" fw={700}>{stats.trialsScheduled}</Text>
                    <Text size="sm" c="dimmed">Trials Agendados</Text>
                </Card>

                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="xs">
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <Badge color="green" variant="light">{stats.conversionRate}%</Badge>
                    </Group>
                    <Text size="xl" fw={700}>{stats.conversionsThisMonth}</Text>
                    <Text size="sm" c="dimmed">Matrículas (Mês)</Text>
                </Card>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                {/* Today's Trials */}
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="md">
                        <Title order={3}>Trials de Hoje</Title>
                        <Button
                            variant="subtle"
                            size="xs"
                            rightSection={<IconArrowRight size={14} />}
                            component={Link}
                            href="/staff/trials"
                        >
                            Ver todos
                        </Button>
                    </Group>

                    {todayTrials.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">
                            Nenhum trial agendado para hoje
                        </Text>
                    ) : (
                        <Stack gap="sm">
                            {todayTrials.map((trial) => (
                                <Paper key={trial.id} p="md" withBorder radius="md">
                                    <Group justify="space-between">
                                        <Group>
                                            <Avatar color="blue" radius="xl">
                                                {trial.name.charAt(0)}
                                            </Avatar>
                                            <div>
                                                <Text fw={500}>{trial.name}</Text>
                                                <Text size="sm" c="dimmed">
                                                    {trial.class} • {trial.room}
                                                </Text>
                                            </div>
                                        </Group>
                                        <Group>
                                            <Badge color={statusColors[trial.status]}>
                                                {trial.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                            </Badge>
                                            <Text fw={600} size="lg">{trial.time}</Text>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Card>

                {/* Pending Follow-ups */}
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="md">
                        <Title order={3}>Aguardando Retorno</Title>
                        <Badge color="orange">{pendingFollowups.length} pendentes</Badge>
                    </Group>

                    <Stack gap="sm">
                        {pendingFollowups.map((lead) => (
                            <Paper key={lead.id} p="md" withBorder radius="md">
                                <Group justify="space-between">
                                    <Group>
                                        <Avatar color="orange" radius="xl">
                                            {lead.name.charAt(0)}
                                        </Avatar>
                                        <div>
                                            <Text fw={500}>{lead.name}</Text>
                                            <Text size="sm" c="dimmed">
                                                Interesse: {lead.interest}
                                            </Text>
                                        </div>
                                    </Group>
                                    <Group>
                                        <Text size="sm" c="dimmed">
                                            <IconClock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                            {lead.daysAgo}d atrás
                                        </Text>
                                        <Group gap="xs">
                                            <ActionIcon variant="light" color="green">
                                                <IconMessageCircle size={16} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="blue">
                                                <IconPhone size={16} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="violet">
                                                <IconMail size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Card>
            </SimpleGrid>

            {/* Recent Activity */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Title order={3} mb="md">Atividade Recente</Title>

                <Timeline active={-1} bulletSize={24} lineWidth={2}>
                    {recentActivity.map((activity) => {
                        const Icon = activityIcons[activity.type] || IconCheck;
                        return (
                            <Timeline.Item
                                key={activity.id}
                                bullet={<Icon size={12} />}
                                title={activity.text}
                            >
                                <Text size="xs" c="dimmed" mt={4}>
                                    {activity.time}
                                    {activity.source && ` • via ${activity.source}`}
                                </Text>
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            </Card>

            {/* Conversion Funnel Preview */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Title order={3}>Funil de Conversão (Este Mês)</Title>
                    <Button
                        variant="subtle"
                        size="xs"
                        rightSection={<IconArrowRight size={14} />}
                        component={Link}
                        href="/staff/leads"
                    >
                        Ver detalhes
                    </Button>
                </Group>

                <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
                    {[
                        { label: 'Novos', count: 45, color: 'blue' },
                        { label: 'Contatados', count: 38, color: 'cyan' },
                        { label: 'Qualificados', count: 25, color: 'teal' },
                        { label: 'Trial', count: 18, color: 'violet' },
                        { label: 'Matriculados', count: 15, color: 'green' },
                    ].map((stage, index, arr) => (
                        <Paper key={stage.label} p="md" withBorder ta="center">
                            <Text size="xl" fw={700} c={stage.color}>{stage.count}</Text>
                            <Text size="sm" c="dimmed">{stage.label}</Text>
                            {index < arr.length - 1 && (
                                <Progress
                                    value={(arr[index + 1].count / stage.count) * 100}
                                    color={stage.color}
                                    size="sm"
                                    mt="sm"
                                />
                            )}
                        </Paper>
                    ))}
                </SimpleGrid>
            </Card>
        </Stack>
    );
}

