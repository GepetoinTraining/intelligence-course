'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Avatar,
    Loader, Center, SimpleGrid, ThemeIcon, Tabs, Progress, Paper,
    Table, RingProgress
} from '@mantine/core';
import {
    IconUser, IconBook, IconTrophy, IconCalendar, IconFlame,
    IconChartBar, IconMessageCircle, IconAlertCircle
} from '@tabler/icons-react';

interface ChildData {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    className: string;
}

interface ProgressSummary {
    totalItems: number;
    completed: number;
    inProgress: number;
    percentComplete: number;
    averageScore: number | null;
}

interface WellbeingData {
    engagementScore: number;
    emotionalScore: number;
    trend: 'up' | 'down' | 'stable';
}

export default function ParentChildPage() {
    const params = useParams();
    const childId = params.childId as string;

    const [child, setChild] = useState<ChildData | null>(null);
    const [progress, setProgress] = useState<ProgressSummary | null>(null);
    const [wellbeing, setWellbeing] = useState<WellbeingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (childId) {
            fetchChildData();
        }
    }, [childId]);

    const fetchChildData = async () => {
        setLoading(true);
        try {
            // Fetch child basic info, progress, and wellbeing in parallel
            const [progressRes, wellbeingRes, engagementRes] = await Promise.all([
                fetch(`/api/parent/child/${childId}/progress`),
                fetch(`/api/parent/child/${childId}/wellbeing`),
                fetch(`/api/parent/child/${childId}/engagement`),
            ]);

            const progressData = await progressRes.json();
            const wellbeingData = await wellbeingRes.json();

            if (progressData.data) {
                setProgress(progressData.data.summary);
                // Derive child name from API or use placeholder
                setChild({
                    id: childId,
                    name: progressData.data.childName || 'Filho(a)',
                    email: '',
                    avatarUrl: null,
                    className: progressData.data.className || 'Intelligence',
                });
            }

            if (wellbeingData.data) {
                setWellbeing(wellbeingData.data);
            }
        } catch (error) {
            console.error('Failed to fetch child data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Center py={200}>
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Container size="xl" py="xl">
            {/* Header */}
            <Card withBorder p="lg" mb="xl">
                <Group>
                    <Avatar size={80} radius="xl" color="violet">
                        {child?.name?.charAt(0) || 'A'}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                        <Title order={2}>{child?.name || childId}</Title>
                        <Text c="dimmed">{child?.className}</Text>
                    </div>
                    {progress && (
                        <RingProgress
                            size={80}
                            thickness={8}
                            roundCaps
                            sections={[{ value: progress.percentComplete, color: 'blue' }]}
                            label={
                                <Text ta="center" size="xs" fw={700}>
                                    {progress.percentComplete}%
                                </Text>
                            }
                        />
                    )}
                </Group>
            </Card>

            <Tabs defaultValue="progress">
                <Tabs.List mb="lg">
                    <Tabs.Tab value="progress" leftSection={<IconBook size={16} />}>
                        Progresso
                    </Tabs.Tab>
                    <Tabs.Tab value="wellbeing" leftSection={<IconChartBar size={16} />}>
                        Bem-estar
                    </Tabs.Tab>
                    <Tabs.Tab value="achievements" leftSection={<IconTrophy size={16} />}>
                        Conquistas
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="progress">
                    {progress ? (
                        <Stack>
                            {/* Quick Stats */}
                            <SimpleGrid cols={4}>
                                <Card withBorder p="md">
                                    <Group>
                                        <ThemeIcon size="lg" variant="light" color="green">
                                            <IconBook size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xl" fw={700}>{progress.completed}</Text>
                                            <Text size="xs" c="dimmed">Concluídos</Text>
                                        </div>
                                    </Group>
                                </Card>
                                <Card withBorder p="md">
                                    <Group>
                                        <ThemeIcon size="lg" variant="light" color="blue">
                                            <IconBook size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xl" fw={700}>{progress.inProgress}</Text>
                                            <Text size="xs" c="dimmed">Em Progresso</Text>
                                        </div>
                                    </Group>
                                </Card>
                                <Card withBorder p="md">
                                    <Group>
                                        <ThemeIcon size="lg" variant="light" color="violet">
                                            <IconChartBar size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xl" fw={700}>
                                                {progress.averageScore ? `${Math.round(progress.averageScore)}%` : '-'}
                                            </Text>
                                            <Text size="xs" c="dimmed">Nota Média</Text>
                                        </div>
                                    </Group>
                                </Card>
                                <Card withBorder p="md">
                                    <Group>
                                        <ThemeIcon size="lg" variant="light" color="orange">
                                            <IconFlame size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xl" fw={700}>-</Text>
                                            <Text size="xs" c="dimmed">Streak</Text>
                                        </div>
                                    </Group>
                                </Card>
                            </SimpleGrid>

                            {/* Module Progress */}
                            <Card withBorder p="lg">
                                <Title order={4} mb="md">Progresso por Módulo</Title>
                                <Stack>
                                    <Paper withBorder p="md">
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={500}>Módulo 1: The Orbit</Text>
                                            <Badge>{progress.percentComplete}%</Badge>
                                        </Group>
                                        <Progress value={progress.percentComplete} size="lg" />
                                    </Paper>
                                    <Paper withBorder p="md">
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={500} c="dimmed">Módulo 2: The Slingshot</Text>
                                            <Badge color="gray">Bloqueado</Badge>
                                        </Group>
                                        <Progress value={0} size="lg" color="gray" />
                                    </Paper>
                                </Stack>
                            </Card>
                        </Stack>
                    ) : (
                        <Card withBorder p="xl" ta="center">
                            <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconBook size={30} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Sem dados de progresso</Title>
                            <Text c="dimmed">
                                O progresso aparecerá aqui conforme seu filho(a) avançar no curso.
                            </Text>
                        </Card>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="wellbeing">
                    {wellbeing ? (
                        <SimpleGrid cols={2}>
                            <Card withBorder p="lg">
                                <Title order={4} mb="md">Engajamento</Title>
                                <RingProgress
                                    size={150}
                                    thickness={12}
                                    roundCaps
                                    mx="auto"
                                    sections={[{ value: wellbeing.engagementScore, color: 'blue' }]}
                                    label={
                                        <Text ta="center" fw={700}>
                                            {wellbeing.engagementScore}%
                                        </Text>
                                    }
                                />
                                <Text ta="center" size="sm" c="dimmed" mt="md">
                                    Baseado na frequência e duração das sessões
                                </Text>
                            </Card>
                            <Card withBorder p="lg">
                                <Title order={4} mb="md">Indicador Emocional</Title>
                                <RingProgress
                                    size={150}
                                    thickness={12}
                                    roundCaps
                                    mx="auto"
                                    sections={[{ value: wellbeing.emotionalScore, color: 'green' }]}
                                    label={
                                        <Text ta="center" fw={700}>
                                            {wellbeing.emotionalScore}%
                                        </Text>
                                    }
                                />
                                <Text ta="center" size="sm" c="dimmed" mt="md">
                                    Indicador agregado de bem-estar
                                </Text>
                            </Card>
                        </SimpleGrid>
                    ) : (
                        <Card withBorder p="xl" ta="center">
                            <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconChartBar size={30} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Dados de bem-estar indisponíveis</Title>
                            <Text c="dimmed">
                                Os indicadores de bem-estar são calculados após algumas sessões de estudo.
                            </Text>
                        </Card>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="achievements">
                    <Card withBorder p="xl" ta="center">
                        <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                            <IconTrophy size={30} />
                        </ThemeIcon>
                        <Title order={3} mb="xs">Conquistas em breve</Title>
                        <Text c="dimmed">
                            As conquistas do seu filho(a) aparecerão aqui conforme ele(a) avançar.
                        </Text>
                    </Card>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}
