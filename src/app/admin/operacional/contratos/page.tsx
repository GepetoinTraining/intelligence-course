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
    IconFileText,
    IconPlus,
    IconAlertCircle,
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

const statusLabels: Record<string, string> = {
    active: 'Ativo',
    pending: 'Pendente',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    suspended: 'Suspenso',
};

export default function ContratosPage() {
    const { data: enrollments, isLoading, error, refetch } = useApi<Enrollment[]>('/api/enrollments');

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

    const contracts = enrollments || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Operacional</Text>
                    <Title order={2}>Contratos</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Contrato</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{contracts.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="lg">{contracts.filter(c => c.status === 'active').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {contracts.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Aluno</Table.Th>
                                <Table.Th>Turma</Table.Th>
                                <Table.Th>Início</Table.Th>
                                <Table.Th>Validade</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {contracts.map((contract) => (
                                <Table.Tr key={contract.id}>
                                    <Table.Td><Text fw={500}>{contract.student?.name || '-'}</Text></Table.Td>
                                    <Table.Td>{contract.class?.name || '-'}</Table.Td>
                                    <Table.Td>{formatDate(contract.enrolledAt)}</Table.Td>
                                    <Table.Td>{formatDate(contract.expiresAt)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                contract.status === 'active' ? 'green' :
                                                    contract.status === 'pending' ? 'yellow' :
                                                        contract.status === 'completed' ? 'blue' : 'gray'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[contract.status] || contract.status}
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
                            <Text c="dimmed">Nenhum contrato encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

