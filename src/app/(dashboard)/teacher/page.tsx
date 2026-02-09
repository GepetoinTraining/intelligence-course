'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Progress, Avatar, ThemeIcon, Paper, ActionIcon, Menu, Divider,
    Table, Checkbox, Tooltip, RingProgress, Modal, Select, Textarea,
    Loader, Center, Skeleton, Alert
} from '@mantine/core';
import {
    IconPlus, IconUsers, IconChartBar, IconDots,
    IconEdit, IconTrash, IconCopy, IconRocket, IconClock,
    IconCheck, IconCalendarEvent, IconChevronRight, IconClipboardCheck,
    IconMail, IconMessageCircle, IconSend, IconAlertCircle,
    IconBook, IconTarget, IconListCheck, IconRefresh
} from '@tabler/icons-react';
import Link from 'next/link';
import { useDisclosure } from '@mantine/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface ClassInfo {
    id: string;
    name: string;
    code: string;
    courseTypeId: string;
    levelId: string;
    studentCount: number;
    maxStudents: number;
    status: string;
    startsAt: number | null;
    endsAt: number | null;
    createdAt: number;
}

interface ScheduleEntry {
    id: string;
    classId: string;
    className?: string;
    roomId: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface EnrolledStudent {
    id: string;
    name: string;
    email: string;
    classId: string;
    className: string;
    enrollmentStatus: string;
}

interface LessonInfo {
    id: string;
    moduleId: string;
    title: string;
    orderIndex: number;
    lessonType: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function getTodayDayOfWeek(): number {
    return new Date().getDay(); // 0=Sun, 1=Mon...
}

function formatTime(time: string): string {
    // Handle HH:MM or HH:MM:SS
    return time?.slice(0, 5) || '';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TeacherDashboard() {
    // Data state
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [lessons, setLessons] = useState<LessonInfo[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messageModal, { open: openMessage, close: closeMessage }] = useDisclosure(false);
    const [messageRecipient, setMessageRecipient] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');

    // ====================================================================
    // DATA FETCHING
    // ====================================================================

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch teacher's classes (filtered by current user's teacherId on the server)
            const classRes = await fetch('/api/classes?status=active');
            const classData = await classRes.json();
            const myClasses: ClassInfo[] = (classData.data || []).map((c: any) => ({
                id: c.id,
                name: c.name || 'Turma',
                code: c.id.slice(0, 8).toUpperCase(),
                courseTypeId: c.courseTypeId || '',
                levelId: c.levelId || '',
                studentCount: c.currentStudents || 0,
                maxStudents: c.maxStudents || 15,
                status: c.status || 'active',
                startsAt: c.startsAt,
                endsAt: c.endsAt,
                createdAt: c.createdAt,
            }));
            setClasses(myClasses);

            // Fetch schedules for all classes
            if (myClasses.length > 0) {
                const schedRes = await fetch('/api/schedules');
                const schedData = await schedRes.json();
                const classIds = new Set(myClasses.map(c => c.id));
                const relevantSchedules = (schedData.data || [])
                    .filter((s: any) => classIds.has(s.classId))
                    .map((s: any) => ({
                        ...s,
                        className: myClasses.find(c => c.id === s.classId)?.name || 'Turma',
                    }));
                setSchedules(relevantSchedules);
            }

            // Fetch enrolled students
            const studentRes = await fetch('/api/enrollments?status=active');
            const studentData = await studentRes.json();
            if (studentData.data) {
                const enrolledStudents: EnrolledStudent[] = studentData.data.map((e: any) => ({
                    id: e.personId || e.id,
                    name: e.studentName || e.personName || 'Aluno',
                    email: e.email || '',
                    classId: e.classId || '',
                    className: myClasses.find(c => c.id === e.classId)?.name || '',
                    enrollmentStatus: e.status || 'active',
                }));
                setStudents(enrolledStudents);
            }

            // Fetch lessons
            const lessonRes = await fetch('/api/lessons');
            const lessonData = await lessonRes.json();
            if (lessonData.data) {
                setLessons(lessonData.data.map((l: any) => ({
                    id: l.id,
                    moduleId: l.moduleId || '',
                    title: typeof l.title === 'string' ? l.title : JSON.stringify(l.title),
                    orderIndex: l.orderIndex || 0,
                    lessonType: l.lessonType || 'standard',
                })));
            }

        } catch (err) {
            console.error('Failed to fetch teacher dashboard data:', err);
            setError('Falha ao carregar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // ====================================================================
    // COMPUTED
    // ====================================================================

    const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
    const todaySchedules = schedules.filter(s => s.dayOfWeek === getTodayDayOfWeek());
    const todaySessionCount = todaySchedules.length;

    // Progress approximation: what percent of lessons each class has covered
    // (real implementation would track per-student; here we give a class-level summary)
    const totalLessons = lessons.length;

    // Students per class for quick lookup
    const studentsByClass = classes.reduce((acc, cls) => {
        acc[cls.id] = students.filter(s => s.classId === cls.id);
        return acc;
    }, {} as Record<string, EnrolledStudent[]>);

    // ====================================================================
    // RENDER
    // ====================================================================

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Skeleton height={30} width={300} mb="xs" />
                        <Skeleton height={16} width={400} />
                    </div>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} height={90} radius="md" />
                    ))}
                </SimpleGrid>
                <Skeleton height={200} radius="md" />
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={250} radius="md" />
                    ))}
                </SimpleGrid>
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Error alert */}
            {error && (
                <Alert
                    icon={<IconAlertCircle size={16} />}
                    title="Erro"
                    color="red"
                    withCloseButton
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>Painel do Professor 👨‍🏫</Title>
                    <Text c="dimmed">Gerencie suas turmas e acompanhe o progresso dos alunos</Text>
                </div>
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconRefresh size={16} />}
                        onClick={fetchDashboardData}
                    >
                        Atualizar
                    </Button>
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
                            <Text size="xl" fw={700}>{todaySessionCount}</Text>
                            <Text size="sm" c="dimmed">Aulas Hoje</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} radius="md" variant="light" color="green">
                            <IconBook size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{totalLessons}</Text>
                            <Text size="sm" c="dimmed">Lições Cadastradas</Text>
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
                        <Link href="/teacher/schedule" passHref legacyBehavior>
                            <Button component="a" variant="subtle" rightSection={<IconChevronRight size={14} />}>
                                Ver Semana
                            </Button>
                        </Link>
                    </Group>

                    <Divider />

                    {todaySchedules.length === 0 ? (
                        <Paper p="xl" bg="gray.0" radius="md" ta="center">
                            <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="sm">
                                <IconCalendarEvent size={24} />
                            </ThemeIcon>
                            <Text fw={500}>Nenhuma aula agendada para hoje</Text>
                            <Text size="sm" c="dimmed">Aproveite para planejar as próximas lições</Text>
                        </Paper>
                    ) : (
                        <Stack gap="sm">
                            {todaySchedules.map(schedule => {
                                const classInfo = classes.find(c => c.id === schedule.classId);
                                const classStudents = studentsByClass[schedule.classId] || [];

                                return (
                                    <Paper
                                        key={schedule.id}
                                        p="md"
                                        withBorder
                                        radius="md"
                                    >
                                        <Group justify="space-between">
                                            <Group>
                                                <RingProgress
                                                    size={50}
                                                    thickness={5}
                                                    roundCaps
                                                    sections={[{
                                                        value: classInfo ? Math.round((classInfo.studentCount / classInfo.maxStudents) * 100) : 0,
                                                        color: 'green'
                                                    }]}
                                                    label={
                                                        <Text size="xs" ta="center" fw={700}>
                                                            {classInfo?.studentCount || 0}
                                                        </Text>
                                                    }
                                                />
                                                <div>
                                                    <Group gap="xs">
                                                        <Text fw={600}>{schedule.className || 'Turma'}</Text>
                                                        <Badge size="sm" color="blue" variant="light">
                                                            {DAY_NAMES[schedule.dayOfWeek]}
                                                        </Badge>
                                                    </Group>
                                                    <Group gap="xs" mt={4}>
                                                        <Text size="sm" c="dimmed">{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</Text>
                                                        {schedule.roomId && (
                                                            <>
                                                                <Text size="sm" c="dimmed">•</Text>
                                                                <Text size="sm" c="dimmed">{schedule.roomId}</Text>
                                                            </>
                                                        )}
                                                    </Group>
                                                </div>
                                            </Group>

                                            <Link href={`/teacher/attendance`} passHref legacyBehavior>
                                                <Button component="a" size="xs" color="green" leftSection={<IconCheck size={14} />}>
                                                    Fazer Chamada
                                                </Button>
                                            </Link>
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            </Card>

            {/* Classes Grid */}
            <Stack gap="md">
                <Group justify="space-between">
                    <Title order={3}>Suas Turmas</Title>
                    <Text size="sm" c="dimmed">{classes.length} turma{classes.length !== 1 ? 's' : ''} ativa{classes.length !== 1 ? 's' : ''}</Text>
                </Group>

                {classes.length === 0 ? (
                    <Card withBorder p="xl" ta="center">
                        <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                            <IconUsers size={30} />
                        </ThemeIcon>
                        <Title order={3} mb="xs">Nenhuma turma atribuída</Title>
                        <Text c="dimmed">Entre em contato com a coordenação para ser vinculado a turmas</Text>
                    </Card>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {classes.map((cls) => {
                            const classStudents = studentsByClass[cls.id] || [];
                            const occupancy = cls.maxStudents > 0
                                ? Math.round((cls.studentCount / cls.maxStudents) * 100)
                                : 0;

                            return (
                                <Card key={cls.id} shadow="sm" radius="md" p="lg" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Badge variant="light" color="violet" size="lg">
                                                {cls.code}
                                            </Badge>
                                            <Badge size="sm" color={cls.status === 'active' ? 'green' : 'gray'} variant="light">
                                                {cls.status === 'active' ? 'Ativa' : cls.status}
                                            </Badge>
                                        </Group>

                                        <div>
                                            <Text fw={600} size="lg">{cls.name}</Text>
                                            <Text size="sm" c="dimmed">{cls.studentCount}/{cls.maxStudents} alunos</Text>
                                        </div>

                                        <div>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="xs" c="dimmed">Ocupação</Text>
                                                <Text size="xs" fw={500}>{occupancy}%</Text>
                                            </Group>
                                            <Progress value={occupancy} size="sm" color={occupancy > 90 ? 'red' : occupancy > 70 ? 'orange' : 'cyan'} radius="xl" />
                                        </div>

                                        {/* Student avatars preview */}
                                        {classStudents.length > 0 && (
                                            <Group gap={4}>
                                                {classStudents.slice(0, 6).map(s => (
                                                    <Tooltip key={s.id} label={s.name}>
                                                        <Avatar size="sm" radius="xl" color="violet">
                                                            {s.name.charAt(0)}
                                                        </Avatar>
                                                    </Tooltip>
                                                ))}
                                                {classStudents.length > 6 && (
                                                    <Avatar size="sm" radius="xl" color="gray">
                                                        +{classStudents.length - 6}
                                                    </Avatar>
                                                )}
                                            </Group>
                                        )}

                                        <Link href={`/teacher/classes/${cls.id}`} passHref legacyBehavior>
                                            <Button component="a" variant="light" fullWidth>
                                                Ver Turma
                                            </Button>
                                        </Link>
                                    </Stack>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                )}
            </Stack>

            {/* Quick-access Toolbox */}
            <Stack gap="md">
                <Title order={3}>Caixa de Ferramentas</Title>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    <Link href="/teacher/attendance" passHref legacyBehavior>
                        <Paper component="a" shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer', textDecoration: 'none' }}>
                            <Stack align="center" gap="sm">
                                <ThemeIcon size={48} radius="xl" variant="light" color="green">
                                    <IconClipboardCheck size={24} />
                                </ThemeIcon>
                                <Text fw={500} ta="center">Controle de Presença</Text>
                                <Text size="xs" c="dimmed" ta="center">Fazer chamada</Text>
                            </Stack>
                        </Paper>
                    </Link>

                    <Link href="/teacher/grades" passHref legacyBehavior>
                        <Paper component="a" shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer', textDecoration: 'none' }}>
                            <Stack align="center" gap="sm">
                                <ThemeIcon size={48} radius="xl" variant="light" color="violet">
                                    <IconChartBar size={24} />
                                </ThemeIcon>
                                <Text fw={500} ta="center">Notas e Avaliações</Text>
                                <Text size="xs" c="dimmed" ta="center">Progresso por aluno</Text>
                            </Stack>
                        </Paper>
                    </Link>

                    <Link href="/teacher/schedule" passHref legacyBehavior>
                        <Paper component="a" shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer', textDecoration: 'none' }}>
                            <Stack align="center" gap="sm">
                                <ThemeIcon size={48} radius="xl" variant="light" color="blue">
                                    <IconCalendarEvent size={24} />
                                </ThemeIcon>
                                <Text fw={500} ta="center">Minha Agenda</Text>
                                <Text size="xs" c="dimmed" ta="center">Horários e salas</Text>
                            </Stack>
                        </Paper>
                    </Link>

                    <Paper shadow="xs" radius="md" p="lg" withBorder style={{ cursor: 'pointer' }} onClick={openMessage}>
                        <Stack align="center" gap="sm">
                            <ThemeIcon size={48} radius="xl" variant="light" color="orange">
                                <IconMessageCircle size={24} />
                            </ThemeIcon>
                            <Text fw={500} ta="center">Mensagens</Text>
                            <Text size="xs" c="dimmed" ta="center">Alunos e pais</Text>
                        </Stack>
                    </Paper>
                </SimpleGrid>
            </Stack>

            {/* Student Roster (all classes) */}
            {students.length > 0 && (
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Group>
                                <ThemeIcon size="lg" variant="light" color="teal">
                                    <IconUsers size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={600}>Seus Alunos</Text>
                                    <Text size="sm" c="dimmed">{students.length} aluno{students.length !== 1 ? 's' : ''} matriculado{students.length !== 1 ? 's' : ''}</Text>
                                </div>
                            </Group>
                        </Group>

                        <Divider />

                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Aluno</Table.Th>
                                    <Table.Th>Turma</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th></Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {students.slice(0, 20).map(student => (
                                    <Table.Tr key={student.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size="sm" radius="xl" color="violet">
                                                    {student.name.charAt(0)}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>{student.name}</Text>
                                                    {student.email && <Text size="xs" c="dimmed">{student.email}</Text>}
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" size="sm">{student.className || 'Sem turma'}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={student.enrollmentStatus === 'active' ? 'green' : 'gray'}
                                                size="sm"
                                            >
                                                {student.enrollmentStatus === 'active' ? 'Ativo' : student.enrollmentStatus}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Tooltip label="Enviar mensagem">
                                                <ActionIcon
                                                    variant="light"
                                                    color="blue"
                                                    size="sm"
                                                    onClick={() => {
                                                        setMessageRecipient(student.name);
                                                        openMessage();
                                                    }}
                                                >
                                                    <IconMail size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>

                        {students.length > 20 && (
                            <Text size="sm" c="dimmed" ta="center">
                                Mostrando 20 de {students.length} alunos
                            </Text>
                        )}
                    </Stack>
                </Card>
            )}

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
                        placeholder="Selecione aluno ou turma"
                        value={messageRecipient}
                        onChange={setMessageRecipient}
                        data={[
                            {
                                group: 'Alunos',
                                items: students.map(s => ({ value: s.name, label: s.name }))
                            },
                            {
                                group: 'Turmas',
                                items: classes.map(c => ({ value: `class-${c.id}`, label: `Toda ${c.name}` }))
                            },
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
                                // TODO: POST to /api/communicator/conversations
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
