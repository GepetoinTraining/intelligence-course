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
    IconBeach,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface LeaveRequest {
    id: string;
    userId: string;
    userName: string | null;
    leaveType: string;
    startDate: number;
    endDate: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    reason: string | null;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

function formatPeriod(start: number, end: number): string {
    return `${formatDate(start)} - ${formatDate(end)}`;
}

const leaveTypeLabels: Record<string, string> = {
    vacation: 'Férias',
    sick: 'Atestado',
    personal: 'Pessoal',
    maternity: 'Maternidade',
    paternity: 'Paternidade',
    unpaid: 'Sem Remuneração',
    other: 'Outro',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
};

export default function FeriasPage() {
    const { data: leaves, isLoading, error, refetch } = useApi<LeaveRequest[]>('/api/staff-leave');

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

    const leaveRequests = leaves || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">RH</Text>
                    <Title order={2}>Férias e Afastamentos</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Pedido</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBeach size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{leaveRequests.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconBeach size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="lg">{leaveRequests.filter(l => l.status === 'pending').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {leaveRequests.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {leaveRequests.map((leave) => (
                                <Table.Tr key={leave.id}>
                                    <Table.Td><Text fw={500}>{leave.userName || '-'}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {leaveTypeLabels[leave.leaveType] || leave.leaveType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatPeriod(leave.startDate, leave.endDate)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                leave.status === 'approved' ? 'green' :
                                                    leave.status === 'pending' ? 'yellow' : 'red'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[leave.status] || leave.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBeach size={48} color="gray" />
                            <Text c="dimmed">Nenhum pedido encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

