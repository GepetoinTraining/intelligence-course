'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Container,
    Title,
    Text,
    Group,
    Stack,
    Paper,
    Badge,
    Avatar,
    Button,
    ActionIcon,
    Select,
    TextInput,
    Textarea,
    Modal,
    Tabs,
    SimpleGrid,
    ThemeIcon,
    Tooltip,
    Center,
    Loader,
    SegmentedControl,
    ScrollArea,
    Divider,
    Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import {
    IconCalendar,
    IconPlus,
    IconChevronLeft,
    IconChevronRight,
    IconClock,
    IconUser,
    IconUsers,
    IconVideo,
    IconMapPin,
    IconPhone,
    IconCheck,
    IconX,
    IconDots,
    IconTrash,
    IconEdit,
    IconListCheck,
    IconFilter,
} from '@tabler/icons-react';
import 'dayjs/locale/pt-br';

// ============================================================================
// Types
// ============================================================================

interface CalendarEvent {
    id: string;
    type: 'meeting' | 'action';
    title: string;
    description?: string;
    start: number;
    end: number;
    isAllDay?: boolean;
    color: string;
    status: string;

    // Meeting specific
    meetingType?: string;
    locationType?: string;
    participants?: { name: string; avatarUrl?: string }[];
    organizerName?: string;

    // Action specific
    priority?: string;
    assignedToName?: string;
    dueDate?: number;
}

interface NewMeetingForm {
    title: string;
    description: string;
    meetingType: string;
    date: Date | null;
    startTime: string;
    endTime: string;
    locationType: string;
    location: string;
    participantIds: string[];
}

// ============================================================================
// Constants
// ============================================================================

const MEETING_TYPE_COLORS: Record<string, string> = {
    internal: 'blue',
    external: 'violet',
    trial_class: 'green',
    parent_teacher: 'orange',
    one_on_one: 'cyan',
    team: 'indigo',
    all_hands: 'grape',
    training: 'yellow',
    interview: 'teal',
    client: 'pink',
};

const MEETING_TYPE_LABELS: Record<string, string> = {
    internal: 'Reunião Interna',
    external: 'Reunião Externa',
    trial_class: 'Aula Experimental',
    parent_teacher: 'Reunião de Pais',
    one_on_one: '1:1',
    team: 'Equipe',
    all_hands: 'Geral',
    training: 'Treinamento',
    interview: 'Entrevista',
    client: 'Cliente',
};

const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'red',
    high: 'orange',
    medium: 'blue',
    low: 'gray',
};

// ============================================================================
// Utility Functions
// ============================================================================

function getWeekDays(date: Date): Date[] {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
}

function getMonthDays(date: Date): Date[][] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday/Monday of the first week
    const startDate = new Date(firstDay);
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1));

    const weeks: Date[][] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= lastDay || weeks.length < 6) {
        if (weeks.length >= 6) break;

        const week: Date[] = [];
        for (let i = 0; i < 7; i++) {
            week.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        weeks.push(week);
    }

    return weeks;
}

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

// ============================================================================
// Event Card Component
// ============================================================================

function EventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
    const isAction = event.type === 'action';

    return (
        <Paper
            p="xs"
            radius="sm"
            withBorder
            style={{
                borderLeft: `3px solid var(--mantine-color-${event.color}-5)`,
                cursor: 'pointer',
                opacity: event.status === 'cancelled' || event.status === 'completed' ? 0.6 : 1,
            }}
            onClick={onClick}
        >
            <Group gap="xs" wrap="nowrap">
                <ThemeIcon
                    size="sm"
                    variant="light"
                    color={event.color}
                    radius="xl"
                >
                    {isAction ? <IconListCheck size={12} /> : <IconCalendar size={12} />}
                </ThemeIcon>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" fw={500} truncate>
                        {event.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {isAction
                            ? event.dueDate && formatTime(event.dueDate)
                            : `${formatTime(event.start)} - ${formatTime(event.end)}`
                        }
                    </Text>
                </div>
            </Group>
        </Paper>
    );
}

// ============================================================================
// Day View Component
// ============================================================================

