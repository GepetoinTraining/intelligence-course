'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Paper, Progress,
} from '@mantine/core';
import {
    IconSchool, IconAlertCircle, IconCalendar, IconClock,
    IconBooks, IconUsers,
} from '@tabler/icons-react';

interface ScheduleEntry {
    id: string;
    classId: string;
    roomId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    validFrom?: number;
    validUntil?: number;
}

interface ClassInfo {
    id: string;
    name: string;
    courseId?: string;
    maxStudents?: number;
    status?: string;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AgendaLetivoPage() {
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [schedRes, classesRes] = await Promise.all([
                fetch('/api/schedules?limit=500'),
                fetch('/api/classes?limit=200'),
            ]);

            if (schedRes.ok) {
                const sData = await schedRes.json();
                setSchedules(sData.data || []);
            }
            if (classesRes.ok) {
                const cData = await classesRes.json();
                setClasses(cData.data || []);
            }
        } catch (err) {
            setError('Falha ao carregar calendário letivo');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const classMap = useMemo(() => {
        const map = new Map<string, ClassInfo>();
        classes.forEach(c => map.set(c.id, c));
        return map;
    }, [classes]);

    const stats = useMemo(() => {
        const byDay = new Map<number, number>();
        for (let i = 0; i < 7; i++) byDay.set(i, 0);
        schedules.forEach(s => byDay.set(s.dayOfWeek, (byDay.get(s.dayOfWeek) || 0) + 1));
        const dayDistribution = Array.from(byDay.entries())
            .map(([day, count]) => ({ day, name: DAY_SHORT[day], count }))
            .filter(d => d.count > 0)
            .sort((a, b) => a.day - b.day);

        const uniqueClasses = new Set(schedules.map(s => s.classId));
        const uniqueRooms = new Set(schedules.filter(s => s.roomId).map(s => s.roomId!));

        // Time slots
        const timeSlots = new Map<string, number>();
        schedules.forEach(s => {
            const slot = `${s.startTime}-${s.endTime}`;
            timeSlots.set(slot, (timeSlots.get(slot) || 0) + 1);
        });
        const popularSlots = Array.from(timeSlots.entries())
            .map(([slot, count]) => ({ slot, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const maxDay = Math.max(...dayDistribution.map(d => d.count), 1);

        return {
            totalSchedules: schedules.length,
            uniqueClasses: uniqueClasses.size,
            uniqueRooms: uniqueRooms.size,
            dayDistribution,
            popularSlots,
            maxDay,
        };
    }, [schedules]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando calendário letivo...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Agenda</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Calendário Letivo</Text>
                    </Group>
                    <Title order={1}>Calendário Letivo</Title>
                    <Text c="dimmed" mt="xs">Grade de horários, turmas e períodos acadêmicos.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Horários</Text>
                                <Text size="xl" fw={700}>{stats.totalSchedules}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconCalendar size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Turmas Ativas</Text>
                                <Text size="xl" fw={700}>{stats.uniqueClasses}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconBooks size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Salas em Uso</Text>
                                <Text size="xl" fw={700}>{stats.uniqueRooms}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconSchool size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Dias Letivos</Text>
                                <Text size="xl" fw={700}>{stats.dayDistribution.length}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconClock size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {/* Day Distribution */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Distribuição por Dia da Semana</Text>
                        <Stack gap="sm">
                            {stats.dayDistribution.map(d => (
                                <div key={d.day}>
                                    <Group justify="space-between" mb={4}>
                                        <Text size="sm">{DAY_NAMES[d.day]}</Text>
                                        <Text size="sm" fw={600}>{d.count} aulas</Text>
                                    </Group>
                                    <Progress
                                        value={(d.count / stats.maxDay) * 100}
                                        color="blue"
                                        size="lg"
                                        radius="md"
                                    />
                                </div>
                            ))}
                        </Stack>
                    </Card>

                    {/* Popular Time Slots */}
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Horários Mais Frequentes</Text>
                        {stats.popularSlots.length === 0 ? (
                            <Text c="dimmed" ta="center" py="lg">Nenhum horário cadastrado.</Text>
                        ) : (
                            <Stack gap="sm">
                                {stats.popularSlots.map((s, idx) => (
                                    <Paper key={s.slot} withBorder p="md" radius="md">
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                <Badge size="sm" variant="filled" color="blue" circle>{idx + 1}</Badge>
                                                <Group gap={4}>
                                                    <IconClock size={16} color="gray" />
                                                    <Text size="sm" fw={500}>{s.slot}</Text>
                                                </Group>
                                            </Group>
                                            <Badge variant="light">{s.count} turmas</Badge>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Card>
                </SimpleGrid>

                {/* Full Schedule Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Grade de Horários Completa</Text>
                        <Badge variant="light">{schedules.length} registros</Badge>
                    </Group>
                    {schedules.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconCalendar size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhum horário</Title>
                            <Text c="dimmed">A grade de horários letivos ainda não foi configurada.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Dia</Table.Th>
                                    <Table.Th>Horário</Table.Th>
                                    <Table.Th>Turma</Table.Th>
                                    <Table.Th>Sala</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {schedules
                                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
                                    .slice(0, 50)
                                    .map(s => {
                                        const cls = classMap.get(s.classId);
                                        return (
                                            <Table.Tr key={s.id}>
                                                <Table.Td>
                                                    <Badge size="sm" variant="light">{DAY_SHORT[s.dayOfWeek]}</Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm">{s.startTime} – {s.endTime}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>{cls?.name || s.classId.slice(0, 8) + '...'}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">{s.roomId?.slice(0, 8) || '—'}</Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
