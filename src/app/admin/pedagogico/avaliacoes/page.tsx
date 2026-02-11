'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Progress,
    Select,
    Loader,
    Alert,
    Center,
    Stack,
    Modal,
    TextInput,
    Textarea,
    NumberInput,
    Collapse,
    Divider,
    Tooltip,
} from '@mantine/core';
import {
    IconClipboardCheck,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconFileText,
    IconUsers,
    IconChartBar,
    IconDownload,
    IconAlertCircle,
    IconSettings,
    IconChevronDown,
    IconChevronUp,
    IconScale,
    IconCategory,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// ---------- types ----------

interface GradingScale {
    id: string;
    name: string;
    description: string | null;
    scaleType: string;
    minValue: number | null;
    maxValue: number | null;
    passingValue: number | null;
    gradeLevels: any[];
    isDefault: boolean;
}

interface AssessmentType {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    category: string;
    format: string;
    defaultWeight: number | null;
    defaultGradingScaleId: string | null;
    usesRubric: boolean;
}

interface Assessment {
    id: string;
    name: string;
    description: string | null;
    classGroupId: string;
    assessmentTypeId: string;
    assessmentTypeName: string | null;
    assessmentTypeCategory: string | null;
    assessmentTypeFormat: string | null;
    scheduledDate: number | null;
    dueDate: number | null;
    maxPoints: number | null;
    weight: number | null;
    status: string;
    totalGrades: number;
    gradedCount: number;
    submittedCount: number;
    createdAt: number;
}

// ---------- helpers ----------

const statusColors: Record<string, string> = {
    draft: 'gray',
    published: 'blue',
    in_progress: 'yellow',
    grading: 'orange',
    completed: 'green',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    published: 'Publicada',
    in_progress: 'Em andamento',
    grading: 'Corrigindo',
    completed: 'Concluída',
};

const categoryLabels: Record<string, string> = {
    formative: 'Formativa',
    summative: 'Somativa',
    diagnostic: 'Diagnóstica',
    self: 'Autoavaliação',
    peer: 'Pares',
    portfolio: 'Portfólio',
    performance: 'Desempenho',
    standardized: 'Padronizada',
};

const formatLabels: Record<string, string> = {
    written_test: 'Prova Escrita',
    oral_test: 'Prova Oral',
    multiple_choice: 'Múltipla Escolha',
    essay: 'Redação',
    presentation: 'Apresentação',
    project: 'Projeto',
    lab_practical: 'Prática',
    portfolio: 'Portfólio',
    observation: 'Observação',
    quiz: 'Quiz',
    homework: 'Tarefa de Casa',
    participation: 'Participação',
    group_work: 'Trabalho em Grupo',
    peer_review: 'Avaliação por Pares',
    self_reflection: 'Autorreflexão',
    other: 'Outro',
};

const scaleTypeLabels: Record<string, string> = {
    numeric: 'Numérica',
    letter: 'Letras (A-F)',
    percentage: 'Porcentagem',
    pass_fail: 'Aprovado/Reprovado',
    competency: 'Competência',
    descriptive: 'Descritiva',
    points: 'Pontos',
};

function formatTs(ts: number | null) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('pt-BR');
}

// ---------- component ----------

