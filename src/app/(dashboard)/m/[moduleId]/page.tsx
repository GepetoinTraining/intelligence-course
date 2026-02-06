'use client';

import { useState } from 'react';
import { Title, Text, Stack, Group, Paper, Badge, Progress, ThemeIcon, Card } from '@mantine/core';
import { IconCircle, IconCircleCheck, IconCircleHalf, IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    lessonType: string;
    status: 'not_started' | 'in_progress' | 'completed';
}

const MODULE_1_LESSONS: Lesson[] = [
    { id: 'lesson-1-1', title: 'A Camada de Identidade', description: 'Quem está falando?', orderIndex: 0, lessonType: 'standard', status: 'not_started' },
    { id: 'lesson-1-2', title: 'A Camada Temporal', description: 'Quando estamos?', orderIndex: 1, lessonType: 'standard', status: 'not_started' },
    { id: 'lesson-1-3', title: 'A Camada Espacial', description: 'Onde estamos?', orderIndex: 2, lessonType: 'standard', status: 'not_started' },
    { id: 'lesson-1-4', title: 'O Context Stack', description: 'Quem + Quando + Onde = Gravidade', orderIndex: 3, lessonType: 'practice', status: 'not_started' },
    { id: 'lesson-1-5', title: 'O Vácuo (Preparação)', description: 'Preparando o Poço Gravitacional', orderIndex: 4, lessonType: 'practice', status: 'not_started' },
    { id: 'lesson-1-6', title: 'CAPSTONE: The World Builder', description: 'Lance seu planeta. A turma interage.', orderIndex: 5, lessonType: 'capstone', status: 'not_started' },
];

export default function ModulePage() {
    const [lessons] = useState<Lesson[]>(MODULE_1_LESSONS);
    const completedCount = lessons.filter(l => l.status === 'completed').length;
    const progressPercent = Math.round((completedCount / lessons.length) * 100);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Stack gap="xs">
                <Group gap="sm">
                    <Badge variant="light" color="cyan" size="lg">Módulo 1</Badge>
                    <Badge variant="outline" color="gray">6 lições</Badge>
                </Group>
                <Title order={1}>The Orbit</Title>
                <Text c="dimmed" size="lg">
                    Context Stacking — "Não peça o Foguete. Construa o mundo de onde ele decola."
                </Text>
            </Stack>

            {/* Progress Overview */}
            <Paper shadow="xs" radius="md" p="lg" withBorder>
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text fw={500}>Seu Progresso</Text>
                        <Text size="sm" c="dimmed">{completedCount} de {lessons.length} lições</Text>
                    </Group>
                    <Progress value={progressPercent} size="lg" color="cyan" radius="xl" animated />
                </Stack>
            </Paper>

            {/* Lessons List */}
            <Stack gap="md">
                <Title order={3}>Lições</Title>

                {lessons.map((lesson, index) => {
                    const statusIcon = {
                        'not_started': <IconCircle size={20} />,
                        'in_progress': <IconCircleHalf size={20} />,
                        'completed': <IconCircleCheck size={20} />,
                    }[lesson.status];

                    const statusColor = {
                        'not_started': 'gray',
                        'in_progress': 'blue',
                        'completed': 'green',
                    }[lesson.status];

                    return (
                        <Link
                            key={lesson.id}
                            href={`/m/module-1-orbit/l/${lesson.id}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <Card
                                shadow="xs"
                                radius="md"
                                p="lg"
                                withBorder
                                style={{ cursor: 'pointer' }}
                            >
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="md" wrap="nowrap">
                                        <ThemeIcon size={44} radius="xl" variant="light" color={statusColor}>
                                            {statusIcon}
                                        </ThemeIcon>
                                        <Stack gap={4}>
                                            <Group gap="xs">
                                                <Text size="sm" c="dimmed" fw={500}>Lição {index + 1}</Text>
                                                {lesson.lessonType === 'practice' && (
                                                    <Badge size="xs" variant="light" color="violet">Prática</Badge>
                                                )}
                                                {lesson.lessonType === 'capstone' && (
                                                    <Badge size="xs" variant="light" color="orange">Capstone</Badge>
                                                )}
                                            </Group>
                                            <Text fw={600} size="lg">{lesson.title}</Text>
                                            <Text size="sm" c="dimmed">{lesson.description}</Text>
                                        </Stack>
                                    </Group>
                                    <ThemeIcon variant="subtle" size="xl" color="gray">
                                        <IconArrowRight size={20} />
                                    </ThemeIcon>
                                </Group>
                            </Card>
                        </Link>
                    );
                })}
            </Stack>
        </Stack>
    );
}
