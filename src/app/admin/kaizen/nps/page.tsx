'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    RingProgress,
} from '@mantine/core';
import {
    IconChartDonut,
    IconPlus,
    IconEye,
    IconDotsVertical,
    IconMoodSmile,
    IconMoodSad,
    IconMoodNeutral,
} from '@tabler/icons-react';

interface NPSSurvey {
    id: string;
    name: string;
    sentCount: number;
    responseCount: number;
    promoters: number;
    passives: number;
    detractors: number;
    score: number;
    status: 'active' | 'completed' | 'draft';
    createdAt: string;
}

// Mock data
const mockSurveys: NPSSurvey[] = [
    { id: '1', name: 'NPS Geral - Janeiro 2026', sentCount: 150, responseCount: 98, promoters: 65, passives: 23, detractors: 10, score: 56, status: 'completed', createdAt: '2026-01-15' },
    { id: '2', name: 'NPS Pós-Matrícula', sentCount: 50, responseCount: 32, promoters: 24, passives: 6, detractors: 2, score: 69, status: 'active', createdAt: '2026-02-01' },
    { id: '3', name: 'NPS Turma Avançado', sentCount: 25, responseCount: 0, promoters: 0, passives: 0, detractors: 0, score: 0, status: 'draft', createdAt: '2026-02-05' },
];

const statusColors: Record<string, string> = {
    active: 'green',
    completed: 'blue',
    draft: 'gray',
};

const statusLabels: Record<string, string> = {
    active: 'Ativa',
    completed: 'Concluída',
    draft: 'Rascunho',
};

function getNPSColor(score: number): string {
    if (score >= 50) return 'green';
    if (score >= 0) return 'yellow';
    return 'red';
}

function getNPSLabel(score: number): string {
    if (score >= 75) return 'Excelente';
    if (score >= 50) return 'Bom';
    if (score >= 0) return 'Regular';
    return 'Crítico';
}

export default function NPSPage() {
    const [surveys] = useState<NPSSurvey[]>(mockSurveys);

    const completedSurveys = surveys.filter(s => s.status === 'completed');
    const avgScore = completedSurveys.length > 0
        ? Math.round(completedSurveys.reduce((acc, s) => acc + s.score, 0) / completedSurveys.length)
        : 0;
    const totalResponses = surveys.reduce((acc, s) => acc + s.responseCount, 0);

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Kaizen</Text>
                    <Title order={2}>NPS</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Pesquisa NPS
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color={getNPSColor(avgScore)} size="lg" radius="md">
                            <IconChartDonut size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">NPS Médio</Text>
                            <Text fw={700} size="xl">{avgScore}</Text>
                            <Text size="xs" c={getNPSColor(avgScore)}>{getNPSLabel(avgScore)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconMoodSmile size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Promotores</Text>
                            <Text fw={700} size="xl">
                                {completedSurveys.reduce((acc, s) => acc + s.promoters, 0)}
                            </Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconMoodSad size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Detratores</Text>
                            <Text fw={700} size="xl">
                                {completedSurveys.reduce((acc, s) => acc + s.detractors, 0)}
                            </Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconMoodNeutral size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Respostas Totais</Text>
                            <Text fw={700} size="xl">{totalResponses}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Pesquisas NPS</Title>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {surveys.map((survey) => (
                        <Card key={survey.id} withBorder p="md">
                            <Group justify="space-between">
                                <Group>
                                    <RingProgress
                                        size={60}
                                        thickness={6}
                                        sections={[
                                            { value: survey.promoters, color: 'green' },
                                            { value: survey.passives, color: 'yellow' },
                                            { value: survey.detractors, color: 'red' },
                                        ]}
                                        label={
                                            <Text ta="center" size="xs" fw={700}>
                                                {survey.score || '-'}
                                            </Text>
                                        }
                                    />
                                    <div>
                                        <Text fw={500}>{survey.name}</Text>
                                        <Group gap="xs">
                                            <Badge color={statusColors[survey.status]} variant="light" size="sm">
                                                {statusLabels[survey.status]}
                                            </Badge>
                                            <Text size="xs" c="dimmed">
                                                {survey.responseCount}/{survey.sentCount} respostas
                                            </Text>
                                        </Group>
                                    </div>
                                </Group>
                                <Menu position="bottom-end" withArrow>
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" color="gray">
                                            <IconDotsVertical size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item leftSection={<IconEye size={14} />}>Ver Resultados</Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        </Card>
                    ))}
                </div>
            </Card>
        </div>
    );
}

