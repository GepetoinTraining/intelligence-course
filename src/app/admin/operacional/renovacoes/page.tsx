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
    IconRefresh,
    IconPlus,
    IconAlertCircle,
    IconClock,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Enrollment {
    id: string;
    status: string;
    enrolledAt: number;
    expiresAt: number | null;
    student?: { name: string; email: string };
    class?: { name: string };
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

export default function RenovacoesPage() {
    const { data: enrollments, isLoading, error, refetch } = useApi<Enrollment[]>('/api/enrollments');

    // Filter for expiring soon (within 30 days)
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;
    const expiringSoon = enrollments?.filter(e =>
        e.status === 'active' && e.expiresAt && e.expiresAt <= now + thirtyDays && e.expiresAt > now
    ) || [];

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
                    <Text size="sm" c="dimmed">Operacional</Text>
                    <Title order={2}>Renovações</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Renovação</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Expirando</Text>
                            <Text fw={700} size="lg">{expiringSoon.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {expiringSoon.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Início</Table.Th>
                                <Table.Th>Expira em</Table.Th>
                                <Table.Th>Ação</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {expiringSoon.map((enrollment) => (
                                <Table.Tr key={enrollment.id}>
                                    <Table.Td><Text fw={500}>{enrollment.student?.name || '-'}</Text></Table.Td>
                                    <Table.Td>{enrollment.class?.name || '-'}</Table.Td>
                                    <Table.Td>{formatDate(enrollment.enrolledAt)}</Table.Td>
                                    <Table.Td>
                                        <Badge color="yellow" variant="light">
                                            {formatDate(enrollment.expiresAt)}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />}>
                                            Renovar
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconRefresh size={48} color="gray" />
                            <Text c="dimmed">Nenhuma renovação pendente</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

