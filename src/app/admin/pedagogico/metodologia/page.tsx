'use client';

import { useState } from 'react';
import {
    Title, Text, Card, Stack, Group, Button, Badge, Tabs,
    ThemeIcon, Paper, SimpleGrid, TextInput, Textarea, Select,
    NumberInput, Switch, ActionIcon, Alert, Modal, Slider,
    Loader, Center, Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconBook, IconPlus, IconClock, IconUsers, IconClipboardCheck,
    IconGripVertical, IconTrash, IconEdit, IconChevronUp, IconChevronDown,
    IconSparkles, IconUserShare, IconSchool, IconDownload,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Phase {
    name: string;
    durationMinutes: number;
    description: string;
}

// ============================================================================
// PREDEFINED APPROACHES
// ============================================================================

const APPROACHES = [
    { value: 'tbl', label: 'TBL — Task-Based Learning' },
    { value: 'pbl', label: 'PBL — Project-Based Learning' },
    { value: 'ibl', label: 'IBL — Inquiry-Based Learning' },
    { value: 'cbl', label: 'CBL — Competency-Based Learning' },
    { value: 'communicative', label: 'Abordagem Comunicativa' },
    { value: 'direct_method', label: 'Método Direto' },
    { value: 'audio_lingual', label: 'Audiolingual' },
    { value: 'grammar_translation', label: 'Gramática-Tradução' },
    { value: 'total_physical', label: 'Total Physical Response' },
    { value: 'suggestopedia', label: 'Sugestopédia' },
    { value: 'silent_way', label: 'Silent Way' },
    { value: 'blended', label: 'Blended Learning' },
    { value: 'flipped', label: 'Flipped Classroom' },
    { value: 'montessori', label: 'Montessori' },
    { value: 'waldorf', label: 'Waldorf / Steiner' },
    { value: 'reggio_emilia', label: 'Reggio Emilia' },
    { value: 'custom', label: 'Personalizado' },
    { value: 'hybrid', label: 'Híbrido (múltiplas abordagens)' },
];

const GROUPING_TYPES = [
    { value: 'whole_class', label: 'Turma Inteira' },
    { value: 'pairs', label: 'Duplas' },
    { value: 'small_groups', label: 'Pequenos Grupos' },
    { value: 'individual', label: 'Individual' },
    { value: 'mixed', label: 'Misto' },
];

const POLICY_TYPES = [
    { value: 'required', label: 'Obrigatório' },
    { value: 'optional', label: 'Opcional (recomendado)' },
    { value: 'none', label: 'Sem dever de casa' },
    { value: 'self_paced', label: 'Ritmo do aluno' },
    { value: 'flipped', label: 'Flipped (preparação pré-aula)' },
];

const FREQUENCY_TYPES = [
    { value: 'after_every_class', label: 'Após cada aula' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'bi_weekly', label: 'Quinzenal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'per_unit', label: 'Por unidade' },
    { value: 'as_needed', label: 'Conforme necessidade' },
];

const DEFAULT_PHASES: Phase[] = [
    { name: 'Warm-up', durationMinutes: 5, description: 'Engajar alunos e ativar conhecimento prévio' },
    { name: 'Apresentação', durationMinutes: 15, description: 'Introduzir conteúdo novo' },
    { name: 'Prática Guiada', durationMinutes: 20, description: 'Prática controlada com suporte' },
    { name: 'Produção', durationMinutes: 8, description: 'Prática livre / output' },
    { name: 'Wrap-up', durationMinutes: 2, description: 'Revisão e preview da próxima aula' },
];

// ============================================================================
// PAGE
// ============================================================================

export default function MethodologyBuilderPage() {
    const { data: methodologiesData, isLoading: loadingMethods, refetch: refetchMethods } = useApi<any>('/api/methodologies');
    const { data: structuresData, isLoading: loadingStructures, refetch: refetchStructures } = useApi<any>('/api/class-structures');
    const { data: policiesData, isLoading: loadingPolicies, refetch: refetchPolicies } = useApi<any>('/api/homework-policies');

    const [activeTab, setActiveTab] = useState<string | null>('approach');
    const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);

    // -- Approach form state --
    const [formName, setFormName] = useState('');
    const [formCode, setFormCode] = useState('');
    const [formApproach, setFormApproach] = useState<string | null>('custom');
    const [formDescription, setFormDescription] = useState('');
    const [formPhilosophy, setFormPhilosophy] = useState('');

    // -- Structure form state --
    const [structureName, setStructureName] = useState('');
    const [structureDescription, setStructureDescription] = useState('');
    const [structureDuration, setStructureDuration] = useState<number>(50);
    const [structurePhases, setStructurePhases] = useState<Phase[]>([...DEFAULT_PHASES]);
    const [structureTTT, setStructureTTT] = useState(30);
    const [structureGrouping, setStructureGrouping] = useState<string | null>('mixed');
    const [structureMaxStudents, setStructureMaxStudents] = useState<number | ''>(15);

    // -- Policy form state --
    const [policyName, setPolicyName] = useState('');
    const [policyType, setPolicyType] = useState<string | null>('optional');
    const [policyFrequency, setPolicyFrequency] = useState<string | null>('weekly');
    const [policyExpectedTime, setPolicyExpectedTime] = useState<number | ''>(30);
    const [policyGradeWeight, setPolicyGradeWeight] = useState<number>(10);
    const [policyAllowLate, setPolicyAllowLate] = useState(true);
    const [policyLatePenalty, setPolicyLatePenalty] = useState<number | ''>(5);
    const [policyMaxLateDays, setPolicyMaxLateDays] = useState<number | ''>(3);

    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);

    const methodologies = methodologiesData?.data || [];
    const structures = structuresData?.data || [];
    const policies = policiesData?.data || [];

    // -- Phase manipulation --
    const addPhase = () => {
        setStructurePhases([...structurePhases, { name: 'Nova Fase', durationMinutes: 5, description: '' }]);
    };

    const removePhase = (idx: number) => {
        setStructurePhases(structurePhases.filter((_, i) => i !== idx));
    };

    const updatePhase = (idx: number, field: keyof Phase, value: string | number) => {
        const updated = [...structurePhases];
        (updated[idx] as any)[field] = value;
        setStructurePhases(updated);
    };

    const movePhase = (idx: number, direction: 'up' | 'down') => {
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= structurePhases.length) return;
        const updated = [...structurePhases];
        [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
        setStructurePhases(updated);
    };

    const totalPhaseDuration = structurePhases.reduce((sum, p) => sum + p.durationMinutes, 0);

    // -- Save functions --
    const saveMethodology = async () => {
        setSaving(true);
        try {
            await fetch('/api/methodologies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formName,
                    code: formCode,
                    coreApproach: formApproach,
                    description: formDescription,
                    philosophyStatement: formPhilosophy,
                }),
            });
            refetchMethods();
            setFormName(''); setFormCode(''); setFormDescription(''); setFormPhilosophy('');
            closeCreateModal();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const saveStructure = async () => {
        setSaving(true);
        try {
            await fetch('/api/class-structures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: structureName,
                    description: structureDescription,
                    durationMinutes: structureDuration,
                    phases: structurePhases,
                    teacherTalkTimePercent: structureTTT,
                    studentTalkTimePercent: 100 - structureTTT,
                    defaultGroupingType: structureGrouping,
                    maxStudentsRecommended: structureMaxStudents || undefined,
                }),
            });
            refetchStructures();
            setStructureName(''); setStructureDescription('');
            setStructurePhases([...DEFAULT_PHASES]);
            closeCreateModal();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const savePolicy = async () => {
        setSaving(true);
        try {
            await fetch('/api/homework-policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: policyName,
                    policyType: policyType,
                    frequencyType: policyFrequency,
                    expectedTimeMinutes: policyExpectedTime || undefined,
                    gradeWeightPercent: policyGradeWeight,
                    allowsLateSubmission: policyAllowLate,
                    latePenaltyPerDay: policyLatePenalty || undefined,
                    maxLateDays: policyMaxLateDays || undefined,
                }),
            });
            refetchPolicies();
            setPolicyName('');
            closeCreateModal();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    // -- Export JSON Schema for AI --
    const exportJsonSchema = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/methodologies/export');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `methodology-schema-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) { console.error(e); }
        setExporting(false);
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Pedagógico</Text>
                    <Title order={2}>Construtor de Metodologia</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Configure como o ensino acontece na sua escola — abordagem, fases da aula, tarefas e avaliação
                    </Text>
                </div>
                <Group gap="xs">
                    <Button variant="light" leftSection={<IconDownload size={16} />} color="teal"
                        onClick={exportJsonSchema} loading={exporting}
                        disabled={methodologies.length === 0 && structures.length === 0 && policies.length === 0}>
                        Exportar JSON para IA
                    </Button>
                    <Button variant="light" leftSection={<IconUserShare size={16} />} color="gray">
                        Delegar a Coordenador
                    </Button>
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
                        Novo
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Abordagens</Text>
                            <Text fw={700} size="xl">
                                {loadingMethods ? <Loader size="sm" /> : methodologies.length}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Estruturas de Aula</Text>
                            <Text fw={700} size="xl">
                                {loadingStructures ? <Loader size="sm" /> : structures.length}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg" radius="md">
                            <IconClipboardCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Políticas de Tarefa</Text>
                            <Text fw={700} size="xl">
                                {loadingPolicies ? <Loader size="sm" /> : policies.length}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="approach" leftSection={<IconBook size={14} />}>
                        Abordagem
                    </Tabs.Tab>
                    <Tabs.Tab value="structure" leftSection={<IconClock size={14} />}>
                        Estrutura da Aula
                    </Tabs.Tab>
                    <Tabs.Tab value="homework" leftSection={<IconClipboardCheck size={14} />}>
                        Tarefa de Casa
                    </Tabs.Tab>
                </Tabs.List>

                {/* ============================================================ */}
                {/* TAB 1: APPROACH */}
                {/* ============================================================ */}
                <Tabs.Panel value="approach" pt="lg">
                    <Stack gap="md">
                        <Alert variant="light" color="violet" icon={<IconSparkles size={20} />}>
                            <Text size="sm">
                                Defina a abordagem pedagógica da sua escola. Escolha uma predefinida ou crie do zero —
                                cada programa pode usar uma abordagem diferente.
                            </Text>
                        </Alert>

                        {loadingMethods ? (
                            <Center h={200}><Loader size="lg" /></Center>
                        ) : methodologies.length > 0 ? (
                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                {methodologies.map((m: any) => (
                                    <Card key={m.id} withBorder p="md">
                                        <Group justify="space-between" mb="sm">
                                            <Group gap="sm">
                                                <ThemeIcon color="violet" size="lg" radius="md">
                                                    <IconBook size={20} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={600}>{m.name}</Text>
                                                    <Text size="xs" c="dimmed">{m.code || m.coreApproach}</Text>
                                                </div>
                                            </Group>
                                            <Group gap="xs">
                                                {m.isDefault && <Badge size="xs" color="violet">Padrão</Badge>}
                                                <Badge color={m.isActive ? 'green' : 'gray'} size="xs">
                                                    {m.isActive ? 'Ativa' : 'Inativa'}
                                                </Badge>
                                            </Group>
                                        </Group>
                                        {m.description && <Text size="sm" c="dimmed" lineClamp={2}>{m.description}</Text>}
                                        <Group mt="sm">
                                            <Badge size="xs" variant="light">
                                                {APPROACHES.find(a => a.value === m.coreApproach)?.label || m.coreApproach}
                                            </Badge>
                                        </Group>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <IconBook size={48} color="gray" />
                                    <Text c="dimmed">Nenhuma abordagem configurada</Text>
                                    <Button size="xs" onClick={openCreateModal}>Criar primeira abordagem</Button>
                                </Stack>
                            </Center>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* ============================================================ */}
                {/* TAB 2: CLASS STRUCTURE */}
                {/* ============================================================ */}
                <Tabs.Panel value="structure" pt="lg">
                    <Stack gap="md">
                        <Alert variant="light" color="orange" icon={<IconClock size={20} />}>
                            <Text size="sm">
                                Configure as fases de cada aula — renomeie, adicione, remova ou reordene.
                                Qualquer escola ou método pode adaptar a estrutura.
                            </Text>
                        </Alert>

                        {loadingStructures ? (
                            <Center h={200}><Loader size="lg" /></Center>
                        ) : structures.length > 0 ? (
                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                {structures.map((s: any) => {
                                    const phases: Phase[] = JSON.parse(s.phases || '[]');
                                    return (
                                        <Card key={s.id} withBorder p="md">
                                            <Group justify="space-between" mb="sm">
                                                <Text fw={600}>{s.name}</Text>
                                                <Badge color="orange">{s.durationMinutes}min</Badge>
                                            </Group>
                                            <Stack gap={4}>
                                                {phases.map((p, i) => (
                                                    <Group key={i} gap="xs">
                                                        <Badge size="xs" variant="light" w={24} h={20} p={0} style={{ display: 'flex', justifyContent: 'center' }}>
                                                            {i + 1}
                                                        </Badge>
                                                        <Text size="xs" flex={1}>{p.name}</Text>
                                                        <Text size="xs" c="dimmed">{p.durationMinutes}min</Text>
                                                    </Group>
                                                ))}
                                            </Stack>
                                            <Divider my="xs" />
                                            <Group gap="xs">
                                                <Badge size="xs" variant="light" color="blue">
                                                    Prof: {s.teacherTalkTimePercent}%
                                                </Badge>
                                                <Badge size="xs" variant="light" color="green">
                                                    Aluno: {s.studentTalkTimePercent}%
                                                </Badge>
                                                <Badge size="xs" variant="light" color="gray">
                                                    {GROUPING_TYPES.find(g => g.value === s.defaultGroupingType)?.label}
                                                </Badge>
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <IconClock size={48} color="gray" />
                                    <Text c="dimmed">Nenhuma estrutura de aula configurada</Text>
                                    <Button size="xs" onClick={openCreateModal}>Criar primeira estrutura</Button>
                                </Stack>
                            </Center>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* ============================================================ */}
                {/* TAB 3: HOMEWORK POLICY */}
                {/* ============================================================ */}
                <Tabs.Panel value="homework" pt="lg">
                    <Stack gap="md">
                        <Alert variant="light" color="teal" icon={<IconClipboardCheck size={20} />}>
                            <Text size="sm">
                                Defina como tarefas de casa funcionam — obrigatórias ou não, frequência, peso na nota e penalidades.
                            </Text>
                        </Alert>

                        {loadingPolicies ? (
                            <Center h={200}><Loader size="lg" /></Center>
                        ) : policies.length > 0 ? (
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                                {policies.map((p: any) => (
                                    <Card key={p.id} withBorder p="md">
                                        <Text fw={600} mb="xs">{p.name}</Text>
                                        <Stack gap={4}>
                                            <Group gap="xs">
                                                <Badge size="xs" color="teal">
                                                    {POLICY_TYPES.find(pt => pt.value === p.policyType)?.label}
                                                </Badge>
                                                <Badge size="xs" variant="light" color="gray">
                                                    {FREQUENCY_TYPES.find(f => f.value === p.frequencyType)?.label}
                                                </Badge>
                                            </Group>
                                            {p.expectedTimeMinutes && (
                                                <Text size="xs" c="dimmed">~{p.expectedTimeMinutes}min por tarefa</Text>
                                            )}
                                            <Text size="xs" c="dimmed">Peso na nota: {p.gradeWeightPercent}%</Text>
                                            {p.allowsLateSubmission && (
                                                <Text size="xs" c="dimmed">
                                                    Atraso: -{p.latePenaltyPerDay}%/dia, max {p.maxLateDays} dias
                                                </Text>
                                            )}
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        ) : (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <IconClipboardCheck size={48} color="gray" />
                                    <Text c="dimmed">Nenhuma política de tarefa configurada</Text>
                                    <Button size="xs" onClick={openCreateModal}>Criar primeira política</Button>
                                </Stack>
                            </Center>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            {/* ================================================================ */}
            {/* CREATE MODAL — adapts to active tab */}
            {/* ================================================================ */}
            <Modal
                opened={createModalOpened}
                onClose={closeCreateModal}
                title={
                    activeTab === 'approach' ? 'Nova Abordagem Pedagógica' :
                        activeTab === 'structure' ? 'Nova Estrutura de Aula' :
                            'Nova Política de Tarefa'
                }
                size={activeTab === 'structure' ? 'lg' : 'md'}
            >
                {/* -- Approach Form -- */}
                {activeTab === 'approach' && (
                    <Stack gap="md">
                        <TextInput label="Nome" placeholder="Ex: Método Comunicativo Adaptado" value={formName} onChange={e => setFormName(e.target.value)} required />
                        <Group grow>
                            <TextInput label="Código" placeholder="Ex: TBL" value={formCode} onChange={e => setFormCode(e.target.value)} />
                            <Select label="Abordagem Base" data={APPROACHES} value={formApproach} onChange={setFormApproach} />
                        </Group>
                        <Textarea label="Descrição" placeholder="Descreva sua abordagem..." value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} />
                        <Textarea label="Filosofia de Ensino" placeholder="Qual é a visão pedagógica?" value={formPhilosophy} onChange={e => setFormPhilosophy(e.target.value)} rows={2} />
                        <Button onClick={saveMethodology} loading={saving} disabled={!formName}>Salvar Abordagem</Button>
                    </Stack>
                )}

                {/* -- Structure Form -- */}
                {activeTab === 'structure' && (
                    <Stack gap="md">
                        <TextInput label="Nome da Estrutura" placeholder="Ex: Aula Padrão 50min" value={structureName} onChange={e => setStructureName(e.target.value)} required />
                        <Textarea label="Descrição" placeholder="Quando usar esta estrutura..." value={structureDescription} onChange={e => setStructureDescription(e.target.value)} rows={2} />

                        <Group grow>
                            <NumberInput label="Duração Total (min)" value={structureDuration} onChange={v => setStructureDuration(Number(v) || 50)} min={15} max={240} />
                            <Select label="Agrupamento Padrão" data={GROUPING_TYPES} value={structureGrouping} onChange={setStructureGrouping} />
                            <NumberInput label="Max Alunos" value={structureMaxStudents} onChange={v => setStructureMaxStudents(v as number)} min={1} max={100} />
                        </Group>

                        <div>
                            <Text size="sm" fw={500} mb={4}>
                                Tempo de Fala — Professor: {structureTTT}% | Aluno: {100 - structureTTT}%
                            </Text>
                            <Slider value={structureTTT} onChange={setStructureTTT} min={0} max={100}
                                marks={[{ value: 30, label: '30%' }, { value: 50, label: '50%' }, { value: 70, label: '70%' }]}
                                color="violet"
                            />
                        </div>

                        <Divider label="Fases da Aula" labelPosition="center" />

                        <Alert variant="light" color="orange" p="xs">
                            <Text size="xs">
                                Renomeie, adicione ou remova fases. A soma deve ser ≤ duração total ({structureDuration}min).
                                Atual: {totalPhaseDuration}min {totalPhaseDuration > structureDuration && '⚠️ excede!'}
                            </Text>
                        </Alert>

                        <Stack gap="xs">
                            {structurePhases.map((phase, idx) => (
                                <Paper key={idx} p="xs" withBorder radius="sm">
                                    <Group gap="xs">
                                        <ActionIcon variant="subtle" size="sm" color="gray">
                                            <IconGripVertical size={14} />
                                        </ActionIcon>
                                        <TextInput
                                            placeholder="Nome da fase"
                                            value={phase.name}
                                            onChange={e => updatePhase(idx, 'name', e.target.value)}
                                            size="xs" flex={1}
                                        />
                                        <NumberInput
                                            placeholder="min"
                                            value={phase.durationMinutes}
                                            onChange={v => updatePhase(idx, 'durationMinutes', Number(v))}
                                            size="xs" w={80} min={1} max={120}
                                            suffix="min"
                                        />
                                        <TextInput
                                            placeholder="Descrição"
                                            value={phase.description}
                                            onChange={e => updatePhase(idx, 'description', e.target.value)}
                                            size="xs" flex={1}
                                        />
                                        <ActionIcon variant="subtle" size="sm" onClick={() => movePhase(idx, 'up')} disabled={idx === 0}>
                                            <IconChevronUp size={14} />
                                        </ActionIcon>
                                        <ActionIcon variant="subtle" size="sm" onClick={() => movePhase(idx, 'down')} disabled={idx === structurePhases.length - 1}>
                                            <IconChevronDown size={14} />
                                        </ActionIcon>
                                        <ActionIcon variant="subtle" size="sm" color="red" onClick={() => removePhase(idx)}>
                                            <IconTrash size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>

                        <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={addPhase}>
                            Adicionar Fase
                        </Button>

                        <Button onClick={saveStructure} loading={saving} disabled={!structureName || structurePhases.length === 0}
                            color={totalPhaseDuration > structureDuration ? 'orange' : undefined}>
                            Salvar Estrutura
                        </Button>
                    </Stack>
                )}

                {/* -- Policy Form -- */}
                {activeTab === 'homework' && (
                    <Stack gap="md">
                        <TextInput label="Nome da Política" placeholder="Ex: Tarefa Semanal Padrão" value={policyName} onChange={e => setPolicyName(e.target.value)} required />
                        <Group grow>
                            <Select label="Tipo" data={POLICY_TYPES} value={policyType} onChange={setPolicyType} />
                            <Select label="Frequência" data={FREQUENCY_TYPES} value={policyFrequency} onChange={setPolicyFrequency} />
                        </Group>
                        <Group grow>
                            <NumberInput label="Tempo Estimado (min)" value={policyExpectedTime} onChange={v => setPolicyExpectedTime(v as number)} min={5} max={180} />
                            <NumberInput label="Peso na Nota (%)" value={policyGradeWeight} onChange={v => setPolicyGradeWeight(Number(v))} min={0} max={100} />
                        </Group>
                        <Switch label="Permite entrega atrasada" checked={policyAllowLate} onChange={e => setPolicyAllowLate(e.currentTarget.checked)} />
                        {policyAllowLate && (
                            <Group grow>
                                <NumberInput label="Penalidade por dia (%)" value={policyLatePenalty} onChange={v => setPolicyLatePenalty(v as number)} min={0} max={100} />
                                <NumberInput label="Max dias de atraso" value={policyMaxLateDays} onChange={v => setPolicyMaxLateDays(v as number)} min={1} max={30} />
                            </Group>
                        )}
                        <Button onClick={savePolicy} loading={saving} disabled={!policyName}>Salvar Política</Button>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
