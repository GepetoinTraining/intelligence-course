'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Avatar, ThemeIcon, Paper, ActionIcon, Table, Select, Modal,
    Textarea, NumberInput, Progress, Tooltip, Divider, RingProgress,
    Tabs, Grid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconUsers, IconChartBar,
    IconUser, IconSchool, IconUsersGroup, IconScale,
    IconCheck, IconClock, IconAlertCircle, IconEdit,
    IconEye, IconMessage, IconStar, IconStarFilled,
    IconFileText, IconPrinter
} from '@tabler/icons-react';
import Link from 'next/link';
import { ExportButton } from '@/components/shared';

// ============================================================================
// TYPES
// ============================================================================

interface Student {
    id: string;
    name: string;
    email: string;
}

interface CapstoneSubmission {
    id: string;
    studentId: string;
    studentName: string;
    moduleId: string;
    title: string;
    status: 'draft' | 'submitted' | 'under_review' | 'graded' | 'returned';
    submittedAt?: string;

    // Self-assessment (weight: 1)
    selfScore?: number;
    selfFeedback?: string;

    // Teacher grading (weight: 2)
    teacherScore?: number;
    teacherFeedback?: string;

    // Peer reviews (weight: 1)
    peerScore?: number;
    peerCount: number;

    // Final weighted score
    finalScore?: number;
}

interface RubricCriterion {
    id: string;
    name: string;
    description: string;
    maxScore: number;
}

// ============================================================================
// GRADING CONFIGURATION
// ============================================================================

const GRADING_WEIGHTS = {
    self: 1,
    teacher: 2,
    peer: 1,
    total: 4, // 1 + 2 + 1
};

const RUBRIC_CRITERIA: RubricCriterion[] = [
    { id: 'character', name: 'Held Character', description: 'Did the AI maintain consistent persona?', maxScore: 5 },
    { id: 'technique', name: 'Technique Usage', description: 'Were course techniques properly applied?', maxScore: 5 },
    { id: 'creativity', name: 'Creativity', description: 'Was the approach innovative and thoughtful?', maxScore: 5 },
    { id: 'clarity', name: 'Clarity', description: 'Was the output clear and well-structured?', maxScore: 5 },
    { id: 'reflection', name: 'Reflection', description: 'Did the student reflect on the process?', maxScore: 5 },
];

const MAX_TOTAL_SCORE = RUBRIC_CRITERIA.reduce((acc, c) => acc + c.maxScore, 0);

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CLASSES = [
    { id: 'class-1', name: 'Turma A - Manhã' },
    { id: 'class-2', name: 'Turma B - Tarde' },
    { id: 'class-3', name: 'Turma C - Noite' },
];

const MOCK_MODULES = [
    { id: 'mod-1', name: 'Module 1: The Orbit' },
    { id: 'mod-2', name: 'Module 2: The Slingshot' },
    { id: 'mod-3', name: 'Module 3: The Black Hole' },
];

const MOCK_SUBMISSIONS: Record<string, CapstoneSubmission[]> = {
    'class-1': [
        {
            id: 'sub-1',
            studentId: 's1',
            studentName: 'Ana Silva',
            moduleId: 'mod-1',
            title: 'Orbital Prompting Project',
            status: 'graded',
            submittedAt: '2026-01-28',
            selfScore: 22,
            selfFeedback: 'I felt confident in my character development but could improve on technique.',
            teacherScore: 20,
            teacherFeedback: 'Excellent work on maintaining character. Technique usage was good but could be more systematic.',
            peerScore: 21,
            peerCount: 5,
            finalScore: 20.5, // (22 + 20*2 + 21) / 4
        },
        {
            id: 'sub-2',
            studentId: 's2',
            studentName: 'Bruno Costa',
            moduleId: 'mod-1',
            title: 'AI Character Study',
            status: 'under_review',
            submittedAt: '2026-01-29',
            selfScore: 18,
            selfFeedback: 'I struggled with the reflection but loved the creative process.',
            teacherScore: undefined,
            teacherFeedback: undefined,
            peerScore: 19,
            peerCount: 4,
            finalScore: undefined,
        },
        {
            id: 'sub-3',
            studentId: 's3',
            studentName: 'Carla Dias',
            moduleId: 'mod-1',
            title: 'Prompt Engineering Lab',
            status: 'submitted',
            submittedAt: '2026-01-30',
            selfScore: undefined,
            peerScore: undefined,
            peerCount: 0,
            finalScore: undefined,
        },
        {
            id: 'sub-4',
            studentId: 's4',
            studentName: 'Diego Lima',
            moduleId: 'mod-1',
            title: 'Context Layer Exploration',
            status: 'draft',
            selfScore: undefined,
            peerScore: undefined,
            peerCount: 0,
            finalScore: undefined,
        },
    ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const calculateWeightedScore = (self?: number, teacher?: number, peer?: number): number | undefined => {
    if (self === undefined || teacher === undefined || peer === undefined) {
        return undefined;
    }
    return (self * GRADING_WEIGHTS.self + teacher * GRADING_WEIGHTS.teacher + peer * GRADING_WEIGHTS.peer) / GRADING_WEIGHTS.total;
};

const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
        draft: { color: 'gray', label: 'Rascunho', icon: <IconEdit size={14} /> },
        submitted: { color: 'blue', label: 'Enviado', icon: <IconClock size={14} /> },
        under_review: { color: 'orange', label: 'Em Avaliação', icon: <IconEye size={14} /> },
        graded: { color: 'green', label: 'Avaliado', icon: <IconCheck size={14} /> },
        returned: { color: 'violet', label: 'Devolvido', icon: <IconMessage size={14} /> },
    };
    return statusMap[status] || statusMap.draft;
};

