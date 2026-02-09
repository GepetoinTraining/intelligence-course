'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, Tabs, Select, TextInput, Modal,
    Skeleton, Center, Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconUsers, IconCurrencyDollar, IconChartBar, IconPlus,
    IconSearch, IconFilter, IconPhone, IconMail,
    IconBrandWhatsapp, IconCalendarEvent, IconSchool, IconStar,
    IconGift, IconRepeat, IconShoppingCart, IconTargetArrow,
    IconTrendingUp, IconArrowRight, IconCheck, IconX, IconClock,
    IconSparkles, IconHeart, IconFileText, IconAlertTriangle,
    IconRefresh, IconHourglass, IconDatabase, IconPlayerPlay
} from '@tabler/icons-react';
import { KanbanBoard, KanbanColumn, KanbanItem } from '@/components/shared/KanbanBoard';

// ============================================================================
// TYPES
// ============================================================================

interface ProcedureStep {
    id: string;
    stepCode: string;
    name: string;
    color: string;
    icon: string;
    displayOrder: number;
    isStartStep: boolean;
    isEndStep: boolean;
    stepType: string;
    expectedDurationMinutes: number | null;
}

interface ProcedureTemplate {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    entityType: string | null;
    category: string | null;
    status: string;
    stepCount: number;
    executionCount: number;
    completedCount: number;
    steps?: ProcedureStep[];
}

interface ProcedureExecution {
    id: string;
    entityType: string;
    entityId: string;
    status: string;
    currentStepIds: string;
    completedStepCount: number;
    totalStepCount: number;
    progressPercent: number;
    startedAt: number | null;
    isOverdue: boolean;
    assignedUserId: string | null;
}

// ============================================================================
// ICON MAP — Maps icon name strings → React components
// ============================================================================

const ICON_MAP: Record<string, React.ReactNode> = {
    IconSparkles: <IconSparkles size={14} />,
    IconPhone: <IconPhone size={14} />,
    IconCheck: <IconCheck size={14} />,
    IconCalendarEvent: <IconCalendarEvent size={14} />,
    IconSchool: <IconSchool size={14} />,
    IconCurrencyDollar: <IconCurrencyDollar size={14} />,
    IconTargetArrow: <IconTargetArrow size={14} />,
    IconX: <IconX size={14} />,
    IconClock: <IconClock size={14} />,
    IconHeart: <IconHeart size={14} />,
    IconGift: <IconGift size={14} />,
    IconTrendingUp: <IconTrendingUp size={14} />,
    IconRepeat: <IconRepeat size={14} />,
    IconHourglass: <IconHourglass size={14} />,
    IconAlertTriangle: <IconAlertTriangle size={14} />,
    IconRefresh: <IconRefresh size={14} />,
    IconFileText: <IconFileText size={14} />,
};

// Tab → entityType mapping (maps UI tabs to procedure entityTypes)
const TAB_ENTITY_MAP: Record<string, string> = {
    leads: 'lead',
    sales: 'sale',
    students: 'enrollment',
    postsale: 'postsale',
    contracts: 'contract',
};

const TAB_CONFIG: Record<string, { label: string; kpiLabel: string; icon: React.ReactNode; color: string; showValue?: boolean }> = {
    leads: { label: 'Leads', kpiLabel: 'Leads', icon: <IconUsers size={14} />, color: 'blue' },
    sales: { label: 'Vendas', kpiLabel: 'Pipeline Vendas', icon: <IconCurrencyDollar size={14} />, color: 'orange', showValue: true },
    students: { label: 'Alunos', kpiLabel: 'Alunos Ativos', icon: <IconSchool size={14} />, color: 'green' },
    postsale: { label: 'Pós-venda', kpiLabel: 'Potencial Upsell', icon: <IconRepeat size={14} />, color: 'violet', showValue: true },
    contracts: { label: 'Contratos', kpiLabel: 'Contratos', icon: <IconFileText size={14} />, color: 'indigo' },
};

