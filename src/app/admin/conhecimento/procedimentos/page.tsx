'use client';

/**
 * Procedimentos (POPs) — Standard Operating Procedures
 *
 * Fetches from /api/procedures and displays a real table
 * with wiki article linking, execution stats, and Mermaid flowcharts.
 */

import { useState, useCallback } from 'react';
import {
    Card, Title, Text, Group, Badge, Table, Button,
    SimpleGrid, ThemeIcon, ActionIcon, Menu, TextInput,
    Loader, Center, Stack, Paper, Tooltip, Modal, Select,
    Textarea, Switch, Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconListCheck, IconPlus, IconEye, IconEdit, IconDotsVertical,
    IconSearch, IconFileText, IconUsers, IconAlertCircle, IconClock,
    IconPlayerPlay, IconCheck, IconArticle, IconRefresh, IconTrash,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface ProcedureItem {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    subcategory: string | null;
    entityType: string | null;
    status: 'active' | 'draft' | 'archived';
    tags: string | null;
    isLearnable: boolean | null;
    targetDurationHours: number | null;
    wikiPageId: string | null;
    autoUpdateWiki: boolean | null;
    createdAt: number | null;
    updatedAt: number | null;
    // Enriched fields from API
    stepCount: number;
    executionCount: number;
    completedCount: number;
    avgDurationMinutes: number | null;
}

interface ProceduresResponse {
    procedures: ProcedureItem[];
    categories: string[];
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusColors: Record<string, string> = {
    active: 'green',
    draft: 'yellow',
    archived: 'gray',
};

const statusLabels: Record<string, string> = {
    active: 'Ativo',
    draft: 'Rascunho',
    archived: 'Arquivado',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProcedimentosPage() {
    const { data, isLoading, error, refetch } = useApi<ProceduresResponse>('/api/procedures');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    // Create modal
    const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newAutoWiki, setNewAutoWiki] = useState(true);

    const procedures = data?.procedures || [];
    const categories = data?.categories || [];

    const filtered = procedures.filter(p => {
        const matchesSearch = !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.slug.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !categoryFilter || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const activeCount = procedures.filter(p => p.status === 'active').length;
    const draftCount = procedures.filter(p => p.status === 'draft').length;
    const totalExecs = procedures.reduce((acc, p) => acc + (p.executionCount || 0), 0);
    const totalSteps = procedures.reduce((acc, p) => acc + (p.stepCount || 0), 0);

    // ── Create handler ──

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const slug = newName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            const res = await fetch('/api/procedures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    slug,
                    description: newDescription || undefined,
                    category: newCategory || 'geral',
                    entityType: 'operational',
                    autoUpdateWiki: newAutoWiki,
                }),
            });

            if (res.ok) {
                closeCreate();
                setNewName('');
                setNewDescription('');
                setNewCategory('');
                refetch();
                notifications.show({
                    title: 'Procedimento criado',
                    message: newAutoWiki ? 'Página wiki criada automaticamente' : '',
                    color: 'green',
                });
            } else {
                const err = await res.json();
                notifications.show({ title: 'Erro', message: err.error, color: 'red' });
            }
        } catch (err) {
            notifications.show({ title: 'Erro', message: 'Falha ao criar procedimento', color: 'red' });
        } finally {
            setCreating(false);
        }
    };

    // ── Render ──

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert color="red" icon={<IconAlertCircle size={16} />} title="Erro ao carregar procedimentos">
                <Text size="sm">{String(error)}</Text>
                <Button variant="light" mt="sm" leftSection={<IconRefresh size={14} />} onClick={() => refetch()}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between">
                <div>
                    <Text c="dimmed" size="sm">Conhecimento</Text>
                    <Title order={2}>Procedimentos (POPs)</Title>
                </div>
                <Button
                    leftSection={<IconPlus size={16} />}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                    onClick={openCreate}
                >
                    Novo Procedimento
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md" variant="light">
                            <IconListCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total POPs</Text>
                            <Text fw={700} size="xl">{procedures.length}</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md" variant="light">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="xl">{activeCount}</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md" variant="light">
                            <IconPlayerPlay size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Execuções</Text>
                            <Text fw={700} size="xl">{totalExecs}</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md" variant="light">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Passos</Text>
                            <Text fw={700} size="xl">{totalSteps}</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Filters + Table */}
            <Card withBorder radius="md">
                <Group justify="space-between" mb="md">
                    <Title order={4}>Todos os Procedimentos</Title>
                    <Group>
                        {categories.length > 0 && (
                            <Select
                                placeholder="Categoria"
                                clearable
                                data={categories.map(c => ({ value: c, label: c }))}
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                w={180}
                                size="sm"
                            />
                        )}
                        <TextInput
                            placeholder="Buscar..."
                            leftSection={<IconSearch size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            w={250}
                        />
                    </Group>
                </Group>

                {filtered.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconListCheck size={48} color="gray" />
                            <Text c="dimmed">{search ? 'Nenhum resultado encontrado' : 'Nenhum procedimento cadastrado'}</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Categoria</Table.Th>
                                <Table.Th>Passos</Table.Th>
                                <Table.Th>Execuções</Table.Th>
                                <Table.Th>Duração Média</Table.Th>
                                <Table.Th>Wiki</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map((proc) => (
                                <Table.Tr key={proc.id}>
                                    <Table.Td>
                                        <div>
                                            <Text fw={500} size="sm">{proc.name}</Text>
                                            {proc.description && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>{proc.description}</Text>
                                            )}
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" color="gray" size="sm">{proc.category || '—'}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{proc.stepCount}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Text size="sm">{proc.executionCount}</Text>
                                            {proc.completedCount > 0 && (
                                                <Text size="xs" c="dimmed">({proc.completedCount} ✓)</Text>
                                            )}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">
                                            {proc.avgDurationMinutes
                                                ? `${Math.round(proc.avgDurationMinutes)} min`
                                                : '—'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        {proc.wikiPageId ? (
                                            <Tooltip label="Página wiki vinculada">
                                                <Badge
                                                    variant="light"
                                                    color="blue"
                                                    size="sm"
                                                    leftSection={<IconArticle size={10} />}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    Wiki
                                                </Badge>
                                            </Tooltip>
                                        ) : (
                                            <Text size="xs" c="dimmed">—</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={statusColors[proc.status]} variant="light" size="sm">
                                            {statusLabels[proc.status]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Visualizar</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                {proc.wikiPageId && (
                                                    <Menu.Item leftSection={<IconArticle size={14} />}>Ver Wiki</Menu.Item>
                                                )}
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Create Modal */}
            <Modal opened={createOpen} onClose={closeCreate} title="Novo Procedimento" centered>
                <Stack gap="md">
                    <TextInput
                        label="Nome do Procedimento"
                        placeholder="Ex: Matrícula de Novos Alunos"
                        value={newName}
                        onChange={(e) => setNewName(e.currentTarget.value)}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva brevemente o procedimento..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.currentTarget.value)}
                        minRows={2}
                    />
                    <Select
                        label="Categoria"
                        placeholder="Selecione ou digite"
                        data={[
                            { value: 'operacional', label: 'Operacional' },
                            { value: 'acadêmico', label: 'Acadêmico' },
                            { value: 'comercial', label: 'Comercial' },
                            { value: 'rh', label: 'Recursos Humanos' },
                            { value: 'financeiro', label: 'Financeiro' },
                            { value: 'geral', label: 'Geral' },
                        ]}
                        value={newCategory}
                        onChange={(v) => setNewCategory(v || '')}
                        searchable
                    />
                    <Switch
                        label="Criar página wiki automaticamente"
                        description="Gera documentação vinculada ao procedimento"
                        checked={newAutoWiki}
                        onChange={(e) => setNewAutoWiki(e.currentTarget.checked)}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeCreate}>Cancelar</Button>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'blue', to: 'cyan' }}
                            onClick={handleCreate}
                            loading={creating}
                            disabled={!newName.trim()}
                        >
                            Criar Procedimento
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
