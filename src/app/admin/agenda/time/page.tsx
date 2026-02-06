'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Avatar,
} from '@mantine/core';
import {
    IconCalendar,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconUsers,
    IconClock,
} from '@tabler/icons-react';

interface Event {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'meeting' | 'class' | 'event' | 'personal';
    participants?: string[];
    location?: string;
}

// Mock data
const mockEvents: Event[] = [
    { id: '1', title: 'Reunião de equipe', date: '2026-02-05', startTime: '09:00', endTime: '10:00', type: 'meeting', participants: ['João', 'Maria'], location: 'Sala 1' },
    { id: '2', title: 'Aula Turma A', date: '2026-02-05', startTime: '10:00', endTime: '11:30', type: 'class', location: 'Sala 3' },
    { id: '3', title: 'Almoço com cliente', date: '2026-02-05', startTime: '12:00', endTime: '13:30', type: 'personal' },
    { id: '4', title: 'Entrevista candidato', date: '2026-02-06', startTime: '14:00', endTime: '15:00', type: 'meeting', participants: ['Ana'] },
];

const typeColors: Record<string, string> = {
    meeting: 'blue',
    class: 'green',
    event: 'grape',
    personal: 'orange',
};

const typeLabels: Record<string, string> = {
    meeting: 'Reunião',
    class: 'Aula',
    event: 'Evento',
    personal: 'Pessoal',
};

export default function AgendaTimePage() {
    const [events] = useState<Event[]>(mockEvents);

    const todayEvents = events.filter(e => e.date === '2026-02-05');
    const upcomingEvents = events.filter(e => e.date > '2026-02-05');

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Agenda</Text>
                    <Title order={2}>Agenda do Time</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Evento
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Hoje</Text>
                            <Text fw={700} size="xl">{todayEvents.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Próximos</Text>
                            <Text fw={700} size="xl">{upcomingEvents.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Reuniões</Text>
                            <Text fw={700} size="xl">{events.filter(e => e.type === 'meeting').length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Semana</Text>
                            <Text fw={700} size="xl">{events.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Eventos de Hoje</Title>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {todayEvents.map((event) => (
                        <Card key={event.id} withBorder p="md">
                            <Group justify="space-between">
                                <Group>
                                    <div style={{
                                        width: 4,
                                        height: 40,
                                        borderRadius: 4,
                                        backgroundColor: `var(--mantine-color-${typeColors[event.type]}-6)`
                                    }} />
                                    <div>
                                        <Text fw={500}>{event.title}</Text>
                                        <Group gap="xs">
                                            <Badge size="xs" variant="light" color={typeColors[event.type]}>
                                                {typeLabels[event.type]}
                                            </Badge>
                                            <Text size="xs" c="dimmed">
                                                {event.startTime} - {event.endTime}
                                            </Text>
                                            {event.location && (
                                                <Text size="xs" c="dimmed">• {event.location}</Text>
                                            )}
                                        </Group>
                                    </div>
                                </Group>
                                <Menu position="bottom-end" withArrow>
                                    <Menu.Target>
                                        <ActionIcon variant="subtle" color="gray">
                                            <IconDotsVertical size={16} />
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item leftSection={<IconEye size={14} />}>Ver</Menu.Item>
                                        <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        </Card>
                    ))}
                </div>
            </Card>
        </div>
    );
}