const CARD_ACTIONS_MAP: Record<string, Array<{ label: string; icon: React.ReactNode; onClick: () => void; color?: string }>> = {
    leads: [
        { label: 'WhatsApp', icon: <IconBrandWhatsapp size={14} />, onClick: () => { }, color: 'green' },
        { label: 'Ligar', icon: <IconPhone size={14} />, onClick: () => { } },
        { label: 'Email', icon: <IconMail size={14} />, onClick: () => { } },
    ],
    sales: [
        { label: 'Editar Proposta', icon: <IconCurrencyDollar size={14} />, onClick: () => { } },
        { label: 'Agendar Reunião', icon: <IconCalendarEvent size={14} />, onClick: () => { } },
    ],
    students: [
        { label: 'Ver Progresso', icon: <IconChartBar size={14} />, onClick: () => { } },
        { label: 'Contatar', icon: <IconBrandWhatsapp size={14} />, onClick: () => { }, color: 'green' },
        { label: 'Agendar Ação', icon: <IconCalendarEvent size={14} />, onClick: () => { } },
    ],
    postsale: [
        { label: 'Criar Oferta', icon: <IconGift size={14} />, onClick: () => { }, color: 'violet' },
        { label: 'Contatar', icon: <IconBrandWhatsapp size={14} />, onClick: () => { }, color: 'green' },
    ],
    contracts: [
        { label: 'Ver Contrato', icon: <IconFileText size={14} />, onClick: () => { } },
        { label: 'Contatar', icon: <IconBrandWhatsapp size={14} />, onClick: () => { }, color: 'green' },
        { label: 'Propor Renovação', icon: <IconRefresh size={14} />, onClick: () => { }, color: 'violet' },
    ],
};

// ============================================================================
// HELPERS
// ============================================================================

