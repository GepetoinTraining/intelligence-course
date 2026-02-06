'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Tabs, Select, TextInput, Modal,
    Avatar, Progress, Divider, RingProgress
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconUsers, IconCurrencyDollar, IconChartBar, IconPlus,
    IconSearch, IconFilter, IconUser, IconPhone, IconMail,
    IconBrandWhatsapp, IconCalendarEvent, IconSchool, IconStar,
    IconGift, IconRepeat, IconShoppingCart, IconTargetArrow,
    IconTrendingUp, IconArrowRight, IconCheck, IconX, IconClock,
    IconSparkles, IconHeart
} from '@tabler/icons-react';
import { KanbanBoard, KanbanColumn, KanbanItem } from '@/components/shared/KanbanBoard';

// ==================== LEAD FUNNEL ====================
const LEAD_STAGES: KanbanColumn[] = [
    { id: 'new', label: 'Novos', color: 'blue', icon: <IconSparkles size={14} /> },
    { id: 'contacted', label: 'Contatados', color: 'cyan', icon: <IconPhone size={14} /> },
    { id: 'qualified', label: 'Qualificados', color: 'teal', icon: <IconCheck size={14} /> },
    { id: 'trial_scheduled', label: 'Trial Agendado', color: 'violet', icon: <IconCalendarEvent size={14} /> },
    { id: 'trial_done', label: 'Trial Feito', color: 'grape', icon: <IconSchool size={14} /> },
];

const MOCK_LEADS: Record<string, KanbanItem[]> = {
    new: [
        { id: 'l1', title: 'Maria Silva', subtitle: 'Intelligence A1', badges: [{ label: 'Instagram', color: 'pink' }], meta: '2h atrás', avatar: { text: 'MS' } },
        { id: 'l2', title: 'João Santos', subtitle: 'Kids', badges: [{ label: 'Website', color: 'blue' }], meta: '3h atrás', avatar: { text: 'JS' } },
    ],
    contacted: [
        { id: 'l3', title: 'Ana Oliveira', subtitle: 'Teens', badges: [{ label: 'Indicação', color: 'green' }], meta: '1d atrás', avatar: { text: 'AO' } },
        { id: 'l4', title: 'Pedro Costa', subtitle: 'Intelligence B1', badges: [{ label: 'Google', color: 'red' }], meta: '2d atrás', avatar: { text: 'PC' } },
    ],
    qualified: [
        { id: 'l5', title: 'Carla Mendes', subtitle: 'Intelligence A2', badges: [{ label: 'Instagram', color: 'pink' }], meta: '3d atrás', avatar: { text: 'CM' }, priority: 'high' },
    ],
    trial_scheduled: [
        { id: 'l6', title: 'Rafael Lima', subtitle: 'Kids', badges: [{ label: 'Facebook', color: 'indigo' }], meta: 'Amanhã 14h', avatar: { text: 'RL' } },
    ],
    trial_done: [
        { id: 'l7', title: 'Fernanda Rocha', subtitle: 'Intelligence A1', badges: [{ label: 'Presencial', color: 'teal' }], meta: '5d atrás', avatar: { text: 'FR' }, priority: 'urgent' },
    ],
};

// ==================== SALES FUNNEL ====================
const SALES_STAGES: KanbanColumn[] = [
    { id: 'proposal', label: 'Proposta', color: 'orange', icon: <IconCurrencyDollar size={14} />, limit: 10 },
    { id: 'negotiation', label: 'Negociação', color: 'yellow', icon: <IconTargetArrow size={14} />, limit: 8 },
    { id: 'closing', label: 'Fechamento', color: 'lime', icon: <IconCheck size={14} />, limit: 5 },
    { id: 'won', label: 'Ganho ✅', color: 'green', icon: <IconCheck size={14} /> },
    { id: 'lost', label: 'Perdido ❌', color: 'red', icon: <IconX size={14} /> },
];

