'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Button,
    TextInput, Textarea, Select, TagsInput,
    Paper, Breadcrumbs, Anchor, Alert, LoadingOverlay,
    Switch, Divider
} from '@mantine/core';
import {
    IconArrowLeft, IconDeviceFloppy, IconSend,
    IconAlertCircle, IconEye
} from '@tabler/icons-react';
import Link from 'next/link';

interface WikiCategory {
    id: string;
    name: string;
    slug: string;
}

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'review', label: 'Em Revisão' },
    { value: 'published', label: 'Publicado' },
];

const TAG_SUGGESTIONS = [
    'processo', 'procedimento', 'guia', 'tutorial',
    'política', 'referência', 'faq', 'onboarding',
    'vendas', 'suporte', 'financeiro', 'rh', 'operações'
];

export default function WikiArticleEditorPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string | undefined;
    const isEditing = !!slug;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<WikiCategory[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [articleSlug, setArticleSlug] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [status, setStatus] = useState('draft');
    const [changeNotes, setChangeNotes] = useState('');

    useEffect(() => {
        loadCategories();
        if (isEditing) {
            loadArticle();
        }
    }, [slug]);

    // Auto-generate slug from title
    useEffect(() => {
        if (!isEditing && title) {
            const generatedSlug = title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            setArticleSlug(generatedSlug);
        }
    }, [title, isEditing]);

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/wiki/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data.data || []);
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const loadArticle = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/wiki/articles/${slug}`);
            if (!res.ok) {
                setError('Artigo não encontrado');
                return;
            }
            const data = await res.json();
            const article = data.data;

            setTitle(article.title);
            setArticleSlug(article.slug);
            setSummary(article.summary || '');
            setContent(article.content);
            setCategoryId(article.categoryId);
            setTags(article.tags || []);
            setStatus(article.status);
        } catch (err) {
            console.error('Error loading article:', err);
            setError('Erro ao carregar artigo');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (publishNow = false) => {
        if (!title.trim() || !content.trim()) {
            setError('Título e conteúdo são obrigatórios');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const payload = {
                title,
                slug: articleSlug,
                summary,
                content,
                categoryId: categoryId || undefined,
                tags,
                status: publishNow ? 'published' : status,
                changeNotes: isEditing ? changeNotes : undefined,
            };

            const url = isEditing
                ? `/api/wiki/articles/${slug}`
                : '/api/wiki/articles';

            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Erro ao salvar');
                return;
            }

            const data = await res.json();
            router.push(`/wiki/articles/${data.data.slug}`);
        } catch (err) {
            console.error('Error saving article:', err);
            setError('Erro ao salvar artigo');
        } finally {
            setSaving(false);
        }
    };

    const categoryOptions = categories.map(c => ({
        value: c.id,
        label: c.name,
    }));

    return (
        <Stack gap="xl" pos="relative">
            <LoadingOverlay visible={loading} />

            {/* Breadcrumbs */}
            <Breadcrumbs>
                <Anchor component={Link} href="/wiki" size="sm">
                    Wiki
                </Anchor>
                <Text size="sm" c="dimmed">
                    {isEditing ? 'Editar Artigo' : 'Novo Artigo'}
                </Text>
            </Breadcrumbs>

            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>
                        {isEditing ? 'Editar Artigo' : '✏️ Novo Artigo'}
                    </Title>
                    <Text c="dimmed">
                        {isEditing
                            ? 'Atualize o conteúdo do artigo'
                            : 'Adicione conhecimento à base'}
                    </Text>
                </div>
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconDeviceFloppy size={16} />}
                        onClick={() => handleSave(false)}
                        loading={saving}
                    >
                        Salvar Rascunho
                    </Button>
                    <Button
                        leftSection={<IconSend size={16} />}
                        onClick={() => handleSave(true)}
                        loading={saving}
                    >
                        Publicar
                    </Button>
                </Group>
            </Group>

            {error && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    title="Erro"
                    withCloseButton
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Form */}
            <Card shadow="xs" radius="md" p="xl" withBorder>
                <Stack gap="lg">
                    {/* Title & Slug */}
                    <Group grow align="flex-start">
                        <TextInput
                            label="Título"
                            placeholder="Título do artigo"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            size="md"
                        />
                        <TextInput
                            label="Slug (URL)"
                            placeholder="url-do-artigo"
                            value={articleSlug}
                            onChange={(e) => setArticleSlug(e.target.value)}
                            description="Usado na URL do artigo"
                            disabled={isEditing}
                        />
                    </Group>

                    {/* Category & Status */}
                    <Group grow align="flex-start">
                        <Select
                            label="Categoria"
                            placeholder="Selecione uma categoria"
                            data={categoryOptions}
                            value={categoryId}
                            onChange={setCategoryId}
                            clearable
                            searchable
                        />
                        <Select
                            label="Status"
                            data={STATUS_OPTIONS}
                            value={status}
                            onChange={(v) => setStatus(v || 'draft')}
                        />
                    </Group>

                    {/* Tags */}
                    <TagsInput
                        label="Tags"
                        placeholder="Adicione tags"
                        data={TAG_SUGGESTIONS}
                        value={tags}
                        onChange={setTags}
                    />

                    {/* Summary */}
                    <Textarea
                        label="Resumo"
                        placeholder="Breve descrição do artigo (aparece nas listagens)"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        minRows={2}
                    />

                    <Divider />

                    {/* Content */}
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text fw={500}>Conteúdo (Markdown)</Text>
                            <Switch
                                label="Preview"
                                checked={showPreview}
                                onChange={(e) => setShowPreview(e.currentTarget.checked)}
                                size="sm"
                            />
                        </Group>

                        {showPreview ? (
                            <Paper p="md" radius="md" withBorder mih={400}>
                                <div dangerouslySetInnerHTML={{
                                    __html: content
                                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                        .replace(/`(.*?)`/g, '<code>$1</code>')
                                        .replace(/\n/g, '<br/>')
                                }} />
                            </Paper>
                        ) : (
                            <Textarea
                                placeholder="Escreva o conteúdo do artigo em Markdown..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                minRows={20}
                                autosize
                                styles={{
                                    input: { fontFamily: 'monospace' }
                                }}
                            />
                        )}
                    </Stack>

                    {/* Change Notes (for editing) */}
                    {isEditing && (
                        <TextInput
                            label="Notas da alteração"
                            placeholder="O que foi alterado? (opcional)"
                            value={changeNotes}
                            onChange={(e) => setChangeNotes(e.target.value)}
                        />
                    )}
                </Stack>
            </Card>

            {/* Markdown Help */}
            <Card shadow="xs" radius="md" p="md" withBorder>
                <Text fw={500} size="sm" mb="xs">Dicas de Markdown</Text>
                <Group gap="xl">
                    <Text size="xs" c="dimmed"><code># Título</code> → Título grande</Text>
                    <Text size="xs" c="dimmed"><code>## Subtítulo</code> → Subtítulo</Text>
                    <Text size="xs" c="dimmed"><code>**negrito**</code> → <strong>negrito</strong></Text>
                    <Text size="xs" c="dimmed"><code>*itálico*</code> → <em>itálico</em></Text>
                    <Text size="xs" c="dimmed"><code>`código`</code> → <code>código</code></Text>
                    <Text size="xs" c="dimmed"><code>- item</code> → Lista</Text>
                </Group>
            </Card>
        </Stack>
    );
}

