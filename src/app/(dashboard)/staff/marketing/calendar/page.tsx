'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, TextInput, Select, Button, Textarea, Modal,
    ActionIcon, Table, Switch, Divider, Alert, ThemeIcon,
    Tooltip, Avatar, Menu, Checkbox
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconCalendar, IconPlus, IconEdit, IconTrash, IconArrowLeft,
    IconBrandInstagram, IconBrandFacebook, IconMail, IconBrandTiktok,
    IconBrandWhatsapp, IconChevronLeft, IconChevronRight,
    IconCheck, IconClock, IconDots, IconEye, IconCopy,
    IconPhoto, IconVideo, IconFileText, IconSend
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface CalendarEvent {
    id: string;
    title: string;
    date: string;  // YYYY-MM-DD
    time?: string;  // HH:mm
    channel: 'instagram' | 'facebook' | 'email' | 'tiktok' | 'whatsapp' | 'all';
    type: 'post' | 'story' | 'reel' | 'email' | 'campaign';
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    content?: string;
    notes?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_EVENTS: CalendarEvent[] = [
    {
        id: '1',
        title: 'Post: Dica de Pronúncia',
        date: '2026-02-05',
        time: '10:00',
        channel: 'instagram',
        type: 'post',
        status: 'scheduled',
        content: 'Dica rápida de pronúncia do dia! 🎯',
    },
    {
        id: '2',
        title: 'Stories: Bastidores Aula',
        date: '2026-02-05',
        time: '14:00',
        channel: 'instagram',
        type: 'story',
        status: 'draft',
        content: 'Mostrar bastidores da aula de conversação',
    },
    {
        id: '3',
        title: 'Newsletter Semanal',
        date: '2026-02-06',
        time: '09:00',
        channel: 'email',
        type: 'email',
        status: 'scheduled',
        content: 'Newsletter com dicas e promoções da semana',
    },
    {
        id: '4',
        title: 'Post: Depoimento Aluno',
        date: '2026-02-07',
        time: '11:00',
        channel: 'instagram',
        type: 'post',
        status: 'scheduled',
        content: 'Depoimento do João sobre sua evolução no inglês',
    },
    {
        id: '5',
        title: 'Reel: Erros Comuns',
        date: '2026-02-07',
        time: '18:00',
        channel: 'instagram',
        type: 'reel',
        status: 'draft',
        content: '5 erros comuns que brasileiros cometem em inglês',
    },
    {
        id: '6',
        title: 'Campanha: Última Semana Promo',
        date: '2026-02-08',
        time: '08:00',
        channel: 'all',
        type: 'campaign',
        status: 'scheduled',
        content: 'Última semana da promoção de matrícula!',
    },
    {
        id: '7',
        title: 'TikTok: Trend Challenge',
        date: '2026-02-10',
        time: '16:00',
        channel: 'tiktok',
        type: 'reel',
        status: 'draft',
        content: 'Participar do trend "Traduza isso"',
    },
    {
        id: '8',
        title: 'Post: Frase Motivacional',
        date: '2026-02-12',
        time: '07:00',
        channel: 'instagram',
        type: 'post',
        status: 'scheduled',
        content: 'Segunda-feira motivacional sobre sonhos e inglês',
    },
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getChannelIcon(channel: CalendarEvent['channel']) {
    switch (channel) {
        case 'instagram': return <IconBrandInstagram size={14} />;
        case 'facebook': return <IconBrandFacebook size={14} />;
        case 'email': return <IconMail size={14} />;
        case 'tiktok': return <IconBrandTiktok size={14} />;
        case 'whatsapp': return <IconBrandWhatsapp size={14} />;
        case 'all': return <IconSend size={14} />;
        default: return <IconCalendar size={14} />;
    }
}

function getChannelColor(channel: CalendarEvent['channel']) {
    switch (channel) {
        case 'instagram': return 'pink';
        case 'facebook': return 'blue';
        case 'email': return 'grape';
        case 'tiktok': return 'dark';
        case 'whatsapp': return 'green';
        case 'all': return 'violet';
        default: return 'gray';
    }
}

function getStatusBadge(status: CalendarEvent['status']) {
    const colors = { draft: 'gray', scheduled: 'blue', published: 'green', failed: 'red' };
    const labels = { draft: 'Rascunho', scheduled: 'Agendado', published: 'Publicado', failed: 'Falhou' };
    return <Badge color={colors[status]} size="xs" variant="light">{labels[status]}</Badge>;
}

function getTypeIcon(type: CalendarEvent['type']) {
    switch (type) {
        case 'post': return <IconPhoto size={12} />;
        case 'story': return <IconClock size={12} />;
        case 'reel': return <IconVideo size={12} />;
        case 'email': return <IconMail size={12} />;
        case 'campaign': return <IconSend size={12} />;
        default: return <IconFileText size={12} />;
    }
}

// ============================================================================
// CALENDAR GRID
// ============================================================================

function CalendarGrid({
    currentDate,
    events,
    onSelectDate,
    onSelectEvent,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    onSelectDate: (date: Date) => void;
    onSelectEvent: (event: CalendarEvent) => void;
}) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Empty cells for days before month start
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    const getEventsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

    return (
        <div>
            {/* Weekday headers */}
            <SimpleGrid cols={7} mb="xs">
                {WEEKDAYS.map(wd => (
                    <Paper key={wd} p="xs" ta="center">
                        <Text size="sm" fw={600} c="dimmed">{wd}</Text>
                    </Paper>
                ))}
            </SimpleGrid>

            {/* Calendar grid */}
            <SimpleGrid cols={7} spacing="xs">
                {days.map((day, index) => {
                    if (day === null) {
                        return <Paper key={`empty-${index}`} p="xs" bg="gray.0" />;
                    }

                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <Paper
                            key={day}
                            p="xs"
                            withBorder
                            radius="sm"
                            style={{
                                minHeight: 80,
                                cursor: 'pointer',
                                borderColor: isToday(day) ? 'var(--mantine-color-blue-5)' : undefined,
                                borderWidth: isToday(day) ? 2 : 1,
                            }}
                            onClick={() => onSelectDate(new Date(year, month, day))}
                        >
                            <Group justify="space-between" mb={4}>
                                <Text size="sm" fw={isToday(day) ? 700 : 400} c={isToday(day) ? 'blue' : undefined}>
                                    {day}
                                </Text>
                                {hasEvents && (
                                    <Badge size="xs" circle color="blue">
                                        {dayEvents.length}
                                    </Badge>
                                )}
                            </Group>

                            <Stack gap={2}>
                                {dayEvents.slice(0, 3).map(event => (
                                    <Paper
                                        key={event.id}
                                        p={4}
                                        bg={`${getChannelColor(event.channel)}.1`}
                                        radius="xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectEvent(event);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Group gap={4} wrap="nowrap">
                                            {getChannelIcon(event.channel)}
                                            <Text size="xs" lineClamp={1} style={{ flex: 1 }}>
                                                {event.title}
                                            </Text>
                                        </Group>
                                    </Paper>
                                ))}
                                {dayEvents.length > 3 && (
                                    <Text size="xs" c="dimmed" ta="center">
                                        +{dayEvents.length - 3} mais
                                    </Text>
                                )}
                            </Stack>
                        </Paper>
                    );
                })}
            </SimpleGrid>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ContentCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb 2026
    const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [eventModalOpened, { open: openEventModal, close: closeEventModal }] = useDisclosure(false);
    const [view, setView] = useState<'month' | 'list'>('month');

    // New event form state
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
        title: '',
        date: '',
        time: '10:00',
        channel: 'instagram',
        type: 'post',
        status: 'draft',
        content: '',
    });

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleSelectDate = (date: Date) => {
        setSelectedDate(date);
        setNewEvent({
            ...newEvent,
            date: date.toISOString().split('T')[0],
        });
        openModal();
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        openEventModal();
    };

    const handleCreateEvent = () => {
        if (!newEvent.title || !newEvent.date) {
            notifications.show({
                title: 'Erro',
                message: 'Preencha título e data',
                color: 'red',
            });
            return;
        }

        const event: CalendarEvent = {
            id: Date.now().toString(),
            title: newEvent.title!,
            date: newEvent.date!,
            time: newEvent.time,
            channel: newEvent.channel as CalendarEvent['channel'],
            type: newEvent.type as CalendarEvent['type'],
            status: 'draft',
            content: newEvent.content,
        };

        setEvents([...events, event]);
        closeModal();
        setNewEvent({
            title: '',
            date: '',
            time: '10:00',
            channel: 'instagram',
            type: 'post',
            status: 'draft',
            content: '',
        });

        notifications.show({
            title: 'Conteúdo criado!',
            message: `"${event.title}" adicionado ao calendário`,
            color: 'green',
        });
    };

    const handleDeleteEvent = (id: string) => {
        setEvents(events.filter(e => e.id !== id));
        closeEventModal();
        notifications.show({
            title: 'Removido',
            message: 'Conteúdo removido do calendário',
            color: 'gray',
        });
    };

    const handleScheduleEvent = (id: string) => {
        setEvents(events.map(e =>
            e.id === id ? { ...e, status: 'scheduled' as const } : e
        ));
        notifications.show({
            title: 'Agendado!',
            message: 'Conteúdo agendado para publicação',
            color: 'green',
        });
    };

    // Stats
    const stats = useMemo(() => {
        const thisMonth = events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear();
        });

        return {
            total: thisMonth.length,
            scheduled: thisMonth.filter(e => e.status === 'scheduled').length,
            drafts: thisMonth.filter(e => e.status === 'draft').length,
            published: thisMonth.filter(e => e.status === 'published').length,
        };
    }, [events, currentDate]);

    // List view events
    const sortedEvents = [...events]
        .filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear();
        })
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/staff/marketing"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>📅 Calendário de Conteúdo</Title>
                    <Text c="dimmed">Planeje e agende suas publicações</Text>
                </div>
                <Group>
                    <Button
                        variant={view === 'month' ? 'filled' : 'light'}
                        size="sm"
                        onClick={() => setView('month')}
                    >
                        Mês
                    </Button>
                    <Button
                        variant={view === 'list' ? 'filled' : 'light'}
                        size="sm"
                        onClick={() => setView('list')}
                    >
                        Lista
                    </Button>
                    <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
                        Novo Conteúdo
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Total no Mês</Text>
                            <Text size="xl" fw={700}>{stats.total}</Text>
                        </div>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Agendados</Text>
                            <Text size="xl" fw={700} c="blue">{stats.scheduled}</Text>
                        </div>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Rascunhos</Text>
                            <Text size="xl" fw={700} c="gray">{stats.drafts}</Text>
                        </div>
                        <ThemeIcon variant="light" color="gray" size="lg">
                            <IconEdit size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" c="dimmed">Publicados</Text>
                            <Text size="xl" fw={700} c="green">{stats.published}</Text>
                        </div>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Month Navigation */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="lg">
                    <ActionIcon variant="light" onClick={handlePrevMonth}>
                        <IconChevronLeft size={16} />
                    </ActionIcon>
                    <Title order={3}>
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Title>
                    <ActionIcon variant="light" onClick={handleNextMonth}>
                        <IconChevronRight size={16} />
                    </ActionIcon>
                </Group>

                {view === 'month' ? (
                    <CalendarGrid
                        currentDate={currentDate}
                        events={events}
                        onSelectDate={handleSelectDate}
                        onSelectEvent={handleSelectEvent}
                    />
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Horário</Table.Th>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Canal</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {sortedEvents.map(event => (
                                <Table.Tr key={event.id}>
                                    <Table.Td>
                                        <Text size="sm" fw={500}>
                                            {new Date(event.date).toLocaleDateString('pt-BR')}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{event.time || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{event.title}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={getChannelColor(event.channel)} variant="light" leftSection={getChannelIcon(event.channel)} size="sm">
                                            {event.channel}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color="gray" variant="light" leftSection={getTypeIcon(event.type)} size="sm">
                                            {event.type}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        {getStatusBadge(event.status)}
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Group gap={4} justify="center">
                                            <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleSelectEvent(event)}>
                                                <IconEye size={14} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                                                <IconTrash size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Create Event Modal */}
            <Modal opened={modalOpened} onClose={closeModal} title="Novo Conteúdo" size="lg">
                <Stack gap="md">
                    <TextInput
                        label="Título"
                        placeholder="Ex: Post: Dica de Pronúncia"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        required
                    />

                    <SimpleGrid cols={2}>
                        <TextInput
                            label="Data"
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            required
                        />
                        <TextInput
                            label="Horário"
                            type="time"
                            value={newEvent.time}
                            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={2}>
                        <Select
                            label="Canal"
                            data={[
                                { value: 'instagram', label: '📸 Instagram' },
                                { value: 'facebook', label: '📘 Facebook' },
                                { value: 'email', label: '✉️ Email' },
                                { value: 'tiktok', label: '🎵 TikTok' },
                                { value: 'whatsapp', label: '💬 WhatsApp' },
                                { value: 'all', label: '🚀 Todos' },
                            ]}
                            value={newEvent.channel}
                            onChange={(v) => setNewEvent({ ...newEvent, channel: v as CalendarEvent['channel'] })}
                        />
                        <Select
                            label="Tipo"
                            data={[
                                { value: 'post', label: '📷 Post' },
                                { value: 'story', label: '⏰ Story' },
                                { value: 'reel', label: '🎬 Reel/Vídeo' },
                                { value: 'email', label: '📧 Email' },
                                { value: 'campaign', label: '📢 Campanha' },
                            ]}
                            value={newEvent.type}
                            onChange={(v) => setNewEvent({ ...newEvent, type: v as CalendarEvent['type'] })}
                        />
                    </SimpleGrid>

                    <Textarea
                        label="Conteúdo/Notas"
                        placeholder="Descreva o conteúdo ou adicione notas"
                        value={newEvent.content}
                        onChange={(e) => setNewEvent({ ...newEvent, content: e.target.value })}
                        rows={4}
                    />

                    <Group justify="flex-end">
                        <Button variant="light" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleCreateEvent} leftSection={<IconPlus size={16} />}>
                            Criar Conteúdo
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* View Event Modal */}
            <Modal opened={eventModalOpened} onClose={closeEventModal} title="Detalhes do Conteúdo" size="lg">
                {selectedEvent && (
                    <Stack gap="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="lg" fw={600}>{selectedEvent.title}</Text>
                                <Text size="sm" c="dimmed">
                                    {new Date(selectedEvent.date).toLocaleDateString('pt-BR')} às {selectedEvent.time || 'sem horário'}
                                </Text>
                            </div>
                            {getStatusBadge(selectedEvent.status)}
                        </Group>

                        <Group gap="xs">
                            <Badge color={getChannelColor(selectedEvent.channel)} variant="light" leftSection={getChannelIcon(selectedEvent.channel)}>
                                {selectedEvent.channel}
                            </Badge>
                            <Badge color="gray" variant="light" leftSection={getTypeIcon(selectedEvent.type)}>
                                {selectedEvent.type}
                            </Badge>
                        </Group>

                        {selectedEvent.content && (
                            <Paper p="md" withBorder radius="sm" bg="gray.0">
                                <Text size="sm">{selectedEvent.content}</Text>
                            </Paper>
                        )}

                        <Divider />

                        <Group justify="space-between">
                            <Button
                                variant="light"
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={() => handleDeleteEvent(selectedEvent.id)}
                            >
                                Remover
                            </Button>
                            <Group>
                                {selectedEvent.status === 'draft' && (
                                    <Button
                                        variant="light"
                                        color="blue"
                                        leftSection={<IconClock size={16} />}
                                        onClick={() => {
                                            handleScheduleEvent(selectedEvent.id);
                                            closeEventModal();
                                        }}
                                    >
                                        Agendar
                                    </Button>
                                )}
                                <Button leftSection={<IconEdit size={16} />} onClick={closeEventModal}>
                                    Editar
                                </Button>
                            </Group>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Container>
    );
}

