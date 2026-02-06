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
    IconClock,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Attendance {
    id: string;
    studentId: string;
    sessionId: string;
    status: string;
    checkInAt: number | null;
    checkOutAt: number | null;
}

function formatTime(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

export default function PontoPage() {
    const { data: attendance, isLoading, error, refetch } = useApi<Attendance[]>('/api/attendance');

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

    const records = attendance || [];
    const today = new Date().toLocaleDateString('pt-BR');
    const todayRecords = records.filter(r => r.checkInAt && formatDate(r.checkInAt) === today);

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">RH</Text>
                <Title order={2}>Registro de Ponto</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Registros</Text>
                            <Text fw={700} size="lg">{records.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Hoje</Text>
                            <Text fw={700} size="lg">{todayRecords.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {records.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Entrada</Table.Th>
                                <Table.Th>Saída</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {records.slice(0, 20).map((record) => (
                                <Table.Tr key={record.id}>
                                    <Table.Td>{formatDate(record.checkInAt)}</Table.Td>
                                    <Table.Td>{formatTime(record.checkInAt)}</Table.Td>
                                    <Table.Td>{formatTime(record.checkOutAt)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={record.status === 'present' ? 'green' : 'gray'}
                                            variant="light"
                                        >
                                            {record.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconClock size={48} color="gray" />
                            <Text c="dimmed">Nenhum registro de ponto</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

