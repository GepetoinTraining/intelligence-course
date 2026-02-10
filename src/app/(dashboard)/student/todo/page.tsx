'use client';

import { useState, useRef, Suspense } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Textarea, Select,
    Checkbox, Grid, SegmentedControl, Loader, Progress, Tooltip, Alert
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconCheck, IconTrash, IconFlame,
    IconAlertTriangle, IconClock, IconCalendar, IconCube, IconLayoutGrid,
    IconLock, IconLockOpen, IconSparkles, IconTrophy
} from '@tabler/icons-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { StudentProgress } from '@/types/domain';

// Dynamic import for R3F to avoid SSR issues
const TodoCube3D = dynamic(() => import('@/components/todo/TodoCube3D'), {
    ssr: false,
    loading: () => (
        <Paper p="xl" radius="md" withBorder style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack align="center" gap="md">
                <Loader size="lg" />
                <Text c="dimmed">Carregando visualização 3D...</Text>
            </Stack>
        </Paper>
    ),
});

export interface Todo {
    id: string;
    title: string;
    description?: string;
    urgent: boolean;
    important: boolean;
    effort: 'low' | 'medium' | 'high'; // Z-axis: effort/complexity
    completed: boolean;
    dueDate?: string;
    linkedLesson?: string;
}

// Progressive unlock levels
interface UnlockLevel {
    level: number;
    name: string;
    feature: string;
    requiredModules: number;
    icon: React.ReactNode;
}

const UNLOCK_LEVELS: UnlockLevel[] = [
    { level: 1, name: 'Matriz 2D', feature: '2d', requiredModules: 0, icon: <IconLayoutGrid size={16} /> },
    { level: 2, name: 'Cubo 3D', feature: '3d', requiredModules: 1, icon: <IconCube size={16} /> },
    { level: 3, name: 'Dimensão Tempo', feature: '4d', requiredModules: 3, icon: <IconSparkles size={16} /> },
];

// Default student progress (empty until fetched)
const DEFAULT_PROGRESS: StudentProgress = {
    level: 0,
    currentXP: 0,
    nextLevelXP: 100,
    completedModules: 0,
    totalModules: 0,
    streak: 0,
};

