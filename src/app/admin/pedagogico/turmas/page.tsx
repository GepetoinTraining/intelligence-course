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
    Progress,
} from '@mantine/core';
import {
    IconSchool,
    IconPlus,
    IconUsers,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface ClassData {
    id: string;
    name: string;
    courseId: string | null;
    teacherId: string | null;
    maxStudents: number;
    currentStudents: number;
    status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
    startsAt: string | null;
    endsAt: string | null;
}

function formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    published: 'Publicada',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

export default function TurmasPage() {
    const { data: classes, isLoading, error, refetch } = useApi<ClassData[]>('/api/classes');

    const stats = {
        total: classes?.length || 0,
        active: classes?.filter(c => c.status === 'in_progress' || c.status === 'published').length || 0,
        totalStudents: classes?.reduce((sum, c) => sum + (c.currentStudents || 0), 0) || 0,
        avgOccupancy: classes?.length
            ? Math.round(classes.reduce((sum, c) => sum + (c.currentStudents / c.maxStudents * 100), 0) / classes.length)
            : 0,
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
                    <Text size="sm" c="dimmed">Pedagógico</Text>
                    <Title order={2}>Turmas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Turma
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Turmas</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconSchool size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{stats.active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Alunos</Text>
                            <Text fw={700} size="lg">{stats.totalStudents}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ocupação Média</Text>
                            <Text fw={700} size="lg">{stats.avgOccupancy}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Classes Table */}
            <Card withBorder p="md">
                {classes && classes.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Alunos</Table.Th>
                                <Table.Th>Ocupação</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {classes.map((cls) => {
                                const occupancy = cls.maxStudents > 0
                                    ? Math.round((cls.currentStudents / cls.maxStudents) * 100)
                                    : 0;
                                return (
                                    <Table.Tr key={cls.id}>
                                        <Table.Td>
                                            <Text fw={500}>{cls.name}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {cls.currentStudents}/{cls.maxStudents}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Progress
                                                    value={occupancy}
                                                    w={60}
                                                    size="sm"
                                                    color={occupancy >= 90 ? 'red' : occupancy >= 70 ? 'yellow' : 'green'}
                                                />
                                                <Text size="sm">{occupancy}%</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {formatDate(cls.startsAt)} - {formatDate(cls.endsAt)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={
                                                    cls.status === 'in_progress' ? 'green' :
                                                        cls.status === 'published' ? 'blue' :
                                                            cls.status === 'completed' ? 'teal' :
                                                                cls.status === 'cancelled' ? 'red' : 'gray'
                                                }
                                                variant="light"
                                            >
                                                {statusLabels[cls.status] || cls.status}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconSchool size={48} color="gray" />
                            <Text c="dimmed">Nenhuma turma encontrada</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Criar turma
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

