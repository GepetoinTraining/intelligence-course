'use client';

import { useState, useEffect } from 'react';
import {
    Title,
    Text,
    Card,
    Stack,
    Group,
    Badge,
    Avatar,
    Paper,
    Button,
    Select,
    ActionIcon,
    Modal,
    Textarea,
    Tabs,
    SimpleGrid,
    TextInput,
    Table,
    Divider,
    ThemeIcon,
    Timeline,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconCalendarEvent,
    IconCheck,
    IconX,
    IconClock,
    IconUser,
    IconPhone,
    IconMapPin,
    IconChevronLeft,
    IconChevronRight,
    IconAlertCircle,
    IconBrandWhatsapp,
    IconMail,
    IconRefresh,
} from '@tabler/icons-react';
import Link from 'next/link';

// Status config

const statusColors: Record<string, string> = {
    confirmed: 'green',
    pending: 'yellow',
    completed: 'blue',
    no_show: 'red',
    cancelled: 'gray',
};

const statusLabels: Record<string, string> = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    completed: 'Concluído',
    no_show: 'Não compareceu',
    cancelled: 'Cancelado',
};

const outcomeColors: Record<string, string> = {
    enrolled: 'green',
    thinking: 'yellow',
    not_interested: 'red',
};

const outcomeLabels: Record<string, string> = {
    enrolled: 'Matriculou',
    thinking: 'Pensando',
    not_interested: 'Sem interesse',
};

// Calendar helper
const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface NoShowFollowup {
    attempts: number;
    lastAttempt: string;
    nextAction: string;
    notes: string;
}

interface Trial {
    id: string;
    leadId: string;
    leadName: string;
    leadPhone?: string;
    leadEmail?: string;
    date?: string;
    time: string;
    className: string;
    teacherName?: string;
    roomName: string;
    status: string;
    notes?: string;
    outcome?: string | null;
    noShowFollowup?: NoShowFollowup;
}

interface TrialCardProps {
    trial: Trial;
    onRecordOutcome: (trialId: string) => void;
    onNoShowFollowup?: (trialId: string) => void;
    showDate?: boolean;
}

