'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, Breadcrumbs, Anchor, ThemeIcon, Skeleton,
    SimpleGrid, ActionIcon, Tooltip
} from '@mantine/core';
import {
    IconFolder, IconFileText, IconPlus, IconArrowLeft,
    IconEye, IconThumbUp, IconChevronRight, IconEdit
} from '@tabler/icons-react';
import Link from 'next/link';

interface WikiCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    color: string;
    parentId: string | null;
}

interface WikiArticle {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    status: string;
    tags: string[];
    viewCount: number;
    helpfulCount: number;
    updatedAt: number;
}

const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
        draft: { color: 'gray', label: 'Rascunho' },
        review: { color: 'yellow', label: 'Em Revisão' },
        published: { color: 'green', label: 'Publicado' },
    };
    const config = configs[status] || { color: 'gray', label: status };
    return <Badge color={config.color} variant="light" size="sm">{config.label}</Badge>;
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
};

export default function WikiCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const categorySlug = params.category as string;

    const [category, setCategory] = useState<WikiCategory | null>(null);
    const [subcategories, setSubcategories] = useState<WikiCategory[]>([]);
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategoryData();
    }, [categorySlug]);

    const loadCategoryData = async () => {
        setLoading(true);
        try {
            // Load all categories
            const catRes = await fetch('/api/wiki/categories');
            if (catRes.ok) {
                const catData = await catRes.json();
                const allCategories = catData.data || [];

                // Find current category
                const current = allCategories.find(
                    (c: WikiCategory) => c.slug === categorySlug
                );
                setCategory(current || null);

                // Find subcategories
                if (current) {
                    const subs = allCategories.filter(
                        (c: WikiCategory) => c.parentId === current.id
                    );
                    setSubcategories(subs);

                    // Load articles for this category
                    const artRes = await fetch(`/api/wiki/articles?categoryId=${current.id}`);
                    if (artRes.ok) {
                        const artData = await artRes.json();
                        setArticles(artData.data || []);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading category:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Skeleton height={30} width={200} />
                <Skeleton height={60} />
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={100} radius="md" />
                    ))}
                </SimpleGrid>
            </Stack>
        );
    }

    if (!category) {
        return (
            <Stack gap="xl" align="center" py="xl">
                <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                    <IconFolder size={32} />
                </ThemeIcon>
                <Title order={3}>Categoria não encontrada</Title>
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
                <Text size="sm" c="dimmed">{category.name}</Text>
            </Breadcrumbs>

            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                    <ThemeIcon size={56} radius="md" variant="light" color={category.color}>
                        <IconFolder size={28} />
                    </ThemeIcon>
                    <div>
                        <Title order={2}>{category.name}</Title>
                        {category.description && (
                            <Text c="dimmed" mt={4}>{category.description}</Text>
                        )}
                    </div>
                </Group>
                <Group>
                    <Button
                        component={Link}
                        href={`/wiki/new?categoryId=${category.id}`}
                        leftSection={<IconPlus size={16} />}
                    >
                        Novo Artigo
                    </Button>
                </Group>
            </Group>

            {/* Subcategories */}
            {subcategories.length > 0 && (
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Text fw={600} mb="md">Subcategorias</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                        {subcategories.map(sub => (
                            <Paper
                                key={sub.id}
                                p="md"
                                radius="md"
                                withBorder
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push(`/wiki/categories/${sub.slug}`)}
                            >
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <ThemeIcon size={32} radius="md" variant="light" color={sub.color}>
                                            <IconFolder size={16} />
                                        </ThemeIcon>
                                        <Text fw={500}>{sub.name}</Text>
                                    </Group>
                                    <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
                                </Group>
                            </Paper>
                        ))}
                    </SimpleGrid>
                </Card>
            )}

            {/* Articles */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Artigos ({articles.length})</Text>
                </Group>

                {articles.length === 0 ? (
                    <Paper p="xl" radius="md" withBorder ta="center">
                        <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                            <IconFileText size={24} />
                        </ThemeIcon>
                        <Text c="dimmed" mb="md">Nenhum artigo nesta categoria</Text>
                        <Button
                            component={Link}
                            href={`/wiki/new?categoryId=${category.id}`}
                            leftSection={<IconPlus size={16} />}
                            variant="light"
                        >
                            Criar Primeiro Artigo
                        </Button>
                    </Paper>
                ) : (
                    <Stack gap="sm">
                        {articles.map(article => (
                            <Paper
                                key={article.id}
                                p="md"
                                radius="md"
                                withBorder
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push(`/wiki/articles/${article.slug}`)}
                            >
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="md" style={{ flex: 1, overflow: 'hidden' }}>
                                        <ThemeIcon size={36} radius="md" variant="light" color="blue">
                                            <IconFileText size={18} />
                                        </ThemeIcon>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text fw={500} lineClamp={1}>{article.title}</Text>
                                            {article.summary && (
                                                <Text size="sm" c="dimmed" lineClamp={1}>
                                                    {article.summary}
                                                </Text>
                                            )}
                                            <Group gap="xs" mt={4}>
                                                {getStatusBadge(article.status)}
                                                {article.tags.slice(0, 2).map(tag => (
                                                    <Badge key={tag} variant="outline" size="xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        </div>
                                    </Group>
                                    <Group gap="md">
                                        <Tooltip label="Visualizações">
                                            <Group gap={4}>
                                                <IconEye size={14} color="var(--mantine-color-dimmed)" />
                                                <Text size="sm" c="dimmed">{article.viewCount}</Text>
                                            </Group>
                                        </Tooltip>
                                        <Tooltip label="Acharam útil">
                                            <Group gap={4}>
                                                <IconThumbUp size={14} color="var(--mantine-color-green-6)" />
                                                <Text size="sm" c="green">{article.helpfulCount}</Text>
                                            </Group>
                                        </Tooltip>
                                        <Text size="xs" c="dimmed">{formatDate(article.updatedAt)}</Text>
                                    </Group>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
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
        </Stack>
    );
}
