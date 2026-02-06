'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    TextInput, Textarea, Select, NumberInput, ThemeIcon, Paper,
    ActionIcon, Tabs, Switch, ColorSwatch, Divider, Modal,
    Grid, Accordion, List, Table, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconTrash, IconEye, IconDeviceFloppy, IconCopy,
    IconArrowUp, IconArrowDown, IconBrain, IconSparkles, IconUsers,
    IconClock, IconCalendar, IconCoin, IconCheck, IconGripVertical,
    IconPhoto, IconVideo, IconQuote, IconListCheck, IconLayout,
    IconPalette, IconCode, IconExternalLink
} from '@tabler/icons-react';
import { RichTextEditor as RTEditor } from '@/components/shared';

// Types
interface CourseModule {
    id: string;
    title: string;
    lessons: number;
    topics: string[];
}

interface Schedule {
    day: string;
    time: string;
}

interface Testimonial {
    quote: string;
    name: string;
    avatar?: string;
}

interface FAQ {
    question: string;
    answer: string;
}

interface CourseLanding {
    // Basic Info
    id: string;
    name: string;
    subtitle: string;
    tagline: string;
    description: string;
    color: string;
    icon: string;

    // Details
    ages: string;
    duration: string;
    classesPerWeek: string;
    classDuration: string;
    totalClasses: number;
    maxStudents: number;

    // Pricing
    price: number;
    enrollmentFee: number;
    discounts: string[];

    // Schedule
    nextStart: string;
    schedules: Schedule[];

    // Content
    modules: CourseModule[];
    outcomes: string[];
    requirements: string[];

    // Social Proof
    testimonials: Testimonial[];
    faqs: FAQ[];

    // Media
    heroImage?: string;
    videoUrl?: string;

    // Settings
    isPublished: boolean;
    showPricing: boolean;
    showAvailability: boolean;
}

// Default course data
const getDefaultCourse = (): CourseLanding => ({
    id: '',
    name: '',
    subtitle: '',
    tagline: '',
    description: '',
    color: 'violet',
    icon: '🎯',
    ages: '',
    duration: '6 meses',
    classesPerWeek: '1 aula/semana',
    classDuration: '90 minutos',
    totalClasses: 24,
    maxStudents: 8,
    price: 450,
    enrollmentFee: 100,
    discounts: ['15% para irmãos', '10% pagto anual'],
    nextStart: '',
    schedules: [{ day: 'Segunda', time: '14:00 - 15:30' }],
    modules: [{ id: '1', title: 'Módulo 1', lessons: 4, topics: ['Tópico 1', 'Tópico 2'] }],
    outcomes: ['Aprendizado 1', 'Aprendizado 2'],
    requirements: ['Pré-requisito 1'],
    testimonials: [],
    faqs: [],
    isPublished: false,
    showPricing: true,
    showAvailability: true,
});

const COLOR_OPTIONS = [
    { value: 'violet', label: 'Violeta' },
    { value: 'blue', label: 'Azul' },
    { value: 'cyan', label: 'Ciano' },
    { value: 'teal', label: 'Verde-água' },
    { value: 'green', label: 'Verde' },
    { value: 'orange', label: 'Laranja' },
    { value: 'pink', label: 'Rosa' },
];

const ICON_OPTIONS = ['🎯', '🧠', '💻', '🌟', '🚀', '📚', '🎨', '🔬', '⚡', '🎮'];

