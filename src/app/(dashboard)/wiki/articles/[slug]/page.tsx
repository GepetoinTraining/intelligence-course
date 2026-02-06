'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, Breadcrumbs, Anchor, ActionIcon, Divider,
    ThemeIcon, Skeleton, TypographyStylesProvider, Tooltip,
    Modal, Textarea
} from '@mantine/core';
import {
    IconFileText, IconEye, IconThumbUp, IconThumbDown,
    IconArrowLeft, IconEdit, IconClock, IconUser,
    IconTag, IconShare, IconBookmark, IconCheck
} from '@tabler/icons-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface WikiArticle {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    categoryId: string | null;
    status: string;
    tags: string[];
    viewCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
    authorId: string | null;
    createdAt: number;
    updatedAt: number;
    publishedAt: number | null;
    version: number;
}

const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
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

export default function WikiArticlePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [article, setArticle] = useState<WikiArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userFeedback, setUserFeedback] = useState<boolean | null>(null);
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackComment, setFeedbackComment] = useState('');

    useEffect(() => {
        loadArticle();
    }, [slug]);

    const loadArticle = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/wiki/articles/${slug}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Artigo não encontrado');
                } else {
                    setError('Erro ao carregar artigo');
                }
                return;
            }
            const data = await res.json();
            setArticle(data.data);
            if (data.meta?.userFeedback) {
                setUserFeedback(data.meta.userFeedback.isHelpful);
                setFeedbackSent(true);
            }
        } catch (err) {
            console.error('Error loading article:', err);
            setError('Erro ao carregar artigo');
        } finally {
            setLoading(false);
        }
    };

    const sendFeedback = async (isHelpful: boolean, comment?: string) => {
        try {
            const res = await fetch(`/api/wiki/articles/${slug}?action=feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isHelpful, comment }),
            });
            if (res.ok) {
                setUserFeedback(isHelpful);
                setFeedbackSent(true);
                // Update local counts
                if (article) {
                    setArticle({
                        ...article,
                        helpfulCount: article.helpfulCount + (isHelpful ? 1 : 0),
                        notHelpfulCount: article.notHelpfulCount + (!isHelpful ? 1 : 0),
                    });
                }
            }
        } catch (err) {
            console.error('Error sending feedback:', err);
        }
    };

    const handleFeedback = (isHelpful: boolean) => {
        if (!isHelpful) {
            setFeedbackModalOpen(true);
        } else {
            sendFeedback(true);
        }
    };

    const submitNegativeFeedback = () => {
        sendFeedback(false, feedbackComment);
        setFeedbackModalOpen(false);
        setFeedbackComment('');
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Skeleton height={30} width={400} />
                <Skeleton height={60} />
                <Skeleton height={400} />
            </Stack>
        );
    }

    if (error || !article) {
        return (
            <Stack gap="xl" align="center" py="xl">
                <ThemeIcon size={64} radius="xl" variant="light" color="red">
                    <IconFileText size={32} />
                </ThemeIcon>
                <Title order={3}>{error || 'Artigo não encontrado'}</Title>
                <Button
                    component={Link}
                    href="/wiki"
                    leftSection={<IconArrowLeft size={16} />}
                    variant="light"
                >
                    Voltar para Wiki
                </Button>
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Breadcrumbs */}
            <Breadcrumbs>
                <Anchor component={Link} href="/wiki" size="sm">
                    Wiki
                </Anchor>
                <Text size="sm" c="dimmed">{article.title}</Text>
            </Breadcrumbs>

            {/* Article Header */}
            <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1 }}>
                    <Group gap="xs" mb="xs">
                        <Badge
                            color={article.status === 'published' ? 'green' : 'gray'}
                            variant="light"
                        >
                            {article.status === 'published' ? 'Publicado' : article.status}
                        </Badge>
                        <Text size="xs" c="dimmed">v{article.version}</Text>
                    </Group>
                    <Title order={2}>{article.title}</Title>
                    {article.summary && (
                        <Text c="dimmed" mt="xs" size="lg">{article.summary}</Text>
                    )}
                </div>
                <Group>
                    <Button
                        component={Link}
                        href={`/wiki/articles/${slug}/edit`}
                        leftSection={<IconEdit size={16} />}
                        variant="light"
                    >
                        Editar
                    </Button>
                </Group>
            </Group>

            {/* Metadata */}
            <Group gap="lg">
                <Tooltip label="Visualizações">
                    <Group gap={4}>
                        <IconEye size={16} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed">{article.viewCount}</Text>
                    </Group>
                </Tooltip>
                <Tooltip label="Acharam útil">
                    <Group gap={4}>
                        <IconThumbUp size={16} color="var(--mantine-color-green-6)" />
                        <Text size="sm" c="green">{article.helpfulCount}</Text>
                    </Group>
                </Tooltip>
                <Divider orientation="vertical" />
                <Group gap={4}>
                    <IconClock size={16} color="var(--mantine-color-dimmed)" />
                    <Text size="sm" c="dimmed">Atualizado em {formatDateTime(article.updatedAt)}</Text>
                </Group>
            </Group>

            {/* Tags */}
            {article.tags.length > 0 && (
                <Group gap="xs">
                    <IconTag size={16} color="var(--mantine-color-dimmed)" />
                    {article.tags.map(tag => (
                        <Badge key={tag} variant="outline" size="sm">
                            {tag}
                        </Badge>
                    ))}
                </Group>
            )}

            <Divider />

            {/* Article Content */}
            <Paper p="xl" radius="md" withBorder>
                <TypographyStylesProvider>
                    <div className="wiki-content">
                        <ReactMarkdown>{article.content}</ReactMarkdown>
                    </div>
                </TypographyStylesProvider>
            </Paper>

            {/* Feedback */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Stack align="center" gap="md">
                    <Text fw={500}>Este artigo foi útil?</Text>

                    {feedbackSent ? (
                        <Group gap="md">
                            <ThemeIcon size={48} radius="xl" variant="light" color="green">
                                <IconCheck size={24} />
                            </ThemeIcon>
                            <Text c="dimmed">
                                Obrigado pelo feedback!
                            </Text>
                        </Group>
                    ) : (
                        <Group gap="md">
                            <Button
                                variant={userFeedback === true ? 'filled' : 'light'}
                                color="green"
                                leftSection={<IconThumbUp size={18} />}
                                onClick={() => handleFeedback(true)}
                            >
                                Sim, foi útil
                            </Button>
                            <Button
                                variant={userFeedback === false ? 'filled' : 'light'}
                                color="red"
                                leftSection={<IconThumbDown size={18} />}
                                onClick={() => handleFeedback(false)}
                            >
                                Não foi útil
                            </Button>
                        </Group>
                    )}
                </Stack>
            </Card>

            {/* Back button */}
            <Button
                component={Link}
                href="/wiki"
                leftSection={<IconArrowLeft size={16} />}
                variant="subtle"
            >
                Voltar para Wiki
            </Button>

            {/* Negative Feedback Modal */}
            <Modal
                opened={feedbackModalOpen}
                onClose={() => setFeedbackModalOpen(false)}
                title="Como podemos melhorar?"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Nos ajude a melhorar este artigo. O que está faltando?
                    </Text>
                    <Textarea
                        placeholder="Descreva o que poderia ser melhor..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        minRows={3}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setFeedbackModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={submitNegativeFeedback}>
                            Enviar Feedback
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
