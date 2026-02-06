'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Avatar, ThemeIcon, Paper, ActionIcon, Tabs, Table, Progress,
    Timeline, RingProgress, Divider, Textarea, Modal, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconUser, IconCalendar, IconChartBar,
    IconMail, IconPhone, IconNote, IconFlag, IconCheck, IconX,
    IconClock, IconTrophy, IconBrain, IconMessage, IconAlertCircle,
    IconStar, IconBook, IconSchool, IconUsersGroup, IconScale
} from '@tabler/icons-react';
import Link from 'next/link';

interface StudentDetail {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    enrolledAt: string;
    classId: string;
    className: string;
    level: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
}

interface AttendanceRecord {
    date: string;
    status: 'present' | 'late' | 'absent' | 'excused';
    notes?: string;
}

interface ProgressRecord {
    moduleId: string;
    moduleName: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
}

interface ActivityRecord {
    id: string;
    type: 'lesson_completed' | 'badge_earned' | 'prompt_run' | 'attendance' | 'note_added';
    title: string;
    description: string;
    date: string;
    metadata?: Record<string, unknown>;
}

interface GradeRecord {
    id: string;
    moduleId: string;
    moduleName: string;
    capstoneTitle: string;
    submittedAt: string;
    selfScore: number;
    teacherScore: number;
    peerScore: number;
    peerCount: number;
    finalScore: number;
    status: 'graded' | 'pending_peer' | 'pending_teacher';
    teacherFeedback?: string;
}

// Mock data
const MOCK_STUDENT: StudentDetail = {
    id: 'student-1',
    name: 'Ana Carolina Silva',
    email: 'ana.silva@email.com',
    phone: '(11) 99999-1234',
    enrolledAt: '2026-01-15',
    classId: 'class-1',
    className: 'Turma A - Manhã',
    level: 'AI Explorer',
    parentName: 'Maria Silva',
    parentEmail: 'maria.silva@email.com',
    parentPhone: '(11) 98888-5678',
};

const MOCK_ATTENDANCE: AttendanceRecord[] = [
    { date: '2026-02-02', status: 'present' },
    { date: '2026-01-30', status: 'present' },
    { date: '2026-01-28', status: 'late', notes: '10 min de atraso' },
    { date: '2026-01-26', status: 'present' },
    { date: '2026-01-23', status: 'absent' },
    { date: '2026-01-21', status: 'excused', notes: 'Consulta médica' },
    { date: '2026-01-19', status: 'present' },
    { date: '2026-01-16', status: 'present' },
];

const MOCK_PROGRESS: ProgressRecord[] = [
    { moduleId: 'm1', moduleName: 'Module 1: Orbit', progress: 100, completedLessons: 6, totalLessons: 6 },
    { moduleId: 'm2', moduleName: 'Module 2: Slingshot', progress: 60, completedLessons: 3, totalLessons: 5 },
    { moduleId: 'm3', moduleName: 'Module 3: Black Hole', progress: 0, completedLessons: 0, totalLessons: 5 },
];

const MOCK_ACTIVITY: ActivityRecord[] = [
    { id: 'a1', type: 'lesson_completed', title: 'Lesson Completed', description: 'Aula 3.3: Validating AI Output', date: '2026-02-02T14:30:00' },
    { id: 'a2', type: 'badge_earned', title: 'Badge Earned', description: 'Slingshot Master 🏅', date: '2026-02-01T10:15:00' },
    { id: 'a3', type: 'prompt_run', title: 'AI Experiment', description: 'Ran 5 prompts in Playground', date: '2026-01-30T16:45:00' },
    { id: 'a4', type: 'attendance', title: 'Attendance', description: 'Checked in for class', date: '2026-01-30T08:02:00' },
    { id: 'a5', type: 'lesson_completed', title: 'Lesson Completed', description: 'Aula 3.2: Memory Management', date: '2026-01-28T15:00:00' },
];

