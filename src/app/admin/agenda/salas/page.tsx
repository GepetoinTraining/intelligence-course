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
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconDoor,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconCheck,
    IconX,
    IconCalendar,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Room {
    id: string;
    name: string;
    capacity: number;
    type: 'classroom' | 'meeting' | 'lab' | 'auditorium';
    equipment: string[];
    status: 'available' | 'occupied' | 'maintenance';
    currentEvent?: string;
}

// Mock data
const mockRooms: Room[] = [
    { id: '1', name: 'Sala 1 - Básico', capacity: 20, type: 'classroom', equipment: ['TV', 'Quadro'], status: 'available' },
    { id: '2', name: 'Sala 2 - Intermediário', capacity: 15, type: 'classroom', equipment: ['TV', 'Quadro', 'Som'], status: 'occupied', currentEvent: 'Aula Turma B' },
    { id: '3', name: 'Sala de Reuniões', capacity: 10, type: 'meeting', equipment: ['TV', 'Videoconferência'], status: 'available' },
    { id: '4', name: 'Laboratório', capacity: 25, type: 'lab', equipment: ['Computadores', 'Projetor'], status: 'maintenance' },
    { id: '5', name: 'Auditório', capacity: 100, type: 'auditorium', equipment: ['Som', 'Projetor', 'Microfone'], status: 'available' },
];

const typeLabels: Record<string, string> = {
    classroom: 'Sala de Aula',
    meeting: 'Reunião',
    lab: 'Laboratório',
    auditorium: 'Auditório',
};

const statusColors: Record<string, string> = {
    available: 'green',
    occupied: 'red',
    maintenance: 'yellow',
};

const statusLabels: Record<string, string> = {
    available: 'Disponível',
    occupied: 'Ocupada',
    maintenance: 'Manutenção',
};

export default function SalasPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/rooms');

    const [rooms] = useState<Room[]>(mockRooms);

    const availableCount = rooms.filter(r => r.status === 'available').length;
    const occupiedCount = rooms.filter(r => r.status === 'occupied').length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Agenda</Text>
                    <Title order={2}>Salas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Sala
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconDoor size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="xl">{rooms.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Disponíveis</Text>
                            <Text fw={700} size="xl">{availableCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconX size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ocupadas</Text>
                            <Text fw={700} size="xl">{occupiedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Reservas Hoje</Text>
                            <Text fw={700} size="xl">12</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Salas</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Sala</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Capacidade</Table.Th>
                            <Table.Th>Equipamentos</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rooms.map((room) => (
                            <Table.Tr key={room.id}>
                                <Table.Td>
                                    <div>
                                        <Text fw={500}>{room.name}</Text>
                                        {room.currentEvent && (
                                            <Text size="xs" c="dimmed">{room.currentEvent}</Text>
                                        )}
                                    </div>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" color="gray">{typeLabels[room.type]}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{room.capacity} pessoas</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        {room.equipment.slice(0, 2).map((eq, i) => (
                                            <Badge key={i} size="xs" variant="outline">{eq}</Badge>
                                        ))}
                                        {room.equipment.length > 2 && (
                                            <Badge size="xs" variant="light">+{room.equipment.length - 2}</Badge>
                                        )}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[room.status]} variant="light">
                                        {statusLabels[room.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconCalendar size={14} />}>Ver Agenda</Menu.Item>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Detalhes</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
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

