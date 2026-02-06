'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
    NavLink,
    Stack,
    Badge,
    Divider,
    ScrollArea,
    Collapse,
    ThemeIcon,
    Box,
    Text,
} from '@mantine/core';
import {
    IconHome,
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
    IconChevronRight,
    // Marketing
    IconFlag,
    IconUserPlus,
    IconRoute,
    IconBrowserCheck,
    IconArticle,
    IconShare,
    IconChartBar,
    // Comercial
    IconTimeline,
    IconTarget,
    IconFileText,
    IconScale,
    IconPhoneCall,
    IconChartArrowsVertical,
    IconTrophy,
    // Operacional
    IconLogin,
    IconUserCheck,
    IconSchool,
    IconUsers,
    IconSignature,
    IconRefresh,
    IconUserOff,
    IconArrowsExchange,
    // Pedagógico
    IconBooks,
    IconUsersGroup,
    IconListDetails,
    IconPresentation,
    IconFiles,
    IconCheckbox,
    IconReport,
    IconClipboardText,
    IconCertificate,
    // Financeiro
    IconCurrencyDollar,
    IconReceipt,
    IconReceipt2,
    IconAlertTriangle,
    IconBuildingBank,
    IconChecks,
    IconArrowsTransferUp,
    IconFileInvoice,
    // RH
    IconCoin,
    IconPercentage,
    IconClock,
    IconPlaneDeparture,
    IconHierarchy,
    // Comunicação
    IconInbox,
    IconSend,
    IconPencil,
    IconBell,
    IconMessages,
    IconBrandWhatsapp,
    IconTemplate,
    // Agenda
    IconUser,
    IconCrown,
    IconShield,
    IconCalendarStats,
    IconDoor,
    IconPackage,
    // Relatórios
    IconLayoutDashboard,
    IconGauge,
    IconFileAnalytics,
    IconClockShare,
    IconDownload,
    // Contábil
    IconBuildingFactory,
    IconFileExport,
    IconChartDonut,
    IconUserCircle,
    // Conhecimento
    IconListCheck,
    IconShieldCheck,
    IconQuestionMark,
    IconFolders,
    // AI
    IconMessage,
    IconWand,
    IconBrain,
    IconBulb,
    // Kaizen
    IconMessage2,
    IconHistory,
    IconTrendingUp,
    IconMoodSmile,
    IconClipboardList,
    IconLayoutKanban,
    // Settings
    IconBuilding,
    IconPalette,
    IconShieldLock,
    IconPlugConnected,
    IconKey,
    IconWebhook,
    IconDatabaseExport,
} from '@tabler/icons-react';
import Link from 'next/link';

interface BundleItem {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: { type: 'count'; value: number };
    children?: BundleItem[];
}

interface Bundle {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    items: BundleItem[];
    position?: 'top' | 'bottom';
}

