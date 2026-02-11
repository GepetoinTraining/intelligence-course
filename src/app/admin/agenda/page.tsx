'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Group, ThemeIcon,
    Loader, Center, Alert, Button, Badge,
} from '@mantine/core';
import {
    IconAlertCircle, IconArrowRight, IconCalendar, IconDevices,
    IconDoor, IconUser, IconUsersGroup, IconAlertTriangle,
    IconSchool, IconUsers, IconTarget, IconClock,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface Schedule {
    id: string;
    classId: string;
    roomId: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}

interface Meeting {
    id: string;
    title: string;
    scheduledStart: number;
    scheduledEnd: number;
    status: string;
}

interface Room {
    id: string;
    name: string;
    isActive: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
    return a1 < b2 && b1 < a2;
}

// ============================================================================
// PAGE
// ============================================================================

export default function AgendaHubPage() {
    const { data: schedData, isLoading: sl } = useApi<Schedule[]>('/api/schedules');
    const { data: meetData, isLoading: ml } = useApi<Meeting[]>('/api/meetings?limit=50');
    const { data: roomData, isLoading: rl, error, refetch } = useApi<Room[]>('/api/rooms');

    const isLoading = sl || ml || rl;
    const schedules = schedData || [];
    const meetings = meetData || [];
    const rooms = roomData || [];
    const activeRooms = rooms.filter(r => r.isActive);

    const today = new Date().getDay();
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayTs = Math.floor(new Date(now.toDateString()).getTime() / 1000);
    const tomorrowTs = todayTs + 86400;

    // Today's class count
    const todayClasses = schedules.filter(s => s.dayOfWeek === today).length;

    // Today's meetings
    const todayMeetings = meetings.filter(m =>
        m.scheduledStart >= todayTs && m.scheduledStart < tomorrowTs
    ).length;

    // Rooms occupied now
    const roomScheduleMap = new Map<string, Schedule[]>();
    schedules.forEach(s => {
        if (s.roomId) {
            const arr = roomScheduleMap.get(s.roomId) || [];
            arr.push(s);
            roomScheduleMap.set(s.roomId, arr);
        }
    });
    const roomsOccupied = activeRooms.filter(room => {
        const rs = (roomScheduleMap.get(room.id) || []).filter(s => s.dayOfWeek === today);
        return rs.some(s => s.startTime <= currentTime && s.endTime > currentTime);
    }).length;

    // Conflict detection
    let conflictCount = 0;
    roomScheduleMap.forEach((roomScheds) => {
        const byDay = new Map<number, Schedule[]>();
        roomScheds.forEach(s => {
            const d = byDay.get(s.dayOfWeek) || [];
            d.push(s);
            byDay.set(s.dayOfWeek, d);
        });
        byDay.forEach((dayScheds) => {
            for (let i = 0; i < dayScheds.length; i++) {
                for (let j = i + 1; j < dayScheds.length; j++) {
                    if (timesOverlap(dayScheds[i].startTime, dayScheds[i].endTime, dayScheds[j].startTime, dayScheds[j].endTime)) {
                        conflictCount++;
                    }
                }
            }
        });
    });

    const quickLinks = [
        { label: 'Minha Agenda', href: '/admin/agenda/pessoal', icon: IconUser, color: 'blue' },
        { label: 'Agenda do Time', href: '/admin/agenda/time', icon: IconUsersGroup, color: 'teal' },
        { label: 'Calendário', href: '/admin/agenda/calendario', icon: IconCalendar, color: 'indigo' },
        { label: 'Salas', href: '/admin/agenda/salas', icon: IconDoor, color: 'orange', badge: `${activeRooms.length}` },
        { label: 'Recursos', href: '/admin/agenda/recursos', icon: IconDevices, color: 'cyan' },
        { label: 'Calendário Letivo', href: '/admin/agenda/letivo', icon: IconSchool, color: 'green' },
        { label: 'Agenda Total', href: '/admin/agenda/total', icon: IconTarget, color: 'grape' },
        { label: 'Direção', href: '/admin/agenda/direcao', icon: IconUsers, color: 'violet' },
        { label: 'Líderes', href: '/admin/agenda/lideres', icon: IconUsersGroup, color: 'pink' },
    ];

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Administração</Text>
                <Title order={2}>Agenda</Title>
                <Text size="sm" c="dimmed" mt={4}>
                    Calendário unificado — todas as aulas, reuniões e reservas em um só lugar
                </Text>
            </div>

            {/* Conflict Banner */}
            {conflictCount > 0 && (
                <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" title="Conflitos de Horário">
                    {conflictCount} conflito(s) detectado(s) entre salas. Acesse <strong>Salas</strong> para revisão.
                </Alert>
            )}

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="indigo" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Aulas Hoje</Text>
                            <Text fw={700} size="xl">
                                {isLoading ? <Loader size="sm" /> : todayClasses}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Reuniões Hoje</Text>
                            <Text fw={700} size="xl">
                                {isLoading ? <Loader size="sm" /> : todayMeetings}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={roomsOccupied > 0 ? 'orange' : 'green'} size="lg" radius="md">
                            <IconDoor size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Salas Ocupadas</Text>
                            <Text fw={700} size="xl">
                                {isLoading ? <Loader size="sm" /> : `${roomsOccupied}/${activeRooms.length}`}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={conflictCount > 0 ? 'red' : 'green'} size="lg" radius="md">
                            {conflictCount > 0 ? <IconAlertTriangle size={20} /> : <IconClock size={20} />}
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Conflitos</Text>
                            <Text fw={700} size="xl" c={conflictCount > 0 ? 'red' : undefined}>
                                {isLoading ? <Loader size="sm" /> : conflictCount}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                    Dados offline — {error}
                    <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
                </Alert>
            )}

            {/* Quick Links */}
            <Title order={4}>Acesso Rápido</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {quickLinks.map((link) => (
                    <Card
                        key={link.label}
                        withBorder
                        p="lg"
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.location.href = link.href}
                    >
                        <Group>
                            <ThemeIcon variant="light" color={link.color} size="lg" radius="md">
                                <link.icon size={20} />
                            </ThemeIcon>
                            <div style={{ flex: 1 }}>
                                <Group gap="xs">
                                    <Text fw={500}>{link.label}</Text>
                                    {link.badge && <Badge size="xs" variant="light">{link.badge}</Badge>}
                                </Group>
                            </div>
                            <IconArrowRight size={16} color="gray" />
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
