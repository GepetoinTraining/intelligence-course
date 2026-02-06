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
    IconUsers,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl: string | null;
    createdAt: number;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const roleLabels: Record<string, string> = {
    student: 'Aluno',
    teacher: 'Professor',
    staff: 'Colaborador',
    admin: 'Administrador',
    owner: 'Proprietário',
    accountant: 'Contador',
};

export default function UsuariosPage() {
    const { data: users, isLoading, error, refetch } = useApi<User[]>('/api/users');

    const stats = {
        total: users?.length || 0,
        staff: users?.filter(u => ['staff', 'admin', 'owner', 'teacher'].includes(u.role)).length || 0,
        students: users?.filter(u => u.role === 'student').length || 0,
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
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Usuários</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Usuário
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Usuários</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Equipe</Text>
                            <Text fw={700} size="lg">{stats.staff}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Alunos</Text>
                            <Text fw={700} size="lg">{stats.students}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Users Table */}
            <Card withBorder p="md">
                {users && users.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Usuário</Table.Th>
                                <Table.Th>Email</Table.Th>
                                <Table.Th>Perfil</Table.Th>
                                <Table.Th>Cadastro</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {users.map((user) => (
                                <Table.Tr key={user.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size={32} radius="xl" src={user.avatarUrl} color="blue">
                                                {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                            </Avatar>
                                            <Text fw={500}>{user.name || 'Sem nome'}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">{user.email}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {roleLabels[user.role] || user.role}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(user.createdAt)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUsers size={48} color="gray" />
                            <Text c="dimmed">Nenhum usuário encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Cadastrar usuário
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