function DayView({
    date,
    events,
    onEventClick,
}: {
    date: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}) {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const dayEvents = events.filter(e => {
        const eventDate = new Date(e.start);
        return isSameDay(eventDate, date);
    });

    return (
        <ScrollArea h="calc(100vh - 280px)">
            <Stack gap={2}>
                {hours.map((hour) => {
                    const hourStart = new Date(date);
                    hourStart.setHours(hour, 0, 0, 0);
                    const hourEnd = new Date(date);
                    hourEnd.setHours(hour + 1, 0, 0, 0);

                    const hourEvents = dayEvents.filter(e => {
                        const eventStart = e.start;
                        return eventStart >= hourStart.getTime() && eventStart < hourEnd.getTime();
                    });

                    return (
                        <Group key={hour} gap="xs" align="flex-start">
                            <Text size="xs" c="dimmed" w={50} ta="right">
                                {hour.toString().padStart(2, '0')}:00
                            </Text>
                            <Paper
                                p="xs"
                                style={{
                                    flex: 1,
                                    minHeight: 50,
                                    borderLeft: '2px solid var(--mantine-color-gray-3)',
                                }}
                            >
                                <Stack gap={4}>
                                    {hourEvents.map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onClick={() => onEventClick(event)}
                                        />
                                    ))}
                                </Stack>
                            </Paper>
                        </Group>
                    );
                })}
            </Stack>
        </ScrollArea>
    );
}

// ============================================================================
// Week View Component
// ============================================================================

function WeekView({
    date,
    events,
    onEventClick,
}: {
    date: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}) {
    const weekDays = getWeekDays(date);
    const today = new Date();

    return (
        <div>
            {/* Header */}
            <SimpleGrid cols={7} mb="xs">
                {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    return (
                        <Paper
                            key={i}
                            p="xs"
                            ta="center"
                            bg={isToday ? 'violet.0' : undefined}
                            style={{ borderRadius: 8 }}
                        >
                            <Text size="xs" c="dimmed">
                                {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                            </Text>
                            <Text size="lg" fw={isToday ? 700 : 400} c={isToday ? 'violet' : undefined}>
                                {day.getDate()}
                            </Text>
                        </Paper>
                    );
                })}
            </SimpleGrid>

            {/* Events */}
            <ScrollArea h="calc(100vh - 320px)">
                <SimpleGrid cols={7}>
                    {weekDays.map((day, i) => {
                        const dayEvents = events.filter(e => {
                            const eventDate = new Date(e.start);
                            return isSameDay(eventDate, day);
                        });

                        return (
                            <Paper key={i} p="xs" mih={400} withBorder style={{ borderRadius: 8 }}>
                                <Stack gap={4}>
                                    {dayEvents.slice(0, 8).map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            onClick={() => onEventClick(event)}
                                        />
                                    ))}
                                    {dayEvents.length > 8 && (
                                        <Text size="xs" c="dimmed" ta="center">
                                            +{dayEvents.length - 8} mais
                                        </Text>
                                    )}
                                </Stack>
                            </Paper>
                        );
                    })}
                </SimpleGrid>
            </ScrollArea>
        </div>
    );
}

// ============================================================================
// Month View Component
// ============================================================================

function MonthView({
    date,
    events,
    onEventClick,
    onDateClick,
}: {
    date: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onDateClick: (date: Date) => void;
}) {
    const weeks = getMonthDays(date);
    const today = new Date();
    const currentMonth = date.getMonth();

    return (
        <div>
            {/* Header */}
            <SimpleGrid cols={7} mb="xs">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                    <Text key={day} size="sm" fw={500} ta="center" c="dimmed">
                        {day}
                    </Text>
                ))}
            </SimpleGrid>

            {/* Days */}
            <Stack gap={4}>
                {weeks.map((week, wi) => (
                    <SimpleGrid key={wi} cols={7}>
                        {week.map((day, di) => {
                            const isToday = isSameDay(day, today);
                            const isCurrentMonth = day.getMonth() === currentMonth;
                            const dayEvents = events.filter(e => {
                                const eventDate = new Date(e.start);
                                return isSameDay(eventDate, day);
                            });

                            return (
                                <Paper
                                    key={di}
                                    p="xs"
                                    mih={100}
                                    withBorder
                                    style={{
                                        borderRadius: 8,
                                        opacity: isCurrentMonth ? 1 : 0.5,
                                        cursor: 'pointer',
                                        backgroundColor: isToday ? 'var(--mantine-color-violet-0)' : undefined,
                                    }}
                                    onClick={() => onDateClick(day)}
                                >
                                    <Text
                                        size="sm"
                                        fw={isToday ? 700 : 400}
                                        c={isToday ? 'violet' : isCurrentMonth ? undefined : 'dimmed'}
                                        mb="xs"
                                    >
                                        {day.getDate()}
                                    </Text>
                                    <Stack gap={2}>
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <Paper
                                                key={event.id}
                                                p={4}
                                                radius="sm"
                                                bg={`${event.color}.1`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(event);
                                                }}
                                            >
                                                <Text size="xs" truncate c={`${event.color}.7`}>
                                                    {event.title}
                                                </Text>
                                            </Paper>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <Text size="xs" c="dimmed" ta="center">
                                                +{dayEvents.length - 3}
                                            </Text>
                                        )}
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </SimpleGrid>
                ))}
            </Stack>
        </div>
    );
}

