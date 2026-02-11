'use client';

/**
 * Anunciação — Leadership Mythos Writing & Gallery
 *
 * Three views (tabs):
 *   1. ✍️  Escrita — 3-quarter editor with auto-save + AI Q4 generation
 *   2. 📜  Linhagem — Gallery of all declarations (active + enshrined)
 *   3. ⚙️  Configurações — Org settings toggle
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, Textarea,
    Tabs, Paper, ActionIcon, ThemeIcon, SimpleGrid, Switch,
    Select, Loader, Center, Modal, Tooltip,
    Timeline, Blockquote, SegmentedControl,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconPencil, IconTimeline, IconSettings, IconSparkles,
    IconSend, IconArchive, IconPlus, IconTrash,
    IconCrown, IconQuote,
    IconRobot, IconDeviceFloppy, IconEye,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES (aligned to pre-existing schema)
// ============================================================================

interface AnunciacaoListItem {
    id: string;
    teamId: string;
    authorPersonId: string;
    status: 'draft' | 'active' | 'enshrined';
    tenureStartedAt: number | null;
    tenureEndedAt: number | null;
    createdAt: number | null;
    updatedAt: number | null;
    publishedAt: number | null;
    quarter1Preview: string;
}

interface AnunciacaoFull {
    id: string;
    organizationId: string;
    teamId: string;
    authorPersonId: string;
    quarter1Content: string | null;
    quarter2Content: string | null;
    quarter3Content: string | null;
    quarter4AiContent: string | null;
    closingContent: string | null;
    aiModelUsed: string | null;
    aiQuarterEdited: number | null;
    aiQuarterRegenerations: number | null;
    status: 'draft' | 'active' | 'enshrined';
    tenureStartedAt: number | null;
    tenureEndedAt: number | null;
    tenureStats: string | null;
    createdAt: number | null;
    updatedAt: number | null;
    publishedAt: number | null;
    enshrinedAt: number | null;
}

interface OrgSettings {
    orgId: string;
    enabled: number;
    requiredForTeamAccess: number;
    visibility: 'org_wide' | 'leadership_only';
    aiModelPreference: string;
}

interface TeamOption {
    id: string;
    name: string;
}

// ============================================================================
// QUARTER CONFIG
// ============================================================================

const QUARTERS = [
    { key: 'quarter1Content', title: 'Quartel 1: Quem Eu Sou', icon: '👤', placeholder: 'Escreva sobre sua identidade, valores pessoais, e o que o trouxe até aqui...', ai: false },
    { key: 'quarter2Content', title: 'Quartel 2: No Que Acredito', icon: '💡', placeholder: 'Descreva suas crenças sobre educação, liderança, e o potencial humano...', ai: false },
    { key: 'quarter3Content', title: 'Quartel 3: O Que Estou Construindo', icon: '🏗️', placeholder: 'Compartilhe sua visão, os objetivos práticos e o legado que está construindo...', ai: false },
    { key: 'quarter4AiContent', title: 'Quartel 4: O Quartel da IA', icon: '🤖', placeholder: 'Este quartel será gerado pela IA após preencher Q1-Q3...', ai: true },
    { key: 'closingContent', title: 'Fechamento', icon: '🔱', placeholder: 'Uma palavra final, opcional, para selar sua declaração...', ai: false },
] as const;

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    draft: { color: 'gray', label: 'Rascunho', icon: <IconPencil size={14} /> },
    active: { color: 'green', label: 'Ativa', icon: <IconCrown size={14} /> },
    enshrined: { color: 'violet', label: 'Sacramentada', icon: <IconArchive size={14} /> },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnunciacaoPage() {
    const [activeTab, setActiveTab] = useState<string | null>('escrita');
    const [declarations, setDeclarations] = useState<AnunciacaoListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<OrgSettings | null>(null);

    // Teams for create modal
    const { data: teams } = useApi<TeamOption[]>('/api/teams');

    // Editor state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState<AnunciacaoFull | null>(null);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    // Create modal
    const [createOpen, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [newTeamId, setNewTeamId] = useState('');

    // ────────────────────────────────────────────────────────────
    // Data fetching
    // ────────────────────────────────────────────────────────────

    const fetchDeclarations = useCallback(async () => {
        try {
            const res = await fetch('/api/anunciacoes');
            if (res.ok) {
                const { data } = await res.json();
                setDeclarations(data || []);
            }
        } catch (err) {
            console.error('Error fetching declarations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/anunciacao-settings');
            if (res.ok) {
                const { data } = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    }, []);

    const fetchDeclaration = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/anunciacoes/${id}`);
            if (res.ok) {
                const { data } = await res.json();
                setEditingData(data);
                setEditingId(id);
            }
        } catch (err) {
            console.error('Error fetching declaration:', err);
        }
    }, []);

    useEffect(() => {
        fetchDeclarations();
        fetchSettings();
    }, [fetchDeclarations, fetchSettings]);

    // ────────────────────────────────────────────────────────────
    // Auto-save
    // ────────────────────────────────────────────────────────────

    const autoSave = useCallback(async (data: AnunciacaoFull) => {
        if (data.status !== 'draft') return;
        setSaving(true);
        try {
            await fetch(`/api/anunciacoes/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quarter1Content: data.quarter1Content,
                    quarter2Content: data.quarter2Content,
                    quarter3Content: data.quarter3Content,
                    quarter4AiContent: data.quarter4AiContent,
                    closingContent: data.closingContent,
                    aiQuarterEdited: data.aiQuarterEdited,
                }),
            });
        } catch (err) {
            console.error('Auto-save failed:', err);
        } finally {
            setSaving(false);
        }
    }, []);

    const handleContentChange = useCallback((field: string, value: string) => {
        setEditingData(prev => {
            if (!prev) return prev;
            const updated = { ...prev, [field]: value };

            // If editing Q4, mark as human-edited
            if (field === 'quarter4AiContent' && prev.aiModelUsed) {
                updated.aiQuarterEdited = 1;
            }

            // Debounced auto-save
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => autoSave(updated), 1500);

            return updated;
        });
    }, [autoSave]);

    // ────────────────────────────────────────────────────────────
    // Actions
    // ────────────────────────────────────────────────────────────

    const handleCreate = async () => {
        if (!newTeamId.trim()) return;
        try {
            const res = await fetch('/api/anunciacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId: newTeamId }),
            });
            if (res.ok) {
                const { data } = await res.json();
                closeCreate();
                setNewTeamId('');
                await fetchDeclarations();
                fetchDeclaration(data.id);
                notifications.show({ title: 'Rascunho criado', message: 'Comece a escrever sua Anunciação', color: 'green' });
            } else {
                const err = await res.json();
                notifications.show({ title: 'Erro', message: err.error, color: 'red' });
            }
        } catch (err) {
            notifications.show({ title: 'Erro', message: 'Falha ao criar declaração', color: 'red' });
        }
    };

    const handleGenerateQ4 = async () => {
        if (!editingId) return;
        setGenerating(true);
        try {
            if (editingData) await autoSave(editingData);

            const res = await fetch(`/api/anunciacoes/${editingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate-q4' }),
            });
            if (res.ok) {
                const { data } = await res.json();
                setEditingData(data);
                notifications.show({ title: 'Q4 Gerado!', message: 'A IA sintetizou seus três quartéis', color: 'green', icon: <IconRobot size={16} /> });
            } else {
                const err = await res.json();
                notifications.show({ title: 'Erro', message: err.error, color: 'red' });
            }
        } catch (err) {
            notifications.show({ title: 'Erro', message: 'Falha na geração', color: 'red' });
        } finally {
            setGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!editingId) return;
        setPublishing(true);
        try {
            if (editingData) await autoSave(editingData);

            const res = await fetch(`/api/anunciacoes/${editingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'publish' }),
            });
            if (res.ok) {
                const { data } = await res.json();
                setEditingData(data);
                await fetchDeclarations();
                notifications.show({ title: 'Anunciação Publicada! 🔱', message: 'Sua declaração está agora ativa', color: 'green' });
            } else {
                const err = await res.json();
                notifications.show({ title: 'Erro', message: err.error, color: 'red' });
            }
        } catch (err) {
            notifications.show({ title: 'Erro', message: 'Falha na publicação', color: 'red' });
        } finally {
            setPublishing(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/anunciacoes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (editingId === id) {
                    setEditingId(null);
                    setEditingData(null);
                }
                await fetchDeclarations();
                notifications.show({ title: 'Rascunho excluído', message: '', color: 'gray' });
            }
        } catch (err) {
            notifications.show({ title: 'Erro', message: 'Falha ao excluir', color: 'red' });
        }
    };

    const handleUpdateSettings = async (field: string, value: any) => {
        try {
            const res = await fetch('/api/anunciacao-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });
            if (res.ok) {
                const { data } = await res.json();
                setSettings(data);
                notifications.show({ title: 'Configuração atualizada', message: '', color: 'green' });
            }
        } catch (err) {
            notifications.show({ title: 'Erro', message: 'Falha ao salvar', color: 'red' });
        }
    };

    // ────────────────────────────────────────────────────────────
    // Derived data
    // ────────────────────────────────────────────────────────────

    const activeDrafts = declarations.filter(d => d.status === 'draft');
    const activeDeclarations = declarations.filter(d => d.status === 'active');
    const enshrined = declarations.filter(d => d.status === 'enshrined');

    const teamName = (teamId: string) => {
        const t = (teams || []).find((t: any) => t.id === teamId);
        return t ? (t as any).name : teamId.slice(0, 8);
    };

    const q1q2q3Filled = editingData &&
        editingData.quarter1Content?.trim() &&
        editingData.quarter2Content?.trim() &&
        editingData.quarter3Content?.trim();

    // ────────────────────────────────────────────────────────────
    // Render
    // ────────────────────────────────────────────────────────────

    if (loading) {
        return <Center h={300}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Anunciação 🔱</Title>
                    <Text c="dimmed" size="sm">Declarações de liderança — o manifesto vivo da sua equipe</Text>
                </div>
                <Group>
                    {saving && <Badge color="yellow" variant="light" leftSection={<IconDeviceFloppy size={12} />}>Salvando...</Badge>}
                    <Button
                        leftSection={<IconPlus size={16} />}
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                        onClick={openCreate}
                    >
                        Nova Anunciação
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 3 }}>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon variant="light" color="gray" size="lg"><IconPencil size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Rascunhos</Text>
                            <Text fw={700} size="lg">{activeDrafts.length}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconCrown size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{activeDeclarations.length}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg"><IconArchive size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Sacramentadas</Text>
                            <Text fw={700} size="lg">{enshrined.length}</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="escrita" leftSection={<IconPencil size={16} />}>Escrita</Tabs.Tab>
                    <Tabs.Tab value="linhagem" leftSection={<IconTimeline size={16} />}>Linhagem</Tabs.Tab>
                    <Tabs.Tab value="config" leftSection={<IconSettings size={16} />}>Configurações</Tabs.Tab>
                </Tabs.List>

                {/* ── TAB 1: ESCRITA ── */}
                <Tabs.Panel value="escrita" pt="xl">
                    <Group align="flex-start" gap="xl" wrap="nowrap" style={{ minHeight: 500 }}>
                        {/* Left: Declaration list */}
                        <Paper withBorder p="md" radius="md" w={280} style={{ flexShrink: 0 }}>
                            <Text fw={600} size="sm" mb="sm">Suas Declarações</Text>
                            <Stack gap="xs">
                                {declarations.length === 0 && (
                                    <Text size="sm" c="dimmed">Nenhuma declaração ainda</Text>
                                )}
                                {declarations.map(d => {
                                    const cfg = STATUS_CONFIG[d.status];
                                    return (
                                        <Paper
                                            key={d.id}
                                            withBorder
                                            p="sm"
                                            radius="sm"
                                            style={{
                                                cursor: 'pointer',
                                                borderColor: editingId === d.id ? 'var(--mantine-color-violet-5)' : undefined,
                                                background: editingId === d.id ? 'var(--mantine-color-violet-0)' : undefined,
                                            }}
                                            onClick={() => fetchDeclaration(d.id)}
                                        >
                                            <Group justify="space-between" mb={4}>
                                                <Badge size="xs" color={cfg.color} variant="light" leftSection={cfg.icon}>
                                                    {cfg.label}
                                                </Badge>
                                                {d.status === 'draft' && (
                                                    <ActionIcon
                                                        size="xs"
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                                                    >
                                                        <IconTrash size={12} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                            <Text size="xs" fw={500}>{teamName(d.teamId)}</Text>
                                            <Text size="xs" c="dimmed" lineClamp={2}>{d.quarter1Preview || 'Rascunho vazio'}</Text>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Paper>

                        {/* Right: Editor */}
                        <Stack style={{ flex: 1 }} gap="lg">
                            {!editingData ? (
                                <Card withBorder p="xl" radius="md">
                                    <Center>
                                        <Stack align="center" gap="xs">
                                            <IconQuote size={48} color="gray" />
                                            <Text c="dimmed" ta="center">Selecione uma declaração ou crie uma nova</Text>
                                        </Stack>
                                    </Center>
                                </Card>
                            ) : (
                                <>
                                    {/* Active header */}
                                    <Group justify="space-between">
                                        <Group>
                                            <Badge size="lg" color={STATUS_CONFIG[editingData.status].color} leftSection={STATUS_CONFIG[editingData.status].icon}>
                                                {STATUS_CONFIG[editingData.status].label}
                                            </Badge>
                                            <Text size="sm" c="dimmed">{teamName(editingData.teamId)}</Text>
                                        </Group>
                                        <Group>
                                            {editingData.status === 'draft' && (
                                                <>
                                                    <Tooltip label="Gerar Q4 com IA" position="bottom">
                                                        <Button
                                                            variant="light"
                                                            color="grape"
                                                            leftSection={<IconRobot size={16} />}
                                                            loading={generating}
                                                            disabled={!q1q2q3Filled}
                                                            onClick={handleGenerateQ4}
                                                        >
                                                            Gerar Q4
                                                        </Button>
                                                    </Tooltip>
                                                    <Button
                                                        variant="gradient"
                                                        gradient={{ from: 'green', to: 'teal' }}
                                                        leftSection={<IconSend size={16} />}
                                                        loading={publishing}
                                                        disabled={!q1q2q3Filled}
                                                        onClick={handlePublish}
                                                    >
                                                        Publicar
                                                    </Button>
                                                </>
                                            )}
                                        </Group>
                                    </Group>

                                    {/* Quarter editors */}
                                    {QUARTERS.map(q => {
                                        const readOnly = editingData.status !== 'draft';
                                        const value = (editingData as any)[q.key] || '';
                                        return (
                                            <Card key={q.key} withBorder p="md" radius="md">
                                                <Group mb="sm" justify="space-between">
                                                    <Group gap="xs">
                                                        <Text size="lg">{q.icon}</Text>
                                                        <Text fw={600} size="sm">{q.title}</Text>
                                                    </Group>
                                                    {q.ai && editingData.aiModelUsed && (
                                                        <Badge
                                                            size="xs"
                                                            color="grape"
                                                            variant="light"
                                                            leftSection={<IconRobot size={10} />}
                                                        >
                                                            {editingData.aiQuarterEdited ? 'IA + Editado' : 'Gerado por IA'}
                                                        </Badge>
                                                    )}
                                                </Group>
                                                {readOnly ? (
                                                    <Blockquote color="gray" p="md" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {value || <Text c="dimmed" fs="italic">Sem conteúdo</Text>}
                                                    </Blockquote>
                                                ) : (
                                                    <Textarea
                                                        placeholder={q.placeholder}
                                                        value={value}
                                                        onChange={(e) => handleContentChange(q.key, e.target.value)}
                                                        minRows={4}
                                                        maxRows={12}
                                                        autosize
                                                        styles={{ input: { fontFamily: 'Georgia, serif', lineHeight: 1.7 } }}
                                                    />
                                                )}
                                            </Card>
                                        );
                                    })}
                                </>
                            )}
                        </Stack>
                    </Group>
                </Tabs.Panel>

                {/* ── TAB 2: LINHAGEM ── */}
                <Tabs.Panel value="linhagem" pt="xl">
                    <Stack gap="lg">
                        <Title order={3}>Galeria de Linhagem</Title>
                        <Text c="dimmed" size="sm">Todas as Anunciações da organização — das mais recentes às sacramentadas</Text>

                        {declarations.length === 0 ? (
                            <Card withBorder p="xl" radius="md">
                                <Center>
                                    <Stack align="center" gap="xs">
                                        <IconTimeline size={48} color="gray" />
                                        <Text c="dimmed" ta="center">Nenhuma declaração na linhagem ainda</Text>
                                    </Stack>
                                </Center>
                            </Card>
                        ) : (
                            <Timeline active={activeDeclarations.length > 0 ? 0 : -1} bulletSize={28} lineWidth={2}>
                                {[...activeDeclarations, ...enshrined].map((d) => {
                                    const cfg = STATUS_CONFIG[d.status];
                                    const date = d.publishedAt
                                        ? new Date(d.publishedAt * 1000).toLocaleDateString('pt-BR')
                                        : d.createdAt
                                            ? new Date(d.createdAt * 1000).toLocaleDateString('pt-BR')
                                            : '';
                                    return (
                                        <Timeline.Item
                                            key={d.id}
                                            bullet={d.status === 'active' ? <IconCrown size={14} /> : <IconArchive size={14} />}
                                            color={cfg.color}
                                            title={
                                                <Group gap="xs">
                                                    <Text fw={600}>{teamName(d.teamId)}</Text>
                                                    <Badge size="xs" color={cfg.color} variant="light">{cfg.label}</Badge>
                                                </Group>
                                            }
                                        >
                                            <Text size="sm" c="dimmed">{date}</Text>
                                            {d.quarter1Preview && (
                                                <Paper p="sm" mt="xs" bg="gray.0" radius="sm">
                                                    <Text size="sm" fs="italic" lineClamp={3}>"{d.quarter1Preview}..."</Text>
                                                </Paper>
                                            )}
                                            <Button
                                                variant="subtle"
                                                size="xs"
                                                mt="xs"
                                                leftSection={<IconEye size={14} />}
                                                onClick={() => { fetchDeclaration(d.id); setActiveTab('escrita'); }}
                                            >
                                                Ler Completo
                                            </Button>
                                        </Timeline.Item>
                                    );
                                })}
                            </Timeline>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* ── TAB 3: CONFIGURAÇÕES ── */}
                <Tabs.Panel value="config" pt="xl">
                    <Stack gap="lg">
                        <Title order={3}>Configurações da Anunciação</Title>
                        <Text c="dimmed" size="sm">Controle o comportamento do recurso na sua organização</Text>

                        {!settings ? (
                            <Loader />
                        ) : (
                            <Stack gap="md">
                                <Card withBorder p="md" radius="md">
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={600}>Recurso Habilitado</Text>
                                            <Text size="xs" c="dimmed">Ativar ou desativar a Anunciação para a organização</Text>
                                        </div>
                                        <Switch
                                            checked={!!settings.enabled}
                                            onChange={(e) => handleUpdateSettings('enabled', e.currentTarget.checked)}
                                            size="lg"
                                        />
                                    </Group>
                                </Card>

                                <Card withBorder p="md" radius="md">
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={600}>Obrigatório para Gestão de Equipes</Text>
                                            <Text size="xs" c="dimmed">Bloqueia gestão de equipe até líder publicar uma Anunciação</Text>
                                        </div>
                                        <Switch
                                            checked={!!settings.requiredForTeamAccess}
                                            onChange={(e) => handleUpdateSettings('requiredForTeamAccess', e.currentTarget.checked)}
                                            size="lg"
                                            disabled={!settings.enabled}
                                        />
                                    </Group>
                                </Card>

                                <Card withBorder p="md" radius="md">
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={600}>Visibilidade</Text>
                                            <Text size="xs" c="dimmed">Quem pode ver as Anunciações publicadas</Text>
                                        </div>
                                        <SegmentedControl
                                            value={settings.visibility}
                                            onChange={(val) => handleUpdateSettings('visibility', val)}
                                            disabled={!settings.enabled}
                                            data={[
                                                { value: 'org_wide', label: 'Toda Organização' },
                                                { value: 'leadership_only', label: 'Apenas Liderança' },
                                            ]}
                                        />
                                    </Group>
                                </Card>

                                <Card withBorder p="md" radius="md">
                                    <Group justify="space-between">
                                        <div>
                                            <Text fw={600}>Modelo de IA para Q4</Text>
                                            <Text size="xs" c="dimmed">Modelo usado para gerar o Quarto Quartel</Text>
                                        </div>
                                        <Select
                                            value={settings.aiModelPreference}
                                            onChange={(val) => val && handleUpdateSettings('aiModelPreference', val)}
                                            disabled={!settings.enabled}
                                            data={[
                                                { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
                                                { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
                                                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Rápido)' },
                                            ]}
                                            w={220}
                                        />
                                    </Group>
                                </Card>
                            </Stack>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            {/* Create Modal */}
            <Modal opened={createOpen} onClose={closeCreate} title="Nova Anunciação" centered>
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Uma Anunciação é seu manifesto de liderança — uma declaração de quem você é,
                        no que acredita, e o que está construindo. A IA complementará com uma síntese
                        no Quarto Quartel.
                    </Text>
                    <Select
                        label="Equipe"
                        placeholder="Selecione a equipe"
                        data={(teams || []).map((t: any) => ({ value: t.id, label: t.name }))}
                        value={newTeamId}
                        onChange={(v) => setNewTeamId(v || '')}
                        searchable
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeCreate}>Cancelar</Button>
                        <Button
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape' }}
                            disabled={!newTeamId.trim()}
                            onClick={handleCreate}
                        >
                            Criar Rascunho
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
