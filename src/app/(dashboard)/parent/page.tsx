'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Progress, Avatar, ThemeIcon, Paper, Timeline, Divider, Tabs,
    Table, ActionIcon, Modal, RingProgress
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSchool, IconChartBar, IconBook, IconCircleCheck,
    IconCircleHalf, IconClock, IconStar, IconCircle, IconMail,
    IconCalendar, IconCash, IconDownload, IconMessage, IconBell,
    IconTrophy, IconFlame, IconTarget, IconChevronRight, IconCheck, IconX,
    IconAlertTriangle, IconChevronLeft as IconChevLeft
} from '@tabler/icons-react';
import Link from 'next/link';

interface ChildProgress {
    id: string;
    name: string;
    avatar?: string;
    currentModule: string;
    lessonsCompleted: number;
    totalLessons: number;
    lastActive: string;
    teacher: string;
    className: string;
    xp: number;
    level: number;
    streak: number;
    badges: number;
    recentActivity: { lesson: string; date: string; status: 'completed' | 'started' }[];
    grades: { module: string; grade: number; maxGrade: number; date: string }[];
    upcomingDeadlines: { title: string; dueDate: string; type: string }[];
    attendance: { date: string; status: 'present' | 'absent' | 'late' | 'justified'; notes?: string }[];
}


