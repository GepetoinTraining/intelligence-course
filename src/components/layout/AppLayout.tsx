'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    AppShell,
    Burger,
    Group,
    Text,
    NavLink,
    Avatar,
    Stack,
    Badge,
    Divider,
    ActionIcon,
    useMantineColorScheme,
    SegmentedControl,
    Box,
    Menu,
    ScrollArea,
    Loader,
    Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconHome,
    IconTerminal,
    IconSettings,
    IconRocket,
    IconBook,
    IconSun,
    IconMoon,
    IconChevronRight,
    IconUsers,
    IconSchool,
    IconUser,
    IconInbox,
    IconCash,
    IconBuildingBank,
    IconNotes,
    IconNotebook,
    IconSkull,
    IconChartBar,
    IconCube,
    IconBulb,
    IconStar,
    IconLock,
    IconCalendar,
    IconClipboard,
    IconSpeakerphone,
    IconUserPlus,
    IconQrcode,
    IconPackage,
    IconReceipt,
    IconTrendingUp,
    IconLayoutDashboard,
    IconReportAnalytics,
    IconBrandWhatsapp,
    IconMail,
    IconGift,
    IconFileText,
    IconLogout,
    IconChevronDown,
    IconPalette,
    IconShield,
    IconCoin,
    IconBriefcase,
    IconTarget,
    IconCheck,
    IconClipboardCheck,
    IconDiscount,
    IconUserCheck,
    IconTags,
    IconFileInvoice,
    IconBrandCashapp,
    IconCalculator,
    IconFileAnalytics,
    IconSparkles,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useUserContext, type UserRole as DbUserRole } from '@/hooks/useUser';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CommunicatorWidget } from '@/components/communicator/CommunicatorWidget';
import { OrgSwitcher } from '@/components/admin/OrgSwitcher';
import { IconBuilding } from '@tabler/icons-react';

interface AppLayoutProps {
    children: React.ReactNode;
}

const MODULE_1_LESSONS = [
    { id: 'lesson-1-1', title: '1.1 A Camada de Identidade' },
    { id: 'lesson-1-2', title: '1.2 A Camada Temporal' },
    { id: 'lesson-1-3', title: '1.3 A Camada Espacial' },
    { id: 'lesson-1-4', title: '1.4 O Context Stack' },
    { id: 'lesson-1-5', title: '1.5 O Vácuo (Prep)' },
    { id: 'lesson-1-6', title: '1.6 CAPSTONE' },
];

// Navigation role type (includes 'school' which maps to 'admin' in DB)
type NavRole = 'student' | 'teacher' | 'parent' | 'staff' | 'school' | 'owner' | 'accountant';

// Map DB roles to navigation roles
const mapRole = (dbRole: DbUserRole): NavRole => {
    if (dbRole === 'admin') return 'school';
    return dbRole as NavRole;
};

