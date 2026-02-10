'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title,
    Text,
    Card,
    Stack,
    Group,
    Badge,
    Avatar,
    Paper,
    Button,
    TextInput,
    Modal,
    Select,
    Textarea,
    Tabs,
    ThemeIcon,
    ActionIcon,
    Divider,
    Loader,
    Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch,
    IconCheck,
    IconClock,
    IconUser,
    IconMapPin,
    IconSchool,
    IconUserPlus,
    IconCalendarEvent,
    IconX,
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

interface SessionStudent {
    id: string;
    name: string;
    checkedIn: boolean;
    checkedInAt: string | null;
}

interface SessionEntry {
    id: string;
    className: string;
    teacherName: string;
    roomName: string;
    time: string;
    status: string;
    students: SessionStudent[];
}

const statusColors: Record<string, string> = {
    in_progress: 'green',
    scheduled: 'blue',
    completed: 'gray',
};

const statusLabels: Record<string, string> = {
    in_progress: 'Em andamento',
    scheduled: 'Agendada',
    completed: 'Concluída',
};

export default function CheckinPage() {
    const [search, setSearch] = useState('');
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [walkInOpened, { open: openWalkIn, close: closeWalkIn }] = useDisclosure(false);
    const [loading, setLoading] = useState(true);
    const [todaySessions, setTodaySessions] = useState<SessionEntry[]>([]);

    // Fetch today's sessions from API
    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            const todayDow = new Date().getDay(); // 0=Sun, 1=Mon,...

            const [schedRes, classRes, enrollRes, attendRes] = await Promise.allSettled([
                fetch('/api/schedules'),
                fetch('/api/classes'),
                fetch('/api/enrollments?status=active'),
                fetch(`/api/attendance?date=${new Date().toISOString().split('T')[0]}`),
            ]);

            const schedules = schedRes.status === 'fulfilled' && schedRes.value.ok
                ? (await schedRes.value.json()).data || [] : [];
            const classes = classRes.status === 'fulfilled' && classRes.value.ok
                ? (await classRes.value.json()).data || [] : [];
            const enrollments = enrollRes.status === 'fulfilled' && enrollRes.value.ok
                ? (await enrollRes.value.json()).data || [] : [];
            const attendances = attendRes.status === 'fulfilled' && attendRes.value.ok
                ? (await attendRes.value.json()).data || [] : [];

            // Build class lookup
            const classMap = new Map<string, any>();
            classes.forEach((c: any) => classMap.set(c.id, c));

            // Build attendance lookup (by personId + classId)
            const attendSet = new Map<string, string>(); // key -> checkedInAt
            attendances.forEach((a: any) => {
                const key = `${a.personId || a.studentId}-${a.classId}`;
                attendSet.set(key, a.checkedInAt ? new Date(a.checkedInAt * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sim');
            });

            // Filter schedules for today
            const todaySchedules = schedules.filter((s: any) => s.dayOfWeek === todayDow);

            // Build sessions
            const sessions: SessionEntry[] = todaySchedules.map((sched: any) => {
                const cls = classMap.get(sched.classId) || {};
                const classEnrollments = enrollments.filter((e: any) => e.classId === sched.classId);

                const now = new Date();
                const [startH, startM] = (sched.startTime || '00:00').split(':').map(Number);
                const [endH, endM] = (sched.endTime || '00:00').split(':').map(Number);
                const startMin = startH * 60 + startM;
                const endMin = endH * 60 + endM;
                const nowMin = now.getHours() * 60 + now.getMinutes();

                let status = 'scheduled';
                if (nowMin >= startMin && nowMin <= endMin) status = 'in_progress';
                else if (nowMin > endMin) status = 'completed';

                const students: SessionStudent[] = classEnrollments.map((e: any) => {
                    const personId = e.personId || e.studentId || e.id;
                    const key = `${personId}-${sched.classId}`;
                    const checkedInAt = attendSet.get(key) || null;
                    return {
                        id: personId,
                        name: e.studentName || e.personName || 'Aluno',
                        checkedIn: !!checkedInAt,
                        checkedInAt,
                    };
                });

                return {
                    id: sched.id,
                    className: cls.name || `Turma ${sched.classId?.slice(0, 6)}`,
                    teacherName: cls.teacherName || 'Professor',
                    roomName: sched.roomId ? `Sala ${sched.roomId.slice(0, 4)}` : 'Sem sala',
                    time: `${(sched.startTime || '').slice(0, 5)} - ${(sched.endTime || '').slice(0, 5)}`,
                    status,
                    students,
                };
            });

            setTodaySessions(sessions);
        } catch (err) {
            console.error('Failed to load check-in data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Search results
    const searchResults = search.length >= 2
        ? todaySessions.flatMap(session =>
            session.students
                .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
                .map(s => ({ ...s, session }))
        )
        : [];

    const handleQuickCheckin = async (studentId: string, sessionId: string) => {
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personId: studentId,
                    classId: sessionId,
                    date: new Date().toISOString().split('T')[0],
                    status: 'present',
                }),
            });
            if (res.ok) {
                // Refresh sessions to reflect check-in
                fetchSessions();
            }
        } catch (err) {
            console.error('Check-in failed:', err);
        }
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={1}>Check-in</Title>
                    <Text c="dimmed" size="lg">
                        Recepção e controle de presença
                    </Text>
                </div>
                <Button
                    leftSection={<IconUserPlus size={18} />}
                    onClick={openWalkIn}
                >
                    Walk-in Lead
                </Button>
            </Group>

            {/* Quick Search */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <TextInput
                    size="lg"
                    placeholder="Buscar aluno por nome..."
                    leftSection={<IconSearch size={20} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {searchResults.length > 0 && (
                    <Stack gap="sm" mt="md">
                        <Text size="sm" c="dimmed">
                            {searchResults.length} resultado(s)
                        </Text>
                        {searchResults.map((result) => (
                            <Paper
                                key={`${result.session.id}-${result.id}`}
                                p="md"
                                withBorder
                                radius="md"
                            >
                                <Group justify="space-between">
                                    <Group>
                                        <Avatar color="blue" radius="xl">
                                            {result.name.charAt(0)}
                                        </Avatar>
                                        <div>
                                            <Text fw={500}>{result.name}</Text>
                                            <Text size="sm" c="dimmed">
                                                {result.session.className} • {result.session.time}
                                            </Text>
                                        </div>
                                    </Group>
                                    {result.checkedIn ? (
                                        <Badge color="green" size="lg">
                                            <Group gap="xs">
                                                <IconCheck size={14} />
                                                Check-in: {result.checkedInAt}
                                            </Group>
                                        </Badge>
                                    ) : (
                                        <Button
                                            color="green"
                                            leftSection={<IconCheck size={18} />}
                                            onClick={() => handleQuickCheckin(result.id, result.session.id)}
                                        >
                                            Check-in
                                        </Button>
                                    )}
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Card>

            {/* Today's Sessions */}
            <Title order={3}>Aulas de Hoje</Title>

            <Stack gap="md">
                {todaySessions.map((session) => {
                    const checkedInCount = session.students.filter(s => s.checkedIn).length;
                    const isExpanded = selectedSession === session.id;

                    return (
                        <Card
                            key={session.id}
                            shadow="sm"
                            radius="md"
                            p="lg"
                            withBorder
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedSession(isExpanded ? null : session.id)}
                        >
                            <Group justify="space-between">
                                <Group>
                                    <ThemeIcon
                                        size="xl"
                                        radius="xl"
                                        color={statusColors[session.status]}
                                    >
                                        <IconSchool size={24} />
                                    </ThemeIcon>
                                    <div>
                                        <Group gap="sm">
                                            <Text fw={600} size="lg">{session.className}</Text>
                                            <Badge color={statusColors[session.status]}>
                                                {statusLabels[session.status]}
                                            </Badge>
                                        </Group>
                                        <Group gap="lg" mt="xs">
                                            <Group gap="xs">
                                                <IconClock size={14} />
                                                <Text size="sm" c="dimmed">{session.time}</Text>
                                            </Group>
                                            <Group gap="xs">
                                                <IconUser size={14} />
                                                <Text size="sm" c="dimmed">{session.teacherName}</Text>
                                            </Group>
                                            <Group gap="xs">
                                                <IconMapPin size={14} />
                                                <Text size="sm" c="dimmed">{session.roomName}</Text>
                                            </Group>
                                        </Group>
                                    </div>
                                </Group>

                                <Group>
                                    <Badge size="lg" variant="light">
                                        {checkedInCount}/{session.students.length} presentes
                                    </Badge>
                                </Group>
                            </Group>

                            {isExpanded && (
                                <>
                                    <Divider my="md" />
                                    <Stack gap="sm">
                                        {session.students.map((student) => (
                                            <Paper
                                                key={student.id}
                                                p="sm"
                                                withBorder
                                                radius="sm"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Group justify="space-between">
                                                    <Group>
                                                        <Avatar size="sm" color="blue" radius="xl">
                                                            {student.name.charAt(0)}
                                                        </Avatar>
                                                        <Text size="sm">{student.name}</Text>
                                                    </Group>
                                                    {student.checkedIn ? (
                                                        <Group gap="xs">
                                                            <Badge color="green" variant="light">
                                                                {student.checkedInAt}
                                                            </Badge>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="red"
                                                                size="sm"
                                                            >
                                                                <IconX size={14} />
                                                            </ActionIcon>
                                                        </Group>
                                                    ) : (
                                                        <Button
                                                            size="xs"
                                                            color="green"
                                                            variant="light"
                                                            leftSection={<IconCheck size={14} />}
                                                            onClick={() => handleQuickCheckin(student.id, session.id)}
                                                        >
                                                            Check-in
                                                        </Button>
                                                    )}
                                                </Group>
                                            </Paper>
                                        ))}

                                        {session.students.some(s => !s.checkedIn) && (
                                            <Button
                                                variant="light"
                                                fullWidth
                                                mt="xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Check in all remaining students
                                                }}
                                            >
                                                Marcar todos presentes
                                            </Button>
                                        )}
                                    </Stack>
                                </>
                            )}
                        </Card>
                    );
                })}
            </Stack>

            {/* Walk-in Lead Modal */}
            <Modal
                opened={walkInOpened}
                onClose={closeWalkIn}
                title="Registrar Walk-in"
                size="md"
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        Registre um visitante que chegou sem agendamento.
                    </Text>

                    <TextInput label="Nome" placeholder="Nome completo" required />
                    <TextInput label="Telefone" placeholder="(11) 99999-9999" />
                    <TextInput label="Email" placeholder="email@exemplo.com" />

                    <Select
                        label="Interesse"
                        placeholder="O que trouxe a pessoa?"
                        data={[
                            { value: 'english', label: 'Inglês' },
                            { value: 'spanish', label: 'Espanhol' },
                            { value: 'intelligence', label: 'Curso de IA' },
                            { value: 'other', label: 'Outro' },
                        ]}
                    />

                    <Select
                        label="Motivo da visita"
                        placeholder="Selecione"
                        data={[
                            { value: 'info', label: 'Buscar informações' },
                            { value: 'trial', label: 'Agendar trial' },
                            { value: 'enroll', label: 'Fazer matrícula' },
                            { value: 'material', label: 'Buscar material' },
                            { value: 'other', label: 'Outro' },
                        ]}
                    />

                    <Textarea
                        label="Observações"
                        placeholder="Notas adicionais..."
                        rows={2}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeWalkIn}>
                            Cancelar
                        </Button>
                        <Button onClick={closeWalkIn}>
                            Registrar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

