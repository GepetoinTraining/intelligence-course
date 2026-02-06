'use client';

import { useState, useEffect } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, TextInput, Loader, Center, ThemeIcon, ActionIcon,
    Tooltip, Table, Select, Pagination, Skeleton
} from '@mantine/core';
import {
    IconSearch, IconPlus, IconFileText, IconEye,
    IconThumbUp, IconEdit, IconArrowLeft, IconFilter
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface WikiArticle {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    categoryId: string | null;
    categoryName?: string;
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

export default function WikiArticlesPage() {
    const router = useRouter();
    const [articles, setArticles] = useState<WikiArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        loadArticles();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/wiki/articles?limit=100');
            if (res.ok) {
                const data = await res.json();
                setArticles(data.data || []);
            }
        } catch (error) {
            console.error('Error loading articles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter articles
    const filteredArticles = articles.filter(article => {
        const matchesSearch = !searchQuery ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || article.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Paginate
    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const paginatedArticles = filteredArticles.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>📄 Todos os Artigos</Title>
                        <Text c="dimmed">Carregando...</Text>
                    </div>
                </Group>
                <Stack gap="sm">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} height={60} radius="md" />
                    ))}
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <ActionIcon
                        variant="subtle"
                        size="lg"
                        onClick={() => router.push('/wiki')}
                    >
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                    <div>
                        <Title order={2}>📄 Todos os Artigos</Title>
                        <Text c="dimmed">{articles.length} artigos na base de conhecimento</Text>
                    </div>
                </Group>
                <Button
                    component={Link}
                    href="/wiki/new"
                    leftSection={<IconPlus size={16} />}
                    variant="filled"
                >
                    Novo Artigo
                </Button>
            </Group>

            {/* Filters */}
            <Group>
                <TextInput
                    placeholder="Buscar artigos..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                    }}
                    style={{ flex: 1 }}
                />
                <Select
                    placeholder="Status"
                    leftSection={<IconFilter size={16} />}
                    data={[
                        { value: 'draft', label: 'Rascunho' },
                        { value: 'review', label: 'Em Revisão' },
                        { value: 'published', label: 'Publicado' },
                        { value: 'archived', label: 'Arquivado' },
                    ]}
                    value={statusFilter}
                    onChange={(val) => {
                        setStatusFilter(val);
                        setPage(1);
                    }}
                    clearable
                    w={150}
                />
            </Group>

            {/* Articles Table */}
            <Card shadow="xs" radius="md" p={0} withBorder>
                {paginatedArticles.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="md">
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                                <IconFileText size={32} />
                            </ThemeIcon>
                            <Text c="dimmed">
                                {searchQuery || statusFilter
                                    ? 'Nenhum artigo encontrado com esses filtros'
                                    : 'Nenhum artigo criado ainda'
                                }
                            </Text>
                            {!searchQuery && !statusFilter && (
                                <Button
                                    component={Link}
                                    href="/wiki/new"
                                    leftSection={<IconPlus size={16} />}
                                >
                                    Criar Primeiro Artigo
                                </Button>
                            )}
                        </Stack>
                    </Center>
                ) : (
                    <Table.ScrollContainer minWidth={800}>
                        <Table highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Título</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th>Tags</Table.Th>
                                    <Table.Th style={{ textAlign: 'center' }}>Views</Table.Th>
                                    <Table.Th style={{ textAlign: 'center' }}>Úteis</Table.Th>
                                    <Table.Th>Atualizado</Table.Th>
                                    <Table.Th></Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {paginatedArticles.map(article => (
                                    <Table.Tr
                                        key={article.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/wiki/articles/${article.slug}`)}
                                    >
                                        <Table.Td>
                                            <Group gap="sm">
                                                <ThemeIcon size={32} radius="md" variant="light" color="blue">
                                                    <IconFileText size={16} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={500} lineClamp={1}>{article.title}</Text>
                                                    {article.summary && (
                                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                                            {article.summary}
                                                        </Text>
                                                    )}
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>{getStatusBadge(article.status)}</Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {article.tags.slice(0, 2).map(tag => (
                                                    <Badge key={tag} variant="outline" size="xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {article.tags.length > 2 && (
                                                    <Badge variant="light" size="xs" color="gray">
                                                        +{article.tags.length - 2}
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            <Group gap={4} justify="center">
                                                <IconEye size={14} />
                                                {article.viewCount}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td style={{ textAlign: 'center' }}>
                                            <Group gap={4} justify="center">
                                                <IconThumbUp size={14} />
                                                {article.helpfulCount}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {formatDate(article.updatedAt)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Tooltip label="Editar">
                                                <ActionIcon
                                                    variant="subtle"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/wiki/articles/${article.slug}/edit`);
                                                    }}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Group justify="center">
                    <Pagination
                        total={totalPages}
                        value={page}
                        onChange={setPage}
                    />
                </Group>
            )}
        </Stack>
    );
}
