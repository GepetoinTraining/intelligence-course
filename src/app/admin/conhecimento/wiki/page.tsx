'use client';

import { useState, useCallback, useMemo } from 'react';
import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Table,
    Loader,
    Alert,
    Center,
    TextInput,
    Tabs,
    ActionIcon,
    Tooltip,
    Paper,
    Divider,
    TypographyStylesProvider,
    Select,
    Skeleton,
    CloseButton,
    Modal,
    Textarea,
} from '@mantine/core';
import {
    IconBook,
    IconPlus,
    IconSearch,
    IconEye,
    IconAlertCircle,
    IconX,
    IconChartDots,
    IconThumbUp,
    IconCategory,
    IconCode,
    IconLink,
    IconFileText,
    IconFilter,
    IconChevronRight,
    IconArticle,
} from '@tabler/icons-react';
import { useApi, useCreate } from '@/hooks/useApi';
import { useDisclosure } from '@mantine/hooks';
import { DiagramToggle } from '@/components/DiagramToggle';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

interface WikiArticle {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content?: string;
    categoryId: string | null;
    status: 'draft' | 'review' | 'published' | 'archived';
    viewCount: number;
    helpfulCount: number;
    notHelpfulCount?: number;
    tags: string[];
    mermaidSyntax?: string | null;
    mermaidType?: string | null;
    codeSnippet?: string | null;
    codeLanguage?: string | null;
    relatedArticleIds?: string[];
    linkedProcedureId?: string | null;
    authorId: string | null;
    createdAt: number;
    updatedAt: number;
    publishedAt?: number | null;
}

interface WikiCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string;
    color: string;
    parentId: string | null;
}

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

function formatRelativeTime(timestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
    return formatDate(timestamp);
}

const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'blue' },
    review: { label: 'Em Revisão', color: 'yellow' },
    published: { label: 'Publicado', color: 'green' },
    archived: { label: 'Arquivado', color: 'gray' },
};

// ────────────────────────────────────────────────────────────────────
// Article Detail Panel
// ────────────────────────────────────────────────────────────────────

function ArticleDetail({
    slug,
    onClose,
    onOpenRelated,
}: {
    slug: string;
    onClose: () => void;
    onOpenRelated: (slug: string) => void;
}) {
    const { data: article, isLoading, error } = useApi<WikiArticle>(
        `/api/wiki/articles/${slug}`
    );

    if (isLoading) {
        return (
            <Stack gap="md" p="md">
                <Skeleton h={24} w="60%" />
                <Skeleton h={14} w="40%" />
                <Skeleton h={200} />
            </Stack>
        );
    }

    if (error || !article) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} color="red" m="md">
                Erro ao carregar artigo: {error || 'Não encontrado'}
            </Alert>
        );
    }

    const relatedIds: string[] = article.relatedArticleIds || [];

    return (
        <Stack gap="md" p="md">
            {/* Header */}
            <Group justify="space-between" wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Title order={3}>{article.title}</Title>
                    {article.summary && (
                        <Text size="sm" c="dimmed" mt={4}>{article.summary}</Text>
                    )}
                </div>
                <Group gap="xs">
                    {article.mermaidSyntax && (
                        <DiagramToggle
                            route={`/api/wiki/articles/${slug}`}
                            data={article}
                            forceType={(article.mermaidType as any) || 'mindmap'}
                        />
                    )}
                    <CloseButton onClick={onClose} />
                </Group>
            </Group>

            {/* Metadata */}
            <Group gap="xs">
                <Badge color={statusMap[article.status]?.color || 'gray'} variant="light">
                    {statusMap[article.status]?.label || article.status}
                </Badge>
                <Badge variant="dot" color="gray" leftSection={<IconEye size={12} />}>
                    {article.viewCount} views
                </Badge>
                <Badge variant="dot" color="teal" leftSection={<IconThumbUp size={12} />}>
                    {article.helpfulCount} útil
                </Badge>
                {article.tags?.map((tag, i) => (
                    <Badge key={i} variant="outline" size="xs">{tag}</Badge>
                ))}
            </Group>

            <Divider />

            {/* Content */}
            <TypographyStylesProvider>
                <div
                    dangerouslySetInnerHTML={{ __html: article.content || '<p>Sem conteúdo</p>' }}
                    style={{ maxWidth: '100%', overflow: 'hidden' }}
                />
            </TypographyStylesProvider>

            {/* Code Snippet */}
            {article.codeSnippet && (
                <>
                    <Divider label="Código" labelPosition="center" />
                    <Paper bg="dark.8" p="md" radius="md" style={{ overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 13 }}>
                            <code>{article.codeSnippet}</code>
                        </pre>
                    </Paper>
                </>
            )}

            {/* Related Articles */}
            {relatedIds.length > 0 && (
                <>
                    <Divider label="🔗 Conexões" labelPosition="center" />
                    <Group gap="xs">
                        {relatedIds.map((relSlug) => (
                            <Button
                                key={relSlug}
                                variant="light"
                                size="xs"
                                leftSection={<IconLink size={14} />}
                                onClick={() => onOpenRelated(relSlug)}
                            >
                                {relSlug}
                            </Button>
                        ))}
                    </Group>
                </>
            )}

            {/* Linked Procedure */}
            {article.linkedProcedureId && (
                <Paper withBorder p="sm" radius="md">
                    <Group gap="xs">
                        <IconFileText size={16} color="var(--mantine-color-orange-5)" />
                        <Text size="sm" c="dimmed">
                            Vinculado ao POP: <strong>{article.linkedProcedureId}</strong>
                        </Text>
                    </Group>
                </Paper>
            )}

            {/* Footer */}
            <Text size="xs" c="dimmed" ta="right">
                Atualizado em {formatDate(article.updatedAt)}
                {article.publishedAt && ` · Publicado em ${formatDate(article.publishedAt)}`}
            </Text>
        </Stack>
    );
}

