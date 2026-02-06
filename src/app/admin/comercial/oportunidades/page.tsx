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
    IconTarget,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string | null;
    status: string;
    interestedIn: string | null;
    createdAt: string;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
}

export default function OportunidadesPage() {
    const { data: leads, isLoading, error, refetch } = useApi<Lead[]>('/api/leads');

    const opportunities = leads?.filter(l =>
        ['qualified', 'negotiating'].includes(l.status)
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
                    <Text size="sm" c="dimmed">Comercial</Text>
                    <Title order={2}>Oportunidades</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Oportunidade</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconTarget size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{opportunities.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconTarget size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Qualificados</Text>
                            <Text fw={700} size="lg">{opportunities.filter(o => o.status === 'qualified').length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconTarget size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Negociando</Text>
                            <Text fw={700} size="lg">{opportunities.filter(o => o.status === 'negotiating').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {opportunities.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Lead</Table.Th>
                                <Table.Th>Contato</Table.Th>
                                <Table.Th>Interesse</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Data</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {opportunities.map((opp) => (
                                <Table.Tr key={opp.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size={32} radius="xl" color="blue">
                                                {opp.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <Text fw={500}>{opp.name}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{opp.email || opp.phone || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">{opp.interestedIn || opp.source || '-'}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={opp.status === 'negotiating' ? 'green' : 'yellow'} variant="light">
                                            {opp.status === 'qualified' ? 'Qualificado' : 'Negociando'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(opp.createdAt)}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconTarget size={48} color="gray" />
                            <Text c="dimmed">Nenhuma oportunidade encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

