'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Textarea, Select,
    NumberInput, Grid, Table, Tabs, Switch, Accordion, Chip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconFileText,
    IconRobot, IconPencil, IconMessageCircle, IconEye, IconClock,
    IconCheck, IconBrain, IconSparkles, IconListCheck
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Activity {
    id: string;
    type: 'prompt' | 'exercise' | 'discussion' | 'quiz' | 'reflection';
    title: string;
    instructions: string;
    aiEnabled: boolean;
}

interface Lesson {
    id: string;
    moduleId: string;
    moduleName: string;
    courseName: string;
    title: string;
    description: string;
    order: number;
    duration: number; // in minutes
    activities: Activity[];
    status: 'draft' | 'published';
    hasPrerequisites: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_MODULES = [
    { id: '1', name: 'O que é Inteligência Artificial?', courseName: 'Fundamentos de IA para Jovens' },
    { id: '2', name: 'Conversando com a Máquina', courseName: 'Fundamentos de IA para Jovens' },
    { id: '5', name: 'Fundamentos de LLMs', courseName: 'AI Mastery para Profissionais' },
];

const ACTIVITY_TYPES = [
    { value: 'prompt', label: '🤖 Prompt Practice', icon: IconRobot, color: 'violet' },
    { value: 'exercise', label: '✏️ Exercício', icon: IconPencil, color: 'blue' },
    { value: 'discussion', label: '💬 Discussão', icon: IconMessageCircle, color: 'green' },
    { value: 'quiz', label: '📝 Quiz', icon: IconListCheck, color: 'orange' },
    { value: 'reflection', label: '🧠 Reflexão', icon: IconBrain, color: 'pink' },
];

const MOCK_LESSONS: Lesson[] = [
    {
        id: '1', moduleId: '1', moduleName: 'O que é Inteligência Artificial?', courseName: 'Fundamentos de IA para Jovens',
        title: 'O que é IA afinal?', description: 'Introdução ao conceito de inteligência artificial',
        order: 1, duration: 30, status: 'published', hasPrerequisites: false,
        activities: [
            { id: 'a1', type: 'discussion', title: 'O que você acha que é IA?', instructions: 'Compartilhe sua ideia sobre o que é inteligência artificial', aiEnabled: false },
            { id: 'a2', type: 'prompt', title: 'Primeiro contato', instructions: 'Faça uma pergunta simples para a IA', aiEnabled: true },
        ]
    },
    {
        id: '2', moduleId: '1', moduleName: 'O que é Inteligência Artificial?', courseName: 'Fundamentos de IA para Jovens',
        title: 'IA no dia-a-dia', description: 'Exemplos de IA que usamos todos os dias',
        order: 2, duration: 25, status: 'published', hasPrerequisites: true,
        activities: [
            { id: 'a3', type: 'exercise', title: 'Caça ao tesouro de IA', instructions: 'Liste 5 exemplos de IA que você usa no celular', aiEnabled: false },
            { id: 'a4', type: 'quiz', title: 'Teste seus conhecimentos', instructions: 'Responda o quiz sobre IA no dia-a-dia', aiEnabled: false },
        ]
    },
    {
        id: '3', moduleId: '2', moduleName: 'Conversando com a Máquina', courseName: 'Fundamentos de IA para Jovens',
        title: 'Escrevendo prompts claros', description: 'Como se comunicar de forma eficaz com a IA',
        order: 1, duration: 35, status: 'published', hasPrerequisites: false,
        activities: [
            { id: 'a5', type: 'prompt', title: 'Prompt vago vs claro', instructions: 'Compare resultados de prompts vagos e claros', aiEnabled: true },
            { id: 'a6', type: 'reflection', title: 'O que funcionou?', instructions: 'Reflita sobre por que o prompt claro funcionou melhor', aiEnabled: false },
        ]
    },
    {
        id: '4', moduleId: '5', moduleName: 'Fundamentos de LLMs', courseName: 'AI Mastery para Profissionais',
        title: 'Entendendo Tokenização', description: 'Como LLMs processam texto em tokens',
        order: 1, duration: 45, status: 'draft', hasPrerequisites: false,
        activities: [
            { id: 'a7', type: 'exercise', title: 'Contando tokens', instructions: 'Use o tokenizer para contar tokens em diferentes textos', aiEnabled: true },
            { id: 'a8', type: 'prompt', title: 'Otimizando tokens', instructions: 'Reescreva o prompt usando menos tokens sem perder significado', aiEnabled: true },
            { id: 'a9', type: 'quiz', title: 'Quiz de Tokenização', instructions: 'Teste seus conhecimentos sobre tokenização', aiEnabled: false },
        ]
    },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function LessonManagementPage() {
    const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [filterModule, setFilterModule] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [activityModal, { open: openActivityModal, close: closeActivityModal }] = useDisclosure(false);

    // Form state
    const [moduleId, setModuleId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState<number | ''>(30);
    const [hasPrerequisites, setHasPrerequisites] = useState(false);

    // Activity form state
    const [activityType, setActivityType] = useState<string | null>('prompt');
    const [activityTitle, setActivityTitle] = useState('');
    const [activityInstructions, setActivityInstructions] = useState('');
    const [activityAiEnabled, setActivityAiEnabled] = useState(true);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedLesson(null);
        setModuleId(filterModule || null);
        setTitle('');
        setDescription('');
        setDuration(30);
        setHasPrerequisites(false);
        openModal();
    };

    const handleEdit = (lesson: Lesson) => {
        setIsCreating(false);
        setSelectedLesson(lesson);
        setModuleId(lesson.moduleId);
        setTitle(lesson.title);
        setDescription(lesson.description);
        setDuration(lesson.duration);
        setHasPrerequisites(lesson.hasPrerequisites);
        openModal();
    };

    const handleSave = () => {
        if (!title || !moduleId) return;

        const module = MOCK_MODULES.find(m => m.id === moduleId);

        if (isCreating) {
            const moduleeLessons = lessons.filter(l => l.moduleId === moduleId);
            const newLesson: Lesson = {
                id: `less-${Date.now()}`,
                moduleId,
                moduleName: module?.name || '',
                courseName: module?.courseName || '',
                title,
                description,
                order: moduleeLessons.length + 1,
                duration: Number(duration) || 30,
                activities: [],
                status: 'draft',
                hasPrerequisites,
            };
            setLessons(prev => [...prev, newLesson]);
        } else if (selectedLesson) {
            setLessons(prev => prev.map(l =>
                l.id === selectedLesson.id
                    ? {
                        ...l,
                        moduleId,
                        moduleName: module?.name || '',
                        courseName: module?.courseName || '',
                        title,
                        description,
                        duration: Number(duration) || 30,
                        hasPrerequisites,
                    }
                    : l
            ));
        }
        closeModal();
    };

    const handleAddActivity = () => {
        if (!selectedLesson || !activityType || !activityTitle) return;

        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            type: activityType as Activity['type'],
            title: activityTitle,
            instructions: activityInstructions,
            aiEnabled: activityAiEnabled,
        };

        setLessons(prev => prev.map(l =>
            l.id === selectedLesson.id
                ? { ...l, activities: [...l.activities, newActivity] }
                : l
        ));

        setActivityTitle('');
        setActivityInstructions('');
        closeActivityModal();
    };

    const handleRemoveActivity = (lessonId: string, activityId: string) => {
        setLessons(prev => prev.map(l =>
            l.id === lessonId
                ? { ...l, activities: l.activities.filter(a => a.id !== activityId) }
                : l
        ));
    };

    const handleStatusChange = (id: string, status: Lesson['status']) => {
        setLessons(prev => prev.map(l =>
            l.id === id ? { ...l, status } : l
        ));
    };

    const getActivityInfo = (type: string) => {
        return ACTIVITY_TYPES.find(t => t.value === type) || ACTIVITY_TYPES[0];
    };

    const filteredLessons = lessons.filter(l => {
        const matchesModule = !filterModule || l.moduleId === filterModule;
        const matchesStatus = activeTab === 'all' || l.status === activeTab;
        return matchesModule && matchesStatus;
    });

    const totalActivities = lessons.reduce((acc, l) => acc + l.activities.length, 0);
    const aiActivities = lessons.reduce((acc, l) => acc + l.activities.filter(a => a.aiEnabled).length, 0);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/school" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Editor de Aulas 📝</Title>
                        <Text c="dimmed">Crie aulas com atividades e integração IA</Text>
                    </div>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreate}
                    variant="gradient"
                    gradient={{ from: 'cyan', to: 'teal' }}
                >
                    Nova Aula
                </Button>
            </Group>

