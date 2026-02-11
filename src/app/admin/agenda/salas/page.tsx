'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Button, Table, Loader, Alert, Center, Modal, TextInput, Select,
    NumberInput, Progress,
} from '@mantine/core';
import {
    IconDoor, IconPlus, IconAlertCircle, IconCheck, IconUsers,
    IconCalendar,
} from '@tabler/icons-react';
import { useApi, useCreate } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Room {
    id: string;
    name: string;
    capacity: number;
    roomType: string;
    defaultMeetUrl: string | null;
    floor: string | null;
    building: string | null;
    amenities: string;
    isActive: number;
    createdAt: number;
}

interface Schedule {
    id: string;
    classId: string;
    roomId: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const typeLabels: Record<string, string> = {
    classroom: 'Sala de Aula',
    lab: 'Laboratório',
    auditorium: 'Auditório',
    online: 'Online',
    external: 'Externo',
};

const typeColors: Record<string, string> = {
    classroom: 'blue',
    lab: 'violet',
    auditorium: 'orange',
    online: 'cyan',
    external: 'gray',
};

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function parseAmenities(amenities: string): string[] {
    try { return JSON.parse(amenities); } catch { return []; }
}

/** Check if two time ranges overlap */
function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
    return a1 < b2 && b1 < a2;
}

// ============================================================================
// PAGE
// ============================================================================

