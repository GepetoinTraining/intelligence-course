'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, Breadcrumbs, Anchor, ActionIcon, Divider,
    ThemeIcon, Skeleton, Textarea, Avatar, Timeline,
    Modal, Select, Progress, Tooltip
} from '@mantine/core';
import {
    IconBulb, IconThumbUp, IconThumbDown, IconArrowLeft,
    IconMessage, IconClock, IconCheck, IconX, IconFlame,
    IconSend, IconEdit, IconTrash, IconEye, IconUser,
    IconChartBar, IconTrendingUp, IconShield, IconHeart,
    IconUsers, IconCoin, IconAlertCircle
} from '@tabler/icons-react';
import Link from 'next/link';

interface KaizenSuggestion {
    id: string;
    title: string;
    description: string;
    problemType: string;
    impactArea: string;
    estimatedImpact: string;
    status: string;
    upvotes: number;
    downvotes: number;
    netVotes: number;
    userVote: number | null;
    submitterId: string;
    submitterName: string;
    isOwner: boolean;
    isAnonymous: boolean;
    tags: string[];
    createdAt: number;
    reviewedAt: number | null;
    reviewedBy: string | null;
    reviewNotes: string | null;
    implementedAt: number | null;
    measuredImpact: any | null;
}

interface Comment {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    isOwner: boolean;
    createdAt: number;
}

const PROBLEM_TYPES: Record<string, { label: string; color: string }> = {
    inefficiency: { label: 'Ineficiência', color: 'orange' },
    error_prone: { label: 'Propenso a Erros', color: 'red' },
    unclear: { label: 'Processo Confuso', color: 'yellow' },
    bottleneck: { label: 'Gargalo', color: 'grape' },
    waste: { label: 'Desperdício', color: 'pink' },
    safety: { label: 'Segurança', color: 'red' },
    quality: { label: 'Qualidade', color: 'blue' },
    cost: { label: 'Custo', color: 'green' },
    communication: { label: 'Comunicação', color: 'cyan' },
    other: { label: 'Outro', color: 'gray' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    submitted: { label: 'Enviada', color: 'blue', icon: <IconBulb size={14} /> },
    under_review: { label: 'Em Análise', color: 'yellow', icon: <IconEye size={14} /> },
    needs_info: { label: 'Info Necessária', color: 'orange', icon: <IconAlertCircle size={14} /> },
    approved: { label: 'Aprovada', color: 'green', icon: <IconCheck size={14} /> },
    in_progress: { label: 'Em Andamento', color: 'cyan', icon: <IconFlame size={14} /> },
    implemented: { label: 'Implementada', color: 'teal', icon: <IconCheck size={14} /> },
    rejected: { label: 'Rejeitada', color: 'red', icon: <IconX size={14} /> },
    deferred: { label: 'Adiada', color: 'gray', icon: <IconClock size={14} /> },
};

const IMPACT_AREAS: Record<string, { label: string; icon: React.ReactNode }> = {
    time: { label: 'Tempo', icon: <IconClock size={16} /> },
    cost: { label: 'Custo', icon: <IconCoin size={16} /> },
    quality: { label: 'Qualidade', icon: <IconCheck size={16} /> },
    safety: { label: 'Segurança', icon: <IconShield size={16} /> },
    morale: { label: 'Moral', icon: <IconHeart size={16} /> },
    customer: { label: 'Cliente', icon: <IconUsers size={16} /> },
};

const IMPACT_LEVELS: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixo', color: 'gray' },
    medium: { label: 'Médio', color: 'blue' },
    high: { label: 'Alto', color: 'orange' },
    critical: { label: 'Crítico', color: 'red' },
};

