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
    IconCalendarEvent,
    IconPlus,
    IconAlertCircle,
    IconUsers,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Campaign {
    id: string;
    name: string;
    campaignType: string;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
    actualLeads: number | null;
    actualEnrollments: number | null;
}

function formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
}

export default function EventosPage() {
    const { data: campaigns, isLoading, error, refetch } = useApi<Campaign[]>('/api/campaigns');

    const events = campaigns?.filter(c =>
        ['event', 'workshop', 'open_house', 'fair'].includes(c.campaignType)
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
                    <Text size="sm" c="dimmed">Marketing</Text>
                    <Title order={2}>Eventos</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Evento</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconCalendarEvent size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Eventos</Text>
                            <Text fw={700} size="lg">{events.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Leads Gerados</Text>
                            <Text fw={700} size="lg">{events.reduce((sum, e) => sum + (e.actualLeads || 0), 0)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {events.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Evento</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Leads</Table.Th>
                                <Table.Th>Matrículas</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {events.map((event) => (
                                <Table.Tr key={event.id}>
                                    <Table.Td><Text fw={500}>{event.name}</Text></Table.Td>
                                    <Table.Td><Badge variant="light" size="sm">{event.campaignType}</Badge></Table.Td>
                                    <Table.Td>{formatDate(event.startsAt)}</Table.Td>
                                    <Table.Td>{event.actualLeads || 0}</Table.Td>
                                    <Table.Td>{event.actualEnrollments || 0}</Table.Td>
                                    <Table.Td>
                                        <Badge color={event.status === 'active' ? 'green' : event.status === 'completed' ? 'teal' : 'gray'} variant="light">
                                            {event.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconCalendarEvent size={48} color="gray" />
                            <Text c="dimmed">Nenhum evento encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

