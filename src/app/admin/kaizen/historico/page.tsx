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
    ActionIcon,
} from '@mantine/core';
import {
    IconClipboardList,
    IconPlus,
    IconPencil,
    IconCheck,
    IconClock,
    IconX,
} from '@tabler/icons-react';

// Demo Kaizen history
const kaizenHistory = [
    { id: 1, title: 'Automatizar cobrança de inadimplentes', author: 'Ana Costa', date: '15/01/2026', votes: 24, status: 'implemented', impact: 'high' },
    { id: 2, title: 'Dashboard de métricas em tempo real', author: 'Carlos Lima', date: '10/12/2025', votes: 18, status: 'implemented', impact: 'high' },
    { id: 3, title: 'Check-in via QR Code na recepção', author: 'Julia Ferreira', date: '01/11/2025', votes: 31, status: 'implemented', impact: 'medium' },
    { id: 4, title: 'Notificação automática de aniversários', author: 'Roberto Silva', date: '15/10/2025', votes: 12, status: 'implemented', impact: 'low' },
    { id: 5, title: 'Integração com Google Calendar', author: 'Mariana Santos', date: '01/10/2025', votes: 15, status: 'rejected', impact: 'medium' },
];

export default function HistoricoKaizenPage() {
    const implemented = kaizenHistory.filter(k => k.status === 'implemented').length;
    const highImpact = kaizenHistory.filter(k => k.impact === 'high' && k.status === 'implemented').length;

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Kaizen</Text>
                    <Title order={2}>Histórico de Melhorias</Title>
                </div>
                <Badge size="lg" variant="light" color="green">
                    {implemented} implementadas
                </Badge>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Implementadas</Text>
                            <Text fw={700} size="lg">{implemented}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconClipboardList size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Alto Impacto</Text>
                            <Text fw={700} size="lg">{highImpact}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconClipboardList size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Votos</Text>
                            <Text fw={700} size="lg">{kaizenHistory.reduce((sum, k) => sum + k.votes, 0)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconX size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Rejeitadas</Text>
                            <Text fw={700} size="lg">{kaizenHistory.filter(k => k.status === 'rejected').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* History Table */}
            <Card withBorder p="md">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Melhoria</Table.Th>
                            <Table.Th>Autor</Table.Th>
                            <Table.Th>Data</Table.Th>
                            <Table.Th>Votos</Table.Th>
                            <Table.Th>Impacto</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {kaizenHistory.map((item) => (
                            <Table.Tr key={item.id}>
                                <Table.Td>
                                    <Text fw={500}>{item.title}</Text>
                                </Table.Td>
                                <Table.Td>{item.author}</Table.Td>
                                <Table.Td>{item.date}</Table.Td>
                                <Table.Td>
                                    <Text fw={500}>{item.votes}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        variant="light"
                                        color={
                                            item.impact === 'high' ? 'red' :
                                                item.impact === 'medium' ? 'yellow' : 'gray'
                                        }
                                    >
                                        {item.impact === 'high' ? 'Alto' :
                                            item.impact === 'medium' ? 'Médio' : 'Baixo'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={item.status === 'implemented' ? 'green' : 'red'}
                                        variant="light"
                                    >
                                        {item.status === 'implemented' ? 'Implementada' : 'Rejeitada'}
                                    </Badge>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}

