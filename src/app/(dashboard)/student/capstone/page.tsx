'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Avatar, ThemeIcon, Paper, ActionIcon, Tabs, Modal, Textarea,
    NumberInput, Progress, Tooltip, Divider, RingProgress, TextInput,
    Stepper, Alert, Grid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconRocket, IconCheck, IconClock, IconEdit,
    IconSend, IconStar, IconStarFilled, IconBulb, IconAlertCircle,
    IconUpload, IconTrash, IconFile, IconUser, IconSchool, IconUsersGroup
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface CapstoneSubmission {
    id: string;
    moduleId: string;
    moduleName: string;
    title: string;
    description: string;
    status: 'draft' | 'submitted' | 'under_review' | 'graded' | 'returned';
    submittedAt?: string;

    // Self-assessment
    selfScore?: number;
    selfFeedback?: string;
    selfRubric?: Record<string, number>;

    // Teacher & Peer scores (read-only for student)
    teacherScore?: number;
    teacherFeedback?: string;
    peerScore?: number;
    peerCount?: number;
    finalScore?: number;

    // Evidence
    promptIds: string[];
    runIds: string[];
    attachments: { name: string; url: string; type: string }[];
}

interface RubricCriterion {
    id: string;
    name: string;
    description: string;
    maxScore: number;
    selfQuestion: string; // Reflective question for self-assessment
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RUBRIC_CRITERIA: RubricCriterion[] = [
    {
        id: 'character',
        name: 'Held Character',
        description: 'AI maintained consistent persona',
        maxScore: 5,
        selfQuestion: 'How well did the AI stay in character throughout our conversation?'
    },
    {
        id: 'technique',
        name: 'Technique Usage',
        description: 'Course techniques properly applied',
        maxScore: 5,
        selfQuestion: 'Which techniques from this module did I use? How effectively?'
    },
    {
        id: 'creativity',
        name: 'Creativity',
        description: 'Innovative and thoughtful approach',
        maxScore: 5,
        selfQuestion: 'What was unique about my approach? What would I do differently?'
    },
    {
        id: 'clarity',
        name: 'Clarity',
        description: 'Clear and well-structured output',
        maxScore: 5,
        selfQuestion: 'Was my prompting clear? Was the output structured and useful?'
    },
    {
        id: 'reflection',
        name: 'Reflection',
        description: 'Thoughtful process reflection',
        maxScore: 5,
        selfQuestion: 'What did I learn from this experience? What surprised me?'
    },
];

const MAX_TOTAL_SCORE = RUBRIC_CRITERIA.reduce((acc, c) => acc + c.maxScore, 0);

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_SUBMISSIONS: CapstoneSubmission[] = [];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
        draft: { color: 'gray', label: 'Rascunho', icon: <IconEdit size={14} /> },
        submitted: { color: 'blue', label: 'Enviado', icon: <IconClock size={14} /> },
        under_review: { color: 'orange', label: 'Em Avaliação', icon: <IconClock size={14} /> },
        graded: { color: 'green', label: 'Avaliado', icon: <IconCheck size={14} /> },
        returned: { color: 'violet', label: 'Devolvido', icon: <IconAlertCircle size={14} /> },
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

export default function StudentCapstoneSubmissionPage() {
    const [submissions, setSubmissions] = useState<CapstoneSubmission[]>(MOCK_SUBMISSIONS);
    const [selectedSubmission, setSelectedSubmission] = useState<CapstoneSubmission | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selfRubric, setSelfRubric] = useState<Record<string, number>>({});
    const [selfFeedback, setSelfFeedback] = useState('');