const MOCK_SALES: Record<string, KanbanItem[]> = {
    proposal: [
        { id: 's1', title: 'Lucas Almeida', subtitle: 'Intelligence + Extras', value: 1200, meta: 'Enviada há 2d', avatar: { text: 'LA', color: 'orange' } },
        { id: 's2', title: 'Juliana Costa', subtitle: 'Teens Anual', value: 2400, meta: 'Enviada há 1d', avatar: { text: 'JC', color: 'orange' } },
    ],
    negotiation: [
        { id: 's3', title: 'Roberto Alves', subtitle: 'Kids + Material', value: 1800, meta: 'Desconto 10%', avatar: { text: 'RA', color: 'yellow' }, priority: 'high' },
    ],
    closing: [
        { id: 's4', title: 'Patricia Souza', subtitle: 'Intelligence Premium', value: 3600, meta: 'Aguardando assinatura', avatar: { text: 'PS', color: 'lime' }, priority: 'urgent' },
    ],
    won: [
        { id: 's5', title: 'Marcos Lima', subtitle: 'Intelligence A1', value: 1200, meta: 'Fechado em 15/01', avatar: { text: 'ML', color: 'green' } },
        { id: 's6', title: 'Camila Ferreira', subtitle: 'Kids Semestral', value: 1800, meta: 'Fechado em 12/01', avatar: { text: 'CF', color: 'green' } },
    ],
    lost: [
        { id: 's7', title: 'Bruno Santos', subtitle: 'Teens', value: 1200, meta: 'Motivo: Preço', avatar: { text: 'BS', color: 'red' } },
    ],
};

// ==================== STUDENT FUNNEL (Active Students) ====================
const STUDENT_STAGES: KanbanColumn[] = [
    { id: 'onboarding', label: 'Onboarding', color: 'cyan', icon: <IconSparkles size={14} /> },
    { id: 'active', label: 'Ativo', color: 'green', icon: <IconSchool size={14} /> },
    { id: 'at_risk', label: 'Em Risco', color: 'orange', icon: <IconClock size={14} />, limit: 5 },
    { id: 'churning', label: 'Cancelando', color: 'red', icon: <IconX size={14} /> },
    { id: 'paused', label: 'Pausado', color: 'gray', icon: <IconClock size={14} /> },
];

const MOCK_STUDENTS: Record<string, KanbanItem[]> = {
    onboarding: [
        { id: 'st1', title: 'Marcos Lima', subtitle: 'Intelligence A1 • Semana 1', badges: [{ label: 'Novo', color: 'cyan' }], meta: 'Iniciou há 3d', avatar: { text: 'ML', color: 'cyan' } },
    ],
    active: [
        { id: 'st2', title: 'Ana Clara', subtitle: 'Kids • Módulo 3', badges: [{ label: 'Streak 15🔥', color: 'orange' }], meta: 'Última aula: Ontem', avatar: { text: 'AC', color: 'green' } },
        { id: 'st3', title: 'Gabriel Costa', subtitle: 'Intelligence B1 • Módulo 5', badges: [{ label: 'Top 10%', color: 'gold' }], meta: 'XP: 2,450', avatar: { text: 'GC', color: 'green' } },
        { id: 'st4', title: 'Luiza Mendes', subtitle: 'Teens • Módulo 2', badges: [{ label: 'Ativo', color: 'green' }], meta: 'NPS: 9', avatar: { text: 'LM', color: 'green' } },
    ],
    at_risk: [
        { id: 'st5', title: 'Pedro Henrique', subtitle: 'Intelligence A2 • Módulo 4', badges: [{ label: '7d sem login', color: 'orange' }], meta: 'NPS: 6', avatar: { text: 'PH', color: 'orange' }, priority: 'high' },
    ],
    churning: [
        { id: 'st6', title: 'Fernanda Lima', subtitle: 'Kids', badges: [{ label: 'Cancelando', color: 'red' }], meta: 'Motivo: Financeiro', avatar: { text: 'FL', color: 'red' }, priority: 'urgent' },
    ],
    paused: [
        { id: 'st7', title: 'Carlos Eduardo', subtitle: 'Teens', badges: [{ label: 'Férias', color: 'gray' }], meta: 'Retorna: 15/03', avatar: { text: 'CE', color: 'gray' } },
    ],
};