const BUNDLES: Bundle[] = [
    // 1. Marketing
    {
        id: 'marketing',
        label: 'Marketing',
        icon: <IconSpeakerphone size={20} />,
        color: 'pink',
        items: [
            { id: 'campaigns', label: 'Campanhas', href: '/admin/marketing/campanhas', icon: <IconFlag size={18} /> },
            { id: 'leads', label: 'Leads', href: '/admin/marketing/leads', icon: <IconUserPlus size={18} /> },
            { id: 'sources', label: 'Origens', href: '/admin/marketing/origens', icon: <IconRoute size={18} /> },
            { id: 'landing-pages', label: 'Landing Pages', href: '/admin/marketing/landing-pages', icon: <IconBrowserCheck size={18} /> },
            { id: 'content', label: 'Conteúdo', href: '/admin/marketing/conteudo', icon: <IconArticle size={18} /> },
            { id: 'referrals', label: 'Indicações', href: '/admin/marketing/indicacoes', icon: <IconShare size={18} /> },
            { id: 'analytics', label: 'Analytics', href: '/admin/marketing/analytics', icon: <IconChartBar size={18} /> },
        ],
    },
    // 2. Comercial
    {
        id: 'comercial',
        label: 'Comercial',
        icon: <IconBriefcase size={20} />,
        color: 'blue',
        items: [
            { id: 'pipeline', label: 'Pipeline', href: '/admin/comercial/pipeline', icon: <IconTimeline size={18} /> },
            { id: 'opportunities', label: 'Oportunidades', href: '/admin/comercial/oportunidades', icon: <IconTarget size={18} /> },
            { id: 'proposals', label: 'Propostas', href: '/admin/comercial/propostas', icon: <IconFileText size={18} /> },
            { id: 'negotiations', label: 'Negociações', href: '/admin/comercial/negociacoes', icon: <IconScale size={18} /> },
            { id: 'follow-ups', label: 'Follow-ups', href: '/admin/comercial/followups', icon: <IconPhoneCall size={18} /> },
            { id: 'targets', label: 'Metas', href: '/admin/comercial/metas', icon: <IconChartArrowsVertical size={18} /> },
            { id: 'performance', label: 'Desempenho', href: '/admin/comercial/desempenho', icon: <IconTrophy size={18} /> },
        ],
    },
    // 3. Operacional
    {
        id: 'operacional',
        label: 'Operacional',
        icon: <IconClipboardCheck size={20} />,
        color: 'teal',
        items: [
            { id: 'checkin', label: 'Check-in', href: '/admin/operacional/checkin', icon: <IconLogin size={18} /> },
            { id: 'enrollments', label: 'Matrículas', href: '/admin/operacional/matriculas', icon: <IconUserCheck size={18} /> },
            { id: 'students', label: 'Alunos', href: '/admin/operacional/alunos', icon: <IconSchool size={18} /> },
            { id: 'guardians', label: 'Responsáveis', href: '/admin/operacional/responsaveis', icon: <IconUsers size={18} /> },
            { id: 'contracts', label: 'Contratos', href: '/admin/operacional/contratos', icon: <IconSignature size={18} /> },
            { id: 'renewals', label: 'Renovações', href: '/admin/operacional/renovacoes', icon: <IconRefresh size={18} /> },
            { id: 'cancellations', label: 'Cancelamentos', href: '/admin/operacional/cancelamentos', icon: <IconUserOff size={18} /> },
            { id: 'transfers', label: 'Transferências', href: '/admin/operacional/transferencias', icon: <IconArrowsExchange size={18} /> },
        ],
    },
    // 4. Pedagógico
    {
        id: 'pedagogico',
        label: 'Pedagógico',
        icon: <IconBook size={20} />,
        color: 'purple',
        items: [
            { id: 'courses', label: 'Cursos', href: '/admin/pedagogico/cursos', icon: <IconBooks size={18} /> },
            { id: 'classes', label: 'Turmas', href: '/admin/pedagogico/turmas', icon: <IconUsersGroup size={18} /> },
            { id: 'curriculum', label: 'Grade Curricular', href: '/admin/pedagogico/grade', icon: <IconListDetails size={18} /> },
            { id: 'lessons', label: 'Aulas', href: '/admin/pedagogico/aulas', icon: <IconPresentation size={18} /> },
            { id: 'materials', label: 'Materiais', href: '/admin/pedagogico/materiais', icon: <IconFiles size={18} /> },
            { id: 'attendance', label: 'Presença', href: '/admin/pedagogico/presenca', icon: <IconCheckbox size={18} /> },
            { id: 'grades', label: 'Notas', href: '/admin/pedagogico/notas', icon: <IconReport size={18} /> },
            { id: 'assessments', label: 'Avaliações', href: '/admin/pedagogico/avaliacoes', icon: <IconClipboardText size={18} /> },
            { id: 'certificates', label: 'Certificados', href: '/admin/pedagogico/certificados', icon: <IconCertificate size={18} /> },
        ],
    },
    // 5. Financeiro
    {
        id: 'financeiro',
        label: 'Financeiro',
        icon: <IconCash size={20} />,
        color: 'green',
        items: [
            { id: 'receivables', label: 'Recebíveis', href: '/admin/financeiro/recebiveis', icon: <IconCurrencyDollar size={18} /> },
            { id: 'payments', label: 'Pagamentos Recebidos', href: '/admin/financeiro/pagamentos', icon: <IconReceipt2 size={18} /> },
            { id: 'billing', label: 'Faturamento', href: '/admin/financeiro/faturamento', icon: <IconReceipt size={18} /> },
            { id: 'delinquency', label: 'Inadimplência', href: '/admin/financeiro/inadimplencia', icon: <IconAlertTriangle size={18} /> },
            { id: 'bank-accounts', label: 'Contas Bancárias', href: '/admin/financeiro/contas', icon: <IconBuildingBank size={18} /> },
            { id: 'reconciliation', label: 'Conciliação', href: '/admin/financeiro/conciliacao', icon: <IconChecks size={18} /> },
            { id: 'cashflow', label: 'Fluxo de Caixa', href: '/admin/financeiro/fluxo-caixa', icon: <IconArrowsTransferUp size={18} /> },
            { id: 'payables', label: 'Contas a Pagar', href: '/admin/financeiro/contas-pagar', icon: <IconFileInvoice size={18} /> },
        ],
    },
    // 6. RH & Pessoas
    {
        id: 'rh',
        label: 'RH & Pessoas',
        icon: <IconUserCog size={20} />,
        color: 'orange',
        items: [
            { id: 'employees', label: 'Colaboradores', href: '/admin/rh/colaboradores', icon: <IconUsers size={18} /> },
            { id: 'work-contracts', label: 'Contratos de Trabalho', href: '/admin/rh/contratos', icon: <IconFileText size={18} /> },
            { id: 'payroll', label: 'Folha de Pagamento', href: '/admin/rh/folha', icon: <IconCoin size={18} /> },
            { id: 'commissions', label: 'Comissões', href: '/admin/rh/comissoes', icon: <IconPercentage size={18} /> },
            { id: 'goals', label: 'Metas', href: '/admin/rh/metas', icon: <IconTarget size={18} /> },
            { id: 'timesheet', label: 'Ponto', href: '/admin/rh/ponto', icon: <IconClock size={18} /> },
            { id: 'leave', label: 'Férias e Afastamentos', href: '/admin/rh/ferias', icon: <IconPlaneDeparture size={18} /> },
            { id: 'training', label: 'Treinamentos', href: '/admin/rh/treinamentos', icon: <IconSchool size={18} /> },
            { id: 'careers', label: 'Vagas', href: '/admin/rh/vagas', icon: <IconBriefcase size={18} /> },
            { id: 'org-chart', label: 'Organograma', href: '/admin/rh/organograma', icon: <IconHierarchy size={18} /> },
        ],
    },
    // 7. Comunicação
    {
        id: 'comunicacao',
        label: 'Comunicação',
        icon: <IconMessageCircle size={20} />,
        color: 'cyan',
        items: [
            { id: 'inbox', label: 'Caixa de Entrada', href: '/admin/comunicacao/inbox', icon: <IconInbox size={18} /> },
            { id: 'sent', label: 'Enviados', href: '/admin/comunicacao/enviados', icon: <IconSend size={18} /> },
            { id: 'drafts', label: 'Rascunhos', href: '/admin/comunicacao/rascunhos', icon: <IconPencil size={18} /> },
            { id: 'announcements', label: 'Avisos', href: '/admin/comunicacao/avisos', icon: <IconBell size={18} /> },
            { id: 'communicator', label: 'Comunicador', href: '/admin/comunicacao/comunicador', icon: <IconMessages size={18} /> },
            { id: 'whatsapp', label: 'WhatsApp', href: '/admin/comunicacao/whatsapp', icon: <IconBrandWhatsapp size={18} /> },
            { id: 'templates', label: 'Templates', href: '/admin/comunicacao/templates', icon: <IconTemplate size={18} /> },
        ],
    },
    // 8. Agenda
    {
        id: 'agenda',
        label: 'Agenda',
        icon: <IconCalendar size={20} />,
        color: 'yellow',
        items: [
            { id: 'personal', label: 'Minha Agenda', href: '/admin/agenda/pessoal', icon: <IconUser size={18} /> },
            { id: 'team', label: 'Agenda do Time', href: '/admin/agenda/time', icon: <IconUsers size={18} /> },
            { id: 'leaders', label: 'Agenda dos Líderes', href: '/admin/agenda/lideres', icon: <IconCrown size={18} /> },
            { id: 'director', label: 'Agenda da Direção', href: '/admin/agenda/direcao', icon: <IconShield size={18} /> },
            { id: 'total', label: 'Agenda Total', href: '/admin/agenda/total', icon: <IconCalendarStats size={18} /> },
            { id: 'rooms', label: 'Salas', href: '/admin/agenda/salas', icon: <IconDoor size={18} /> },
            { id: 'resources', label: 'Recursos', href: '/admin/agenda/recursos', icon: <IconPackage size={18} /> },
            { id: 'academic-calendar', label: 'Calendário Letivo', href: '/admin/agenda/letivo', icon: <IconSchool size={18} /> },
        ],
    },
    // 9. Relatórios & BI
    {
        id: 'relatorios',
        label: 'Relatórios & BI',
        icon: <IconChartPie size={20} />,
        color: 'indigo',
        items: [
            { id: 'dashboards', label: 'Dashboards', href: '/admin/relatorios/dashboards', icon: <IconLayoutDashboard size={18} /> },
            { id: 'kpis', label: 'KPIs', href: '/admin/relatorios/kpis', icon: <IconGauge size={18} /> },
            { id: 'commercial', label: 'Comercial', href: '/admin/relatorios/comercial', icon: <IconBriefcase size={18} /> },
            { id: 'academic', label: 'Pedagógico', href: '/admin/relatorios/pedagogico', icon: <IconBook size={18} /> },
            { id: 'financial', label: 'Financeiro', href: '/admin/relatorios/financeiro', icon: <IconCash size={18} /> },
            { id: 'hr', label: 'RH', href: '/admin/relatorios/rh', icon: <IconUsers size={18} /> },
            { id: 'custom', label: 'Relatório Personalizado', href: '/admin/relatorios/personalizado', icon: <IconFileAnalytics size={18} /> },
            { id: 'scheduled', label: 'Agendados', href: '/admin/relatorios/agendados', icon: <IconClockShare size={18} /> },
            { id: 'exports', label: 'Exportações', href: '/admin/relatorios/exportar', icon: <IconDownload size={18} /> },
        ],
    },
    // 10. Contábil
    {
        id: 'contabil',
        label: 'Contábil',
        icon: <IconCalculator size={20} />,
        color: 'lime',
        items: [
            { id: 'chart-of-accounts', label: 'Plano de Contas', href: '/admin/contabil/plano-contas', icon: <IconListDetails size={18} /> },
            { id: 'journal', label: 'Lançamentos', href: '/admin/contabil/lancamentos', icon: <IconReceipt size={18} /> },
            { id: 'cost-centers', label: 'Centros de Custo', href: '/admin/contabil/centros-custo', icon: <IconBuildingFactory size={18} /> },
            { id: 'nfse', label: 'NFS-e', href: '/admin/contabil/nfse', icon: <IconFileInvoice size={18} /> },
            { id: 'fiscal-docs', label: 'Documentos Fiscais', href: '/admin/contabil/documentos', icon: <IconFileText size={18} /> },
            { id: 'sped', label: 'SPED', href: '/admin/contabil/sped', icon: <IconFileExport size={18} /> },
            { id: 'dre', label: 'DRE', href: '/admin/contabil/dre', icon: <IconChartBar size={18} /> },
            { id: 'balancete', label: 'Balancete', href: '/admin/contabil/balancete', icon: <IconScale size={18} /> },
            { id: 'balanco', label: 'Balanço', href: '/admin/contabil/balanco', icon: <IconChartDonut size={18} /> },
            { id: 'accountant-portal', label: 'Portal do Contador', href: '/admin/contabil/contador', icon: <IconUserCircle size={18} /> },
        ],
    },
    // 11. Conhecimento
    {
        id: 'conhecimento',
        label: 'Conhecimento',
        icon: <IconLibrary size={20} />,
        color: 'grape',
        items: [
            { id: 'wiki', label: 'Wiki', href: '/admin/conhecimento/wiki', icon: <IconArticle size={18} /> },
            { id: 'procedures', label: 'Procedimentos', href: '/admin/conhecimento/procedimentos', icon: <IconListCheck size={18} /> },
            { id: 'policies', label: 'Políticas', href: '/admin/conhecimento/politicas', icon: <IconShieldCheck size={18} /> },
            { id: 'faq', label: 'FAQ', href: '/admin/conhecimento/faq', icon: <IconQuestionMark size={18} /> },
            { id: 'training-materials', label: 'Materiais de Treinamento', href: '/admin/conhecimento/treinamento', icon: <IconSchool size={18} /> },
            { id: 'templates', label: 'Templates', href: '/admin/conhecimento/templates', icon: <IconTemplate size={18} /> },
            { id: 'files', label: 'Arquivos', href: '/admin/conhecimento/arquivos', icon: <IconFolders size={18} /> },
        ],
    },
    // 12. Assistente IA
    {
        id: 'ai',
        label: 'Assistente IA',
        icon: <IconRobot size={20} />,
        color: 'violet',
        items: [
            { id: 'chat', label: 'Chat', href: '/admin/ai/chat', icon: <IconMessage size={18} /> },
            { id: 'generators', label: 'Geradores', href: '/admin/ai/geradores', icon: <IconWand size={18} /> },
            { id: 'analyses', label: 'Análises', href: '/admin/ai/analises', icon: <IconBrain size={18} /> },
            { id: 'insights', label: 'Insights', href: '/admin/ai/insights', icon: <IconBulb size={18} /> },
            { id: 'usage', label: 'Uso & Custos', href: '/admin/ai/uso', icon: <IconChartBar size={18} /> },
        ],
    },
    // 13. Kaizen
    {
        id: 'kaizen',
        label: 'Kaizen',
        icon: <IconRefreshDot size={20} />,
        color: 'amber',
        items: [
            { id: 'suggestions', label: 'Sugestões', href: '/admin/kaizen/sugestoes', icon: <IconBulb size={18} /> },
            { id: 'feedback', label: 'Feedback', href: '/admin/kaizen/feedback', icon: <IconMessage2 size={18} /> },
            { id: 'retrospectives', label: 'Retrospectivas', href: '/admin/kaizen/retrospectivas', icon: <IconHistory size={18} /> },
            { id: 'improvements', label: 'Melhorias', href: '/admin/kaizen/melhorias', icon: <IconTrendingUp size={18} /> },
            { id: 'nps', label: 'NPS', href: '/admin/kaizen/nps', icon: <IconMoodSmile size={18} /> },
            { id: 'surveys', label: 'Pesquisas', href: '/admin/kaizen/pesquisas', icon: <IconClipboardList size={18} /> },
            { id: 'board', label: 'Quadro de Ideias', href: '/admin/kaizen/quadro', icon: <IconLayoutKanban size={18} /> },
        ],
    },
    // 14. Configurações (bottom position)
    {
        id: 'configuracoes',
        label: 'Configurações',
        icon: <IconSettings size={20} />,
        color: 'gray',
        position: 'bottom',
        items: [
            { id: 'org', label: 'Escola', href: '/admin/configuracoes/escola', icon: <IconBuilding size={18} /> },
            { id: 'branding', label: 'Branding', href: '/admin/configuracoes/branding', icon: <IconPalette size={18} /> },
            { id: 'users', label: 'Usuários', href: '/admin/configuracoes/usuarios', icon: <IconUsers size={18} /> },
            { id: 'roles', label: 'Cargos & Permissões', href: '/admin/configuracoes/cargos', icon: <IconShieldLock size={18} /> },
            { id: 'integrations', label: 'Integrações', href: '/admin/configuracoes/integracoes', icon: <IconPlugConnected size={18} /> },
            { id: 'api-keys', label: 'API Keys', href: '/admin/configuracoes/api-keys', icon: <IconKey size={18} /> },
            { id: 'webhooks', label: 'Webhooks', href: '/admin/configuracoes/webhooks', icon: <IconWebhook size={18} /> },
            { id: 'audit', label: 'Auditoria', href: '/admin/configuracoes/auditoria', icon: <IconHistory size={18} /> },
            { id: 'backup', label: 'Backup', href: '/admin/configuracoes/backup', icon: <IconDatabaseExport size={18} /> },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [expandedBundles, setExpandedBundles] = useState<string[]>([]);

    const toggleBundle = (bundleId: string) => {
        setExpandedBundles(prev =>
            prev.includes(bundleId)
                ? prev.filter(id => id !== bundleId)
                : [...prev, bundleId]
        );
    };

    const isItemActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
    const isBundleActive = (bundle: Bundle) =>
        bundle.items.some(item => isItemActive(item.href));

    // Auto-expand active bundle via useEffect
    useEffect(() => {
        const activeBundleId = BUNDLES.find(b => isBundleActive(b))?.id;
        if (activeBundleId && !expandedBundles.includes(activeBundleId)) {
            setExpandedBundles(prev => [...prev, activeBundleId]);
        }
    }, [pathname]);

    const topBundles = BUNDLES.filter(b => b.position !== 'bottom');
    const bottomBundles = BUNDLES.filter(b => b.position === 'bottom');

    const renderBundle = (bundle: Bundle) => {
        const isExpanded = expandedBundles.includes(bundle.id);
        const isActive = isBundleActive(bundle);

        return (
            <Box key={bundle.id}>
                <NavLink
                    label={bundle.label}
                    leftSection={
                        <ThemeIcon variant={isActive ? 'filled' : 'light'} color={bundle.color} size="sm">
                            {bundle.icon}
                        </ThemeIcon>
                    }
                    rightSection={
                        <IconChevronRight
                            size={14}
                            style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 200ms',
                            }}
                        />
                    }
                    active={isActive}
                    onClick={() => toggleBundle(bundle.id)}
                    style={{ borderRadius: 'var(--mantine-radius-md)' }}
                />
                <Collapse in={isExpanded}>
                    <Stack gap={2} pl="md" mt={4}>
                        {bundle.items.map(item => (
                            <NavLink
                                key={item.id}
                                component={Link}
                                href={item.href}
                                label={item.label}
                                leftSection={item.icon}
                                active={isItemActive(item.href)}
                                style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                            />
                        ))}
                    </Stack>
                </Collapse>
            </Box>
        );
    };

    return (
        <>
            {/* Dashboard Link */}
            <NavLink
                component={Link}
                href="/admin"
                label="Dashboard"
                leftSection={
                    <ThemeIcon variant="light" color="blue" size="sm">
                        <IconHome size={18} />
                    </ThemeIcon>
                }
                active={pathname === '/admin'}
                mb="xs"
                style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />

            <Divider mb="sm" />

            {/* Main Bundles */}
            <ScrollArea h="calc(100vh - 280px)" scrollbarSize={6}>
                <Stack gap={4}>
                    {topBundles.map(renderBundle)}
                </Stack>
            </ScrollArea>

            {/* Bottom Bundles (Settings) */}
            <Divider my="sm" />
            <Stack gap={4}>
                {bottomBundles.map(renderBundle)}
            </Stack>
        </>
    );
}

