'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    Avatar, ThemeIcon, Paper, ActionIcon, Tabs, Table, Checkbox,
    TextInput, Select, Modal, Textarea, Tooltip, RingProgress, Divider,
    Loader, Center, NumberInput, Popover
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch, IconCalendar, IconClock, IconCheck, IconX,
    IconAlertCircle, IconNote, IconUsers, IconChevronLeft,
    IconFilter
} from '@tabler/icons-react';
import Link from 'next/link';
import { ExportButton } from '@/components/shared';

interface Student {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

interface AttendanceRecord {
    studentId: string;
    status: 'present' | 'late' | 'absent' | 'excused';
    lateMinutes?: number;
    excuseReason?: string;
    notes?: string;
}

interface Session {
    id: string;
    classId: string;
    className: string;
    date: string;
    time: string;
    room: string;
    students: Student[];
    attendanceRecords: Record<string, AttendanceRecord>;
    status: 'upcoming' | 'in_progress' | 'completed';
}

// Mock data for dev mode
const MOCK_SESSIONS: Session[] = [
    {
        id: 'session-1',
        classId: 'class-1',
        className: 'Turma A - Manhã',
        date: new Date().toISOString().split('T')[0],
        time: '08:00 - 09:30',
        room: 'Sala 1',
        status: 'completed',
        students: [
            { id: 's1', name: 'Ana Silva', email: 'ana@email.com' },
            { id: 's2', name: 'Bruno Costa', email: 'bruno@email.com' },
            { id: 's3', name: 'Carla Dias', email: 'carla@email.com' },
            { id: 's4', name: 'Diego Lima', email: 'diego@email.com' },
        ],
        attendanceRecords: {
            's1': { studentId: 's1', status: 'present' },
            's2': { studentId: 's2', status: 'late', lateMinutes: 15 },
            's3': { studentId: 's3', status: 'absent' },
            's4': { studentId: 's4', status: 'present' },
        }
    },
    {
        id: 'session-2',
        classId: 'class-2',
        className: 'Turma B - Tarde',
        date: new Date().toISOString().split('T')[0],
        time: '14:00 - 15:30',
        room: 'Sala 2',
        status: 'in_progress',
        students: [
            { id: 's5', name: 'Elena Rocha', email: 'elena@email.com' },
            { id: 's6', name: 'Felipe Santos', email: 'felipe@email.com' },
            { id: 's7', name: 'Gabriela Reis', email: 'gabriela@email.com' },
            { id: 's8', name: 'Henrique Alves', email: 'henrique@email.com' },
            { id: 's9', name: 'Isabela Moura', email: 'isabela@email.com' },
        ],
        attendanceRecords: {
            's5': { studentId: 's5', status: 'present' },
            's6': { studentId: 's6', status: 'present' },
        }
    },
    {
        id: 'session-3',
        classId: 'class-3',
        className: 'Turma C - Noite',
        date: new Date().toISOString().split('T')[0],
        time: '19:00 - 20:30',
        room: 'Sala 1',
        status: 'upcoming',
        students: [
            { id: 's10', name: 'João Pedro', email: 'joao@email.com' },
            { id: 's11', name: 'Laura Mendes', email: 'laura@email.com' },
            { id: 's12', name: 'Marcos Oliveira', email: 'marcos@email.com' },
        ],
        attendanceRecords: {}
    },
];

const statusColors = {
    present: 'green',
    late: 'yellow',
    absent: 'red',
    excused: 'blue',
};

const statusLabels = {
    present: 'Presente',
    late: 'Atrasado',
    absent: 'Ausente',
    excused: 'Justificado',
};

const sessionStatusColors = {
    upcoming: 'blue',
    in_progress: 'green',
    completed: 'gray',
};

const sessionStatusLabels = {
    upcoming: 'Próxima',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
};

function AttendanceContent() {
    const searchParams = useSearchParams();
    const initialSessionId = searchParams.get('session');

    const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
    const [selectedSession, setSelectedSession] = useState<string | null>(initialSessionId || null);
    const [search, setSearch] = useState('');
    const [noteModal, { open: openNoteModal, close: closeNoteModal }] = useDisclosure(false);
    const [lateModal, { open: openLateModal, close: closeLateModal }] = useDisclosure(false);
    const [excuseModal, { open: openExcuseModal, close: closeExcuseModal }] = useDisclosure(false);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [studentNote, setStudentNote] = useState('');
    const [lateMinutes, setLateMinutes] = useState<number | ''>(15);
    const [excuseReason, setExcuseReason] = useState('');

    // Auto-select the first in_progress session if none selected
    useEffect(() => {
        if (!selectedSession) {
            const inProgress = sessions.find(s => s.status === 'in_progress');
            if (inProgress) {
                setSelectedSession(inProgress.id);
            } else if (sessions.length > 0) {
                setSelectedSession(sessions[0].id);
            }
        }
    }, [sessions, selectedSession]);

    const currentSession = sessions.find(s => s.id === selectedSession);

    const handleStatusChange = (studentId: string, status: 'present' | 'late' | 'absent' | 'excused') => {
        if (!selectedSession) return;

        setSessions(prev => prev.map(session => {
            if (session.id === selectedSession) {
                return {
                    ...session,
                    attendanceRecords: {
                        ...session.attendanceRecords,
                        [studentId]: {
                            ...(session.attendanceRecords[studentId] || {}),
                            studentId,
                            status,
                        }
                    }
                };
            }
            return session;
        }));

        // Open late modal if marking as late
        if (status === 'late') {
            setSelectedStudent(studentId);
            setLateMinutes(currentSession?.attendanceRecords[studentId]?.lateMinutes || 15);
            openLateModal();
        }
        // Open excuse modal if marking as excused
        if (status === 'excused') {
            setSelectedStudent(studentId);
            setExcuseReason(currentSession?.attendanceRecords[studentId]?.excuseReason || '');
            openExcuseModal();
        }
    };

    const handleBulkMarkPresent = () => {
        if (!currentSession) return;

        const newRecords: Record<string, AttendanceRecord> = {};
        currentSession.students.forEach(student => {
            if (!currentSession.attendanceRecords[student.id]) {
                newRecords[student.id] = { studentId: student.id, status: 'present' };
            }
        });

        setSessions(prev => prev.map(session => {
            if (session.id === selectedSession) {
                return {
                    ...session,
                    attendanceRecords: {
                        ...session.attendanceRecords,
                        ...newRecords,
                    }
                };
            }
            return session;
        }));
    };

    const handleOpenNote = (studentId: string) => {
        setSelectedStudent(studentId);
        const note = currentSession?.attendanceRecords[studentId]?.notes || '';
        setStudentNote(note);
        openNoteModal();
    };

    const handleSaveNote = () => {
        if (!selectedSession || !selectedStudent) return;

        setSessions(prev => prev.map(session => {
            if (session.id === selectedSession) {
                const existing = session.attendanceRecords[selectedStudent] || { studentId: selectedStudent, status: 'present' };
                return {
                    ...session,
                    attendanceRecords: {
                        ...session.attendanceRecords,
                        [selectedStudent]: {
                            ...existing,
                            notes: studentNote,
                        }
                    }
                };
            }
            return session;
        }));

        closeNoteModal();
        setSelectedStudent(null);
        setStudentNote('');
    };

    const filteredStudents = currentSession?.students.filter(student =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const getAttendanceStats = (session: Session) => {
        const records = Object.values(session.attendanceRecords);
        const present = records.filter(r => r.status === 'present').length;
        const late = records.filter(r => r.status === 'late').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const excused = records.filter(r => r.status === 'excused').length;
        const total = session.students.length;
        const marked = records.length;

        return { present, late, absent, excused, total, marked, percentage: Math.round(((present + late) / total) * 100) };
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
                    <div>
                        <Title order={2}>Chamada 📋</Title>
                        <Text c="dimmed">Registre a frequência dos alunos</Text>
                    </div>
                </Group>
                {currentSession && (
                    <ExportButton
                        data={currentSession.students.map(student => {
                            const record = currentSession.attendanceRecords[student.id];
                            return {
                                name: student.name,
                                email: student.email,
                                status: record ? statusLabels[record.status] : 'Não marcado',
                                lateMinutes: record?.lateMinutes ?? '-',
                                notes: record?.notes ?? '-',
                            };
                        })}
                        columns={[
                            { key: 'name', label: 'Aluno' },
                            { key: 'email', label: 'E-mail' },
                            { key: 'status', label: 'Status' },
                            { key: 'lateMinutes', label: 'Minutos Atraso' },
                            { key: 'notes', label: 'Observações' },
                        ]}
                        title={`Chamada - ${currentSession.className} - ${new Date(currentSession.date).toLocaleDateString('pt-BR')}`}
                        filename={`chamada_${currentSession.classId}_${currentSession.date}`}
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar"
                    />
                )}
            </Group>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                {/* Sessions List */}
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Text fw={600}>Aulas de Hoje</Text>
                            <Badge size="sm" variant="light">{sessions.length} aulas</Badge>
                        </Group>

                        <Stack gap="sm">
                            {sessions.map(session => {
                                const stats = getAttendanceStats(session);
                                const isSelected = session.id === selectedSession;

                                return (
                                    <Paper
                                        key={session.id}
                                        p="sm"
                                        withBorder
                                        radius="md"
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                                            borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
                                        }}
                                        onClick={() => setSelectedSession(session.id)}
                                    >
                                        <Group justify="space-between">
                                            <div>
                                                <Group gap="xs">
                                                    <Text size="sm" fw={600}>{session.className}</Text>
                                                    <Badge size="xs" color={sessionStatusColors[session.status]} variant="light">
                                                        {sessionStatusLabels[session.status]}
                                                    </Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed">{session.time} • {session.room}</Text>
                                            </div>
                                            <RingProgress
                                                size={40}
                                                thickness={4}
                                                roundCaps
                                                sections={[{ value: stats.percentage || 0, color: 'green' }]}
                                                label={
                                                    <Text size="xs" ta="center" fw={700}>
                                                        {stats.marked}
                                                    </Text>
                                                }
                                            />
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Stack>
                </Card>

                {/* Attendance Form */}
                <Card shadow="sm" radius="md" p="lg" withBorder style={{ gridColumn: 'span 2' }}>
                    {currentSession ? (
                        <Stack gap="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600} size="lg">{currentSession.className}</Text>
                                    <Text size="sm" c="dimmed">
                                        {currentSession.time} • {currentSession.room} • {new Date(currentSession.date).toLocaleDateString('pt-BR')}
                                    </Text>
                                </div>
                                <Group>
                                    <Button
                                        variant="light"
                                        color="green"
                                        size="xs"
                                        leftSection={<IconCheck size={14} />}
                                        onClick={handleBulkMarkPresent}
                                    >
                                        Marcar Todos Presentes
                                    </Button>
                                </Group>
                            </Group>

                            <TextInput
                                placeholder="Buscar aluno..."
                                leftSection={<IconSearch size={16} />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            {/* Attendance Stats */}
                            {(() => {
                                const stats = getAttendanceStats(currentSession);
                                return (
                                    <Group gap="lg">
                                        <Badge size="lg" color="green" variant="light" leftSection={<IconCheck size={12} />}>
                                            {stats.present} Presentes
                                        </Badge>
                                        <Badge size="lg" color="yellow" variant="light" leftSection={<IconClock size={12} />}>
                                            {stats.late} Atrasados
                                        </Badge>
                                        <Badge size="lg" color="red" variant="light" leftSection={<IconX size={12} />}>
                                            {stats.absent} Ausentes
                                        </Badge>
                                        <Badge size="lg" color="blue" variant="light" leftSection={<IconAlertCircle size={12} />}>
                                            {stats.excused} Justificados
                                        </Badge>
                                        <Text size="sm" c="dimmed">
                                            {stats.marked}/{stats.total} marcados
                                        </Text>
                                    </Group>
                                );
                            })()}

                            <Divider />

                            {/* Student List */}
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Aluno</Table.Th>
                                        <Table.Th ta="center">Status</Table.Th>
                                        <Table.Th ta="center">Notas</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredStudents.map(student => {
                                        const record = currentSession.attendanceRecords[student.id];
                                        const status = record?.status;

                                        return (
                                            <Table.Tr key={student.id}>
                                                <Table.Td>
                                                    <Group gap="sm">
                                                        <Avatar size="sm" radius="xl" color="blue">
                                                            {student.name.charAt(0)}
                                                        </Avatar>
                                                        <div>
                                                            <Text size="sm" fw={500}>{student.name}</Text>
                                                            <Text size="xs" c="dimmed">{student.email}</Text>
                                                        </div>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" justify="center">
                                                        <Tooltip label="Presente">
                                                            <ActionIcon
                                                                variant={status === 'present' ? 'filled' : 'light'}
                                                                color="green"
                                                                onClick={() => handleStatusChange(student.id, 'present')}
                                                            >
                                                                <IconCheck size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Atrasado">
                                                            <ActionIcon
                                                                variant={status === 'late' ? 'filled' : 'light'}
                                                                color="yellow"
                                                                onClick={() => handleStatusChange(student.id, 'late')}
                                                            >
                                                                <IconClock size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Ausente">
                                                            <ActionIcon
                                                                variant={status === 'absent' ? 'filled' : 'light'}
                                                                color="red"
                                                                onClick={() => handleStatusChange(student.id, 'absent')}
                                                            >
                                                                <IconX size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="Justificado">
                                                            <ActionIcon
                                                                variant={status === 'excused' ? 'filled' : 'light'}
                                                                color="blue"
                                                                onClick={() => handleStatusChange(student.id, 'excused')}
                                                            >
                                                                <IconAlertCircle size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Tooltip label={record?.notes || 'Adicionar nota'}>
                                                        <ActionIcon
                                                            variant={record?.notes ? 'filled' : 'light'}
                                                            color="gray"
                                                            onClick={() => handleOpenNote(student.id)}
                                                        >
                                                            <IconNote size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>

                            {currentSession.status !== 'completed' && (
                                <Button color="green" fullWidth size="md">
                                    Salvar Chamada
                                </Button>
                            )}
                        </Stack>
                    ) : (
                        <Stack align="center" justify="center" py="xl">
                            <ThemeIcon size={64} variant="light" color="gray" radius="xl">
                                <IconUsers size={32} />
                            </ThemeIcon>
                            <Text c="dimmed">Selecione uma aula para fazer a chamada</Text>
                        </Stack>
                    )}
                </Card>
            </SimpleGrid>

            {/* Note Modal */}
            <Modal
                opened={noteModal}
                onClose={closeNoteModal}
                title="Adicionar Nota"
                centered
            >
                <Stack gap="md">
                    <Textarea
                        label="Observação"
                        placeholder="Ex: Chegou atrasado por problema de transporte..."
                        value={studentNote}
                        onChange={(e) => setStudentNote(e.target.value)}
                        minRows={3}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeNoteModal}>Cancelar</Button>
                        <Button onClick={handleSaveNote}>Salvar</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Late Arrival Modal */}
            <Modal
                opened={lateModal}
                onClose={closeLateModal}
                title="Tempo de Atraso"
                centered
                size="sm"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Informe quantos minutos o aluno chegou atrasado:
                    </Text>
                    <NumberInput
                        label="Minutos de atraso"
                        placeholder="15"
                        value={lateMinutes}
                        onChange={(val) => setLateMinutes(val as number | '')}
                        min={1}
                        max={120}
                        suffix=" min"
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeLateModal}>Cancelar</Button>
                        <Button
                            color="yellow"
                            onClick={() => {
                                if (selectedStudent && selectedSession && lateMinutes) {
                                    setSessions(prev => prev.map(session => {
                                        if (session.id === selectedSession) {
                                            return {
                                                ...session,
                                                attendanceRecords: {
                                                    ...session.attendanceRecords,
                                                    [selectedStudent]: {
                                                        ...(session.attendanceRecords[selectedStudent] || { studentId: selectedStudent, status: 'late' }),
                                                        lateMinutes: lateMinutes as number,
                                                    }
                                                }
                                            };
                                        }
                                        return session;
                                    }));
                                }
                                closeLateModal();
                            }}
                        >
                            Confirmar
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Excuse Reason Modal */}
            <Modal
                opened={excuseModal}
                onClose={closeExcuseModal}
                title="Motivo da Justificativa"
                centered
                size="md"
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Informe o motivo da falta justificada:
                    </Text>
                    <Select
                        label="Tipo de justificativa"
                        placeholder="Selecione..."
                        data={[
                            { value: 'medical', label: '🏥 Atestado Médico' },
                            { value: 'family', label: '👨‍👩‍👧 Compromisso Familiar' },
                            { value: 'transport', label: '🚗 Problema de Transporte' },
                            { value: 'other', label: '📝 Outro' },
                        ]}
                    />
                    <Textarea
                        label="Detalhes (opcional)"
                        placeholder="Descreva o motivo..."
                        value={excuseReason}
                        onChange={(e) => setExcuseReason(e.target.value)}
                        minRows={2}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeExcuseModal}>Cancelar</Button>
                        <Button
                            color="blue"
                            onClick={() => {
                                if (selectedStudent && selectedSession) {
                                    setSessions(prev => prev.map(session => {
                                        if (session.id === selectedSession) {
                                            return {
                                                ...session,
                                                attendanceRecords: {
                                                    ...session.attendanceRecords,
                                                    [selectedStudent]: {
                                                        ...(session.attendanceRecords[selectedStudent] || { studentId: selectedStudent, status: 'excused' }),
                                                        excuseReason: excuseReason,
                                                    }
                                                }
                                            };
                                        }
                                        return session;
                                    }));
                                }
                                closeExcuseModal();
                            }}
                        >
                            Confirmar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

// Wrap in Suspense for useSearchParams
export default function TeacherAttendancePage() {
    return (
        <Suspense fallback={
            <Center py="xl">
                <Loader size="lg" />
            </Center>
        }>
            <AttendanceContent />
        </Suspense>
    );
}