export default function AvaliacoesPage() {
    // Grading config
    const {
        data: gradingData,
        isLoading: gradingLoading,
        refetch: refetchGrading,
    } = useApi<{ gradingScales: GradingScale[]; assessmentTypes: AssessmentType[] }>(
        '/api/assessments/grading',
    );

    // Assessments
    const {
        data: assessmentData,
        isLoading: assessmentLoading,
        refetch: refetchAssessments,
    } = useApi<{ assessments: Assessment[] }>('/api/assessments');

    const scales = gradingData?.gradingScales || [];
    const types = gradingData?.assessmentTypes || [];
    const assessments = assessmentData?.assessments || [];

    // UI state
    const [setupOpen, setSetupOpen] = useState(false);
    const [createScaleOpen, createScaleHandlers] = useDisclosure(false);
    const [createTypeOpen, createTypeHandlers] = useDisclosure(false);
    const [createAssessmentOpen, createAssessmentHandlers] = useDisclosure(false);

    // -- Scale form --
    const [scaleName, setScaleName] = useState('');
    const [scaleType, setScaleType] = useState<string | null>('numeric');
    const [scaleMin, setScaleMin] = useState<number | string>(0);
    const [scaleMax, setScaleMax] = useState<number | string>(10);
    const [scalePassing, setScalePassing] = useState<number | string>(6);
    const [creatingScale, setCreatingScale] = useState(false);

    // -- Type form --
    const [typeName, setTypeName] = useState('');
    const [typeCategory, setTypeCategory] = useState<string | null>('summative');
    const [typeFormat, setTypeFormat] = useState<string | null>('written_test');
    const [typeWeight, setTypeWeight] = useState<number | string>('');
    const [typeScaleId, setTypeScaleId] = useState<string | null>(null);
    const [creatingType, setCreatingType] = useState(false);

    // -- Assessment form --
    const [aName, setAName] = useState('');
    const [aTypeId, setATypeId] = useState<string | null>(null);
    const [aClassGroupId, setAClassGroupId] = useState('');
    const [aMaxPoints, setAMaxPoints] = useState<number | string>('');
    const [aWeight, setAWeight] = useState<number | string>('');
    const [aDueDate, setADueDate] = useState('');
    const [creatingAssessment, setCreatingAssessment] = useState(false);

    // Stats
    const totalAssessments = assessments.length;
    const gradedCount = assessments.filter(a => a.status === 'completed').length;
    const pendingGrading = assessments.filter(a => a.status === 'grading').length;
    const avgSubmission = assessments.length > 0
        ? Math.round(assessments.reduce((acc, a) =>
            acc + (a.totalGrades > 0 ? (a.submittedCount / a.totalGrades) * 100 : 0), 0) / assessments.length)
        : 0;

    const hasGradingSetup = scales.length > 0 && types.length > 0;

    // -- handlers --
    const handleCreateScale = async () => {
        if (!scaleName.trim() || !scaleType) return;
        setCreatingScale(true);
        try {
            await fetch('/api/assessments/grading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity: 'grading_scale',
                    name: scaleName,
                    scaleType,
                    minValue: Number(scaleMin),
                    maxValue: Number(scaleMax),
                    passingValue: Number(scalePassing),
                }),
            });
            refetchGrading();
            createScaleHandlers.close();
            setScaleName('');
            notifications.show({ title: 'Criada', message: 'Escala de notas criada', color: 'green' });
        } catch {
            notifications.show({ title: 'Erro', message: 'Erro ao criar escala', color: 'red' });
        } finally {
            setCreatingScale(false);
        }
    };

    const handleCreateType = async () => {
        if (!typeName.trim() || !typeCategory || !typeFormat) return;
        setCreatingType(true);
        try {
            await fetch('/api/assessments/grading', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity: 'assessment_type',
                    name: typeName,
                    category: typeCategory,
                    format: typeFormat,
                    defaultWeight: typeWeight ? Number(typeWeight) : null,
                    defaultGradingScaleId: typeScaleId,
                }),
            });
            refetchGrading();
            createTypeHandlers.close();
            setTypeName('');
            notifications.show({ title: 'Criado', message: 'Tipo de avaliação criado', color: 'green' });
        } catch {
            notifications.show({ title: 'Erro', message: 'Erro ao criar tipo', color: 'red' });
        } finally {
            setCreatingType(false);
        }
    };

    const handleCreateAssessment = async () => {
        if (!aName.trim() || !aTypeId || !aClassGroupId.trim()) return;
        setCreatingAssessment(true);
        try {
            await fetch('/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: aName,
                    assessmentTypeId: aTypeId,
                    classGroupId: aClassGroupId,
                    maxPoints: aMaxPoints ? Number(aMaxPoints) : null,
                    weight: aWeight ? Number(aWeight) : null,
                    dueDate: aDueDate ? new Date(aDueDate).getTime() : null,
                }),
            });
            refetchAssessments();
            createAssessmentHandlers.close();
            setAName('');
            setATypeId(null);
            setAClassGroupId('');
            setAMaxPoints('');
            setAWeight('');
            setADueDate('');
            notifications.show({ title: 'Criada', message: 'Avaliação criada com sucesso', color: 'green' });
        } catch {
            notifications.show({ title: 'Erro', message: 'Erro ao criar avaliação', color: 'red' });
        } finally {
            setCreatingAssessment(false);
        }
    };

    // -- loading --
    if (gradingLoading || assessmentLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Pedagógico</Text>
                    <Title order={2}>Avaliações</Title>
                </div>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconSettings size={16} />}
                        rightSection={setupOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        onClick={() => setSetupOpen(!setupOpen)}
                    >
                        Configurar Avaliações
                    </Button>
                    <Tooltip label={!hasGradingSetup ? 'Configure escalas e tipos primeiro' : ''} disabled={hasGradingSetup}>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={createAssessmentHandlers.open}
                            disabled={!hasGradingSetup}
                        >
                            Nova Avaliação
                        </Button>
                    </Tooltip>
                </Group>
            </Group>

            {/* Grading Setup Warning */}
            {!hasGradingSetup && (
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    title="Configuração necessária"
                    color="yellow"
                    mb="xl"
                >
                    Antes de criar avaliações, configure ao menos uma <strong>Escala de Notas</strong> e um <strong>Tipo de Avaliação</strong>.
                    Clique em &quot;Configurar Avaliações&quot; acima.
                </Alert>
            )}

            {/* Grading Setup Panel */}
            <Collapse in={setupOpen}>
                <Card withBorder mb="xl" bg="var(--mantine-color-dark-7)">
                    <Title order={4} mb="md">
                        <Group gap="xs">
                            <IconSettings size={18} />
                            Configuração de Avaliações
                        </Group>
                    </Title>

                    <SimpleGrid cols={{ base: 1, md: 2 }} mb="md">
                        {/* Grading Scales */}
                        <Card withBorder>
                            <Group justify="space-between" mb="sm">
                                <Group gap="xs">
                                    <IconScale size={16} />
                                    <Text fw={600} size="sm">Escalas de Notas</Text>
                                    <Badge size="xs" variant="light">{scales.length}</Badge>
                                </Group>
                                <Button size="xs" variant="light" leftSection={<IconPlus size={12} />} onClick={createScaleHandlers.open}>
                                    Nova
                                </Button>
                            </Group>
                            {scales.length === 0 ? (
                                <Text size="sm" c="dimmed">Nenhuma escala configurada</Text>
                            ) : (
                                <Stack gap="xs">
                                    {scales.map(s => (
                                        <Group key={s.id} justify="space-between" p="xs" style={{ borderRadius: 6, background: 'var(--mantine-color-dark-6)' }}>
                                            <div>
                                                <Text size="sm" fw={500}>{s.name}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {scaleTypeLabels[s.scaleType] || s.scaleType}
                                                    {s.minValue !== null && s.maxValue !== null
                                                        ? ` • ${s.minValue}–${s.maxValue} (mín. ${s.passingValue})`
                                                        : ''}
                                                </Text>
                                            </div>
                                            {s.isDefault && <Badge size="xs" color="green">Padrão</Badge>}
                                        </Group>
                                    ))}
                                </Stack>
                            )}
                        </Card>

                        {/* Assessment Types */}
                        <Card withBorder>
                            <Group justify="space-between" mb="sm">
                                <Group gap="xs">
                                    <IconCategory size={16} />
                                    <Text fw={600} size="sm">Tipos de Avaliação</Text>
                                    <Badge size="xs" variant="light">{types.length}</Badge>
                                </Group>
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconPlus size={12} />}
                                    onClick={createTypeHandlers.open}
                                    disabled={scales.length === 0}
                                >
                                    Novo
                                </Button>
                            </Group>
                            {types.length === 0 ? (
                                <Text size="sm" c="dimmed">
                                    {scales.length === 0 ? 'Crie uma escala primeiro' : 'Nenhum tipo configurado'}
                                </Text>
                            ) : (
                                <Stack gap="xs">
                                    {types.map(t => (
                                        <Group key={t.id} justify="space-between" p="xs" style={{ borderRadius: 6, background: 'var(--mantine-color-dark-6)' }}>
                                            <div>
                                                <Text size="sm" fw={500}>{t.name}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {categoryLabels[t.category] || t.category} • {formatLabels[t.format] || t.format}
                                                    {t.defaultWeight ? ` • Peso: ${t.defaultWeight}%` : ''}
                                                </Text>
                                            </div>
                                            {t.usesRubric && <Badge size="xs" color="grape">Rubrica</Badge>}
                                        </Group>
                                    ))}
                                </Stack>
                            )}
                        </Card>
                    </SimpleGrid>
                </Card>
            </Collapse>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconClipboardCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total de Avaliações</Text>
                            <Text fw={700} size="xl">{totalAssessments}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídas</Text>
                            <Text fw={700} size="xl">{gradedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="yellow" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Aguardando Correção</Text>
                            <Text fw={700} size="xl">{pendingGrading}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tx. Entrega Média</Text>
                            <Text fw={700} size="xl">{avgSubmission}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Assessments Table */}
            <Card withBorder>
                <Title order={4} mb="md">Todas as Avaliações</Title>

                {assessments.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconClipboardCheck size={48} color="gray" />
                            <Text c="dimmed">
                                {hasGradingSetup
                                    ? 'Nenhuma avaliação criada ainda'
                                    : 'Configure escalas e tipos para começar'}
                            </Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Avaliação</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Peso</Table.Th>
                                <Table.Th>Entregas</Table.Th>
                                <Table.Th>Notas</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {assessments.map((a) => {
                                const submissionRate = a.totalGrades > 0
                                    ? (a.submittedCount / a.totalGrades) * 100
                                    : 0;
                                return (
                                    <Table.Tr key={a.id}>
                                        <Table.Td>
                                            <div>
                                                <Text fw={500}>{a.name}</Text>
                                                {a.dueDate && (
                                                    <Text size="xs" c="dimmed">Entrega: {formatTs(a.dueDate)}</Text>
                                                )}
                                            </div>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color="blue">
                                                {a.assessmentTypeName || '-'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{a.classGroupId.slice(0, 8)}...</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {a.weight ? (
                                                <Badge variant="outline">{a.weight}%</Badge>
                                            ) : (
                                                <Text size="sm" c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Progress
                                                    value={submissionRate}
                                                    size="sm"
                                                    w={50}
                                                    color={submissionRate === 100 ? 'green' : 'blue'}
                                                />
                                                <Text size="sm">{a.submittedCount}/{a.totalGrades}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">
                                                {a.gradedCount}/{a.totalGrades} corrigidas
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={statusColors[a.status] || 'gray'} variant="light">
                                                {statusLabels[a.status] || a.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu position="bottom-end" withArrow>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" color="gray" size="sm">
                                                        <IconDotsVertical size={14} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<IconEye size={14} />}>Ver Resultados</Menu.Item>
                                                    <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                    <Menu.Item leftSection={<IconChartBar size={14} />}>Estatísticas</Menu.Item>
                                                    <Menu.Item leftSection={<IconDownload size={14} />}>Exportar Notas</Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Create Grading Scale Modal */}
            <Modal opened={createScaleOpen} onClose={createScaleHandlers.close} title="Nova Escala de Notas" size="md">
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Escala 0-10"
                        value={scaleName}
                        onChange={(e) => setScaleName(e.currentTarget.value)}
                        required
                    />
                    <Select
                        label="Tipo de Escala"
                        data={Object.entries(scaleTypeLabels).map(([v, l]) => ({ value: v, label: l }))}
                        value={scaleType}
                        onChange={setScaleType}
                        required
                    />
                    <Group grow>
                        <NumberInput
                            label="Mínimo"
                            value={scaleMin}
                            onChange={setScaleMin}
                        />
                        <NumberInput
                            label="Máximo"
                            value={scaleMax}
                            onChange={setScaleMax}
                        />
                        <NumberInput
                            label="Aprovação"
                            value={scalePassing}
                            onChange={setScalePassing}
                        />
                    </Group>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={createScaleHandlers.close}>Cancelar</Button>
                        <Button onClick={handleCreateScale} loading={creatingScale} disabled={!scaleName.trim()}>
                            Criar Escala
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Create Assessment Type Modal */}
            <Modal opened={createTypeOpen} onClose={createTypeHandlers.close} title="Novo Tipo de Avaliação" size="md">
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Prova Bimestral"
                        value={typeName}
                        onChange={(e) => setTypeName(e.currentTarget.value)}
                        required
                    />
                    <Group grow>
                        <Select
                            label="Categoria"
                            data={Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))}
                            value={typeCategory}
                            onChange={setTypeCategory}
                            required
                        />
                        <Select
                            label="Formato"
                            data={Object.entries(formatLabels).map(([v, l]) => ({ value: v, label: l }))}
                            value={typeFormat}
                            onChange={setTypeFormat}
                            required
                        />
                    </Group>
                    <Group grow>
                        <NumberInput
                            label="Peso Padrão (%)"
                            placeholder="Ex: 30"
                            value={typeWeight}
                            onChange={setTypeWeight}
                        />
                        <Select
                            label="Escala de Notas"
                            placeholder="Selecionar escala"
                            data={scales.map(s => ({ value: s.id, label: s.name }))}
                            value={typeScaleId}
                            onChange={setTypeScaleId}
                            clearable
                        />
                    </Group>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={createTypeHandlers.close}>Cancelar</Button>
                        <Button onClick={handleCreateType} loading={creatingType} disabled={!typeName.trim()}>
                            Criar Tipo
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Create Assessment Modal */}
            <Modal opened={createAssessmentOpen} onClose={createAssessmentHandlers.close} title="Nova Avaliação" size="md">
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Prova Mensal - Março"
                        value={aName}
                        onChange={(e) => setAName(e.currentTarget.value)}
                        required
                    />
                    <Select
                        label="Tipo de Avaliação"
                        placeholder="Selecionar tipo"
                        data={types.map(t => ({ value: t.id, label: `${t.name} (${categoryLabels[t.category] || t.category})` }))}
                        value={aTypeId}
                        onChange={setATypeId}
                        required
                    />
                    <TextInput
                        label="ID da Turma"
                        placeholder="Ex: turma-a-2026"
                        value={aClassGroupId}
                        onChange={(e) => setAClassGroupId(e.currentTarget.value)}
                        required
                    />
                    <Group grow>
                        <NumberInput
                            label="Nota Máxima"
                            placeholder="Ex: 100"
                            value={aMaxPoints}
                            onChange={setAMaxPoints}
                        />
                        <NumberInput
                            label="Peso (%)"
                            placeholder="Ex: 30"
                            value={aWeight}
                            onChange={setAWeight}
                        />
                        <TextInput
                            label="Data de Entrega"
                            type="date"
                            value={aDueDate}
                            onChange={(e) => setADueDate(e.currentTarget.value)}
                        />
                    </Group>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={createAssessmentHandlers.close}>Cancelar</Button>
                        <Button
                            onClick={handleCreateAssessment}
                            loading={creatingAssessment}
                            disabled={!aName.trim() || !aTypeId || !aClassGroupId.trim()}
                        >
                            Criar Avaliação
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
}
