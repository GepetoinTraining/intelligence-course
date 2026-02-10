'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Table, Center, Loader, Alert, Button,
} from '@mantine/core';
import {
    IconLock, IconShieldCheck, IconKey, IconAlertCircle, IconRefresh,
    IconFingerprint, IconCertificate,
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

export default function SegurancaPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any[]>('/api/permissions?scope=security');
    const { data: auditData } = useApi<any[]>('/api/audit-log');

    const securityFeatures = useMemo(() => [
        { name: 'Autenticação 2FA', status: 'active', icon: IconFingerprint, desc: 'Via Clerk' },
        { name: 'SSL/TLS', status: 'active', icon: IconLock, desc: 'Certificado válido' },
        { name: 'API Keys', status: apiData && apiData.length > 0 ? 'configured' : 'pending', icon: IconKey, desc: `${apiData?.length || 0} chaves` },
        { name: 'RBAC', status: 'active', icon: IconShieldCheck, desc: 'Cargos configurados' },
        { name: 'Certificados', status: 'active', icon: IconCertificate, desc: 'Assinatura digital' },
    ], [apiData]);

    const recentEvents = useMemo(() => {
        if (auditData && Array.isArray(auditData) && auditData.length > 0) {
            return auditData.slice(0, 10).map((e: any) => ({
                id: e.id,
                event: e.action || e.event || 'Ação',
                timestamp: e.createdAt ? new Date(e.createdAt * 1000) : new Date(),
                status: e.status || 'success',
                actor: e.actorName || '—',
            }));
        }
        return [];
    }, [auditData]);

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle />} color="red" title="Erro">{String(error)}</Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Segurança</Title>
                </div>
                <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => refetch()}>
                    Atualizar
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3, md: 5 }}>
                {securityFeatures.map((feature) => (
                    <Card key={feature.name} withBorder p="md">
                        <Group>
                            <ThemeIcon variant="light" color={feature.status === 'active' ? 'green' : feature.status === 'configured' ? 'blue' : 'yellow'} size="lg">
                                <feature.icon size={20} />
                            </ThemeIcon>
                            <div>
                                <Text fw={500} size="sm">{feature.name}</Text>
                                <Badge
                                    color={feature.status === 'active' ? 'green' : feature.status === 'configured' ? 'blue' : 'yellow'}
                                    variant="light" size="sm"
                                >
                                    {feature.status === 'active' ? 'Ativo' : feature.status === 'configured' ? 'Configurado' : 'Pendente'}
                                </Badge>
                            </div>
                        </Group>
                        <Text size="xs" c="dimmed" mt="xs">{feature.desc}</Text>
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
                                <Table.Th>Usuário</Table.Th>
                                <Table.Th>Data/Hora</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {recentEvents.map((event) => (
                                <Table.Tr key={event.id}>
                                    <Table.Td>{event.event}</Table.Td>
                                    <Table.Td><Text size="sm">{event.actor}</Text></Table.Td>
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
                        <Stack align="center" gap="xs">
                            <IconShieldCheck size={32} color="gray" />
                            <Text c="dimmed">Nenhum evento recente registrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}
