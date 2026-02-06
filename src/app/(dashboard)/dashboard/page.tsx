'use client';

import { useState } from 'react';
import {
    Title, Text, Card, Stack, Group, Avatar, Badge, Button, SimpleGrid,
    Progress, Paper, ThemeIcon, RingProgress, Tooltip, ActionIcon
} from '@mantine/core';
import {
    IconTerminal, IconSettings, IconRocket, IconFlame, IconStar,
    IconTrophy, IconBrain, IconBulb, IconTarget, IconChecklist,
    IconClockHour4, IconCalendarEvent, IconSparkles, IconMedal,
    IconChartBar, IconBook
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// MOCK DATA
// ============================================================================

const USER = {
    firstName: 'Dev',
    lastName: 'User',
    email: 'dev@test.local',
    level: 7,
    xp: 2450,
    xpToNextLevel: 3000,
    streak: 12,
    longestStreak: 18,
    badges: 8,
    totalBadges: 24,
};

const RECENT_BADGES = [
    { id: '1', name: 'Prompt Master', icon: '🎯', color: 'violet', earnedAt: '2026-02-01' },
    { id: '2', name: 'Week Warrior', icon: '🔥', color: 'orange', earnedAt: '2026-01-28' },
    { id: '3', name: 'Problem Solver', icon: '💡', color: 'yellow', earnedAt: '2026-01-25' },
    { id: '4', name: 'Team Player', icon: '🤝', color: 'green', earnedAt: '2026-01-20' },
];

const UPCOMING_DEADLINES = [
    { id: '1', title: 'Capstone Módulo 2', type: 'capstone', dueDate: '2026-02-10', course: 'AI Mastery' },
    { id: '2', title: 'Peer Review (3 pending)', type: 'review', dueDate: '2026-02-08', course: 'AI Mastery' },
    { id: '3', title: 'Quiz: Context Stacking', type: 'quiz', dueDate: '2026-02-12', course: 'The Orbit' },
];

const WEEKLY_ACTIVITY = [
    { day: 'Seg', completed: true },
    { day: 'Ter', completed: true },
    { day: 'Qua', completed: true },
    { day: 'Qui', completed: false },
    { day: 'Sex', completed: true },
    { day: 'Sáb', completed: false },
    { day: 'Dom', completed: false },
];

const MODULES = [
    { id: 'module-1-orbit', title: 'The Orbit', description: 'Context Stacking', lessons: 6, completed: 4, progress: 67 },
    { id: 'module-2-slingshot', title: 'The Slingshot', description: 'Prompt Chaining', lessons: 8, completed: 2, progress: 25 },
    { id: 'module-3-blackhole', title: 'Black Hole', description: 'Deep Reasoning', lessons: 6, completed: 0, progress: 0 },
];

const TOOLBOX_ITEMS = [
    { href: '/student/techniques', icon: IconBrain, label: 'Técnicas', color: 'violet', count: 4 },
    { href: '/student/todo', icon: IconChecklist, label: 'ToDo Cube', color: 'blue', count: 5 },
    { href: '/student/constellation', icon: IconSparkles, label: 'Constelação', color: 'cyan', count: 12 },
    { href: '/student/workshop', icon: IconBulb, label: 'Workshop', color: 'yellow', count: 3 },
    { href: '/student/challenges', icon: IconTarget, label: 'Desafios', color: 'pink', count: 7 },
    { href: '/student/capstone', icon: IconTrophy, label: 'Capstone', color: 'green', count: 2 },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardPage() {
    const progressPercent = Math.round((USER.xp / USER.xpToNextLevel) * 100);

    const getDaysUntil = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getDeadlineColor = (days: number) => {
        if (days <= 2) return 'red';
        if (days <= 5) return 'orange';
        return 'gray';
    };

    return (
        <Stack gap="xl">
            {/* Header with Level & XP */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Bem-vindo de volta, {USER.firstName}! 👋</Title>
                    <Text c="dimmed">Continue sua jornada no Intelligence Course</Text>
                </div>
                <Paper p="md" radius="lg" withBorder>
                    <Group gap="lg">
                        <Group gap="xs">
                            <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'violet', to: 'grape' }} radius="xl">
                                <IconStar size={18} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Nível</Text>
                                <Text size="lg" fw={700}>{USER.level}</Text>
                            </div>
                        </Group>
                        <div style={{ width: 1, height: 40, background: 'var(--mantine-color-gray-3)' }} />
                        <Group gap="xs">
                            <ThemeIcon size="lg" variant="light" color="orange" radius="xl">
                                <IconFlame size={18} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed">Streak</Text>
                                <Text size="lg" fw={700}>{USER.streak} dias</Text>
                            </div>
                        </Group>
                    </Group>
                </Paper>
            </Group>

            {/* Progress & Stats Row */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                {/* XP Progress */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Text size="sm" c="dimmed">Progresso do Nível</Text>
                            <Text size="xl" fw={700} mt={4}>
                                {USER.xp.toLocaleString()} XP
                            </Text>
                            <Text size="xs" c="dimmed">{USER.xpToNextLevel - USER.xp} para o nível {USER.level + 1}</Text>
                        </div>
                        <RingProgress
                            size={70}
                            thickness={8}
                            roundCaps
                            sections={[{ value: progressPercent, color: 'violet' }]}
                            label={
                                <Text ta="center" size="sm" fw={700}>{progressPercent}%</Text>
                            }
                        />
                    </Group>
                </Card>

                {/* Streak */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="sm">
                        <Text size="sm" c="dimmed">Streak Semanal</Text>
                        <Badge variant="light" color="orange">{USER.streak} 🔥</Badge>
                    </Group>
                    <Group gap={4}>
                        {WEEKLY_ACTIVITY.map((day) => (
                            <Tooltip key={day.day} label={day.day}>
                                <Paper
                                    p={6}
                                    radius="sm"
                                    bg={day.completed ? 'orange' : 'gray.1'}
                                    style={{ flex: 1, textAlign: 'center' }}
                                >
                                    <Text size="xs" c={day.completed ? 'white' : 'dimmed'} fw={500}>
                                        {day.day.charAt(0)}
                                    </Text>
                                </Paper>
                            </Tooltip>
                        ))}
                    </Group>
                    <Text size="xs" c="dimmed" mt="xs">Recorde: {USER.longestStreak} dias</Text>
                </Card>

                {/* Badges */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between" mb="sm">
                        <Text size="sm" c="dimmed">Conquistas</Text>
                        <Badge variant="light" color="yellow">{USER.badges}/{USER.totalBadges}</Badge>
                    </Group>
                    <Group gap={6}>
                        {RECENT_BADGES.slice(0, 4).map((badge) => (
                            <Tooltip key={badge.id} label={badge.name}>
                                <Paper p={8} radius="md" bg={`${badge.color}.0`}>
                                    <Text size="lg">{badge.icon}</Text>
                                </Paper>
                            </Tooltip>
                        ))}
                    </Group>
                    <Progress value={(USER.badges / USER.totalBadges) * 100} size="sm" color="yellow" mt="sm" />
                </Card>

                {/* Quick Stats */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Text size="sm" c="dimmed" mb="sm">Estatísticas Rápidas</Text>
                    <SimpleGrid cols={2} spacing="xs">
                        <Paper p="sm" radius="md" bg="violet.0" ta="center">
                            <Text size="lg" fw={700} c="violet">{MODULES.reduce((acc, m) => acc + m.completed, 0)}</Text>
                            <Text size="xs" c="dimmed">Lições</Text>
                        </Paper>
                        <Paper p="sm" radius="md" bg="green.0" ta="center">
                            <Text size="lg" fw={700} c="green">4</Text>
                            <Text size="xs" c="dimmed">Técnicas</Text>
                        </Paper>
                        <Paper p="sm" radius="md" bg="blue.0" ta="center">
                            <Text size="lg" fw={700} c="blue">12</Text>
                            <Text size="xs" c="dimmed">Insights</Text>
                        </Paper>
                        <Paper p="sm" radius="md" bg="pink.0" ta="center">
                            <Text size="lg" fw={700} c="pink">3</Text>
                            <Text size="xs" c="dimmed">Desafios</Text>
                        </Paper>
                    </SimpleGrid>
                </Card>
            </SimpleGrid>

            {/* Main Content */}
            <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
                {/* Continue Learning - Takes 2 columns */}
                <Card shadow="xs" radius="md" p="lg" withBorder style={{ gridColumn: 'span 2' }}>
                    <Group justify="space-between" mb="md">
                        <Group gap="xs">
                            <IconBook size={20} />
                            <Text fw={600}>Continue Aprendendo</Text>
                        </Group>
                        <Link href="/m/module-1-orbit" passHref legacyBehavior>
                            <Button component="a" variant="light" size="xs">Ver todos os módulos</Button>
                        </Link>
                    </Group>

                    <Stack gap="sm">
                        {MODULES.map((mod) => (
                            <Link key={mod.id} href={`/m/${mod.id}`} passHref legacyBehavior>
                                <Paper
                                    component="a"
                                    p="md"
                                    radius="md"
                                    withBorder
                                    style={{ cursor: 'pointer', textDecoration: 'none', display: 'block' }}
                                >
                                    <Group justify="space-between">
                                        <div style={{ flex: 1 }}>
                                            <Group gap="xs">
                                                <Text fw={600}>{mod.title}</Text>
                                                {mod.progress === 100 && (
                                                    <Badge variant="filled" color="green" size="xs">✓ Completo</Badge>
                                                )}
                                                {mod.progress > 0 && mod.progress < 100 && (
                                                    <Badge variant="light" color="blue" size="xs">Em progresso</Badge>
                                                )}
                                            </Group>
                                            <Text size="sm" c="dimmed">{mod.description}</Text>
                                            <Group gap="lg" mt="xs">
                                                <Text size="xs" c="dimmed">{mod.completed}/{mod.lessons} lições</Text>
                                                <Text size="xs" fw={500} c={mod.progress > 0 ? 'blue' : 'dimmed'}>
                                                    {mod.progress}% concluído
                                                </Text>
                                            </Group>
                                        </div>
                                        <RingProgress
                                            size={60}
                                            thickness={6}
                                            roundCaps
                                            sections={[{ value: mod.progress, color: mod.progress === 100 ? 'green' : 'blue' }]}
                                            label={<Text ta="center" size="xs" fw={700}>{mod.progress}%</Text>}
                                        />
                                    </Group>
                                </Paper>
                            </Link>
                        ))}
                    </Stack>
                </Card>

                {/* Upcoming Deadlines */}
                <Card shadow="xs" radius="md" p="lg" withBorder>
                    <Group gap="xs" mb="md">
                        <IconCalendarEvent size={20} />
                        <Text fw={600}>Próximas Entregas</Text>
                    </Group>
                    <Stack gap="sm">
                        {UPCOMING_DEADLINES.map((item) => {
                            const daysUntil = getDaysUntil(item.dueDate);
                            return (
                                <Paper key={item.id} p="sm" radius="md" withBorder>
                                    <Group justify="space-between" wrap="nowrap">
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text size="sm" fw={500} truncate>{item.title}</Text>
                                            <Text size="xs" c="dimmed">{item.course}</Text>
                                        </div>
                                        <Badge
                                            variant="light"
                                            color={getDeadlineColor(daysUntil)}
                                            size="sm"
                                        >
                                            {daysUntil}d
                                        </Badge>
                                    </Group>
                                </Paper>
                            );
                        })}
                    </Stack>
                    <Link href="/student/capstone" passHref legacyBehavior>
                        <Button component="a" variant="subtle" fullWidth mt="md" size="xs">
                            Ver todas as entregas
                        </Button>
                    </Link>
                </Card>
            </SimpleGrid>

            {/* Toolbox Quick Access */}
            <Card shadow="xs" radius="md" p="lg" withBorder>
                <Group justify="space-between" mb="md">
                    <Group gap="xs">
                        <IconRocket size={20} />
                        <Text fw={600}>Student Toolbox</Text>
                    </Group>
                    <Badge variant="light" color="violet">Ferramentas de Aprendizado</Badge>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
                    {TOOLBOX_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href} passHref legacyBehavior>
                                <Paper
                                    component="a"
                                    p="md"
                                    radius="md"
                                    withBorder
                                    style={{ cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}
                                >
                                    <ThemeIcon size={48} variant="light" color={item.color} radius="xl" mx="auto" mb="sm">
                                        <Icon size={24} />
                                    </ThemeIcon>
                                    <Text size="sm" fw={500}>{item.label}</Text>
                                    <Badge variant="light" color={item.color} size="xs" mt={4}>
                                        {item.count} itens
                                    </Badge>
                                </Paper>
                            </Link>
                        );
                    })}
                </SimpleGrid>
            </Card>

            {/* Quick Actions */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <Link href="/playground" passHref legacyBehavior>
                    <Card component="a" shadow="xs" p="lg" radius="md" withBorder style={{ cursor: 'pointer', textDecoration: 'none' }}>
                        <Group>
                            <ThemeIcon size={48} variant="light" color="violet">
                                <IconTerminal size={24} />
                            </ThemeIcon>
                            <div>
                                <Text fw={600}>Prompt Playground</Text>
                                <Text size="sm" c="dimmed">Experimente com prompts</Text>
                            </div>
                        </Group>
                    </Card>
                </Link>

                <Link href="/student/review" passHref legacyBehavior>
                    <Card component="a" shadow="xs" p="lg" radius="md" withBorder style={{ cursor: 'pointer', textDecoration: 'none' }}>
                        <Group>
                            <ThemeIcon size={48} variant="light" color="green">
                                <IconChartBar size={24} />
                            </ThemeIcon>
                            <div>
                                <Text fw={600}>Peer Review</Text>
                                <Text size="sm" c="dimmed">Avalie colegas</Text>
                            </div>
                        </Group>
                    </Card>
                </Link>

                <Link href="/settings" passHref legacyBehavior>
                    <Card component="a" shadow="xs" p="lg" radius="md" withBorder style={{ cursor: 'pointer', textDecoration: 'none' }}>
                        <Group>
                            <ThemeIcon size={48} variant="light" color="gray">
                                <IconSettings size={24} />
                            </ThemeIcon>
                            <div>
                                <Text fw={600}>Configurações</Text>
                                <Text size="sm" c="dimmed">Gerencie suas chaves de API</Text>
                            </div>
                        </Group>
                    </Card>
                </Link>
            </SimpleGrid>
        </Stack>
    );
}

