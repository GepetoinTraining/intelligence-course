'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Progress, Avatar, ThemeIcon, Paper, ActionIcon, Menu, Divider,
    Table, Checkbox, Tooltip, RingProgress, Modal, Select, Textarea
} from '@mantine/core';
import {
    IconPlus, IconUsers, IconChartBar, IconDots,
    IconEdit, IconTrash, IconCopy, IconRocket, IconClock,
    IconCheck, IconCalendarEvent, IconChevronRight, IconClipboardCheck,
    IconMail, IconMessageCircle, IconSend
} from '@tabler/icons-react';
import Link from 'next/link';
import { useDisclosure } from '@mantine/hooks';

interface ClassInfo {
    id: string;
    name: string;
    code: string;
    studentCount: number;
    moduleProgress: number;
    createdAt: string;
}

interface TodaySession {
    id: string;
    classId: string;
    className: string;
    time: string;
    room: string;
    students: { id: string; name: string; checkedIn: boolean }[];
    status: 'upcoming' | 'in_progress' | 'completed';
}

// Mock data for dev mode
const MOCK_CLASSES: ClassInfo[] = [
    { id: 'class-1', name: 'Turma A - Manhã', code: 'ORBIT-A1', studentCount: 24, moduleProgress: 42, createdAt: '2026-01-15' },
    { id: 'class-2', name: 'Turma B - Tarde', code: 'ORBIT-B2', studentCount: 18, moduleProgress: 28, createdAt: '2026-01-20' },
    { id: 'class-3', name: 'Turma C - Noite', code: 'ORBIT-C3', studentCount: 12, moduleProgress: 65, createdAt: '2026-01-22' },
];

const MOCK_TODAY_SESSIONS: TodaySession[] = [
    {
        id: 'session-1',
        classId: 'class-1',
        className: 'Turma A - Manhã',
        time: '08:00 - 09:30',
        room: 'Sala 1',
        status: 'completed',
        students: [
            { id: 's1', name: 'Ana Silva', checkedIn: true },
            { id: 's2', name: 'Bruno Costa', checkedIn: true },
            { id: 's3', name: 'Carla Dias', checkedIn: false },
        ]
    },
    {
        id: 'session-2',
        classId: 'class-2',
        className: 'Turma B - Tarde',
        time: '14:00 - 15:30',
        room: 'Sala 2',
        status: 'in_progress',
        students: [
            { id: 's4', name: 'Diego Lima', checkedIn: true },
            { id: 's5', name: 'Elena Rocha', checkedIn: true },
            { id: 's6', name: 'Felipe Santos', checkedIn: false },
            { id: 's7', name: 'Gabriela Reis', checkedIn: false },
        ]
    },
    {
        id: 'session-3',
        classId: 'class-3',
        className: 'Turma C - Noite',
        time: '19:00 - 20:30',
        room: 'Sala 1',
        status: 'upcoming',
        students: [
            { id: 's8', name: 'Henrique Alves', checkedIn: false },
            { id: 's9', name: 'Isabela Moura', checkedIn: false },
        ]
    },
];

const statusColors = {
    upcoming: 'blue',
    in_progress: 'green',
    completed: 'gray',
};

const statusLabels = {
    upcoming: 'Próxima',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
};

// Student progress for heatmap
interface StudentProgress {
    id: string;
    name: string;
    classId: string;
    lessons: { lessonId: string; completed: boolean; score?: number }[];
}

const MOCK_STUDENT_PROGRESS: StudentProgress[] = [
    {
        id: 's1', name: 'Ana Silva', classId: 'class-1', lessons: [
            { lessonId: 'L1', completed: true, score: 95 },
            { lessonId: 'L2', completed: true, score: 88 },
            { lessonId: 'L3', completed: true, score: 92 },
            { lessonId: 'L4', completed: false },
            { lessonId: 'L5', completed: false },
            { lessonId: 'L6', completed: false },
        ]
    },
    {
        id: 's2', name: 'Bruno Costa', classId: 'class-1', lessons: [
            { lessonId: 'L1', completed: true, score: 78 },
            { lessonId: 'L2', completed: true, score: 82 },
            { lessonId: 'L3', completed: false },
            { lessonId: 'L4', completed: false },
            { lessonId: 'L5', completed: false },
            { lessonId: 'L6', completed: false },
        ]
    },
    {
        id: 's3', name: 'Carla Dias', classId: 'class-1', lessons: [
            { lessonId: 'L1', completed: true, score: 100 },
            { lessonId: 'L2', completed: true, score: 95 },
            { lessonId: 'L3', completed: true, score: 88 },
            { lessonId: 'L4', completed: true, score: 91 },
            { lessonId: 'L5', completed: false },
            { lessonId: 'L6', completed: false },
        ]
    },
    {
        id: 's4', name: 'Diego Lima', classId: 'class-1', lessons: [
            { lessonId: 'L1', completed: true, score: 70 },
            { lessonId: 'L2', completed: false },
            { lessonId: 'L3', completed: false },
            { lessonId: 'L4', completed: false },
            { lessonId: 'L5', completed: false },
            { lessonId: 'L6', completed: false },
        ]
    },
    {
        id: 's5', name: 'Elena Rocha', classId: 'class-1', lessons: [
            { lessonId: 'L1', completed: true, score: 85 },
            { lessonId: 'L2', completed: true, score: 90 },
            { lessonId: 'L3', completed: true, score: 87 },
            { lessonId: 'L4', completed: true, score: 92 },
            { lessonId: 'L5', completed: true, score: 88 },
            { lessonId: 'L6', completed: false },
        ]
    },
];

