'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group,
    ThemeIcon, Button, Table, Loader, Center, Modal,
    TextInput, Textarea, Select, NumberInput, Divider,
    Alert, ActionIcon, Tabs,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconTarget, IconPlus, IconSparkles, IconTrophy,
    IconUpload, IconEye, IconStar, IconFlame,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// CONFIG
// ============================================================================

const MISSION_TYPES = [
    { value: 'learning', label: '📖 Aprendizado' },
    { value: 'practice', label: '🏋️ Prática' },
    { value: 'challenge', label: '⚔️ Desafio' },
    { value: 'exploration', label: '🔍 Exploração' },
    { value: 'review', label: '🔄 Revisão' },
];

const DIFFICULTY_LEVELS = [
    { value: 'beginner', label: '🟢 Iniciante', color: 'green' },
    { value: 'intermediate', label: '🟡 Intermediário', color: 'yellow' },
    { value: 'advanced', label: '🟠 Avançado', color: 'orange' },
    { value: 'expert', label: '🔴 Expert', color: 'red' },
];

// ============================================================================
// PAGE
// ============================================================================

export default function MissionsPage() {
    const { data: missionsData, isLoading, refetch } = useApi<any>('/api/missions');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [missionType, setMissionType] = useState<string | null>('learning');
    const [difficulty, setDifficulty] = useState<string | null>('intermediate');
    const [xpReward, setXpReward] = useState<number>(100);
    const [conceptTagsStr, setConceptTagsStr] = useState('');

    // Import state
    const [importJson, setImportJson] = useState('');
    const [importError, setImportError] = useState('');

    const missionsList = missionsData?.data || [];

    const stats = {
        total: missionsList.length,
        active: missionsList.filter((m: any) => m.isActive).length,
        aiGenerated: missionsList.filter((m: any) => m.generatedByAi).length,
        totalXp: missionsList.reduce((sum: number, m: any) => sum + (m.xpReward || 0), 0),
    };

    const saveMission = async () => {
        setSaving(true);
        try {
            const tags = conceptTagsStr
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);

            await fetch('/api/missions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    instructions,
                    missionType,
                    difficulty,
                    xpReward,
                    conceptTags: tags,
                }),
            });
            refetch();
            setTitle(''); setDescription(''); setInstructions(''); setConceptTagsStr('');
            closeCreate();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const importMissions = async () => {
        setSaving(true);
        setImportError('');
        try {
            const parsed = JSON.parse(importJson);
            const items = Array.isArray(parsed) ? parsed : [parsed];

            await fetch('/api/missions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items.map(item => ({
                    ...item,
                    generatedByAi: item.generatedByAi || true,
                }))),
            });
            refetch();
            setImportJson('');
            closeImport();
        } catch (e: any) {
            setImportError(e.message || 'JSON inválido');
        }
        setSaving(false);
    };

    const difficultyColor = (d: string) => DIFFICULTY_LEVELS.find(dl => dl.value === d)?.color || 'gray';

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Pedagógico</Text>
                    <Title order={2}>Missões</Title>
                    <Text size="sm" c="dimmed" mt={4}>
                        Gamificação: missões extras que avançam o grafo de conhecimento do aluno
                    </Text>
                </div>
                <Group gap="xs">
                    <Button variant="light" leftSection={<IconUpload size={16} />} color="cyan" onClick={openImport}>
                        Importar JSON
                    </Button>
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                        Nova Missão
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg" radius="md">
                            <IconTarget size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Missões</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg" radius="md">
                            <IconFlame size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{stats.active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg" radius="md">
                            <IconSparkles size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Geradas por IA</Text>
                            <Text fw={700} size="lg">{stats.aiGenerated}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg" radius="md">
                            <IconTrophy size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">XP Total Disponível</Text>
                            <Text fw={700} size="lg">{stats.totalXp.toLocaleString()}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Missions List */}
            <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                    <Text fw={600}>Missões</Text>
                    <Badge variant="light">{missionsList.length} missões</Badge>
                </Group>

                {isLoading ? (
                    <Center h={200}><Loader size="lg" /></Center>
                ) : missionsList.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Missão</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Dificuldade</Table.Th>
                                <Table.Th>XP</Table.Th>
                                <Table.Th>Tags</Table.Th>
                                <Table.Th>Origem</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {missionsList.map((m: any) => (
                                <Table.Tr key={m.id}>
                                    <Table.Td>
                                        <div>
                                            <Text fw={500} size="sm">{m.title}</Text>
                                            {m.description && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>{m.description}</Text>
                                            )}
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {MISSION_TYPES.find(t => t.value === m.missionType)?.label}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={difficultyColor(m.difficulty)} size="sm">
                                            {DIFFICULTY_LEVELS.find(d => d.value === m.difficulty)?.label}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <IconStar size={14} color="goldenrod" />
                                            <Text fw={600} size="sm">{m.xpReward}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {(m.conceptTags || []).slice(0, 2).map((tag: string, i: number) => (
                                                <Badge key={i} variant="outline" size="xs">{tag}</Badge>
                                            ))}
                                            {(m.conceptTags || []).length > 2 && (
                                                <Text size="xs" c="dimmed">+{(m.conceptTags || []).length - 2}</Text>
                                            )}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={m.generatedByAi ? 'violet' : 'gray'} variant="light" size="xs">
                                            {m.generatedByAi ? '🤖 IA' : '👤 Manual'}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconTarget size={48} color="gray" />
                            <Text c="dimmed">Nenhuma missão criada</Text>
                            <Text size="xs" c="dimmed">
                                Missões são tarefas extras gamificadas que avançam o grafo de conhecimento.
                                Crie manualmente ou importe JSON da IA.
                            </Text>
                            <Group gap="xs">
                                <Button size="xs" onClick={openCreate}>Criar missão</Button>
                                <Button size="xs" variant="light" color="cyan" onClick={openImport}>Importar JSON</Button>
                            </Group>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Create Mission Modal */}
            <Modal opened={createOpened} onClose={closeCreate} title="Nova Missão" size="md">
                <Stack gap="md">
                    <TextInput label="Título" placeholder="Ex: Pratique Present Perfect em contextos reais"
                        value={title} onChange={e => setTitle(e.target.value)} required />

                    <Textarea label="Descrição" placeholder="O que o aluno vai conquistar..."
                        value={description} onChange={e => setDescription(e.target.value)} rows={2} />

                    <Group grow>
                        <Select label="Tipo" data={MISSION_TYPES}
                            value={missionType} onChange={setMissionType} />
                        <Select label="Dificuldade" data={DIFFICULTY_LEVELS.map(d => ({
                            value: d.value, label: d.label,
                        }))} value={difficulty} onChange={setDifficulty} />
                    </Group>

                    <Textarea label="Instruções" placeholder="Passo a passo..."
                        value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} />

                    <Group grow>
                        <NumberInput label="Recompensa XP" value={xpReward}
                            onChange={v => setXpReward(Number(v))} min={10} max={1000} step={10} />
                        <TextInput label="Tags (separadas por vírgula)"
                            placeholder="grammar, present_perfect, speaking"
                            value={conceptTagsStr} onChange={e => setConceptTagsStr(e.target.value)} />
                    </Group>

                    <Button onClick={saveMission} loading={saving} disabled={!title}>
                        Criar Missão
                    </Button>
                </Stack>
            </Modal>

            {/* Import JSON Modal */}
            <Modal opened={importOpened} onClose={closeImport} title="Importar Missões via JSON" size="lg">
                <Stack gap="md">
                    <Alert variant="light" color="cyan" icon={<IconSparkles size={20} />}>
                        <Text size="sm">
                            Cole o JSON gerado pela IA (Synapse). Formato: array de objetos com
                            <strong> title</strong>, <strong>description</strong>, <strong>instructions</strong>,
                            <strong> missionType</strong>, <strong>difficulty</strong>, <strong>xpReward</strong>,
                            <strong> conceptTags</strong>.
                        </Text>
                    </Alert>

                    <Textarea
                        label="JSON"
                        placeholder={'[\n  {\n    "title": "Mission Title",\n    "description": "...",\n    "missionType": "practice",\n    "difficulty": "intermediate",\n    "xpReward": 150,\n    "conceptTags": ["tag1", "tag2"]\n  }\n]'}
                        value={importJson}
                        onChange={e => setImportJson(e.target.value)}
                        rows={12}
                        autosize
                        minRows={8}
                        maxRows={20}
                        styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
                    />

                    {importError && (
                        <Alert color="red" p="xs">
                            <Text size="xs">{importError}</Text>
                        </Alert>
                    )}

                    <Button onClick={importMissions} loading={saving} disabled={!importJson}
                        color="cyan" leftSection={<IconUpload size={16} />}>
                        Importar Missões
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
