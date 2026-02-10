'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group,
    ThemeIcon, Button, Table, Loader, Alert, Center, Tabs,
    Modal, TextInput, Textarea, Select, NumberInput, Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconBook, IconPlus, IconUsers, IconAlertCircle,
    IconSchool, IconClock, IconCoin, IconMapPin, IconUpload, IconSparkles,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Course {
    id: string;
    title: string;
    description: string | null;
    isPublished: number;
    isPublic: number;
    language: string;
    createdAt: number;
}

interface SchoolProgram {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    methodologyId: string | null;
    durationWeeks: number | null;
    classesPerWeek: number | null;
    hoursPerClass: number | null;
    totalHours: number | null;
    targetAudienceType: string | null;
    modality: string | null;
    basePriceCents: number | null;
    status: string;
    createdAt: number;
}

// ============================================================================
// CONFIG
// ============================================================================

const AUDIENCE_TYPES = [
    { value: 'children', label: 'Crianças' },
    { value: 'teens', label: 'Adolescentes' },
    { value: 'adults', label: 'Adultos' },
    { value: 'seniors', label: 'Terceira Idade' },
    { value: 'corporate', label: 'Corporativo' },
    { value: 'all', label: 'Todos' },
];

const MODALITIES = [
    { value: 'in_person', label: 'Presencial' },
    { value: 'online', label: 'Online' },
    { value: 'hybrid', label: 'Híbrido' },
];

const STATUS_TYPES = [
    { value: 'draft', label: 'Rascunho', color: 'gray' },
    { value: 'active', label: 'Ativo', color: 'green' },
    { value: 'archived', label: 'Arquivado', color: 'orange' },
    { value: 'discontinued', label: 'Descontinuado', color: 'red' },
];

// ============================================================================
// HELPERS
// ============================================================================

function parseTitle(title: string | null): string {
    if (!title) return '-';
    try {
        const parsed = JSON.parse(title);
        return parsed['pt-BR'] || parsed.en || Object.values(parsed)[0] || '-';
    } catch {
        return title;
    }
}

