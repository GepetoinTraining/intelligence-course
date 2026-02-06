'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Paper,
    Loader, Center, SimpleGrid, ThemeIcon, Table, Progress
} from '@mantine/core';
import {
    IconCalendar, IconClock, IconUsers, IconMapPin,
    IconChartBar, IconAlertTriangle
} from '@tabler/icons-react';

interface ScheduleSummary {
    totalSlots: number;
    roomsUsed: number;
    teachersScheduled: number;
    peakHour: string;
    utilizationRate: number;
}

interface RoomUtilization {
    id: string;
    name: string;
    totalSlots: number;
    occupiedSlots: number;
    utilizationRate: number;
}

interface TimeSlotStats {
    hour: string;
    classes: number;
    rooms: number;
    teachers: number;
}

export default function OwnerSchedulingPage() {
    const [summary, setSummary] = useState<ScheduleSummary | null>(null);
    const [roomStats, setRoomStats] = useState<RoomUtilization[]>([]);
    const [timeStats, setTimeStats] = useState<TimeSlotStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedulingData();
    }, []);

    const fetchSchedulingData = async () => {
        setLoading(true);
        try {
            const [schedulesRes, roomsRes] = await Promise.all([
                fetch('/api/schedules'),
                fetch('/api/rooms'),
            ]);

            const schedulesData = await schedulesRes.json();
            const roomsData = await roomsRes.json();

            if (schedulesData.data) {
                const schedules = schedulesData.data;
                const uniqueRooms = new Set(schedules.map((s: any) => s.roomId).filter(Boolean));
                const uniqueTeachers = new Set(schedules.map((s: any) => s.teacherId).filter(Boolean));

                setSummary({
                    totalSlots: schedules.length,
                    roomsUsed: uniqueRooms.size,
                    teachersScheduled: uniqueTeachers.size,
                    peakHour: '09:00',
                    utilizationRate: 0,
                });

                // Generate time slot stats
                const hours = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
                const stats: TimeSlotStats[] = hours.map(hour => ({
                    hour,
                    classes: schedules.filter((s: any) => s.startTime === hour).length,
                    rooms: 0,
                    teachers: 0,
                }));
                setTimeStats(stats);
            }

            if (roomsData.data) {
                setRoomStats(roomsData.data.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    totalSlots: 40, // 8 hours * 5 days
                    occupiedSlots: 0,
                    utilizationRate: 0,
                })));
            }
        } catch (error) {
            console.error('Failed to fetch scheduling data:', error);
            setSummary({
                totalSlots: 0,
                roomsUsed: 0,
                teachersScheduled: 0,
                peakHour: '-',
                utilizationRate: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Visão de Scheduling</Title>
                    <Text c="dimmed">Utilização de recursos e horários</Text>
                </div>
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : (
                <Stack>
                    {/* Summary Cards */}
                    <SimpleGrid cols={4}>
                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Aulas/Semana</Text>
                                    <Text size="xl" fw={700}>{summary?.totalSlots || 0}</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                                    <IconCalendar size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Salas em Uso</Text>
                                    <Text size="xl" fw={700}>
                                        {summary?.roomsUsed || 0}/{roomStats.length}
                                    </Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="green" radius="xl">
                                    <IconMapPin size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Professores Ativos</Text>
                                    <Text size="xl" fw={700}>{summary?.teachersScheduled || 0}</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="violet" radius="xl">
                                    <IconUsers size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Horário de Pico</Text>
                                    <Text size="xl" fw={700}>{summary?.peakHour || '-'}</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="orange" radius="xl">
                                    <IconClock size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    </SimpleGrid>

                    {/* Room Utilization */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Utilização de Salas</Title>
                        {roomStats.length === 0 ? (
                            <Paper withBorder p="xl" ta="center">
                                <Text c="dimmed">Nenhuma sala cadastrada</Text>
                            </Paper>
                        ) : (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Sala</Table.Th>
                                        <Table.Th>Slots Ocupados</Table.Th>
                                        <Table.Th>Utilização</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {roomStats.map((room) => (
                                        <Table.Tr key={room.id}>
                                            <Table.Td fw={500}>{room.name}</Table.Td>
                                            <Table.Td>
                                                {room.occupiedSlots} / {room.totalSlots}
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Progress
                                                        value={room.utilizationRate}
                                                        size="lg"
                                                        w={100}
                                                        color={room.utilizationRate > 80 ? 'green' : room.utilizationRate > 50 ? 'yellow' : 'red'}
                                                    />
                                                    <Text size="sm">{room.utilizationRate}%</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={room.utilizationRate > 80 ? 'green' : room.utilizationRate > 50 ? 'yellow' : 'gray'}
                                                    variant="light"
                                                >
                                                    {room.utilizationRate > 80 ? 'Alta' : room.utilizationRate > 50 ? 'Média' : 'Baixa'}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        )}
                    </Card>

                    {/* Time Distribution */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Distribuição por Horário</Title>
                        {timeStats.length === 0 ? (
                            <Paper withBorder p="xl" ta="center">
                                <Text c="dimmed">Sem dados de horário</Text>
                            </Paper>
                        ) : (
                            <SimpleGrid cols={5}>
                                {timeStats.map((slot) => (
                                    <Paper key={slot.hour} withBorder p="md" ta="center">
                                        <Text size="sm" c="dimmed">{slot.hour}</Text>
                                        <Text size="xl" fw={700}>{slot.classes}</Text>
                                        <Text size="xs" c="dimmed">aulas</Text>
                                    </Paper>
                                ))}
                            </SimpleGrid>
                        )}
                    </Card>

                    {/* Alerts */}
                    <Card withBorder p="lg">
                        <Group gap="sm" mb="md">
                            <ThemeIcon variant="light" color="yellow">
                                <IconAlertTriangle size={16} />
                            </ThemeIcon>
                            <Title order={4}>Alertas de Scheduling</Title>
                        </Group>
                        <Paper withBorder p="xl" ta="center" bg="gray.0">
                            <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                <IconChartBar size={30} />
                            </ThemeIcon>
                            <Text c="dimmed">
                                Alertas de conflitos e otimização serão exibidos aqui
                            </Text>
                        </Paper>
                    </Card>
                </Stack>
            )}
        </Container>
    );
}