    const [submitModal, { open: openSubmitModal, close: closeSubmitModal }] = useDisclosure(false);
    const [detailModal, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

    const handleStartSubmission = (submission: CapstoneSubmission) => {
        setSelectedSubmission(submission);
        setTitle(submission.title);
        setDescription(submission.description);
        setSelfRubric(submission.selfRubric || {});
        setSelfFeedback(submission.selfFeedback || '');
        setActiveStep(0);
        openSubmitModal();
    };

    const handleViewGrades = (submission: CapstoneSubmission) => {
        setSelectedSubmission(submission);
        openDetailModal();
    };

    const handleSubmit = () => {
        if (!selectedSubmission) return;

        const totalSelfScore = Object.values(selfRubric).reduce((acc, s) => acc + s, 0);

        setSubmissions(prev => prev.map(sub => {
            if (sub.id === selectedSubmission.id) {
                return {
                    ...sub,
                    title,
                    description,
                    selfScore: totalSelfScore,
                    selfFeedback,
                    selfRubric,
                    status: 'submitted',
                    submittedAt: new Date().toISOString().split('T')[0],
                };
            }
            return sub;
        }));

        closeSubmitModal();
        setSelectedSubmission(null);
    };

    const currentSelfTotal = Object.values(selfRubric).reduce((acc, s) => acc + s, 0);
    const isStep1Complete = title.length > 0 && description.length > 0;
    const isStep2Complete = Object.keys(selfRubric).length === RUBRIC_CRITERIA.length;

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/student" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Entregas de Módulo 🚀</Title>
                        <Text c="dimmed">Complete seu trabalho e faça sua auto-avaliação</Text>
                    </div>
                </Group>
            </Group>

            {/* Info Alert */}
            <Alert icon={<IconBulb size={20} />} title="Avaliação 360°" color="blue" variant="light">
                <Text size="sm">
                    Suas entregas são avaliadas de três formas: <strong>você mesmo</strong> (25%),
                    <strong> professor</strong> (50%) e <strong>colegas</strong> (25%).
                    A auto-avaliação é uma oportunidade de reflexão - seja honesto com você mesmo!
                </Text>
            </Alert>

            {/* Submissions List */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {submissions.map(submission => {
                    const statusInfo = getStatusInfo(submission.status);
                    const isGraded = submission.status === 'graded';
                    const canSubmit = submission.status === 'draft';

                    return (
                        <Card key={submission.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={600}>{submission.moduleName}</Text>
                                        {submission.title ? (
                                            <Text size="sm" c="dimmed">{submission.title}</Text>
                                        ) : (
                                            <Text size="sm" c="dimmed" fs="italic">Ainda não iniciado</Text>
                                        )}
                                    </div>
                                    <Badge
                                        color={statusInfo.color}
                                        variant="light"
                                        leftSection={statusInfo.icon}
                                    >
                                        {statusInfo.label}
                                    </Badge>
                                </Group>

                                {/* Evidence Summary */}
                                <Group gap="md">
                                    <Paper p="xs" bg="gray.0" radius="sm">
                                        <Text size="xs" c="dimmed">{submission.promptIds.length} prompts</Text>
                                    </Paper>
                                    <Paper p="xs" bg="gray.0" radius="sm">
                                        <Text size="xs" c="dimmed">{submission.runIds.length} execuções</Text>
                                    </Paper>
                                    {submission.attachments.length > 0 && (
                                        <Paper p="xs" bg="gray.0" radius="sm">
                                            <Text size="xs" c="dimmed">{submission.attachments.length} anexos</Text>
                                        </Paper>
                                    )}
                                </Group>

                                {/* Grades (if graded) */}
                                {isGraded && submission.finalScore !== undefined && (
                                    <Paper p="md" bg="green.0" radius="md">
                                        <Group justify="space-between">
                                            <div>
                                                <Text size="xs" c="dimmed">Nota Final</Text>
                                                <Text size="xl" fw={700} c="green.7">
                                                    {submission.finalScore.toFixed(1)}/{MAX_TOTAL_SCORE}
                                                </Text>
                                            </div>
                                            <RingProgress
                                                size={60}
                                                thickness={6}
                                                roundCaps
                                                sections={[{
                                                    value: (submission.finalScore / MAX_TOTAL_SCORE) * 100,
                                                    color: getScoreColor(submission.finalScore, MAX_TOTAL_SCORE)
                                                }]}
                                            />
                                        </Group>
                                    </Paper>
                                )}

                                {/* Actions */}
                                <Group>
                                    {canSubmit && (
                                        <Button
                                            fullWidth
                                            leftSection={<IconSend size={16} />}
                                            onClick={() => handleStartSubmission(submission)}
                                        >
                                            Iniciar Entrega
                                        </Button>
                                    )}
                                    {isGraded && (
                                        <Button
                                            fullWidth
                                            variant="light"
                                            leftSection={<IconChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
                                            onClick={() => handleViewGrades(submission)}
                                        >
                                            Ver Avaliação Completa
                                        </Button>
                                    )}
                                    {submission.status === 'submitted' && (
                                        <Button fullWidth variant="light" color="gray" disabled>
                                            Aguardando Avaliação...
                                        </Button>
                                    )}
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {/* Submission Modal with Stepper */}
            <Modal
                opened={submitModal}
                onClose={closeSubmitModal}
                title={
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="violet">
                            <IconRocket size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Entrega de Módulo</Text>
                            <Text size="sm" c="dimmed">{selectedSubmission?.moduleName}</Text>
                        </div>
                    </Group>
                }
                size="xl"
                centered
            >
                <Stack gap="lg">
                    <Stepper active={activeStep} onStepClick={setActiveStep} size="sm">
                        <Stepper.Step label="Descrição" description="Sobre o trabalho">
                            <Stack gap="md" mt="md">
                                <TextInput
                                    label="Título do Trabalho"
                                    placeholder="Ex: Explorando Context Layers"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                                <Textarea
                                    label="Descrição"
                                    placeholder="Descreva o que você fez, as técnicas utilizadas, e o que aprendeu..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    minRows={4}
                                    required
                                />

                                <Paper p="md" bg="gray.0" radius="md">
                                    <Text size="sm" fw={500} mb="xs">Evidências Anexadas:</Text>
                                    <Group gap="xs">
                                        <Badge variant="light">{selectedSubmission?.promptIds.length || 0} prompts</Badge>
                                        <Badge variant="light">{selectedSubmission?.runIds.length || 0} execuções</Badge>
                                    </Group>
                                </Paper>

                                <Group justify="flex-end">
                                    <Button
                                        onClick={() => setActiveStep(1)}
                                        disabled={!isStep1Complete}
                                    >
                                        Próximo: Auto-avaliação
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Auto-avaliação" description="Sua reflexão">
                            <Stack gap="md" mt="md">
                                <Alert icon={<IconUser size={16} />} color="violet" variant="light">
                                    <Text size="sm">
                                        Reflita honestamente sobre seu trabalho. Esta avaliação representa
                                        <strong> 25% da sua nota final</strong>. Seja justo consigo mesmo!
                                    </Text>
                                </Alert>

                                {/* Self-assessment rubric */}
                                {RUBRIC_CRITERIA.map(criterion => (
                                    <Paper key={criterion.id} p="md" withBorder radius="md">
                                        <Stack gap="xs">
                                            <Group justify="space-between">
                                                <div>
                                                    <Text size="sm" fw={500}>{criterion.name}</Text>
                                                    <Text size="xs" c="dimmed">{criterion.description}</Text>
                                                </div>
                                                <Badge variant="light">
                                                    {selfRubric[criterion.id] || 0}/{criterion.maxScore}
                                                </Badge>
                                            </Group>

                                            <Text size="sm" c="violet" fs="italic">
                                                💭 {criterion.selfQuestion}
                                            </Text>

                                            {/* Star rating */}
                                            <Group gap={4}>
                                                {Array.from({ length: criterion.maxScore }).map((_, i) => (
                                                    <ActionIcon
                                                        key={i}
                                                        variant="subtle"
                                                        color="yellow"
                                                        size="lg"
                                                        onClick={() => setSelfRubric(prev => ({
                                                            ...prev,
                                                            [criterion.id]: i + 1
                                                        }))}
                                                    >
                                                        {i < (selfRubric[criterion.id] || 0) ? (
                                                            <IconStarFilled size={20} />
                                                        ) : (
                                                            <IconStar size={20} />
                                                        )}
                                                    </ActionIcon>
                                                ))}
                                            </Group>
                                        </Stack>
                                    </Paper>
                                ))}

                                {/* Total self-score */}
                                <Paper p="md" bg="violet.0" radius="md">
                                    <Group justify="space-between">
                                        <Text fw={500}>Sua Auto-avaliação Total:</Text>
                                        <Text size="xl" fw={700} c="violet">
                                            {currentSelfTotal}/{MAX_TOTAL_SCORE}
                                        </Text>
                                    </Group>
                                </Paper>

                                <Group justify="space-between">
                                    <Button variant="subtle" onClick={() => setActiveStep(0)}>
                                        Voltar
                                    </Button>
                                    <Button
                                        onClick={() => setActiveStep(2)}
                                        disabled={!isStep2Complete}
                                    >
                                        Próximo: Reflexão
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>

                        <Stepper.Step label="Reflexão" description="Opcional">
                            <Stack gap="md" mt="md">
                                <Alert icon={<IconBulb size={16} />} color="yellow" variant="light">
                                    <Text size="sm">
                                        Compartilhar uma reflexão não é obrigatório, mas é <strong>altamente encorajado</strong>.
                                        Isso ajuda você a consolidar o aprendizado e fornece contexto valioso para o professor.
                                    </Text>
                                </Alert>

                                <Textarea
                                    label="Reflexão sobre o processo (opcional, mas recomendado)"
                                    placeholder="O que você aprendeu? O que foi desafiador? O que você faria diferente? O que mais te surpreendeu?"
                                    value={selfFeedback}
                                    onChange={(e) => setSelfFeedback(e.target.value)}
                                    minRows={5}
                                />

                                {/* Summary before submit */}
                                <Divider label="Resumo da Entrega" labelPosition="center" />

                                <Paper p="md" bg="gray.0" radius="md">
                                    <Grid>
                                        <Grid.Col span={6}>
                                            <Text size="sm" c="dimmed">Título</Text>
                                            <Text size="sm" fw={500}>{title}</Text>
                                        </Grid.Col>
                                        <Grid.Col span={6}>
                                            <Text size="sm" c="dimmed">Auto-avaliação</Text>
                                            <Text size="sm" fw={500} c="violet">{currentSelfTotal}/{MAX_TOTAL_SCORE}</Text>
                                        </Grid.Col>
                                        <Grid.Col span={6}>
                                            <Text size="sm" c="dimmed">Evidências</Text>
                                            <Text size="sm" fw={500}>
                                                {selectedSubmission?.promptIds.length || 0} prompts, {selectedSubmission?.runIds.length || 0} execuções
                                            </Text>
                                        </Grid.Col>
                                        <Grid.Col span={6}>
                                            <Text size="sm" c="dimmed">Reflexão</Text>
                                            <Text size="sm" fw={500} c={selfFeedback ? 'green' : 'gray'}>
                                                {selfFeedback ? 'Incluída ✓' : 'Não incluída'}
                                            </Text>
                                        </Grid.Col>
                                    </Grid>
                                </Paper>

                                <Group justify="space-between">
                                    <Button variant="subtle" onClick={() => setActiveStep(1)}>
                                        Voltar
                                    </Button>
                                    <Button
                                        color="green"
                                        leftSection={<IconSend size={16} />}
                                        onClick={handleSubmit}
                                    >
                                        Enviar Entrega
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>
                    </Stepper>
                </Stack>
            </Modal>

            {/* Grade Detail Modal */}
            <Modal
                opened={detailModal}
                onClose={closeDetailModal}
                title={
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Avaliação Completa</Text>
                            <Text size="sm" c="dimmed">{selectedSubmission?.title}</Text>
                        </div>
                    </Group>
                }
                size="lg"
                centered
            >
                {selectedSubmission && selectedSubmission.status === 'graded' && (
                    <Stack gap="lg">
                        {/* Final Score */}
                        <Paper p="lg" bg="green.0" radius="md">
                            <Group justify="center" gap="xl">
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="xs" c="dimmed">Nota Final</Text>
                                    <Text style={{ fontSize: 32 }} fw={700} c="green.7">
                                        {selectedSubmission.finalScore?.toFixed(1)}
                                    </Text>
                                    <Text size="xs" c="dimmed">de {MAX_TOTAL_SCORE}</Text>
                                </div>
                                <RingProgress
                                    size={100}
                                    thickness={10}
                                    roundCaps
                                    sections={[{
                                        value: ((selectedSubmission.finalScore || 0) / MAX_TOTAL_SCORE) * 100,
                                        color: getScoreColor(selectedSubmission.finalScore || 0, MAX_TOTAL_SCORE)
                                    }]}
                                    label={
                                        <Text fw={700} ta="center">
                                            {Math.round(((selectedSubmission.finalScore || 0) / MAX_TOTAL_SCORE) * 100)}%
                                        </Text>
                                    }
                                />
                            </Group>
                        </Paper>

                        <Divider label="Composição da Nota (1:2:1)" labelPosition="center" />

                        {/* Score Breakdown */}
                        <Grid>
                            <Grid.Col span={4}>
                                <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
                                    <ThemeIcon size="lg" variant="light" color="violet" mb="xs">
                                        <IconUser size={20} />
                                    </ThemeIcon>
                                    <Text size="xs" c="dimmed">Auto (25%)</Text>
                                    <Text size="lg" fw={700} c="violet">
                                        {selectedSubmission.selfScore}/{MAX_TOTAL_SCORE}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
                                    <ThemeIcon size="lg" variant="light" color="blue" mb="xs">
                                        <IconSchool size={20} />
                                    </ThemeIcon>
                                    <Text size="xs" c="dimmed">Professor (50%)</Text>
                                    <Text size="lg" fw={700} c="blue">
                                        {selectedSubmission.teacherScore}/{MAX_TOTAL_SCORE}
                                    </Text>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <Paper p="md" withBorder radius="md" style={{ textAlign: 'center' }}>
                                    <ThemeIcon size="lg" variant="light" color="green" mb="xs">
                                        <IconUsersGroup size={20} />
                                    </ThemeIcon>
                                    <Text size="xs" c="dimmed">Colegas (25%)</Text>
                                    <Text size="lg" fw={700} c="green">
                                        {selectedSubmission.peerScore?.toFixed(1)}/{MAX_TOTAL_SCORE}
                                    </Text>
                                    <Text size="xs" c="dimmed">({selectedSubmission.peerCount} avaliações)</Text>
                                </Paper>
                            </Grid.Col>
                        </Grid>

                        {/* Teacher Feedback */}
                        {selectedSubmission.teacherFeedback && (
                            <Paper p="md" withBorder radius="md">
                                <Group gap="xs" mb="xs">
                                    <IconSchool size={14} color="var(--mantine-color-blue-6)" />
                                    <Text size="sm" fw={500} c="blue">Feedback do Professor:</Text>
                                </Group>
                                <Text size="sm">
                                    "{selectedSubmission.teacherFeedback}"
                                </Text>
                            </Paper>
                        )}

                        {/* Self Feedback */}
                        {selectedSubmission.selfFeedback && (
                            <Paper p="md" bg="violet.0" radius="md">
                                <Group gap="xs" mb="xs">
                                    <IconUser size={14} color="var(--mantine-color-violet-6)" />
                                    <Text size="sm" fw={500} c="violet">Sua Reflexão:</Text>
                                </Group>
                                <Text size="sm" fs="italic">
                                    "{selectedSubmission.selfFeedback}"
                                </Text>
                            </Paper>
                        )}

                        <Button fullWidth variant="light" onClick={closeDetailModal}>
                            Fechar
                        </Button>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

