'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Table,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconCalendar,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Schedule {
    id: string;
    classId: string;
    roomId: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    validFrom: number | null;
    validUntil: number | null;
}

const dayLabels: Record<number, string> = {
    0: 'Domingo',
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado',
};

export default function CalendarioPage() {
    const { data: schedules, isLoading, error, refetch } = useApi<Schedule[]>('/api/schedules');

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    const allSchedules = schedules || [];

    // Group by day
    const byDay = allSchedules.reduce((acc, s) => {
        acc[s.dayOfWeek] = (acc[s.dayOfWeek] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Agenda</Text>
                    <Title order={2}>Calendário</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Horário</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allSchedules.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allSchedules.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Dia</Table.Th>
                                <Table.Th>Horário</Table.Th>
                                <Table.Th>Sala</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allSchedules.map((schedule) => (
                                <Table.Tr key={schedule.id}>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{schedule.startTime} - {schedule.endTime}</Table.Td>
                                    <Table.Td>{schedule.roomId || '-'}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCalendar size={48} color="gray" />
                            <Text c="dimmed">Nenhum horário encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

