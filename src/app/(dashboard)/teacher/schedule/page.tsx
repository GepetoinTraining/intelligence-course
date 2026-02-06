'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Paper,
    Loader, Center, SimpleGrid, ThemeIcon, SegmentedControl,
    Table, ActionIcon, Tooltip
} from '@mantine/core';
import {
    IconCalendar, IconClock, IconUsers, IconMapPin, IconEye
} from '@tabler/icons-react';
import Link from 'next/link';

interface ScheduleItem {
    id: string;
    classId: string;
    className: string;
    roomId: string | null;
    roomName: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    studentCount: number;
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const dayNamesFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function TeacherSchedulePage() {
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'week' | 'list'>('week');

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/schedules');
            const data = await res.json();
            if (data.data) {
                // Map schedules with class info
                setSchedules(data.data.map((s: any) => ({
                    ...s,
                    className: s.className || `Turma ${s.classId?.slice(-4) || 'N/A'}`,
                    roomName: s.roomName || 'Sala não definida',
                    studentCount: s.studentCount || 0,
                })));
            }
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSchedulesForDay = (day: number) => {
        return schedules
            .filter(s => s.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const todayIndex = new Date().getDay();

    // Calculate stats
    const totalClasses = schedules.length;
    const totalHours = schedules.reduce((acc, s) => {
        const start = s.startTime.split(':').map(Number);
        const end = s.endTime.split(':').map(Number);
        const hours = (end[0] * 60 + end[1] - start[0] * 60 - start[1]) / 60;
        return acc + hours;
    }, 0);

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Minha Agenda</Title>
                    <Text c="dimmed">Suas aulas da semana</Text>
                </div>
                <SegmentedControl
                    value={view}
                    onChange={(v) => setView(v as typeof view)}
                    data={[
                        { label: 'Semana', value: 'week' },
                        { label: 'Lista', value: 'list' },
                    ]}
                />
            </Group>

            {/* Stats */}
            <SimpleGrid cols={3} mb="lg">
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconCalendar size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{totalClasses}</Text>
                            <Text size="xs" c="dimmed">Aulas/semana</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconClock size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{totalHours.toFixed(1)}h</Text>
                            <Text size="xs" c="dimmed">Horas/semana</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="violet">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>
                                {schedules.reduce((acc, s) => acc + s.studentCount, 0)}
                            </Text>
                            <Text size="xs" c="dimmed">Total alunos</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : schedules.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconCalendar size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhuma aula agendada</Title>
                    <Text c="dimmed">
                        Entre em contato com a administração para configurar sua agenda.
                    </Text>
                </Card>
            ) : view === 'week' ? (
                <SimpleGrid cols={7} spacing="xs">
                    {dayNames.map((day, index) => {
                        const daySchedules = getSchedulesForDay(index);
                        const isToday = index === todayIndex;
                        return (
                            <Paper
                                key={day}
                                withBorder
                                p="xs"
                                style={{
                                    minHeight: 200,
                                    borderColor: isToday ? 'var(--mantine-color-blue-5)' : undefined,
                                    borderWidth: isToday ? 2 : 1,
                                }}
                            >
                                <Text
                                    ta="center"
                                    fw={700}
                                    size="sm"
                                    c={isToday ? 'blue' : undefined}
                                    mb="xs"
                                >
                                    {day}
                                    {isToday && <Badge size="xs" ml={4}>Hoje</Badge>}
                                </Text>
                                <Stack gap={4}>
                                    {daySchedules.map((schedule) => (
                                        <Card
                                            key={schedule.id}
                                            p="xs"
                                            bg="blue.0"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Text size="xs" fw={600} lineClamp={1}>
                                                {schedule.className}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {schedule.startTime} - {schedule.endTime}
                                            </Text>
                                            <Group gap={4} mt={2}>
                                                <IconMapPin size={10} />
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                    {schedule.roomName}
                                                </Text>
                                            </Group>
                                        </Card>
                                    ))}
                                    {daySchedules.length === 0 && (
                                        <Text size="xs" c="dimmed" ta="center" py="md">
                                            Sem aulas
                                        </Text>
                                    )}
                                </Stack>
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Card withBorder>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Dia</Table.Th>
                                <Table.Th>Horário</Table.Th>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Sala</Table.Th>
                                <Table.Th>Alunos</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {schedules
                                .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
                                .map((schedule) => (
                                    <Table.Tr key={schedule.id}>
                                        <Table.Td>
                                            <Badge
                                                color={schedule.dayOfWeek === todayIndex ? 'blue' : 'gray'}
                                                variant="light"
                                            >
                                                {dayNamesFull[schedule.dayOfWeek]}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {schedule.startTime} - {schedule.endTime}
                                        </Table.Td>
                                        <Table.Td fw={500}>{schedule.className}</Table.Td>
                                        <Table.Td>{schedule.roomName}</Table.Td>
                                        <Table.Td>{schedule.studentCount}</Table.Td>
                                        <Table.Td>
                                            <Tooltip label="Ver turma">
                                                <ActionIcon
                                                    variant="subtle"
                                                    component={Link}
                                                    href={`/teacher/classes/${schedule.classId}`}
                                                >
                                                    <IconEye size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}
        </Container>
    );
}