export default function ParentDashboard() {
    const [children, setChildren] = useState<ChildProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportModal, { open: openReportModal, close: closeReportModal }] = useDisclosure(false);
    const [selectedChild, setSelectedChild] = useState<ChildProgress | null>(null);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const getDaysUntil = (date: string) => {
        const diff = new Date(date).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const handleViewReport = (child: ChildProgress) => {
        setSelectedChild(child);
        openReportModal();
    };

    const fetchChildren = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/users?role=student');
            if (!res.ok) return;
            const json = await res.json();
            setChildren((json.data || []).map((s: any) => ({
                id: s.id,
                name: s.name || 'Aluno',
                avatar: s.avatarUrl || undefined,
                currentModule: s.currentModule || 'Módulo 1',
                lessonsCompleted: s.lessonsCompleted || 0,
                totalLessons: s.totalLessons || 1,
                lastActive: s.lastActive || '-',
                teacher: s.teacher || '',
                className: s.className || '',
                xp: s.xp || 0,
                level: s.level || 1,
                streak: s.streak || 0,
                badges: s.badges || 0,
                recentActivity: s.recentActivity || [],
                grades: s.grades || [],
                upcomingDeadlines: s.upcomingDeadlines || [],
                attendance: s.attendance || [],
            })));
        } catch (err) {
            console.error('Failed to fetch children', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChildren();
    }, [fetchChildren]);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between">
                <div>
                    <Title order={2}>Portal dos Pais 👨‍👩‍👧</Title>
                    <Text c="dimmed">Acompanhe o progresso do seu filho no Intelligence Course</Text>
                </div>
                <Group>
                    <Link href="/parent/billing" passHref legacyBehavior>
                        <Button component="a" leftSection={<IconCash size={16} />} variant="light">
                            Financeiro
                        </Button>
                    </Link>
                    <Button leftSection={<IconMail size={16} />} variant="subtle">
                        Mensagens
                    </Button>
                </Group>
            </Group>

            {/* Quick Actions */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Link href="/parent/billing" passHref legacyBehavior>
                    <Paper component="a" shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer', textDecoration: 'none' }}>
                        <Group>
                            <ThemeIcon size={40} variant="light" color="green">
                                <IconCash size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={600} size="sm">Financeiro</Text>
                                <Text size="xs" c="dimmed">Faturas e pagamentos</Text>
                            </div>
                        </Group>
                    </Paper>
                </Link>
                <Paper shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer' }}>
                    <Group>
                        <ThemeIcon size={40} variant="light" color="blue">
                            <IconMessage size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="sm">Mensagens</Text>
                            <Text size="xs" c="dimmed">Falar com professor</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer' }}>
                    <Group>
                        <ThemeIcon size={40} variant="light" color="violet">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="sm">Calendário</Text>
                            <Text size="xs" c="dimmed">Próximas aulas</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer' }}>
                    <Group>
                        <ThemeIcon size={40} variant="light" color="orange">
                            <IconBell size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="sm">Avisos</Text>
                            <Badge size="xs" color="red">2 novos</Badge>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Children */}
            {children.map((child) => (
                <Card key={child.id} shadow="sm" radius="md" p={0} withBorder>
                    {/* Child Header */}
                    <Paper p="xl" bg="violet.0">
                        <Group justify="space-between" wrap="nowrap">
                            <Group gap="lg">
                                <Avatar size={72} radius="xl" color="violet">
                                    {child.name.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                                <div>
                                    <Text fw={600} size="xl">{child.name}</Text>
                                    <Group gap="xs" mt={4}>
                                        <Badge variant="light" color="violet">{child.className}</Badge>
                                        <Text size="sm" c="dimmed">•</Text>
                                        <Text size="sm" c="dimmed">{child.teacher}</Text>
                                    </Group>
                                    <Group gap="xs" mt={8}>
                                        <IconClock size={14} color="var(--mantine-color-dimmed)" />
                                        <Text size="sm" c="dimmed">Última atividade: {child.lastActive}</Text>
                                    </Group>
                                </div>
                            </Group>

                            <Group gap="md">
                                {/* Quick Stats */}
                                <Paper p="md" radius="md" withBorder bg="white">
                                    <Group gap="lg">
                                        <Stack align="center" gap={0}>
                                            <Text size="xl" fw={700} c="violet">{child.level}</Text>
                                            <Text size="xs" c="dimmed">Nível</Text>
                                        </Stack>
                                        <Divider orientation="vertical" />
                                        <Stack align="center" gap={0}>
                                            <Group gap={4}>
                                                <IconFlame size={16} color="var(--mantine-color-orange-6)" />
                                                <Text size="xl" fw={700} c="orange">{child.streak}</Text>
                                            </Group>
                                            <Text size="xs" c="dimmed">Streak</Text>
                                        </Stack>
                                        <Divider orientation="vertical" />
                                        <Stack align="center" gap={0}>
                                            <Text size="xl" fw={700} c="yellow">{child.badges}</Text>
                                            <Text size="xs" c="dimmed">Badges</Text>
                                        </Stack>
                                    </Group>
                                </Paper>
                            </Group>
                        </Group>
                    </Paper>

                    <Tabs defaultValue="progress">
                        <Tabs.List>
                            <Tabs.Tab value="progress" leftSection={<IconChartBar size={14} />}>
                                Progresso
                            </Tabs.Tab>
                            <Tabs.Tab value="grades" leftSection={<IconStar size={14} />}>
                                Notas
                            </Tabs.Tab>
                            <Tabs.Tab value="activity" leftSection={<IconClock size={14} />}>
                                Atividade
                            </Tabs.Tab>
                            <Tabs.Tab value="attendance" leftSection={<IconCalendar size={14} />}>
                                Presença
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="progress" p="lg">
                            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                {/* Module Progress */}
                                <Card shadow="xs" radius="md" p="lg" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>Progresso no Módulo</Text>
                                            <Badge variant="light" color="cyan">{child.currentModule}</Badge>
                                        </Group>

                                        <Group justify="center">
                                            <RingProgress
                                                size={140}
                                                thickness={14}
                                                roundCaps
                                                sections={[{ value: (child.lessonsCompleted / child.totalLessons) * 100, color: 'cyan' }]}
                                                label={
                                                    <Text ta="center" size="xl" fw={700}>
                                                        {Math.round((child.lessonsCompleted / child.totalLessons) * 100)}%
                                                    </Text>
                                                }
                                            />
                                        </Group>

                                        <SimpleGrid cols={6} spacing="xs">
                                            {Array.from({ length: child.totalLessons }).map((_, i) => (
                                                <Paper
                                                    key={i}
                                                    p="sm"
                                                    radius="md"
                                                    withBorder
                                                    style={{
                                                        textAlign: 'center',
                                                        background: i < child.lessonsCompleted
                                                            ? 'var(--mantine-color-green-0)'
                                                            : 'var(--mantine-color-gray-0)',
                                                        borderColor: i < child.lessonsCompleted
                                                            ? 'var(--mantine-color-green-3)'
                                                            : undefined,
                                                    }}
                                                >
                                                    <ThemeIcon
                                                        size={24}
                                                        radius="xl"
                                                        variant="light"
                                                        color={i < child.lessonsCompleted ? 'green' : 'gray'}
                                                    >
                                                        {i < child.lessonsCompleted ? <IconCircleCheck size={14} /> : <IconCircle size={14} />}
                                                    </ThemeIcon>
                                                    <Text size="xs" mt={4}>L{i + 1}</Text>
                                                </Paper>
                                            ))}
                                        </SimpleGrid>
                                    </Stack>
                                </Card>

                                {/* Upcoming Deadlines */}
                                <Card shadow="xs" radius="md" p="lg" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>Próximas Entregas</Text>
                                            <Badge variant="light">{child.upcomingDeadlines.length}</Badge>
                                        </Group>

                                        <Stack gap="sm">
                                            {child.upcomingDeadlines.map((deadline, i) => {
                                                const daysUntil = getDaysUntil(deadline.dueDate);
                                                return (
                                                    <Paper key={i} p="sm" radius="md" withBorder>
                                                        <Group justify="space-between">
                                                            <div>
                                                                <Text size="sm" fw={500}>{deadline.title}</Text>
                                                                <Text size="xs" c="dimmed">{formatDate(deadline.dueDate)}</Text>
                                                            </div>
                                                            <Badge
                                                                color={daysUntil <= 3 ? 'red' : daysUntil <= 7 ? 'orange' : 'gray'}
                                                                variant="light"
                                                            >
                                                                {daysUntil}d
                                                            </Badge>
                                                        </Group>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    </Stack>
                                </Card>
                            </SimpleGrid>
                        </Tabs.Panel>

                        <Tabs.Panel value="grades" p="lg">
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600}>Boletim de Notas</Text>
                                    <Button
                                        variant="light"
                                        size="xs"
                                        leftSection={<IconDownload size={14} />}
                                        onClick={() => handleViewReport(child)}
                                    >
                                        Ver Boletim Completo
                                    </Button>
                                </Group>

                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Módulo</Table.Th>
                                            <Table.Th ta="center">Nota</Table.Th>
                                            <Table.Th ta="center">Progresso</Table.Th>
                                            <Table.Th>Data</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {child.grades.map((grade, i) => (
                                            <Table.Tr key={i}>
                                                <Table.Td>
                                                    <Text size="sm">{grade.module}</Text>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Badge
                                                        color={grade.grade >= 7 ? 'green' : grade.grade >= 5 ? 'yellow' : 'red'}
                                                        variant="filled"
                                                        size="lg"
                                                    >
                                                        {grade.grade.toFixed(1)}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Progress
                                                        value={(grade.grade / grade.maxGrade) * 100}
                                                        size="lg"
                                                        radius="xl"
                                                        color={grade.grade >= 7 ? 'green' : grade.grade >= 5 ? 'yellow' : 'red'}
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">{formatDate(grade.date)}</Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>

                                {child.grades.length > 0 && (
                                    <Paper p="md" bg="green.0" radius="md" mt="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>Média Geral</Text>
                                            <Text size="xl" fw={700} c="green">
                                                {(child.grades.reduce((acc, g) => acc + g.grade, 0) / child.grades.length).toFixed(1)}
                                            </Text>
                                        </Group>
                                    </Paper>
                                )}
                            </Card>
                        </Tabs.Panel>

                        <Tabs.Panel value="activity" p="lg">
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Text fw={600} mb="md">Atividade Recente</Text>

                                <Timeline active={child.recentActivity.length - 1} bulletSize={24} lineWidth={2}>
                                    {child.recentActivity.map((activity, index) => (
                                        <Timeline.Item
                                            key={index}
                                            bullet={
                                                activity.status === 'completed'
                                                    ? <IconCircleCheck size={12} />
                                                    : <IconCircleHalf size={12} />
                                            }
                                            title={activity.lesson}
                                            color={activity.status === 'completed' ? 'green' : 'blue'}
                                        >
                                            <Text c="dimmed" size="sm">{activity.date}</Text>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </Card>
                        </Tabs.Panel>

                        <Tabs.Panel value="attendance" p="lg">
                            <Card shadow="xs" radius="md" p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Text fw={600}>Calendário de Presença</Text>
                                    <Group gap="xs">
                                        <Badge variant="dot" color="green">Presente</Badge>
                                        <Badge variant="dot" color="orange">Atraso</Badge>
                                        <Badge variant="dot" color="red">Falta</Badge>
                                        <Badge variant="dot" color="blue">Justificada</Badge>
                                    </Group>
                                </Group>

                                {/* Attendance Stats */}
                                <SimpleGrid cols={4} spacing="md" mb="lg">
                                    <Paper p="sm" radius="md" withBorder ta="center" bg="green.0">
                                        <Text size="xl" fw={700} c="green">
                                            {child.attendance.filter(a => a.status === 'present').length}
                                        </Text>
                                        <Text size="xs" c="dimmed">Presenças</Text>
                                    </Paper>
                                    <Paper p="sm" radius="md" withBorder ta="center" bg="orange.0">
                                        <Text size="xl" fw={700} c="orange">
                                            {child.attendance.filter(a => a.status === 'late').length}
                                        </Text>
                                        <Text size="xs" c="dimmed">Atrasos</Text>
                                    </Paper>
                                    <Paper p="sm" radius="md" withBorder ta="center" bg="red.0">
                                        <Text size="xl" fw={700} c="red">
                                            {child.attendance.filter(a => a.status === 'absent').length}
                                        </Text>
                                        <Text size="xs" c="dimmed">Faltas</Text>
                                    </Paper>
                                    <Paper p="sm" radius="md" withBorder ta="center" bg="blue.0">
                                        <Text size="xl" fw={700} c="blue">
                                            {child.attendance.filter(a => a.status === 'justified').length}
                                        </Text>
                                        <Text size="xs" c="dimmed">Justificadas</Text>
                                    </Paper>
                                </SimpleGrid>

                                {/* Attendance Percentage */}
                                <Paper p="md" bg="gray.0" radius="md" mb="lg">
                                    <Group justify="space-between" mb="xs">
                                        <Text fw={500}>Taxa de Presença</Text>
                                        <Text fw={700} c={
                                            (child.attendance.filter(a => a.status === 'present' || a.status === 'late').length / child.attendance.length * 100) >= 75
                                                ? 'green'
                                                : 'orange'
                                        }>
                                            {Math.round(child.attendance.filter(a => a.status === 'present' || a.status === 'late').length / child.attendance.length * 100)}%
                                        </Text>
                                    </Group>
                                    <Progress
                                        value={child.attendance.filter(a => a.status === 'present' || a.status === 'late').length / child.attendance.length * 100}
                                        color={
                                            (child.attendance.filter(a => a.status === 'present' || a.status === 'late').length / child.attendance.length * 100) >= 75
                                                ? 'green'
                                                : 'orange'
                                        }
                                        size="lg"
                                        radius="xl"
                                    />
                                    <Text size="xs" c="dimmed" mt="xs">
                                        Mínimo recomendado: 75% de presença
                                    </Text>
                                </Paper>

                                {/* Recent Attendance Records */}
                                <Text fw={600} mb="sm">Registro Detalhado</Text>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Data</Table.Th>
                                            <Table.Th ta="center">Status</Table.Th>
                                            <Table.Th>Observações</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {child.attendance.slice(0, 10).map((record, idx) => {
                                            const statusConfig = {
                                                present: { label: 'Presente', color: 'green', icon: <IconCheck size={12} /> },
                                                late: { label: 'Atraso', color: 'orange', icon: <IconClock size={12} /> },
                                                absent: { label: 'Falta', color: 'red', icon: <IconX size={12} /> },
                                                justified: { label: 'Justificada', color: 'blue', icon: <IconCircleCheck size={12} /> },
                                            };
                                            const config = statusConfig[record.status];
                                            return (
                                                <Table.Tr key={idx}>
                                                    <Table.Td>
                                                        <Text size="sm">{formatDate(record.date)}</Text>
                                                    </Table.Td>
                                                    <Table.Td ta="center">
                                                        <Badge
                                                            color={config.color}
                                                            variant="light"
                                                            leftSection={config.icon}
                                                        >
                                                            {config.label}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" c="dimmed">{record.notes || '-'}</Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                    </Table.Tbody>
                                </Table>
                            </Card>
                        </Tabs.Panel>
                    </Tabs>
                </Card>
            ))}

            {/* Report Card Modal */}
            <Modal
                opened={reportModal}
                onClose={closeReportModal}
                title="Boletim Escolar"
                centered
                size="lg"
            >
                {selectedChild && (
                    <Stack gap="md">
                        <Paper p="lg" bg="violet.0" radius="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={700} size="lg">{selectedChild.name}</Text>
                                    <Text size="sm" c="dimmed">{selectedChild.className}</Text>
                                    <Text size="sm" c="dimmed">{selectedChild.teacher}</Text>
                                </div>
                                <Stack align="flex-end" gap={0}>
                                    <Text size="xs" c="dimmed">Ano Letivo</Text>
                                    <Text fw={700}>2026</Text>
                                </Stack>
                            </Group>
                        </Paper>

                        <Divider label="Desempenho por Módulo" labelPosition="center" />

                        <Table striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Módulo</Table.Th>
                                    <Table.Th ta="center">Nota</Table.Th>
                                    <Table.Th ta="center">Situação</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {selectedChild.grades.map((grade, i) => (
                                    <Table.Tr key={i}>
                                        <Table.Td>{grade.module}</Table.Td>
                                        <Table.Td ta="center">
                                            <Text fw={600}>{grade.grade.toFixed(1)}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge color={grade.grade >= 7 ? 'green' : 'yellow'}>
                                                {grade.grade >= 7 ? 'Aprovado' : 'Em recuperação'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>

                        <Divider label="Resumo" labelPosition="center" />

                        <SimpleGrid cols={3} spacing="md">
                            <Paper p="md" radius="md" withBorder ta="center">
                                <Text size="xl" fw={700} c="green">
                                    {(selectedChild.grades.reduce((acc, g) => acc + g.grade, 0) / selectedChild.grades.length).toFixed(1)}
                                </Text>
                                <Text size="xs" c="dimmed">Média Geral</Text>
                            </Paper>
                            <Paper p="md" radius="md" withBorder ta="center">
                                <Text size="xl" fw={700} c="violet">{selectedChild.level}</Text>
                                <Text size="xs" c="dimmed">Nível</Text>
                            </Paper>
                            <Paper p="md" radius="md" withBorder ta="center">
                                <Text size="xl" fw={700} c="cyan">{selectedChild.xp}</Text>
                                <Text size="xs" c="dimmed">XP Total</Text>
                            </Paper>
                        </SimpleGrid>

                        <Group justify="flex-end" mt="md">
                            <Button variant="light" leftSection={<IconDownload size={16} />}>
                                Baixar PDF
                            </Button>
                            <Button leftSection={<IconMail size={16} />}>
                                Enviar por Email
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}

