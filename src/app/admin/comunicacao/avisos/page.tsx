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
    IconBell,
    IconAlertCircle,
    IconAlertTriangle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface SafetyAlert {
    id: string;
    studentId: string;
    level: 'green' | 'yellow' | 'orange' | 'red';
    reason: string;
    detectedBy: string;
    detectedAt: number;
    resolvedAt: number | null;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const levelLabels: Record<string, string> = {
    green: 'Normal',
    yellow: 'Atenção',
    orange: 'Alerta',
    red: 'Crítico',
};

export default function AvisosPage() {
    const { data: alerts, isLoading, error, refetch } = useApi<SafetyAlert[]>('/api/alerts');

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

    const allAlerts = alerts || [];
    const unresolved = allAlerts.filter(a => !a.resolvedAt);

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Comunicação</Text>
                <Title order={2}>Avisos</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBell size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allAlerts.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="lg">{unresolved.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allAlerts.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Nível</Table.Th>
                                <Table.Th>Motivo</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allAlerts.map((alert) => (
                                <Table.Tr key={alert.id}>
                                    <Table.Td>{formatDate(alert.detectedAt)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                alert.level === 'red' ? 'red' :
                                                    alert.level === 'orange' ? 'orange' :
                                                        alert.level === 'yellow' ? 'yellow' : 'green'
                                            }
                                            variant="light"
                                        >
                                            {levelLabels[alert.level] || alert.level}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td><Text lineClamp={1}>{alert.reason}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge color={alert.resolvedAt ? 'gray' : 'blue'} variant="light">
                                            {alert.resolvedAt ? 'Resolvido' : 'Pendente'}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBell size={48} color="gray" />
                            <Text c="dimmed">Nenhum aviso encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

