'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Avatar, ThemeIcon, Paper, ActionIcon, Modal, Textarea,
    Progress, Tooltip, Divider, Alert, Grid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconUsers, IconCheck, IconClock, IconEdit,
    IconStar, IconStarFilled, IconBulb, IconAlertCircle,
    IconEye, IconSend, IconHeart, IconMessage
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface PeerSubmission {
    id: string;
    studentId: string;
    studentName: string; // Anonymized or real depending on settings
    isAnonymous: boolean;
    moduleName: string;
    title: string;
    description: string;

    // Evidence preview
    promptCount: number;
    runCount: number;

    // Review status
    reviewed: boolean;
    myReview?: PeerReview;
}

interface PeerReview {
    submissionId: string;
    rubricScores: Record<string, number>;
    feedback?: string;
    createdAt: string;
}

interface RubricCriterion {
    id: string;
    name: string;
    description: string;
    maxScore: number;
    peerQuestion: string; // Question to guide peer review
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
        peerQuestion: 'Did the AI stay in character throughout? Was the persona consistent?'
    },
    {
        id: 'technique',
        name: 'Technique Usage',
        description: 'Course techniques applied',
        maxScore: 5,
        peerQuestion: 'Can you identify techniques from this module being used effectively?'
    },
    {
        id: 'creativity',
        name: 'Creativity',
        description: 'Innovative approach',
        maxScore: 5,
        peerQuestion: 'Was there something unique or creative about this approach?'
    },
    {
        id: 'clarity',
        name: 'Clarity',
        description: 'Clear and structured output',
        maxScore: 5,
        peerQuestion: 'Is the work clear and easy to follow? Is the output well-structured?'
    },
    {
        id: 'overall',
        name: 'Overall Impression',
        description: 'General quality',
        maxScore: 5,
        peerQuestion: 'What is your overall impression of this work?'
    },
];

