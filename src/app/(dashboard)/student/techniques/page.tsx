'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Progress, Grid, Tabs, RingProgress
} from '@mantine/core';
import {
    IconChevronLeft, IconRocket, IconTarget, IconBolt, IconStars,
    IconTrophy, IconFlame, IconCheck, IconLock
} from '@tabler/icons-react';
import Link from 'next/link';

interface Technique {
    id: string;
    name: string;
    module: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    usageCount: number;
    mastery: number; // 0-100
    badges: { name: string; earned: boolean }[];
    lastUsed?: string;
}

const MOCK_TECHNIQUES: Technique[] = [
    {
        id: 'orbit',
        name: 'The Orbit',
        module: 'Módulo 1',
        icon: <IconRocket size={24} />,
        color: 'blue',
        description: 'Defina o contexto e a persona antes de tudo',
        usageCount: 45,
        mastery: 85,
        badges: [
            { name: 'Primeiro Uso', earned: true },
            { name: '10 Prompts', earned: true },
            { name: '50 Prompts', earned: false },
            { name: 'Mestre', earned: false },
        ],
        lastUsed: '2026-02-02',
    },
    {
        id: 'slingshot',
        name: 'The Slingshot',
        module: 'Módulo 2',
        icon: <IconTarget size={24} />,
        color: 'violet',
        description: 'Adicione camadas de contexto temporal e espacial',
        usageCount: 32,
        mastery: 65,
        badges: [
            { name: 'Primeiro Uso', earned: true },
            { name: '10 Prompts', earned: true },
            { name: '50 Prompts', earned: false },
            { name: 'Mestre', earned: false },
        ],
        lastUsed: '2026-02-01',
    },
    {
        id: 'black_hole',
        name: 'The Black Hole',
        module: 'Módulo 3',
        icon: <IconBolt size={24} />,
        color: 'orange',
        description: 'Explore as fronteiras do modelo com perguntas difíceis',
        usageCount: 18,
        mastery: 40,
        badges: [
            { name: 'Primeiro Uso', earned: true },
            { name: '10 Prompts', earned: true },
            { name: '50 Prompts', earned: false },
            { name: 'Mestre', earned: false },
        ],
        lastUsed: '2026-01-28',
    },
    {
        id: 'constellation',
        name: 'The Constellation',
        module: 'Módulo 4',
        icon: <IconStars size={24} />,
        color: 'cyan',
        description: 'Conecte ideias em uma rede de conhecimento',
        usageCount: 5,
        mastery: 15,
        badges: [
            { name: 'Primeiro Uso', earned: true },
            { name: '10 Prompts', earned: false },
            { name: '50 Prompts', earned: false },
            { name: 'Mestre', earned: false },
        ],
        lastUsed: '2026-01-25',
    },
];

export default function TechniqueTrackerPage() {
    const [techniques] = useState<Technique[]>(MOCK_TECHNIQUES);
    const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null);

    const totalUsage = techniques.reduce((acc, t) => acc + t.usageCount, 0);
    const avgMastery = techniques.reduce((acc, t) => acc + t.mastery, 0) / techniques.length;
    const totalBadges = techniques.reduce((acc, t) => acc + t.badges.filter(b => b.earned).length, 0);

    const getMasteryLevel = (mastery: number) => {
        if (mastery >= 80) return { label: 'Expert', color: 'green' };
        if (mastery >= 50) return { label: 'Intermediário', color: 'blue' };
        if (mastery >= 25) return { label: 'Iniciante', color: 'orange' };
        return { label: 'Novato', color: 'gray' };
    };

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/student" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Técnicas Dominadas 🎯</Title>
                        <Text c="dimmed">Acompanhe seu progresso em cada técnica</Text>
                    </div>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{totalUsage}</Text>
                            <Text size="sm" c="dimmed">Usos Total</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconFlame size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{avgMastery.toFixed(0)}%</Text>
                            <Text size="sm" c="dimmed">Domínio Médio</Text>
                        </div>
                        <RingProgress size={48} thickness={6} sections={[{ value: avgMastery, color: 'violet' }]} />
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{totalBadges}</Text>
                            <Text size="sm" c="dimmed">Medalhas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="yellow">
                            <IconTrophy size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{techniques.filter(t => t.mastery >= 80).length}/{techniques.length}</Text>
                            <Text size="sm" c="dimmed">Dominadas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconCheck size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Technique Cards */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {techniques.map(technique => {
                    const level = getMasteryLevel(technique.mastery);

                    return (
                        <Card key={technique.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <ThemeIcon size="xl" variant="light" color={technique.color}>
                                            {technique.icon}
                                        </ThemeIcon>
                                        <div>
                                            <Text fw={600}>{technique.name}</Text>
                                            <Text size="sm" c="dimmed">{technique.module}</Text>
                                        </div>
                                    </Group>
                                    <Badge color={level.color} variant="light" size="lg">
                                        {level.label}
                                    </Badge>
                                </Group>

                                <Text size="sm" c="dimmed">{technique.description}</Text>

                                {/* Mastery Bar */}
                                <div>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm" c="dimmed">Domínio</Text>
                                        <Text size="sm" fw={600}>{technique.mastery}%</Text>
                                    </Group>
                                    <Progress value={technique.mastery} size="lg" radius="xl" color={technique.color} />
                                </div>

                                {/* Stats */}
                                <Grid>
                                    <Grid.Col span={6}>
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{technique.usageCount}</Text>
                                            <Text size="xs" c="dimmed">Usos</Text>
                                        </Paper>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Paper p="sm" bg="gray.0" radius="md" style={{ textAlign: 'center' }}>
                                            <Text size="lg" fw={700}>{technique.badges.filter(b => b.earned).length}/{technique.badges.length}</Text>
                                            <Text size="xs" c="dimmed">Medalhas</Text>
                                        </Paper>
                                    </Grid.Col>
                                </Grid>

                                {/* Badges */}
                                <Group gap={4}>
                                    {technique.badges.map((badge, i) => (
                                        <Badge
                                            key={i}
                                            variant={badge.earned ? 'filled' : 'outline'}
                                            color={badge.earned ? 'yellow' : 'gray'}
                                            size="sm"
                                            leftSection={badge.earned ? <IconTrophy size={10} /> : <IconLock size={10} />}
                                        >
                                            {badge.name}
                                        </Badge>
                                    ))}
                                </Group>

                                {technique.lastUsed && (
                                    <Text size="xs" c="dimmed">
                                        Último uso: {new Date(technique.lastUsed).toLocaleDateString('pt-BR')}
                                    </Text>
                                )}
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
}

