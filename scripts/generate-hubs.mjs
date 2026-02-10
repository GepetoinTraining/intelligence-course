/**
 * Convert all 14 ComingSoon hub pages to real dashboards.
 * Each hub gets: module title, stat cards from API, and quick-link grid to subpages.
 */
import fs from 'fs';
import path from 'path';

const ADMIN = path.resolve('src/app/admin');

// Hub configuration: [relPath, title, icon, color, apiEndpoint, stats[], quickLinks[]]
const HUBS = [
    {
        path: 'marketing/page.tsx',
        title: 'Marketing',
        icon: 'IconSpeakerphone',
        color: 'violet',
        api: '/api/leads',
        stats: [
            { label: 'Total Leads', key: 'length', icon: 'IconUsers', color: 'blue' },
        ],
        links: [
            { label: 'Campanhas', href: '/admin/marketing/campanhas', icon: 'IconSpeakerphone', color: 'violet' },
            { label: 'Leads', href: '/admin/marketing/leads', icon: 'IconUsers', color: 'blue' },
            { label: 'Landing Pages', href: '/admin/marketing/landing-pages', icon: 'IconBrowser', color: 'cyan' },
            { label: 'Conteúdo', href: '/admin/marketing/conteudo', icon: 'IconArticle', color: 'grape' },
            { label: 'Anúncios', href: '/admin/marketing/anuncios', icon: 'IconAd', color: 'orange' },
            { label: 'Eventos', href: '/admin/marketing/eventos', icon: 'IconCalendar', color: 'green' },
            { label: 'Indicações', href: '/admin/marketing/indicacoes', icon: 'IconGift', color: 'pink' },
            { label: 'Analytics', href: '/admin/marketing/analytics', icon: 'IconChartBar', color: 'teal' },
        ],
    },
    {
        path: 'comercial/page.tsx',
        title: 'Comercial',
        icon: 'IconBriefcase',
        color: 'blue',
        api: '/api/crm/funnel',
        stats: [
            { label: 'Oportunidades', key: 'length', icon: 'IconTarget', color: 'blue' },
        ],
        links: [
            { label: 'Pipeline', href: '/admin/comercial/pipeline', icon: 'IconLayoutKanban', color: 'blue' },
            { label: 'Oportunidades', href: '/admin/comercial/oportunidades', icon: 'IconTarget', color: 'cyan' },
            { label: 'Clientes', href: '/admin/comercial/clientes', icon: 'IconUsers', color: 'green' },
            { label: 'Propostas', href: '/admin/comercial/propostas', icon: 'IconFileText', color: 'violet' },
            { label: 'Negociações', href: '/admin/comercial/negociacoes', icon: 'IconHandshake', color: 'orange' },
            { label: 'Follow-ups', href: '/admin/comercial/followups', icon: 'IconBell', color: 'yellow' },
            { label: 'Metas', href: '/admin/comercial/metas', icon: 'IconChartArrowsVertical', color: 'teal' },
            { label: 'Desempenho', href: '/admin/comercial/desempenho', icon: 'IconTrophy', color: 'gold' },
        ],
    },
    {
        path: 'operacional/page.tsx',
        title: 'Operacional',
        icon: 'IconSettings',
        color: 'teal',
        api: '/api/enrollments',
        stats: [
            { label: 'Matrículas', key: 'length', icon: 'IconSchool', color: 'teal' },
        ],
        links: [
            { label: 'Matrículas', href: '/admin/operacional/matriculas', icon: 'IconSchool', color: 'teal' },
            { label: 'Alunos', href: '/admin/operacional/alunos', icon: 'IconUsers', color: 'blue' },
            { label: 'Responsáveis', href: '/admin/operacional/responsaveis', icon: 'IconUserHeart', color: 'pink' },
            { label: 'Contratos', href: '/admin/operacional/contratos', icon: 'IconFileText', color: 'violet' },
            { label: 'Renovações', href: '/admin/operacional/renovacoes', icon: 'IconRefresh', color: 'green' },
            { label: 'Check-in', href: '/admin/operacional/checkin', icon: 'IconQrcode', color: 'cyan' },
        ],
    },
    {
        path: 'pedagogico/page.tsx',
        title: 'Pedagógico',
        icon: 'IconBook',
        color: 'grape',
        api: '/api/courses',
        stats: [
            { label: 'Cursos', key: 'length', icon: 'IconBook', color: 'grape' },
        ],
        links: [
            { label: 'Cursos', href: '/admin/pedagogico/cursos', icon: 'IconBook', color: 'grape' },
            { label: 'Turmas', href: '/admin/pedagogico/turmas', icon: 'IconUsersGroup', color: 'blue' },
            { label: 'Grade', href: '/admin/pedagogico/grade', icon: 'IconTable', color: 'cyan' },
            { label: 'Aulas', href: '/admin/pedagogico/aulas', icon: 'IconPresentation', color: 'green' },
            { label: 'Materiais', href: '/admin/pedagogico/materiais', icon: 'IconFiles', color: 'orange' },
            { label: 'Presença', href: '/admin/pedagogico/presenca', icon: 'IconClipboardCheck', color: 'teal' },
            { label: 'Notas', href: '/admin/pedagogico/notas', icon: 'IconSchool', color: 'violet' },
            { label: 'Certificados', href: '/admin/pedagogico/certificados', icon: 'IconCertificate', color: 'yellow' },
        ],
    },
    {
        path: 'financeiro/page.tsx',
        title: 'Financeiro',
        icon: 'IconCash',
        color: 'green',
        api: '/api/invoices',
        stats: [
            { label: 'Faturas', key: 'length', icon: 'IconReceipt', color: 'green' },
        ],
        links: [
            { label: 'Recebíveis', href: '/admin/financeiro/recebiveis', icon: 'IconCoin', color: 'green' },
            { label: 'Pagamentos', href: '/admin/financeiro/pagamentos', icon: 'IconCash', color: 'teal' },
            { label: 'Faturamento', href: '/admin/financeiro/faturamento', icon: 'IconReceipt', color: 'blue' },
            { label: 'Despesas', href: '/admin/financeiro/despesas', icon: 'IconArrowDown', color: 'red' },
            { label: 'Inadimplência', href: '/admin/financeiro/inadimplencia', icon: 'IconAlertTriangle', color: 'orange' },
            { label: 'Contas', href: '/admin/financeiro/contas', icon: 'IconBuildingBank', color: 'cyan' },
            { label: 'Fluxo de Caixa', href: '/admin/financeiro/fluxo-caixa', icon: 'IconArrowsExchange', color: 'violet' },
        ],
    },
    {
        path: 'rh/page.tsx',
        title: 'RH & Pessoas',
        icon: 'IconUsersGroup',
        color: 'orange',
        api: '/api/staff-contracts',
        stats: [
            { label: 'Colaboradores', key: 'length', icon: 'IconUsersGroup', color: 'orange' },
        ],
        links: [
            { label: 'Colaboradores', href: '/admin/rh/colaboradores', icon: 'IconUsers', color: 'orange' },
            { label: 'Contratos', href: '/admin/rh/contratos', icon: 'IconFileText', color: 'blue' },
            { label: 'Folha', href: '/admin/rh/folha', icon: 'IconCash', color: 'green' },
            { label: 'Ponto', href: '/admin/rh/ponto', icon: 'IconClock', color: 'teal' },
            { label: 'Férias', href: '/admin/rh/ferias', icon: 'IconBeach', color: 'cyan' },
            { label: 'Vagas', href: '/admin/rh/vagas', icon: 'IconBriefcase', color: 'violet' },
        ],
    },
    {
        path: 'comunicacao/page.tsx',
        title: 'Comunicação',
        icon: 'IconMessages',
        color: 'cyan',
        api: '/api/communicator/conversations',
        stats: [
            { label: 'Conversas', key: 'length', icon: 'IconMessages', color: 'cyan' },
        ],
        links: [
            { label: 'Inbox', href: '/admin/comunicacao/inbox', icon: 'IconInbox', color: 'blue' },
            { label: 'Avisos', href: '/admin/comunicacao/avisos', icon: 'IconBell', color: 'yellow' },
            { label: 'Automações', href: '/admin/comunicacao/automacoes', icon: 'IconRobot', color: 'grape' },
            { label: 'Templates', href: '/admin/comunicacao/templates', icon: 'IconTemplate', color: 'teal' },
            { label: 'WhatsApp', href: '/admin/comunicacao/whatsapp', icon: 'IconBrandWhatsapp', color: 'green' },
        ],
    },
    {
        path: 'agenda/page.tsx',
        title: 'Agenda',
        icon: 'IconCalendar',
        color: 'indigo',
        api: '/api/schedules',
        stats: [
            { label: 'Agendamentos', key: 'length', icon: 'IconCalendar', color: 'indigo' },
        ],
        links: [
            { label: 'Minha Agenda', href: '/admin/agenda/pessoal', icon: 'IconUser', color: 'blue' },
            { label: 'Agenda do Time', href: '/admin/agenda/time', icon: 'IconUsersGroup', color: 'teal' },
            { label: 'Calendário', href: '/admin/agenda/calendario', icon: 'IconCalendar', color: 'indigo' },
            { label: 'Salas', href: '/admin/agenda/salas', icon: 'IconDoor', color: 'orange' },
            { label: 'Recursos', href: '/admin/agenda/recursos', icon: 'IconDevices', color: 'cyan' },
        ],
    },
    {
        path: 'relatorios/page.tsx',
        title: 'Relatórios & BI',
        icon: 'IconChartBar',
        color: 'pink',
        api: '/api/reports/financial',
        stats: [
            { label: 'Relatórios', key: 'length', icon: 'IconChartBar', color: 'pink' },
        ],
        links: [
            { label: 'Dashboards', href: '/admin/relatorios/dashboards', icon: 'IconDashboard', color: 'pink' },
            { label: 'KPIs', href: '/admin/relatorios/kpis', icon: 'IconTrendingUp', color: 'green' },
            { label: 'Comercial', href: '/admin/relatorios/comercial', icon: 'IconBriefcase', color: 'blue' },
            { label: 'Financeiro', href: '/admin/relatorios/financeiro', icon: 'IconCash', color: 'teal' },
            { label: 'Pedagógico', href: '/admin/relatorios/pedagogico', icon: 'IconBook', color: 'grape' },
            { label: 'Exportações', href: '/admin/relatorios/exportar', icon: 'IconDownload', color: 'orange' },
        ],
    },
    {
        path: 'contabil/page.tsx',
        title: 'Contábil',
        icon: 'IconCalculator',
        color: 'lime',
        api: '/api/journal-entries',
        stats: [
            { label: 'Lançamentos', key: 'length', icon: 'IconCalculator', color: 'lime' },
        ],
        links: [
            { label: 'Plano de Contas', href: '/admin/contabil/plano-contas', icon: 'IconListTree', color: 'lime' },
            { label: 'Lançamentos', href: '/admin/contabil/lancamentos', icon: 'IconArrowsExchange', color: 'blue' },
            { label: 'Fechamento', href: '/admin/contabil/fechamento', icon: 'IconLock', color: 'green' },
            { label: 'NFS-e', href: '/admin/contabil/nfse', icon: 'IconFileInvoice', color: 'cyan' },
            { label: 'DRE', href: '/admin/contabil/dre', icon: 'IconChartBar', color: 'violet' },
            { label: 'SPED', href: '/admin/contabil/sped', icon: 'IconDatabase', color: 'orange' },
        ],
    },
    {
        path: 'conhecimento/page.tsx',
        title: 'Conhecimento',
        icon: 'IconBooks',
        color: 'yellow',
        api: '/api/wiki/articles',
        stats: [
            { label: 'Artigos', key: 'length', icon: 'IconBooks', color: 'yellow' },
        ],
        links: [
            { label: 'Wiki', href: '/admin/conhecimento/wiki', icon: 'IconBook2', color: 'yellow' },
            { label: 'Procedimentos', href: '/admin/conhecimento/procedimentos', icon: 'IconClipboardList', color: 'blue' },
            { label: 'Políticas', href: '/admin/conhecimento/politicas', icon: 'IconShield', color: 'green' },
            { label: 'FAQ', href: '/admin/conhecimento/faq', icon: 'IconQuestionMark', color: 'cyan' },
            { label: 'Templates', href: '/admin/conhecimento/templates', icon: 'IconTemplate', color: 'grape' },
        ],
    },
    {
        path: 'ai/page.tsx',
        title: 'Assistente IA',
        icon: 'IconRobot',
        color: 'grape',
        api: '/api/chat/sessions',
        stats: [
            { label: 'Sessões IA', key: 'length', icon: 'IconRobot', color: 'grape' },
        ],
        links: [
            { label: 'Chat', href: '/admin/ai/chat', icon: 'IconMessage', color: 'blue' },
            { label: 'Geradores', href: '/admin/ai/geradores', icon: 'IconSparkles', color: 'grape' },
            { label: 'Análises', href: '/admin/ai/analises', icon: 'IconChartDots', color: 'cyan' },
            { label: 'Insights', href: '/admin/ai/insights', icon: 'IconBulb', color: 'yellow' },
            { label: 'Automações', href: '/admin/ai/automacoes', icon: 'IconSettingsAutomation', color: 'teal' },
        ],
    },
    {
        path: 'kaizen/page.tsx',
        title: 'Kaizen',
        icon: 'IconRecycle',
        color: 'teal',
        api: '/api/kaizen/suggestions',
        stats: [
            { label: 'Sugestões', key: 'length', icon: 'IconRecycle', color: 'teal' },
        ],
        links: [
            { label: 'Sugestões', href: '/admin/kaizen/sugestoes', icon: 'IconBulb', color: 'yellow' },
            { label: 'Feedback', href: '/admin/kaizen/feedback', icon: 'IconStar', color: 'orange' },
            { label: 'Retrospectivas', href: '/admin/kaizen/retrospectivas', icon: 'IconHistory', color: 'blue' },
            { label: 'NPS', href: '/admin/kaizen/nps', icon: 'IconChartBar', color: 'green' },
            { label: 'Quadro de Ideias', href: '/admin/kaizen/quadro', icon: 'IconLayout', color: 'grape' },
        ],
    },
    {
        path: 'configuracoes/page.tsx',
        title: 'Configurações',
        icon: 'IconSettings',
        color: 'gray',
        api: '/api/users',
        stats: [
            { label: 'Usuários', key: 'length', icon: 'IconUsers', color: 'blue' },
        ],
        links: [
            { label: 'Escola', href: '/admin/configuracoes/escola', icon: 'IconSchool', color: 'blue' },
            { label: 'Branding', href: '/admin/configuracoes/branding', icon: 'IconPalette', color: 'grape' },
            { label: 'Usuários', href: '/admin/configuracoes/usuarios', icon: 'IconUsers', color: 'cyan' },
            { label: 'Cargos', href: '/admin/configuracoes/cargos', icon: 'IconShield', color: 'green' },
            { label: 'API Keys', href: '/admin/configuracoes/api-keys', icon: 'IconKey', color: 'orange' },
            { label: 'Auditoria', href: '/admin/configuracoes/auditoria', icon: 'IconEye', color: 'red' },
        ],
    },
];

