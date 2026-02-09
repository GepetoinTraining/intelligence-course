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
    Avatar,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconFileText,
    IconPlus,
    IconCheck,
    IconClock,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Enrollment {
    id: string;
    userId: string;
    classId: string;
    status: 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled';
    enrolledAt: number;
    startsAt: number | null;
    endsAt: number | null;
    student?: {
        id: string;
        name: string | null;
        email: string;
    };
    class?: {
        id: string;
        name: string;
    };
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    active: 'Ativa',
    completed: 'Concluída',
    suspended: 'Suspensa',
    cancelled: 'Cancelada',
};

export default function MatriculasPage() {
    const { data: enrollments, isLoading, error, refetch } = useApi<Enrollment[]>('/api/enrollments');

    const stats = {
        total: enrollments?.length || 0,
        active: enrollments?.filter(e => e.status === 'active').length || 0,
        pending: enrollments?.filter(e => e.status === 'pending').length || 0,
        completed: enrollments?.filter(e => e.status === 'completed').length || 0,
    };

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Operacional</Text>
                    <Title order={2}>Matrículas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} component="a" href="/admin/operacional/matriculas/nova">
                    Nova Matrícula
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{stats.active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="lg">{stats.pending}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídas</Text>
                            <Text fw={700} size="lg">{stats.completed}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Enrollments Table */}
            <Card withBorder p="md">
                {enrollments && enrollments.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Início</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {enrollments.map((enrollment) => (
                                <Table.Tr key={enrollment.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size={32} radius="xl" color="blue">
                                                {enrollment.student?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                            </Avatar>
                                            <div>
                                                <Text fw={500}>{enrollment.student?.name || 'N/A'}</Text>
                                                <Text size="xs" c="dimmed">{enrollment.student?.email}</Text>
                                            </div>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>{enrollment.class?.name || '-'}</Table.Td>
                                    <Table.Td>{formatDate(enrollment.enrolledAt)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                enrollment.status === 'active' ? 'green' :
                                                    enrollment.status === 'pending' ? 'yellow' :
                                                        enrollment.status === 'completed' ? 'teal' :
                                                            enrollment.status === 'cancelled' ? 'red' : 'gray'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[enrollment.status] || enrollment.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconFileText size={48} color="gray" />
                            <Text c="dimmed">Nenhuma matrícula encontrada</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Criar matrícula
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

