'use client';

import { useState } from 'react';
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

// Mock data for today's sessions
const todaySessions = [
    {
        id: '1',
        className: 'English A1 - Turma 1',
        teacherName: 'Prof. Ana',
        roomName: 'Sala 1',
        time: '10:00 - 11:30',
        status: 'in_progress',
        students: [
            { id: 's1', name: 'Lucas Silva', checkedIn: true, checkedInAt: '09:55' },
            { id: 's2', name: 'Maria Santos', checkedIn: true, checkedInAt: '09:58' },
            { id: 's3', name: 'Pedro Costa', checkedIn: false, checkedInAt: null },
            { id: 's4', name: 'Ana Oliveira', checkedIn: true, checkedInAt: '10:05' },
        ],
    },
    {
        id: '2',
        className: 'Spanish A1 - Turma 1',
        teacherName: 'Prof. Carlos',
        roomName: 'Sala 2',
        time: '10:00 - 11:30',
        status: 'in_progress',
        students: [
            { id: 's5', name: 'Fernanda Rocha', checkedIn: true, checkedInAt: '09:50' },
            { id: 's6', name: 'Rafael Lima', checkedIn: true, checkedInAt: '09:52' },
        ],
    },
    {
        id: '3',
        className: 'Intelligence',
        teacherName: 'Prof. Roberto',
        roomName: 'Lab',
        time: '14:00 - 15:30',
        status: 'scheduled',
        students: [
            { id: 's7', name: 'Carla Mendes', checkedIn: false, checkedInAt: null },
            { id: 's8', name: 'João Almeida', checkedIn: false, checkedInAt: null },
            { id: 's9', name: 'Patricia Lima', checkedIn: false, checkedInAt: null },
        ],
    },
    {
        id: '4',
        className: 'English B1 - Turma 2',
        teacherName: 'Prof. Ana',
        roomName: 'Sala 1',
        time: '16:00 - 17:30',
        status: 'scheduled',
        students: [
            { id: 's10', name: 'Bruno Costa', checkedIn: false, checkedInAt: null },
            { id: 's11', name: 'Camila Santos', checkedIn: false, checkedInAt: null },
        ],
    },
];

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

    // Search results
    const searchResults = search.length >= 2
        ? todaySessions.flatMap(session =>
            session.students
                .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
                .map(s => ({ ...s, session }))
        )
        : [];

    const handleQuickCheckin = (studentId: string, sessionId: string) => {
        console.log('Quick check-in:', { studentId, sessionId });
        // TODO: API call
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

