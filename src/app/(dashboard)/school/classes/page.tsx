'use client';

import { useState, useEffect, useCallback } from 'react';
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
import type { SelectOption } from '@/types/domain';

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
// COMPONENT
// ============================================================================

export default function ClassManagementPage() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [courseTypes, setCourseTypes] = useState<SelectOption[]>([]);
    const [levels, setLevels] = useState<SelectOption[]>([]);
    const [teachers, setTeachers] = useState<SelectOption[]>([]);
    const [rooms, setRooms] = useState<SelectOption[]>([]);
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

    const fetchClasses = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/classes');
            if (!res.ok) return;
            const json = await res.json();
            const rows = json.data || [];
            setClasses(rows.map((r: any) => ({
                id: r.id,
                name: r.name || 'Sem nome',
                courseType: r.courseTypeId || '',
                level: r.levelId || '',
                teacherId: r.teacherId || '',
                teacherName: '',
                roomId: r.roomId || '',
                roomName: '',
                schedule: '',
                capacity: r.maxStudents || 15,
                enrolled: r.currentStudents || 0,
                status: r.status === 'cancelled' ? 'cancelled' : (r.currentStudents >= r.maxStudents ? 'full' : 'active') as ClassItem['status'],
            })));
        } catch (err) {
            console.error('Failed to fetch classes', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load dropdown options
    useEffect(() => {
        fetchClasses();
        // Load courses
        fetch('/api/courses').then(r => r.json()).then(j => {
            setCourseTypes((j.data || []).map((r: any) => ({ value: r.id, label: r.name || r.id })));
        }).catch(() => { });
        // Load rooms
        fetch('/api/rooms').then(r => r.json()).then(j => {
            setRooms((j.data || []).map((r: any) => ({ value: r.id, label: r.name || r.id })));
        }).catch(() => { });
        // Load levels
        fetch('/api/levels').then(r => r.json()).then(j => {
            setLevels((j.data || []).map((r: any) => ({ value: r.id, label: r.name || r.id })));
        }).catch(() => { });
        // Load teachers
        fetch('/api/users?role=teacher').then(r => r.json()).then(j => {
            setTeachers((j.data || []).map((r: any) => ({ value: r.id, label: r.name || r.email || r.id })));
        }).catch(() => { });
    }, [fetchClasses]);

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

    const handleSave = async () => {
        if (isCreating) {
            try {
                await fetch('/api/classes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        courseTypeId: courseType,
                        levelId: level,
                        teacherId,
                        maxStudents: capacity,
                        status: 'active',
                    }),
                });
                fetchClasses();
            } catch (err) {
                console.error('Failed to create class', err);
            }
        } else if (selectedClass) {
            try {
                await fetch(`/api/classes/${selectedClass.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        courseTypeId: courseType,
                        levelId: level,
                        teacherId,
                        maxStudents: capacity,
                    }),
                });
                fetchClasses();
            } catch (err) {
                console.error('Failed to update class', err);
            }
        }
        closeModal();
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/classes/${id}`, { method: 'DELETE' });
            fetchClasses();
        } catch (err) {
            console.error('Failed to delete class', err);
        }
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
                    {courseTypes.map(ct => (
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
                            const courseLabel = courseTypes.find(c => c.value === classItem.courseType)?.label;
                            const levelLabel = levels.find(l => l.value === classItem.level)?.label;

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
                                data={courseTypes}
                                value={courseType}
                                onChange={setCourseType}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Nível"
                                placeholder="Selecione..."
                                data={levels}
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
                                data={teachers}
                                value={teacherId}
                                onChange={setTeacherId}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Sala"
                                placeholder="Selecione..."
                                data={rooms}
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

