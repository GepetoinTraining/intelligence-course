'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Textarea, Modal, ActionIcon, Menu, Loader, Center,
    SimpleGrid, ThemeIcon, Tooltip, Tabs, SegmentedControl, Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconSearch, IconDots, IconEdit, IconTrash, IconCopy,
    IconShare, IconNotes, IconTag, IconClock, IconPlayerPlay
} from '@tabler/icons-react';

interface StudentPrompt {
    id: string;
    title: string;
    systemPrompt: string | null;
    userMessage: string | null;
    tags: string[];
    isPublic: boolean;
    runCount: number;
    heldRate: number;
    createdAt: number;
    updatedAt: number;
}

export default function StudentPromptsPage() {
    const [prompts, setPrompts] = useState<StudentPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [newPrompt, setNewPrompt] = useState({ title: '', systemPrompt: '', userMessage: '', tags: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/student-prompts');
            const data = await res.json();
            if (data.data) {
                setPrompts(data.data.map((p: any) => ({
                    ...p,
                    tags: p.tags ? JSON.parse(p.tags) : []
                })));
            }
        } catch (error) {
            console.error('Failed to fetch prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/student-prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newPrompt.title,
                    systemPrompt: newPrompt.systemPrompt || null,
                    userMessage: newPrompt.userMessage || null,
                    tags: newPrompt.tags ? JSON.stringify(newPrompt.tags.split(',').map(t => t.trim())) : '[]',
                }),
            });
            if (res.ok) {
                closeCreate();
                setNewPrompt({ title: '', systemPrompt: '', userMessage: '', tags: '' });
                fetchPrompts();
            }
        } catch (error) {
            console.error('Failed to create prompt:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredPrompts = prompts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'public' && p.isPublic) ||
            (filter === 'private' && !p.isPublic);
        return matchesSearch && matchesFilter;
    });

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Meus Prompts</Title>
                    <Text c="dimmed">Sua biblioteca pessoal de prompts</Text>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    Novo Prompt
                </Button>
            </Group>

            <Group mb="lg">
                <TextInput
                    placeholder="Buscar prompts..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1 }}
                />
                <SegmentedControl
                    value={filter}
                    onChange={(v) => setFilter(v as typeof filter)}
                    data={[
                        { label: 'Todos', value: 'all' },
                        { label: 'Públicos', value: 'public' },
                        { label: 'Privados', value: 'private' },
                    ]}
                />
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredPrompts.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconNotes size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhum prompt encontrado</Title>
                    <Text c="dimmed" mb="lg">
                        {prompts.length === 0
                            ? 'Comece criando seu primeiro prompt!'
                            : 'Tente ajustar os filtros de busca'}
                    </Text>
                    {prompts.length === 0 && (
                        <Button onClick={openCreate}>Criar Primeiro Prompt</Button>
                    )}
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {filteredPrompts.map((prompt) => (
                        <Card key={prompt.id} withBorder padding="lg">
                            <Group justify="space-between" mb="xs">
                                <Text fw={600} lineClamp={1}>{prompt.title}</Text>
                                <Menu>
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" size="sm">
                                            <IconDots size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item leftSection={<IconPlayerPlay size={14} />}>
                                            Executar
                                        </Menu.Item>
                                        <Menu.Item leftSection={<IconEdit size={14} />}>
                                            Editar
                                        </Menu.Item>
                                        <Menu.Item leftSection={<IconCopy size={14} />}>
                                            Duplicar
                                        </Menu.Item>
                                        <Menu.Item leftSection={<IconShare size={14} />}>
                                            {prompt.isPublic ? 'Tornar Privado' : 'Compartilhar'}
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
                                            Excluir
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>

                            <Text size="sm" c="dimmed" lineClamp={2} mb="md">
                                {prompt.systemPrompt || prompt.userMessage || 'Sem descrição'}
                            </Text>

                            <Group gap="xs" mb="md">
                                {prompt.tags.slice(0, 3).map((tag, i) => (
                                    <Badge key={i} size="xs" variant="light">{tag}</Badge>
                                ))}
                                {prompt.tags.length > 3 && (
                                    <Badge size="xs" variant="light" color="gray">+{prompt.tags.length - 3}</Badge>
                                )}
                            </Group>

                            <Group justify="space-between">
                                <Group gap="xs">
                                    <Tooltip label="Execuções">
                                        <Badge variant="light" leftSection={<IconPlayerPlay size={12} />}>
                                            {prompt.runCount}
                                        </Badge>
                                    </Tooltip>
                                    <Tooltip label="Taxa de sucesso">
                                        <Badge variant="light" color="green">
                                            {Math.round(prompt.heldRate)}%
                                        </Badge>
                                    </Tooltip>
                                </Group>
                                <Badge variant={prompt.isPublic ? 'filled' : 'outline'} size="xs">
                                    {prompt.isPublic ? 'Público' : 'Privado'}
                                </Badge>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            {/* Create Modal */}
            <Modal opened={createOpened} onClose={closeCreate} title="Novo Prompt" size="lg">
                <Stack>
                    <TextInput
                        label="Título"
                        placeholder="Nome do prompt"
                        value={newPrompt.title}
                        onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                        required
                    />
                    <Textarea
                        label="System Prompt"
                        placeholder="Instruções para o AI..."
                        minRows={4}
                        value={newPrompt.systemPrompt}
                        onChange={(e) => setNewPrompt({ ...newPrompt, systemPrompt: e.target.value })}
                    />
                    <Textarea
                        label="User Message"
                        placeholder="Mensagem inicial..."
                        minRows={3}
                        value={newPrompt.userMessage}
                        onChange={(e) => setNewPrompt({ ...newPrompt, userMessage: e.target.value })}
                    />
                    <TextInput
                        label="Tags"
                        placeholder="tag1, tag2, tag3"
                        value={newPrompt.tags}
                        onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={closeCreate}>Cancelar</Button>
                        <Button onClick={handleCreate} loading={saving} disabled={!newPrompt.title}>
                            Criar Prompt
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