            {/* Stats & Filters */}
            <Group justify="space-between">
                <Group gap="md">
                    <Paper p="sm" radius="md" withBorder>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="cyan">
                                <IconFileText size={14} />
                            </ThemeIcon>
                            <Text size="sm">{lessons.length} aulas</Text>
                        </Group>
                    </Paper>
                    <Paper p="sm" radius="md" withBorder>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="violet">
                                <IconSparkles size={14} />
                            </ThemeIcon>
                            <Text size="sm">{totalActivities} atividades</Text>
                        </Group>
                    </Paper>
                    <Paper p="sm" radius="md" withBorder>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="pink">
                                <IconRobot size={14} />
                            </ThemeIcon>
                            <Text size="sm">{aiActivities} com IA</Text>
                        </Group>
                    </Paper>
                </Group>

                <Select
                    placeholder="Filtrar por módulo"
                    data={MOCK_MODULES.map(m => ({ value: m.id, label: `${m.courseName} > ${m.name}` }))}
                    value={filterModule}
                    onChange={setFilterModule}
                    clearable
                    style={{ width: 350 }}
                />
            </Group>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todas ({lessons.length})</Tabs.Tab>
                    <Tabs.Tab value="published">Publicadas ({lessons.filter(l => l.status === 'published').length})</Tabs.Tab>
                    <Tabs.Tab value="draft">Rascunhos ({lessons.filter(l => l.status === 'draft').length})</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Lessons */}
            <Stack gap="md">
                {filteredLessons.map(lesson => {
                    const aiCount = lesson.activities.filter(a => a.aiEnabled).length;

                    return (
                        <Card key={lesson.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                {/* Header */}
                                <Group justify="space-between">
                                    <div style={{ flex: 1 }}>
                                        <Group gap="xs" mb={4}>
                                            <Badge color={lesson.status === 'published' ? 'green' : 'gray'} variant="light" size="sm">
                                                {lesson.status === 'published' ? 'Publicada' : 'Rascunho'}
                                            </Badge>
                                            <Text size="xs" c="dimmed">{lesson.courseName} → {lesson.moduleName}</Text>
                                        </Group>
                                        <Text fw={600} size="lg">{lesson.title}</Text>
                                        <Text size="sm" c="dimmed">{lesson.description}</Text>
                                    </div>
                                    <Group gap="xl">
                                        <div style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{lesson.duration}min</Text>
                                            <Text size="xs" c="dimmed">Duração</Text>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{lesson.activities.length}</Text>
                                            <Text size="xs" c="dimmed">Atividades</Text>
                                        </div>
                                        <Group gap={4}>
                                            <Button
                                                size="xs"
                                                variant="light"
                                                leftSection={<IconEdit size={14} />}
                                                onClick={() => handleEdit(lesson)}
                                            >
                                                Editar
                                            </Button>
                                            {lesson.status === 'draft' && (
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color="green"
                                                    leftSection={<IconCheck size={14} />}
                                                    onClick={() => handleStatusChange(lesson.id, 'published')}
                                                >
                                                    Publicar
                                                </Button>
                                            )}
                                        </Group>
                                    </Group>
                                </Group>

                                {/* Activities */}
                                <Paper p="md" bg="gray.0" radius="md">
                                    <Group justify="space-between" mb="sm">
                                        <Text size="sm" fw={500}>Atividades</Text>
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            leftSection={<IconPlus size={12} />}
                                            onClick={() => {
                                                setSelectedLesson(lesson);
                                                setActivityType('prompt');
                                                setActivityTitle('');
                                                setActivityInstructions('');
                                                setActivityAiEnabled(true);
                                                openActivityModal();
                                            }}
                                        >
                                            Adicionar
                                        </Button>
                                    </Group>

                                    {lesson.activities.length === 0 ? (
                                        <Text size="sm" c="dimmed" ta="center" py="md">
                                            Nenhuma atividade ainda. Clique em "Adicionar" para criar.
                                        </Text>
                                    ) : (
                                        <Stack gap="xs">
                                            {lesson.activities.map((activity, i) => {
                                                const typeInfo = getActivityInfo(activity.type);
                                                const Icon = typeInfo.icon;

                                                return (
                                                    <Paper key={activity.id} p="sm" radius="md" withBorder>
                                                        <Group justify="space-between">
                                                            <Group>
                                                                <Badge variant="filled" color="gray" size="sm" radius="xl">
                                                                    {i + 1}
                                                                </Badge>
                                                                <ThemeIcon size="sm" variant="light" color={typeInfo.color}>
                                                                    <Icon size={14} />
                                                                </ThemeIcon>
                                                                <div>
                                                                    <Text size="sm" fw={500}>{activity.title}</Text>
                                                                    <Text size="xs" c="dimmed" lineClamp={1}>{activity.instructions}</Text>
                                                                </div>
                                                            </Group>
                                                            <Group gap="xs">
                                                                {activity.aiEnabled && (
                                                                    <Badge variant="light" color="violet" size="xs" leftSection={<IconRobot size={10} />}>
                                                                        IA
                                                                    </Badge>
                                                                )}
                                                                <ActionIcon
                                                                    size="sm"
                                                                    variant="subtle"
                                                                    color="red"
                                                                    onClick={() => handleRemoveActivity(lesson.id, activity.id)}
                                                                >
                                                                    <IconTrash size={14} />
                                                                </ActionIcon>
                                                            </Group>
                                                        </Group>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </Paper>
                            </Stack>
                        </Card>
                    );
                })}
            </Stack>

            {filteredLessons.length === 0 && (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconFileText size={32} />
                    </ThemeIcon>
                    <Text fw={500}>Nenhuma aula encontrada</Text>
                    <Text size="sm" c="dimmed">Crie uma nova aula para começar</Text>
                </Paper>
            )}

            {/* Lesson Modal */}
            <Modal opened={modal} onClose={closeModal} title={isCreating ? 'Nova Aula' : 'Editar Aula'} centered size="lg">
                <Stack gap="md">
                    <Select
                        label="Módulo"
                        placeholder="Selecione o módulo"
                        data={MOCK_MODULES.map(m => ({ value: m.id, label: `${m.courseName} > ${m.name}` }))}
                        value={moduleId}
                        onChange={setModuleId}
                        required
                    />
                    <TextInput
                        label="Título da Aula"
                        placeholder="Ex: Entendendo Tokenização"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva o objetivo da aula..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        minRows={2}
                    />
                    <Grid>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Duração (minutos)"
                                min={5}
                                step={5}
                                value={duration}
                                onChange={(val) => setDuration(val as number)}
                                leftSection={<IconClock size={16} />}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Switch
                                label="Requer aula anterior"
                                checked={hasPrerequisites}
                                onChange={(e) => setHasPrerequisites(e.currentTarget.checked)}
                                mt="xl"
                            />
                        </Grid.Col>
                    </Grid>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave} variant="gradient" gradient={{ from: 'cyan', to: 'teal' }}>
                            {isCreating ? 'Criar Aula' : 'Salvar'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Activity Modal */}
            <Modal opened={activityModal} onClose={closeActivityModal} title="Nova Atividade" centered>
                <Stack gap="md">
                    <Select
                        label="Tipo de Atividade"
                        data={ACTIVITY_TYPES.map(t => ({ value: t.value, label: t.label }))}
                        value={activityType}
                        onChange={setActivityType}
                        required
                    />
                    <TextInput
                        label="Título"
                        placeholder="Ex: Praticando prompts claros"
                        value={activityTitle}
                        onChange={(e) => setActivityTitle(e.target.value)}
                        required
                    />
                    <Textarea
                        label="Instruções"
                        placeholder="Descreva o que o aluno deve fazer..."
                        value={activityInstructions}
                        onChange={(e) => setActivityInstructions(e.target.value)}
                        minRows={3}
                    />
                    <Switch
                        label="Habilitar integração com IA"
                        description="Permite que o aluno use a IA durante esta atividade"
                        checked={activityAiEnabled}
                        onChange={(e) => setActivityAiEnabled(e.currentTarget.checked)}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeActivityModal}>Cancelar</Button>
                        <Button onClick={handleAddActivity}>Adicionar Atividade</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

