'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Table, Modal, TextInput, NumberInput,
    Textarea, MultiSelect, Switch, Grid, Progress, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconDoor,
    IconUsers, IconWifi, IconAirConditioning, IconDeviceProjector,
    IconCalendar, IconClock
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Room {
    id: string;
    name: string;
    code: string;
    capacity: number;
    amenities: string[];
    isActive: boolean;
    currentOccupancy?: number;
    nextSession?: { time: string; class: string };
}

// ============================================================================
// MOCK DATA
// ============================================================================

const AMENITY_OPTIONS = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'projector', label: 'Projetor' },
    { value: 'ac', label: 'Ar Condicionado' },
    { value: 'whiteboard', label: 'Quadro Branco' },
    { value: 'computers', label: 'Computadores' },
    { value: 'audio', label: 'Sistema de Áudio' },
];

const MOCK_ROOMS: Room[] = [
    { id: '1', name: 'Sala Principal', code: 'A1', capacity: 20, amenities: ['wifi', 'projector', 'ac', 'whiteboard'], isActive: true, currentOccupancy: 15, nextSession: { time: '14:00', class: 'Turma A' } },
    { id: '2', name: 'Lab de Informática', code: 'LAB1', capacity: 15, amenities: ['wifi', 'computers', 'ac'], isActive: true, currentOccupancy: 0 },
    { id: '3', name: 'Sala de Reuniões', code: 'REU1', capacity: 8, amenities: ['wifi', 'projector', 'ac'], isActive: true, currentOccupancy: 4 },
    { id: '4', name: 'Auditório', code: 'AUD', capacity: 50, amenities: ['wifi', 'projector', 'ac', 'audio'], isActive: true },
    { id: '5', name: 'Sala Kids', code: 'KIDS', capacity: 12, amenities: ['wifi', 'whiteboard'], isActive: false },
];