// Generate consistent icon imports from all hubs
function collectIcons(hubs) {
    const icons = new Set();
    for (const hub of hubs) {
        icons.add(hub.icon);
        for (const stat of hub.stats) icons.add(stat.icon);
        for (const link of hub.links) icons.add(link.icon);
    }
    // Always needed
    icons.add('IconArrowRight');
    icons.add('IconAlertCircle');
    return [...icons].sort();
}

function generateHub(hub) {
    // Build the unique icons for THIS hub only
    const icons = new Set();
    icons.add(hub.icon);
    icons.add('IconArrowRight');
    icons.add('IconAlertCircle');
    for (const stat of hub.stats) icons.add(stat.icon);
    for (const link of hub.links) icons.add(link.icon);
    const iconImports = [...icons].sort().join(',\n    ');

    const linksJSX = hub.links.map(link => `
                <Card
                    key="${link.label}"
                    withBorder
                    p="lg"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '${link.href}'}
                >
                    <Group>
                        <ThemeIcon variant="light" color="${link.color}" size="lg" radius="md">
                            <${link.icon} size={20} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text fw={500}>${link.label}</Text>
                        </div>
                        <IconArrowRight size={16} color="gray" />
                    </Group>
                </Card>`).join('\n');

    return `'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Group,
    ThemeIcon,
    Loader,
    Center,
    Alert,
    Button,
} from '@mantine/core';
import {
    ${iconImports},
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

export default function ${hub.title.replace(/[^a-zA-Z]/g, '')}HubPage() {
    const { data, isLoading, error, refetch } = useApi<any[]>('${hub.api}');
    const count = data?.length ?? 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>${hub.title}</Title>
            </div>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="${hub.color}" size="lg" radius="md">
                            <${hub.icon} size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">${hub.stats[0].label}</Text>
                            <Text fw={700} size="xl">
                                {isLoading ? <Loader size="sm" /> : count}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                    Dados offline — {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Quick Links */}
            <Title order={4}>Acesso Rápido</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
${linksJSX}
            </SimpleGrid>
        </Stack>
    );
}
`;
}

let generated = 0;
for (const hub of HUBS) {
    const fullPath = path.join(ADMIN, hub.path);
    const content = generateHub(hub);
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Generated: ${hub.path} (${hub.title})`);
    generated++;
}

console.log(`\n=== Generated ${generated} hub dashboards ===`);
