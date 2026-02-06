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
    Table,
    Loader,
    Alert,
    Center,
    Button,
} from '@mantine/core';
import {
    IconCheck,
    IconX,
    IconAlertCircle,
    IconUserCheck,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface AttendanceRecord {
    id: string;
    userId: string;
    sessionId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    arrivedAt: number | null;
    markedAt: number | null;
    session?: {
        sessionDate: number;
        title: string | null;
    };
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    present: 'Presente',
    absent: 'Ausente',
    late: 'Atrasado',
    excused: 'Justificado',
};

export default function PresencaPage() {
    const { data: records, isLoading, error, refetch } = useApi<AttendanceRecord[]>('/api/attendance?userId=current');

    const attendance = records || [];

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

    const stats = {
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
    };

    const attendanceRate = attendance.length > 0
        ? Math.round((stats.present / attendance.length) * 100)
        : 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Pedagógico</Text>
                <Title order={2}>Presença</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Presentes</Text>
                            <Text fw={700} size="lg">{stats.present}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconX size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ausentes</Text>
                            <Text fw={700} size="lg">{stats.absent}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconUserCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Atrasados</Text>
                            <Text fw={700} size="lg">{stats.late}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconUserCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Taxa</Text>
                            <Text fw={700} size="lg">{attendanceRate}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {attendance.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aula</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {attendance.map((record) => (
                                <Table.Tr key={record.id}>
                                    <Table.Td>{record.session?.title || '-'}</Table.Td>
                                    <Table.Td>{formatDate(record.session?.sessionDate || null)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                record.status === 'present' ? 'green' :
                                                    record.status === 'late' ? 'yellow' :
                                                        record.status === 'excused' ? 'blue' : 'red'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[record.status] || record.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUserCheck size={48} color="gray" />
                            <Text c="dimmed">Nenhum registro de presença</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

