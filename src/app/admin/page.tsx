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
    Button,
    ActionIcon,
    Tooltip,
    Divider,
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
    IconLogin,
    IconUserPlus,
    IconFileText,
    IconTarget,
    IconPhoneCall,
    IconCheckbox,
    IconCrown,
    IconShield,
    IconRocket,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useUserContext, type UserRole } from '@/hooks/useUser';

// ── Types ──────────────────────────────────────────────────────────────────

interface BundleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    href: string;
    stats?: { label: string; value: string | number; trend?: 'up' | 'down' };
}

interface QuickAction {
    label: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

// ── Tier detection ─────────────────────────────────────────────────────────

type ViewTier = 'strategic' | 'tactical' | 'operational';

function getTier(role: UserRole): ViewTier {
    if (role === 'owner' || role === 'admin') return 'strategic';
    if (role === 'accountant') return 'tactical'; // limited tactical view
    return 'operational'; // staff default, will upgrade to tactical with team leader detection later
}

// ── Bundle Card Component ──────────────────────────────────────────────────

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

// ── Quick Action Button ────────────────────────────────────────────────────

function QuickActionCard({ label, icon, href, color }: QuickAction) {
    return (
        <Card
            component={Link}
            href={href}
            shadow="xs"
            padding="md"
            radius="md"
            withBorder
            style={{
                cursor: 'pointer',
                transition: 'all 150ms',
                textAlign: 'center',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.borderColor = `var(--mantine-color-${color}-5)`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = '';
            }}
        >
            <Stack align="center" gap="xs">
                <ThemeIcon variant="light" color={color} size={48} radius="xl">
                    {icon}
                </ThemeIcon>
                <Text size="sm" fw={500}>{label}</Text>
            </Stack>
        </Card>
    );
}

// ── Strategic Dashboard (Owner/Admin) ──────────────────────────────────────

function StrategicDashboard() {
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
                    <Title order={2}>Dashboard Estratégico</Title>
                </div>
                <Group gap="xs">
                    <Badge size="lg" variant="light" color="violet" leftSection={<IconCrown size={14} />}>
                        Visão Geral
                    </Badge>
                    <Badge size="lg" variant="light" color="blue">
                        Fevereiro 2026
                    </Badge>
                </Group>
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

// ── Operational Dashboard (Staff / Entry-level) ────────────────────────────

function OperationalDashboard() {
    const quickActions: QuickAction[] = [
        { label: 'Check-in', icon: <IconLogin size={24} />, href: '/admin/operacional/checkin', color: 'teal' },
        { label: 'Novo Lead', icon: <IconUserPlus size={24} />, href: '/admin/marketing/leads', color: 'pink' },
        { label: 'Pipeline', icon: <IconTarget size={24} />, href: '/admin/comercial/pipeline', color: 'blue' },
        { label: 'Follow-ups', icon: <IconPhoneCall size={24} />, href: '/admin/comercial/followups', color: 'orange' },
        { label: 'Matrículas', icon: <IconCheckbox size={24} />, href: '/admin/operacional/matriculas', color: 'green' },
        { label: 'Propostas', icon: <IconFileText size={24} />, href: '/admin/comercial/propostas', color: 'violet' },
        { label: 'Minha Agenda', icon: <IconCalendar size={24} />, href: '/admin/agenda/pessoal', color: 'yellow' },
        { label: 'Chat IA', icon: <IconRobot size={24} />, href: '/admin/ai/chat', color: 'grape' },
    ];

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Bom dia 👋</Text>
                    <Title order={2}>Suas Tarefas</Title>
                </div>
                <Badge size="lg" variant="light" color="teal" leftSection={<IconRocket size={14} />}>
                    Modo Execução
                </Badge>
            </Group>

            {/* Quick Actions */}
            <div>
                <Text size="sm" fw={500} c="dimmed" mb="sm">Ações Rápidas</Text>
                <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="md">
                    {quickActions.map((action) => (
                        <QuickActionCard key={action.label} {...action} />
                    ))}
                </SimpleGrid>
            </div>

            <Divider />

            {/* Today's Activity */}
            <div>
                <Text size="sm" fw={500} c="dimmed" mb="sm">Atividade Recente</Text>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    <Paper p="md" radius="md" withBorder>
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="teal">
                                <IconLogin size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="sm" fw={600}>Check-ins Hoje</Text>
                                <Text size="xs" c="dimmed">156 realizados</Text>
                            </div>
                        </Group>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="pink">
                                <IconUserPlus size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="sm" fw={600}>Novos Leads</Text>
                                <Text size="xs" c="dimmed">12 esta semana</Text>
                            </div>
                        </Group>
                    </Paper>
                    <Paper p="md" radius="md" withBorder>
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="orange">
                                <IconPhoneCall size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="sm" fw={600}>Follow-ups Pendentes</Text>
                                <Text size="xs" c="dimmed">8 para hoje</Text>
                            </div>
                        </Group>
                    </Paper>
                </SimpleGrid>
            </div>
        </Stack>
    );
}

// ── Accountant Dashboard ───────────────────────────────────────────────────

function AccountantDashboard() {
    const bundles: BundleCardProps[] = [
        {
            title: 'Financeiro',
            description: 'Recebíveis, pagamentos, fluxo de caixa',
            icon: <IconCash size={20} />,
            color: 'green',
            href: '/admin/financeiro/recebiveis',
            stats: { label: 'A Receber', value: 'R$ 145k' },
        },
        {
            title: 'Contábil',
            description: 'Plano de contas, SPED, NFS-e, DRE',
            icon: <IconCalculator size={20} />,
            color: 'lime',
            href: '/admin/contabil/plano-contas',
        },
        {
            title: 'Relatórios & BI',
            description: 'Dashboards, KPIs, exportações',
            icon: <IconChartPie size={20} />,
            color: 'indigo',
            href: '/admin/relatorios/dashboards',
        },
    ];

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Portal do Contador</Text>
                    <Title order={2}>Dashboard Contábil</Title>
                </div>
                <Badge size="lg" variant="light" color="lime" leftSection={<IconCalculator size={14} />}>
                    Fevereiro 2026
                </Badge>
            </Group>

            {/* Financial quick stats */}
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
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
                        <ThemeIcon size={50} radius="md" variant="light" color="red">
                            <IconArrowDownRight size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Inadimplência</Text>
                            <Text fw={700} size="lg">R$ 23k</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group>
                        <ThemeIcon size={50} radius="md" variant="light" color="lime">
                            <IconCheckbox size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">NFS-e Emitidas</Text>
                            <Text fw={700} size="lg">342</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Modules */}
            <div>
                <Text size="sm" fw={500} c="dimmed" mb="sm">Módulos</Text>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {bundles.map((bundle) => (
                        <BundleCard key={bundle.title} {...bundle} />
                    ))}
                </SimpleGrid>
            </div>
        </Stack>
    );
}

// ── Main Dashboard Router ──────────────────────────────────────────────────

export default function AdminDashboard() {
    const { role } = useUserContext();
    const tier = getTier(role);

    if (role === 'accountant') return <AccountantDashboard />;
    if (tier === 'strategic') return <StrategicDashboard />;
    return <OperationalDashboard />;
}
