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
    IconArrowsExchange,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Enrollment {
    id: string;
    status: string;
    startDate: number;
    student?: { name: string };
    class?: { name: string };
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

export default function TransferenciasPage() {
    const { data: enrollments, isLoading, error, refetch } = useApi<Enrollment[]>('/api/enrollments');

    // Filter for potential transfers (active enrollments)
    const active = enrollments?.filter(e => e.status === 'active') || [];

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
                    <Title order={2}>Transferências</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Transferência</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconArrowsExchange size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Matriculas Elegíveis</Text>
                            <Text fw={700} size="lg">{active.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">Alunos com Matrícula Ativa</Text>
                {active.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Turma Atual</Table.Th>
                                <Table.Th>Data Matrícula</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {active.map((enrollment) => (
                                <Table.Tr key={enrollment.id}>
                                    <Table.Td><Text fw={500}>{enrollment.student?.name || '-'}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {enrollment.class?.name || '-'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(enrollment.startDate)}</Table.Td>
                                    <Table.Td>
                                        <Button size="xs" variant="light">Transferir</Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconArrowsExchange size={48} color="gray" />
                            <Text c="dimmed">Nenhuma matrícula ativa</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

