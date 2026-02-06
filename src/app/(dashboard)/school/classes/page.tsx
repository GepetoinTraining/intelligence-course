'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Table, Modal, TextInput, Select,
    NumberInput, Grid, Progress, Tabs, Avatar
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconUsers,
    IconClock, IconUser, IconBook, IconDoor, IconCalendar
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface ClassItem {
    id: string;
    name: string;
    courseType: string;
    level: string;
    teacherId: string;
    teacherName: string;
    roomId: string;
    roomName: string;
    schedule: string;
    capacity: number;
    enrolled: number;
    status: 'active' | 'full' | 'cancelled';
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_COURSE_TYPES = [
    { value: 'ai_literacy', label: 'Alfabetização em IA' },
    { value: 'kids', label: 'Kids' },
    { value: 'teens', label: 'Teens' },
    { value: 'adults', label: 'Adultos' },
];

const MOCK_LEVELS = [
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' },
];

const MOCK_TEACHERS = [
    { value: 't1', label: 'Prof. Maria Silva' },
    { value: 't2', label: 'Prof. João Santos' },
    { value: 't3', label: 'Prof. Ana Costa' },
];

const MOCK_ROOMS = [
    { value: 'r1', label: 'Sala A1' },
    { value: 'r2', label: 'Lab de Informática' },
    { value: 'r3', label: 'Sala de Reuniões' },
];

const MOCK_CLASSES: ClassItem[] = [
    { id: '1', name: 'Turma A - Manhã', courseType: 'ai_literacy', level: 'beginner', teacherId: 't1', teacherName: 'Prof. Maria Silva', roomId: 'r1', roomName: 'Sala A1', schedule: 'Seg/Qua 09:00-10:30', capacity: 15, enrolled: 12, status: 'active' },
    { id: '2', name: 'Turma B - Tarde', courseType: 'ai_literacy', level: 'beginner', teacherId: 't2', teacherName: 'Prof. João Santos', roomId: 'r1', roomName: 'Sala A1', schedule: 'Ter/Qui 14:00-15:30', capacity: 15, enrolled: 15, status: 'full' },
    { id: '3', name: 'Turma C - Noite', courseType: 'ai_literacy', level: 'intermediate', teacherId: 't1', teacherName: 'Prof. Maria Silva', roomId: 'r2', roomName: 'Lab de Informática', schedule: 'Seg/Qua 19:00-20:30', capacity: 12, enrolled: 8, status: 'active' },
    { id: '4', name: 'Kids Sábado', courseType: 'kids', level: 'beginner', teacherId: 't3', teacherName: 'Prof. Ana Costa', roomId: 'r1', roomName: 'Sala A1', schedule: 'Sáb 10:00-11:30', capacity: 10, enrolled: 6, status: 'active' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ClassManagementPage() {
    const [classes, setClasses] = useState<ClassItem[]>(MOCK_CLASSES);
    const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);

    // Form state
    const [name, setName] = useState('');
    const [courseType, setCourseType] = useState<string | null>(null);
    const [level, setLevel] = useState<string | null>(null);
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [schedule, setSchedule] = useState('');
    const [capacity, setCapacity] = useState<number>(15);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedClass(null);
        setName('');
        setCourseType(null);
        setLevel(null);
        setTeacherId(null);
        setRoomId(null);
        setSchedule('');
        setCapacity(15);
        openModal();
    };

    const handleEdit = (classItem: ClassItem) => {
        setIsCreating(false);
        setSelectedClass(classItem);
        setName(classItem.name);
        setCourseType(classItem.courseType);
        setLevel(classItem.level);
        setTeacherId(classItem.teacherId);
        setRoomId(classItem.roomId);
        setSchedule(classItem.schedule);
        setCapacity(classItem.capacity);
        openModal();
    };

    const handleSave = () => {
        const teacherName = MOCK_TEACHERS.find(t => t.value === teacherId)?.label || '';
        const roomName = MOCK_ROOMS.find(r => r.value === roomId)?.label || '';

        if (isCreating && courseType && level && teacherId && roomId) {
            const newClass: ClassItem = {
                id: `class-${Date.now()}`,
                name,
                courseType,
                level,
                teacherId,
                teacherName,
                roomId,
                roomName,
                schedule,
                capacity,
                enrolled: 0,
                status: 'active',
            };
            setClasses(prev => [...prev, newClass]);
        } else if (selectedClass && courseType && level && teacherId && roomId) {
            setClasses(prev => prev.map(c =>
                c.id === selectedClass.id
                    ? { ...c, name, courseType, level, teacherId, teacherName, roomId, roomName, schedule, capacity }
                    : c
            ));
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        setClasses(prev => prev.filter(c => c.id !== id));
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
            active: { color: 'green', label: 'Ativa' },
            full: { color: 'orange', label: 'Lotada' },
            cancelled: { color: 'red', label: 'Cancelada' },
        };
        return map[status] || map.active;
    };

    const filteredClasses = activeTab === 'all'
        ? classes
        : classes.filter(c => c.courseType === activeTab);

    const totalStudents = classes.reduce((acc, c) => acc + c.enrolled, 0);
    const totalCapacity = classes.reduce((acc, c) => acc + c.capacity, 0);

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group>
                    <Link href="/school" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Gestão de Turmas 👥</Title>
                        <Text c="dimmed">Gerencie turmas, professores e horários</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
                    Nova Turma
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{classes.length}</Text>
                            <Text size="sm" c="dimmed">Total Turmas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">{classes.filter(c => c.status === 'active').length}</Text>
                            <Text size="sm" c="dimmed">Ativas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{totalStudents}</Text>
                            <Text size="sm" c="dimmed">Alunos</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconUser size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{Math.round((totalStudents / totalCapacity) * 100)}%</Text>
                            <Text size="sm" c="dimmed">Ocupação</Text>
                        </div>
                        <Progress
                            value={(totalStudents / totalCapacity) * 100}
                            size="xl"
                            radius="xl"
                            w={60}
                            color={(totalStudents / totalCapacity) > 0.9 ? 'orange' : 'green'}
                        />
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs by Course Type */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todas</Tabs.Tab>
                    {MOCK_COURSE_TYPES.map(ct => (
                        <Tabs.Tab key={ct.value} value={ct.value}>
                            {ct.label}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
            </Tabs>

            {/* Class Table */}
            <Card shadow="sm" radius="md" p="lg" withBorder>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Turma</Table.Th>
                            <Table.Th>Curso / Nível</Table.Th>
                            <Table.Th>Professor</Table.Th>
                            <Table.Th>Sala</Table.Th>
                            <Table.Th>Horário</Table.Th>
                            <Table.Th ta="center">Alunos</Table.Th>
                            <Table.Th ta="center">Status</Table.Th>
                            <Table.Th ta="center">Ações</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredClasses.map(classItem => {
                            const statusInfo = getStatusInfo(classItem.status);
                            const courseLabel = MOCK_COURSE_TYPES.find(c => c.value === classItem.courseType)?.label;
                            const levelLabel = MOCK_LEVELS.find(l => l.value === classItem.level)?.label;

                            return (
                                <Table.Tr key={classItem.id}>
                                    <Table.Td>
                                        <Text fw={500}>{classItem.name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            <Text size="sm">{courseLabel}</Text>
                                            <Badge size="xs" variant="light">{levelLabel}</Badge>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Avatar size="sm" radius="xl" color="blue">
                                                {classItem.teacherName.charAt(0)}
                                            </Avatar>
                                            <Text size="sm">{classItem.teacherName}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <IconDoor size={14} />
                                            <Text size="sm">{classItem.roomName}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <IconClock size={14} />
                                            <Text size="sm">{classItem.schedule}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Badge
                                            variant="light"
                                            color={classItem.enrolled >= classItem.capacity ? 'orange' : 'blue'}
                                        >
                                            {classItem.enrolled}/{classItem.capacity}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Badge color={statusInfo.color} variant="light">
                                            {statusInfo.label}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Group gap={4} justify="center">
                                            <ActionIcon
                                                variant="subtle"
                                                color="blue"
                                                onClick={() => handleEdit(classItem)}
                                            >
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                onClick={() => handleDelete(classItem.id)}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Class Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title={isCreating ? 'Nova Turma' : 'Editar Turma'}
                centered
                size="lg"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome da Turma"
                        placeholder="Ex: Turma A - Manhã"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Grid>
                        <Grid.Col span={6}>
                            <Select
                                label="Tipo de Curso"
                                placeholder="Selecione..."
                                data={MOCK_COURSE_TYPES}
                                value={courseType}
                                onChange={setCourseType}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Nível"
                                placeholder="Selecione..."
                                data={MOCK_LEVELS}
                                value={level}
                                onChange={setLevel}
                                required
                            />
                        </Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}>
                            <Select
                                label="Professor"
                                placeholder="Selecione..."
                                data={MOCK_TEACHERS}
                                value={teacherId}
                                onChange={setTeacherId}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Sala"
                                placeholder="Selecione..."
                                data={MOCK_ROOMS}
                                value={roomId}
                                onChange={setRoomId}
                                required
                            />
                        </Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={8}>
                            <TextInput
                                label="Horário"
                                placeholder="Ex: Seg/Qua 09:00-10:30"
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <NumberInput
                                label="Capacidade"
                                value={capacity}
                                onChange={(v) => setCapacity(Number(v) || 15)}
                                min={1}
                                max={50}
                            />
                        </Grid.Col>
                    </Grid>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleSave}>
                            {isCreating ? 'Criar' : 'Salvar'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