// ────────────────────────────────────────────────────────────────────
// Create Article Modal
// ────────────────────────────────────────────────────────────────────

function CreateArticleModal({
    opened,
    onClose,
    onCreated,
}: {
    opened: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const { create, isLoading, error } = useCreate<any, WikiArticle>('/api/wiki/articles');

    const slug = useMemo(
        () => title.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        [title]
    );

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) return;
        const result = await create({ title, slug, content, summary: summary || undefined });
        if (result) {
            setTitle(''); setContent(''); setSummary('');
            onCreated();
            onClose();
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Novo Artigo Wiki" size="lg">
            <Stack gap="md">
                <TextInput
                    label="Título"
                    placeholder="Ex: Como usar o sistema de matrículas"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    required
                />
                <TextInput
                    label="Slug"
                    value={slug}
                    disabled
                    description="Gerado automaticamente do título"
                />
                <TextInput
                    label="Resumo"
                    placeholder="Breve descrição para previews"
                    value={summary}
                    onChange={(e) => setSummary(e.currentTarget.value)}
                />
                <Textarea
                    label="Conteúdo (Markdown)"
                    placeholder="Escreva o conteúdo do artigo aqui..."
                    value={content}
                    onChange={(e) => setContent(e.currentTarget.value)}
                    minRows={8}
                    autosize
                    required
                />
                {error && (
                    <Alert color="red" icon={<IconAlertCircle size={16} />}>
                        {error}
                    </Alert>
                )}
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} loading={isLoading} disabled={!title || !content}>
                        Criar Artigo
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

// ────────────────────────────────────────────────────────────────────
// Main Wiki Page — Tabbed Research Workspace
// ────────────────────────────────────────────────────────────────────

export default function WikiPage() {
    // ── Data fetching ──
    const { data: articles, isLoading, error, refetch } = useApi<WikiArticle[]>('/api/wiki/articles');
    const { data: categories } = useApi<WikiCategory[]>('/api/wiki/categories');

    // ── UI state ──
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [openTabs, setOpenTabs] = useState<{ slug: string; title: string }[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('list');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);

    // ── Filtering ──
    const filteredArticles = useMemo(() => {
        if (!articles) return [];
        return articles.filter((a) => {
            if (search) {
                const q = search.toLowerCase();
                if (!a.title.toLowerCase().includes(q) &&
                    !(a.summary || '').toLowerCase().includes(q) &&
                    !a.tags?.some(t => t.toLowerCase().includes(q))) {
                    return false;
                }
            }
            if (statusFilter && a.status !== statusFilter) return false;
            if (categoryFilter && a.categoryId !== categoryFilter) return false;
            return true;
        });
    }, [articles, search, statusFilter, categoryFilter]);

    // ── Tab management ──
    const openArticle = useCallback((slug: string, title: string) => {
        setOpenTabs(prev => {
            if (prev.some(t => t.slug === slug)) {
                setActiveTab(slug);
                return prev;
            }
            return [...prev, { slug, title }];
        });
        setActiveTab(slug);
    }, []);

    const closeTab = useCallback((slug: string) => {
        setOpenTabs(prev => prev.filter(t => t.slug !== slug));
        setActiveTab(at => at === slug ? 'list' : at);
    }, []);

    // ── Stats ──
    const stats = {
        total: articles?.length || 0,
        published: articles?.filter(a => a.status === 'published').length || 0,
        totalViews: articles?.reduce((sum, a) => sum + (a.viewCount || 0), 0) || 0,
        categories: categories?.length || 0,
    };

    // ── Loading state ──
    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Conhecimento</Text>
                    <Title order={2}>📖 Wiki</Title>
                </div>
                <Group gap="xs">
                    <DiagramToggle
                        route="/api/wiki/articles"
                        data={articles || []}
                        forceType="mindmap"
                    />
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                        Novo Artigo
                    </Button>
                </Group>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Artigos</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconArticle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Publicados</Text>
                            <Text fw={700} size="lg">{stats.published}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconEye size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Visualizações</Text>
                            <Text fw={700} size="lg">{stats.totalViews}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg">
                            <IconCategory size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Categorias</Text>
                            <Text fw={700} size="lg">{stats.categories}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Tabbed Workspace */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab
                        value="list"
                        leftSection={<IconBook size={14} />}
                    >
                        Todos os Artigos
                    </Tabs.Tab>
                    {openTabs.map((tab) => (
                        <Tabs.Tab
                            key={tab.slug}
                            value={tab.slug}
                            rightSection={
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.slug);
                                    }}
                                >
                                    <IconX size={12} />
                                </ActionIcon>
                            }
                        >
                            {tab.title.length > 25 ? tab.title.slice(0, 25) + '…' : tab.title}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>

                {/* ── List Panel ── */}
                <Tabs.Panel value="list" pt="md">
                    <Stack gap="md">
                        {/* Filters */}
                        <Group gap="sm">
                            <TextInput
                                placeholder="Buscar artigos..."
                                leftSection={<IconSearch size={16} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                                style={{ flex: 1, minWidth: 200 }}
                            />
                            <Select
                                placeholder="Status"
                                data={[
                                    { value: 'published', label: 'Publicado' },
                                    { value: 'draft', label: 'Rascunho' },
                                    { value: 'review', label: 'Em Revisão' },
                                    { value: 'archived', label: 'Arquivado' },
                                ]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                clearable
                                leftSection={<IconFilter size={14} />}
                                w={160}
                            />
                            {categories && categories.length > 0 && (
                                <Select
                                    placeholder="Categoria"
                                    data={categories.map(c => ({ value: c.id, label: c.name }))}
                                    value={categoryFilter}
                                    onChange={setCategoryFilter}
                                    clearable
                                    leftSection={<IconCategory size={14} />}
                                    w={180}
                                />
                            )}
                        </Group>

                        {/* Articles Table */}
                        <Card withBorder p={0}>
                            {filteredArticles.length > 0 ? (
                                <Table highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Título</Table.Th>
                                            <Table.Th>Tags</Table.Th>
                                            <Table.Th>Views</Table.Th>
                                            <Table.Th>Status</Table.Th>
                                            <Table.Th>Atualizado</Table.Th>
                                            <Table.Th w={60}></Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {filteredArticles.map((article) => (
                                            <Table.Tr
                                                key={article.id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openArticle(article.slug, article.title)}
                                            >
                                                <Table.Td>
                                                    <Group gap="xs" wrap="nowrap">
                                                        {article.mermaidSyntax && (
                                                            <Tooltip label="Tem diagrama">
                                                                <IconChartDots size={14} color="var(--mantine-color-cyan-5)" />
                                                            </Tooltip>
                                                        )}
                                                        {article.codeSnippet && (
                                                            <Tooltip label="Tem código">
                                                                <IconCode size={14} color="var(--mantine-color-violet-5)" />
                                                            </Tooltip>
                                                        )}
                                                        <div style={{ minWidth: 0 }}>
                                                            <Text fw={500} truncate>{article.title}</Text>
                                                            {article.summary && (
                                                                <Text size="xs" c="dimmed" lineClamp={1}>{article.summary}</Text>
                                                            )}
                                                        </div>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap={4}>
                                                        {article.tags?.slice(0, 2).map((tag, i) => (
                                                            <Badge key={i} variant="light" size="xs">{tag}</Badge>
                                                        ))}
                                                        {(article.tags?.length || 0) > 2 && (
                                                            <Text size="xs" c="dimmed">+{(article.tags?.length || 0) - 2}</Text>
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap={4}>
                                                        <IconEye size={14} color="gray" />
                                                        <Text size="sm">{article.viewCount}</Text>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color={statusMap[article.status]?.color || 'gray'}
                                                        variant="light"
                                                        size="sm"
                                                    >
                                                        {statusMap[article.status]?.label || article.status}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="xs" c="dimmed">
                                                        {formatRelativeTime(article.updatedAt)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <ActionIcon variant="subtle" color="gray">
                                                        <IconChevronRight size={16} />
                                                    </ActionIcon>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            ) : (
                                <Center py="xl">
                                    <Stack align="center" gap="xs">
                                        <IconBook size={48} color="gray" />
                                        <Text c="dimmed">
                                            {search || statusFilter || categoryFilter
                                                ? 'Nenhum artigo encontrado com esses filtros'
                                                : 'Nenhum artigo ainda'}
                                        </Text>
                                        {!search && !statusFilter && !categoryFilter && (
                                            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openCreate}>
                                                Criar primeiro artigo
                                            </Button>
                                        )}
                                    </Stack>
                                </Center>
                            )}
                        </Card>
                    </Stack>
                </Tabs.Panel>

                {/* ── Article Detail Panels ── */}
                {openTabs.map((tab) => (
                    <Tabs.Panel key={tab.slug} value={tab.slug}>
                        <Card withBorder mt="md">
                            <ArticleDetail
                                slug={tab.slug}
                                onClose={() => closeTab(tab.slug)}
                                onOpenRelated={(relSlug) => openArticle(relSlug, relSlug)}
                            />
                        </Card>
                    </Tabs.Panel>
                ))}
            </Tabs>

            {/* Create Modal */}
            <CreateArticleModal
                opened={createOpened}
                onClose={closeCreate}
                onCreated={refetch}
            />
        </Stack>
    );
}