const MOCK_GRADES: GradeRecord[] = [
    {
        id: 'g1',
        moduleId: 'm1',
        moduleName: 'Module 1: Orbit',
        capstoneTitle: 'The World Builder',
        submittedAt: '2026-01-25T16:00:00',
        selfScore: 22,
        teacherScore: 21,
        peerScore: 20.5,
        peerCount: 4,
        finalScore: 21.13,
        status: 'graded',
        teacherFeedback: 'Excelente criatividade na construção do mundo. Prompts bem estruturados.',
    },
    {
        id: 'g2',
        moduleId: 'm2',
        moduleName: 'Module 2: Slingshot',
        capstoneTitle: 'Chain of Thought Challenge',
        submittedAt: '2026-02-01T14:30:00',
        selfScore: 20,
        teacherScore: 19,
        peerScore: 18.5,
        peerCount: 3,
        finalScore: 19.13,
        status: 'graded',
        teacherFeedback: 'Bom uso da técnica, mas poderia explorar mais variações.',
    },
];

const attendanceStatusColors = {
    present: 'green',
    late: 'yellow',
    absent: 'red',
    excused: 'blue',
};

const attendanceStatusLabels = {
    present: 'P',
    late: 'A',
    absent: 'F',
    excused: 'J',
};

const activityIcons = {
    lesson_completed: IconBook,
    badge_earned: IconTrophy,
    prompt_run: IconBrain,
    attendance: IconCheck,
    note_added: IconNote,
};

const activityColors = {
    lesson_completed: 'cyan',
    badge_earned: 'yellow',
    prompt_run: 'violet',
    attendance: 'green',
    note_added: 'gray',
};