const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function KaizenDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [suggestion, setSuggestion] = useState<KaizenSuggestion | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // Review modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewing, setReviewing] = useState(false);

    useEffect(() => {
        loadSuggestion();
    }, [id]);

    const loadSuggestion = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/kaizen/suggestions/${id}`);
            if (!res.ok) {
                setError(res.status === 404 ? 'Sugestão não encontrada' : 'Erro ao carregar');
                return;
            }
            const data = await res.json();
            setSuggestion(data.data);

            // Load comments
            const commentsRes = await fetch(`/api/kaizen/suggestions/${id}?action=comments`);
            if (commentsRes.ok) {
                const commentsData = await commentsRes.json();
                setComments(commentsData.data || []);
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Erro ao carregar sugestão');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (vote: 'up' | 'down') => {
        if (!suggestion) return;
        try {
            const res = await fetch(`/api/kaizen/suggestions/${id}?action=vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vote }),
            });
            if (res.ok) {
                const data = await res.json();
                setSuggestion({
                    ...suggestion,
                    upvotes: data.upvotes,
                    downvotes: data.downvotes,
                    netVotes: data.netVotes,
                    userVote: vote === 'up' ? 1 : -1,
                });
            }
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/kaizen/suggestions/${id}?action=comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            if (res.ok) {
                const data = await res.json();
                setComments([...comments, data.data]);
                setNewComment('');
            }
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleReview = async () => {
        if (!reviewStatus) return;
        setReviewing(true);
        try {
            const res = await fetch(`/api/kaizen/suggestions/${id}?action=review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: reviewStatus,
                    notes: reviewNotes,
                }),
            });
            if (res.ok) {
                loadSuggestion();
                setReviewModalOpen(false);
            }
        } catch (err) {
            console.error('Error reviewing:', err);
        } finally {
            setReviewing(false);
        }
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Skeleton height={30} width={300} />
                <Skeleton height={100} />
                <Skeleton height={200} />
            </Stack>
        );
    }

    if (error || !suggestion) {
        return (
            <Stack gap="xl" align="center" py="xl">
                <ThemeIcon size={64} radius="xl" variant="light" color="red">
                    <IconBulb size={32} />
                </ThemeIcon>
                <Title order={3}>{error || 'Sugestão não encontrada'}</Title>
                <Button
                    component={Link}
                    href="/kaizen"
                    leftSection={<IconArrowLeft size={16} />}
                    variant="light"
                >
                    Voltar para Kaizen
                </Button>
            </Stack>
        );
    }

    const statusConfig = STATUS_CONFIG[suggestion.status] || STATUS_CONFIG.submitted;
    const problemConfig = PROBLEM_TYPES[suggestion.problemType] || PROBLEM_TYPES.other;
    const impactArea = IMPACT_AREAS[suggestion.impactArea] || IMPACT_AREAS.time;
    const impactLevel = IMPACT_LEVELS[suggestion.estimatedImpact] || IMPACT_LEVELS.medium;

    // Calculate vote percentage
    const totalVotes = suggestion.upvotes + suggestion.downvotes;
    const voteProgress = totalVotes > 0 ? (suggestion.upvotes / totalVotes) * 100 : 50;

    return (
        <Stack gap="xl">
            {/* Breadcrumbs */}
            <Breadcrumbs>
                <Anchor component={Link} href="/kaizen" size="sm">
                    Kaizen
                </Anchor>
                <Text size="sm" c="dimmed" lineClamp={1} maw={300}>
                    {suggestion.title}
                </Text>
            </Breadcrumbs>

            {/* Header with Vote */}
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                {/* Vote Section */}
                <Card shadow="xs" radius="md" p="md" withBorder>
                    <Stack align="center" gap="xs">
                        <ActionIcon
                            variant={suggestion.userVote === 1 ? 'filled' : 'light'}
                            color="green"
                            size="xl"
                            onClick={() => handleVote('up')}
                        >
                            <IconThumbUp size={24} />
                        </ActionIcon>
                        <Text
                            fw={700}
                            size="xl"
                            c={suggestion.netVotes > 0 ? 'green' : suggestion.netVotes < 0 ? 'red' : 'dimmed'}
                        >
                            {suggestion.netVotes > 0 ? '+' : ''}{suggestion.netVotes}
                        </Text>
                        <ActionIcon
                            variant={suggestion.userVote === -1 ? 'filled' : 'light'}
                            color="red"
                            size="xl"
                            onClick={() => handleVote('down')}
                        >
                            <IconThumbDown size={24} />
                        </ActionIcon>
                        <Text size="xs" c="dimmed">{totalVotes} votos</Text>
                    </Stack>
                </Card>

                {/* Title & Status */}
                <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="xs" wrap="wrap">
                        <Badge
                            color={statusConfig.color}
                            variant="filled"
                            size="lg"
                            leftSection={statusConfig.icon}
                        >
                            {statusConfig.label}
                        </Badge>
                        <Badge color={problemConfig.color} variant="light">
                            {problemConfig.label}
                        </Badge>
                        <Badge color={impactLevel.color} variant="dot">
                            Impacto {impactLevel.label}
                        </Badge>
                    </Group>
                    <Title order={2}>{suggestion.title}</Title>
                    <Group gap="lg">
                        <Group gap={4}>
                            <IconUser size={14} color="var(--mantine-color-dimmed)" />
                            <Text size="sm" c="dimmed">
                                {suggestion.isAnonymous ? 'Anônimo' : suggestion.submitterName}
                            </Text>
                        </Group>
                        <Group gap={4}>
                            <IconClock size={14} color="var(--mantine-color-dimmed)" />
                            <Text size="sm" c="dimmed">
                                {formatDateTime(suggestion.createdAt)}
                            </Text>
                        </Group>
                    </Group>
                </Stack>

                {/* Actions */}
                <Group>
                    {suggestion.isOwner && (
                        <Button
                            variant="light"
                            leftSection={<IconEdit size={16} />}
                        >
                            Editar
                        </Button>
                    )}
                    <Button
                        variant="filled"
                        color="yellow"
                        leftSection={<IconEye size={16} />}
                        onClick={() => setReviewModalOpen(true)}
                    >
                        Revisar
                    </Button>
                </Group>
            </Group>

            {/* Vote Progress */}
            <Paper p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Group gap={4}>
                        <IconThumbUp size={16} color="var(--mantine-color-green-6)" />
                        <Text size="sm" c="green">{suggestion.upvotes}</Text>
                    </Group>
                    <Text size="sm" c="dimmed">Apoio da comunidade</Text>
                    <Group gap={4}>
                        <Text size="sm" c="red">{suggestion.downvotes}</Text>
                        <IconThumbDown size={16} color="var(--mantine-color-red-6)" />
                    </Group>
                </Group>
                <Progress
                    value={voteProgress}
                    color="green"
                    size="lg"
                    radius="xl"
                    bg="red.2"
                />
            </Paper>

            {/* Description */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Text fw={500} mb="md">Descrição</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{suggestion.description}</Text>

                {suggestion.tags.length > 0 && (
                    <Group gap="xs" mt="md">
                        {suggestion.tags.map(tag => (
                            <Badge key={tag} variant="outline" size="sm">
                                {tag}
                            </Badge>
                        ))}
                    </Group>
                )}
            </Card>

            {/* Impact Area */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Group gap="lg">
                    <ThemeIcon size={48} radius="md" variant="light" color={impactLevel.color}>
                        {impactArea.icon}
                    </ThemeIcon>
                    <div>
                        <Text fw={500}>Área de Impacto: {impactArea.label}</Text>
                        <Text size="sm" c="dimmed">
                            Impacto estimado: {impactLevel.label}
                        </Text>
                    </div>
                </Group>
            </Card>

            {/* Review Notes (if reviewed) */}
            {suggestion.reviewNotes && (
                <Card shadow="xs" radius="md" p="lg" withBorder bg="yellow.0">
                    <Group gap="md" mb="sm">
                        <ThemeIcon size={32} radius="xl" variant="light" color="yellow">
                            <IconEye size={18} />
                        </ThemeIcon>
                        <div>
                            <Text fw={500}>Notas da Revisão</Text>
                            <Text size="xs" c="dimmed">
                                {suggestion.reviewedAt && formatDateTime(suggestion.reviewedAt)}
                            </Text>
                        </div>
                    </Group>
                    <Text>{suggestion.reviewNotes}</Text>
                </Card>
            )}

            <Divider />

            {/* Comments */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Group gap="xs">
                        <IconMessage size={20} />
                        <Text fw={500}>Discussão ({comments.length})</Text>
                    </Group>
                </Group>

                {comments.length === 0 ? (
                    <Text c="dimmed" ta="center" py="md">
                        Nenhum comentário ainda. Seja o primeiro!
                    </Text>
                ) : (
                    <Stack gap="md" mb="md">
                        {comments.map(comment => (
                            <Paper key={comment.id} p="sm" radius="md" withBorder>
                                <Group gap="sm" mb="xs">
                                    <Avatar size={28} radius="xl" color="blue">
                                        {comment.authorName[0]}
                                    </Avatar>
                                    <Text size="sm" fw={500}>{comment.authorName}</Text>
                                    <Text size="xs" c="dimmed">
                                        {formatDateTime(comment.createdAt)}
                                    </Text>
                                </Group>
                                <Text size="sm" ml={36}>{comment.content}</Text>
                            </Paper>
                        ))}
                    </Stack>
                )}

                {/* Add Comment */}
                <Group align="flex-end" gap="sm">
                    <Textarea
                        placeholder="Adicione um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        style={{ flex: 1 }}
                        minRows={2}
                    />
                    <Button
                        leftSection={<IconSend size={16} />}
                        onClick={handleAddComment}
                        loading={submittingComment}
                        disabled={!newComment.trim()}
                    >
                        Enviar
                    </Button>
                </Group>
            </Card>

            {/* Back */}
            <Button
                component={Link}
                href="/kaizen"
                leftSection={<IconArrowLeft size={16} />}
                variant="subtle"
            >
                Voltar para Kaizen
            </Button>

            {/* Review Modal */}
            <Modal
                opened={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                title="Revisar Sugestão"
                size="md"
            >
                <Stack gap="md">
                    <Select
                        label="Novo Status"
                        placeholder="Selecione o status"
                        data={[
                            { value: 'under_review', label: '👁️ Em Análise' },
                            { value: 'needs_info', label: '❓ Precisa de Mais Info' },
                            { value: 'approved', label: '✅ Aprovada' },
                            { value: 'in_progress', label: '🔥 Em Andamento' },
                            { value: 'implemented', label: '🎉 Implementada' },
                            { value: 'rejected', label: '❌ Rejeitada' },
                            { value: 'deferred', label: '⏸️ Adiada' },
                        ]}
                        value={reviewStatus}
                        onChange={setReviewStatus}
                        required
                    />
                    <Textarea
                        label="Notas da Revisão"
                        placeholder="Adicione notas sobre a decisão..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        minRows={3}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setReviewModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleReview}
                            loading={reviewing}
                            disabled={!reviewStatus}
                        >
                            Salvar Revisão
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