const getScoreColor = (score: number, max: number): string => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'yellow';
    if (percentage >= 40) return 'orange';
    return 'red';
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function TeacherGradesPage() {
    const [selectedClass, setSelectedClass] = useState<string>('class-1');
    const [selectedModule, setSelectedModule] = useState<string>('mod-1');
    const [submissions, setSubmissions] = useState<CapstoneSubmission[]>(MOCK_SUBMISSIONS['class-1']);
    const [selectedSubmission, setSelectedSubmission] = useState<CapstoneSubmission | null>(null);

    const [gradeModal, { open: openGradeModal, close: closeGradeModal }] = useDisclosure(false);
    const [progressReportModal, { open: openProgressReport, close: closeProgressReport }] = useDisclosure(false);
    const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
    const [teacherFeedback, setTeacherFeedback] = useState('');

    const handleClassChange = (classId: string | null) => {
        if (classId) {
            setSelectedClass(classId);
            setSubmissions(MOCK_SUBMISSIONS[classId] || []);
        }
    };

    const handleOpenGrade = (submission: CapstoneSubmission) => {
        setSelectedSubmission(submission);
        // Pre-populate existing scores
        setRubricScores({});
        setTeacherFeedback(submission.teacherFeedback || '');
        openGradeModal();
    };

    const handleSaveGrade = () => {
        if (!selectedSubmission) return;

        const totalScore = Object.values(rubricScores).reduce((acc, s) => acc + s, 0);

        setSubmissions(prev => prev.map(sub => {
            if (sub.id === selectedSubmission.id) {
                const newTeacherScore = totalScore;
                const newFinalScore = calculateWeightedScore(sub.selfScore, newTeacherScore, sub.peerScore);

                return {
                    ...sub,
                    teacherScore: newTeacherScore,
                    teacherFeedback,
                    status: newFinalScore !== undefined ? 'graded' : 'under_review',
                    finalScore: newFinalScore,
                };
            }
            return sub;
        }));

        closeGradeModal();
        setSelectedSubmission(null);
    };

    // Calculate class stats
    const gradedCount = submissions.filter(s => s.status === 'graded').length;
    const pendingReview = submissions.filter(s => s.status === 'under_review' || s.status === 'submitted').length;
    const averageScore = submissions.filter(s => s.finalScore).reduce((acc, s) => acc + (s.finalScore || 0), 0) / (gradedCount || 1);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/teacher" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Avaliação 360° 📊</Title>
                        <Text c="dimmed">Notas trianguladas: Auto (25%) + Professor (50%) + Colegas (25%)</Text>
                    </div>
                </Group>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconFileText size={16} />}
                        onClick={openProgressReport}
                    >
                        Relatório de Progresso
                    </Button>
                    <ExportButton
                        data={submissions.map(s => ({
                            studentName: s.studentName,
                            title: s.title,
                            status: getStatusInfo(s.status).label,
                            submittedAt: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('pt-BR') : '-',
                            selfScore: s.selfScore ?? '-',
                            teacherScore: s.teacherScore ?? '-',
                            peerScore: s.peerScore?.toFixed(1) ?? '-',
                            peerCount: s.peerCount,
                            finalScore: s.finalScore?.toFixed(1) ?? '-',
                        }))}
                        columns={[
                            { key: 'studentName', label: 'Aluno' },
                            { key: 'title', label: 'Trabalho' },
                            { key: 'status', label: 'Status' },
                            { key: 'submittedAt', label: 'Data Envio' },
                            { key: 'selfScore', label: 'Auto (25%)' },
                            { key: 'teacherScore', label: 'Professor (50%)' },
                            { key: 'peerScore', label: 'Colegas (25%)' },
                            { key: 'peerCount', label: 'Nº Avaliadores' },
                            { key: 'finalScore', label: 'Nota Final' },
                        ]}
                        title={`Notas - ${MOCK_CLASSES.find(c => c.id === selectedClass)?.name || 'Turma'}`}
                        filename={`notas_${selectedClass}_${selectedModule}`}
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar Notas"
                    />
                </Group>
            </Group>

            {/* Grading Methodology Legend */}
            <Paper p="md" withBorder radius="md" bg="blue.0">
                <Group justify="center" gap="xl">
                    <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color="violet">
                            <IconUser size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={500}>Auto-avaliação</Text>
                        <Badge size="sm" variant="outline">Peso 1</Badge>
                    </Group>
                    <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color="blue">
                            <IconSchool size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={500}>Professor</Text>
                        <Badge size="sm" variant="outline" color="blue">Peso 2</Badge>
                    </Group>
                    <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color="green">
                            <IconUsersGroup size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={500}>Colegas</Text>
                        <Badge size="sm" variant="outline" color="green">Peso 1</Badge>
                    </Group>
                    <Group gap="xs">
                        <ThemeIcon size="sm" variant="light" color="orange">
                            <IconScale size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={500}>= Nota Final (Média Ponderada)</Text>
                    </Group>
                </Group>
            </Paper>

            {/* Filters */}
            <Group>
                <Select
                    label="Turma"
                    placeholder="Selecione a turma"
                    data={MOCK_CLASSES.map(c => ({ value: c.id, label: c.name }))}
                    value={selectedClass}
                    onChange={handleClassChange}
                    w={250}
                />
                <Select
                    label="Módulo"
                    placeholder="Selecione o módulo"
                    data={MOCK_MODULES.map(m => ({ value: m.id, label: m.name }))}
                    value={selectedModule}
                    onChange={(v) => v && setSelectedModule(v)}
                    w={300}
                />
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{submissions.length}</Text>
                            <Text size="sm" c="dimmed">Total Alunos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">{gradedCount}</Text>
                            <Text size="sm" c="dimmed">Avaliados</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconCheck size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="orange">{pendingReview}</Text>
                            <Text size="sm" c="dimmed">Pendentes</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="orange">
                            <IconClock size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{averageScore.toFixed(1)}</Text>
                            <Text size="sm" c="dimmed">Média Turma</Text>
                        </div>
                        <RingProgress
                            size={48}
                            thickness={5}
                            roundCaps
                            sections={[{ value: (averageScore / MAX_TOTAL_SCORE) * 100, color: getScoreColor(averageScore, MAX_TOTAL_SCORE) }]}
                        />
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Submissions Table */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Text fw={600}>Entregas - {MOCK_MODULES.find(m => m.id === selectedModule)?.name}</Text>
                    </Group>

                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Trabalho</Table.Th>
                                <Table.Th ta="center">Status</Table.Th>
                                <Table.Th ta="center">
                                    <Tooltip label="Auto-avaliação (25%)">
                                        <Group gap={4} justify="center">
                                            <IconUser size={14} />
                                            <Text size="xs">Auto</Text>
                                        </Group>
                                    </Tooltip>
                                </Table.Th>
                                <Table.Th ta="center">
                                    <Tooltip label="Nota do Professor (50%)">
                                        <Group gap={4} justify="center">
                                            <IconSchool size={14} />
                                            <Text size="xs">Prof</Text>
                                        </Group>
                                    </Tooltip>
                                </Table.Th>
                                <Table.Th ta="center">
                                    <Tooltip label="Média dos Colegas (25%)">
                                        <Group gap={4} justify="center">
                                            <IconUsersGroup size={14} />
                                            <Text size="xs">Colegas</Text>
                                        </Group>
                                    </Tooltip>
                                </Table.Th>
                                <Table.Th ta="center">
                                    <Tooltip label="Nota Final Ponderada">
                                        <Group gap={4} justify="center">
                                            <IconScale size={14} />
                                            <Text size="xs">Final</Text>
                                        </Group>
                                    </Tooltip>
                                </Table.Th>
                                <Table.Th ta="center">Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {submissions.map(submission => {
                                const statusInfo = getStatusInfo(submission.status);

                                return (
                                    <Table.Tr key={submission.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size="sm" radius="xl" color="violet">
                                                    {submission.studentName.charAt(0)}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>{submission.studentName}</Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{submission.title}</Text>
                                            {submission.submittedAt && (
                                                <Text size="xs" c="dimmed">Enviado: {new Date(submission.submittedAt).toLocaleDateString('pt-BR')}</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                color={statusInfo.color}
                                                variant="light"
                                                leftSection={statusInfo.icon}
                                            >
                                                {statusInfo.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            {submission.selfScore !== undefined ? (
                                                <Tooltip label={submission.selfFeedback || 'Sem comentário'}>
                                                    <Badge variant="light" color="violet">
                                                        {submission.selfScore}/{MAX_TOTAL_SCORE}
                                                    </Badge>
                                                </Tooltip>
                                            ) : (
                                                <Text size="xs" c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            {submission.teacherScore !== undefined ? (
                                                <Tooltip label={submission.teacherFeedback || 'Sem comentário'}>
                                                    <Badge variant="light" color="blue">
                                                        {submission.teacherScore}/{MAX_TOTAL_SCORE}
                                                    </Badge>
                                                </Tooltip>
                                            ) : (
                                                <Text size="xs" c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            {submission.peerScore !== undefined ? (
                                                <Tooltip label={`${submission.peerCount} avaliações`}>
                                                    <Badge variant="light" color="green">
                                                        {submission.peerScore.toFixed(1)}/{MAX_TOTAL_SCORE}
                                                    </Badge>
                                                </Tooltip>
                                            ) : (
                                                <Text size="xs" c="dimmed">{submission.peerCount > 0 ? `${submission.peerCount} rev.` : '-'}</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            {submission.finalScore !== undefined ? (
                                                <Badge
                                                    size="lg"
                                                    variant="filled"
                                                    color={getScoreColor(submission.finalScore, MAX_TOTAL_SCORE)}
                                                >
                                                    {submission.finalScore.toFixed(1)}
                                                </Badge>
                                            ) : (
                                                <Text size="xs" c="dimmed">-</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            {(submission.status === 'submitted' || submission.status === 'under_review') && (
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    leftSection={<IconEdit size={14} />}
                                                    onClick={() => handleOpenGrade(submission)}
                                                >
                                                    Avaliar
                                                </Button>
                                            )}
                                            {submission.status === 'graded' && (
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    leftSection={<IconEye size={14} />}
                                                    onClick={() => handleOpenGrade(submission)}
                                                >
                                                    Ver
                                                </Button>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Card>

            {/* Grading Modal */}
            <Modal
                opened={gradeModal}
                onClose={closeGradeModal}
                title={
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Avaliação do Professor</Text>
                            <Text size="sm" c="dimmed">{selectedSubmission?.studentName} - {selectedSubmission?.title}</Text>
                        </div>
                    </Group>
                }
                size="lg"
                centered
            >
                {selectedSubmission && (
                    <Stack gap="lg">
                        {/* Current Scores Summary */}
                        <Paper p="md" bg="gray.0" radius="md">
                            <Grid>
                                <Grid.Col span={4}>
                                    <Stack gap={4} align="center">
                                        <Group gap={4}>
                                            <IconUser size={16} color="var(--mantine-color-violet-6)" />
                                            <Text size="sm" fw={500}>Auto</Text>
                                        </Group>
                                        <Text size="lg" fw={700}>
                                            {selectedSubmission.selfScore !== undefined
                                                ? `${selectedSubmission.selfScore}/${MAX_TOTAL_SCORE}`
                                                : '-'
                                            }
                                        </Text>
                                    </Stack>
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <Stack gap={4} align="center">
                                        <Group gap={4}>
                                            <IconSchool size={16} color="var(--mantine-color-blue-6)" />
                                            <Text size="sm" fw={500}>Professor</Text>
                                        </Group>
                                        <Text size="lg" fw={700} c="blue">
                                            {Object.values(rubricScores).reduce((a, b) => a + b, 0) || selectedSubmission.teacherScore || '-'}/{MAX_TOTAL_SCORE}
                                        </Text>
                                    </Stack>
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <Stack gap={4} align="center">
                                        <Group gap={4}>
                                            <IconUsersGroup size={16} color="var(--mantine-color-green-6)" />
                                            <Text size="sm" fw={500}>Colegas ({selectedSubmission.peerCount})</Text>
                                        </Group>
                                        <Text size="lg" fw={700}>
                                            {selectedSubmission.peerScore !== undefined
                                                ? `${selectedSubmission.peerScore.toFixed(1)}/${MAX_TOTAL_SCORE}`
                                                : '-'
                                            }
                                        </Text>
                                    </Stack>
                                </Grid.Col>
                            </Grid>
                        </Paper>

                        {/* Self-assessment feedback */}
                        {selectedSubmission.selfFeedback && (
                            <Paper p="md" withBorder radius="md">
                                <Group gap="xs" mb="xs">
                                    <IconUser size={14} color="var(--mantine-color-violet-6)" />
                                    <Text size="sm" fw={500} c="violet">Auto-reflexão do aluno:</Text>
                                </Group>
                                <Text size="sm" fs="italic" c="dimmed">
                                    "{selectedSubmission.selfFeedback}"
                                </Text>
                            </Paper>
                        )}

                        <Divider label="Rubrica de Avaliação" labelPosition="center" />

                        {/* Rubric Criteria */}
                        <Stack gap="md">
                            {RUBRIC_CRITERIA.map(criterion => (
                                <Paper key={criterion.id} p="md" withBorder radius="md">
                                    <Group justify="space-between" mb="xs">
                                        <div>
                                            <Text size="sm" fw={500}>{criterion.name}</Text>
                                            <Text size="xs" c="dimmed">{criterion.description}</Text>
                                        </div>
                                        <NumberInput
                                            value={rubricScores[criterion.id] || 0}
                                            onChange={(v) => setRubricScores(prev => ({ ...prev, [criterion.id]: Number(v) || 0 }))}
                                            min={0}
                                            max={criterion.maxScore}
                                            w={80}
                                            suffix={`/${criterion.maxScore}`}
                                        />
                                    </Group>
                                    {/* Star rating visual */}
                                    <Group gap={4}>
                                        {Array.from({ length: criterion.maxScore }).map((_, i) => (
                                            <ActionIcon
                                                key={i}
                                                variant="subtle"
                                                color="yellow"
                                                onClick={() => setRubricScores(prev => ({ ...prev, [criterion.id]: i + 1 }))}
                                            >
                                                {i < (rubricScores[criterion.id] || 0) ? (
                                                    <IconStarFilled size={16} />
                                                ) : (
                                                    <IconStar size={16} />
                                                )}
                                            </ActionIcon>
                                        ))}
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>

                        {/* Total */}
                        <Paper p="md" bg="blue.0" radius="md">
                            <Group justify="space-between">
                                <Text fw={500}>Total Avaliação do Professor:</Text>
                                <Text size="xl" fw={700} c="blue">
                                    {Object.values(rubricScores).reduce((a, b) => a + b, 0)}/{MAX_TOTAL_SCORE}
                                </Text>
                            </Group>
                        </Paper>

                        {/* Feedback */}
                        <Textarea
                            label="Feedback para o Aluno"
                            placeholder="Escreva um comentário construtivo sobre o trabalho..."
                            value={teacherFeedback}
                            onChange={(e) => setTeacherFeedback(e.target.value)}
                            minRows={3}
                        />

                        {/* Actions */}
                        <Group justify="flex-end">
                            <Button variant="subtle" onClick={closeGradeModal}>Cancelar</Button>
                            <Button
                                color="blue"
                                leftSection={<IconCheck size={16} />}
                                onClick={handleSaveGrade}
                            >
                                Salvar Avaliação
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Progress Report Modal */}
            <Modal
                opened={progressReportModal}
                onClose={closeProgressReport}
                title={<Group gap="xs"><IconFileText size={20} /><Text fw={600}>Relatório de Progresso</Text></Group>}
                size="xl"
            >
                <Stack gap="md">
                    {/* Report Header */}
                    <Paper p="md" withBorder radius="md" className="print-header">
                        <Group justify="space-between">
                            <div>
                                <Text size="lg" fw={700}>
                                    {MOCK_CLASSES.find(c => c.id === selectedClass)?.name}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    {MOCK_MODULES.find(m => m.id === selectedModule)?.name}
                                </Text>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text size="sm" c="dimmed">Gerado em</Text>
                                <Text size="sm" fw={500}>{new Date().toLocaleDateString('pt-BR')}</Text>
                            </div>
                        </Group>
                    </Paper>

                    {/* Class Summary */}
                    <Paper p="md" withBorder radius="md" bg="blue.0">
                        <Text size="sm" fw={600} mb="xs">Resumo da Turma</Text>
                        <SimpleGrid cols={4}>
                            <div>
                                <Text size="xs" c="dimmed">Total de Alunos</Text>
                                <Text size="lg" fw={700}>{submissions.length}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">Avaliados</Text>
                                <Text size="lg" fw={700} c="green">{gradedCount}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">Pendentes</Text>
                                <Text size="lg" fw={700} c="orange">{pendingReview}</Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">Média da Turma</Text>
                                <Text size="lg" fw={700} c="blue">{averageScore.toFixed(1)}</Text>
                            </div>
                        </SimpleGrid>
                    </Paper>

                    {/* Student Cards */}
                    <Divider label="Desempenho Individual" labelPosition="center" />

                    <Stack gap="sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {submissions.map((sub) => {
                            const performance = sub.finalScore
                                ? sub.finalScore >= 20 ? 'excellent'
                                    : sub.finalScore >= 15 ? 'good'
                                        : sub.finalScore >= 10 ? 'satisfactory'
                                            : 'needs_improvement'
                                : 'pending';
                            const performanceConfig: Record<string, { label: string; color: string }> = {
                                excellent: { label: 'Excelente', color: 'green' },
                                good: { label: 'Bom', color: 'blue' },
                                satisfactory: { label: 'Satisfatório', color: 'yellow' },
                                needs_improvement: { label: 'Precisa Melhorar', color: 'orange' },
                                pending: { label: 'Pendente', color: 'gray' },
                            };

                            return (
                                <Paper key={sub.id} p="md" withBorder radius="md">
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="md">
                                            <Avatar size={40} radius="xl" color="violet">
                                                {sub.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <div>
                                                <Text fw={600}>{sub.studentName}</Text>
                                                <Text size="xs" c="dimmed">{sub.title}</Text>
                                            </div>
                                        </Group>

                                        <Group gap="lg">
                                            {/* Score Breakdown */}
                                            <Group gap="xs">
                                                <Tooltip label="Auto-avaliação (25%)">
                                                    <Badge variant="light" color="violet" size="sm">
                                                        <Group gap={4}>
                                                            <IconUser size={10} />
                                                            {sub.selfScore ?? '-'}
                                                        </Group>
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip label="Professor (50%)">
                                                    <Badge variant="light" color="blue" size="sm">
                                                        <Group gap={4}>
                                                            <IconSchool size={10} />
                                                            {sub.teacherScore ?? '-'}
                                                        </Group>
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip label="Colegas (25%)">
                                                    <Badge variant="light" color="green" size="sm">
                                                        <Group gap={4}>
                                                            <IconUsersGroup size={10} />
                                                            {sub.peerScore?.toFixed(1) ?? '-'}
                                                        </Group>
                                                    </Badge>
                                                </Tooltip>
                                            </Group>

                                            {/* Final Score */}
                                            <RingProgress
                                                size={50}
                                                thickness={4}
                                                roundCaps
                                                sections={[
                                                    { value: ((sub.finalScore || 0) / MAX_TOTAL_SCORE) * 100, color: performanceConfig[performance].color }
                                                ]}
                                                label={
                                                    <Text size="xs" fw={700} ta="center">
                                                        {sub.finalScore?.toFixed(0) ?? '-'}
                                                    </Text>
                                                }
                                            />

                                            <Badge color={performanceConfig[performance].color} variant="filled" size="sm">
                                                {performanceConfig[performance].label}
                                            </Badge>
                                        </Group>
                                    </Group>

                                    {sub.teacherFeedback && (
                                        <Paper p="xs" mt="sm" bg="gray.0" radius="sm">
                                            <Group gap="xs">
                                                <IconMessage size={14} color="gray" />
                                                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                                    {sub.teacherFeedback}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>

                    {/* Actions */}
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeProgressReport}>Fechar</Button>
                        <Button
                            leftSection={<IconPrinter size={16} />}
                            onClick={() => window.print()}
                        >
                            Imprimir Relatório
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

