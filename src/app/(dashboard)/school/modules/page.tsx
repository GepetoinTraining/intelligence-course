'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Textarea, Select,
    NumberInput, Grid, Table, Progress, Accordion
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconBook2,
    IconListNumbers, IconClock, IconTarget, IconArrowUp, IconArrowDown,
    IconGripVertical, IconCheck
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Module {
    id: string;
    courseId: string;
    courseName: string;
    name: string;
    description: string;
    objectives: string[];
    order: number;
    lessonCount: number;
    duration: number; // in minutes
    status: 'draft' | 'published';
}

interface Course {
    id: string;
    name: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_COURSES: Course[] = [];

const MOCK_MODULES: Module[] = [];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ModuleManagementPage() {
    const [modules, setModules] = useState<Module[]>(MOCK_MODULES);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [filterCourse, setFilterCourse] = useState<string | null>(null);

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);

    // Form state
    const [courseId, setCourseId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [objectives, setObjectives] = useState('');
    const [duration, setDuration] = useState<number | ''>(60);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedModule(null);
        setCourseId(filterCourse || null);
        setName('');
        setDescription('');
        setObjectives('');
        setDuration(60);
        openModal();
    };

    const handleEdit = (module: Module) => {
        setIsCreating(false);
        setSelectedModule(module);
        setCourseId(module.courseId);
        setName(module.name);
        setDescription(module.description);
        setObjectives(module.objectives.join('\n'));
        setDuration(module.duration);
        openModal();
    };

    const handleSave = () => {
        if (!name || !courseId) return;

        const course = MOCK_COURSES.find(c => c.id === courseId);

        if (isCreating) {
            const courseModules = modules.filter(m => m.courseId === courseId);
            const newModule: Module = {
                id: `mod-${Date.now()}`,
                courseId,
                courseName: course?.name || '',
                name,
                description,
                objectives: objectives.split('\n').filter(o => o.trim()),
                order: courseModules.length + 1,
                lessonCount: 0,
                duration: Number(duration) || 60,
                status: 'draft',
            };
            setModules(prev => [...prev, newModule]);
        } else if (selectedModule) {
            setModules(prev => prev.map(m =>
                m.id === selectedModule.id
                    ? {
                        ...m,
                        courseId,
                        courseName: course?.name || '',
                        name,
                        description,
                        objectives: objectives.split('\n').filter(o => o.trim()),
                        duration: Number(duration) || 60,
                    }
                    : m
            ));
        }
        closeModal();
    };

    const handleReorder = (moduleId: string, direction: 'up' | 'down') => {
        setModules(prev => {
            const module = prev.find(m => m.id === moduleId);
            if (!module) return prev;

            const courseModules = prev.filter(m => m.courseId === module.courseId).sort((a, b) => a.order - b.order);
            const currentIndex = courseModules.findIndex(m => m.id === moduleId);
            const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            if (swapIndex < 0 || swapIndex >= courseModules.length) return prev;

            const swapModule = courseModules[swapIndex];
            return prev.map(m => {
                if (m.id === moduleId) return { ...m, order: swapModule.order };
                if (m.id === swapModule.id) return { ...m, order: module.order };
                return m;
            });
        });
    };

    const handleStatusChange = (id: string, status: Module['status']) => {
        setModules(prev => prev.map(m =>
            m.id === id ? { ...m, status } : m
        ));
    };

    const filteredModules = filterCourse
        ? modules.filter(m => m.courseId === filterCourse)
        : modules;

    // Group modules by course
    const groupedModules = MOCK_COURSES.map(course => ({
        course,
        modules: filteredModules.filter(m => m.courseId === course.id).sort((a, b) => a.order - b.order),
    })).filter(g => g.modules.length > 0);

