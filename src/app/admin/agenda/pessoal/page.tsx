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
    IconUser,
    IconAlertCircle,
    IconCalendar,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Schedule {
    id: string;
    classId: string;
    roomId: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
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

export default function PessoalPage() {
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

    const mySchedules = schedules || [];
    const today = new Date().getDay();
    const todaySchedules = mySchedules.filter(s => s.dayOfWeek === today);

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Agenda</Text>
                <Title order={2}>Pessoal</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Semana</Text>
                            <Text fw={700} size="lg">{mySchedules.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUser size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Hoje</Text>
                            <Text fw={700} size="lg">{todaySchedules.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">Meus Compromissos</Text>
                {mySchedules.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Dia</Table.Th>
                                <Table.Th>Horário</Table.Th>
                                <Table.Th>Local</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {mySchedules.map((schedule) => (
                                <Table.Tr key={schedule.id}>
                                    <Table.Td>
                                        <Badge
                                            color={schedule.dayOfWeek === today ? 'blue' : 'gray'}
                                            variant="light"
                                            size="sm"
                                        >
                                            {dayLabels[schedule.dayOfWeek]}
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
                            <IconUser size={48} color="gray" />
                            <Text c="dimmed">Nenhum compromisso encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

