'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Textarea, Select,
    MultiSelect, NumberInput, Grid, Tabs, Progress, Switch, Avatar
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconBook,
    IconUsers, IconClock, IconCurrencyDollar, IconTarget,
    IconSchool, IconBriefcase, IconDeviceGamepad, IconUser
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Course {
    id: string;
    name: string;
    description: string;
    slug: string;
    targetDemographic: string[];
    ageRange: { min: number; max: number } | null;
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all';
    duration: number; // in hours
    moduleCount: number;
    lessonCount: number;
    price: number;
    status: 'draft' | 'active' | 'archived';
    enrolledCount: number;
    thumbnail?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const DEMOGRAPHICS = [
    { value: 'kids', label: '👧 Crianças (8-12)', icon: IconDeviceGamepad },
    { value: 'teens', label: '🧒 Adolescentes (13-17)', icon: IconSchool },
    { value: 'adults', label: '👨 Adultos (18+)', icon: IconUser },
    { value: 'professionals', label: '💼 Profissionais', icon: IconBriefcase },
    { value: 'educators', label: '🧑‍🏫 Educadores', icon: IconSchool },
    { value: 'seniors', label: '👴 60+', icon: IconUser },
];

const MOCK_COURSES: Course[] = [];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CourseManagementPage() {
    const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [targetDemographic, setTargetDemographic] = useState<string[]>([]);
    const [ageMin, setAgeMin] = useState<number | ''>(10);
    const [ageMax, setAgeMax] = useState<number | ''>(18);
    const [skillLevel, setSkillLevel] = useState<string | null>('beginner');
    const [duration, setDuration] = useState<number | ''>(20);
    const [price, setPrice] = useState<number | ''>(497);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedCourse(null);
        setName('');
        setDescription('');
        setSlug('');
        setTargetDemographic([]);
        setAgeMin(10);
        setAgeMax(18);
        setSkillLevel('beginner');
        setDuration(20);
        setPrice(497);
        openModal();
    };

    const handleEdit = (course: Course) => {
        setIsCreating(false);
        setSelectedCourse(course);
        setName(course.name);
        setDescription(course.description);
        setSlug(course.slug);
        setTargetDemographic(course.targetDemographic);
        setAgeMin(course.ageRange?.min || 10);
        setAgeMax(course.ageRange?.max || 18);
        setSkillLevel(course.skillLevel);
        setDuration(course.duration);
        setPrice(course.price);
        openModal();
    };

    const handleSave = () => {
        if (!name || !slug) return;

        if (isCreating) {
            const newCourse: Course = {
                id: `course-${Date.now()}`,
                name,
                description,
                slug,
                targetDemographic,
                ageRange: ageMin && ageMax ? { min: Number(ageMin), max: Number(ageMax) } : null,
                skillLevel: (skillLevel as Course['skillLevel']) || 'beginner',
                duration: Number(duration) || 20,
                moduleCount: 0,
                lessonCount: 0,
                price: Number(price) || 0,
                status: 'draft',
                enrolledCount: 0,
            };
            setCourses(prev => [...prev, newCourse]);
        } else if (selectedCourse) {
            setCourses(prev => prev.map(c =>
                c.id === selectedCourse.id
                    ? {
                        ...c,
                        name,
                        description,
                        slug,
                        targetDemographic,
                        ageRange: ageMin && ageMax ? { min: Number(ageMin), max: Number(ageMax) } : null,
                        skillLevel: (skillLevel as Course['skillLevel']) || 'beginner',
                        duration: Number(duration) || 20,
                        price: Number(price) || 0,
                    }
                    : c
            ));
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        setCourses(prev => prev.filter(c => c.id !== id));
    };

    const handleStatusChange = (id: string, status: Course['status']) => {
        setCourses(prev => prev.map(c =>
            c.id === id ? { ...c, status } : c
        ));
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
            draft: { color: 'gray', label: 'Rascunho' },
            active: { color: 'green', label: 'Ativo' },
            archived: { color: 'orange', label: 'Arquivado' },
        };
        return map[status] || map.draft;
    };

    const getSkillInfo = (skill: string) => {
        const map: Record<string, { color: string; label: string }> = {
            beginner: { color: 'green', label: 'Iniciante' },
            intermediate: { color: 'yellow', label: 'Intermediário' },
            advanced: { color: 'red', label: 'Avançado' },
            all: { color: 'blue', label: 'Todos' },
        };
        return map[skill] || map.all;
    };

    const filteredCourses = activeTab === 'all'
        ? courses
        : courses.filter(c => c.status === activeTab);

    const totalEnrolled = courses.reduce((acc, c) => acc + c.enrolledCount, 0);
    const activeCourses = courses.filter(c => c.status === 'active').length;

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
                        <Title order={2}>Cursos & Programas 📚</Title>
                        <Text c="dimmed">Gerencie cursos por público-alvo e nível</Text>
                    </div>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreate}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                >
                    Novo Curso
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{courses.length}</Text>
                            <Text size="sm" c="dimmed">Total de Cursos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconBook size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">{activeCourses}</Text>
                            <Text size="sm" c="dimmed">Cursos Ativos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconTarget size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="violet">{totalEnrolled}</Text>
                            <Text size="sm" c="dimmed">Total Matriculados</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="cyan">
                                {courses.reduce((acc, c) => acc + c.lessonCount, 0)}
                            </Text>
                            <Text size="sm" c="dimmed">Total de Aulas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="cyan">
                            <IconClock size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todos ({courses.length})</Tabs.Tab>
                    <Tabs.Tab value="active">Ativos ({courses.filter(c => c.status === 'active').length})</Tabs.Tab>
                    <Tabs.Tab value="draft">Rascunhos ({courses.filter(c => c.status === 'draft').length})</Tabs.Tab>
                    <Tabs.Tab value="archived">Arquivados ({courses.filter(c => c.status === 'archived').length})</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Course Cards */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {filteredCourses.map(course => {
                    const statusInfo = getStatusInfo(course.status);
                    const skillInfo = getSkillInfo(course.skillLevel);

                    return (
                        <Card key={course.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                {/* Header */}
                                <Group justify="space-between">
                                    <div style={{ flex: 1 }}>
                                        <Group gap="xs" mb={4}>
                                            <Badge color={statusInfo.color} variant="light" size="sm">
                                                {statusInfo.label}
                                            </Badge>
                                            <Badge color={skillInfo.color} variant="outline" size="sm">
                                                {skillInfo.label}
                                            </Badge>
                                        </Group>
                                        <Text fw={600} size="lg">{course.name}</Text>
                                        <Text size="sm" c="dimmed" lineClamp={2}>{course.description}</Text>
                                    </div>
                                </Group>

                                {/* Demographics */}
                                <div>
                                    <Text size="xs" c="dimmed" mb={4}>Público-alvo:</Text>
                                    <Group gap={4}>
                                        {course.targetDemographic.map(demo => {
                                            const demoInfo = DEMOGRAPHICS.find(d => d.value === demo);
                                            return (
                                                <Badge key={demo} variant="filled" color="blue" size="sm">
                                                    {demoInfo?.label.split(' ')[0] || demo}
                                                </Badge>
                                            );
                                        })}
                                        {course.ageRange && (
                                            <Badge variant="outline" color="gray" size="sm">
                                                {course.ageRange.min}-{course.ageRange.max} anos
                                            </Badge>
                                        )}
                                    </Group>
                                </div>

                                {/* Stats Grid */}
                                <Grid>
                                    <Grid.Col span={3}>
                                        <Paper p="xs" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{course.moduleCount}</Text>
                                            <Text size="xs" c="dimmed">Módulos</Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={3}>
                                        <Paper p="xs" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{course.lessonCount}</Text>
                                            <Text size="xs" c="dimmed">Aulas</Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={3}>
                                        <Paper p="xs" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{course.duration}h</Text>
                                            <Text size="xs" c="dimmed">Duração</Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={3}>
                                        <Paper p="xs" bg="green.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700} c="green">{course.enrolledCount}</Text>
                                            <Text size="xs" c="dimmed">Alunos</Text>
                                        </Paper>
                                    </Grid.Col>
                                </Grid>

                                {/* Price & Actions */}
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <IconCurrencyDollar size={20} color="var(--mantine-color-green-6)" />
                                        <Text size="lg" fw={700} c="green">
                                            R$ {course.price.toLocaleString('pt-BR')}
                                        </Text>
                                    </Group>
                                    <Group gap={4}>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconEdit size={14} />}
                                            onClick={() => handleEdit(course)}
                                        >
                                            Editar
                                        </Button>
                                        {course.status === 'draft' && (
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color="green"
                                                onClick={() => handleStatusChange(course.id, 'active')}
                                            >
                                                Publicar
                                            </Button>
                                        )}
                                        {course.status === 'active' && (
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color="orange"
                                                onClick={() => handleStatusChange(course.id, 'archived')}
                                            >
                                                Arquivar
                                            </Button>
                                        )}
                                    </Group>
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {filteredCourses.length === 0 && (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconBook size={32} />
                    </ThemeIcon>
                    <Text fw={500}>Nenhum curso encontrado</Text>
                    <Text size="sm" c="dimmed">Crie um novo curso para começar</Text>
                </Paper>
            )}

            {/* Course Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title={isCreating ? 'Novo Curso' : 'Editar Curso'}
                centered
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome do Curso"
                        placeholder="Ex: Fundamentos de IA para Jovens"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (isCreating) {
                                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                            }
                        }}
                        required
                    />

                    <TextInput
                        label="Slug (URL)"
                        placeholder="fundamentos-ia-jovens"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                    />

                    <Textarea
                        label="Descrição"
                        placeholder="Descreva o curso e seus objetivos..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        minRows={3}
                    />

                    <MultiSelect
                        label="Público-alvo"
                        placeholder="Selecione os públicos"
                        data={DEMOGRAPHICS.map(d => ({ value: d.value, label: d.label }))}
                        value={targetDemographic}
                        onChange={setTargetDemographic}
                    />

                    <Grid>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Idade Mínima"
                                min={5}
                                max={100}
                                value={ageMin}
                                onChange={(val) => setAgeMin(val as number)}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Idade Máxima"
                                min={5}
                                max={100}
                                value={ageMax}
                                onChange={(val) => setAgeMax(val as number)}
                            />
                        </Grid.Col>
                    </Grid>

                    <Select
                        label="Nível de Habilidade"
                        data={[
                            { value: 'beginner', label: '🟢 Iniciante' },
                            { value: 'intermediate', label: '🟡 Intermediário' },
                            { value: 'advanced', label: '🔴 Avançado' },
                            { value: 'all', label: '🔵 Todos os níveis' },
                        ]}
                        value={skillLevel}
                        onChange={setSkillLevel}
                    />

                    <Grid>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Duração (horas)"
                                min={1}
                                value={duration}
                                onChange={(val) => setDuration(val as number)}
                                leftSection={<IconClock size={16} />}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Preço (R$)"
                                min={0}
                                value={price}
                                onChange={(val) => setPrice(val as number)}
                                leftSection={<IconCurrencyDollar size={16} />}
                                decimalScale={2}
                            />
                        </Grid.Col>
                    </Grid>

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button
                            onClick={handleSave}
                            variant="gradient"
                            gradient={{ from: 'blue', to: 'cyan' }}
                        >
                            {isCreating ? 'Criar Curso' : 'Salvar'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

