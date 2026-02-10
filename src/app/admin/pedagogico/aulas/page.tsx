'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Tabs,
    Select,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconChalkboard,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconCalendar,
    IconClock,
    IconUsers,
    IconCheck,
    IconX,
    IconPlayerPlay,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Lesson {
    id: string;
    classId: string;
    className: string;
    date: string;
    startTime: string;
    endTime: string;
    topic: string;
    teacherName: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    studentsPresent?: number;
    studentsTotal?: number;
}

// Mock data for lessons
const mockLessons: Lesson[] = [
    { id: '1', classId: 'c1', className: 'Turma A - Básico', date: '2026-02-05', startTime: '08:00', endTime: '09:30', topic: 'Present Simple', teacherName: 'Prof. Maria', status: 'completed', studentsPresent: 12, studentsTotal: 15 },
    { id: '2', classId: 'c1', className: 'Turma A - Básico', date: '2026-02-05', startTime: '10:00', endTime: '11:30', topic: 'Vocabulary: Daily Routine', teacherName: 'Prof. Maria', status: 'in_progress', studentsPresent: 14, studentsTotal: 15 },
    { id: '3', classId: 'c2', className: 'Turma B - Intermediário', date: '2026-02-05', startTime: '14:00', endTime: '15:30', topic: 'Past Perfect', teacherName: 'Prof. João', status: 'scheduled' },
    { id: '4', classId: 'c3', className: 'Business English', date: '2026-02-05', startTime: '18:00', endTime: '19:30', topic: 'Email Writing', teacherName: 'Prof. Ana', status: 'scheduled' },
    { id: '5', classId: 'c2', className: 'Turma B - Intermediário', date: '2026-02-06', startTime: '14:00', endTime: '15:30', topic: 'Conditionals', teacherName: 'Prof. João', status: 'scheduled' },
];

const statusColors: Record<string, string> = {
    scheduled: 'blue',
    in_progress: 'green',
    completed: 'gray',
    cancelled: 'red',
};

const statusLabels: Record<string, string> = {
    scheduled: 'Agendada',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit'
    });
}

export default function AulasPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/lessons');

    const [lessons] = useState<Lesson[]>(mockLessons);
    const [activeTab, setActiveTab] = useState<string | null>('today');

    const today = '2026-02-05';
    const todayLessons = lessons.filter(l => l.date === today);
    const upcomingLessons = lessons.filter(l => l.date > today);
    const completedLessons = lessons.filter(l => l.status === 'completed');
    const inProgress = lessons.filter(l => l.status === 'in_progress');

    const filteredLessons = activeTab === 'today'
        ? todayLessons
        : activeTab === 'upcoming'
            ? upcomingLessons
            : lessons;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Pedagógico</Text>
                    <Title order={2}>Aulas</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Todas as turmas"
                        data={[
                            { value: 'all', label: 'Todas as Turmas' },
                            { value: 'c1', label: 'Turma A - Básico' },
                            { value: 'c2', label: 'Turma B - Intermediário' },
                            { value: 'c3', label: 'Business English' },
                        ]}
                        w={180}
                        clearable
                    />
                    <Button leftSection={<IconPlus size={16} />}>
                        Agendar Aula
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Aulas Hoje</Text>
                            <Text fw={700} size="xl">{todayLessons.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconPlayerPlay size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Andamento</Text>
                            <Text fw={700} size="xl">{inProgress.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídas</Text>
                            <Text fw={700} size="xl">{completedLessons.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Próximas</Text>
                            <Text fw={700} size="xl">{upcomingLessons.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="today">Hoje ({todayLessons.length})</Tabs.Tab>
                        <Tabs.Tab value="upcoming">Próximas ({upcomingLessons.length})</Tabs.Tab>
                        <Tabs.Tab value="all">Todas ({lessons.length})</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Data</Table.Th>
                            <Table.Th>Horário</Table.Th>
                            <Table.Th>Turma</Table.Th>
                            <Table.Th>Tópico</Table.Th>
                            <Table.Th>Professor</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Presença</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredLessons.map((lesson) => (
                            <Table.Tr key={lesson.id}>
                                <Table.Td>
                                    <Text size="sm">{formatDate(lesson.date)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        <IconClock size={14} />
                                        <Text size="sm">{lesson.startTime} - {lesson.endTime}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={500}>{lesson.className}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{lesson.topic}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{lesson.teacherName}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[lesson.status]} variant="light">
                                        {statusLabels[lesson.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    {lesson.studentsPresent !== undefined ? (
                                        <Badge variant="outline">
                                            {lesson.studentsPresent}/{lesson.studentsTotal}
                                        </Badge>
                                    ) : (
                                        <Text size="sm" c="dimmed">-</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" size="sm">
                                                <IconDotsVertical size={14} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                            <Menu.Item leftSection={<IconUsers size={14} />}>Fazer Chamada</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                            {lesson.status === 'scheduled' && (
                                                <Menu.Item leftSection={<IconX size={14} />} color="red">Cancelar</Menu.Item>
                                            )}
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

