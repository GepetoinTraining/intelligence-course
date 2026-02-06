'use client';

import { useState, useEffect } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, TextInput, Loader, Center,
    ThemeIcon, Accordion, ActionIcon, Tooltip, Menu,
    Breadcrumbs, Anchor, Skeleton
} from '@mantine/core';
import {
    IconBook, IconSearch, IconPlus, IconFolder,
    IconFileText, IconEye, IconThumbUp, IconThumbDown,
    IconChevronRight, IconDots, IconEdit, IconTrash,
    IconStar, IconClock, IconFolderOpen
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WikiCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    color: string;
    parentId: string | null;
    visibility: string;
}

interface WikiArticle {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    categoryId: string | null;
    status: string;
    tags: string[];
    viewCount: number;
    helpfulCount: number;
    createdAt: number;
    updatedAt: number;
    publishedAt: number | null;
}

const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
        draft: { color: 'gray', label: 'Rascunho' },
        review: { color: 'yellow', label: 'Em Revisão' },
        published: { color: 'green', label: 'Publicado' },
        archived: { color: 'red', label: 'Arquivado' },
    };
    const config = configs[status] || { color: 'gray', label: status };
    return <Badge color={config.color} variant="light" size="sm">{config.label}</Badge>;
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function WikiPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<WikiCategory[]>([]);
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [recentArticles, setRecentArticles] = useState<WikiArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catRes, artRes, recentRes] = await Promise.all([
                fetch('/api/wiki/categories'),
                fetch('/api/wiki/articles?limit=10'),
                fetch('/api/wiki/articles?limit=5'),
            ]);

            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData.data || []);
            }

            if (artRes.ok) {
                const artData = await artRes.json();
                setArticles(artData.data || []);
            }

            if (recentRes.ok) {
                const recentData = await recentRes.json();
                setRecentArticles(recentData.data || []);
            }
        } catch (error) {
            console.error('Error loading wiki data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/wiki/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    // Build category tree
    const rootCategories = categories.filter(c => !c.parentId);
    const getChildCategories = (parentId: string) =>
        categories.filter(c => c.parentId === parentId);

    // Group articles by category
    const articlesByCategory = articles.reduce((acc, article) => {
        const catId = article.categoryId || 'uncategorized';
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(article);
        return acc;
    }, {} as Record<string, WikiArticle[]>);

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>📚 Base de Conhecimento</Title>
                        <Text c="dimmed">Carregando...</Text>
                    </div>
                </Group>
                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} height={120} radius="md" />
                    ))}
                </SimpleGrid>
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>📚 Base de Conhecimento</Title>
                    <Text c="dimmed">Documentação interna e procedimentos</Text>
                </div>
                <Group>
                    <Button
                        component={Link}
                        href="/wiki/new"
                        leftSection={<IconPlus size={16} />}
                        variant="filled"
                    >
                        Novo Artigo
                    </Button>
                </Group>
            </Group>

            {/* Search */}
            <form onSubmit={handleSearch}>
                <TextInput
                    placeholder="Buscar artigos..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="md"
                    radius="md"
                />
            </form>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="violet">
                            <IconFolder size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{categories.length}</Text>
                            <Text size="sm" c="dimmed">Categorias</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="blue">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{articles.length}</Text>
                            <Text size="sm" c="dimmed">Artigos</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="green">
                            <IconEye size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>
                                {articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)}
                            </Text>
                            <Text size="sm" c="dimmed">Visualizações</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="teal">
                            <IconThumbUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>
                                {articles.reduce((sum, a) => sum + (a.helpfulCount || 0), 0)}
                            </Text>
                            <Text size="sm" c="dimmed">Úteis</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Main Content */}
            <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
                {/* Categories */}
                <Card shadow="xs" radius="md" p="lg" withBorder style={{ gridColumn: 'span 2' }}>
                    <Group justify="space-between" mb="md">
                        <Text fw={600} size="lg">Categorias</Text>
                        <Button
                            variant="subtle"
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            component={Link}
                            href="/wiki/categories/new"
                        >
                            Nova Categoria
                        </Button>
                    </Group>

                    {categories.length === 0 ? (
                        <Center py="xl">
                            <Stack align="center" gap="xs">
                                <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                                    <IconFolderOpen size={24} />
                                </ThemeIcon>
                                <Text c="dimmed">Nenhuma categoria criada ainda</Text>
                                <Button
                                    variant="light"
                                    size="sm"
                                    component={Link}
                                    href="/wiki/categories/new"
                                >
                                    Criar Primeira Categoria
                                </Button>
                            </Stack>
                        </Center>
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            {rootCategories.map(category => {
                                const childCats = getChildCategories(category.id);
                                const categoryArticles = articlesByCategory[category.id] || [];

                                return (
                                    <Paper
                                        key={category.id}
                                        p="md"
                                        radius="md"
                                        withBorder
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/wiki/categories/${category.slug}`)}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="sm">
                                                <ThemeIcon
                                                    size={36}
                                                    radius="md"
                                                    variant="light"
                                                    color={category.color}
                                                >
                                                    <IconFolder size={18} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={500}>{category.name}</Text>
                                                    <Text size="xs" c="dimmed">
                                                        {categoryArticles.length} artigos
                                                        {childCats.length > 0 && ` • ${childCats.length} subcategorias`}
                                                    </Text>
                                                </div>
                                            </Group>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconChevronRight size={16} />
                                            </ActionIcon>
                                        </Group>
                                        {category.description && (
                                            <Text size="sm" c="dimmed" lineClamp={2}>
                                                {category.description}
                                            </Text>
                                        )}
                                    </Paper>
                                );
                            })}
                        </SimpleGrid>
                    )}
                </Card>

                {/* Recent Articles */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="md">
                        <Group gap="xs">
                            <IconClock size={18} />
                            <Text fw={600}>Recentes</Text>
                        </Group>
                    </Group>

                    {recentArticles.length === 0 ? (
                        <Center py="xl">
                            <Stack align="center" gap="xs">
                                <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                                    <IconFileText size={24} />
                                </ThemeIcon>
                                <Text c="dimmed" size="sm">Nenhum artigo ainda</Text>
                            </Stack>
                        </Center>
                    ) : (
                        <Stack gap="sm">
                            {recentArticles.map(article => (
                                <Paper
                                    key={article.id}
                                    p="sm"
                                    radius="md"
                                    withBorder
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => router.push(`/wiki/articles/${article.slug}`)}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <Text size="sm" fw={500} lineClamp={1}>
                                                {article.title}
                                            </Text>
                                            <Group gap="xs" mt={4}>
                                                {getStatusBadge(article.status)}
                                                <Text size="xs" c="dimmed">
                                                    {formatDate(article.updatedAt)}
                                                </Text>
                                            </Group>
                                        </div>
                                        <Group gap="xs">
                                            <Tooltip label="Visualizações">
                                                <Badge variant="light" color="gray" size="sm">
                                                    <Group gap={4}>
                                                        <IconEye size={12} />
                                                        {article.viewCount}
                                                    </Group>
                                                </Badge>
                                            </Tooltip>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Card>
            </SimpleGrid>

            {/* All Articles */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">Todos os Artigos</Text>
                    <Button
                        variant="light"
                        size="xs"
                        component={Link}
                        href="/wiki/articles"
                    >
                        Ver Todos
                    </Button>
                </Group>

                {articles.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="md">
                            <ThemeIcon size={64} radius="xl" variant="light" color="violet">
                                <IconBook size={32} />
                            </ThemeIcon>
                            <Text c="dimmed">Nenhum artigo criado ainda</Text>
                            <Text size="sm" c="dimmed" ta="center" maw={400}>
                                Comece criando sua primeira base de conhecimento.
                                Documente processos, procedimentos e informações importantes.
                            </Text>
                            <Button
                                component={Link}
                                href="/wiki/new"
                                leftSection={<IconPlus size={16} />}
                            >
                                Criar Primeiro Artigo
                            </Button>
                        </Stack>
                    </Center>
                ) : (
                    <Stack gap="sm">
                        {articles.slice(0, 10).map(article => (
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
                                                {article.tags.slice(0, 3).map(tag => (
                                                    <Badge
                                                        key={tag}
                                                        variant="outline"
                                                        size="xs"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        </div>
                                    </Group>
                                    <Group gap="md">
                                        <Stack gap={2} align="center">
                                            <Text size="sm" fw={500}>{article.viewCount}</Text>
                                            <Text size="xs" c="dimmed">views</Text>
                                        </Stack>
                                        <Stack gap={2} align="center">
                                            <Text size="sm" fw={500} c="green">{article.helpfulCount}</Text>
                                            <Text size="xs" c="dimmed">úteis</Text>
                                        </Stack>
                                        <Text size="xs" c="dimmed">
                                            {formatDate(article.updatedAt)}
                                        </Text>
                                    </Group>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Card>
        </Stack>
    );
}