const MAX_TOTAL_SCORE = RUBRIC_CRITERIA.reduce((acc, c) => acc + c.maxScore, 0);

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PEER_SUBMISSIONS: PeerSubmission[] = [];

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentPeerReviewPage() {
    const [submissions, setSubmissions] = useState<PeerSubmission[]>(MOCK_PEER_SUBMISSIONS);
    const [selectedSubmission, setSelectedSubmission] = useState<PeerSubmission | null>(null);

    // Review form state
    const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
    const [feedback, setFeedback] = useState('');

    const [reviewModal, { open: openReviewModal, close: closeReviewModal }] = useDisclosure(false);
    const [viewModal, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);

    const handleStartReview = (submission: PeerSubmission) => {
        setSelectedSubmission(submission);
        setRubricScores({});
        setFeedback('');
        openReviewModal();
    };

    const handleViewReview = (submission: PeerSubmission) => {
        setSelectedSubmission(submission);
        openViewModal();
    };

    const handleSubmitReview = () => {
        if (!selectedSubmission) return;

        const review: PeerReview = {
            submissionId: selectedSubmission.id,
            rubricScores,
            feedback: feedback || undefined,
            createdAt: new Date().toISOString().split('T')[0],
        };

        setSubmissions(prev => prev.map(sub => {
            if (sub.id === selectedSubmission.id) {
                return {
                    ...sub,
                    reviewed: true,
                    myReview: review,
                };
            }
            return sub;
        }));

        closeReviewModal();
        setSelectedSubmission(null);
    };

    const currentTotal = Object.values(rubricScores).reduce((acc, s) => acc + s, 0);
    const isComplete = Object.keys(rubricScores).length === RUBRIC_CRITERIA.length;

    const pendingReviews = submissions.filter(s => !s.reviewed);
    const completedReviews = submissions.filter(s => s.reviewed);
    const progressPercentage = (completedReviews.length / submissions.length) * 100;

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
                        <Title order={2}>Avaliação de Colegas 👥</Title>
                        <Text c="dimmed">Ajude seus colegas com feedback construtivo</Text>
                    </div>
                </Group>
                <Badge size="lg" variant="light" color={pendingReviews.length === 0 ? 'green' : 'orange'}>
                    {completedReviews.length}/{submissions.length} avaliados
                </Badge>
            </Group>

            {/* Progress */}
            <Paper p="md" withBorder radius="md">
                <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Seu progresso nas avaliações</Text>
                    <Text size="sm" c="dimmed">{Math.round(progressPercentage)}%</Text>
                </Group>
                <Progress value={progressPercentage} size="lg" radius="xl" color="green" />
            </Paper>

            {/* Info Alert */}
            <Alert icon={<IconHeart size={20} />} title="Feedback Construtivo" color="pink" variant="light">
                <Text size="sm">
                    Sua avaliação representa <strong>25% da nota final</strong> do seu colega. Seja justo,
                    honesto e construtivo. Lembre-se: você também está sendo avaliado pelos seus colegas!
                    <br /><br />
                    <strong>Dica:</strong> O feedback escrito não é obrigatório, mas é muito valioso.
                    Uma palavra de encorajamento ou sugestão pode fazer toda a diferença!
                </Text>
            </Alert>

            {/* Pending Reviews */}
            {pendingReviews.length > 0 && (
                <>
                    <Text fw={600} size="lg">Pendentes ({pendingReviews.length})</Text>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        {pendingReviews.map(submission => (
                            <Card key={submission.id} shadow="sm" radius="md" p="lg" withBorder>
                                <Stack gap="md">
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <Avatar size="sm" radius="xl" color="gray">
                                                {submission.isAnonymous ? '?' : submission.studentName.charAt(0)}
                                            </Avatar>
                                            <div>
                                                <Text size="sm" fw={500}>{submission.studentName}</Text>
                                                <Text size="xs" c="dimmed">{submission.moduleName}</Text>
                                            </div>
                                        </Group>
                                        <Badge color="orange" variant="light" leftSection={<IconClock size={12} />}>
                                            Pendente
                                        </Badge>
                                    </Group>

                                    <div>
                                        <Text fw={500}>{submission.title}</Text>
                                        <Text size="sm" c="dimmed" lineClamp={2}>
                                            {submission.description}
                                        </Text>
                                    </div>

                                    <Group gap="md">
                                        <Paper p="xs" bg="gray.0" radius="sm">
                                            <Text size="xs" c="dimmed">{submission.promptCount} prompts</Text>
                                        </Paper>
                                        <Paper p="xs" bg="gray.0" radius="sm">
                                            <Text size="xs" c="dimmed">{submission.runCount} execuções</Text>
                                        </Paper>
                                    </Group>

                                    <Button
                                        fullWidth
                                        leftSection={<IconEdit size={16} />}
                                        onClick={() => handleStartReview(submission)}
                                    >
                                        Avaliar Trabalho
                                    </Button>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                </>
            )}

            {/* Completed Reviews */}
            {completedReviews.length > 0 && (
                <>
                    <Divider />
                    <Text fw={600} size="lg" c="green">Avaliados ({completedReviews.length}) ✓</Text>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        {completedReviews.map(submission => (
                            <Card key={submission.id} shadow="sm" radius="md" p="lg" withBorder bg="green.0">
                                <Stack gap="md">
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <Avatar size="sm" radius="xl" color="green">
                                                <IconCheck size={16} />
                                            </Avatar>
                                            <div>
                                                <Text size="sm" fw={500}>{submission.studentName}</Text>
                                                <Text size="xs" c="dimmed">{submission.moduleName}</Text>
                                            </div>
                                        </Group>
                                        <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                                            Avaliado
                                        </Badge>
                                    </Group>

                                    <Text fw={500}>{submission.title}</Text>

                                    {submission.myReview && (
                                        <Paper p="sm" bg="white" radius="md">
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">Sua nota:</Text>
                                                <Text fw={600} c="green">
                                                    {Object.values(submission.myReview.rubricScores).reduce((a, b) => a + b, 0)}/{MAX_TOTAL_SCORE}
                                                </Text>
                                            </Group>
                                            {submission.myReview.feedback && (
                                                <>
                                                    <Divider my="xs" />
                                                    <Text size="xs" c="dimmed" fs="italic" lineClamp={2}>
                                                        "{submission.myReview.feedback}"
                                                    </Text>
                                                </>
                                            )}
                                        </Paper>
                                    )}

                                    <Button
                                        fullWidth
                                        variant="subtle"
                                        leftSection={<IconEye size={16} />}
                                        onClick={() => handleViewReview(submission)}
                                    >
                                        Ver Minha Avaliação
                                    </Button>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                </>
            )}

            {/* Empty State */}
            {submissions.length === 0 && (
                <Paper p="xl" withBorder radius="md" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                        <IconUsers size={32} />
                    </ThemeIcon>
                    <Text fw={500}>Nenhum trabalho para avaliar</Text>
                    <Text size="sm" c="dimmed">
                        Quando seus colegas enviarem trabalhos, eles aparecerão aqui.
                    </Text>
                </Paper>
            )}

            {/* Review Modal */}
            <Modal
                opened={reviewModal}
                onClose={closeReviewModal}
                title={
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Avaliação de Colega</Text>
                            <Text size="sm" c="dimmed">{selectedSubmission?.studentName}</Text>
                        </div>
                    </Group>
                }
                size="lg"
                centered
            >
                {selectedSubmission && (
                    <Stack gap="lg">
                        {/* Submission Preview */}
                        <Paper p="md" bg="gray.0" radius="md">
                            <Text fw={600}>{selectedSubmission.title}</Text>
                            <Text size="sm" c="dimmed" mt="xs">{selectedSubmission.description}</Text>
                            <Group gap="md" mt="md">
                                <Badge variant="light">{selectedSubmission.promptCount} prompts</Badge>
                                <Badge variant="light">{selectedSubmission.runCount} execuções</Badge>
                            </Group>
                        </Paper>

                        <Divider label="Critérios de Avaliação" labelPosition="center" />

                        {/* Rubric */}
                        {RUBRIC_CRITERIA.map(criterion => (
                            <Paper key={criterion.id} p="md" withBorder radius="md">
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <div>
                                            <Text size="sm" fw={500}>{criterion.name}</Text>
                                            <Text size="xs" c="dimmed">{criterion.description}</Text>
                                        </div>
                                        <Badge variant="light">
                                            {rubricScores[criterion.id] || 0}/{criterion.maxScore}
                                        </Badge>
                                    </Group>

                                    <Text size="sm" c="blue" fs="italic">
                                        🔍 {criterion.peerQuestion}
                                    </Text>

                                    {/* Star rating */}
                                    <Group gap={4}>
                                        {Array.from({ length: criterion.maxScore }).map((_, i) => (
                                            <ActionIcon
                                                key={i}
                                                variant="subtle"
                                                color="yellow"
                                                size="lg"
                                                onClick={() => setRubricScores(prev => ({
                                                    ...prev,
                                                    [criterion.id]: i + 1
                                                }))}
                                            >
                                                {i < (rubricScores[criterion.id] || 0) ? (
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

                        {/* Total */}
                        <Paper p="md" bg="blue.0" radius="md">
                            <Group justify="space-between">
                                <Text fw={500}>Sua Avaliação Total:</Text>
                                <Text size="xl" fw={700} c="blue">
                                    {currentTotal}/{MAX_TOTAL_SCORE}
                                </Text>
                            </Group>
                        </Paper>

                        {/* Optional Feedback */}
                        <Textarea
                            label={
                                <Group gap="xs">
                                    <IconMessage size={14} />
                                    <Text size="sm">Feedback para seu colega (opcional, mas encorajado)</Text>
                                </Group>
                            }
                            placeholder="O que você gostou? O que poderia melhorar? Alguma ideia ou sugestão?"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            minRows={3}
                        />

                        {feedback && (
                            <Alert icon={<IconHeart size={16} />} color="pink" variant="light">
                                <Text size="sm">
                                    Obrigado por compartilhar feedback! Isso é muito valioso para seu colega 💜
                                </Text>
                            </Alert>
                        )}

                        {/* Actions */}
                        <Group justify="flex-end">
                            <Button variant="subtle" onClick={closeReviewModal}>Cancelar</Button>
                            <Button
                                color="green"
                                leftSection={<IconSend size={16} />}
                                onClick={handleSubmitReview}
                                disabled={!isComplete}
                            >
                                Enviar Avaliação
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* View Review Modal */}
            <Modal
                opened={viewModal}
                onClose={closeViewModal}
                title="Minha Avaliação"
                centered
            >
                {selectedSubmission?.myReview && (
                    <Stack gap="md">
                        <Paper p="md" bg="gray.0" radius="md">
                            <Text fw={500}>{selectedSubmission.title}</Text>
                            <Text size="sm" c="dimmed">{selectedSubmission.studentName}</Text>
                        </Paper>

                        <Divider label="Notas por Critério" labelPosition="center" />

                        {RUBRIC_CRITERIA.map(criterion => (
                            <Group key={criterion.id} justify="space-between">
                                <Text size="sm">{criterion.name}</Text>
                                <Group gap={4}>
                                    {Array.from({ length: criterion.maxScore }).map((_, i) => (
                                        <ThemeIcon
                                            key={i}
                                            size="sm"
                                            variant="subtle"
                                            color="yellow"
                                        >
                                            {i < (selectedSubmission.myReview?.rubricScores[criterion.id] || 0) ? (
                                                <IconStarFilled size={12} />
                                            ) : (
                                                <IconStar size={12} />
                                            )}
                                        </ThemeIcon>
                                    ))}
                                </Group>
                            </Group>
                        ))}

                        <Divider />

                        <Group justify="space-between">
                            <Text fw={500}>Total:</Text>
                            <Text fw={700} c="green">
                                {Object.values(selectedSubmission.myReview.rubricScores).reduce((a, b) => a + b, 0)}/{MAX_TOTAL_SCORE}
                            </Text>
                        </Group>

                        {selectedSubmission.myReview.feedback && (
                            <Paper p="md" bg="pink.0" radius="md">
                                <Group gap="xs" mb="xs">
                                    <IconMessage size={14} color="var(--mantine-color-pink-6)" />
                                    <Text size="sm" fw={500} c="pink">Seu feedback:</Text>
                                </Group>
                                <Text size="sm" fs="italic">
                                    "{selectedSubmission.myReview.feedback}"
                                </Text>
                            </Paper>
                        )}

                        <Button fullWidth variant="light" onClick={closeViewModal}>
                            Fechar
                        </Button>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

