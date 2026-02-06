'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    TextInput, Modal, Textarea, MultiSelect, SimpleGrid,
    Paper, ThemeIcon, ActionIcon, Menu, Tabs, Progress
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconSearch, IconFolder, IconStar, IconStarFilled,
    IconDotsVertical, IconTrash, IconCopy, IconShare,
    IconPlayerPlay, IconTag, IconGitFork, IconLock, IconWorld
} from '@tabler/icons-react';
import Link from 'next/link';

interface StudentPrompt {
    id: string;
    title: string;
    systemPrompt?: string;
    userMessage?: string;
    tags: string[];
    isPublic: boolean;
    isFavorite: boolean;
    forkedFrom?: { id: string; author: string };
    runCount: number;
    heldRate: number;
    moduleId?: string;
    createdAt: string;
    updatedAt: string;
}

// Mock data
const MOCK_PROMPTS: StudentPrompt[] = [
    {
        id: 'p1',
        title: 'Grumpy Blacksmith v3',
        systemPrompt: 'You are a medieval blacksmith who has been working iron for 40 years...',
        userMessage: 'What do you think about WiFi routers?',
        tags: ['orbit', 'identity', 'module1'],
        isPublic: false,
        isFavorite: true,
        runCount: 12,
        heldRate: 83,
        moduleId: 'module-1',
        createdAt: '2026-01-30T10:00:00Z',
        updatedAt: '2026-02-01T14:30:00Z',
    },
    {
        id: 'p2',
        title: 'Haiku Coder',
        systemPrompt: 'You are a programmer who can only explain code in haiku format...',
        tags: ['black_hole', 'compression', 'module3'],
        isPublic: true,
        isFavorite: false,
        forkedFrom: { id: 'original-123', author: 'Maria' },
        runCount: 5,
        heldRate: 100,
        createdAt: '2026-01-31T16:00:00Z',
        updatedAt: '2026-01-31T16:00:00Z',
    },
    {
        id: 'p3',
        title: 'Alien Tourist Guide',
        systemPrompt: 'You are an extraterrestrial visiting Earth for the first time...',
        userMessage: 'Explain a coffee shop to me',
        tags: ['orbit', 'spatial', 'module1'],
        isPublic: false,
        isFavorite: false,
        runCount: 8,
        heldRate: 62,
        moduleId: 'module-1',
        createdAt: '2026-01-28T09:00:00Z',
        updatedAt: '2026-01-29T11:00:00Z',
    },
    {
        id: 'p4',
        title: 'Noir Detective',
        systemPrompt: 'You are a 1940s film noir detective investigating a case...',
        tags: ['orbit', 'temporal', 'identity', 'module1'],
        isPublic: true,
        isFavorite: true,
        runCount: 15,
        heldRate: 73,
        createdAt: '2026-01-25T14:00:00Z',
        updatedAt: '2026-02-01T09:00:00Z',
    },
];

const TECHNIQUE_TAGS = [
    { value: 'orbit', label: '🌍 Orbit', color: 'violet' },
    { value: 'slingshot', label: '🚀 Slingshot', color: 'blue' },
    { value: 'black_hole', label: '🕳️ Black Hole', color: 'dark' },
    { value: 'constellation', label: '✨ Constellation', color: 'cyan' },
];

