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
    Center,
} from '@mantine/core';
import {
    IconLock,
    IconShieldCheck,
    IconKey,
} from '@tabler/icons-react';

interface SecurityEvent {
    id: string;
    event: string;
    timestamp: Date;
    status: 'success' | 'warning' | 'error';
}

export default function SegurancaPage() {
    // Mock security status
    const securityFeatures = [
        { name: 'Autenticação 2FA', status: 'active', icon: IconShieldCheck },
        { name: 'SSL/TLS', status: 'active', icon: IconLock },
        { name: 'API Keys', status: 'configured', icon: IconKey },
    ];

    const recentEvents: SecurityEvent[] = [
        { id: '1', event: 'Login bem-sucedido', timestamp: new Date(), status: 'success' },
        { id: '2', event: 'Sessão iniciada', timestamp: new Date(), status: 'success' },
    ];

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Configurações</Text>
                <Title order={2}>Segurança</Title>
            </div>

            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                {securityFeatures.map((feature) => (
                    <Card key={feature.name} withBorder p="md">
                        <Group>
                            <ThemeIcon variant="light" color="green" size="lg">
                                <feature.icon size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={500}>{feature.name}</Text>
                                <Badge
                                    color={feature.status === 'active' ? 'green' : 'blue'}
                                    variant="light"
                                    size="sm"
                                >
                                    {feature.status === 'active' ? 'Ativo' : 'Configurado'}
                                </Badge>
                            </div>
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">Eventos Recentes</Text>
                {recentEvents.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Evento</Table.Th>
                                <Table.Th>Data/Hora</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {recentEvents.map((event) => (
                                <Table.Tr key={event.id}>
                                    <Table.Td>{event.event}</Table.Td>
                                    <Table.Td>{event.timestamp.toLocaleString('pt-BR')}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={event.status === 'success' ? 'green' : event.status === 'warning' ? 'yellow' : 'red'}
                                            variant="light"
                                        >
                                            {event.status === 'success' ? 'OK' : event.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Text c="dimmed">Nenhum evento recente</Text>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

