'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Paper, ThemeIcon,
    ActionIcon, Tooltip, Skeleton, Center, Divider, SimpleGrid,
    Tabs, Button, Menu
} from '@mantine/core';
import {
    IconListCheck, IconClock, IconAlertTriangle, IconCheck,
    IconArrowRight, IconUser, IconChevronRight, IconRefresh,
    IconPlayerPlay, IconDots, IconPhone, IconBrandWhatsapp,
    IconNote, IconEscalator, IconDatabase, IconSparkles
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

interface QueueTask {
    id: string;
    executionId: string;
    personName: string;
    personInitials: string;
    pipelineName: string;
    currentStageName: string;
    stageColor: string;
    timeInStage: string;
    nextAction: string;
    urgency: 'overdue' | 'due_today' | 'upcoming';
    progressPercent: number;
    entityType: string;
}

interface ProcedureTemplate {
    id: string;
    name: string;
    slug: string;
    entityType: string | null;
    steps?: Array<{
        id: string;
        stepCode: string;
        name: string;
        color: string;
    }>;
    executionCount: number;
}

interface ProcedureExecution {
    id: string;
    status: string;
    currentStepIds: string;
    progressPercent: number;
    isOverdue: boolean;
    startedAt: number | null;
    entityType: string;
    entityId: string;
    assignedUserId: string | null;
}

// ============================================================================
// URGENCY CONFIG
// ============================================================================

const URGENCY_CONFIG = {
    overdue: {
        label: 'Atrasado',
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        emoji: '🔴',
    },
    due_today: {
        label: 'Para Hoje',
        color: 'yellow',
        icon: <IconClock size={16} />,
        emoji: '🟡',
    },
    upcoming: {
        label: 'Próximos',
        color: 'green',
        icon: <IconCheck size={16} />,
        emoji: '🟢',
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function MinhaFilaPage() {
    const [tasks, setTasks] = useState<QueueTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeUrgency, setActiveUrgency] = useState<string | null>('all');

    // Fetch pipeline data and build task queue
    const fetchQueue = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all active templates with steps
            const res = await fetch('/api/procedures?status=active&includeSteps=true');
            if (!res.ok) throw new Error('Failed to fetch procedures');
            const data = await res.json();
            const templates: ProcedureTemplate[] = data.procedures || [];

            // For now, with no executions, the queue will be empty.
            // When executions exist, we'll fetch them per template and build the queue.
            // This is the structure ready for Phase 2 wiring.
            const queueTasks: QueueTask[] = [];

            // Future: for each template, fetch executions assigned to current user
            // const execRes = await fetch(`/api/procedures/${template.id}/executions?assignedToMe=true`);

            setTasks(queueTasks);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar fila');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    // Group tasks by urgency
    const overdueTasks = tasks.filter(t => t.urgency === 'overdue');
    const dueTodayTasks = tasks.filter(t => t.urgency === 'due_today');
    const upcomingTasks = tasks.filter(t => t.urgency === 'upcoming');

    const filteredTasks = activeUrgency === 'all'
        ? tasks
        : tasks.filter(t => t.urgency === activeUrgency);

    // ============================================================================
    // LOADING STATE
    // ============================================================================

    if (loading) {
        return (
            <Stack gap="xl">
                <div>
                    <Title order={2}>Minha Fila 📋</Title>
                    <Text c="dimmed">Carregando tarefas...</Text>
                </div>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={80} radius="md" />
                    ))}
                </SimpleGrid>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={70} radius="md" />
                ))}
            </Stack>
        );
    }

    // ============================================================================
    // ERROR STATE
    // ============================================================================

    if (error) {
        return (
            <Stack gap="xl">
                <div>
                    <Title order={2}>Minha Fila 📋</Title>
                    <Text c="red">{error}</Text>
                </div>
                <Center py="xl">
                    <Button onClick={fetchQueue} leftSection={<IconRefresh size={16} />}>
                        Tentar Novamente
                    </Button>
                </Center>
            </Stack>
        );
    }

    // ============================================================================
    // EMPTY STATE
    // ============================================================================

    if (tasks.length === 0) {
        return (
            <Stack gap="xl">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Minha Fila 📋</Title>
                        <Text c="dimmed">Suas tarefas pendentes — organizadas por urgência</Text>
                    </div>
                    <Tooltip label="Atualizar">
                        <ActionIcon variant="subtle" onClick={fetchQueue}>
                            <IconRefresh size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {/* Summary Cards — all zeros */}
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {Object.entries(URGENCY_CONFIG).map(([key, config]) => (
                        <Paper key={key} shadow="sm" radius="md" p="md" withBorder>
                            <Group justify="space-between">
                                <div>
                                    <Text size="xs" c="dimmed">{config.emoji} {config.label}</Text>
                                    <Text size="xl" fw={700}>0</Text>
                                </div>
                                <ThemeIcon size="lg" variant="light" color={config.color}>
                                    {config.icon}
                                </ThemeIcon>
                            </Group>
                        </Paper>
                    ))}
                </SimpleGrid>

                <Center py={40}>
                    <Stack align="center" gap="md">
                        <ThemeIcon size={64} variant="light" color="green" radius="xl">
                            <IconCheck size={32} />
                        </ThemeIcon>
                        <Text size="lg" fw={600}>Tudo em dia! ✨</Text>
                        <Text c="dimmed" ta="center" maw={400}>
                            Nenhuma tarefa pendente na sua fila. Quando execuções de pipeline forem
                            atribuídas a você, elas aparecerão aqui organizadas por urgência.
                        </Text>
                    </Stack>
                </Center>
            </Stack>
        );
    }

    // ============================================================================
    // MAIN RENDER — with tasks
    // ============================================================================

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Minha Fila 📋</Title>
                    <Text c="dimmed">Suas tarefas pendentes — organizadas por urgência</Text>
                </div>
                <Tooltip label="Atualizar">
                    <ActionIcon variant="subtle" onClick={fetchQueue}>
                        <IconRefresh size={20} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                {Object.entries(URGENCY_CONFIG).map(([key, config]) => {
                    const count = key === 'overdue' ? overdueTasks.length
                        : key === 'due_today' ? dueTodayTasks.length
                            : upcomingTasks.length;
                    return (
                        <Paper
                            key={key}
                            shadow="sm"
                            radius="md"
                            p="md"
                            withBorder
                            style={{
                                cursor: 'pointer',
                                borderBottom: activeUrgency === key ? `3px solid var(--mantine-color-${config.color}-5)` : undefined,
                            }}
                            onClick={() => setActiveUrgency(activeUrgency === key ? 'all' : key)}
                        >
                            <Group justify="space-between">
                                <div>
                                    <Text size="xs" c="dimmed">{config.emoji} {config.label}</Text>
                                    <Text size="xl" fw={700} c={count > 0 ? config.color : undefined}>
                                        {count}
                                    </Text>
                                </div>
                                <ThemeIcon size="lg" variant="light" color={config.color}>
                                    {config.icon}
                                </ThemeIcon>
                            </Group>
                        </Paper>
                    );
                })}
            </SimpleGrid>

            {/* Task List */}
            <Stack gap="sm">
                {filteredTasks.map(task => {
                    const urgencyConfig = URGENCY_CONFIG[task.urgency];
                    return (
                        <Card key={task.id} shadow="sm" radius="md" p="md" withBorder>
                            <Group justify="space-between" wrap="nowrap">
                                <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
                                    {/* Person avatar */}
                                    <ThemeIcon
                                        size={40}
                                        radius="xl"
                                        variant="light"
                                        color={task.stageColor}
                                    >
                                        <Text size="xs" fw={700}>{task.personInitials}</Text>
                                    </ThemeIcon>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Group gap="xs" wrap="nowrap">
                                            <Text fw={600} truncate>{task.personName}</Text>
                                            <Badge size="xs" color={urgencyConfig.color} variant="light">
                                                {urgencyConfig.label}
                                            </Badge>
                                        </Group>
                                        <Text size="sm" c="dimmed" truncate>
                                            {task.pipelineName} → {task.currentStageName} • {task.timeInStage}
                                        </Text>
                                    </div>

                                    {/* Next action */}
                                    <Badge
                                        variant="outline"
                                        color={task.stageColor}
                                        size="md"
                                        style={{ flexShrink: 0 }}
                                    >
                                        {task.nextAction}
                                    </Badge>
                                </Group>

                                {/* Actions */}
                                <Group gap="xs" wrap="nowrap">
                                    <Tooltip label="Avançar etapa">
                                        <ActionIcon variant="light" color="blue">
                                            <IconArrowRight size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Menu position="bottom-end">
                                        <Menu.Target>
                                            <ActionIcon variant="subtle">
                                                <IconDots size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconBrandWhatsapp size={14} />}>WhatsApp</Menu.Item>
                                            <Menu.Item leftSection={<IconPhone size={14} />}>Ligar</Menu.Item>
                                            <Menu.Item leftSection={<IconNote size={14} />}>Adicionar Nota</Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item leftSection={<IconArrowRight size={14} />} color="blue">Avançar Etapa</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>
                            </Group>
                        </Card>
                    );
                })}
            </Stack>
        </Stack>
    );
}
