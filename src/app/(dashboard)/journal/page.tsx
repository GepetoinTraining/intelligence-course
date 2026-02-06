'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    TextInput, Textarea, Paper, ThemeIcon, ActionIcon,
    Tabs, Select, Collapse
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch, IconCheck, IconX, IconBulb,
    IconDownload, IconChevronDown, IconChevronRight,
    IconSparkles, IconQuestionMark, IconBook
} from '@tabler/icons-react';

interface Annotation {
    id: string;
    text: string;
    type: 'reflection' | 'breakthrough' | 'lesson_learned' | 'question';
    insightCaptured: boolean;
    createdAt: string;
}

interface PromptRun {
    id: string;
    promptTitle: string;
    promptId: string;
    model: string;
    heldCharacter: boolean;
    technique?: string;
    userMessage: string;
    assistantResponse: string;
    annotations: Annotation[];
    createdAt: string;
}

// Mock data
const MOCK_RUNS: PromptRun[] = [
    {
        id: 'run-142',
        promptTitle: 'Grumpy Blacksmith v3',
        promptId: 'p1',
        model: 'claude-sonnet-4.5',
        heldCharacter: true,
        technique: 'orbit',
        userMessage: 'What do you think about WiFi routers?',
        assistantResponse: `*wipes soot from hands on leather apron and squints suspiciously*

Wee-fee? Routers? Sounds like some manner of foreign sorcery ye speak of. In my forty years at this forge, I've worked iron, steel, and bronze - honest metals that bend to hammer and flame.

*gestures to the bellows and anvil*

If it cannot be shaped by fire and will, if it cannot hold an edge or bear a load, then I've no use for it. My father forged blades before me, and his father before him. We work with things a man can understand - red hot metal, the ring of the hammer, the hiss of the quench.

*returns to pumping the bellows, muttering*

Routers... Bah. Probably some alchemist's nonsense. Now, did ye come here to prattle about invisible spirits, or do ye need honest work done?`,
        annotations: [
            {
                id: 'a1',
                text: 'Adding the forge sounds made it stick. Sensory details = stronger context.',
                type: 'breakthrough',
                insightCaptured: true,
                createdAt: '2026-02-02T14:35:00Z',
            }
        ],
        createdAt: '2026-02-02T14:34:00Z',
    },
    {
        id: 'run-141',
        promptTitle: 'Grumpy Blacksmith v2',
        promptId: 'p1',
        model: 'claude-sonnet-4.5',
        heldCharacter: false,
        technique: 'orbit',
        userMessage: 'What do you think about WiFi routers?',
        assistantResponse: `Well, WiFi routers are actually quite fascinating devices! They use radio waves to transmit data...

*catches self*

I mean... uh... what manner of witchcraft be this ye speak of?`,
        annotations: [
            {
                id: 'a2',
                text: 'Too many instructions. Need to compress. The AI got confused and broke character mid-response.',
                type: 'lesson_learned',
                insightCaptured: false,
                createdAt: '2026-02-02T14:15:00Z',
            }
        ],
        createdAt: '2026-02-02T14:12:00Z',
    },
    {
        id: 'run-140',
        promptTitle: 'Haiku Coder',
        promptId: 'p2',
        model: 'claude-sonnet-4.5',
        heldCharacter: true,
        technique: 'black_hole',
        userMessage: 'Explain a for loop',
        assistantResponse: `Count begins at start
Step through each one, then repeat
Until end is reached`,
        annotations: [],
        createdAt: '2026-02-02T12:00:00Z',
    },
    {
        id: 'run-139',
        promptTitle: 'Alien Tourist Guide',
        promptId: 'p3',
        model: 'claude-sonnet-4.5',
        heldCharacter: true,
        technique: 'orbit',
        userMessage: 'Explain a coffee shop to me',
        assistantResponse: `*adjusts translation membrane*

Ah yes, I have observed this human ritual establishment! The "coffee shop" appears to be a social nexus where your species consumes a dark liquid extracted from burnt plant seeds.

The behavioral patterns are fascinating: humans enter in states of apparent torpor, exchange small metal discs or wave plastic rectangles at a counter-stationed human, then receive heated liquid in disposable cylinders. After consumption, their activity levels increase dramatically.

I have theorized this "coffee" may be some form of legal stimulant drug. The rituals surrounding its preparation - the grinding, the steaming, the precise water temperatures - suggest religious significance.

Most curious is the presence of portable computation devices. Many humans sit for extended periods, staring at glowing screens. Perhaps the coffee shop doubles as a collective charging station?

*makes note in universal translator*

I shall require further study.`,
        annotations: [
            {
                id: 'a3',
                text: 'The "translation membrane" detail was a nice touch. Wonder if other sensory/tech details would help maintain alien perspective?',
                type: 'question',
                insightCaptured: false,
                createdAt: '2026-02-02T11:45:00Z',
            }
        ],
        createdAt: '2026-02-02T11:30:00Z',
    },
];

