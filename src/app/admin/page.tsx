'use client';

import {
    Title,
    Text,
    Stack,
    Group,
    Card,
    SimpleGrid,
    ThemeIcon,
    Badge,
    Paper,
    RingProgress,
    Center,
} from '@mantine/core';
import {
    IconSpeakerphone,
    IconBriefcase,
    IconClipboardCheck,
    IconBook,
    IconCash,
    IconUserCog,
    IconMessageCircle,
    IconCalendar,
    IconChartPie,
    IconCalculator,
    IconLibrary,
    IconRobot,
    IconRefreshDot,
    IconSettings,
    IconUsers,
    IconTrendingUp,
    IconArrowUpRight,
    IconArrowDownRight,
} from '@tabler/icons-react';
import Link from 'next/link';

interface BundleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    href: string;
    stats?: { label: string; value: string | number; trend?: 'up' | 'down' };
}

function BundleCard({ title, description, icon, color, href, stats }: BundleCardProps) {
    return (
        <Card
            component={Link}
            href={href}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer', transition: 'transform 150ms, box-shadow 150ms' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
            }}
        >
            <Group justify="space-between" mb="xs">
                <ThemeIcon variant="light" color={color} size="lg" radius="md">
                    {icon}
                </ThemeIcon>
                {stats && (
                    <Badge
                        variant="light"
                        color={stats.trend === 'up' ? 'green' : stats.trend === 'down' ? 'red' : 'gray'}
                        leftSection={
                            stats.trend === 'up' ? <IconArrowUpRight size={12} /> :
                                stats.trend === 'down' ? <IconArrowDownRight size={12} /> : null
                        }
                    >
                        {stats.value}
                    </Badge>
                )}
            </Group>
            <Text fw={600} size="md">{title}</Text>
            <Text size="sm" c="dimmed" mt={4}>{description}</Text>
        </Card>
    );
}

export default function AdminDashboard() {
    const bundles: BundleCardProps[] = [
        {
            title: 'Marketing',
            description: 'Campanhas, leads, origens',
            icon: <IconSpeakerphone size={20} />,
            color: 'pink',
            href: '/admin/marketing/campanhas',
            stats: { label: 'Leads', value: 47, trend: 'up' },
        },
        {
            title: 'Comercial',
            description: 'Pipeline, propostas, metas',
            icon: <IconBriefcase size={20} />,
            color: 'blue',
            href: '/admin/comercial/pipeline',
            stats: { label: 'Oportunidades', value: 12, trend: 'up' },
        },
        {
            title: 'Operacional',
            description: 'Check-in, matrículas, contratos',
            icon: <IconClipboardCheck size={20} />,
            color: 'teal',
            href: '/admin/operacional/checkin',
            stats: { label: 'Hoje', value: 156 },
        },
        {
            title: 'Pedagógico',
            description: 'Cursos, turmas, notas',
            icon: <IconBook size={20} />,
            color: 'purple',
            href: '/admin/pedagogico/turmas',
            stats: { label: 'Turmas', value: 24 },
        },
        {
            title: 'Financeiro',
            description: 'Recebíveis, fluxo de caixa',
            icon: <IconCash size={20} />,
            color: 'green',
            href: '/admin/financeiro/recebiveis',
            stats: { label: 'A Receber', value: 'R$ 145k' },
        },
        {
            title: 'RH & Pessoas',
            description: 'Colaboradores, folha, comissões',
            icon: <IconUserCog size={20} />,
            color: 'orange',
            href: '/admin/rh/colaboradores',
            stats: { label: 'Equipe', value: 32 },
        },
        {
            title: 'Comunicação',
            description: 'Mensagens, avisos, WhatsApp',
            icon: <IconMessageCircle size={20} />,
            color: 'cyan',
            href: '/admin/comunicacao/inbox',
            stats: { label: 'Não lidas', value: 8 },
        },
        {
            title: 'Agenda',
            description: 'Calendários, salas, recursos',
            icon: <IconCalendar size={20} />,
            color: 'yellow',
            href: '/admin/agenda/pessoal',
            stats: { label: 'Hoje', value: 14 },
        },
        {
            title: 'Relatórios & BI',
            description: 'Dashboards, KPIs, exportações',
            icon: <IconChartPie size={20} />,
            color: 'indigo',
            href: '/admin/relatorios/dashboards',
        },
        {
            title: 'Contábil',
            description: 'Plano de contas, SPED, NFS-e',
            icon: <IconCalculator size={20} />,
            color: 'lime',
            href: '/admin/contabil/plano-contas',
        },
        {
            title: 'Conhecimento',
            description: 'Wiki, procedimentos, políticas',
            icon: <IconLibrary size={20} />,
            color: 'grape',
            href: '/admin/conhecimento/wiki',
            stats: { label: 'Artigos', value: 89 },
        },
        {
            title: 'Assistente IA',
            description: 'Chat, geradores, análises',
            icon: <IconRobot size={20} />,
            color: 'violet',
            href: '/admin/ai/chat',
        },
        {
            title: 'Kaizen',
            description: 'Sugestões, feedback, NPS',
            icon: <IconRefreshDot size={20} />,
            color: 'amber',
            href: '/admin/kaizen/sugestoes',
            stats: { label: 'Pendentes', value: 5 },
        },
        {
            title: 'Configurações',
            description: 'Escola, usuários, permissões',
            icon: <IconSettings size={20} />,
            color: 'gray',
            href: '/admin/configuracoes/escola',
        },
    ];

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Bem-vindo de volta</Text>
                    <Title order={2}>Dashboard Administrativo</Title>
                </div>
                <Badge size="lg" variant="light" color="blue">
                    Fevereiro 2026
                </Badge>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper p="md" radius="md" withBorder>
                    <Group>
                        <RingProgress
                            size={60}
                            thickness={6}
                            sections={[{ value: 78, color: 'green' }]}
                            label={
                                <Center>
                                    <IconTrendingUp size={18} color="var(--mantine-color-green-6)" />
                                </Center>
                            }
                        />
                        <div>
                            <Text size="xs" c="dimmed">Meta do Mês</Text>
                            <Text fw={700} size="lg">78%</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group>
                        <ThemeIcon size={50} radius="md" variant="light" color="blue">
                            <IconUsers size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Alunos Ativos</Text>
                            <Text fw={700} size="lg">1,247</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group>
                        <ThemeIcon size={50} radius="md" variant="light" color="green">
                            <IconCash size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Receita Mensal</Text>
                            <Text fw={700} size="lg">R$ 287k</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group>
                        <ThemeIcon size={50} radius="md" variant="light" color="orange">
                            <IconUserCog size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Equipe</Text>
                            <Text fw={700} size="lg">32</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Bundle Grid */}
            <div>
                <Text size="sm" fw={500} c="dimmed" mb="sm">Módulos</Text>
                <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }} spacing="md">
                    {bundles.map((bundle) => (
                        <BundleCard key={bundle.title} {...bundle} />
                    ))}
                </SimpleGrid>
            </div>
        </Stack>
    );
}