const AMENITY_ICONS: Record<string, React.ReactNode> = {
    wifi: <IconWifi size={14} />,
    projector: <IconDeviceProjector size={14} />,
    ac: <IconAirConditioning size={14} />,
    whiteboard: <IconDoor size={14} />,
    computers: <IconDeviceProjector size={14} />,
    audio: <IconDeviceProjector size={14} />,
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function RoomManagementPage() {
    const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);

    // Form state
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [capacity, setCapacity] = useState<number>(10);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);

    const handleCreate = () => {
        setIsCreating(true);
        setSelectedRoom(null);
        setName('');
        setCode('');
        setCapacity(10);
        setAmenities([]);
        setIsActive(true);
        openModal();
    };

    const handleEdit = (room: Room) => {
        setIsCreating(false);
        setSelectedRoom(room);
        setName(room.name);
        setCode(room.code);
        setCapacity(room.capacity);
        setAmenities(room.amenities);
        setIsActive(room.isActive);
        openModal();
    };

    const handleSave = () => {
        if (isCreating) {
            const newRoom: Room = {
                id: `room-${Date.now()}`,
                name,
                code,
                capacity,
                amenities,
                isActive,
            };
            setRooms(prev => [...prev, newRoom]);
        } else if (selectedRoom) {
            setRooms(prev => prev.map(r =>
                r.id === selectedRoom.id
                    ? { ...r, name, code, capacity, amenities, isActive }
                    : r
            ));
        }
        closeModal();
    };

    const handleDelete = (id: string) => {
        setRooms(prev => prev.filter(r => r.id !== id));
    };

    const activeRooms = rooms.filter(r => r.isActive);
    const totalCapacity = activeRooms.reduce((acc, r) => acc + r.capacity, 0);
    const currentOccupancy = rooms.reduce((acc, r) => acc + (r.currentOccupancy || 0), 0);

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
                        <Title order={2}>Gestão de Salas 🚪</Title>
                        <Text c="dimmed">Gerencie salas e seus equipamentos</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
                    Nova Sala
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{rooms.length}</Text>
                            <Text size="sm" c="dimmed">Total Salas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="blue">
                            <IconDoor size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700} c="green">{activeRooms.length}</Text>
                            <Text size="sm" c="dimmed">Ativas</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="green">
                            <IconDoor size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{totalCapacity}</Text>
                            <Text size="sm" c="dimmed">Capacidade Total</Text>
                        </div>
                        <ThemeIcon size={48} variant="light" color="violet">
                            <IconUsers size={24} />
                        </ThemeIcon>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xl" fw={700}>{currentOccupancy}</Text>
                            <Text size="sm" c="dimmed">Ocupação Atual</Text>
                        </div>
                        <Progress
                            value={(currentOccupancy / totalCapacity) * 100}
                            size="xl"
                            radius="xl"
                            w={60}
                        />
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Room Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {rooms.map(room => (
                    <Card key={room.id} shadow="sm" radius="md" p="lg" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Group gap="sm">
                                    <ThemeIcon size="lg" variant="light" color={room.isActive ? 'blue' : 'gray'}>
                                        <IconDoor size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text fw={600}>{room.name}</Text>
                                        <Text size="xs" c="dimmed">Código: {room.code}</Text>
                                    </div>
                                </Group>
                                <Badge color={room.isActive ? 'green' : 'gray'} variant="light">
                                    {room.isActive ? 'Ativa' : 'Inativa'}
                                </Badge>
                            </Group>

                            <Group gap="md">
                                <Paper p="xs" bg="gray.0" radius="sm">
                                    <Group gap={4}>
                                        <IconUsers size={14} />
                                        <Text size="sm">{room.capacity} pessoas</Text>
                                    </Group>
                                </Paper>
                                {room.currentOccupancy !== undefined && (
                                    <Paper p="xs" bg={room.currentOccupancy > 0 ? 'blue.0' : 'gray.0'} radius="sm">
                                        <Text size="sm" c={room.currentOccupancy > 0 ? 'blue' : 'dimmed'}>
                                            {room.currentOccupancy} agora
                                        </Text>
                                    </Paper>
                                )}
                            </Group>

                            {/* Amenities */}
                            <Group gap={4}>
                                {room.amenities.map(a => (
                                    <Tooltip key={a} label={AMENITY_OPTIONS.find(o => o.value === a)?.label}>
                                        <ThemeIcon size="sm" variant="light" color="gray">
                                            {AMENITY_ICONS[a] || <IconDoor size={14} />}
                                        </ThemeIcon>
                                    </Tooltip>
                                ))}
                            </Group>

                            {/* Next Session */}
                            {room.nextSession && (
                                <Paper p="sm" bg="violet.0" radius="md">
                                    <Group gap="xs">
                                        <IconClock size={14} color="var(--mantine-color-violet-6)" />
                                        <Text size="sm" c="violet">
                                            {room.nextSession.time} - {room.nextSession.class}
                                        </Text>
                                    </Group>
                                </Paper>
                            )}

                            {/* Actions */}
                            <Group>
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconEdit size={14} />}
                                    onClick={() => handleEdit(room)}
                                    flex={1}
                                >
                                    Editar
                                </Button>
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="red"
                                    leftSection={<IconTrash size={14} />}
                                    onClick={() => handleDelete(room.id)}
                                >
                                    Excluir
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>

            {/* Room Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title={isCreating ? 'Nova Sala' : 'Editar Sala'}
                centered
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome da Sala"
                        placeholder="Ex: Sala Principal"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <TextInput
                        label="Código"
                        placeholder="Ex: A1"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                    <NumberInput
                        label="Capacidade"
                        placeholder="Número de pessoas"
                        value={capacity}
                        onChange={(v) => setCapacity(Number(v) || 10)}
                        min={1}
                        max={100}
                    />
                    <MultiSelect
                        label="Equipamentos"
                        placeholder="Selecione..."
                        data={AMENITY_OPTIONS}
                        value={amenities}
                        onChange={setAmenities}
                    />
                    <Switch
                        label="Sala ativa"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.currentTarget.checked)}
                    />
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