// ==================== POST-SALE FUNNEL (Upsell/Cross-sell) ====================
const POSTSALE_STAGES: KanbanColumn[] = [
    { id: 'identify', label: 'Identificados', color: 'blue', icon: <IconTargetArrow size={14} /> },
    { id: 'approach', label: 'Abordagem', color: 'violet', icon: <IconHeart size={14} /> },
    { id: 'present', label: 'Apresentação', color: 'grape', icon: <IconGift size={14} /> },
    { id: 'upsold', label: 'Upsell ✅', color: 'green', icon: <IconTrendingUp size={14} /> },
    { id: 'renewed', label: 'Renovado ✅', color: 'teal', icon: <IconRepeat size={14} /> },
];

const MOCK_POSTSALE: Record<string, KanbanItem[]> = {
    identify: [
        { id: 'ps1', title: 'Ana Clara (Mãe)', subtitle: '2 filhos • Alto engajamento', badges: [{ label: 'Cross-sell', color: 'blue' }], value: 1200, meta: 'Interesse: Teens', avatar: { text: 'AC', color: 'blue' } },
        { id: 'ps2', title: 'Gabriel Costa', subtitle: 'Finalizando B1', badges: [{ label: 'Upsell', color: 'violet' }], value: 2400, meta: 'Próximo: B2', avatar: { text: 'GC', color: 'blue' } },
    ],
    approach: [
        { id: 'ps3', title: 'Luiza Mendes (Mãe)', subtitle: 'NPS 10 • Indicadora', badges: [{ label: 'Referral', color: 'pink' }], value: 0, meta: 'Bônus indicação', avatar: { text: 'LM', color: 'violet' } },
    ],
    present: [
        { id: 'ps4', title: 'Carlos Souza', subtitle: 'Renovação em 30d', badges: [{ label: 'Renovação', color: 'teal' }], value: 2400, meta: 'Desconto 15%', avatar: { text: 'CS', color: 'grape' }, priority: 'high' },
    ],
    upsold: [
        { id: 'ps5', title: 'Mariana Alves', subtitle: 'Kids → Teens', badges: [{ label: 'Upgrade', color: 'green' }], value: 600, meta: '+R$ 50/mês', avatar: { text: 'MA', color: 'green' } },
    ],
    renewed: [
        { id: 'ps6', title: 'Ricardo Lima', subtitle: 'Intelligence A2 → B1', badges: [{ label: 'Anual', color: 'teal' }], value: 2400, meta: 'Renovado 01/02', avatar: { text: 'RL', color: 'teal' } },
        { id: 'ps7', title: 'Julia Ferreira', subtitle: 'Teens Semestral', badges: [{ label: 'Semestral', color: 'teal' }], value: 1200, meta: 'Renovado 28/01', avatar: { text: 'JF', color: 'teal' } },
    ],
};

