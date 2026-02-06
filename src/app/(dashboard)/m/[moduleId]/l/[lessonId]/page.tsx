'use client';

import { use, useState, useEffect } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, Divider, ThemeIcon, Checkbox, Textarea, ActionIcon,
    Collapse, Progress, Tooltip, Modal, SimpleGrid, Grid
} from '@mantine/core';
import { useDisclosure, useLocalStorage, useDebouncedCallback } from '@mantine/hooks';
import {
    IconArrowLeft, IconArrowRight, IconTerminal, IconPencil, IconCheck,
    IconDeviceFloppy, IconMaximize, IconPrinter, IconLayoutSidebar, IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { LessonContent } from '@/components/lesson/LessonContent';

// Static lesson content for dev mode
const LESSONS_CONTENT: Record<string, {
    title: string;
    description: string;
    content: string;
    tasks: { id: string; title: string; instructions: string; type: string; points: number }[];
    prev?: string;
    next?: string;
}> = {
    'lesson-1-1': {
        title: 'A Camada de Identidade',
        description: 'Quem está falando?',
        content: `# A Camada de Identidade

A primeira dimensão do contexto é **quem está falando**. O system prompt define a persona da IA — sua personalidade, tom, conhecimentos e limitações.

## O Conceito

Quando você interage com Claude ou GPT sem definir quem eles são, você está usando a persona padrão. Mas quando você define uma identidade específica, a IA **assume esse papel** e responde de forma consistente.

## Por que isso importa?

A identidade molda:
- **Vocabulário**: Um cientista fala diferente de um chef
- **Prioridades**: O que a persona considera importante
- **Limitações**: O que ela não sabe ou não faria
- **Estilo**: Formal, casual, técnico, poético

## Exemplos de Identidade

| Persona | Como ela responde |
|---------|-------------------|
| Ferreiro Medieval Rabugento | Linguagem arcaica, reclama de tudo, quer vender armas |
| Torradeira Hiper-Otimista | Entusiasmada com tudo, vê o lado bom até de queimar pão |
| Professor Socrático | Responde com perguntas, nunca dá a resposta direta |

## Sua Missão

Nesta lição, você vai criar identidades e ver como elas transformam completamente as respostas da IA.`,
        tasks: [
            { id: 'task-1-1-1', title: 'Ferreiro Medieval Rabugento', instructions: 'Crie um system prompt que transforme a IA em um ferreiro medieval rabugento. Depois, peça para ele explicar como funciona o WiFi.', type: 'prompt_single', points: 10 },
            { id: 'task-1-1-2', title: 'Torradeira Hiper-Otimista', instructions: 'Crie um system prompt para uma torradeira extremamente otimista. Peça para ela explicar por que queimou o pão.', type: 'prompt_single', points: 10 },
            { id: 'task-1-1-3', title: 'IA como "Você"', instructions: 'Crie um system prompt onde a IA é VOCÊ respondendo seus emails. Defina seu estilo, suas prioridades, como você fala.', type: 'prompt_single', points: 15 },
        ],
        next: 'lesson-1-2',
    },
    'lesson-1-2': {
        title: 'A Camada Temporal',
        description: 'Quando estamos?',
        content: `# A Camada Temporal

A segunda dimensão do contexto é **quando** a conversa acontece. O tempo define o que a IA "sabe" e como ela interpreta o mundo.

## O Conceito

Quando você coloca a IA em um período de tempo específico, você filtra seu conhecimento e perspectiva. Uma IA em 1999 não sabe o que é iPhone. Uma IA em 3000 vê nosso presente como história antiga.`,
        tasks: [
            { id: 'task-1-2-1', title: 'É 1999', instructions: 'A IA acredita que é 1999. Pergunte sobre smartphones e redes sociais. Como ela reage?', type: 'prompt_single', points: 10 },
            { id: 'task-1-2-2', title: 'É 3000', instructions: 'A IA é um historiador do ano 3000. Marte está colonizado. Pergunte sobre a "antiga Terra".', type: 'prompt_single', points: 10 },
        ],
        prev: 'lesson-1-1',
        next: 'lesson-1-3',
    },
    'lesson-1-3': {
        title: 'A Camada Espacial',
        description: 'Onde estamos?',
        content: `# A Camada Espacial

A terceira dimensão do contexto é **onde** a conversa acontece. O espaço define as limitações físicas e possibilidades.`,
        tasks: [
            { id: 'task-1-3-1', title: 'Receita no Submarino', instructions: 'A IA é um chef em um submarino que está afundando. Água entrando, silêncio é vital. Peça uma receita.', type: 'prompt_single', points: 10 },
        ],
        prev: 'lesson-1-2',
        next: 'lesson-1-4',
    },
    'lesson-1-4': {
        title: 'O Context Stack',
        description: 'Quem + Quando + Onde = Gravidade',
        content: `# O Context Stack

Agora combinamos as três camadas: **Identidade + Tempo + Espaço = Gravidade**.`,
        tasks: [
            { id: 'task-1-4-1', title: 'Pirata + 1700 + Navio Afundando', instructions: 'Stack: Pirata em 1700 em um navio afundando. Pergunta: Conselho sobre impostos de renda.', type: 'prompt_single', points: 10 },
        ],
        prev: 'lesson-1-3',
        next: 'lesson-1-5',
    },
    'lesson-1-5': {
        title: 'O Vácuo (Preparação)',
        description: 'Preparando o Poço Gravitacional',
        content: `# O Vácuo (Preparação para o Capstone)

Esta lição prepara você para o Capstone.`,
        tasks: [
            { id: 'task-1-5-1', title: 'Design do Planeta Impossível', instructions: 'Projete um "Planeta Impossível" com regras únicas.', type: 'reflection', points: 15 },
        ],
        prev: 'lesson-1-4',
        next: 'lesson-1-6',
    },
    'lesson-1-6': {
        title: 'CAPSTONE: The World Builder',
        description: 'Lance seu planeta. A turma interage.',
        content: `# CAPSTONE: The World Builder

É hora de lançar seu planeta. 🌍`,
        tasks: [
            { id: 'task-1-6-1', title: 'Lance o Planeta', instructions: 'Configure a IA com seu system prompt e convide 3 colegas para interagir.', type: 'prompt_single', points: 30 },
        ],
        prev: 'lesson-1-5',
    },
};

interface Props {
    params: Promise<{ moduleId: string; lessonId: string }>;
}

// Task with draft support
interface TaskState {
    completed: boolean;
    draft: string;
    savedAt?: string;
}

export default function LessonPage({ params }: Props) {
    const { moduleId, lessonId } = use(params);
    const lesson = LESSONS_CONTENT[lessonId] || LESSONS_CONTENT['lesson-1-1'];

    // Local storage for task states
    const [taskStates, setTaskStates] = useLocalStorage<Record<string, TaskState>>({
        key: `lesson-tasks-${lessonId}`,
        defaultValue: {},
    });

    // Side-by-side playground mode
    const [sideBySide, { toggle: toggleSideBySide }] = useDisclosure(false);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [expandedTask, setExpandedTask] = useState<string | null>(null);

    // Auto-save with debounce
    const debouncedSave = useDebouncedCallback((taskId: string, draft: string) => {
        setTaskStates(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                draft,
                savedAt: new Date().toISOString(),
            },
        }));
    }, 1000);

    // Handle draft change
    const handleDraftChange = (taskId: string, value: string) => {
        debouncedSave(taskId, value);
    };

    // Toggle task completion
    const handleToggleComplete = (taskId: string) => {
        setTaskStates(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                completed: !prev[taskId]?.completed,
            },
        }));
    };

    // Calculate progress
    const completedTasks = lesson.tasks.filter(t => taskStates[t.id]?.completed).length;
    const progressPercent = lesson.tasks.length > 0 ? (completedTasks / lesson.tasks.length) * 100 : 0;
    const earnedPoints = lesson.tasks.filter(t => taskStates[t.id]?.completed).reduce((acc, t) => acc + t.points, 0);
    const totalPoints = lesson.tasks.reduce((acc, t) => acc + t.points, 0);

    const taskTypeIcons: Record<string, React.ReactNode> = {
        prompt_single: <IconTerminal size={16} />,
        reflection: <IconPencil size={16} />,
    };

    const taskTypeLabels: Record<string, string> = {
        prompt_single: 'Prompt',
        reflection: 'Reflexão',
    };

    // Print view handler
    const handlePrint = () => {
        window.print();
    };

    return (
        <Grid gutter="md">
            {/* Main Content */}
            <Grid.Col span={sideBySide ? 6 : 12}>
                <Stack gap="xl">
                    {/* Header */}
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Group gap="xs">
                                <Badge variant="light" color="cyan">Módulo 1</Badge>
                                <Text size="sm" c="dimmed">•</Text>
                                <Text size="sm" c="dimmed">The Orbit</Text>
                            </Group>
                            <Group gap="xs">
                                <Tooltip label="Versão para impressão">
                                    <ActionIcon variant="subtle" onClick={handlePrint}>
                                        <IconPrinter size={18} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={sideBySide ? "Fechar playground" : "Abrir playground lado a lado"}>
                                    <ActionIcon
                                        variant={sideBySide ? "filled" : "subtle"}
                                        color={sideBySide ? "violet" : "gray"}
                                        onClick={toggleSideBySide}
                                    >
                                        <IconLayoutSidebar size={18} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </Group>
                        <Title order={1}>{lesson.title}</Title>
                        <Text c="dimmed" size="lg">{lesson.description}</Text>

                        {/* Progress Bar */}
                        {lesson.tasks.length > 0 && (
                            <Paper p="sm" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Text size="sm" fw={500}>Progresso da Lição</Text>
                                    <Group gap="xs">
                                        <Badge variant="light" color="green">{earnedPoints}/{totalPoints} pts</Badge>
                                        <Badge variant="light" color="violet">{completedTasks}/{lesson.tasks.length} tarefas</Badge>
                                    </Group>
                                </Group>
                                <Progress value={progressPercent} color="green" size="md" radius="xl" />
                            </Paper>
                        )}
                    </Stack>

                    {/* Lesson Content */}
                    <Paper shadow="xs" radius="md" p="xl" withBorder className="lesson-content">
                        <LessonContent content={lesson.content} format="markdown" />
                    </Paper>

                    {/* Tasks */}
                    {lesson.tasks.length > 0 && (
                        <Stack gap="md">
                            <Title order={3}>🎯 Tarefas</Title>

                            {lesson.tasks.map((task, index) => {
                                const state = taskStates[task.id] || { completed: false, draft: '' };
                                const isExpanded = expandedTask === task.id;

                                return (
                                    <Card
                                        key={task.id}
                                        shadow="xs"
                                        radius="md"
                                        p="lg"
                                        withBorder
                                        style={{
                                            borderColor: state.completed ? 'var(--mantine-color-green-5)' : undefined,
                                            opacity: state.completed ? 0.8 : 1,
                                        }}
                                    >
                                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                                            <Group gap="md" wrap="nowrap" align="flex-start">
                                                <Checkbox
                                                    checked={state.completed}
                                                    onChange={() => handleToggleComplete(task.id)}
                                                    size="lg"
                                                    color="green"
                                                    styles={{
                                                        input: { cursor: 'pointer' },
                                                    }}
                                                />
                                                <ThemeIcon
                                                    size={40}
                                                    radius="md"
                                                    variant="light"
                                                    color={state.completed ? 'green' : 'violet'}
                                                >
                                                    {state.completed ? <IconCheck size={16} /> : (taskTypeIcons[task.type] || <IconTerminal size={16} />)}
                                                </ThemeIcon>
                                                <Stack gap={4}>
                                                    <Group gap="xs">
                                                        <Badge size="xs" variant="light" color={state.completed ? 'green' : 'violet'}>
                                                            {taskTypeLabels[task.type] || task.type}
                                                        </Badge>
                                                        <Badge size="xs" variant="outline" color="gray">
                                                            {task.points} pontos
                                                        </Badge>
                                                        {state.savedAt && (
                                                            <Tooltip label={`Salvo em ${new Date(state.savedAt).toLocaleString('pt-BR')}`}>
                                                                <Badge size="xs" variant="light" color="blue" leftSection={<IconDeviceFloppy size={10} />}>
                                                                    Auto-salvo
                                                                </Badge>
                                                            </Tooltip>
                                                        )}
                                                    </Group>
                                                    <Text fw={600} td={state.completed ? 'line-through' : undefined}>{task.title}</Text>
                                                    <Text size="sm" c="dimmed">{task.instructions}</Text>
                                                </Stack>
                                            </Group>

                                            <Group gap="xs">
                                                {task.type.includes('prompt') && (
                                                    sideBySide ? (
                                                        <Button
                                                            variant={activeTaskId === task.id ? "filled" : "light"}
                                                            size="xs"
                                                            color="violet"
                                                            onClick={() => setActiveTaskId(task.id)}
                                                        >
                                                            {activeTaskId === task.id ? '✓ Ativo' : 'Selecionar'}
                                                        </Button>
                                                    ) : (
                                                        <Link href={`/playground?task=${task.id}`} passHref legacyBehavior>
                                                            <Button component="a" variant="light" size="xs">
                                                                Abrir Playground
                                                            </Button>
                                                        </Link>
                                                    )
                                                )}
                                                <ActionIcon
                                                    variant="subtle"
                                                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                                                >
                                                    <IconMaximize size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Group>

                                        {/* Draft Area */}
                                        <Collapse in={isExpanded}>
                                            <Stack gap="sm" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                                                <Text size="sm" fw={500}>📝 Rascunho (salvo automaticamente)</Text>
                                                <Textarea
                                                    placeholder="Digite suas anotações ou rascunho aqui..."
                                                    minRows={4}
                                                    defaultValue={state.draft}
                                                    onChange={(e) => handleDraftChange(task.id, e.target.value)}
                                                />
                                            </Stack>
                                        </Collapse>
                                    </Card>
                                );
                            })}
                        </Stack>
                    )}

                    {/* Navigation */}
                    <Divider />
                    <Group justify="space-between">
                        {lesson.prev ? (
                            <Link href={`/m/${moduleId}/l/${lesson.prev}`} passHref legacyBehavior>
                                <Button component="a" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
                                    Lição Anterior
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/m/${moduleId}`} passHref legacyBehavior>
                                <Button component="a" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
                                    Voltar ao Módulo
                                </Button>
                            </Link>
                        )}

                        {lesson.next ? (
                            <Link href={`/m/${moduleId}/l/${lesson.next}`} passHref legacyBehavior>
                                <Button component="a" variant="filled" rightSection={<IconArrowRight size={16} />}>
                                    Próxima Lição
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/m/${moduleId}`} passHref legacyBehavior>
                                <Button component="a" variant="filled" color="green">
                                    ✓ Concluir Módulo
                                </Button>
                            </Link>
                        )}
                    </Group>
                </Stack>
            </Grid.Col>

            {/* Side-by-side Playground */}
            {sideBySide && (
                <Grid.Col span={6}>
                    <Paper
                        shadow="md"
                        radius="md"
                        p="md"
                        withBorder
                        style={{
                            position: 'sticky',
                            top: 16,
                            height: 'calc(100vh - 100px)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Group justify="space-between" mb="md">
                            <Group gap="xs">
                                <ThemeIcon variant="light" color="violet">
                                    <IconTerminal size={16} />
                                </ThemeIcon>
                                <Text fw={600}>Playground</Text>
                            </Group>
                            <ActionIcon variant="subtle" onClick={toggleSideBySide}>
                                <IconX size={16} />
                            </ActionIcon>
                        </Group>

                        {activeTaskId ? (
                            <Stack style={{ flex: 1 }}>
                                <Paper p="sm" radius="md" bg="violet.0">
                                    <Text size="sm" fw={500}>
                                        {lesson.tasks.find(t => t.id === activeTaskId)?.title}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {lesson.tasks.find(t => t.id === activeTaskId)?.instructions}
                                    </Text>
                                </Paper>
                                <Textarea
                                    label="System Prompt"
                                    placeholder="Defina a persona da IA..."
                                    minRows={4}
                                />
                                <Textarea
                                    label="User Message"
                                    placeholder="Sua mensagem para a IA..."
                                    minRows={4}
                                    style={{ flex: 1 }}
                                />
                                <Button fullWidth variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
                                    Enviar para IA
                                </Button>
                            </Stack>
                        ) : (
                            <Stack align="center" justify="center" style={{ flex: 1 }} c="dimmed">
                                <IconTerminal size={48} opacity={0.3} />
                                <Text size="sm">Selecione uma tarefa para começar</Text>
                            </Stack>
                        )}
                    </Paper>
                </Grid.Col>
            )}
        </Grid>
    );
}
