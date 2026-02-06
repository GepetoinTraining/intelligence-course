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
    IconQrcode,
    IconAlertCircle,
    IconCheck,
    IconX,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface AttendanceRecord {
    id: string;
    userId: string;
    sessionId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    arrivedAt: number | null;
    markedAt: number | null;
    student?: {
        name: string;
        email: string;
    };
    session?: {
        sessionDate: number;
        title: string | null;
    };
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

function formatTime(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const statusLabels: Record<string, string> = {
    present: 'Presente',
    absent: 'Ausente',
    late: 'Atrasado',
    excused: 'Justificado',
};

export default function CheckinPage() {
    // Without specific session ID, this shows empty - but page structure is ready
    const { data: records, isLoading, error, refetch } = useApi<AttendanceRecord[]>('/api/attendance?userId=current');

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

    const attendance = records || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Operacional</Text>
                    <Title order={2}>Check-in</Title>
                </div>
                <Button leftSection={<IconQrcode size={16} />}>Escanear QR Code</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Presentes</Text>
                            <Text fw={700} size="lg">{attendance.filter(a => a.status === 'present').length}</Text>
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
                            <Text fw={700} size="lg">{attendance.filter(a => a.status === 'absent').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {attendance.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Aula</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Entrada</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {attendance.map((record) => (
                                <Table.Tr key={record.id}>
                                    <Table.Td><Text fw={500}>{record.student?.name || '-'}</Text></Table.Td>
                                    <Table.Td>{record.session?.title || '-'}</Table.Td>
                                    <Table.Td>{formatDate(record.session?.sessionDate || null)}</Table.Td>
                                    <Table.Td>{formatTime(record.arrivedAt)}</Table.Td>
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
                            <IconQrcode size={48} color="gray" />
                            <Text c="dimmed">Nenhum registro de presença</Text>
                            <Text size="sm" c="dimmed">Use o QR Code para fazer check-in</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

