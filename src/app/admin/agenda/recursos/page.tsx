'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Loader, Alert, Select, Paper,
} from '@mantine/core';
import {
    IconAlertCircle, IconBuilding, IconDoor, IconUsers,
    IconDeviceDesktop, IconCalendar,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Room {
    id: string;
    name: string;
    capacity: number;
    roomType: string;
    defaultMeetUrl?: string;
    floor?: string;
    building?: string;
    amenities?: string;
    isActive: number;
}

interface Schedule {
    id: string;
    classId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomId?: string;
}

const TYPE_COLORS: Record<string, string> = {
    classroom: 'blue', lab: 'violet', auditorium: 'orange',
    meeting_room: 'teal', studio: 'grape', outdoor: 'green', virtual: 'cyan',
};
const TYPE_LABELS: Record<string, string> = {
    classroom: 'Sala de Aula', lab: 'Laboratório', auditorium: 'Auditório',
    meeting_room: 'Sala de Reunião', studio: 'Estúdio', outdoor: 'Área Externa', virtual: 'Virtual',
};
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function RecursosPage() {
    const { data: roomsData, isLoading: loadingRooms } = useApi<any>('/api/rooms');
    const { data: schedulesData, isLoading: loadingSched } = useApi<any>('/api/schedules');
    const rooms: Room[] = roomsData?.data || [];
    const schedules: Schedule[] = schedulesData?.data || [];
    const loading = loadingRooms || loadingSched;
    const error: string | null = null;
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const filteredRooms = useMemo(() => {
        if (!typeFilter) return rooms;
        return rooms.filter(r => r.roomType === typeFilter);
    }, [rooms, typeFilter]);

    const stats = useMemo(() => {
        const total = rooms.length;
        const active = rooms.filter(r => r.isActive).length;
        const totalCapacity = rooms.reduce((s, r) => s + (r.capacity || 0), 0);
        const byType = new Map<string, number>();
        rooms.forEach(r => { byType.set(r.roomType, (byType.get(r.roomType) || 0) + 1); });
        const types = Array.from(byType.entries()).map(([type, count]) => ({ type, label: TYPE_LABELS[type] || type, count })).sort((a, b) => b.count - a.count);
        const roomsWithSchedules = new Set(schedules.map(s => s.roomId).filter(Boolean)).size;
        return { total, active, totalCapacity, types, roomsWithSchedules, totalSchedules: schedules.length };
    }, [rooms, schedules]);

    // Build occupancy grid: roomId -> dayOfWeek -> count
    const occupancyMap = useMemo(() => {
        const map = new Map<string, Map<number, number>>();
        schedules.forEach(s => {
            if (!s.roomId) return;
            if (!map.has(s.roomId)) map.set(s.roomId, new Map());
            const dayMap = map.get(s.roomId)!;
            dayMap.set(s.dayOfWeek, (dayMap.get(s.dayOfWeek) || 0) + 1);
        });
        return map;
    }, [schedules]);

    if (loading) {
        return <Container size="xl" py="xl"><Group justify="center" py={60}><Loader size="lg" /><Text>Carregando recursos...</Text></Group></Container>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Agenda</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Recursos</Text></Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Gestão de Recursos</Title>
                        <Select size="sm" placeholder="Tipo de Sala" clearable value={typeFilter} onChange={setTypeFilter} w={200}
                            data={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                    </Group>
                    <Text c="dimmed" mt="xs">Salas, laboratórios e recursos disponíveis para agendamento.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Salas</Text><Text size="xl" fw={700}>{stats.total}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue"><IconDoor size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Capacidade Total</Text><Text size="xl" fw={700}>{stats.totalCapacity}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green"><IconUsers size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Com Agenda</Text><Text size="xl" fw={700}>{stats.roomsWithSchedules}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet"><IconCalendar size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Aulas Agendadas</Text><Text size="xl" fw={700}>{stats.totalSchedules}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange"><IconDeviceDesktop size={24} /></ThemeIcon></Group>
                    </Card>
                </SimpleGrid>

                {/* Type Breakdown */}
                {stats.types.length > 0 && (
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Tipos de Sala</Text>
                        <Group gap="md">
                            {stats.types.map(t => (
                                <Badge key={t.type} size="lg" variant="light" color={TYPE_COLORS[t.type] || 'gray'}>{t.label}: {t.count}</Badge>
                            ))}
                        </Group>
                    </Card>
                )}

                {/* Room Grid with Occupancy */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md"><Text fw={600}>Salas & Ocupação</Text><Badge variant="light">{filteredRooms.length} salas</Badge></Group>
                    {filteredRooms.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md"><IconBuilding size={32} /></ThemeIcon>
                            <Title order={3} mb="xs">Nenhuma sala</Title>
                            <Text c="dimmed">Cadastre salas no sistema para visualizar a grade de ocupação.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead><Table.Tr>
                                <Table.Th>Sala</Table.Th><Table.Th>Tipo</Table.Th><Table.Th ta="center">Capacidade</Table.Th>
                                {DAY_LABELS.slice(1, 7).map(d => <Table.Th key={d} ta="center">{d}</Table.Th>)}
                                <Table.Th ta="center">Status</Table.Th>
                            </Table.Tr></Table.Thead>
                            <Table.Tbody>
                                {filteredRooms.map(room => {
                                    const occ = occupancyMap.get(room.id);
                                    const amenities = (() => { try { return JSON.parse(room.amenities || '[]'); } catch { return []; } })();
                                    return (
                                        <Table.Tr key={room.id} style={{ opacity: room.isActive ? 1 : 0.5 }}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{room.name}</Text>
                                                {room.building && <Text size="xs" c="dimmed">{room.building}{room.floor ? ` — ${room.floor}° andar` : ''}</Text>}
                                            </Table.Td>
                                            <Table.Td><Badge size="sm" variant="light" color={TYPE_COLORS[room.roomType] || 'gray'}>{TYPE_LABELS[room.roomType] || room.roomType}</Badge></Table.Td>
                                            <Table.Td ta="center"><Text size="sm" fw={500}>{room.capacity}</Text></Table.Td>
                                            {[1, 2, 3, 4, 5, 6].map(day => {
                                                const count = occ?.get(day) || 0;
                                                return <Table.Td key={day} ta="center">
                                                    {count > 0 ? <Badge size="sm" variant="filled" color={count >= 4 ? 'red' : count >= 2 ? 'orange' : 'blue'}>{count}</Badge>
                                                        : <Text size="sm" c="dimmed">—</Text>}
                                                </Table.Td>;
                                            })}
                                            <Table.Td ta="center"><Badge size="sm" variant="light" color={room.isActive ? 'green' : 'red'}>{room.isActive ? 'Ativa' : 'Inativa'}</Badge></Table.Td>
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