const CONTEXT_TAGS = [
    { value: 'identity', label: 'Identity Layer' },
    { value: 'temporal', label: 'Temporal Layer' },
    { value: 'spatial', label: 'Spatial Layer' },
    { value: 'compression', label: 'Compression' },
];

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<StudentPrompt[]>(MOCK_PROMPTS);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [newPrompt, setNewPrompt] = useState({ title: '', systemPrompt: '', userMessage: '', tags: [] as string[] });

    const toggleFavorite = (id: string) => {
        setPrompts(prev => prev.map(p =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
        ));
    };

    const filteredPrompts = prompts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

        if (activeTab === 'favorites') return matchesSearch && p.isFavorite;
        if (activeTab === 'public') return matchesSearch && p.isPublic;
        if (activeTab === 'forked') return matchesSearch && p.forkedFrom;
        return matchesSearch;
    });

    const getHeldRateColor = (rate: number) => {
        if (rate >= 80) return 'green';
        if (rate >= 60) return 'yellow';
        return 'red';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <>
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Meus Prompts 📝</Title>
                        <Text c="dimmed">Sua biblioteca pessoal de prompts que funcionam</Text>
                    </div>
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                        Novo Prompt
                    </Button>
                </Group>

                {/* Search & Filters */}
                <Group>
                    <TextInput
                        placeholder="Buscar prompts ou tags..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, maxWidth: 400 }}
                    />
                </Group>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="all" leftSection={<IconFolder size={14} />}>
                            Todos ({prompts.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="favorites" leftSection={<IconStar size={14} />}>
                            Favoritos ({prompts.filter(p => p.isFavorite).length})
                        </Tabs.Tab>
                        <Tabs.Tab value="public" leftSection={<IconWorld size={14} />}>
                            Públicos ({prompts.filter(p => p.isPublic).length})
                        </Tabs.Tab>
                        <Tabs.Tab value="forked" leftSection={<IconGitFork size={14} />}>
                            Forkados ({prompts.filter(p => p.forkedFrom).length})
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                {/* Prompts Grid */}
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {filteredPrompts.map((prompt) => (
                        <Card key={prompt.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="sm">
                                {/* Header */}
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="xs" wrap="nowrap" style={{ flex: 1, overflow: 'hidden' }}>
                                        <ActionIcon
                                            variant="subtle"
                                            color={prompt.isFavorite ? 'yellow' : 'gray'}
                                            onClick={() => toggleFavorite(prompt.id)}
                                        >
                                            {prompt.isFavorite ? <IconStarFilled size={18} /> : <IconStar size={18} />}
                                        </ActionIcon>
                                        <Text fw={600} truncate style={{ flex: 1 }}>{prompt.title}</Text>
                                    </Group>
                                    <Group gap={4}>
                                        {prompt.isPublic ? (
                                            <ThemeIcon size={20} variant="light" color="blue" radius="xl">
                                                <IconWorld size={12} />
                                            </ThemeIcon>
                                        ) : (
                                            <ThemeIcon size={20} variant="light" color="gray" radius="xl">
                                                <IconLock size={12} />
                                            </ThemeIcon>
                                        )}
                                        <Menu position="bottom-end" withinPortal>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconPlayerPlay size={14} />}>
                                                    Abrir no Playground
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconCopy size={14} />}>
                                                    Duplicar
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconShare size={14} />}>
                                                    {prompt.isPublic ? 'Tornar Privado' : 'Compartilhar'}
                                                </Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                                                    Excluir
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Group>

                                {/* Forked indicator */}
                                {prompt.forkedFrom && (
                                    <Group gap={4}>
                                        <IconGitFork size={12} color="var(--mantine-color-dimmed)" />
                                        <Text size="xs" c="dimmed">
                                            Forkado de @{prompt.forkedFrom.author}
                                        </Text>
                                    </Group>
                                )}

                                {/* Tags */}
                                <Group gap={4}>
                                    {prompt.tags.slice(0, 4).map((tag) => {
                                        const techniqueTag = TECHNIQUE_TAGS.find(t => t.value === tag);
                                        return (
                                            <Badge
                                                key={tag}
                                                size="xs"
                                                variant="light"
                                                color={techniqueTag?.color || 'gray'}
                                            >
                                                #{tag}
                                            </Badge>
                                        );
                                    })}
                                    {prompt.tags.length > 4 && (
                                        <Badge size="xs" variant="outline" color="gray">
                                            +{prompt.tags.length - 4}
                                        </Badge>
                                    )}
                                </Group>

                                {/* System Prompt Preview */}
                                {prompt.systemPrompt && (
                                    <Paper p="xs" radius="sm" withBorder bg="var(--mantine-color-gray-0)">
                                        <Text size="xs" c="dimmed" lineClamp={2}>
                                            {prompt.systemPrompt}
                                        </Text>
                                    </Paper>
                                )}

                                {/* Stats */}
                                <Group justify="space-between" mt="xs">
                                    <Group gap="xs">
                                        <Text size="xs" c="dimmed">{prompt.runCount} runs</Text>
                                        <Text size="xs" c="dimmed">•</Text>
                                        <Group gap={4}>
                                            <Progress
                                                value={prompt.heldRate}
                                                size="sm"
                                                w={40}
                                                color={getHeldRateColor(prompt.heldRate)}
                                            />
                                            <Text size="xs" c={getHeldRateColor(prompt.heldRate)}>
                                                {prompt.heldRate}% held
                                            </Text>
                                        </Group>
                                    </Group>
                                    <Text size="xs" c="dimmed">{formatDate(prompt.updatedAt)}</Text>
                                </Group>

                                {/* Actions */}
                                <Group gap="xs" mt="xs">
                                    <Link href={`/playground?prompt=${prompt.id}`} passHref legacyBehavior>
                                        <Button
                                            component="a"
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconPlayerPlay size={14} />}
                                            fullWidth
                                        >
                                            Usar no Playground
                                        </Button>
                                    </Link>
                                </Group>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>

                {filteredPrompts.length === 0 && (
                    <Paper p="xl" radius="md" withBorder ta="center">
                        <IconFolder size={48} color="var(--mantine-color-gray-5)" />
                        <Text c="dimmed" mt="md">Nenhum prompt encontrado</Text>
                        <Button variant="light" mt="md" onClick={openCreate}>
                            Criar seu primeiro prompt
                        </Button>
                    </Paper>
                )}
            </Stack>

            {/* Create Modal */}
            <Modal
                opened={createOpened}
                onClose={closeCreate}
                title="Novo Prompt"
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Título"
                        placeholder="Ex: Grumpy Blacksmith"
                        value={newPrompt.title}
                        onChange={(e) => setNewPrompt(prev => ({ ...prev, title: e.target.value }))}
                        required
                    />

                    <Textarea
                        label="System Prompt"
                        placeholder="Defina quem é o personagem e como ele se comporta..."
                        minRows={4}
                        value={newPrompt.systemPrompt}
                        onChange={(e) => setNewPrompt(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    />

                    <Textarea
                        label="Mensagem Inicial (opcional)"
                        placeholder="Uma mensagem de teste para quebrar o personagem..."
                        minRows={2}
                        value={newPrompt.userMessage}
                        onChange={(e) => setNewPrompt(prev => ({ ...prev, userMessage: e.target.value }))}
                    />

                    <MultiSelect
                        label="Tags"
                        placeholder="Selecione técnicas e conceitos"
                        data={[
                            { group: 'Técnicas', items: TECHNIQUE_TAGS.map(t => ({ value: t.value, label: t.label })) },
                            { group: 'Contexto', items: CONTEXT_TAGS },
                        ]}
                        value={newPrompt.tags}
                        onChange={(tags) => setNewPrompt(prev => ({ ...prev, tags }))}
                        searchable
                        clearable
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeCreate}>Cancelar</Button>
                        <Button onClick={() => { /* TODO: Save */ closeCreate(); }}>
                            Criar Prompt
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}

