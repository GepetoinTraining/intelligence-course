'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Select,
    Grid, Table, Tabs, ColorSwatch, Tooltip, Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconEdit, IconTrash, IconCalendar,
    IconClock, IconUsers, IconDoor, IconAlertTriangle, IconCheck,
    IconChevronRight, IconX
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleSlot {
    id: string;
    classId: string;
    className: string;
    teacherId: string;
    teacherName: string;
    roomId: string;
    roomName: string;
    dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    color: string;
    termId: string;
}

interface ClassOption {
    id: string;
    name: string;
    course: string;
    color: string;
}

interface TeacherOption {
    id: string;
    name: string;
}

interface RoomOption {
    id: string;
    name: string;
    capacity: number;
}

interface Conflict {
    type: 'teacher' | 'room';
    slotId1: string;
    slotId2: string;
    message: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const TIME_OPTIONS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];





// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function doTimesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
}

function getSlotHeight(start: string, end: string): number {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return ((e - s) / 60) * 48; // 48px per hour
}

function getSlotTop(start: string, baseHour: number): number {
    const s = timeToMinutes(start);
    const base = baseHour * 60;
    return ((s - base) / 60) * 48;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScheduleBuilderPage() {
    const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
    const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
    const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
    const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
    const [filterClass, setFilterClass] = useState<string | null>(null);
    const [filterTeacher, setFilterTeacher] = useState<string | null>(null);
    const [filterRoom, setFilterRoom] = useState<string | null>(null);

    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createDay, setCreateDay] = useState<number>(1);

    // Form state
    const [classId, setClassId] = useState<string | null>(null);
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [dayOfWeek, setDayOfWeek] = useState<string | null>('1');
    const [startTime, setStartTime] = useState<string | null>('09:00');
    const [endTime, setEndTime] = useState<string | null>('11:00');

    const COLORS = ['#7950f2', '#228be6', '#40c057', '#fd7e14', '#e64980', '#15aabf', '#be4bdb'];

    const fetchSchedule = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/schedules');
            if (!res.ok) return;
            const json = await res.json();
            const rows = json.data || [];
            setSchedule(rows.map((r: any) => ({
                id: r.id,
                classId: r.classId || '',
                className: r.className || '',
                teacherId: r.teacherId || '',
                teacherName: r.teacherName || '',
                roomId: r.roomId || '',
                roomName: r.roomName || '',
                dayOfWeek: r.dayOfWeek ?? 1,
                startTime: r.startTime || '09:00',
                endTime: r.endTime || '10:00',
                color: r.color || COLORS[Math.floor(Math.random() * COLORS.length)],
                termId: r.termId || '',
            })));
        } catch (err) {
            console.error('Failed to fetch schedule', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
        fetch('/api/classes').then(r => r.json()).then(j => {
            setClassOptions((j.data || []).map((c: any, i: number) => ({ id: c.id, name: c.name || c.id, course: '', color: COLORS[i % COLORS.length] })));
        }).catch(() => { });
        fetch('/api/users?role=teacher').then(r => r.json()).then(j => {
            setTeacherOptions((j.data || []).map((t: any) => ({ id: t.id, name: t.name || t.email || t.id })));
        }).catch(() => { });
        fetch('/api/rooms').then(r => r.json()).then(j => {
            setRoomOptions((j.data || []).map((r: any) => ({ id: r.id, name: r.name || r.id, capacity: r.capacity || 0 })));
        }).catch(() => { });
    }, [fetchSchedule]);

    // Detect conflicts
    const conflicts = useMemo(() => {
        const result: Conflict[] = [];

        for (let i = 0; i < schedule.length; i++) {
            for (let j = i + 1; j < schedule.length; j++) {
                const a = schedule[i];
                const b = schedule[j];

                if (a.dayOfWeek !== b.dayOfWeek) continue;
                if (!doTimesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

                // Same teacher conflict
                if (a.teacherId === b.teacherId) {
                    result.push({
                        type: 'teacher',
                        slotId1: a.id,
                        slotId2: b.id,
                        message: `${a.teacherName} tem conflito em ${DAYS_FULL[a.dayOfWeek]}: ${a.className} (${a.startTime}-${a.endTime}) e ${b.className} (${b.startTime}-${b.endTime})`,
                    });
                }

                // Same room conflict
                if (a.roomId === b.roomId) {
                    result.push({
                        type: 'room',
                        slotId1: a.id,
                        slotId2: b.id,
                        message: `${a.roomName} tem conflito em ${DAYS_FULL[a.dayOfWeek]}: ${a.className} (${a.startTime}-${a.endTime}) e ${b.className} (${b.startTime}-${b.endTime})`,
                    });
                }
            }
        }

        return result;
    }, [schedule]);

    const isSlotConflicting = (slotId: string) => {
        return conflicts.some(c => c.slotId1 === slotId || c.slotId2 === slotId);
    };

    const handleCreate = (day: number) => {
        setIsCreating(true);
        setSelectedSlot(null);
        setCreateDay(day);
        setClassId(null);
        setTeacherId(null);
        setRoomId(null);
        setDayOfWeek(String(day));
        setStartTime('09:00');
        setEndTime('11:00');
        openModal();
    };

    const handleEdit = (slot: ScheduleSlot) => {
        setIsCreating(false);
        setSelectedSlot(slot);
        setClassId(slot.classId);
        setTeacherId(slot.teacherId);
        setRoomId(slot.roomId);
        setDayOfWeek(String(slot.dayOfWeek));
        setStartTime(slot.startTime);
        setEndTime(slot.endTime);
        openModal();
    };

    const handleDelete = async (slotId: string) => {
        try {
            await fetch(`/api/schedules/${slotId}`, { method: 'DELETE' });
            fetchSchedule();
        } catch (err) { console.error('Failed to delete schedule', err); }
    };

    const handleSave = async () => {
        if (!classId || !teacherId || !roomId || !startTime || !endTime) return;
        const body = {
            classId,
            teacherId,
            roomId,
            dayOfWeek: Number(dayOfWeek),
            startTime,
            endTime,
        };
        try {
            if (isCreating) {
                await fetch('/api/schedules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            } else if (selectedSlot) {
                await fetch(`/api/schedules/${selectedSlot.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            }
            fetchSchedule();
        } catch (err) { console.error('Failed to save schedule', err); }
        closeModal();
    };

    // Filter schedule
    const filteredSchedule = schedule.filter(s => {
        if (filterClass && s.classId !== filterClass) return false;
        if (filterTeacher && s.teacherId !== filterTeacher) return false;
        if (filterRoom && s.roomId !== filterRoom) return false;
        return true;
    });

    // Get slots for a specific day
    const getSlotsForDay = (day: number) => {
        return filteredSchedule.filter(s => s.dayOfWeek === day).sort((a, b) =>
            timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );
    };

    const totalHoursPerWeek = schedule.reduce((acc, s) => {
        const duration = (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60;
        return acc + duration;
    }, 0);

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
                        <Title order={2}>Grade de Horários 📅</Title>
                        <Text c="dimmed">Configure horários das turmas</Text>
                    </div>
                </Group>
                <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => handleCreate(1)}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                >
                    Novo Horário
                </Button>
            </Group>

            {/* Stats & Conflicts */}
            <Group justify="space-between">
                <Group gap="md">
                    <Paper p="sm" radius="md" withBorder>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="blue">
                                <IconCalendar size={14} />
                            </ThemeIcon>
                            <Text size="sm">{schedule.length} aulas/semana</Text>
                        </Group>
                    </Paper>
                    <Paper p="sm" radius="md" withBorder>
                        <Group gap="xs">
                            <ThemeIcon size="sm" variant="light" color="green">
                                <IconClock size={14} />
                            </ThemeIcon>
                            <Text size="sm">{totalHoursPerWeek}h/semana</Text>
                        </Group>
                    </Paper>
                    {conflicts.length > 0 && (
                        <Paper p="sm" radius="md" withBorder bg="red.0">
                            <Group gap="xs">
                                <ThemeIcon size="sm" variant="filled" color="red">
                                    <IconAlertTriangle size={14} />
                                </ThemeIcon>
                                <Text size="sm" c="red">{conflicts.length} conflito(s)</Text>
                            </Group>
                        </Paper>
                    )}
                </Group>

                <Group gap="sm">
                    <Select
                        placeholder="Filtrar turma"
                        data={classOptions.map(c => ({ value: c.id, label: c.name }))}
                        value={filterClass}
                        onChange={setFilterClass}
                        clearable
                        size="xs"
                        style={{ width: 160 }}
                    />
                    <Select
                        placeholder="Filtrar professor"
                        data={teacherOptions.map(t => ({ value: t.id, label: t.name }))}
                        value={filterTeacher}
                        onChange={setFilterTeacher}
                        clearable
                        size="xs"
                        style={{ width: 160 }}
                    />
                    <Select
                        placeholder="Filtrar sala"
                        data={roomOptions.map(r => ({ value: r.id, label: r.name }))}
                        value={filterRoom}
                        onChange={setFilterRoom}
                        clearable
                        size="xs"
                        style={{ width: 140 }}
                    />
                </Group>
            </Group>

            {/* Conflicts List */}
            {conflicts.length > 0 && (
                <Paper p="md" radius="md" withBorder bg="red.0">
                    <Group gap="xs" mb="sm">
                        <IconAlertTriangle size={18} color="red" />
                        <Text fw={600} c="red">Conflitos Detectados</Text>
                    </Group>
                    <Stack gap="xs">
                        {conflicts.map((conflict, i) => (
                            <Paper key={i} p="xs" radius="sm" bg="white">
                                <Group gap="xs">
                                    <Badge color={conflict.type === 'teacher' ? 'orange' : 'violet'} size="xs">
                                        {conflict.type === 'teacher' ? 'Professor' : 'Sala'}
                                    </Badge>
                                    <Text size="sm">{conflict.message}</Text>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Paper>
            )}

            {/* Weekly Calendar Grid */}
            <Card shadow="sm" radius="md" p={0} withBorder style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: 600 }}>
                    {/* Header Row */}
                    <div style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', borderRight: '1px solid var(--mantine-color-gray-3)', background: '#f8f9fa', padding: 8 }}>
                        <Text size="xs" c="dimmed" ta="center">Hora</Text>
                    </div>
                    {DAYS.map((day, i) => (
                        <div
                            key={day}
                            style={{
                                borderBottom: '1px solid var(--mantine-color-gray-3)',
                                borderRight: i < 6 ? '1px solid var(--mantine-color-gray-3)' : undefined,
                                background: i === 0 || i === 6 ? '#f1f3f5' : '#f8f9fa',
                                padding: 8,
                                textAlign: 'center',
                            }}
                        >
                            <Text size="sm" fw={600}>{day}</Text>
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="blue"
                                onClick={() => handleCreate(i)}
                                mt={4}
                            >
                                <IconPlus size={12} />
                            </ActionIcon>
                        </div>
                    ))}

                    {/* Time Column + Day Columns */}
                    <div style={{
                        borderRight: '1px solid var(--mantine-color-gray-3)',
                        background: '#f8f9fa',
                    }}>
                        {HOURS.map(hour => (
                            <div
                                key={hour}
                                style={{
                                    height: 48,
                                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                                    padding: '2px 4px',
                                    display: 'flex',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <Text size="xs" c="dimmed">{hour}</Text>
                            </div>
                        ))}
                    </div>

                    {/* Day Columns with Slots */}
                    {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                        <div
                            key={dayIndex}
                            style={{
                                position: 'relative',
                                borderRight: dayIndex < 6 ? '1px solid var(--mantine-color-gray-3)' : undefined,
                                background: dayIndex === 0 || dayIndex === 6 ? '#fafafa' : 'white',
                            }}
                        >
                            {/* Hour grid lines */}
                            {HOURS.map(hour => (
                                <div
                                    key={hour}
                                    style={{
                                        height: 48,
                                        borderBottom: '1px solid var(--mantine-color-gray-2)',
                                    }}
                                />
                            ))}

                            {/* Slots */}
                            {getSlotsForDay(dayIndex).map(slot => {
                                const hasConflict = isSlotConflicting(slot.id);
                                return (
                                    <Tooltip
                                        key={slot.id}
                                        label={
                                            <div>
                                                <Text size="xs" fw={600}>{slot.className}</Text>
                                                <Text size="xs">{slot.teacherName}</Text>
                                                <Text size="xs">{slot.roomName}</Text>
                                                <Text size="xs">{slot.startTime} - {slot.endTime}</Text>
                                                {hasConflict && <Text size="xs" c="red">⚠️ Conflito!</Text>}
                                            </div>
                                        }
                                        position="right"
                                        withArrow
                                    >
                                        <Paper
                                            shadow="xs"
                                            radius="sm"
                                            p="xs"
                                            style={{
                                                position: 'absolute',
                                                top: getSlotTop(slot.startTime, 8),
                                                left: 4,
                                                right: 4,
                                                height: getSlotHeight(slot.startTime, slot.endTime),
                                                backgroundColor: slot.color,
                                                color: 'white',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                border: hasConflict ? '2px solid red' : undefined,
                                            }}
                                            onClick={() => handleEdit(slot)}
                                        >
                                            <Group gap={4} wrap="nowrap">
                                                <Text size="xs" fw={600} truncate style={{ flex: 1 }}>
                                                    {slot.className}
                                                </Text>
                                                {hasConflict && <IconAlertTriangle size={12} />}
                                            </Group>
                                            <Text size="xs" truncate opacity={0.9}>
                                                {slot.startTime}-{slot.endTime}
                                            </Text>
                                            {getSlotHeight(slot.startTime, slot.endTime) >= 64 && (
                                                <>
                                                    <Text size="xs" truncate opacity={0.8}>{slot.roomName}</Text>
                                                </>
                                            )}
                                        </Paper>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Legend */}
            <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} mb="sm">Legenda das Turmas</Text>
                <Group gap="md">
                    {classOptions.map(cls => (
                        <Group key={cls.id} gap="xs">
                            <ColorSwatch color={cls.color} size={16} />
                            <Text size="xs">{cls.name}</Text>
                        </Group>
                    ))}
                </Group>
            </Paper>

            {/* Slot Modal */}
            <Modal
                opened={modal}
                onClose={closeModal}
                title={isCreating ? 'Novo Horário' : 'Editar Horário'}
                centered
            >
                <Stack gap="md">
                    <Select
                        label="Turma"
                        placeholder="Selecione a turma"
                        data={classOptions.map(c => ({ value: c.id, label: `${c.name} (${c.course})` }))}
                        value={classId}
                        onChange={setClassId}
                        required
                    />

                    <Select
                        label="Professor"
                        placeholder="Selecione o professor"
                        data={teacherOptions.map(t => ({ value: t.id, label: t.name }))}
                        value={teacherId}
                        onChange={setTeacherId}
                        required
                    />

                    <Select
                        label="Sala"
                        placeholder="Selecione a sala"
                        data={roomOptions.map(r => ({ value: r.id, label: `${r.name} (${r.capacity} lugares)` }))}
                        value={roomId}
                        onChange={setRoomId}
                        required
                    />

                    <Select
                        label="Dia da Semana"
                        data={DAYS_FULL.map((d, i) => ({ value: String(i), label: d }))}
                        value={dayOfWeek}
                        onChange={setDayOfWeek}
                        required
                    />

                    <Grid>
                        <Grid.Col span={6}>
                            <Select
                                label="Hora Início"
                                data={TIME_OPTIONS.map(t => ({ value: t, label: t }))}
                                value={startTime}
                                onChange={setStartTime}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Hora Término"
                                data={TIME_OPTIONS.map(t => ({ value: t, label: t }))}
                                value={endTime}
                                onChange={setEndTime}
                                required
                            />
                        </Grid.Col>
                    </Grid>

                    <Group justify="space-between">
                        {!isCreating && (
                            <Button
                                variant="subtle"
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={() => {
                                    if (selectedSlot) handleDelete(selectedSlot.id);
                                    closeModal();
                                }}
                            >
                                Excluir
                            </Button>
                        )}
                        <Group ml="auto">
                            <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                            <Button
                                onClick={handleSave}
                                variant="gradient"
                                gradient={{ from: 'blue', to: 'cyan' }}
                            >
                                {isCreating ? 'Criar' : 'Salvar'}
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