const ANNOTATION_TYPES = {
    reflection: { icon: IconBook, color: 'gray', label: 'Reflexão' },
    breakthrough: { icon: IconSparkles, color: 'yellow', label: 'Breakthrough' },
    lesson_learned: { icon: IconBulb, color: 'orange', label: 'Lição Aprendida' },
    question: { icon: IconQuestionMark, color: 'blue', label: 'Pergunta' },
};

export default function JournalPage() {
    const [runs] = useState<PromptRun[]>(MOCK_RUNS);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | null>('all');
    const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set(['run-142']));
    const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
    const [newAnnotation, setNewAnnotation] = useState<{ runId: string; text: string; type: string } | null>(null);

    const toggleExpand = (runId: string) => {
        setExpandedRuns(prev => {
            const next = new Set(prev);
            if (next.has(runId)) {
                next.delete(runId);
            } else {
                next.add(runId);
            }
            return next;
        });
    };

    const filteredRuns = runs.filter(run => {
        const matchesSearch = run.promptTitle.toLowerCase().includes(search.toLowerCase()) ||
            run.annotations.some(a => a.text.toLowerCase().includes(search.toLowerCase()));

        if (filterStatus === 'held') return matchesSearch && run.heldCharacter;
        if (filterStatus === 'broke') return matchesSearch && !run.heldCharacter;
        if (filterStatus === 'annotated') return matchesSearch && run.annotations.length > 0;
        return matchesSearch;
    });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Hoje';
        if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
        return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    };

    // Group runs by date
    const groupedRuns = filteredRuns.reduce((acc, run) => {
        const dateKey = formatDate(run.createdAt);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(run);
        return acc;
    }, {} as Record<string, PromptRun[]>);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Run Journal 📓</Title>
                    <Text c="dimmed">Histórico anotado das suas interações com IA</Text>
                </div>
                <Button
                    variant="light"
                    leftSection={<IconDownload size={16} />}
                >
                    Exportar PDF
                </Button>
            </Group>

            {/* Filters */}
            <Group>
                <TextInput
                    placeholder="Buscar nos runs ou anotações..."
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, maxWidth: 400 }}
                />
                <Select
                    placeholder="Filtrar"
                    value={filterStatus}
                    onChange={setFilterStatus}
                    data={[
                        { value: 'all', label: 'Todos os runs' },
                        { value: 'held', label: '✓ Manteve personagem' },
                        { value: 'broke', label: '✗ Quebrou personagem' },
                        { value: 'annotated', label: '📝 Com anotações' },
                    ]}
                    w={200}
                    clearable
                />
            </Group>

            {/* Stats */}
            <Group gap="xl">
                <Paper p="md" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon size={32} variant="light" color="violet" radius="xl">
                            <IconBook size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{runs.length}</Text>
                            <Text size="xs" c="dimmed">Total de Runs</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon size={32} variant="light" color="green" radius="xl">
                            <IconCheck size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{runs.filter(r => r.heldCharacter).length}</Text>
                            <Text size="xs" c="dimmed">Personagem Mantido</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Group gap="xs">
                        <ThemeIcon size={32} variant="light" color="yellow" radius="xl">
                            <IconBulb size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{runs.flatMap(r => r.annotations).filter(a => a.insightCaptured).length}</Text>
                            <Text size="xs" c="dimmed">Insights Capturados</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>

            {/* Timeline */}
            <Stack gap="lg">
                {Object.entries(groupedRuns).map(([date, dateRuns]) => (
                    <Stack key={date} gap="sm">
                        <Text size="sm" fw={600} c="dimmed">{date}</Text>

                        {dateRuns.map((run) => (
                            <Card key={run.id} shadow="xs" radius="md" p="md" withBorder>
                                {/* Run Header */}
                                <Group
                                    justify="space-between"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => toggleExpand(run.id)}
                                >
                                    <Group gap="md">
                                        <ActionIcon variant="subtle" color="gray">
                                            {expandedRuns.has(run.id) ?
                                                <IconChevronDown size={16} /> :
                                                <IconChevronRight size={16} />
                                            }
                                        </ActionIcon>
                                        <div>
                                            <Group gap="xs">
                                                <Text fw={500}>#{run.id.split('-')[1]}</Text>
                                                <Text c="dimmed">·</Text>
                                                <Text size="sm">{formatTime(run.createdAt)}</Text>
                                                <Text c="dimmed">·</Text>
                                                <Text size="sm" c="dimmed">{run.model}</Text>
                                            </Group>
                                            <Text size="sm" c="violet">{run.promptTitle}</Text>
                                        </div>
                                    </Group>
                                    <Group gap="sm">
                                        {run.technique && (
                                            <Badge variant="light" color="cyan" size="sm">
                                                {run.technique}
                                            </Badge>
                                        )}
                                        {run.heldCharacter ? (
                                            <Badge variant="light" color="green" leftSection={<IconCheck size={12} />}>
                                                Manteve
                                            </Badge>
                                        ) : (
                                            <Badge variant="light" color="red" leftSection={<IconX size={12} />}>
                                                Quebrou
                                            </Badge>
                                        )}
                                        {run.annotations.length > 0 && (
                                            <Badge variant="outline" color="gray">
                                                {run.annotations.length} nota{run.annotations.length > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </Group>
                                </Group>

                                {/* Expanded Content */}
                                <Collapse in={expandedRuns.has(run.id)}>
                                    <Stack gap="md" mt="md">
                                        {/* User Message */}
                                        <Paper p="sm" radius="sm" withBorder>
                                            <Text size="xs" fw={600} c="dimmed" mb={4}>Você:</Text>
                                            <Text size="sm">{run.userMessage}</Text>
                                        </Paper>

                                        {/* Assistant Response */}
                                        <Paper p="sm" radius="sm" withBorder bg="var(--mantine-color-gray-0)">
                                            <Text size="xs" fw={600} c="dimmed" mb={4}>Assistente:</Text>
                                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                {run.assistantResponse}
                                            </Text>
                                        </Paper>

                                        {/* Annotations */}
                                        {run.annotations.length > 0 && (
                                            <Stack gap="xs">
                                                <Text size="xs" fw={600} c="dimmed">Anotações:</Text>
                                                {run.annotations.map((annotation) => {
                                                    const typeConfig = ANNOTATION_TYPES[annotation.type];
                                                    const Icon = typeConfig.icon;
                                                    return (
                                                        <Paper
                                                            key={annotation.id}
                                                            p="sm"
                                                            radius="sm"
                                                            withBorder
                                                            style={{ borderColor: `var(--mantine-color-${typeConfig.color}-3)` }}
                                                        >
                                                            <Group justify="space-between" align="flex-start">
                                                                <Group gap="xs" align="flex-start">
                                                                    <ThemeIcon
                                                                        size={20}
                                                                        variant="light"
                                                                        color={typeConfig.color}
                                                                        radius="xl"
                                                                    >
                                                                        <Icon size={12} />
                                                                    </ThemeIcon>
                                                                    <div>
                                                                        <Text size="sm">{annotation.text}</Text>
                                                                        <Text size="xs" c="dimmed" mt={2}>
                                                                            {formatTime(annotation.createdAt)}
                                                                        </Text>
                                                                    </div>
                                                                </Group>
                                                                {annotation.insightCaptured && (
                                                                    <Badge
                                                                        variant="filled"
                                                                        color="yellow"
                                                                        size="xs"
                                                                        leftSection={<IconBulb size={10} />}
                                                                    >
                                                                        Insight
                                                                    </Badge>
                                                                )}
                                                            </Group>
                                                        </Paper>
                                                    );
                                                })}
                                            </Stack>
                                        )}

                                        {/* Add Annotation */}
                                        {newAnnotation?.runId === run.id ? (
                                            <Paper p="sm" radius="sm" withBorder>
                                                <Stack gap="xs">
                                                    <Textarea
                                                        placeholder="O que você aprendeu com esse run?"
                                                        value={newAnnotation.text}
                                                        onChange={(e) => setNewAnnotation(prev =>
                                                            prev ? { ...prev, text: e.target.value } : null
                                                        )}
                                                        autoFocus
                                                        minRows={2}
                                                    />
                                                    <Group justify="space-between">
                                                        <Select
                                                            placeholder="Tipo"
                                                            value={newAnnotation.type}
                                                            onChange={(v) => setNewAnnotation(prev =>
                                                                prev ? { ...prev, type: v || 'reflection' } : null
                                                            )}
                                                            data={Object.entries(ANNOTATION_TYPES).map(([value, config]) => ({
                                                                value,
                                                                label: config.label,
                                                            }))}
                                                            w={160}
                                                        />
                                                        <Group gap="xs">
                                                            <Button
                                                                variant="subtle"
                                                                size="xs"
                                                                onClick={() => setNewAnnotation(null)}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                size="xs"
                                                                onClick={() => {
                                                                    // TODO: Save annotation
                                                                    setNewAnnotation(null);
                                                                }}
                                                            >
                                                                Salvar
                                                            </Button>
                                                            <Button
                                                                size="xs"
                                                                variant="light"
                                                                color="yellow"
                                                                leftSection={<IconBulb size={14} />}
                                                            >
                                                                💡 Capturar Insight
                                                            </Button>
                                                        </Group>
                                                    </Group>
                                                </Stack>
                                            </Paper>
                                        ) : (
                                            <Button
                                                variant="subtle"
                                                size="xs"
                                                leftSection={<IconBook size={14} />}
                                                onClick={() => setNewAnnotation({
                                                    runId: run.id,
                                                    text: '',
                                                    type: 'reflection'
                                                })}
                                            >
                                                Adicionar Anotação
                                            </Button>
                                        )}
                                    </Stack>
                                </Collapse>
                            </Card>
                        ))}
                    </Stack>
                ))}
            </Stack>

            {filteredRuns.length === 0 && (
                <Paper p="xl" radius="md" withBorder ta="center">
                    <IconBook size={48} color="var(--mantine-color-gray-5)" />
                    <Text c="dimmed" mt="md">Nenhum run encontrado</Text>
                    <Text size="sm" c="dimmed">Execute prompts no Playground para começar seu journal</Text>
                </Paper>
            )}
        </Stack>
    );
}