function TrialCard({ trial, onRecordOutcome, onNoShowFollowup, showDate }: TrialCardProps) {
    return (
        <Paper p="md" withBorder radius="md">
            <Group justify="space-between" align="flex-start">
                <Group align="flex-start">
                    <Avatar size="lg" color="blue" radius="xl">
                        {trial.leadName.charAt(0)}
                    </Avatar>
                    <div>
                        <Group gap="sm">
                            <Text
                                fw={600}
                                component={Link}
                                href={`/staff/leads/${trial.leadId}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                {trial.leadName}
                            </Text>
                            <Badge color={statusColors[trial.status]}>
                                {statusLabels[trial.status]}
                            </Badge>
                            {'outcome' in trial && typeof trial.outcome === 'string' && (
                                <Badge
                                    color={outcomeColors[trial.outcome]}
                                    variant="light"
                                >
                                    {outcomeLabels[trial.outcome]}
                                </Badge>
                            )}
                        </Group>

                        <Group gap="lg" mt="xs">
                            <Group gap="xs">
                                <IconClock size={14} />
                                <Text size="sm">
                                    {showDate && 'date' in trial && `${trial.date} às `}
                                    {trial.time}
                                </Text>
                            </Group>
                            <Group gap="xs">
                                <IconUser size={14} />
                                <Text size="sm">{trial.className}</Text>
                            </Group>
                            <Group gap="xs">
                                <IconMapPin size={14} />
                                <Text size="sm">{trial.roomName}</Text>
                            </Group>
                        </Group>

                        {trial.leadPhone && (
                            <Group gap="xs" mt="xs">
                                <IconPhone size={14} />
                                <Text size="sm" c="dimmed">{trial.leadPhone}</Text>
                            </Group>
                        )}

                        {trial.notes && (
                            <Text size="sm" c="dimmed" mt="xs">
                                {trial.notes}
                            </Text>
                        )}

                        {/* No-show follow-up info */}
                        {trial.noShowFollowup && (
                            <Paper p="sm" mt="sm" bg="red.0" radius="sm">
                                <Group gap="xs" mb="xs">
                                    <IconAlertCircle size={14} color="red" />
                                    <Text size="xs" fw={500} c="red">Follow-up No-Show</Text>
                                </Group>
                                <Stack gap={4}>
                                    <Text size="xs">Tentativas: {trial.noShowFollowup.attempts}</Text>
                                    <Text size="xs">Última: {trial.noShowFollowup.lastAttempt}</Text>
                                    <Text size="xs">Notas: {trial.noShowFollowup.notes}</Text>
                                </Stack>
                            </Paper>
                        )}
                    </div>
                </Group>

                <Group>
                    {trial.status === 'pending' && (
                        <>
                            <Button variant="light" color="green" size="xs">
                                Confirmar
                            </Button>
                            <Button variant="light" color="red" size="xs">
                                Cancelar
                            </Button>
                        </>
                    )}
                    {trial.status === 'confirmed' && (
                        <Button
                            variant="filled"
                            size="xs"
                            onClick={() => onRecordOutcome(trial.id)}
                        >
                            Registrar Resultado
                        </Button>
                    )}
                    {trial.status === 'no_show' && onNoShowFollowup && (
                        <Button
                            variant="light"
                            size="xs"
                            color="orange"
                            leftSection={<IconRefresh size={14} />}
                            onClick={() => onNoShowFollowup(trial.id)}
                        >
                            Follow-up
                        </Button>
                    )}
                </Group>
            </Group>
        </Paper>
    );
}

export default function TrialsPage() {
    const [todayTrials, setTodayTrials] = useState<Trial[]>([]);
    const [upcomingTrials, setUpcomingTrials] = useState<Trial[]>([]);
    const [pastTrials, setPastTrials] = useState<Trial[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [outcomeOpened, { open: openOutcome, close: closeOutcome }] = useDisclosure(false);
    const [noShowOpened, { open: openNoShow, close: closeNoShow }] = useDisclosure(false);
    const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
    const [outcome, setOutcome] = useState<string | null>(null);
    const [noShowAction, setNoShowAction] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/trials');
                const json = await res.json();
                if (json.data) {
                    const today = new Date().toISOString().split('T')[0];
                    const todayTs = new Date(today).getTime();

                    const mapped: Trial[] = json.data.map((t: any) => {
                        const dateStr = t.scheduledDate
                            ? new Date(typeof t.scheduledDate === 'number' ? t.scheduledDate : t.scheduledDate).toISOString().split('T')[0]
                            : today;
                        return {
                            id: t.id,
                            leadId: t.leadId || '',
                            leadName: t.leadName || t.personId || 'Lead',
                            leadPhone: t.leadPhone || '',
                            leadEmail: t.leadEmail || '',
                            date: dateStr,
                            time: t.scheduledTime || '00:00',
                            className: t.className || '',
                            teacherName: t.teacherName || '',
                            roomName: t.roomName || '',
                            status: t.status || 'scheduled',
                            notes: t.notes || '',
                            outcome: t.outcome || null,
                        };
                    });

                    setTodayTrials(mapped.filter(t => t.date === today));
                    setUpcomingTrials(mapped.filter(t => t.date && t.date > today));
                    setPastTrials(mapped.filter(t => t.date && t.date < today));
                }
            } catch (err) {
                console.error('Failed to fetch trials:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleRecordOutcome = (trialId: string) => {
        setSelectedTrialId(trialId);
        openOutcome();
    };

    const handleNoShowFollowup = (trialId: string) => {
        setSelectedTrialId(trialId);
        openNoShow();
    };

    const handleSaveOutcome = () => {
        console.log('Saving outcome:', { trialId: selectedTrialId, outcome });
        closeOutcome();
        setOutcome(null);
        setSelectedTrialId(null);
    };

    const handleSaveNoShowFollowup = () => {
        console.log('Saving no-show followup:', { trialId: selectedTrialId, action: noShowAction });
        closeNoShow();
        setNoShowAction(null);
        setSelectedTrialId(null);
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // All trials for calendar
    const allTrials = [...todayTrials, ...upcomingTrials, ...pastTrials];

    // Get trials for a specific date
    const getTrialsForDate = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return allTrials.filter(t => t.date === dateStr);
    };

    // Render calendar
    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days = [];

        // Empty cells for days before first of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<td key={`empty-${i}`} style={{ padding: '8px' }}></td>);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const trials = getTrialsForDate(day);
            const isToday = new Date().toISOString().split('T')[0] ===
                `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            days.push(
                <td
                    key={day}
                    style={{
                        padding: '4px',
                        verticalAlign: 'top',
                        border: '1px solid var(--mantine-color-gray-2)',
                        backgroundColor: isToday ? 'var(--mantine-color-blue-0)' : undefined,
                        minHeight: 80,
                    }}
                >
                    <Text
                        size="sm"
                        fw={isToday ? 700 : 400}
                        c={isToday ? 'blue' : undefined}
                        mb="xs"
                    >
                        {day}
                    </Text>
                    <Stack gap={4}>
                        {trials.slice(0, 3).map((trial, i) => (
                            <Paper
                                key={i}
                                p={4}
                                bg={statusColors[trial.status] + '.1'}
                                radius="sm"
                                style={{ cursor: 'pointer' }}
                            >
                                <Text size="xs" lineClamp={1}>
                                    {trial.time} - {trial.leadName}
                                </Text>
                            </Paper>
                        ))}
                        {trials.length > 3 && (
                            <Text size="xs" c="dimmed">+{trials.length - 3} mais</Text>
                        )}
                    </Stack>
                </td>
            );
        }

        // Group into weeks
        const weeks = [];
        let week = [];
        for (let i = 0; i < days.length; i++) {
            week.push(days[i]);
            if (week.length === 7) {
                weeks.push(<tr key={weeks.length}>{week}</tr>);
                week = [];
            }
        }
        if (week.length > 0) {
            while (week.length < 7) {
                week.push(<td key={`empty-end-${week.length}`} style={{ padding: '8px' }}></td>);
            }
            weeks.push(<tr key={weeks.length}>{week}</tr>);
        }

        return weeks;
    };

    const noShowCount = pastTrials.filter(t => t.status === 'no_show').length;

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={1}>Trials</Title>
                    <Text c="dimmed" size="lg">
                        Gerencie aulas experimentais
                    </Text>
                </div>
                <Button
                    leftSection={<IconCalendarEvent size={18} />}
                    component={Link}
                    href="/staff/leads"
                >
                    Agendar Novo
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Text size="xl" fw={700} c="blue">{todayTrials.length}</Text>
                    <Text size="sm" c="dimmed">Hoje</Text>
                </Card>
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Text size="xl" fw={700} c="violet">{upcomingTrials.length}</Text>
                    <Text size="sm" c="dimmed">Próximos 7 dias</Text>
                </Card>
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Text size="xl" fw={700} c="green">
                        {pastTrials.filter(t => t.outcome === 'enrolled').length}
                    </Text>
                    <Text size="sm" c="dimmed">Matrículas (7 dias)</Text>
                </Card>
                <Card shadow="sm" radius="md" p="lg" withBorder>
                    <Text size="xl" fw={700} c="red">{noShowCount}</Text>
                    <Text size="sm" c="dimmed">No-shows (7 dias)</Text>
                </Card>
                <Card shadow="sm" radius="md" p="lg" withBorder bg={noShowCount > 0 ? 'orange.0' : undefined}>
                    <Text size="xl" fw={700} c="orange">{noShowCount}</Text>
                    <Text size="sm" c="dimmed">Pendentes Follow-up</Text>
                </Card>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs defaultValue="today">
                <Tabs.List>
                    <Tabs.Tab value="today" leftSection={<IconClock size={16} />}>
                        Hoje ({todayTrials.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="upcoming" leftSection={<IconCalendarEvent size={16} />}>
                        Próximos ({upcomingTrials.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="past" leftSection={<IconCheck size={16} />}>
                        Passados ({pastTrials.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="calendar" leftSection={<IconCalendarEvent size={16} />}>
                        Calendário
                    </Tabs.Tab>
                    <Tabs.Tab value="noshow" leftSection={<IconAlertCircle size={16} />} color="red">
                        No-Shows ({noShowCount})
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="today" pt="lg">
                    <Stack gap="md">
                        {todayTrials.length === 0 ? (
                            <Card shadow="sm" radius="md" p="xl" withBorder ta="center">
                                <Text c="dimmed">Nenhum trial agendado para hoje</Text>
                            </Card>
                        ) : (
                            todayTrials.map((trial) => (
                                <TrialCard
                                    key={trial.id}
                                    trial={trial}
                                    onRecordOutcome={handleRecordOutcome}
                                />
                            ))
                        )}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="upcoming" pt="lg">
                    <Stack gap="md">
                        {upcomingTrials.length === 0 ? (
                            <Card shadow="sm" radius="md" p="xl" withBorder ta="center">
                                <Text c="dimmed">Nenhum trial agendado para os próximos dias</Text>
                            </Card>
                        ) : (
                            upcomingTrials.map((trial) => (
                                <TrialCard
                                    key={trial.id}
                                    trial={trial as any}
                                    onRecordOutcome={handleRecordOutcome}
                                    showDate
                                />
                            ))
                        )}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="past" pt="lg">
                    <Stack gap="md">
                        {pastTrials.map((trial) => (
                            <TrialCard
                                key={trial.id}
                                trial={trial as any}
                                onRecordOutcome={handleRecordOutcome}
                                onNoShowFollowup={handleNoShowFollowup}
                                showDate
                            />
                        ))}
                    </Stack>
                </Tabs.Panel>


                <Tabs.Panel value="calendar" pt="lg">
                    <Card shadow="sm" radius="lg" p={0} withBorder style={{ overflow: 'hidden' }}>
                        {/* Calendar Header */}
                        <Paper p="lg" bg="var(--mantine-color-violet-filled)" radius={0}>
                            <Group justify="space-between">
                                <ActionIcon
                                    variant="white"
                                    onClick={prevMonth}
                                    size="lg"
                                    radius="xl"
                                >
                                    <IconChevronLeft size={20} />
                                </ActionIcon>
                                <Text fw={700} size="xl" c="white">
                                    {MONTH_NAMES[currentMonth]} {currentYear}
                                </Text>
                                <ActionIcon
                                    variant="white"
                                    onClick={nextMonth}
                                    size="lg"
                                    radius="xl"
                                >
                                    <IconChevronRight size={20} />
                                </ActionIcon>
                            </Group>
                        </Paper>

                        {/* Day Headers */}
                        <SimpleGrid cols={7} spacing={0}>
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                                <Paper
                                    key={day}
                                    p="sm"
                                    radius={0}
                                    bg={i === 0 || i === 6 ? 'var(--mantine-color-gray-1)' : 'white'}
                                    style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
                                >
                                    <Text
                                        ta="center"
                                        fw={600}
                                        size="sm"
                                        c={i === 0 || i === 6 ? 'dimmed' : undefined}
                                    >
                                        {day}
                                    </Text>
                                </Paper>
                            ))}
                        </SimpleGrid>

                        {/* Calendar Grid */}
                        <SimpleGrid cols={7} spacing={0}>
                            {(() => {
                                const daysInMonth = getDaysInMonth(currentYear, currentMonth);
                                const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
                                const cells = [];

                                // Empty cells for days before first of month
                                for (let i = 0; i < firstDay; i++) {
                                    cells.push(
                                        <Paper
                                            key={`empty-${i}`}
                                            p="md"
                                            radius={0}
                                            bg="var(--mantine-color-gray-0)"
                                            style={{
                                                minHeight: 100,
                                                borderBottom: '1px solid var(--mantine-color-gray-2)',
                                                borderRight: '1px solid var(--mantine-color-gray-2)',
                                            }}
                                        />
                                    );
                                }

                                // Days of month
                                for (let day = 1; day <= daysInMonth; day++) {
                                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const trials = allTrials.filter(t => t.date === dateStr);
                                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                    const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;

                                    cells.push(
                                        <Paper
                                            key={day}
                                            p="xs"
                                            radius={0}
                                            bg={isToday ? 'var(--mantine-color-blue-0)' : isWeekend ? 'var(--mantine-color-gray-0)' : 'white'}
                                            style={{
                                                minHeight: 100,
                                                borderBottom: '1px solid var(--mantine-color-gray-2)',
                                                borderRight: '1px solid var(--mantine-color-gray-2)',
                                                position: 'relative',
                                            }}
                                        >
                                            {/* Day Number */}
                                            <Group justify="space-between" mb="xs">
                                                <Badge
                                                    size="sm"
                                                    variant={isToday ? 'filled' : 'transparent'}
                                                    color={isToday ? 'blue' : 'gray'}
                                                    circle
                                                    styles={{ root: { fontWeight: isToday ? 700 : 500 } }}
                                                >
                                                    {day}
                                                </Badge>
                                                {trials.length > 0 && (
                                                    <Badge size="xs" color="violet" variant="filled">
                                                        {trials.length}
                                                    </Badge>
                                                )}
                                            </Group>

                                            {/* Trial Events */}
                                            <Stack gap={4}>
                                                {trials.slice(0, 3).map((trial, i) => (
                                                    <Paper
                                                        key={i}
                                                        p={6}
                                                        radius="sm"
                                                        bg={`var(--mantine-color-${statusColors[trial.status]}-1)`}
                                                        style={{
                                                            cursor: 'pointer',
                                                            borderLeft: `3px solid var(--mantine-color-${statusColors[trial.status]}-5)`,
                                                        }}
                                                    >
                                                        <Group gap={4} wrap="nowrap">
                                                            <Text size="xs" fw={600} c={`${statusColors[trial.status]}.8`}>
                                                                {trial.time}
                                                            </Text>
                                                            <Text size="xs" lineClamp={1} c="dark">
                                                                {trial.leadName.split(' ')[0]}
                                                            </Text>
                                                        </Group>
                                                    </Paper>
                                                ))}
                                                {trials.length > 3 && (
                                                    <Text size="xs" c="dimmed" ta="center">
                                                        +{trials.length - 3} mais
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Paper>
                                    );
                                }

                                return cells;
                            })()}
                        </SimpleGrid>

                        {/* Legend */}
                        <Paper p="md" bg="var(--mantine-color-gray-0)">
                            <Group justify="center" gap="xl">
                                <Group gap="xs">
                                    <Paper w={16} h={16} bg="green.4" radius="sm" />
                                    <Text size="sm">Confirmado</Text>
                                </Group>
                                <Group gap="xs">
                                    <Paper w={16} h={16} bg="yellow.4" radius="sm" />
                                    <Text size="sm">Pendente</Text>
                                </Group>
                                <Group gap="xs">
                                    <Paper w={16} h={16} bg="blue.4" radius="sm" />
                                    <Text size="sm">Concluído</Text>
                                </Group>
                                <Group gap="xs">
                                    <Paper w={16} h={16} bg="red.4" radius="sm" />
                                    <Text size="sm">No-show</Text>
                                </Group>
                            </Group>
                        </Paper>
                    </Card>
                </Tabs.Panel>


                <Tabs.Panel value="noshow" pt="lg">
                    <Stack gap="md">
                        <Card shadow="sm" radius="md" p="lg" withBorder bg="orange.0">
                            <Group>
                                <ThemeIcon size="lg" color="orange" variant="light">
                                    <IconAlertCircle size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={600}>Workflow de No-Show</Text>
                                    <Text size="sm" c="dimmed">
                                        Leads que não compareceram precisam de follow-up
                                    </Text>
                                </div>
                            </Group>
                        </Card>

                        {pastTrials.filter(t => t.status === 'no_show').map((trial) => (
                            <TrialCard
                                key={trial.id}
                                trial={trial as any}
                                onRecordOutcome={handleRecordOutcome}
                                onNoShowFollowup={handleNoShowFollowup}
                                showDate
                            />
                        ))}

                        {pastTrials.filter(t => t.status === 'no_show').length === 0 && (
                            <Card shadow="sm" radius="md" p="xl" withBorder ta="center">
                                <ThemeIcon size="xl" color="green" variant="light" mb="md">
                                    <IconCheck size={24} />
                                </ThemeIcon>
                                <Text c="dimmed">Nenhum no-show pendente! 🎉</Text>
                            </Card>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            {/* Outcome Modal */}
            <Modal
                opened={outcomeOpened}
                onClose={closeOutcome}
                title="Registrar Resultado do Trial"
                size="md"
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        Como foi a aula experimental?
                    </Text>

                    <Select
                        label="Resultado"
                        placeholder="Selecione"
                        value={outcome}
                        onChange={setOutcome}
                        data={[
                            { value: 'enrolled', label: '✅ Matriculou' },
                            { value: 'thinking', label: '🤔 Vai pensar' },
                            { value: 'not_interested', label: '❌ Sem interesse' },
                            { value: 'no_show', label: '👻 Não compareceu' },
                        ]}
                        required
                    />

                    <Textarea
                        label="Observações"
                        placeholder="Feedback do professor, impressões do aluno, etc."
                        rows={3}
                    />

                    {outcome === 'thinking' && (
                        <TextInput
                            label="Data do follow-up"
                            type="date"
                            description="Quando devemos entrar em contato novamente?"
                        />
                    )}

                    {outcome === 'no_show' && (
                        <Select
                            label="Ação"
                            placeholder="O que fazer?"
                            data={[
                                { value: 'reschedule', label: 'Remarcar trial' },
                                { value: 'contact', label: 'Entrar em contato' },
                                { value: 'close', label: 'Encerrar lead' },
                            ]}
                        />
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeOutcome}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveOutcome}>
                            Salvar
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* No-Show Follow-up Modal */}
            <Modal
                opened={noShowOpened}
                onClose={closeNoShow}
                title="Follow-up No-Show"
                size="md"
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        O lead não compareceu à aula experimental. Como deseja proceder?
                    </Text>

                    <Select
                        label="Ação"
                        placeholder="Selecione a próxima ação"
                        value={noShowAction}
                        onChange={setNoShowAction}
                        data={[
                            { value: 'reschedule', label: '📅 Remarcar trial' },
                            { value: 'whatsapp', label: '💬 Enviar WhatsApp' },
                            { value: 'call', label: '📞 Ligar novamente' },
                            { value: 'email', label: '📧 Enviar email' },
                            { value: 'close', label: '❌ Encerrar lead' },
                        ]}
                        required
                    />

                    {noShowAction === 'reschedule' && (
                        <>
                            <TextInput label="Nova data" type="date" required />
                            <TextInput label="Novo horário" type="time" required />
                        </>
                    )}

                    {(noShowAction === 'whatsapp' || noShowAction === 'call' || noShowAction === 'email') && (
                        <Textarea
                            label="Notas do contato"
                            placeholder="O que foi dito, resultado do contato..."
                            rows={3}
                        />
                    )}

                    {noShowAction === 'close' && (
                        <Select
                            label="Motivo do encerramento"
                            placeholder="Selecione"
                            data={[
                                { value: 'no_response', label: 'Sem resposta' },
                                { value: 'not_interested', label: 'Perdeu interesse' },
                                { value: 'competitor', label: 'Foi para concorrente' },
                                { value: 'other', label: 'Outro' },
                            ]}
                        />
                    )}

                    <Divider />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeNoShow}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveNoShowFollowup} disabled={!noShowAction}>
                            Salvar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