function stepsToColumns(steps: ProcedureStep[]): KanbanColumn[] {
    return steps
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(step => ({
            id: step.stepCode.toLowerCase(),
            label: step.name,
            color: step.color || 'blue',
            icon: ICON_MAP[step.icon] || <IconSparkles size={14} />,
        }));
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SalesPipelinePage() {
    const [activeTab, setActiveTab] = useState<string | null>('leads');
    const [search, setSearch] = useState('');
    const [newItemModal, { open: openNewItem, close: closeNewItem }] = useDisclosure(false);

    // API state
    const [templates, setTemplates] = useState<ProcedureTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---- Fetch templates ----
    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/procedures?status=active&includeSteps=true');
            if (!res.ok) throw new Error('Failed to fetch procedures');
            const data = await res.json();
            setTemplates(data.procedures || []);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar pipelines');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // ---- Seed pipelines ----
    const handleSeed = async () => {
        try {
            setSeeding(true);
            const res = await fetch('/api/procedures/seed-pipelines', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to seed');
            const data = await res.json();
            notifications.show({
                title: 'Pipelines criados!',
                message: data.message,
                color: 'green',
            });
            await fetchTemplates();
        } catch (err: any) {
            notifications.show({
                title: 'Erro',
                message: err.message || 'Falha ao criar pipelines',
                color: 'red',
            });
        } finally {
            setSeeding(false);
        }
    };

    // ---- Resolve template for current tab ----
    const getTemplateForTab = (tab: string): ProcedureTemplate | undefined => {
        const entityType = TAB_ENTITY_MAP[tab];
        return templates.find(t => t.entityType === entityType);
    };

    // ---- KPI helpers ----
    const getKpiForTab = (tab: string): { count: number; valueStr?: string } => {
        const template = getTemplateForTab(tab);
        if (!template) return { count: 0 };
        return { count: template.executionCount || 0 };
    };

    // ---- Build columns from template steps ----
    const getColumnsForTab = (tab: string): KanbanColumn[] => {
        const template = getTemplateForTab(tab);
        if (!template?.steps) return [];
        return stepsToColumns(template.steps);
    };

    // ---- Build items (empty for now — no executions yet. Ready for Phase 2) ----
    const getItemsForTab = (tab: string): Record<string, KanbanItem[]> => {
        const columns = getColumnsForTab(tab);
        const items: Record<string, KanbanItem[]> = {};
        columns.forEach(col => { items[col.id] = []; });
        return items;
    };

    // ============================================================================
    // EMPTY / LOADING / ERROR STATES
    // ============================================================================

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Pipeline Comercial 🎯</Title>
                        <Text c="dimmed">Carregando pipelines...</Text>
                    </div>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} height={80} radius="md" />
                    ))}
                </SimpleGrid>
                <Skeleton height={50} radius="md" />
                <Skeleton height={300} radius="md" />
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack gap="xl">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Pipeline Comercial 🎯</Title>
                        <Text c="red">{error}</Text>
                    </div>
                </Group>
                <Center py="xl">
                    <Button onClick={fetchTemplates} leftSection={<IconRefresh size={16} />}>
                        Tentar Novamente
                    </Button>
                </Center>
            </Stack>
        );
    }

    // No templates exist yet — show seed CTA
    if (templates.length === 0) {
        return (
            <Stack gap="xl">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Pipeline Comercial 🎯</Title>
                        <Text c="dimmed">Nenhum pipeline configurado ainda</Text>
                    </div>
                </Group>
                <Center py={60}>
                    <Stack align="center" gap="md">
                        <ThemeIcon size={80} variant="light" color="blue" radius="xl">
                            <IconDatabase size={40} />
                        </ThemeIcon>
                        <Text size="xl" fw={600}>Configure seus Pipelines</Text>
                        <Text c="dimmed" ta="center" maw={400}>
                            Crie os pipelines padrão (Leads, Vendas, Alunos, Pós-venda e Contratos)
                            para começar a gerenciar seu funil comercial.
                        </Text>
                        <Button
                            size="lg"
                            leftSection={<IconPlayerPlay size={20} />}
                            onClick={handleSeed}
                            loading={seeding}
                        >
                            Criar Pipelines Padrão
                        </Button>
                    </Stack>
                </Center>
            </Stack>
        );
    }

    // ============================================================================
    // MAIN RENDER — Data-driven from API
    // ============================================================================

    const tabKeys = Object.keys(TAB_ENTITY_MAP).filter(tab => getTemplateForTab(tab));

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

            {/* KPI Cards — dynamic from templates */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: tabKeys.length }} spacing="md">
                {tabKeys.map(tab => {
                    const config = TAB_CONFIG[tab];
                    const kpi = getKpiForTab(tab);
                    const template = getTemplateForTab(tab);
                    return (
                        <Paper
                            key={tab}
                            shadow="sm"
                            radius="md"
                            p="md"
                            withBorder
                            style={{
                                cursor: 'pointer',
                                borderBottom: activeTab === tab ? `3px solid var(--mantine-color-${config.color}-5)` : undefined,
                            }}
                            onClick={() => setActiveTab(tab)}
                        >
                            <Group justify="space-between">
                                <div>
                                    <Text size="xs" c="dimmed">{config.kpiLabel}</Text>
                                    <Text size="xl" fw={700}>
                                        {config.showValue ? `R$ ${(kpi.count * 100 / 1000).toFixed(1)}k` : kpi.count}
                                    </Text>
                                </div>
                                <ThemeIcon size="lg" variant="light" color={config.color}>
                                    {config.icon}
                                </ThemeIcon>
                            </Group>
                            {template && (
                                <Text size="xs" c="dimmed" mt={4}>
                                    {template.stepCount} etapas
                                </Text>
                            )}
                        </Paper>
                    );
                })}
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
                            {tabKeys.map(tab => {
                                const config = TAB_CONFIG[tab];
                                return (
                                    <Tabs.Tab key={tab} value={tab} leftSection={config.icon}>
                                        {config.label}
                                    </Tabs.Tab>
                                );
                            })}
                        </Tabs.List>
                    </Tabs>
                </Group>
            </Card>

            {/* Kanban Boards — data-driven */}
            {tabKeys.map(tab => {
                if (activeTab !== tab) return null;
                const template = getTemplateForTab(tab);
                if (!template) return null;

                const columns = getColumnsForTab(tab);
                const items = getItemsForTab(tab);
                const totalItems = Object.values(items).flat().length;

                return (
                    <div key={tab}>
                        <Group justify="space-between" mb="md">
                            <Text fw={600} size="lg">{template.name}</Text>
                            <Badge color={TAB_CONFIG[tab].color} variant="light" size="lg">
                                {totalItems > 0 ? `${totalItems} no funil` : 'Nenhuma execução ativa'}
                            </Badge>
                        </Group>
                        <KanbanBoard
                            columns={columns}
                            items={items}
                            showColumnValues={TAB_CONFIG[tab].showValue || false}
                            columnActions={[{ label: 'Mover', icon: <IconArrowRight size={14} />, onClick: () => { } }]}
                            cardActions={CARD_ACTIONS_MAP[tab] || []}
                        />
                    </div>
                );
            })}

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
