'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Table, Loader, Alert, Center, Button, Modal, TextInput, Select,
    Textarea,
} from '@mantine/core';
import {
    IconBell, IconAlertCircle, IconAlertTriangle, IconPlus,
    IconCheck, IconShieldCheck,
} from '@tabler/icons-react';
import { useApi, useCreate } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface SafetyAlert {
    id: string;
    studentId: string;
    level: 'green' | 'yellow' | 'orange' | 'red';
    reason: string;
    detectedBy: string;
    detectedAt: number;
    resolvedAt: number | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const levelLabels: Record<string, string> = {
    green: 'Normal',
    yellow: 'Atenção',
    orange: 'Alerta',
    red: 'Crítico',
};

const levelColors: Record<string, string> = {
    green: 'green',
    yellow: 'yellow',
    orange: 'orange',
    red: 'red',
};

// ============================================================================
// PAGE
// ============================================================================

export default function AvisosPage() {
    const { data: alerts, isLoading, error, refetch } = useApi<SafetyAlert[]>('/api/alerts');
    const { create, isLoading: creating } = useCreate('/api/alerts');

    const [createOpen, setCreateOpen] = useState(false);
    const [newLevel, setNewLevel] = useState<string>('yellow');
    const [newReason, setNewReason] = useState('');
    const [newStudentId, setNewStudentId] = useState('');

    const allAlerts = alerts || [];
    const unresolved = allAlerts.filter(a => !a.resolvedAt);
    const critical = allAlerts.filter(a => a.level === 'red' && !a.resolvedAt);
    const resolved = allAlerts.filter(a => a.resolvedAt);

    const handleCreate = async () => {
        try {
            await create({
                level: newLevel,
                reason: newReason,
                studentId: newStudentId || undefined,
            });
            setCreateOpen(false);
            setNewLevel('yellow');
            setNewReason('');
            setNewStudentId('');
            refetch();
        } catch { /* handled by hook */ }
    };

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
                    <Text size="sm" c="dimmed">Comunicação</Text>
                    <Title order={2}>Avisos</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
                    Novo Aviso
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconBell size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allAlerts.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg"><IconAlertTriangle size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="lg">{unresolved.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg"><IconAlertCircle size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Críticos</Text>
                            <Text fw={700} size="lg" c={critical.length > 0 ? 'red' : undefined}>
                                {critical.length}
                            </Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconShieldCheck size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Resolvidos</Text>
                            <Text fw={700} size="lg">{resolved.length}</Text>
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
                                <Table.Th>Detectado por</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allAlerts.map((alert) => (
                                <Table.Tr key={alert.id}>
                                    <Table.Td>{formatDate(alert.detectedAt)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={levelColors[alert.level] || 'gray'}
                                            variant="light"
                                        >
                                            {levelLabels[alert.level] || alert.level}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td><Text lineClamp={1}>{alert.reason}</Text></Table.Td>
                                    <Table.Td><Text size="sm" c="dimmed">{alert.detectedBy}</Text></Table.Td>
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

            {/* Create Alert Modal */}
            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Novo Aviso" size="md">
                <Stack gap="md">
                    <Select
                        label="Nível"
                        data={[
                            { value: 'green', label: '🟢 Normal' },
                            { value: 'yellow', label: '🟡 Atenção' },
                            { value: 'orange', label: '🟠 Alerta' },
                            { value: 'red', label: '🔴 Crítico' },
                        ]}
                        value={newLevel}
                        onChange={(v) => setNewLevel(v || 'yellow')}
                    />
                    <TextInput
                        label="Aluno (opcional)"
                        placeholder="ID do aluno relacionado"
                        value={newStudentId}
                        onChange={(e) => setNewStudentId(e.target.value)}
                    />
                    <Textarea
                        label="Motivo"
                        placeholder="Descreva o motivo do aviso..."
                        minRows={3}
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        required
                    />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            disabled={!newReason.trim()}
                            loading={creating}
                            onClick={handleCreate}
                        >
                            Criar Aviso
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