const DAY_OPTIONS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function LandingBuilderPage() {
    const [course, setCourse] = useState<CourseLanding>(getDefaultCourse());
    const [activeTab, setActiveTab] = useState<string | null>('basic');
    const [previewModal, { open: openPreview, close: closePreview }] = useDisclosure(false);
    const [saved, setSaved] = useState(false);

    // Helper to update nested fields
    const updateField = <K extends keyof CourseLanding>(field: K, value: CourseLanding[K]) => {
        setCourse(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    // Module management
    const addModule = () => {
        const newModule: CourseModule = {
            id: Date.now().toString(),
            title: `Módulo ${course.modules.length + 1}`,
            lessons: 4,
            topics: [],
        };
        updateField('modules', [...course.modules, newModule]);
    };

    const updateModule = (id: string, updates: Partial<CourseModule>) => {
        updateField('modules', course.modules.map(m => m.id === id ? { ...m, ...updates } : m));
    };

    const removeModule = (id: string) => {
        updateField('modules', course.modules.filter(m => m.id !== id));
    };

    // Schedule management
    const addSchedule = () => {
        updateField('schedules', [...course.schedules, { day: 'Segunda', time: '14:00 - 15:30' }]);
    };

    const updateSchedule = (index: number, updates: Partial<Schedule>) => {
        const newSchedules = [...course.schedules];
        newSchedules[index] = { ...newSchedules[index], ...updates };
        updateField('schedules', newSchedules);
    };

    const removeSchedule = (index: number) => {
        updateField('schedules', course.schedules.filter((_, i) => i !== index));
    };

    // List management (outcomes, requirements, discounts)
    const addToList = (field: 'outcomes' | 'requirements' | 'discounts') => {
        updateField(field, [...course[field], '']);
    };

    const updateListItem = (field: 'outcomes' | 'requirements' | 'discounts', index: number, value: string) => {
        const newList = [...course[field]];
        newList[index] = value;
        updateField(field, newList);
    };

    const removeFromList = (field: 'outcomes' | 'requirements' | 'discounts', index: number) => {
        updateField(field, course[field].filter((_, i) => i !== index));
    };

    // Testimonial management
    const addTestimonial = () => {
        updateField('testimonials', [...course.testimonials, { quote: '', name: '' }]);
    };

    const updateTestimonial = (index: number, updates: Partial<Testimonial>) => {
        const newTestimonials = [...course.testimonials];
        newTestimonials[index] = { ...newTestimonials[index], ...updates };
        updateField('testimonials', newTestimonials);
    };

    const removeTestimonial = (index: number) => {
        updateField('testimonials', course.testimonials.filter((_, i) => i !== index));
    };

    // FAQ management
    const addFaq = () => {
        updateField('faqs', [...course.faqs, { question: '', answer: '' }]);
    };

    const updateFaq = (index: number, updates: Partial<FAQ>) => {
        const newFaqs = [...course.faqs];
        newFaqs[index] = { ...newFaqs[index], ...updates };
        updateField('faqs', newFaqs);
    };

    const removeFaq = (index: number) => {
        updateField('faqs', course.faqs.filter((_, i) => i !== index));
    };

    // Save action
    const handleSave = () => {
        // Would save to API
        console.log('Saving course:', course);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Landing Page Builder 🎨</Title>
                    <Text c="dimmed">Crie páginas de vendas otimizadas para seus cursos</Text>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconEye size={16} />} onClick={openPreview}>
                        Preview
                    </Button>
                    <Button
                        leftSection={saved ? <IconCheck size={16} /> : <IconDeviceFloppy size={16} />}
                        color={saved ? 'green' : 'blue'}
                        onClick={handleSave}
                    >
                        {saved ? 'Salvo!' : 'Salvar'}
                    </Button>
                </Group>
            </Group>

            {/* Main Content */}
            <Grid>
                {/* Form */}
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Card shadow="sm" radius="md" withBorder>
                        <Tabs value={activeTab} onChange={setActiveTab}>
                            <Tabs.List>
                                <Tabs.Tab value="basic" leftSection={<IconLayout size={14} />}>Básico</Tabs.Tab>
                                <Tabs.Tab value="details" leftSection={<IconClock size={14} />}>Detalhes</Tabs.Tab>
                                <Tabs.Tab value="pricing" leftSection={<IconCoin size={14} />}>Preços</Tabs.Tab>
                                <Tabs.Tab value="content" leftSection={<IconListCheck size={14} />}>Conteúdo</Tabs.Tab>
                                <Tabs.Tab value="social" leftSection={<IconQuote size={14} />}>Social Proof</Tabs.Tab>
                                <Tabs.Tab value="settings" leftSection={<IconPalette size={14} />}>Configurações</Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="basic" pt="md">
                                <Stack gap="md">
                                    <TextInput
                                        label="Nome do Curso"
                                        placeholder="Ex: Alfabetização em IA"
                                        value={course.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        required
                                    />
                                    <TextInput
                                        label="Subtítulo"
                                        placeholder="Ex: O curso que vai mudar sua relação com a tecnologia"
                                        value={course.subtitle}
                                        onChange={(e) => updateField('subtitle', e.target.value)}
                                    />
                                    <TextInput
                                        label="Tagline (Hero)"
                                        placeholder="Frase de impacto para o topo da página"
                                        value={course.tagline}
                                        onChange={(e) => updateField('tagline', e.target.value)}
                                    />
                                    <Textarea
                                        label="Descrição"
                                        placeholder="Descrição detalhada do curso..."
                                        rows={4}
                                        value={course.description}
                                        onChange={(e) => updateField('description', e.target.value)}
                                    />
                                    <Group grow>
                                        <Select
                                            label="Cor Principal"
                                            data={COLOR_OPTIONS}
                                            value={course.color}
                                            onChange={(v) => updateField('color', v || 'violet')}
                                        />
                                        <Select
                                            label="Ícone"
                                            data={ICON_OPTIONS.map(i => ({ value: i, label: i }))}
                                            value={course.icon}
                                            onChange={(v) => updateField('icon', v || '🎯')}
                                        />
                                    </Group>
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="details" pt="md">
                                <Stack gap="md">
                                    <SimpleGrid cols={2}>
                                        <TextInput
                                            label="Faixa Etária"
                                            placeholder="Ex: 10+ anos"
                                            value={course.ages}
                                            onChange={(e) => updateField('ages', e.target.value)}
                                        />
                                        <TextInput
                                            label="Duração Total"
                                            placeholder="Ex: 6 meses"
                                            value={course.duration}
                                            onChange={(e) => updateField('duration', e.target.value)}
                                        />
                                        <TextInput
                                            label="Aulas por Semana"
                                            placeholder="Ex: 1 aula/semana"
                                            value={course.classesPerWeek}
                                            onChange={(e) => updateField('classesPerWeek', e.target.value)}
                                        />
                                        <TextInput
                                            label="Duração da Aula"
                                            placeholder="Ex: 90 minutos"
                                            value={course.classDuration}
                                            onChange={(e) => updateField('classDuration', e.target.value)}
                                        />
                                        <NumberInput
                                            label="Total de Aulas"
                                            value={course.totalClasses}
                                            onChange={(v) => updateField('totalClasses', Number(v) || 24)}
                                            min={1}
                                        />
                                        <NumberInput
                                            label="Máx. Alunos/Turma"
                                            value={course.maxStudents}
                                            onChange={(v) => updateField('maxStudents', Number(v) || 8)}
                                            min={1}
                                        />
                                    </SimpleGrid>

                                    <Divider label="Horários Disponíveis" />

                                    <Stack gap="sm">
                                        {course.schedules.map((schedule, i) => (
                                            <Group key={i}>
                                                <Select
                                                    data={DAY_OPTIONS}
                                                    value={schedule.day}
                                                    onChange={(v) => updateSchedule(i, { day: v || 'Segunda' })}
                                                    style={{ flex: 1 }}
                                                />
                                                <TextInput
                                                    placeholder="14:00 - 15:30"
                                                    value={schedule.time}
                                                    onChange={(e) => updateSchedule(i, { time: e.target.value })}
                                                    style={{ flex: 1 }}
                                                />
                                                <ActionIcon color="red" variant="light" onClick={() => removeSchedule(i)}>
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        ))}
                                        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addSchedule}>
                                            Adicionar Horário
                                        </Button>
                                    </Stack>

                                    <TextInput
                                        label="Próxima Turma"
                                        placeholder="Ex: 10 de Março 2026"
                                        value={course.nextStart}
                                        onChange={(e) => updateField('nextStart', e.target.value)}
                                    />
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="pricing" pt="md">
                                <Stack gap="md">
                                    <SimpleGrid cols={2}>
                                        <NumberInput
                                            label="Mensalidade (R$)"
                                            value={course.price}
                                            onChange={(v) => updateField('price', Number(v) || 0)}
                                            min={0}
                                            prefix="R$ "
                                        />
                                        <NumberInput
                                            label="Taxa de Matrícula (R$)"
                                            value={course.enrollmentFee}
                                            onChange={(v) => updateField('enrollmentFee', Number(v) || 0)}
                                            min={0}
                                            prefix="R$ "
                                        />
                                    </SimpleGrid>

                                    <Divider label="Descontos" />

                                    <Stack gap="sm">
                                        {course.discounts.map((discount, i) => (
                                            <Group key={i}>
                                                <TextInput
                                                    placeholder="Ex: 15% para irmãos"
                                                    value={discount}
                                                    onChange={(e) => updateListItem('discounts', i, e.target.value)}
                                                    style={{ flex: 1 }}
                                                />
                                                <ActionIcon color="red" variant="light" onClick={() => removeFromList('discounts', i)}>
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        ))}
                                        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => addToList('discounts')}>
                                            Adicionar Desconto
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="content" pt="md">
                                <Stack gap="lg">
                                    {/* Modules */}
                                    <div>
                                        <Text fw={600} mb="sm">Módulos do Curso</Text>
                                        <Accordion variant="separated">
                                            {course.modules.map((module, i) => (
                                                <Accordion.Item key={module.id} value={module.id}>
                                                    <Accordion.Control>
                                                        <Group justify="space-between">
                                                            <Group gap="sm">
                                                                <Badge color={course.color}>{i + 1}</Badge>
                                                                <Text>{module.title || 'Novo Módulo'}</Text>
                                                            </Group>
                                                            <Badge variant="light">{module.lessons} aulas</Badge>
                                                        </Group>
                                                    </Accordion.Control>
                                                    <Accordion.Panel>
                                                        <Stack gap="sm">
                                                            <Group>
                                                                <TextInput
                                                                    label="Título"
                                                                    value={module.title}
                                                                    onChange={(e) => updateModule(module.id, { title: e.target.value })}
                                                                    style={{ flex: 1 }}
                                                                />
                                                                <NumberInput
                                                                    label="Aulas"
                                                                    value={module.lessons}
                                                                    onChange={(v) => updateModule(module.id, { lessons: Number(v) || 1 })}
                                                                    min={1}
                                                                    w={100}
                                                                />
                                                            </Group>
                                                            <Textarea
                                                                label="Tópicos (um por linha)"
                                                                value={module.topics.join('\n')}
                                                                onChange={(e) => updateModule(module.id, { topics: e.target.value.split('\n').filter(t => t.trim()) })}
                                                                rows={3}
                                                            />
                                                            <Button
                                                                variant="light"
                                                                color="red"
                                                                leftSection={<IconTrash size={16} />}
                                                                onClick={() => removeModule(module.id)}
                                                            >
                                                                Remover Módulo
                                                            </Button>
                                                        </Stack>
                                                    </Accordion.Panel>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                                        <Button variant="light" leftSection={<IconPlus size={16} />} mt="sm" onClick={addModule}>
                                            Adicionar Módulo
                                        </Button>
                                    </div>

                                    <Divider />

                                    {/* Outcomes */}
                                    <div>
                                        <Text fw={600} mb="sm">O que o aluno vai aprender</Text>
                                        <Stack gap="sm">
                                            {course.outcomes.map((outcome, i) => (
                                                <Group key={i}>
                                                    <ThemeIcon size="sm" variant="light" color="green">
                                                        <IconCheck size={12} />
                                                    </ThemeIcon>
                                                    <TextInput
                                                        placeholder="Ex: Criar prompts eficazes"
                                                        value={outcome}
                                                        onChange={(e) => updateListItem('outcomes', i, e.target.value)}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <ActionIcon color="red" variant="light" onClick={() => removeFromList('outcomes', i)}>
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            ))}
                                            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => addToList('outcomes')}>
                                                Adicionar Resultado
                                            </Button>
                                        </Stack>
                                    </div>

                                    <Divider />

                                    {/* Requirements */}
                                    <div>
                                        <Text fw={600} mb="sm">Pré-requisitos</Text>
                                        <Stack gap="sm">
                                            {course.requirements.map((req, i) => (
                                                <Group key={i}>
                                                    <TextInput
                                                        placeholder="Ex: Saber ler e escrever"
                                                        value={req}
                                                        onChange={(e) => updateListItem('requirements', i, e.target.value)}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <ActionIcon color="red" variant="light" onClick={() => removeFromList('requirements', i)}>
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            ))}
                                            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => addToList('requirements')}>
                                                Adicionar Pré-requisito
                                            </Button>
                                        </Stack>
                                    </div>
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="social" pt="md">
                                <Stack gap="lg">
                                    {/* Testimonials */}
                                    <div>
                                        <Text fw={600} mb="sm">Depoimentos</Text>
                                        <Stack gap="md">
                                            {course.testimonials.map((testimonial, i) => (
                                                <Card key={i} withBorder p="sm">
                                                    <Stack gap="sm">
                                                        <Textarea
                                                            label="Citação"
                                                            placeholder="O que a pessoa disse sobre o curso..."
                                                            value={testimonial.quote}
                                                            onChange={(e) => updateTestimonial(i, { quote: e.target.value })}
                                                            rows={2}
                                                        />
                                                        <TextInput
                                                            label="Nome"
                                                            placeholder="Ex: Maria, mãe do João"
                                                            value={testimonial.name}
                                                            onChange={(e) => updateTestimonial(i, { name: e.target.value })}
                                                        />
                                                        <Button
                                                            variant="light"
                                                            color="red"
                                                            size="xs"
                                                            leftSection={<IconTrash size={14} />}
                                                            onClick={() => removeTestimonial(i)}
                                                        >
                                                            Remover
                                                        </Button>
                                                    </Stack>
                                                </Card>
                                            ))}
                                            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addTestimonial}>
                                                Adicionar Depoimento
                                            </Button>
                                        </Stack>
                                    </div>

                                    <Divider />

                                    {/* FAQs */}
                                    <div>
                                        <Text fw={600} mb="sm">Perguntas Frequentes</Text>
                                        <Stack gap="md">
                                            {course.faqs.map((faq, i) => (
                                                <Card key={i} withBorder p="sm">
                                                    <Stack gap="sm">
                                                        <TextInput
                                                            label="Pergunta"
                                                            placeholder="Ex: Preciso saber programar?"
                                                            value={faq.question}
                                                            onChange={(e) => updateFaq(i, { question: e.target.value })}
                                                        />
                                                        <Textarea
                                                            label="Resposta"
                                                            placeholder="Resposta completa..."
                                                            value={faq.answer}
                                                            onChange={(e) => updateFaq(i, { answer: e.target.value })}
                                                            rows={2}
                                                        />
                                                        <Button
                                                            variant="light"
                                                            color="red"
                                                            size="xs"
                                                            leftSection={<IconTrash size={14} />}
                                                            onClick={() => removeFaq(i)}
                                                        >
                                                            Remover
                                                        </Button>
                                                    </Stack>
                                                </Card>
                                            ))}
                                            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addFaq}>
                                                Adicionar Pergunta
                                            </Button>
                                        </Stack>
                                    </div>
                                </Stack>
                            </Tabs.Panel>

                            <Tabs.Panel value="settings" pt="md">
                                <Stack gap="md">
                                    <TextInput
                                        label="ID do Curso (URL)"
                                        placeholder="Ex: intelligence-a1"
                                        description="Usado na URL: /courses/[id]"
                                        value={course.id}
                                        onChange={(e) => updateField('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    />

                                    <Divider label="Visibilidade" />

                                    <Switch
                                        label="Página Publicada"
                                        description="Quando ativo, a página fica visível publicamente"
                                        checked={course.isPublished}
                                        onChange={(e) => updateField('isPublished', e.currentTarget.checked)}
                                    />
                                    <Switch
                                        label="Mostrar Preços"
                                        description="Exibir mensalidade e taxas na página"
                                        checked={course.showPricing}
                                        onChange={(e) => updateField('showPricing', e.currentTarget.checked)}
                                    />
                                    <Switch
                                        label="Mostrar Disponibilidade"
                                        description="Exibir vagas disponíveis e próxima turma"
                                        checked={course.showAvailability}
                                        onChange={(e) => updateField('showAvailability', e.currentTarget.checked)}
                                    />

                                    <Divider label="Mídia" />

                                    <TextInput
                                        label="URL da Imagem Hero"
                                        placeholder="https://..."
                                        value={course.heroImage || ''}
                                        onChange={(e) => updateField('heroImage', e.target.value)}
                                        leftSection={<IconPhoto size={16} />}
                                    />
                                    <TextInput
                                        label="URL do Vídeo de Apresentação"
                                        placeholder="https://youtube.com/..."
                                        value={course.videoUrl || ''}
                                        onChange={(e) => updateField('videoUrl', e.target.value)}
                                        leftSection={<IconVideo size={16} />}
                                    />
                                </Stack>
                            </Tabs.Panel>
                        </Tabs>
                    </Card>
                </Grid.Col>

                {/* Preview Panel */}
                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card shadow="sm" radius="md" withBorder p="md" style={{ position: 'sticky', top: 80 }}>
                        <Stack gap="md">
                            <Text fw={600}>Preview Rápido</Text>

                            {/* Mini Preview */}
                            <Paper
                                p="md"
                                radius="md"
                                style={{
                                    background: `linear-gradient(135deg, var(--mantine-color-${course.color}-5), var(--mantine-color-${course.color}-7))`,
                                }}
                            >
                                <Stack gap="xs">
                                    <Badge variant="white" color={course.color}>{course.icon} {course.ages || 'Todas idades'}</Badge>
                                    <Text c="white" fw={700} size="lg">{course.name || 'Nome do Curso'}</Text>
                                    <Text c="white" size="sm" style={{ opacity: 0.9 }}>{course.tagline || 'Tagline do curso'}</Text>
                                </Stack>
                            </Paper>

                            <SimpleGrid cols={2} spacing="xs">
                                <Paper p="xs" withBorder radius="sm">
                                    <Text size="xs" c="dimmed">Mensalidade</Text>
                                    <Text size="sm" fw={600}>R$ {course.price}</Text>
                                </Paper>
                                <Paper p="xs" withBorder radius="sm">
                                    <Text size="xs" c="dimmed">Duração</Text>
                                    <Text size="sm" fw={600}>{course.duration}</Text>
                                </Paper>
                                <Paper p="xs" withBorder radius="sm">
                                    <Text size="xs" c="dimmed">Aulas</Text>
                                    <Text size="sm" fw={600}>{course.totalClasses}</Text>
                                </Paper>
                                <Paper p="xs" withBorder radius="sm">
                                    <Text size="xs" c="dimmed">Turma</Text>
                                    <Text size="sm" fw={600}>{course.maxStudents} alunos</Text>
                                </Paper>
                            </SimpleGrid>

                            <Divider />

                            <Stack gap="xs">
                                <Text size="sm" fw={500}>Checklist</Text>
                                {[
                                    { label: 'Nome', ok: !!course.name },
                                    { label: 'Descrição', ok: !!course.description },
                                    { label: 'Preço', ok: course.price > 0 },
                                    { label: 'Módulos', ok: course.modules.length > 0 },
                                    { label: 'Horários', ok: course.schedules.length > 0 },
                                    { label: 'Resultados', ok: course.outcomes.length > 0 },
                                ].map((item, i) => (
                                    <Group key={i} gap="xs">
                                        <ThemeIcon size="xs" color={item.ok ? 'green' : 'gray'} variant="light">
                                            <IconCheck size={10} />
                                        </ThemeIcon>
                                        <Text size="xs" c={item.ok ? undefined : 'dimmed'}>{item.label}</Text>
                                    </Group>
                                ))}
                            </Stack>

                            <Button
                                fullWidth
                                variant="light"
                                leftSection={<IconEye size={16} />}
                                onClick={openPreview}
                            >
                                Ver Preview Completo
                            </Button>

                            {course.id && (
                                <Button
                                    fullWidth
                                    variant="subtle"
                                    leftSection={<IconExternalLink size={16} />}
                                    component="a"
                                    href={`/courses/${course.id}`}
                                    target="_blank"
                                >
                                    Abrir Página
                                </Button>
                            )}
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Full Preview Modal */}
            <Modal
                opened={previewModal}
                onClose={closePreview}
                title="Preview da Landing Page"
                size="90%"
                styles={{ body: { padding: 0 } }}
            >
                <iframe
                    src={course.id ? `/courses/${course.id}` : '/courses/intelligence'}
                    style={{ width: '100%', height: '80vh', border: 'none' }}
                />
            </Modal>
        </Stack>
    );
}