// ============================================================================
// New Meeting Modal
// ============================================================================

function NewMeetingModal({
    opened,
    onClose,
    onSubmit,
    selectedDate,
}: {
    opened: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    selectedDate: Date | null;
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<NewMeetingForm>({
        title: '',
        description: '',
        meetingType: 'internal',
        date: selectedDate,
        startTime: '09:00',
        endTime: '10:00',
        locationType: 'video_call',
        location: '',
        participantIds: [],
    });

    useEffect(() => {
        if (selectedDate) {
            setForm(f => ({ ...f, date: selectedDate }));
        }
    }, [selectedDate]);

    const handleSubmit = async () => {
        if (!form.title || !form.date) return;

        setLoading(true);
        try {
            const [startHour, startMin] = form.startTime.split(':').map(Number);
            const [endHour, endMin] = form.endTime.split(':').map(Number);

            const startDate = new Date(form.date);
            startDate.setHours(startHour, startMin, 0, 0);

            const endDate = new Date(form.date);
            endDate.setHours(endHour, endMin, 0, 0);

            await onSubmit({
                ...form,
                scheduledStart: startDate.getTime(),
                scheduledEnd: endDate.getTime(),
            });
            onClose();
        } catch (error) {
            console.error('Error creating meeting:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Text fw={600}>Nova Reunião</Text>}
            size="md"
            radius="lg"
        >
            <Stack gap="md">
                <TextInput
                    label="Título"
                    placeholder="Título da reunião"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                />

                <Select
                    label="Tipo"
                    value={form.meetingType}
                    onChange={(v) => setForm({ ...form, meetingType: v || 'internal' })}
                    data={Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => ({
                        value,
                        label,
                    }))}
                />

                <DatePickerInput
                    label="Data"
                    placeholder="Selecione a data"
                    locale="pt-br"
                    value={form.date}
                    onChange={(date) => setForm({ ...form, date: date as Date | null })}
                />

                <Group grow>
                    <TextInput
                        label="Início"
                        type="time"
                        value={form.startTime}
                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                    <TextInput
                        label="Fim"
                        type="time"
                        value={form.endTime}
                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                </Group>

                <Select
                    label="Local"
                    value={form.locationType}
                    onChange={(v) => setForm({ ...form, locationType: v || 'video_call' })}
                    data={[
                        { value: 'video_call', label: '📹 Videochamada' },
                        { value: 'in_person', label: '🏢 Presencial' },
                        { value: 'phone', label: '📞 Telefone' },
                        { value: 'hybrid', label: '🔄 Híbrido' },
                    ]}
                />

                <Textarea
                    label="Descrição"
                    placeholder="Pauta da reunião..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    minRows={3}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={!form.title || !form.date}
                    >
                        Criar Reunião
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

// ============================================================================
// Event Detail Modal
// ============================================================================

function EventDetailModal({
    opened,
    onClose,
    event,
    onComplete,
    onCancel,
}: {
    opened: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
    onComplete?: () => void;
    onCancel?: () => void;
}) {
    if (!event) return null;

    const isMeeting = event.type === 'meeting';
    const eventDate = new Date(event.start);

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group>
                    <ThemeIcon size="lg" variant="light" color={event.color} radius="xl">
                        {isMeeting ? <IconCalendar size={18} /> : <IconListCheck size={18} />}
                    </ThemeIcon>
                    <div>
                        <Text fw={600}>{event.title}</Text>
                        <Text size="xs" c="dimmed">
                            {eventDate.toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </Text>
                    </div>
                </Group>
            }
            size="md"
            radius="lg"
        >
            <Stack gap="md">
                {/* Status Badge */}
                <Group>
                    <Badge
                        color={
                            event.status === 'completed' || event.status === 'confirmed' ? 'green' :
                                event.status === 'cancelled' ? 'red' :
                                    event.status === 'pending' ? 'yellow' : 'blue'
                        }
                    >
                        {event.status}
                    </Badge>
                    {isMeeting && event.meetingType && (
                        <Badge color={MEETING_TYPE_COLORS[event.meetingType] || 'gray'}>
                            {MEETING_TYPE_LABELS[event.meetingType] || event.meetingType}
                        </Badge>
                    )}
                </Group>

                {/* Time */}
                <Paper p="sm" radius="md" withBorder>
                    <Group>
                        <IconClock size={16} color="gray" />
                        <Text size="sm">
                            {isMeeting
                                ? `${formatTime(event.start)} - ${formatTime(event.end)}`
                                : event.dueDate ? `Prazo: ${formatTime(event.dueDate)}` : 'Sem prazo'
                            }
                        </Text>
                    </Group>
                </Paper>

                {/* Location (meetings) */}
                {isMeeting && event.locationType && (
                    <Paper p="sm" radius="md" withBorder>
                        <Group>
                            {event.locationType === 'video_call' ? <IconVideo size={16} color="gray" /> :
                                event.locationType === 'in_person' ? <IconMapPin size={16} color="gray" /> :
                                    <IconPhone size={16} color="gray" />}
                            <Text size="sm">
                                {event.locationType === 'video_call' ? 'Videochamada' :
                                    event.locationType === 'in_person' ? 'Presencial' :
                                        event.locationType === 'phone' ? 'Telefone' : 'Híbrido'}
                            </Text>
                        </Group>
                    </Paper>
                )}

                {/* Participants */}
                {event.participants && event.participants.length > 0 && (
                    <Paper p="sm" radius="md" withBorder>
                        <Text size="xs" c="dimmed" fw={500} mb="xs">PARTICIPANTES</Text>
                        <Group gap="xs">
                            {event.participants.map((p, i) => (
                                <Tooltip key={i} label={p.name}>
                                    <Avatar size="sm" radius="xl" src={p.avatarUrl}>
                                        {p.name?.charAt(0)}
                                    </Avatar>
                                </Tooltip>
                            ))}
                        </Group>
                    </Paper>
                )}

                {/* Description */}
                {event.description && (
                    <Paper p="sm" radius="md" withBorder>
                        <Text size="xs" c="dimmed" fw={500} mb="xs">DESCRIÇÃO</Text>
                        <Text size="sm">{event.description}</Text>
                    </Paper>
                )}

                {/* Actions */}
                <Group justify="flex-end" mt="md">
                    {onCancel && event.status !== 'cancelled' && event.status !== 'completed' && (
                        <Button
                            variant="subtle"
                            color="red"
                            leftSection={<IconX size={16} />}
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                    )}
                    {onComplete && event.status !== 'completed' && (
                        <Button
                            color="green"
                            leftSection={<IconCheck size={16} />}
                            onClick={onComplete}
                        >
                            Concluir
                        </Button>
                    )}
                </Group>
            </Stack>
        </Modal>
    );
}

// ============================================================================
// Main Calendar Page
// ============================================================================

export default function CalendarPage() {
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const [newMeetingOpened, { open: openNewMeeting, close: closeNewMeeting }] = useDisclosure(false);
    const [eventDetailOpened, { open: openEventDetail, close: closeEventDetail }] = useDisclosure(false);
    const [selectedNewDate, setSelectedNewDate] = useState<Date | null>(null);

    // Filters
    const [showMeetings, setShowMeetings] = useState(true);
    const [showActions, setShowActions] = useState(true);

    // Calculate date range based on view
    const dateRange = useMemo(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (view === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (view === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
        }

        return { start, end };
    }, [currentDate, view]);

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const [meetingsRes, actionsRes] = await Promise.all([
                    showMeetings ? fetch(
                        `/api/meetings?startDate=${dateRange.start.getTime()}&endDate=${dateRange.end.getTime()}`
                    ) : Promise.resolve(null),
                    showActions ? fetch(
                        `/api/action-items?fromDate=${dateRange.start.getTime()}&toDate=${dateRange.end.getTime()}&view=my`
                    ) : Promise.resolve(null),
                ]);

                const allEvents: CalendarEvent[] = [];

                if (meetingsRes?.ok) {
                    const { meetings } = await meetingsRes.json();
                    for (const m of meetings) {
                        allEvents.push({
                            id: m.id,
                            type: 'meeting',
                            title: m.title,
                            description: m.description,
                            start: m.scheduledStart,
                            end: m.scheduledEnd,
                            isAllDay: m.isAllDay,
                            color: MEETING_TYPE_COLORS[m.meetingType] || 'blue',
                            status: m.status,
                            meetingType: m.meetingType,
                            locationType: m.locationType,
                            participants: m.participants,
                            organizerName: m.organizerName,
                        });
                    }
                }

                if (actionsRes?.ok) {
                    const { items } = await actionsRes.json();
                    for (const a of items) {
                        if (a.dueDate) {
                            allEvents.push({
                                id: a.id,
                                type: 'action',
                                title: a.title,
                                description: a.description,
                                start: a.dueDate,
                                end: a.dueDate,
                                color: PRIORITY_COLORS[a.priority] || 'blue',
                                status: a.status,
                                priority: a.priority,
                                assignedToName: a.assignedToName,
                                dueDate: a.dueDate,
                            });
                        }
                    }
                }

                setEvents(allEvents);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [dateRange, showMeetings, showActions]);

    const navigatePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        openEventDetail();
    };

    const handleDateClick = (date: Date) => {
        setSelectedNewDate(date);
        openNewMeeting();
    };

    const handleCreateMeeting = async (data: any) => {
        const res = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: data.title,
                description: data.description,
                meetingType: data.meetingType,
                scheduledStart: data.scheduledStart,
                scheduledEnd: data.scheduledEnd,
                locationType: data.locationType,
                location: data.location,
                participants: [{ userId: 'self' }], // Will be handled by API
            }),
        });

        if (res.ok) {
            // Refresh events
            setCurrentDate(new Date(currentDate)); // Trigger useEffect
        }
    };

    const getDateTitle = () => {
        if (view === 'day') {
            return currentDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } else if (view === 'week') {
            const weekDays = getWeekDays(currentDate);
            const start = weekDays[0];
            const end = weekDays[6];
            if (start.getMonth() === end.getMonth()) {
                return `${start.getDate()} - ${end.getDate()} de ${start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
            }
            return `${start.getDate()} ${start.toLocaleDateString('pt-BR', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
        } else {
            return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        }
    };

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>📅 Calendário</Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Gerencie suas reuniões e tarefas
                    </Text>
                </div>

                <Group>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => {
                            setSelectedNewDate(currentDate);
                            openNewMeeting();
                        }}
                    >
                        Nova Reunião
                    </Button>
                </Group>
            </Group>

            {/* Toolbar */}
            <Paper p="md" radius="lg" withBorder mb="lg">
                <Group justify="space-between">
                    <Group>
                        <Button variant="subtle" onClick={goToToday}>
                            Hoje
                        </Button>
                        <Group gap={4}>
                            <ActionIcon variant="subtle" onClick={navigatePrev}>
                                <IconChevronLeft size={18} />
                            </ActionIcon>
                            <ActionIcon variant="subtle" onClick={navigateNext}>
                                <IconChevronRight size={18} />
                            </ActionIcon>
                        </Group>
                        <Text fw={600} size="lg" tt="capitalize">
                            {getDateTitle()}
                        </Text>
                    </Group>

                    <Group>
                        <SegmentedControl
                            value={view}
                            onChange={(v) => setView(v as any)}
                            data={[
                                { value: 'day', label: 'Dia' },
                                { value: 'week', label: 'Semana' },
                                { value: 'month', label: 'Mês' },
                            ]}
                        />

                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <ActionIcon variant="subtle">
                                    <IconFilter size={18} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Mostrar</Menu.Label>
                                <Menu.Item
                                    leftSection={<IconCalendar size={14} />}
                                    rightSection={showMeetings ? <IconCheck size={14} /> : null}
                                    onClick={() => setShowMeetings(!showMeetings)}
                                >
                                    Reuniões
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconListCheck size={14} />}
                                    rightSection={showActions ? <IconCheck size={14} /> : null}
                                    onClick={() => setShowActions(!showActions)}
                                >
                                    Tarefas
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </Paper>

            {/* Calendar View */}
            {loading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : (
                <Paper p="md" radius="lg" withBorder>
                    {view === 'day' && (
                        <DayView
                            date={currentDate}
                            events={events}
                            onEventClick={handleEventClick}
                        />
                    )}
                    {view === 'week' && (
                        <WeekView
                            date={currentDate}
                            events={events}
                            onEventClick={handleEventClick}
                        />
                    )}
                    {view === 'month' && (
                        <MonthView
                            date={currentDate}
                            events={events}
                            onEventClick={handleEventClick}
                            onDateClick={handleDateClick}
                        />
                    )}
                </Paper>
            )}

            {/* Modals */}
            <NewMeetingModal
                opened={newMeetingOpened}
                onClose={closeNewMeeting}
                onSubmit={handleCreateMeeting}
                selectedDate={selectedNewDate}
            />

            <EventDetailModal
                opened={eventDetailOpened}
                onClose={closeEventDetail}
                event={selectedEvent}
            />
        </Container>
    );
}