export default function TeacherStudentDetailPage() {
    const params = useParams();
    const studentId = params.id as string;

    const [student] = useState<StudentDetail>(MOCK_STUDENT);
    const [attendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
    const [progress] = useState<ProgressRecord[]>(MOCK_PROGRESS);
    const [activity] = useState<ActivityRecord[]>(MOCK_ACTIVITY);
    const [grades] = useState<GradeRecord[]>(MOCK_GRADES);
    const [notes, setNotes] = useState<string>('Aluna muito dedicada. Tem facilidade com os conceitos de prompting.');

    const [noteModal, { open: openNoteModal, close: closeNoteModal }] = useDisclosure(false);
    const [tempNote, setTempNote] = useState(notes);

    // Calculate stats
    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = Math.round((presentClasses / totalClasses) * 100);

    const totalProgress = Math.round(progress.reduce((acc, p) => acc + p.progress, 0) / progress.length);
    const averageGrade = grades.length > 0
        ? grades.reduce((acc, g) => acc + g.finalScore, 0) / grades.length
        : 0;

    const handleSaveNote = () => {
        setNotes(tempNote);
        closeNoteModal();
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/teacher" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <Avatar size="lg" radius="xl" color="violet">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                    <div>
                        <Title order={2}>{student.name}</Title>
                        <Group gap="xs">
                            <Badge variant="light" color="violet">{student.className}</Badge>
                            <Badge variant="light" color="cyan">{student.level}</Badge>
                        </Group>
                    </div>
                </Group>
                <Group>
                    <Button variant="light" leftSection={<IconMessage size={16} />}>
                        Mensagem
                    </Button>
                    <Button variant="light" color="orange" leftSection={<IconFlag size={16} />}>
                        Adicionar Flag
                    </Button>
                </Group>
            </Group>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{attendanceRate}%</Text>
                            <Text size="sm" c="dimmed">Frequência</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={5}
                            roundCaps
                            sections={[{ value: attendanceRate, color: attendanceRate >= 75 ? 'green' : 'red' }]}
                        />
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{totalProgress}%</Text>
                            <Text size="sm" c="dimmed">Progresso</Text>
                        </div>
                        <RingProgress
                            size={50}
                            thickness={5}
                            roundCaps
                            sections={[{ value: totalProgress, color: 'cyan' }]}
                        />
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} variant="light" color="yellow">
                            <IconTrophy size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>5</Text>
                            <Text size="sm" c="dimmed">Badges</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconBrain size={24} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>47</Text>
                            <Text size="sm" c="dimmed">Prompts</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {/* Left Column: Contact + Progress */}
                <Stack gap="lg">
                    {/* Contact Info */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            <Text fw={600}>Informações de Contato</Text>

                            <Group gap="lg">
                                <div>
                                    <Text size="xs" c="dimmed">Aluno</Text>
                                    <Group gap="xs" mt={4}>
                                        <IconMail size={14} color="gray" />
                                        <Text size="sm">{student.email}</Text>
                                    </Group>
                                    {student.phone && (
                                        <Group gap="xs" mt={4}>
                                            <IconPhone size={14} color="gray" />
                                            <Text size="sm">{student.phone}</Text>
                                        </Group>
                                    )}
                                </div>
                            </Group>

                            {student.parentName && (
                                <>
                                    <Divider />
                                    <div>
                                        <Text size="xs" c="dimmed">Responsável: {student.parentName}</Text>
                                        {student.parentEmail && (
                                            <Group gap="xs" mt={4}>
                                                <IconMail size={14} color="gray" />
                                                <Text size="sm">{student.parentEmail}</Text>
                                            </Group>
                                        )}
                                        {student.parentPhone && (
                                            <Group gap="xs" mt={4}>
                                                <IconPhone size={14} color="gray" />
                                                <Text size="sm">{student.parentPhone}</Text>
                                            </Group>
                                        )}
                                    </div>
                                </>
                            )}
                        </Stack>
                    </Card>

                    {/* Module Progress */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={600}>Progresso por Módulo</Text>
                                <Badge variant="light">{totalProgress}% total</Badge>
                            </Group>

                            <Stack gap="sm">
                                {progress.map(mod => (
                                    <div key={mod.moduleId}>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">{mod.moduleName}</Text>
                                            <Text size="xs" c="dimmed">{mod.completedLessons}/{mod.totalLessons} aulas</Text>
                                        </Group>
                                        <Progress
                                            value={mod.progress}
                                            size="sm"
                                            radius="xl"
                                            color={mod.progress === 100 ? 'green' : 'cyan'}
                                        />
                                    </div>
                                ))}
                            </Stack>
                        </Stack>
                    </Card>

                    {/* Grades History */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={600}>Histórico de Notas</Text>
                                <Badge variant="light" color="blue">
                                    Média: {averageGrade.toFixed(1)}/25
                                </Badge>
                            </Group>

                            {grades.length === 0 ? (
                                <Paper p="md" bg="gray.0" radius="md">
                                    <Text size="sm" c="dimmed" ta="center">Nenhum capstone avaliado ainda</Text>
                                </Paper>
                            ) : (
                                <Stack gap="sm">
                                    {grades.map(grade => {
                                        const percentage = (grade.finalScore / 25) * 100;
                                        const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'blue' : percentage >= 40 ? 'yellow' : 'red';

                                        return (
                                            <Paper key={grade.id} p="md" withBorder radius="md">
                                                <Stack gap="xs">
                                                    <Group justify="space-between">
                                                        <div>
                                                            <Text size="sm" fw={600}>{grade.capstoneTitle}</Text>
                                                            <Text size="xs" c="dimmed">{grade.moduleName}</Text>
                                                        </div>
                                                        <RingProgress
                                                            size={50}
                                                            thickness={4}
                                                            roundCaps
                                                            sections={[{ value: percentage, color }]}
                                                            label={
                                                                <Text size="xs" fw={700} ta="center">
                                                                    {grade.finalScore.toFixed(1)}
                                                                </Text>
                                                            }
                                                        />
                                                    </Group>

                                                    {/* 360° Breakdown */}
                                                    <Group gap="xs">
                                                        <Tooltip label="Auto-avaliação (25%)">
                                                            <Badge variant="light" color="violet" size="xs">
                                                                <Group gap={4}>
                                                                    <IconUser size={10} />
                                                                    {grade.selfScore}
                                                                </Group>
                                                            </Badge>
                                                        </Tooltip>
                                                        <Tooltip label="Professor (50%)">
                                                            <Badge variant="light" color="blue" size="xs">
                                                                <Group gap={4}>
                                                                    <IconSchool size={10} />
                                                                    {grade.teacherScore}
                                                                </Group>
                                                            </Badge>
                                                        </Tooltip>
                                                        <Tooltip label={`Colegas (25%) - ${grade.peerCount} avaliadores`}>
                                                            <Badge variant="light" color="green" size="xs">
                                                                <Group gap={4}>
                                                                    <IconUsersGroup size={10} />
                                                                    {grade.peerScore.toFixed(1)}
                                                                </Group>
                                                            </Badge>
                                                        </Tooltip>
                                                        <Tooltip label="Nota Final Ponderada">
                                                            <Badge variant="filled" color={color} size="xs">
                                                                <Group gap={4}>
                                                                    <IconScale size={10} />
                                                                    {grade.finalScore.toFixed(1)}
                                                                </Group>
                                                            </Badge>
                                                        </Tooltip>
                                                    </Group>

                                                    {grade.teacherFeedback && (
                                                        <Paper p="xs" bg="gray.0" radius="sm">
                                                            <Group gap="xs">
                                                                <IconMessage size={12} color="gray" />
                                                                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                                                    {grade.teacherFeedback}
                                                                </Text>
                                                            </Group>
                                                        </Paper>
                                                    )}

                                                    <Text size="xs" c="dimmed">
                                                        Enviado em {new Date(grade.submittedAt).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                </Stack>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Stack>
                    </Card>

                    {/* Notes */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={600}>Anotações do Professor</Text>
                                <Button variant="subtle" size="xs" onClick={() => { setTempNote(notes); openNoteModal(); }}>
                                    Editar
                                </Button>
                            </Group>

                            <Paper p="md" bg="gray.0" radius="md">
                                <Text size="sm" c={notes ? undefined : 'dimmed'}>
                                    {notes || 'Nenhuma anotação ainda...'}
                                </Text>
                            </Paper>
                        </Stack>
                    </Card>
                </Stack>

                {/* Right Column: Attendance + Activity */}
                <Stack gap="lg">
                    {/* Attendance History */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={600}>Histórico de Frequência</Text>
                                <Badge variant="light" color={attendanceRate >= 75 ? 'green' : 'red'}>
                                    {attendanceRate}% frequência
                                </Badge>
                            </Group>

                            <Group gap="xs" wrap="wrap">
                                {attendance.map((record, index) => (
                                    <Tooltip
                                        key={index}
                                        label={`${new Date(record.date).toLocaleDateString('pt-BR')}${record.notes ? `: ${record.notes}` : ''}`}
                                    >
                                        <Badge
                                            size="lg"
                                            color={attendanceStatusColors[record.status]}
                                            variant="filled"
                                            style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            {attendanceStatusLabels[record.status]}
                                        </Badge>
                                    </Tooltip>
                                ))}
                            </Group>

                            <Group gap="md">
                                <Group gap={4}>
                                    <Badge size="xs" color="green" variant="filled">P</Badge>
                                    <Text size="xs" c="dimmed">Presente</Text>
                                </Group>
                                <Group gap={4}>
                                    <Badge size="xs" color="yellow" variant="filled">A</Badge>
                                    <Text size="xs" c="dimmed">Atrasado</Text>
                                </Group>
                                <Group gap={4}>
                                    <Badge size="xs" color="red" variant="filled">F</Badge>
                                    <Text size="xs" c="dimmed">Falta</Text>
                                </Group>
                                <Group gap={4}>
                                    <Badge size="xs" color="blue" variant="filled">J</Badge>
                                    <Text size="xs" c="dimmed">Justificado</Text>
                                </Group>
                            </Group>
                        </Stack>
                    </Card>

                    {/* Activity Timeline */}
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            <Text fw={600}>Atividade Recente</Text>

                            <Timeline bulletSize={24} lineWidth={2}>
                                {activity.map(item => {
                                    const Icon = activityIcons[item.type];
                                    return (
                                        <Timeline.Item
                                            key={item.id}
                                            bullet={<Icon size={12} />}
                                            color={activityColors[item.type]}
                                            title={item.title}
                                        >
                                            <Text size="sm" c="dimmed">{item.description}</Text>
                                            <Text size="xs" c="dimmed" mt={4}>
                                                {new Date(item.date).toLocaleDateString('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </Text>
                                        </Timeline.Item>
                                    );
                                })}
                            </Timeline>
                        </Stack>
                    </Card>
                </Stack>
            </SimpleGrid>

            {/* Note Edit Modal */}
            <Modal
                opened={noteModal}
                onClose={closeNoteModal}
                title="Editar Anotações"
                centered
            >
                <Stack gap="md">
                    <Textarea
                        placeholder="Adicione observações sobre o aluno..."
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        minRows={4}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeNoteModal}>Cancelar</Button>
                        <Button onClick={handleSaveNote}>Salvar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
