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
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    interestedIn: string | null;
    createdAt: string;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function PropostasPage() {
    const { data: leads, isLoading, error, refetch } = useApi<Lead[]>('/api/leads');

    const proposals = leads?.filter(l => l.status === 'negotiating') || [];

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

    // Add mock proposal values
    const proposalsWithValue = proposals.map((p, i) => ({
        ...p,
        proposalValue: 5000 + (i * 1500),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comercial</Text>
                    <Title order={2}>Propostas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Proposta</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{proposalsWithValue.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Valor Total</Text>
                            <Text fw={700} size="lg">{formatCurrency(proposalsWithValue.reduce((sum, p) => sum + p.proposalValue, 0))}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {proposalsWithValue.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Cliente</Table.Th>
                                <Table.Th>Interesse</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Validade</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {proposalsWithValue.map((prop) => (
                                <Table.Tr key={prop.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size={32} radius="xl" color="blue">
                                                {prop.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <div>
                                                <Text fw={500}>{prop.name}</Text>
                                                <Text size="xs" c="dimmed">{prop.email || prop.phone}</Text>
                                            </div>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td><Badge variant="light" size="sm">{prop.interestedIn || '-'}</Badge></Table.Td>
                                    <Table.Td>{formatCurrency(prop.proposalValue)}</Table.Td>
                                    <Table.Td>{formatDate(prop.expiresAt)}</Table.Td>
                                    <Table.Td>
                                        <Badge color="yellow" variant="light">Em negociação</Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconFileText size={48} color="gray" />
                            <Text c="dimmed">Nenhuma proposta encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