// ==================== MAIN COMPONENT ====================
export default function SalesPipelinePage() {
    const [activeTab, setActiveTab] = useState<string | null>('leads');
    const [search, setSearch] = useState('');
    const [newItemModal, { open: openNewItem, close: closeNewItem }] = useDisclosure(false);

    // Stats calculations
    const leadCount = Object.values(MOCK_LEADS).flat().length;
    const salesValue = Object.values(MOCK_SALES).flat().reduce((acc, s) => acc + (s.value || 0), 0);
    const activeStudents = (MOCK_STUDENTS.active?.length || 0) + (MOCK_STUDENTS.onboarding?.length || 0);
    const atRiskStudents = (MOCK_STUDENTS.at_risk?.length || 0) + (MOCK_STUDENTS.churning?.length || 0);
    const upsellPotential = Object.values(MOCK_POSTSALE).flat().reduce((acc, p) => acc + (p.value || 0), 0);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Pipeline Comercial 🎯</Title>
                    <Text c="dimmed">Gestão completa do funil de vendas e relacionamento</Text>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={openNewItem}>
                    Novo Item
                </Button>
            </Group>

            {/* KPI Cards */}
            <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{ cursor: 'pointer', borderBottom: activeTab === 'leads' ? '3px solid var(--mantine-color-blue-5)' : undefined }}
                    onClick={() => setActiveTab('leads')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Leads</Text>
                            <Text size="xl" fw={700}>{leadCount}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconUsers size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{ cursor: 'pointer', borderBottom: activeTab === 'sales' ? '3px solid var(--mantine-color-orange-5)' : undefined }}
                    onClick={() => setActiveTab('sales')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Pipeline Vendas</Text>
                            <Text size="xl" fw={700}>R$ {(salesValue / 1000).toFixed(1)}k</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="orange">
                            <IconCurrencyDollar size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{ cursor: 'pointer', borderBottom: activeTab === 'students' ? '3px solid var(--mantine-color-green-5)' : undefined }}
                    onClick={() => setActiveTab('students')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Alunos Ativos</Text>
                            <Text size="xl" fw={700}>{activeStudents}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconSchool size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{ cursor: 'pointer', borderBottom: activeTab === 'students' ? '3px solid var(--mantine-color-orange-5)' : undefined }}
                    onClick={() => setActiveTab('students')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Em Risco</Text>
                            <Text size="xl" fw={700} c="orange">{atRiskStudents}</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="orange">
                            <IconClock size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper
                    shadow="sm"
                    radius="md"
                    p="md"
                    withBorder
                    style={{ cursor: 'pointer', borderBottom: activeTab === 'postsale' ? '3px solid var(--mantine-color-violet-5)' : undefined }}
                    onClick={() => setActiveTab('postsale')}
                >
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Potencial Upsell</Text>
                            <Text size="xl" fw={700} c="violet">R$ {(upsellPotential / 1000).toFixed(1)}k</Text>
                        </div>
                        <ThemeIcon size="lg" variant="light" color="violet">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Filters */}
            <Card shadow="sm" radius="md" p="md" withBorder>
                <Group>
                    <TextInput
                        placeholder="Buscar por nome..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Filtrar"
                        leftSection={<IconFilter size={16} />}
                        data={[
                            { value: 'all', label: 'Todos' },
                            { value: 'priority', label: 'Prioridade Alta' },
                            { value: 'today', label: 'Ações Hoje' },
                        ]}
                        w={150}
                        clearable
                    />
                    <Tabs value={activeTab} onChange={setActiveTab}>
                        <Tabs.List>
                            <Tabs.Tab value="leads" leftSection={<IconUsers size={14} />}>Leads</Tabs.Tab>
                            <Tabs.Tab value="sales" leftSection={<IconCurrencyDollar size={14} />}>Vendas</Tabs.Tab>
                            <Tabs.Tab value="students" leftSection={<IconSchool size={14} />}>Alunos</Tabs.Tab>
                            <Tabs.Tab value="postsale" leftSection={<IconRepeat size={14} />}>Pós-venda</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </Group>
            </Card>

            {/* Kanban Boards */}
            {activeTab === 'leads' && (
                <div>
                    <Group justify="space-between" mb="md">
                        <Text fw={600} size="lg">Funil de Leads</Text>
                        <Badge color="blue" variant="light" size="lg">
                            {leadCount} leads no funil
                        </Badge>
                    </Group>
                    <KanbanBoard
                        columns={LEAD_STAGES}
                        items={MOCK_LEADS}
                        showColumnValues={false}
                        columnActions={[{ label: 'Mover', icon: <IconArrowRight size={14} />, onClick: () => { } }]}
                        cardActions={[
                            { label: 'WhatsApp', icon: <IconBrandWhatsapp size={14} />, onClick: () => { }, color: 'green' },
                            { label: 'Ligar', icon: <IconPhone size={14} />, onClick: () => { } },
                            { label: 'Email', icon: <IconMail size={14} />, onClick: () => { } },
                        ]}
                    />
                </div>
            )}

            {activeTab === 'sales' && (
                <div>
                    <Group justify="space-between" mb="md">
                        <Text fw={600} size="lg">Funil de Vendas</Text>
                        <Group gap="md">
                            <Badge color="green" variant="light" size="lg">
                                Ganhos: R$ {MOCK_SALES.won?.reduce((acc, s) => acc + (s.value || 0), 0).toLocaleString('pt-BR')}
                            </Badge>
                            <Badge color="orange" variant="light" size="lg">
                                Em negociação: R$ {(MOCK_SALES.proposal?.reduce((acc, s) => acc + (s.value || 0), 0) +
                                    MOCK_SALES.negotiation?.reduce((acc, s) => acc + (s.value || 0), 0) +
                                    MOCK_SALES.closing?.reduce((acc, s) => acc + (s.value || 0), 0)).toLocaleString('pt-BR') || 0}
                            </Badge>
                        </Group>
                    </Group>
                    <KanbanBoard
                        columns={SALES_STAGES}
                        items={MOCK_SALES}
                        showColumnValues={true}
                        columnActions={[{ label: 'Mover', icon: <IconArrowRight size={14} />, onClick: () => { } }]}
                        cardActions={[
                            { label: 'Editar Proposta', icon: <IconCurrencyDollar size={14} />, onClick: () => { } },
                            { label: 'Agendar Reunião', icon: <IconCalendarEvent size={14} />, onClick: () => { } },
                        ]}
                    />
                </div>
            )}

            {activeTab === 'students' && (
                <div>
                    <Group justify="space-between" mb="md">
                        <Text fw={600} size="lg">Gestão de Alunos</Text>
                        <Group gap="md">
                            <Badge color="green" variant="light" size="lg">
                                Ativos: {activeStudents}
                            </Badge>
                            <Badge color="orange" variant="light" size="lg">
                                Em risco: {atRiskStudents}
                            </Badge>
                        </Group>
                    </Group>
                    <KanbanBoard
                        columns={STUDENT_STAGES}
                        items={MOCK_STUDENTS}
                        showColumnValues={false}
                        columnActions={[{ label: 'Mover', icon: <IconArrowRight size={14} />, onClick: () => { } }]}
                        cardActions={[
                            { label: 'Ver Progresso', icon: <IconChartBar size={14} />, onClick: () => { } },
                            { label: 'Contatar', icon: <IconBrandWhatsapp size={14} />, onClick: () => { }, color: 'green' },
                            { label: 'Agendar Ação', icon: <IconCalendarEvent size={14} />, onClick: () => { } },
                        ]}
                    />
                </div>
            )}

            {activeTab === 'postsale' && (
                <div>
                    <Group justify="space-between" mb="md">
                        <Text fw={600} size="lg">Pós-venda (Upsell/Cross-sell/Renovação)</Text>
                        <Group gap="md">
                            <Badge color="violet" variant="light" size="lg">
                                Potencial: R$ {upsellPotential.toLocaleString('pt-BR')}
                            </Badge>
                            <Badge color="green" variant="light" size="lg">
                                Convertidos: {(MOCK_POSTSALE.upsold?.length || 0) + (MOCK_POSTSALE.renewed?.length || 0)}
                            </Badge>
                        </Group>
                    </Group>
                    <KanbanBoard
                        columns={POSTSALE_STAGES}
                        items={MOCK_POSTSALE}
                        showColumnValues={true}
                        columnActions={[{ label: 'Mover', icon: <IconArrowRight size={14} />, onClick: () => { } }]}
                        cardActions={[
                            { label: 'Criar Oferta', icon: <IconGift size={14} />, onClick: () => { }, color: 'violet' },
                            { label: 'Contatar', icon: <IconBrandWhatsapp size={14} />, onClick: () => { }, color: 'green' },
                        ]}
                    />
                </div>
            )}

            {/* New Item Modal */}
            <Modal opened={newItemModal} onClose={closeNewItem} title="Novo Item" size="md">
                <Stack>
                    <Select
                        label="Tipo"
                        placeholder="Selecione"
                        data={[
                            { value: 'lead', label: 'Lead' },
                            { value: 'sale', label: 'Oportunidade de Venda' },
                            { value: 'upsell', label: 'Oportunidade de Upsell' },
                        ]}
                    />
                    <TextInput label="Nome" placeholder="Nome completo" required />
                    <TextInput label="Email" placeholder="email@exemplo.com" />
                    <TextInput label="Telefone" placeholder="(11) 99999-9999" />
                    <Select
                        label="Interesse / Curso"
                        placeholder="Selecione"
                        data={[
                            { value: 'intelligence_a1', label: 'Intelligence A1' },
                            { value: 'intelligence_a2', label: 'Intelligence A2' },
                            { value: 'intelligence_b1', label: 'Intelligence B1' },
                            { value: 'kids', label: 'Kids' },
                            { value: 'teens', label: 'Teens' },
                        ]}
                    />
                    <TextInput label="Valor Estimado" placeholder="R$ 0,00" />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeNewItem}>Cancelar</Button>
                        <Button onClick={closeNewItem}>Salvar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

