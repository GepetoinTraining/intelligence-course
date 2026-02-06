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

interface StaffContract {
    id: string;
    userId: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    contractType: string;
    salaryCents: number | null;
    status: 'active' | 'suspended' | 'terminated' | 'pending';
    startsAt: number | null;
}

function formatCurrency(cents: number | null): string {
    if (!cents) return '-';
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number | null): string {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    terminated: 'Desligado',
    pending: 'Pendente',
};

const departmentLabels: Record<string, string> = {
    admin: 'Administrativo',
    academics: 'Acadêmico',
    hr: 'RH',
    finance: 'Financeiro',
    marketing: 'Marketing',
    operations: 'Operações',
};

const contractTypeLabels: Record<string, string> = {
    clt: 'CLT',
    pj: 'PJ',
    freelancer: 'Freelancer',
    intern: 'Estágio',
    volunteer: 'Voluntário',
};

export default function ColaboradoresPage() {
    const { data: contracts, isLoading, error, refetch } = useApi<StaffContract[]>('/api/staff-contracts');

    const stats = {
        total: contracts?.length || 0,
        active: contracts?.filter(c => c.status === 'active').length || 0,
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
                    <Text size="sm" c="dimmed">RH</Text>
                    <Title order={2}>Colaboradores</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Colaborador
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
                            <Text size="xs" c="dimmed">Total</Text>
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
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="lg">{stats.active}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Staff Table */}
            <Card withBorder p="md">
                {contracts && contracts.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Cargo</Table.Th>
                                <Table.Th>Departamento</Table.Th>
                                <Table.Th>Contrato</Table.Th>
                                <Table.Th>Salário</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {contracts.map((contract) => (
                                <Table.Tr key={contract.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size={32} radius="xl" src={contract.avatarUrl} color="blue">
                                                {contract.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                            </Avatar>
                                            <div>
                                                <Text fw={500}>{contract.name || '-'}</Text>
                                                <Text size="xs" c="dimmed">{contract.email}</Text>
                                            </div>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>{contract.jobTitle || '-'}</Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {departmentLabels[contract.department || ''] || contract.department}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline" size="sm">
                                            {contractTypeLabels[contract.contractType] || contract.contractType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatCurrency(contract.salaryCents)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                contract.status === 'active' ? 'green' :
                                                    contract.status === 'pending' ? 'yellow' :
                                                        contract.status === 'terminated' ? 'red' : 'gray'
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
                            <IconUsers size={48} color="gray" />
                            <Text c="dimmed">Nenhum colaborador encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Cadastrar colaborador
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

