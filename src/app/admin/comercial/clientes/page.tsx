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
    IconUsers,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface User {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    createdAt: number;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

export default function ClientesPage() {
    const { data: users, isLoading, error, refetch } = useApi<User[]>('/api/users?role=parent');

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

    const clients = users || [];

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Comercial</Text>
                <Title order={2}>Clientes</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Clientes</Text>
                            <Text fw={700} size="lg">{clients.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {clients.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>E-mail</Table.Th>
                                <Table.Th>Telefone</Table.Th>
                                <Table.Th>Cadastro</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {clients.map((client) => (
                                <Table.Tr key={client.id}>
                                    <Table.Td><Text fw={500}>{client.name || 'Sem nome'}</Text></Table.Td>
                                    <Table.Td>{client.email}</Table.Td>
                                    <Table.Td>{client.phone || '-'}</Table.Td>
                                    <Table.Td>{formatDate(client.createdAt)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUsers size={48} color="gray" />
                            <Text c="dimmed">Nenhum cliente encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