function formatCurrency(cents: number | null): string {
    if (!cents) return '-';
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CursosPage() {
    const { data: courses, isLoading: loadingCourses, error: coursesError, refetch: refetchCourses } = useApi<Course[]>('/api/courses');
    const { data: programsData, isLoading: loadingPrograms, refetch: refetchPrograms } = useApi<any>('/api/school-programs');
    const { data: methodsData } = useApi<any>('/api/methodologies');

    const [activeTab, setActiveTab] = useState<string | null>('programs');
    const [createModalOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
    const [saving, setSaving] = useState(false);

    // Import state
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState('');
    const [importResult, setImportResult] = useState<any>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formCode, setFormCode] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formMethodology, setFormMethodology] = useState<string | null>(null);
    const [formAudience, setFormAudience] = useState<string | null>('all');
    const [formModality, setFormModality] = useState<string | null>('in_person');
    const [formDuration, setFormDuration] = useState<number | ''>(24);
    const [formClassesPerWeek, setFormClassesPerWeek] = useState<number | ''>(2);
    const [formHoursPerClass, setFormHoursPerClass] = useState<number | ''>(1.5);
    const [formPrice, setFormPrice] = useState<number | ''>(450);

    const programs: SchoolProgram[] = programsData?.data || [];
    const methodologies = methodsData?.data || [];

    const stats = {
        totalCourses: courses?.length || 0,
        publishedCourses: courses?.filter(c => c.isPublished === 1).length || 0,
        totalPrograms: programs.length,
        activePrograms: programs.filter((p: any) => p.status === 'active').length,
    };

    const saveProgram = async () => {
        setSaving(true);
        try {
            await fetch('/api/school-programs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    code: formCode,
                    description: formDescription,
                    methodologyId: formMethodology,
                    targetAudienceType: formAudience,
                    modality: formModality,
                    durationWeeks: formDuration || undefined,
                    classesPerWeek: formClassesPerWeek || undefined,
                    hoursPerClass: formHoursPerClass || undefined,
                    totalHours: formDuration && formClassesPerWeek && formHoursPerClass
                        ? Math.round(Number(formDuration) * Number(formClassesPerWeek) * Number(formHoursPerClass))
                        : undefined,
                    basePriceCents: formPrice ? Math.round(Number(formPrice) * 100) : undefined,
                }),
            });
            refetchPrograms();
            setFormName(''); setFormCode(''); setFormDescription('');
            closeCreate();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const importPrograms = async () => {
        setSaving(true);
        setImportError('');
        setImportResult(null);
        try {
            const parsed = JSON.parse(importJson);
            const res = await fetch('/api/school-programs/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');
            setImportResult(data.summary);
            refetchPrograms();
            setImportJson('');
            setTimeout(() => closeImport(), 2000);
        } catch (e: any) {
            setImportError(e.message || 'JSON inválido');
        }
        setSaving(false);
    };

    if (loadingCourses && loadingPrograms) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (coursesError) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {coursesError}
                <Button size="xs" variant="light" ml="md" onClick={refetchCourses}>Tentar novamente</Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Pedagógico</Text>
                    <Title order={2}>Cursos & Programas</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Gerencie cursos existentes e crie programas acadêmicos estruturados
                    </Text>
                </div>
                <Group gap="xs">
                    <Button variant="light" leftSection={<IconUpload size={16} />} color="cyan" onClick={openImport}>
                        Importar JSON
                    </Button>
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                        Novo Programa
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Cursos</Text>
                            <Text fw={700} size="lg">{stats.totalCourses}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Publicados</Text>
                            <Text fw={700} size="lg">{stats.publishedCourses}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Programas</Text>
                            <Text fw={700} size="lg">{stats.totalPrograms}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Programas Ativos</Text>
                            <Text fw={700} size="lg">{stats.activePrograms}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="programs" leftSection={<IconSchool size={14} />}>
                        Programas Acadêmicos
                    </Tabs.Tab>
                    <Tabs.Tab value="courses" leftSection={<IconBook size={14} />}>
                        Cursos (Legado)
                    </Tabs.Tab>
                </Tabs.List>

                {/* Programs Tab */}
                <Tabs.Panel value="programs" pt="lg">
                    {loadingPrograms ? (
                        <Center h={200}><Loader size="lg" /></Center>
                    ) : programs.length > 0 ? (
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            {programs.map((p: SchoolProgram) => {
                                const status = STATUS_TYPES.find(s => s.value === p.status);
                                const methodology = methodologies.find((m: any) => m.id === p.methodologyId);
                                return (
                                    <Card key={p.id} withBorder p="lg">
                                        <Group justify="space-between" mb="sm">
                                            <div>
                                                <Text fw={600} size="lg">{p.name}</Text>
                                                {p.code && <Text size="xs" c="dimmed">Código: {p.code}</Text>}
                                            </div>
                                            <Badge color={status?.color || 'gray'}>
                                                {status?.label || p.status}
                                            </Badge>
                                        </Group>

                                        {p.description && (
                                            <Text size="sm" c="dimmed" lineClamp={2} mb="sm">{p.description}</Text>
                                        )}

                                        <Divider my="xs" />

                                        <SimpleGrid cols={2} spacing="xs">
                                            {methodology && (
                                                <Group gap="xs">
                                                    <IconBook size={14} color="gray" />
                                                    <Text size="xs">{methodology.name}</Text>
                                                </Group>
                                            )}
                                            {p.targetAudienceType && (
                                                <Group gap="xs">
                                                    <IconUsers size={14} color="gray" />
                                                    <Text size="xs">
                                                        {AUDIENCE_TYPES.find(a => a.value === p.targetAudienceType)?.label}
                                                    </Text>
                                                </Group>
                                            )}
                                            {p.durationWeeks && (
                                                <Group gap="xs">
                                                    <IconClock size={14} color="gray" />
                                                    <Text size="xs">{p.durationWeeks} semanas</Text>
                                                </Group>
                                            )}
                                            {p.modality && (
                                                <Group gap="xs">
                                                    <IconMapPin size={14} color="gray" />
                                                    <Text size="xs">
                                                        {MODALITIES.find(m => m.value === p.modality)?.label}
                                                    </Text>
                                                </Group>
                                            )}
                                            {p.totalHours && (
                                                <Group gap="xs">
                                                    <IconClock size={14} color="gray" />
                                                    <Text size="xs">{p.totalHours}h carga horária</Text>
                                                </Group>
                                            )}
                                            {p.basePriceCents && (
                                                <Group gap="xs">
                                                    <IconCoin size={14} color="gray" />
                                                    <Text size="xs">{formatCurrency(p.basePriceCents)}</Text>
                                                </Group>
                                            )}
                                        </SimpleGrid>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    ) : (
                        <Center py="xl">
                            <Stack align="center" gap="xs">
                                <IconSchool size={48} color="gray" />
                                <Text c="dimmed">Nenhum programa acadêmico criado</Text>
                                <Text size="xs" c="dimmed">
                                    Programas estruturam como seus cursos funcionam —
                                    defina metodologia, duração, público e preço.
                                </Text>
                                <Button size="xs" onClick={openCreate}>Criar primeiro programa</Button>
                            </Stack>
                        </Center>
                    )}
                </Tabs.Panel>

                {/* Legacy Courses Tab */}
                <Tabs.Panel value="courses" pt="lg">
                    <Card withBorder p="md">
                        {courses && courses.length > 0 ? (
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Curso</Table.Th>
                                        <Table.Th>Idioma</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {courses.map((course) => (
                                        <Table.Tr key={course.id}>
                                            <Table.Td>
                                                <Text fw={500}>{parseTitle(course.title)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge variant="outline" size="sm">{course.language}</Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={course.isPublished === 1 ? 'green' : 'gray'}
                                                    variant="light"
                                                >
                                                    {course.isPublished === 1 ? 'Publicado' : 'Rascunho'}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <IconBook size={48} color="gray" />
                                    <Text c="dimmed">Nenhum curso encontrado</Text>
                                </Stack>
                            </Center>
                        )}
                    </Card>
                </Tabs.Panel>
            </Tabs>

            {/* Create Program Modal */}
            <Modal opened={createModalOpened} onClose={closeCreate} title="Novo Programa Acadêmico" size="lg">
                <Stack gap="md">
                    <TextInput label="Nome do Programa" placeholder="Ex: English for Adults - Intermediate"
                        value={formName} onChange={e => setFormName(e.target.value)} required />

                    <Group grow>
                        <TextInput label="Código" placeholder="Ex: ENG-ADT-INT"
                            value={formCode} onChange={e => setFormCode(e.target.value)} />
                        <Select label="Metodologia" placeholder="Selecione..."
                            data={methodologies.map((m: any) => ({ value: m.id, label: m.name }))}
                            value={formMethodology} onChange={setFormMethodology} clearable />
                    </Group>

                    <Textarea label="Descrição" placeholder="Descreva o programa..."
                        value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />

                    <Divider label="Estrutura" labelPosition="center" />

                    <Group grow>
                        <Select label="Público-Alvo" data={AUDIENCE_TYPES}
                            value={formAudience} onChange={setFormAudience} />
                        <Select label="Modalidade" data={MODALITIES}
                            value={formModality} onChange={setFormModality} />
                    </Group>

                    <Group grow>
                        <NumberInput label="Duração (semanas)" value={formDuration}
                            onChange={v => setFormDuration(v as number)} min={1} max={104} />
                        <NumberInput label="Aulas/Semana" value={formClassesPerWeek}
                            onChange={v => setFormClassesPerWeek(v as number)} min={1} max={7} />
                        <NumberInput label="Horas/Aula" value={formHoursPerClass}
                            onChange={v => setFormHoursPerClass(v as number)} min={0.5} max={8} step={0.5} decimalScale={1} />
                    </Group>

                    {formDuration && formClassesPerWeek && formHoursPerClass && (
                        <Alert variant="light" color="blue" p="xs">
                            <Text size="xs">
                                Carga horária total: <strong>
                                    {Math.round(Number(formDuration) * Number(formClassesPerWeek) * Number(formHoursPerClass))}h
                                </strong>
                            </Text>
                        </Alert>
                    )}

                    <Divider label="Preço" labelPosition="center" />

                    <NumberInput label="Mensalidade base (R$)" value={formPrice}
                        onChange={v => setFormPrice(v as number)} min={0} prefix="R$ " decimalScale={2} />

                    <Button onClick={saveProgram} loading={saving} disabled={!formName}
                        size="md" fullWidth>
                        Criar Programa
                    </Button>
                </Stack>
            </Modal>

            {/* Import Programs Modal */}
            <Modal opened={importOpened} onClose={closeImport} title="Importar Programas via JSON" size="lg">
                <Stack gap="md">
                    <Alert variant="light" color="cyan" icon={<IconSparkles size={20} />}>
                        <Text size="sm">
                            Cole o JSON gerado pela IA. Formato: array de objetos com
                            <strong> name</strong>, <strong>code</strong>, <strong>description</strong>,
                            <strong> durationWeeks</strong>, <strong>classesPerWeek</strong>,
                            <strong> hoursPerClass</strong>, <strong>targetAudienceType</strong>,
                            <strong> modality</strong>, <strong>basePriceCents</strong>.
                            Inclua <strong>units[]</strong> para criar unidades automaticamente.
                        </Text>
                    </Alert>

                    <Textarea
                        label="JSON"
                        placeholder={'[\n  {\n    "name": "English for Adults - B1",\n    "code": "ENG-ADT-B1",\n    "durationWeeks": 24,\n    "classesPerWeek": 2,\n    "hoursPerClass": 1.5,\n    "targetAudienceType": "adults",\n    "units": [\n      { "name": "Unit 1 - Introductions", "estimatedHours": 6 }\n    ]\n  }\n]'}
                        value={importJson}
                        onChange={e => setImportJson(e.target.value)}
                        rows={12}
                        autosize
                        minRows={8}
                        maxRows={20}
                        styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
                    />

                    {importError && (
                        <Alert color="red" p="xs">
                            <Text size="xs">{importError}</Text>
                        </Alert>
                    )}

                    {importResult && (
                        <Alert color="green" p="xs">
                            <Text size="xs">
                                ✅ {importResult.programsCreated} programa(s) criado(s),
                                {' '}{importResult.unitsCreated} unidade(s) criada(s)
                            </Text>
                        </Alert>
                    )}

                    <Button onClick={importPrograms} loading={saving} disabled={!importJson}
                        color="cyan" leftSection={<IconUpload size={16} />}>
                        Importar Programas
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