export default function TeacherDashboard() {
    const [classes] = useState<ClassInfo[]>(MOCK_CLASSES);
    const [sessions, setSessions] = useState<TodaySession[]>(MOCK_TODAY_SESSIONS);
    const [studentProgress] = useState<StudentProgress[]>(MOCK_STUDENT_PROGRESS);
    const [messageModal, { open: openMessage, close: closeMessage }] = useDisclosure(false);
    const [messageRecipient, setMessageRecipient] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');

    const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
    const avgProgress = Math.round(classes.reduce((acc, c) => acc + c.moduleProgress, 0) / classes.length);

    // Today's stats
    const todaySessions = sessions.length;
    const currentSession = sessions.find(s => s.status === 'in_progress');

    const handleQuickCheckIn = (sessionId: string, studentId: string) => {
        setSessions(prev => prev.map(session => {
            if (session.id === sessionId) {
                return {
                    ...session,
                    students: session.students.map(student =>
                        student.id === studentId
                            ? { ...student, checkedIn: !student.checkedIn }
                            : student
                    )
                };
            }
            return session;
        }));
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Painel do Professor 👨‍🏫</Title>
                    <Text c="dimmed">Gerencie suas turmas e acompanhe o progresso dos alunos</Text>
                </div>
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconMessageCircle size={16} />}
                        onClick={openMessage}
                    >
                        Mensagens
                    </Button>
                    <Link href="/teacher/attendance" passHref legacyBehavior>
                        <Button component="a" variant="light" leftSection={<IconClipboardCheck size={16} />}>
                            Chamada
                        </Button>
                    </Link>
                    <Button leftSection={<IconPlus size={16} />}>
                        Nova Turma
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="violet">
                            <IconUsers size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{totalStudents}</Text>
                            <Text size="sm" c="dimmed">Alunos Total</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="cyan">
                            <IconRocket size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{classes.length}</Text>
                            <Text size="sm" c="dimmed">Turmas Ativas</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="orange">
                            <IconCalendarEvent size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{todaySessions}</Text>
                            <Text size="sm" c="dimmed">Aulas Hoje</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="green">
                            <IconChartBar size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{avgProgress}%</Text>
                            <Text size="sm" c="dimmed">Progresso Médio</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Today's Schedule */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Group>
                            <ThemeIcon size="lg" variant="light" color="blue">
                                <IconClock size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={600}>Agenda de Hoje</Text>
                                <Text size="sm" c="dimmed">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                            </div>
                        </Group>
                        <Link href="/teacher/attendance" passHref legacyBehavior>
                            <Button component="a" variant="subtle" rightSection={<IconChevronRight size={14} />}>
                                Ver Todas
                            </Button>
                        </Link>
                    </Group>

                    <Divider />

                    <Stack gap="sm">
                        {sessions.map(session => {
                            const checkedInCount = session.students.filter(s => s.checkedIn).length;
                            const attendancePercentage = Math.round((checkedInCount / session.students.length) * 100);

                            return (
                                <Paper
                                    key={session.id}
                                    p="md"
                                    withBorder
                                    radius="md"
                                    style={{
                                        borderLeft: session.status === 'in_progress' ? '4px solid var(--mantine-color-green-6)' : undefined,
                                    }}
                                >
                                    <Group justify="space-between">
                                        <Group>
                                            <RingProgress
                                                size={50}
                                                thickness={5}
                                                roundCaps
                                                sections={[{ value: attendancePercentage, color: 'green' }]}
                                                label={
                                                    <Text size="xs" ta="center" fw={700}>
                                                        {checkedInCount}/{session.students.length}
                                                    </Text>
                                                }
                                            />
                                            <div>
                                                <Group gap="xs">
                                                    <Text fw={600}>{session.className}</Text>
                                                    <Badge size="sm" color={statusColors[session.status]} variant="light">
                                                        {statusLabels[session.status]}
                                                    </Badge>
                                                </Group>
                                                <Group gap="xs" mt={4}>
                                                    <Text size="sm" c="dimmed">{session.time}</Text>
                                                    <Text size="sm" c="dimmed">•</Text>
                                                    <Text size="sm" c="dimmed">{session.room}</Text>
                                                </Group>
                                            </div>
                                        </Group>

                                        <Group>
                                            {session.status === 'in_progress' && (
                                                <Link href={`/teacher/attendance?session=${session.id}`} passHref legacyBehavior>
                                                    <Button component="a" size="xs" color="green" leftSection={<IconCheck size={14} />}>
                                                        Fazer Chamada
                                                    </Button>
                                                </Link>
                                            )}
                                            {session.status === 'upcoming' && (
                                                <Button size="xs" variant="light" disabled>
                                                    Aguardando
                                                </Button>
                                            )}
                                            {session.status === 'completed' && (
                                                <Badge size="lg" color="gray" variant="light">
                                                    {checkedInCount}/{session.students.length} presentes
                                                </Badge>
                                            )}
                                        </Group>
                                    </Group>

                                    {/* Quick attendance for current session */}
                                    {session.status === 'in_progress' && (
                                        <>
                                            <Divider my="sm" />
                                            <Group gap="xs" wrap="wrap">
                                                {session.students.map(student => (
                                                    <Tooltip key={student.id} label={student.checkedIn ? 'Presente' : 'Ausente'}>
                                                        <Badge
                                                            size="lg"
                                                            variant={student.checkedIn ? 'filled' : 'outline'}
                                                            color={student.checkedIn ? 'green' : 'gray'}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => handleQuickCheckIn(session.id, student.id)}
                                                            leftSection={student.checkedIn ? <IconCheck size={12} /> : null}
                                                        >
                                                            {student.name.split(' ')[0]}
                                                        </Badge>
                                                    </Tooltip>
                                                ))}
                                            </Group>
                                        </>
                                    )}
                                </Paper>
                            );
                        })}
                    </Stack>
                </Stack>
            </Card>

            {/* Classes Grid */}
            <Stack gap="md">
                <Group justify="space-between">
                    <Title order={3}>Suas Turmas</Title>
                    <Link href="/teacher/classes" passHref legacyBehavior>
                        <Button component="a" variant="subtle" rightSection={<IconChevronRight size={14} />}>
                            Ver Todas
                        </Button>
                    </Link>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {classes.map((cls) => (
                        <Card key={cls.id} shadow="sm" radius="md" p="lg" withBorder>
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Badge variant="light" color="violet" size="lg">
                                        {cls.code}
                                    </Badge>
                                    <Menu shadow="md" width={200}>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDots size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>
                                                Editar Turma
                                            </Menu.Item>
                                            <Menu.Item leftSection={<IconCopy size={14} />}>
                                                Copiar Código
                                            </Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
                                                Arquivar Turma
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Group>

                                <div>
                                    <Text fw={600} size="lg">{cls.name}</Text>
                                    <Text size="sm" c="dimmed">{cls.studentCount} alunos</Text>
                                </div>

                                <div>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="xs" c="dimmed">Módulo 1 Progress</Text>
                                        <Text size="xs" fw={500}>{cls.moduleProgress}%</Text>
                                    </Group>
                                    <Progress value={cls.moduleProgress} size="sm" color="cyan" radius="xl" />
                                </div>

                                <Link href={`/teacher/classes/${cls.id}`} passHref legacyBehavior>
                                    <Button component="a" variant="light" fullWidth>
                                        Ver Turma
                                    </Button>
                                </Link>
                            </Stack>
                        </Card>
                    ))}

                    {/* Add Class Card */}
                    <Card
                        shadow="sm"
                        radius="md"
                        p="lg"
                        withBorder
                        style={{
                            borderStyle: 'dashed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 200,
                            cursor: 'pointer',
                        }}
                    >
                        <Stack align="center" gap="sm">
                            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                                <IconPlus size={24} />
                            </ThemeIcon>
                            <Text c="dimmed">Criar Nova Turma</Text>
                        </Stack>
                    </Card>
                </SimpleGrid>
            </Stack>

            {/* Progress Heatmap */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Group>
                            <ThemeIcon size="lg" variant="light" color="teal">
                                <IconChartBar size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={600}>Mapa de Progresso - Turma A</Text>
                                <Text size="sm" c="dimmed">Visualize o progresso por aluno e lição</Text>
                            </div>
                        </Group>
                        <Select
                            placeholder="Selecionar Turma"
                            data={classes.map(c => ({ value: c.id, label: c.name }))}
                            defaultValue="class-1"
                            w={200}
                        />
                    </Group>

                    <Divider />

                    {/* Heatmap Legend */}
                    <Group gap="lg">
                        <Group gap="xs">
                            <Paper w={16} h={16} bg="gray.2" radius="sm" />
                            <Text size="xs" c="dimmed">Não iniciado</Text>
                        </Group>
                        <Group gap="xs">
                            <Paper w={16} h={16} bg="red.3" radius="sm" />
                            <Text size="xs" c="dimmed">&lt;70%</Text>
                        </Group>
                        <Group gap="xs">
                            <Paper w={16} h={16} bg="yellow.4" radius="sm" />
                            <Text size="xs" c="dimmed">70-84%</Text>
                        </Group>
                        <Group gap="xs">
                            <Paper w={16} h={16} bg="green.4" radius="sm" />
                            <Text size="xs" c="dimmed">85-94%</Text>
                        </Group>
                        <Group gap="xs">
                            <Paper w={16} h={16} bg="teal.5" radius="sm" />
                            <Text size="xs" c="dimmed">95-100%</Text>
                        </Group>
                    </Group>

                    {/* Heatmap Grid */}
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                {['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].map(l => (
                                    <Table.Th key={l} ta="center" w={60}>{l}</Table.Th>
                                ))}
                                <Table.Th ta="center">Média</Table.Th>
                                <Table.Th ta="center">Ação</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {studentProgress.map(student => {
                                const completedLessons = student.lessons.filter(l => l.completed);
                                const avgScore = completedLessons.length > 0
                                    ? Math.round(completedLessons.reduce((acc, l) => acc + (l.score || 0), 0) / completedLessons.length)
                                    : 0;

                                const getScoreColor = (score?: number) => {
                                    if (score === undefined) return 'gray.2';
                                    if (score >= 95) return 'teal.5';
                                    if (score >= 85) return 'green.4';
                                    if (score >= 70) return 'yellow.4';
                                    return 'red.3';
                                };

                                return (
                                    <Table.Tr key={student.id}>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Avatar size="sm" radius="xl" color="violet">
                                                    {student.name.split(' ').map(n => n[0]).join('')}
                                                </Avatar>
                                                <Text size="sm">{student.name}</Text>
                                            </Group>
                                        </Table.Td>
                                        {student.lessons.map((lesson, idx) => (
                                            <Table.Td key={idx} ta="center">
                                                <Tooltip
                                                    label={lesson.completed ? `${lesson.score}%` : 'Não completado'}
                                                    withArrow
                                                >
                                                    <Paper
                                                        w={36}
                                                        h={36}
                                                        radius="sm"
                                                        bg={lesson.completed ? getScoreColor(lesson.score) : 'gray.2'}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            margin: '0 auto'
                                                        }}
                                                    >
                                                        {lesson.completed && (
                                                            <Text size="xs" fw={600} c={lesson.score && lesson.score >= 70 ? 'white' : 'dark'}>
                                                                {lesson.score}
                                                            </Text>
                                                        )}
                                                    </Paper>
                                                </Tooltip>
                                            </Table.Td>
                                        ))}
                                        <Table.Td ta="center">
                                            <Badge
                                                size="lg"
                                                color={avgScore >= 85 ? 'green' : avgScore >= 70 ? 'yellow' : 'red'}
                                            >
                                                {avgScore > 0 ? `${avgScore}%` : '-'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Tooltip label="Enviar mensagem">
                                                <ActionIcon
                                                    variant="light"
                                                    color="blue"
                                                    onClick={() => {
                                                        setMessageRecipient(student.name);
                                                        openMessage();
                                                    }}
                                                >
                                                    <IconMail size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Card>

            {/* Message Modal */}
            <Modal
                opened={messageModal}
                onClose={closeMessage}
                title="Enviar Mensagem"
                centered
                size="md"
            >
                <Stack gap="md">
                    <Select
                        label="Destinatário"
                        placeholder="Selecione aluno ou responsável"
                        value={messageRecipient}
                        onChange={setMessageRecipient}
                        data={[
                            { group: 'Alunos', items: studentProgress.map(s => ({ value: s.name, label: s.name })) },
                            {
                                group: 'Responsáveis', items: [
                                    { value: 'parent-ana', label: 'Pai de Ana Silva' },
                                    { value: 'parent-bruno', label: 'Mãe de Bruno Costa' },
                                    { value: 'parent-carla', label: 'Pai de Carla Dias' },
                                ]
                            },
                            { group: 'Turmas', items: classes.map(c => ({ value: `class-${c.id}`, label: `Toda ${c.name}` })) },
                        ]}
                        searchable
                    />
                    <Textarea
                        label="Mensagem"
                        placeholder="Digite sua mensagem..."
                        minRows={4}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={closeMessage}>Cancelar</Button>
                        <Button
                            leftSection={<IconSend size={16} />}
                            disabled={!messageRecipient || !messageText.trim()}
                            onClick={() => {
                                closeMessage();
                                setMessageText('');
                                setMessageRecipient(null);
                            }}
                        >
                            Enviar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