export default function SalasPage() {
    const { data: rooms, isLoading: loadingRooms, error: roomError, refetch: refetchRooms } = useApi<Room[]>('/api/rooms');
    const { data: schedules } = useApi<Schedule[]>('/api/schedules');
    const { create, isLoading: creating } = useCreate('/api/rooms');

    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('classroom');
    const [newCapacity, setNewCapacity] = useState<number>(15);
    const [newFloor, setNewFloor] = useState('');
    const [newBuilding, setNewBuilding] = useState('');

    const allRooms = rooms || [];
    const allSchedules = schedules || [];
    const activeRooms = allRooms.filter(r => r.isActive);
    const today = new Date().getDay();
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Build room → schedule map for conflict detection
    const roomScheduleMap = new Map<string, Schedule[]>();
    allSchedules.forEach(s => {
        if (s.roomId) {
            const existing = roomScheduleMap.get(s.roomId) || [];
            existing.push(s);
            roomScheduleMap.set(s.roomId, existing);
        }
    });

    // Detect conflicts (same room, same day, overlapping times)
    let conflictCount = 0;
    roomScheduleMap.forEach((roomSchedules) => {
        const byDay = new Map<number, Schedule[]>();
        roomSchedules.forEach(s => {
            const day = byDay.get(s.dayOfWeek) || [];
            day.push(s);
            byDay.set(s.dayOfWeek, day);
        });
        byDay.forEach((daySchedules) => {
            for (let i = 0; i < daySchedules.length; i++) {
                for (let j = i + 1; j < daySchedules.length; j++) {
                    if (timesOverlap(
                        daySchedules[i].startTime, daySchedules[i].endTime,
                        daySchedules[j].startTime, daySchedules[j].endTime
                    )) {
                        conflictCount++;
                    }
                }
            }
        });
    });

    // Room occupancy today
    const roomsOccupiedNow = activeRooms.filter(room => {
        const schedsTodayForRoom = (roomScheduleMap.get(room.id) || [])
            .filter(s => s.dayOfWeek === today);
        return schedsTodayForRoom.some(s => s.startTime <= currentTime && s.endTime > currentTime);
    }).length;

    const totalCapacity = activeRooms.reduce((s, r) => s + (r.capacity || 0), 0);

    const handleCreate = async () => {
        try {
            await create({
                name: newName,
                roomType: newType,
                capacity: newCapacity,
                floor: newFloor || undefined,
                building: newBuilding || undefined,
            });
            setCreateOpen(false);
            setNewName('');
            setNewType('classroom');
            setNewCapacity(15);
            setNewFloor('');
            setNewBuilding('');
            refetchRooms();
        } catch { /* hook handles */ }
    };

    if (loadingRooms) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (roomError) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {roomError}
                <Button size="xs" variant="light" ml="md" onClick={refetchRooms}>Tentar novamente</Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Agenda</Text>
                    <Title order={2}>Salas & Espaços</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
                    Nova Sala
                </Button>
            </Group>

            {/* Conflict Alert */}
            {conflictCount > 0 && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" title="Conflitos Detectados">
                    {conflictCount} conflito(s) de horário encontrado(s). Verifique a agenda de salas.
                </Alert>
            )}

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconDoor size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Salas Ativas</Text>
                            <Text fw={700} size="lg">{activeRooms.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={roomsOccupiedNow > 0 ? 'orange' : 'green'} size="lg">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ocupadas Agora</Text>
                            <Text fw={700} size="lg">{roomsOccupiedNow} / {activeRooms.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Capacidade Total</Text>
                            <Text fw={700} size="lg">{totalCapacity}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={conflictCount > 0 ? 'red' : 'green'} size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conflitos</Text>
                            <Text fw={700} size="lg" c={conflictCount > 0 ? 'red' : undefined}>{conflictCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Room Table with Availability */}
            <Card withBorder p="md">
                <Text fw={600} mb="md">Salas ({allRooms.length})</Text>
                {allRooms.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Sala</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Capacidade</Table.Th>
                                <Table.Th>Local</Table.Th>
                                <Table.Th>Ocupação Semanal</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allRooms.map((room) => {
                                const roomScheds = roomScheduleMap.get(room.id) || [];
                                const occupiedSlots = roomScheds.length;
                                // Assume ~30 possible weekly slots (Mon-Sat, 6 time slots each)
                                const occupancyPct = Math.min(100, Math.round((occupiedSlots / 30) * 100));
                                const isOccupiedNow = roomScheds.some(
                                    s => s.dayOfWeek === today && s.startTime <= currentTime && s.endTime > currentTime
                                );

                                return (
                                    <Table.Tr key={room.id}>
                                        <Table.Td>
                                            <Text fw={500}>{room.name}</Text>
                                            {parseAmenities(room.amenities).length > 0 && (
                                                <Group gap={4} mt={2}>
                                                    {parseAmenities(room.amenities).slice(0, 3).map((a, i) => (
                                                        <Badge key={i} size="xs" variant="outline">{a}</Badge>
                                                    ))}
                                                </Group>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color={typeColors[room.roomType] || 'gray'}>
                                                {typeLabels[room.roomType] || room.roomType}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{room.capacity}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {[room.building, room.floor].filter(Boolean).join(', ') || '-'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td style={{ minWidth: 120 }}>
                                            <Progress
                                                value={occupancyPct}
                                                color={occupancyPct > 80 ? 'red' : occupancyPct > 50 ? 'orange' : 'blue'}
                                                size="sm"
                                            />
                                            <Text size="xs" c="dimmed" mt={2}>{occupiedSlots} aulas/semana</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {!room.isActive ? (
                                                <Badge color="gray" variant="light">Inativa</Badge>
                                            ) : isOccupiedNow ? (
                                                <Badge color="red" variant="light">Ocupada</Badge>
                                            ) : (
                                                <Badge color="green" variant="light">Livre</Badge>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconDoor size={48} color="gray" />
                            <Text c="dimmed">Nenhuma sala cadastrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>

            {/* Weekly Availability Grid */}
            {allRooms.length > 0 && (
                <Card withBorder p="md">
                    <Text fw={600} mb="md">Grade de Disponibilidade (Semana)</Text>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Sala</Table.Th>
                                {DAY_LABELS.map((d, i) => (
                                    <Table.Th key={i} ta="center" style={{ minWidth: 50 }}>{d}</Table.Th>
                                ))}
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {activeRooms.slice(0, 15).map((room) => {
                                const roomScheds = roomScheduleMap.get(room.id) || [];
                                return (
                                    <Table.Tr key={room.id}>
                                        <Table.Td><Text size="sm" fw={500}>{room.name}</Text></Table.Td>
                                        {DAY_LABELS.map((_, dayIdx) => {
                                            const dayCount = roomScheds.filter(s => s.dayOfWeek === dayIdx).length;
                                            return (
                                                <Table.Td key={dayIdx} ta="center">
                                                    {dayCount > 0 ? (
                                                        <Badge
                                                            size="sm"
                                                            variant="light"
                                                            color={dayCount > 3 ? 'red' : dayCount > 1 ? 'orange' : 'blue'}
                                                        >
                                                            {dayCount}
                                                        </Badge>
                                                    ) : (
                                                        <Text size="xs" c="dimmed">—</Text>
                                                    )}
                                                </Table.Td>
                                            );
                                        })}
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Create Room Modal */}
            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Nova Sala" size="md">
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Ex: Sala 4 - Avançado"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                    />
                    <Select
                        label="Tipo"
                        data={[
                            { value: 'classroom', label: '🏫 Sala de Aula' },
                            { value: 'lab', label: '🔬 Laboratório' },
                            { value: 'auditorium', label: '🎭 Auditório' },
                            { value: 'online', label: '💻 Online' },
                            { value: 'external', label: '🏢 Externo' },
                        ]}
                        value={newType}
                        onChange={(v) => setNewType(v || 'classroom')}
                    />
                    <NumberInput
                        label="Capacidade"
                        value={newCapacity}
                        onChange={(v) => setNewCapacity(typeof v === 'number' ? v : 15)}
                        min={1}
                        max={500}
                    />
                    <Group grow>
                        <TextInput
                            label="Prédio"
                            placeholder="Ex: Bloco A"
                            value={newBuilding}
                            onChange={(e) => setNewBuilding(e.target.value)}
                        />
                        <TextInput
                            label="Andar"
                            placeholder="Ex: 2º Andar"
                            value={newFloor}
                            onChange={(e) => setNewFloor(e.target.value)}
                        />
                    </Group>
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            disabled={!newName.trim()}
                            loading={creating}
                            onClick={handleCreate}
                        >
                            Criar Sala
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