export default function TodoCubePage() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);

    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newUrgent, setNewUrgent] = useState(false);
    const [newImportant, setNewImportant] = useState(false);
    const [newEffort, setNewEffort] = useState<'low' | 'medium' | 'high'>('medium');

    const handleAdd = () => {
        if (!newTitle) return;
        const newTodo: Todo = {
            id: `todo-${Date.now()}`,
            title: newTitle,
            description: newDescription || undefined,
            urgent: newUrgent,
            important: newImportant,
            effort: newEffort,
            completed: false,
        };
        setTodos(prev => [...prev, newTodo]);
        setNewTitle('');
        setNewDescription('');
        setNewUrgent(false);
        setNewImportant(false);
        setNewEffort('medium');
        closeModal();
    };

    const handleToggle = (id: string) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const handleDelete = (id: string) => {
        setTodos(prev => prev.filter(t => t.id !== id));
    };

    const getQuadrant = (urgent: boolean, important: boolean) => {
        if (urgent && important) return { label: 'Fazer Agora', color: 'red', icon: <IconFlame size={14} /> };
        if (!urgent && important) return { label: 'Agendar', color: 'blue', icon: <IconCalendar size={14} /> };
        if (urgent && !important) return { label: 'Delegar', color: 'orange', icon: <IconClock size={14} /> };
        return { label: 'Eliminar', color: 'gray', icon: <IconTrash size={14} /> };
    };

    const activeTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    // Group by quadrant
    const doFirst = activeTodos.filter(t => t.urgent && t.important);
    const schedule = activeTodos.filter(t => !t.urgent && t.important);
    const delegate = activeTodos.filter(t => t.urgent && !t.important);
    const eliminate = activeTodos.filter(t => !t.urgent && !t.important);

    const renderTodoCard = (todo: Todo) => {
        const quadrant = getQuadrant(todo.urgent, todo.important);
        return (
            <Paper key={todo.id} p="sm" withBorder radius="md" style={{ opacity: todo.completed ? 0.5 : 1 }}>
                <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                        <Checkbox checked={todo.completed} onChange={() => handleToggle(todo.id)} />
                        <div>
                            <Text size="sm" fw={500} td={todo.completed ? 'line-through' : undefined}>{todo.title}</Text>
                            {todo.description && <Text size="xs" c="dimmed">{todo.description}</Text>}
                            <Group gap="xs" mt={4}>
                                {todo.dueDate && (
                                    <Badge size="xs" variant="light" color={todo.urgent ? 'red' : 'gray'}>
                                        {new Date(todo.dueDate).toLocaleDateString('pt-BR')}
                                    </Badge>
                                )}
                                <Badge size="xs" variant="outline" color={todo.effort === 'high' ? 'red' : todo.effort === 'medium' ? 'yellow' : 'green'}>
                                    {todo.effort === 'high' ? 'Alto' : todo.effort === 'medium' ? 'Médio' : 'Baixo'} esforço
                                </Badge>
                            </Group>
                        </div>
                    </Group>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDelete(todo.id)}>
                        <IconTrash size={14} />
                    </ActionIcon>
                </Group>
            </Paper>
        );
    };

    // Calculate unlock status
    const unlockedLevels = UNLOCK_LEVELS.filter(
        level => DEFAULT_PROGRESS.completedModules >= level.requiredModules
    );
    const nextUnlock = UNLOCK_LEVELS.find(
        level => DEFAULT_PROGRESS.completedModules < level.requiredModules
    );
    const is3DUnlocked = DEFAULT_PROGRESS.completedModules >= 1;
    const is4DUnlocked = DEFAULT_PROGRESS.completedModules >= 3;

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/dashboard" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Cubo de Tarefas 📦</Title>
                        <Text c="dimmed">Organize suas prioridades com a matriz Eisenhower</Text>
                    </div>
                </Group>
                <Group>
                    <SegmentedControl
                        value={viewMode}
                        onChange={(v) => {
                            if (v === '3d' && !is3DUnlocked) return;
                            setViewMode(v as '2d' | '3d');
                        }}
                        data={[
                            { value: '2d', label: <Group gap={4}><IconLayoutGrid size={16} />2D</Group> },
                            {
                                value: '3d',
                                label: (
                                    <Tooltip
                                        label={is3DUnlocked ? 'Cubo 3D desbloqueado!' : 'Complete o Módulo 1 para desbloquear'}
                                        disabled={is3DUnlocked}
                                    >
                                        <Group gap={4} style={{ opacity: is3DUnlocked ? 1 : 0.5 }}>
                                            {is3DUnlocked ? <IconCube size={16} /> : <IconLock size={14} />}
                                            3D
                                        </Group>
                                    </Tooltip>
                                ),
                                disabled: !is3DUnlocked
                            },
                        ]}
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
                        Nova Tarefa
                    </Button>
                </Group>
            </Group>

            {/* Progressive Unlock Progress */}
            <Card shadow="sm" radius="md" p="md" withBorder>
                <Group justify="space-between" mb="sm">
                    <Group gap="xs">
                        <ThemeIcon size="sm" color="violet" variant="light">
                            <IconTrophy size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={600}>Desbloqueie Novas Dimensões</Text>
                    </Group>
                    <Badge variant="light" color="violet">
                        Nível {unlockedLevels.length} de {UNLOCK_LEVELS.length}
                    </Badge>
                </Group>

                <Group gap="lg" wrap="wrap">
                    {UNLOCK_LEVELS.map((level, idx) => {
                        const isUnlocked = DEFAULT_PROGRESS.completedModules >= level.requiredModules;
                        const isCurrent = nextUnlock?.level === level.level;

                        return (
                            <Tooltip
                                key={level.level}
                                label={isUnlocked ? 'Desbloqueado!' : `Complete ${level.requiredModules} módulo(s) para desbloquear`}
                            >
                                <Paper
                                    p="sm"
                                    radius="md"
                                    withBorder
                                    style={{
                                        borderColor: isUnlocked
                                            ? 'var(--mantine-color-green-5)'
                                            : isCurrent
                                                ? 'var(--mantine-color-violet-5)'
                                                : undefined,
                                        opacity: isUnlocked ? 1 : 0.6,
                                    }}
                                >
                                    <Group gap="xs">
                                        <ThemeIcon
                                            size="sm"
                                            color={isUnlocked ? 'green' : isCurrent ? 'violet' : 'gray'}
                                            variant={isUnlocked ? 'filled' : 'light'}
                                        >
                                            {isUnlocked ? <IconLockOpen size={12} /> : <IconLock size={12} />}
                                        </ThemeIcon>
                                        <div>
                                            <Group gap={4}>
                                                {level.icon}
                                                <Text size="xs" fw={500}>{level.name}</Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">
                                                {isUnlocked ? '✓ Desbloqueado' : `${level.requiredModules} módulo(s)`}
                                            </Text>
                                        </div>
                                    </Group>
                                </Paper>
                            </Tooltip>
                        );
                    })}
                </Group>

                {nextUnlock && (
                    <Paper p="sm" bg="violet.0" radius="md" mt="sm">
                        <Group gap="xs">
                            <IconSparkles size={14} color="var(--mantine-color-violet-6)" />
                            <Text size="xs">
                                <strong>Próximo desbloqueio:</strong> Complete mais {nextUnlock.requiredModules - DEFAULT_PROGRESS.completedModules} módulo(s) para desbloquear "{nextUnlock.name}"
                            </Text>
                        </Group>
                    </Paper>
                )}
            </Card>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder bg="red.0">
                    <Text size="xl" fw={700} c="red">{doFirst.length}</Text>
                    <Text size="sm" c="dimmed">Fazer Agora</Text>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder bg="blue.0">
                    <Text size="xl" fw={700} c="blue">{schedule.length}</Text>
                    <Text size="sm" c="dimmed">Agendar</Text>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder bg="orange.0">
                    <Text size="xl" fw={700} c="orange">{delegate.length}</Text>
                    <Text size="sm" c="dimmed">Delegar</Text>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Text size="xl" fw={700} c="green">{completedTodos.length}</Text>
                    <Text size="sm" c="dimmed">Concluídas</Text>
                </Paper>
            </SimpleGrid>

            {/* View Toggle */}
            {viewMode === '3d' ? (
                <Card shadow="sm" radius="md" p={0} withBorder style={{ overflow: 'hidden' }}>
                    <Paper p="md" bg="dark.9">
                        <Group justify="space-between" mb="md">
                            <div>
                                <Text c="white" fw={600}>Visualização 3D do Cubo</Text>
                                <Text size="xs" c="gray.5">X: Urgência | Y: Importância | Z: Esforço</Text>
                            </div>
                            <Group gap="xs">
                                <Badge variant="light" color="red">🔥 Urgente</Badge>
                                <Badge variant="light" color="blue">⭐ Importante</Badge>
                                <Badge variant="light" color="yellow">⚡ Alto Esforço</Badge>
                            </Group>
                        </Group>
                    </Paper>
                    <div style={{ height: 500 }}>
                        <TodoCube3D todos={activeTodos} onToggle={handleToggle} />
                    </div>
                </Card>
            ) : (
                /* Eisenhower Matrix */
                <Grid>
                    <Grid.Col span={6}>
                        <Card shadow="sm" radius="md" p="md" withBorder style={{ borderColor: 'var(--mantine-color-red-4)' }}>
                            <Group gap="xs" mb="md">
                                <ThemeIcon size="sm" color="red"><IconFlame size={14} /></ThemeIcon>
                                <Text fw={600} c="red">Urgente + Importante</Text>
                            </Group>
                            <Stack gap="xs">
                                {doFirst.length === 0 ? <Text size="sm" c="dimmed" ta="center">Nenhuma tarefa</Text> : doFirst.map(renderTodoCard)}
                            </Stack>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Card shadow="sm" radius="md" p="md" withBorder style={{ borderColor: 'var(--mantine-color-blue-4)' }}>
                            <Group gap="xs" mb="md">
                                <ThemeIcon size="sm" color="blue"><IconCalendar size={14} /></ThemeIcon>
                                <Text fw={600} c="blue">Não Urgente + Importante</Text>
                            </Group>
                            <Stack gap="xs">
                                {schedule.length === 0 ? <Text size="sm" c="dimmed" ta="center">Nenhuma tarefa</Text> : schedule.map(renderTodoCard)}
                            </Stack>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Card shadow="sm" radius="md" p="md" withBorder style={{ borderColor: 'var(--mantine-color-orange-4)' }}>
                            <Group gap="xs" mb="md">
                                <ThemeIcon size="sm" color="orange"><IconClock size={14} /></ThemeIcon>
                                <Text fw={600} c="orange">Urgente + Não Importante</Text>
                            </Group>
                            <Stack gap="xs">
                                {delegate.length === 0 ? <Text size="sm" c="dimmed" ta="center">Nenhuma tarefa</Text> : delegate.map(renderTodoCard)}
                            </Stack>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Card shadow="sm" radius="md" p="md" withBorder>
                            <Group gap="xs" mb="md">
                                <ThemeIcon size="sm" color="gray"><IconTrash size={14} /></ThemeIcon>
                                <Text fw={600} c="dimmed">Não Urgente + Não Importante</Text>
                            </Group>
                            <Stack gap="xs">
                                {eliminate.length === 0 ? <Text size="sm" c="dimmed" ta="center">Nenhuma tarefa</Text> : eliminate.map(renderTodoCard)}
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>
            )}

            {/* Add Todo Modal */}
            <Modal opened={modal} onClose={closeModal} title="Nova Tarefa" centered>
                <Stack gap="md">
                    <TextInput label="Título" placeholder="O que precisa fazer?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                    <Textarea label="Descrição (opcional)" placeholder="Detalhes..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                    <Group>
                        <Checkbox label="Urgente" checked={newUrgent} onChange={(e) => setNewUrgent(e.currentTarget.checked)} color="red" />
                        <Checkbox label="Importante" checked={newImportant} onChange={(e) => setNewImportant(e.currentTarget.checked)} color="blue" />
                    </Group>
                    <Select
                        label="Nível de Esforço (3ª dimensão)"
                        description="Define a posição no eixo Z do cubo"
                        data={[
                            { value: 'low', label: '🟢 Baixo - Rápido de fazer' },
                            { value: 'medium', label: '🟡 Médio - Esforço moderado' },
                            { value: 'high', label: '🔴 Alto - Projeto complexo' },
                        ]}
                        value={newEffort}
                        onChange={(v) => setNewEffort(v as 'low' | 'medium' | 'high')}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleAdd}>Adicionar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