export function AppLayout({ children }: AppLayoutProps) {
    const [opened, { toggle }] = useDisclosure();
    const [moduleExpanded, setModuleExpanded] = useState(true);
    const pathname = usePathname();
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();

    // User context for real auth
    const { user, isLoading, role: userRole } = useUserContext();
    const isDevMode = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';
    const actualRole = mapRole(userRole);
    const isOwner = actualRole === 'owner';

    // In dev mode OR if owner, allow role switching; otherwise use real role
    const [viewAsRole, setViewAsRole] = useState<NavRole>('student');
    const canSwitchRoles = isDevMode || isOwner;
    const role: NavRole = canSwitchRoles ? viewAsRole : actualRole;

    // Org switcher state
    const [orgSwitcherOpen, setOrgSwitcherOpen] = useState(false);

    // When owner loads, default to owner view
    useEffect(() => {
        if (isOwner && viewAsRole === 'student') {
            setViewAsRole('owner');
        }
    }, [isOwner, viewAsRole]);

    const isActive = (path: string) => pathname === path;
    const isModulePath = pathname.startsWith('/m/module-1-orbit');

    // Role-based styling
    const roleColors: Record<NavRole, string> = {
        student: 'violet',
        teacher: 'blue',
        parent: 'green',
        staff: 'cyan',
        school: 'orange',
        owner: 'pink',
        accountant: 'teal',
    };

    const roleLabels: Record<NavRole, string> = {
        student: 'Aluno',
        teacher: 'Professor',
        parent: 'Responsável',
        staff: 'Equipe',
        school: 'Admin',
        owner: 'Dono',
        accountant: 'Contador',
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.name) {
            const parts = user.name.split(' ');
            return parts.length > 1
                ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                : parts[0].substring(0, 2).toUpperCase();
        }
        return role[0].toUpperCase();
    };

    // Loading state
    if (isLoading && !isDevMode) {
        return (
            <Center h="100vh">
                <Loader size="lg" />
            </Center>
        );
    }


    return (
        <AuthGuard>
            <AppShell
                header={{ height: 60 }}
                navbar={{
                    width: 280,
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened }
                }}
                padding="md"
            >
                {/* Header */}
                <AppShell.Header>
                    <Group h="100%" px="md" justify="space-between">
                        <Group>
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                            <Link href="/" style={{ textDecoration: 'none' }}>
                                <Group gap="xs">
                                    <IconRocket size={28} color={`var(--mantine-color-${roleColors[role]}-6)`} />
                                    <Text size="lg" fw={700} c={roleColors[role]}>
                                        Node Zero
                                    </Text>
                                </Group>
                            </Link>
                        </Group>

                        <Group>
                            <ActionIcon
                                variant="subtle"
                                size="lg"
                                onClick={() => toggleColorScheme()}
                                aria-label="Toggle color scheme"
                            >
                                {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
                            </ActionIcon>

                            <Menu shadow="md" width={200}>
                                <Menu.Target>
                                    <ActionIcon variant="subtle" size="lg">
                                        <Avatar
                                            size={32}
                                            radius="xl"
                                            color={roleColors[role]}
                                            src={user?.avatarUrl || undefined}
                                        >
                                            {getUserInitials()}
                                        </Avatar>
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>Conta</Menu.Label>
                                    <Menu.Item
                                        leftSection={<IconUser size={14} />}
                                        component={Link}
                                        href="/profile"
                                    >
                                        Meu Perfil
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<IconSettings size={14} />}
                                        component={Link}
                                        href="/settings"
                                    >
                                        Configurações
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<IconBuilding size={14} />}
                                        onClick={() => setOrgSwitcherOpen(true)}
                                    >
                                        Trocar Organização
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item color="red" leftSection={<IconLogout size={14} />}>
                                        Sair
                                    </Menu.Item>
                                </Menu.Dropdown>

                            </Menu>
                        </Group>
                    </Group>
                </AppShell.Header>

                {/* Sidebar */}
                <AppShell.Navbar p="md">
                    <AppShell.Section>
                        {/* Role Switcher (Dev Mode OR Owner) */}
                        {canSwitchRoles && (
                            <Box mb="sm">
                                <Text size="xs" c="dimmed" mb={4}>
                                    {isDevMode ? '🛠️ Dev Mode' : '👁️ Visualizar como'}: {roleLabels[role]}
                                </Text>
                                <SegmentedControl
                                    value={viewAsRole}
                                    onChange={(v) => setViewAsRole(v as NavRole)}
                                    data={[
                                        { label: <IconUser size={14} />, value: 'student' },
                                        { label: <IconSchool size={14} />, value: 'teacher' },
                                        { label: <IconUsers size={14} />, value: 'parent' },
                                        { label: <IconClipboard size={14} />, value: 'staff' },
                                        { label: <IconBuildingBank size={14} />, value: 'school' },
                                        { label: <IconTrendingUp size={14} />, value: 'owner' },
                                        { label: <IconCash size={14} />, value: 'accountant' },
                                    ]}
                                    fullWidth
                                    size="xs"
                                />
                            </Box>
                        )}
                        <Divider />
                    </AppShell.Section>

                    <AppShell.Section grow component={ScrollArea} scrollbarSize={6}>
                        <Stack gap="xs" mt="sm">
                            {/* ===== STUDENT NAVIGATION ===== */}
                            {role === 'student' && (
                                <>
                                    <NavLink
                                        component={Link}
                                        href="/dashboard"
                                        label="Dashboard"
                                        leftSection={<IconHome size={18} />}
                                        active={isActive('/dashboard')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/inbox"
                                        label="Mensagens"
                                        leftSection={<IconInbox size={18} />}
                                        active={isActive('/inbox') || pathname.startsWith('/inbox/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/playground"
                                        label="Prompt Playground"
                                        leftSection={<IconTerminal size={18} />}
                                        active={isActive('/playground')}
                                    />

                                    <Divider my="sm" label="Toolbox" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/student/prompts"
                                        label="Meus Prompts"
                                        leftSection={<IconNotes size={18} />}
                                        active={isActive('/student/prompts') || isActive('/prompts')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/student/journal"
                                        label="Run Journal"
                                        leftSection={<IconNotebook size={18} />}
                                        active={isActive('/student/journal') || isActive('/journal')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/student/graveyard"
                                        label="Graveyard"
                                        leftSection={<IconSkull size={18} />}
                                        active={isActive('/student/graveyard') || isActive('/graveyard')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/student/techniques"
                                        label="Técnicas"
                                        leftSection={<IconChartBar size={18} />}
                                        active={isActive('/student/techniques')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/student/todo"
                                        label="To-Do Cube"
                                        leftSection={<IconCube size={18} />}
                                        active={isActive('/student/todo')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/student/constellation"
                                        label="Constellation"
                                        leftSection={<IconStar size={18} />}
                                        active={isActive('/student/constellation')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/student/problems"
                                        label="Problem Lab"
                                        leftSection={<IconBulb size={18} />}
                                        active={isActive('/student/problems')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/student/workshop"
                                        label="Workshop"
                                        leftSection={<IconPalette size={18} />}
                                        active={isActive('/student/workshop')}
                                    />

                                    <Divider my="sm" label="Currículo" labelPosition="left" />

                                    <NavLink
                                        label="Módulo 1: The Orbit"
                                        description="Context Stacking"
                                        leftSection={<IconBook size={18} />}
                                        rightSection={<Badge size="xs" color="cyan" variant="light">6 lições</Badge>}
                                        opened={moduleExpanded}
                                        onChange={() => setModuleExpanded(!moduleExpanded)}
                                        active={isModulePath}
                                    >
                                        <NavLink
                                            component={Link}
                                            href="/m/module-1-orbit"
                                            label="Visão Geral"
                                            pl="lg"
                                            active={pathname === '/m/module-1-orbit'}
                                        />
                                        {MODULE_1_LESSONS.map((lesson) => (
                                            <NavLink
                                                key={lesson.id}
                                                component={Link}
                                                href={`/m/module-1-orbit/l/${lesson.id}`}
                                                label={lesson.title}
                                                pl="lg"
                                                active={pathname === `/m/module-1-orbit/l/${lesson.id}`}
                                            />
                                        ))}
                                    </NavLink>

                                    <NavLink
                                        label="Módulo 2: The Slingshot"
                                        description="Em breve"
                                        leftSection={<IconBook size={18} />}
                                        disabled
                                        rightSection={<Badge size="xs" color="gray" variant="light">Bloqueado</Badge>}
                                    />
                                </>
                            )}

                            {/* ===== TEACHER NAVIGATION ===== */}
                            {role === 'teacher' && (
                                <>
                                    <NavLink
                                        component={Link}
                                        href="/teacher"
                                        label="Painel do Professor"
                                        leftSection={<IconHome size={18} />}
                                        active={isActive('/teacher')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/inbox"
                                        label="Mensagens"
                                        leftSection={<IconInbox size={18} />}
                                        active={isActive('/inbox')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/teacher/schedule"
                                        label="Minha Agenda"
                                        leftSection={<IconCalendar size={18} />}
                                        active={isActive('/teacher/schedule')}
                                    />

                                    <Divider my="sm" label="Operacional" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/teacher/attendance"
                                        label="Frequência"
                                        leftSection={<IconClipboardCheck size={18} />}
                                        active={isActive('/teacher/attendance')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/teacher/grades"
                                        label="Notas"
                                        leftSection={<IconCheck size={18} />}
                                        active={isActive('/teacher/grades')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/teacher/students"
                                        label="Meus Alunos"
                                        leftSection={<IconUsers size={18} />}
                                        active={isActive('/teacher/students') || pathname.startsWith('/teacher/students/')}
                                    />

                                    <Divider my="sm" label="Minhas Turmas" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/teacher/classes/class-1"
                                        label="Intelligence - Manhã"
                                        description="24 alunos"
                                        leftSection={<IconSchool size={18} />}
                                        active={pathname.includes('class-1')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/teacher/classes/class-2"
                                        label="Intelligence - Tarde"
                                        description="18 alunos"
                                        leftSection={<IconSchool size={18} />}
                                        active={pathname.includes('class-2')}
                                    />

                                    <Divider my="sm" label="Ferramentas" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/playground"
                                        label="Prompt Playground"
                                        leftSection={<IconTerminal size={18} />}
                                        active={isActive('/playground')}
                                    />
                                </>
                            )}

                            {/* ===== PARENT NAVIGATION ===== */}
                            {role === 'parent' && (
                                <>
                                    <NavLink
                                        component={Link}
                                        href="/parent"
                                        label="Portal dos Pais"
                                        leftSection={<IconHome size={18} />}
                                        active={isActive('/parent')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/inbox"
                                        label="Mensagens"
                                        leftSection={<IconInbox size={18} />}
                                        active={isActive('/inbox')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/financial"
                                        label="Financeiro"
                                        leftSection={<IconCash size={18} />}
                                        active={isActive('/financial')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/profile"
                                        label="Meu Perfil"
                                        leftSection={<IconUser size={18} />}
                                        active={isActive('/profile')}
                                    />

                                    <Divider my="sm" label="Meus Filhos" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/parent/child/lucas"
                                        label="Lucas Silva"
                                        description="Intelligence - Manhã"
                                        leftSection={<Avatar size={24} radius="xl" color="violet">LS</Avatar>}
                                        active={pathname.includes('/child/lucas')}
                                    />

                                    <Divider my="sm" label="Progresso" labelPosition="left" />

                                    <NavLink
                                        label="Módulo 1: The Orbit"
                                        description="67% completo"
                                        leftSection={<IconBook size={18} />}
                                        rightSection={<Badge size="xs" color="green">67%</Badge>}
                                    />
                                </>
                            )}

                            {/* ===== STAFF NAVIGATION ===== */}
                            {role === 'staff' && (
                                <>
                                    <NavLink
                                        component={Link}
                                        href="/staff"
                                        label="Painel Staff"
                                        leftSection={<IconLayoutDashboard size={18} />}
                                        active={isActive('/staff')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/inbox"
                                        label="Mensagens"
                                        leftSection={<IconInbox size={18} />}
                                        active={isActive('/inbox')}
                                    />

                                    <Divider my="sm" label="Commercial Ops" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/staff/presales"
                                        label="Pré-Vendas"
                                        description="TOFU/MOFU + 3x3"
                                        leftSection={<IconUserPlus size={18} />}
                                        active={isActive('/staff/presales')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/sales"
                                        label="Vendas"
                                        description="BOFU + Fechamento"
                                        leftSection={<IconTarget size={18} />}
                                        active={isActive('/staff/sales')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/sales-manager"
                                        label="Sales Manager"
                                        description="Pipeline + Regras"
                                        leftSection={<IconReportAnalytics size={18} />}
                                        active={isActive('/staff/sales-manager')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/marketing"
                                        label="Marketing"
                                        description="Campanhas + A/B"
                                        leftSection={<IconSpeakerphone size={18} />}
                                        active={isActive('/staff/marketing')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/scrm"
                                        label="SCRM Pipeline"
                                        description="Funil Completo"
                                        leftSection={<IconSparkles size={18} />}
                                        active={isActive('/staff/scrm') || pathname.startsWith('/staff/scrm/')}
                                    />

                                    <Divider my="sm" label="CRM Operacional" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/staff/leads"
                                        label="Pipeline de Leads"
                                        leftSection={<IconUsers size={18} />}
                                        active={isActive('/staff/leads') || pathname.startsWith('/staff/leads/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/trials"
                                        label="Trials"
                                        leftSection={<IconCalendar size={18} />}
                                        active={isActive('/staff/trials')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/checkin"
                                        label="Check-in / Front Desk"
                                        leftSection={<IconQrcode size={18} />}
                                        active={isActive('/staff/checkin')}
                                    />

                                    <Divider my="sm" label="Marketing (Legacy)" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/marketing/campaigns"
                                        label="Campanhas"
                                        leftSection={<IconSpeakerphone size={18} />}
                                        active={isActive('/marketing/campaigns')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/marketing/templates"
                                        label="Templates"
                                        leftSection={<IconMail size={18} />}
                                        active={isActive('/marketing/templates')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/marketing/referrals"
                                        label="Indicações"
                                        leftSection={<IconGift size={18} />}
                                        active={isActive('/marketing/referrals')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/marketing/lead-form"
                                        label="Captura de Leads"
                                        leftSection={<IconFileText size={18} />}
                                        active={isActive('/marketing/lead-form')}
                                    />

                                    <Divider my="sm" label="Ferramentas" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/staff/landing-builder"
                                        label="Landing Builder"
                                        leftSection={<IconPalette size={18} />}
                                        active={isActive('/staff/landing-builder')}
                                    />

                                    <Divider my="sm" label="Conhecimento" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/wiki"
                                        label="Base de Conhecimento"
                                        leftSection={<IconBook size={18} />}
                                        active={isActive('/wiki') || pathname.startsWith('/wiki/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/kaizen"
                                        label="Melhorias (Kaizen)"
                                        leftSection={<IconBulb size={18} />}
                                        active={isActive('/kaizen') || pathname.startsWith('/kaizen/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/teams"
                                        label="Equipes & Funções"
                                        leftSection={<IconUsers size={18} />}
                                        active={isActive('/teams') || pathname.startsWith('/teams/')}
                                    />
                                </>
                            )}

                            {/* ===== SCHOOL ADMIN NAVIGATION ===== */}
                            {role === 'school' && (
                                <>
                                    <NavLink
                                        component={Link}
                                        href="/school"
                                        label="Dashboard Admin"
                                        leftSection={<IconLayoutDashboard size={18} />}
                                        active={isActive('/school')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/inbox"
                                        label="Mensagens"
                                        leftSection={<IconInbox size={18} />}
                                        active={isActive('/inbox')}
                                    />

                                    <Divider my="sm" label="Acadêmico" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/school/courses"
                                        label="Cursos"
                                        leftSection={<IconBook size={18} />}
                                        active={isActive('/school/courses') || pathname.startsWith('/school/courses/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/school/levels"
                                        label="Níveis"
                                        leftSection={<IconChartBar size={18} />}
                                        active={isActive('/school/levels')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/school/schedule"
                                        label="Grade Horária"
                                        leftSection={<IconCalendar size={18} />}
                                        active={isActive('/school/schedule')}
                                    />

                                    <Divider my="sm" label="Gestão" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/school/students"
                                        label="Alunos"
                                        leftSection={<IconUsers size={18} />}
                                        active={isActive('/school/students') || pathname.startsWith('/school/students/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/school/teachers"
                                        label="Professores"
                                        leftSection={<IconSchool size={18} />}
                                        active={isActive('/school/teachers')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/school/classes"
                                        label="Turmas"
                                        leftSection={<IconClipboard size={18} />}
                                        active={isActive('/school/classes')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/school/terms"
                                        label="Períodos"
                                        leftSection={<IconCalendar size={18} />}
                                        active={isActive('/school/terms')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/school/enrollments"
                                        label="Matrículas"
                                        leftSection={<IconUserCheck size={18} />}
                                        active={isActive('/school/enrollments')}
                                    />

                                    <Divider my="sm" label="Comercial" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/school/products"
                                        label="Produtos"
                                        leftSection={<IconPackage size={18} />}
                                        active={isActive('/school/products')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/school/discounts"
                                        label="Descontos"
                                        leftSection={<IconDiscount size={18} />}
                                        active={isActive('/school/discounts')}
                                    />

                                    <Divider my="sm" label="Infraestrutura" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/school/rooms"
                                        label="Salas"
                                        leftSection={<IconBuildingBank size={18} />}
                                        active={isActive('/school/rooms')}
                                    />

                                    <Divider my="sm" label="Conhecimento" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/wiki"
                                        label="Base de Conhecimento"
                                        leftSection={<IconBook size={18} />}
                                        active={isActive('/wiki') || pathname.startsWith('/wiki/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/kaizen"
                                        label="Melhorias (Kaizen)"
                                        leftSection={<IconBulb size={18} />}
                                        active={isActive('/kaizen') || pathname.startsWith('/kaizen/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/teams"
                                        label="Equipes & Funções"
                                        leftSection={<IconUsers size={18} />}
                                        active={isActive('/teams') || pathname.startsWith('/teams/')}
                                    />
                                </>
                            )}

                            {/* ===== OWNER NAVIGATION ===== */}
                            {role === 'owner' && (
                                <>
                                    <NavLink
                                        component={Link}
                                        href="/owner"
                                        label="Visão Executiva"
                                        leftSection={<IconTrendingUp size={18} />}
                                        active={isActive('/owner')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/inbox"
                                        label="Mensagens"
                                        leftSection={<IconInbox size={18} />}
                                        active={isActive('/inbox')}
                                    />

                                    <Divider my="sm" label="Commercial Ops" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/staff/presales"
                                        label="Pré-Vendas"
                                        description="TOFU/MOFU + 3x3"
                                        leftSection={<IconUserPlus size={18} />}
                                        active={isActive('/staff/presales')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/sales"
                                        label="Vendas"
                                        description="BOFU + Fechamento"
                                        leftSection={<IconTarget size={18} />}
                                        active={isActive('/staff/sales')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/sales-manager"
                                        label="Sales Manager"
                                        description="Pipeline + Regras"
                                        leftSection={<IconReportAnalytics size={18} />}
                                        active={isActive('/staff/sales-manager')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/marketing"
                                        label="Marketing"
                                        description="Campanhas + A/B"
                                        leftSection={<IconSpeakerphone size={18} />}
                                        active={isActive('/staff/marketing')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/staff/scrm"
                                        label="SCRM Pipeline"
                                        description="Funil Completo"
                                        leftSection={<IconSparkles size={18} />}
                                        active={isActive('/staff/scrm') || pathname.startsWith('/staff/scrm/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/crm"
                                        label="Funil CAC → LTV"
                                        leftSection={<IconTrendingUp size={18} />}
                                        active={isActive('/owner/crm')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/unit-economics"
                                        label="Unit Economics"
                                        description="CAC-LTV + Cohorts"
                                        leftSection={<IconChartBar size={18} />}
                                        active={isActive('/owner/unit-economics')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/talent-pool"
                                        label="Talent Pool"
                                        leftSection={<IconBriefcase size={18} />}
                                        active={isActive('/owner/talent-pool')}
                                    />
                                    <Divider my="sm" label="Financeiro" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/owner/cashflow"
                                        label="Fluxo de Caixa"
                                        leftSection={<IconCash size={18} />}
                                        active={isActive('/owner/cashflow')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/revenue"
                                        label="Receitas"
                                        leftSection={<IconReceipt size={18} />}
                                        active={isActive('/owner/revenue')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/payables"
                                        label="Contas a Pagar"
                                        leftSection={<IconFileInvoice size={18} />}
                                        active={isActive('/owner/payables')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/projections"
                                        label="Projeções"
                                        leftSection={<IconChartBar size={18} />}
                                        active={isActive('/owner/projections')}
                                    />

                                    <Divider my="sm" label="Pessoal" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/owner/employees"
                                        label="Funcionários"
                                        leftSection={<IconUsers size={18} />}
                                        active={isActive('/owner/employees')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/payroll"
                                        label="Folha de Pagamento"
                                        leftSection={<IconBrandCashapp size={18} />}
                                        active={isActive('/owner/payroll')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/permissions"
                                        label="Permissões"
                                        leftSection={<IconShield size={18} />}
                                        active={isActive('/owner/permissions')}
                                    />

                                    <Divider my="sm" label="Contabilidade" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/owner/accounting"
                                        label="Plano de Contas"
                                        leftSection={<IconCalculator size={18} />}
                                        active={isActive('/owner/accounting')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/reports"
                                        label="Relatórios"
                                        leftSection={<IconFileAnalytics size={18} />}
                                        active={isActive('/owner/reports') || pathname.startsWith('/owner/reports/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/owner/analytics"
                                        label="Business Intelligence"
                                        leftSection={<IconReportAnalytics size={18} />}
                                        active={isActive('/owner/analytics')}
                                    />

                                    <Divider my="sm" label="Recrutamento" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/careers"
                                        label="Portal de Carreiras"
                                        leftSection={<IconBriefcase size={18} />}
                                        active={isActive('/careers')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/careers/talent-pool"
                                        label="Banco de Talentos"
                                        leftSection={<IconTarget size={18} />}
                                        active={isActive('/careers/talent-pool')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/lattice/demo"
                                        label="Lattice HR (Demo)"
                                        leftSection={<IconStar size={18} />}
                                        active={isActive('/lattice/demo')}
                                    />

                                    <Divider my="sm" label="Conhecimento" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/wiki"
                                        label="Base de Conhecimento"
                                        leftSection={<IconBook size={18} />}
                                        active={isActive('/wiki') || pathname.startsWith('/wiki/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/kaizen"
                                        label="Melhorias (Kaizen)"
                                        leftSection={<IconBulb size={18} />}
                                        active={isActive('/kaizen') || pathname.startsWith('/kaizen/')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/teams"
                                        label="Equipes & Funções"
                                        leftSection={<IconUsers size={18} />}
                                        active={isActive('/teams') || pathname.startsWith('/teams/')}
                                    />
                                </>
                            )}

                            {/* ===== ACCOUNTANT NAVIGATION ===== */}
                            {role === 'accountant' && (
                                <>
                                    <NavLink
                                        component={Link}
                                        href="/accountant"
                                        label="Portal Contábil"
                                        leftSection={<IconBuildingBank size={18} />}
                                        active={isActive('/accountant')}
                                    />

                                    <Divider my="sm" label="Exportações" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/accountant"
                                        label="Livro Diário"
                                        leftSection={<IconBook size={18} />}
                                        active={isActive('/accountant/livro-diario')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/accountant"
                                        label="Balancete"
                                        leftSection={<IconChartBar size={18} />}
                                        active={isActive('/accountant/balancete')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/accountant"
                                        label="Notas Fiscais"
                                        leftSection={<IconReceipt size={18} />}
                                        active={isActive('/accountant/notas-fiscais')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/accountant"
                                        label="Folha de Pagamento"
                                        leftSection={<IconCash size={18} />}
                                        active={isActive('/accountant/folha')}
                                    />

                                    <Divider my="sm" label="SPED" labelPosition="left" />

                                    <NavLink
                                        component={Link}
                                        href="/accountant"
                                        label="ECD Contábil"
                                        leftSection={<IconFileText size={18} />}
                                        active={isActive('/accountant/ecd')}
                                    />
                                    <NavLink
                                        component={Link}
                                        href="/accountant"
                                        label="ECF Fiscal"
                                        leftSection={<IconFileText size={18} />}
                                        active={isActive('/accountant/ecf')}
                                    />
                                </>
                            )}
                        </Stack>
                    </AppShell.Section>

                    <AppShell.Section>
                        {/* Bottom Section */}
                        <Divider my="sm" />
                        <NavLink
                            component={Link}
                            href="/profile"
                            label="Meu Perfil"
                            leftSection={<IconUser size={18} />}
                            active={isActive('/profile')}
                        />
                        <NavLink
                            component={Link}
                            href="/settings"
                            label="Configurações"
                            leftSection={<IconSettings size={18} />}
                            active={isActive('/settings')}
                        />

                        {/* User Info */}
                        <Group mt="sm" p="sm" style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-md)' }}>
                            <Avatar
                                size={32}
                                radius="xl"
                                color={roleColors[role]}
                                src={user?.avatarUrl || undefined}
                            >
                                {getUserInitials()}
                            </Avatar>
                            <Stack gap={0} style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>
                                    {user?.name || 'Usuário'}
                                </Text>
                                <Badge size="xs" variant="light" color={roleColors[role]}>
                                    {roleLabels[role]}
                                </Badge>
                            </Stack>
                        </Group>
                    </AppShell.Section>
                </AppShell.Navbar>

                {/* Main Content */}
                <AppShell.Main>
                    {children}
                </AppShell.Main>
                {/* Org Switcher Modal */}
                <OrgSwitcher opened={orgSwitcherOpen} onClose={() => setOrgSwitcherOpen(false)} />

                {/* Floating Communicator Widget */}
                <CommunicatorWidget />
            </AppShell>

        </AuthGuard >
    );
}