    const totalDuration = modules.reduce((acc, m) => acc + m.duration, 0);

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
                        <Title order={2}>Módulos do Curso 📖</Title>
                        <Text c="dimmed">Organize módulos e objetivos de aprendizagem</Text>
                    </div>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreate}
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'grape' }}
                >
                    Novo Módulo
                </Button>
            </Group>

            {/* Stats & Filter */}
            <Group justify="space-between">
                <Group gap="md">
                    <Paper p="sm" radius="md" withBorder>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="violet">
                                <IconBook2 size={14} />
                            </ThemeIcon>
                            <Text size="sm">{modules.length} módulos</Text>
                        </Group>
                    </Paper>
                    <Paper p="sm" radius="md" withBorder>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="blue">
                                <IconClock size={14} />
                            </ThemeIcon>
                            <Text size="sm">{Math.round(totalDuration / 60)}h de conteúdo</Text>
                        </Group>
                    </Paper>
                </Group>

                <Select
                    placeholder="Filtrar por curso"
                    data={MOCK_COURSES.map(c => ({ value: c.id, label: c.name }))}
                    value={filterCourse}
                    onChange={setFilterCourse}
                    clearable
                    style={{ width: 300 }}
                />
            </Group>

            {/* Modules by Course */}
            <Accordion variant="separated" radius="md">
                {groupedModules.map(({ course, modules: courseModules }) => (
                    <Accordion.Item key={course.id} value={course.id}>
                        <Accordion.Control>
                            <Group>
                                <ThemeIcon size="lg" variant="light" color="blue">
                                    <IconBook2 size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={600}>{course.name}</Text>
                                    <Text size="sm" c="dimmed">
                                        {courseModules.length} módulos · {courseModules.reduce((acc, m) => acc + m.lessonCount, 0)} aulas
                                    </Text>
                                </div>
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                {courseModules.map((module, index) => (
                                    <Card key={module.id} shadow="xs" radius="md" p="md" withBorder>
                                        <Group justify="space-between">
                                            <Group>
                                                <Group gap={4}>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        size="sm"
                                                        onClick={() => handleReorder(module.id, 'up')}
                                                        disabled={index === 0}
                                                    >
                                                        <IconArrowUp size={14} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        size="sm"
                                                        onClick={() => handleReorder(module.id, 'down')}
                                                        disabled={index === courseModules.length - 1}
                                                    >
                                                        <IconArrowDown size={14} />
                                                    </ActionIcon>
                                                </Group>

                                                <Badge variant="filled" color="gray" size="lg" radius="xl">
                                                    {module.order}
                                                </Badge>

                                                <div>
                                                    <Group gap="xs">
                                                        <Text fw={600}>{module.name}</Text>
                                                        <Badge
                                                            color={module.status === 'published' ? 'green' : 'gray'}
                                                            variant="light"
                                                            size="xs"
                                                        >
                                                            {module.status === 'published' ? 'Publicado' : 'Rascunho'}
                                                        </Badge>
                                                    </Group>
                                                    <Text size="sm" c="dimmed">{module.description}</Text>
                                                </div>
                                            </Group>

                                            <Group gap="xl">
                                                <div style={{ textAlign: 'center' }}>
                                                    <Text size="lg" fw={700}>{module.lessonCount}</Text>
                                                    <Text size="xs" c="dimmed">Aulas</Text>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <Text size="lg" fw={700}>{module.duration}min</Text>
                                                    <Text size="xs" c="dimmed">Duração</Text>
                                                </div>

                                                <Group gap={4}>
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => handleEdit(module)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    {module.status === 'draft' && (
                                                        <Button
                                                            size="xs"
                                                            variant="light"
                                                            color="green"
                                                            leftSection={<IconCheck size={14} />}
                                                            onClick={() => handleStatusChange(module.id, 'published')}
                                                        >
                                                            Publicar
                                                        </Button>
                                                    )}
                                                </Group>
                                            </Group>
                                        </Group>

                                        {/* Objectives */}
                                        {module.objectives.length > 0 && (
                                            <Paper p="sm" bg="violet.0" radius="md" mt="md">
                                                <Text size="xs" fw={500} mb="xs">
                                                    <IconTarget size={12} style={{ marginRight: 4 }} />
                                                    Objetivos de Aprendizagem:
                                                </Text>
                                                <Group gap="xs">
                                                    {module.objectives.map((obj, i) => (
                                                        <Badge key={i} variant="outline" color="violet" size="sm">
                                                            {obj}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                            </Paper>
                                        )}
                                    </Card>
                                ))}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>

            {groupedModules.length === 0 && (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconBook2 size={32} />
                    </ThemeIcon>
                    <Text fw={500}>Nenhum módulo encontrado</Text>
                    <Text size="sm" c="dimmed">Crie um novo módulo para começar</Text>
                </Paper>
            )}

            {/* Module Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title={isCreating ? 'Novo Módulo' : 'Editar Módulo'}
                centered
                size="lg"
            >
                <Stack gap="md">
                    <Select
                        label="Curso"
                        placeholder="Selecione o curso"
                        data={MOCK_COURSES.map(c => ({ value: c.id, label: c.name }))}
                        value={courseId}
                        onChange={setCourseId}
                        required
                    />

                    <TextInput
                        label="Nome do Módulo"
                        placeholder="Ex: Fundamentos de LLMs"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <Textarea
                        label="Descrição"
                        placeholder="Descreva o objetivo geral do módulo..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        minRows={2}
                    />

                    <Textarea
                        label="Objetivos de Aprendizagem (um por linha)"
                        placeholder="Entender tokenização&#10;Conhecer limites de contexto&#10;Aplicar em exemplos práticos"
                        value={objectives}
                        onChange={(e) => setObjectives(e.target.value)}
                        minRows={4}
                    />

                    <NumberInput
                        label="Duração Estimada (minutos)"
                        min={15}
                        step={15}
                        value={duration}
                        onChange={(val) => setDuration(val as number)}
                        leftSection={<IconClock size={16} />}
                    />

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button
                            onClick={handleSave}
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape' }}
                        >
                            {isCreating ? 'Criar Módulo' : 'Salvar'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

