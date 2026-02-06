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
    IconUserMinus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Enrollment {
    id: string;
    status: string;
    startDate: number;
    endDate: number | null;
    student?: { name: string };
    class?: { name: string };
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

export default function CancelamentosPage() {
    const { data: enrollments, isLoading, error, refetch } = useApi<Enrollment[]>('/api/enrollments');

    // Filter cancelled enrollments
    const cancelled = enrollments?.filter(e => e.status === 'cancelled') || [];

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
            <div>
                <Text size="sm" c="dimmed">Operacional</Text>
                <Title order={2}>Cancelamentos</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconUserMinus size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Cancelamentos</Text>
                            <Text fw={700} size="lg">{cancelled.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {cancelled.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Data Cancelamento</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {cancelled.map((enrollment) => (
                                <Table.Tr key={enrollment.id}>
                                    <Table.Td><Text fw={500}>{enrollment.student?.name || '-'}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {enrollment.class?.name || '-'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(enrollment.endDate)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUserMinus size={48} color="gray" />
                            <Text c="dimmed">Nenhum cancelamento encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

