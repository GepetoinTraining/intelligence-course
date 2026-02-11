'use client';

/**
 * StudentKnowledgeGraph — Mermaid mindmap of personal mastery
 *
 * Renders the student's knowledge as a color-coded mindmap:
 *   🟢 mastered — green nodes
 *   🟡 practicing — yellow nodes
 *   🔵 introduced — blue nodes
 *   ⚪ not_started — gray nodes
 *
 * Fetches from GET /api/wiki/student-graph
 */

import { useMemo } from 'react';
import {
    Stack,
    Card,
    Group,
    Badge,
    Text,
    Title,
    Loader,
    Center,
    Alert,
    SimpleGrid,
    ThemeIcon,
    Paper,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconBrain,
    IconTrophy,
    IconProgress,
    IconEye,
    IconClock,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { MermaidDiagram } from './MermaidDiagram';

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

interface MasteryItem {
    id: string;
    mastery: 'not_started' | 'introduced' | 'practicing' | 'mastered';
    source: string | null;
    viewCount: number;
    timeSpentSeconds: number;
    assessmentScore: number | null;
    lastInteractedAt: number | null;
    nodeId: string;
    nodeTitle: string;
    nodeType: string;
    nodeDescription: string | null;
    difficulty: string | null;
    subjectArea: string | null;
}

interface StudentGraphData {
    masteryData: MasteryItem[];
    stats: {
        total: number;
        mastered: number;
        practicing: number;
        introduced: number;
        notStarted: number;
        totalTimeMinutes: number;
    };
}

// ────────────────────────────────────────────────────────────────────
// Mastery config
// ────────────────────────────────────────────────────────────────────

const MASTERY_COLORS: Record<string, string> = {
    mastered: 'green',
    practicing: 'yellow',
    introduced: 'blue',
    not_started: 'gray',
};

const MASTERY_EMOJI: Record<string, string> = {
    mastered: '🟢',
    practicing: '🟡',
    introduced: '🔵',
    not_started: '⚪',
};

const MASTERY_LABELS: Record<string, string> = {
    mastered: 'Dominado',
    practicing: 'Praticando',
    introduced: 'Introduzido',
    not_started: 'Não Iniciado',
};

// ────────────────────────────────────────────────────────────────────
// Mermaid generation
// ────────────────────────────────────────────────────────────────────

function generateStudentMindmap(data: MasteryItem[]): string {
    if (data.length === 0) return '';

    let diagram = `mindmap\n`;
    diagram += `  root((Meu Conhecimento))\n`;

    // Group by subjectArea (or nodeType if no subject)
    const groups = new Map<string, MasteryItem[]>();
    data.forEach(item => {
        const group = item.subjectArea || item.nodeType || 'Geral';
        const arr = groups.get(group) || [];
        arr.push(item);
        groups.set(group, arr);
    });

    groups.forEach((items, group) => {
        // Sanitize group name for Mermaid
        const safeGroup = group.replace(/[[\]{}()#;\"]/g, '');
        diagram += `    ${safeGroup}\n`;

        items.slice(0, 8).forEach(item => {
            const emoji = MASTERY_EMOJI[item.mastery] || '⚪';
            const safeTitle = item.nodeTitle.replace(/[[\]{}()#;\"]/g, '');
            diagram += `      ${emoji} ${safeTitle}\n`;
        });

        if (items.length > 8) {
            diagram += `      ... +${items.length - 8} mais\n`;
        }
    });

    return diagram;
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────

export function StudentKnowledgeGraph() {
    const { data, isLoading, error } = useApi<StudentGraphData>(
        '/api/wiki/student-graph'
    );

    const mermaidSyntax = useMemo(() => {
        if (!data?.masteryData) return '';
        return generateStudentMindmap(data.masteryData);
    }, [data]);

    if (isLoading) {
        return (
            <Center h={300}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
                Erro ao carregar grafo de conhecimento: {error}
            </Alert>
        );
    }

    const stats = data?.stats;
    const hasData = (stats?.total || 0) > 0;

    return (
        <Stack gap="lg">
            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconTrophy size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Dominados</Text>
                            <Text fw={700} size="lg">{stats?.mastered || 0}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconProgress size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Praticando</Text>
                            <Text fw={700} size="lg">{stats?.practicing || 0}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconEye size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Introduzidos</Text>
                            <Text fw={700} size="lg">{stats?.introduced || 0}</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tempo Total</Text>
                            <Text fw={700} size="lg">{stats?.totalTimeMinutes || 0}min</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Legend */}
            <Group gap="md">
                {Object.entries(MASTERY_LABELS).map(([key, label]) => (
                    <Badge key={key} color={MASTERY_COLORS[key]} variant="light" size="sm">
                        {MASTERY_EMOJI[key]} {label}
                    </Badge>
                ))}
            </Group>

            {/* Mermaid Mindmap */}
            {hasData && mermaidSyntax ? (
                <Card withBorder p="md" radius="md">
                    <Group justify="space-between" mb="sm">
                        <Group gap="xs">
                            <IconBrain size={18} />
                            <Title order={4}>Mapa de Conhecimento</Title>
                        </Group>
                        <Badge variant="dot" color="gray">
                            {stats?.total} conceitos
                        </Badge>
                    </Group>
                    <MermaidDiagram syntax={mermaidSyntax} />
                </Card>
            ) : (
                <Card withBorder p="xl" radius="md">
                    <Center>
                        <Stack align="center" gap="xs">
                            <IconBrain size={48} color="gray" />
                            <Text c="dimmed" ta="center">
                                Ainda sem conceitos no seu grafo de conhecimento.
                            </Text>
                            <Text c="dimmed" size="xs" ta="center">
                                Explore artigos da Wiki e complete lições para construir seu mapa!
                            </Text>
                        </Stack>
                    </Center>
                </Card>
            )}
        </Stack>
    );
}
