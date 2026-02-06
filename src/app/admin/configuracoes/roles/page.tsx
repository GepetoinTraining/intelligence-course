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
    IconShield,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Role {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    hierarchyLevel: number;
    category: string | null;
    department: string | null;
    isActive: boolean;
    permissions: string[];
}

export default function RolesPage() {
    const { data, isLoading, error, refetch } = useApi<{ roles: Role[] }>('/api/roles');

    const roles = data?.roles || [];

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

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Funções e Permissões</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Função</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconShield size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Funções</Text>
                            <Text fw={700} size="lg">{roles.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {roles.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Slug</Table.Th>
                                <Table.Th>Nível</Table.Th>
                                <Table.Th>Permissões</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {roles.map((role) => (
                                <Table.Tr key={role.id}>
                                    <Table.Td>
                                        <Text fw={500}>{role.name}</Text>
                                        {role.description && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>{role.description}</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline" size="sm">{role.slug}</Badge>
                                    </Table.Td>
                                    <Table.Td>{role.hierarchyLevel}</Table.Td>
                                    <Table.Td>{role.permissions?.length || 0}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={role.isActive ? 'green' : 'gray'}
                                            variant="light"
                                        >
                                            {role.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconShield size={48} color="gray" />
                            <Text c="dimmed">Nenhuma função encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

