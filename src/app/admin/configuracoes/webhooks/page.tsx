'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Paper, TextInput, Button, CopyButton,
    ActionIcon, Tooltip,
} from '@mantine/core';
import {
    IconWebhook, IconPlus, IconTrash, IconCopy, IconCheck,
    IconLink, IconCloudUp, IconBell, IconShieldCheck,
} from '@tabler/icons-react';

interface WebhookEntry {
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    createdAt: string;
    lastTriggered?: string;
    successCount: number;
    failureCount: number;
}

// Local state only — this page manages webhooks config that would later be persisted via an API
const DEMO_EVENTS = [
    'enrollment.created', 'enrollment.completed', 'payment.received',
    'contract.signed', 'lead.created', 'student.enrolled',
    'invoice.paid', 'class.started', 'grade.posted',
];

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');

    const stats = useMemo(() => ({
        total: webhooks.length,
        active: webhooks.filter(w => w.isActive).length,
        totalEvents: DEMO_EVENTS.length,
        totalDeliveries: webhooks.reduce((sum, w) => sum + w.successCount + w.failureCount, 0),
    }), [webhooks]);

    const handleAdd = () => {
        if (!newName.trim() || !newUrl.trim()) return;
        const entry: WebhookEntry = {
            id: crypto.randomUUID(),
            name: newName.trim(),
            url: newUrl.trim(),
            events: ['*'],
            isActive: true,
            createdAt: new Date().toLocaleDateString('pt-BR'),
            successCount: 0,
            failureCount: 0,
        };
        setWebhooks(prev => [...prev, entry]);
        setNewName('');
        setNewUrl('');
    };

    const handleDelete = (id: string) => {
        setWebhooks(prev => prev.filter(w => w.id !== id));
    };

    const handleToggle = (id: string) => {
        setWebhooks(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Configurações</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Webhooks</Text>
                    </Group>
                    <Title order={1}>Webhooks</Title>
                    <Text c="dimmed" mt="xs">Configure endpoints para receber notificações automáticas de eventos do sistema.</Text>
                </div>

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Webhooks</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconWebhook size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ativos</Text>
                                <Text size="xl" fw={700} c="green">{stats.active}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconCloudUp size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Eventos Disponíveis</Text>
                                <Text size="xl" fw={700}>{stats.totalEvents}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconBell size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Entregas</Text>
                                <Text size="xl" fw={700}>{stats.totalDeliveries}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconShieldCheck size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Add Webhook Form */}
                <Card withBorder padding="lg" radius="md">
                    <Text fw={600} mb="md">Adicionar Webhook</Text>
                    <Group align="end">
                        <TextInput
                            label="Nome"
                            placeholder="Ex: Notificação CRM"
                            value={newName}
                            onChange={(e) => setNewName(e.currentTarget.value)}
                            style={{ flex: 1 }}
                        />
                        <TextInput
                            label="URL"
                            placeholder="https://seu-servidor.com/webhook"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.currentTarget.value)}
                            style={{ flex: 2 }}
                        />
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={handleAdd}
                            disabled={!newName.trim() || !newUrl.trim()}
                        >
                            Adicionar
                        </Button>
                    </Group>
                </Card>

                {/* Available Events */}
                <Card withBorder padding="lg" radius="md">
                    <Text fw={600} mb="md">Eventos Disponíveis</Text>
                    <Group gap="sm">
                        {DEMO_EVENTS.map(e => (
                            <Badge key={e} variant="light" size="lg">{e}</Badge>
                        ))}
                    </Group>
                    <Text size="xs" c="dimmed" mt="md">Use `*` para escutar todos os eventos ou selecione eventos específicos ao configurar.</Text>
                </Card>

                {/* Webhooks Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Webhooks Configurados</Text>
                        <Badge variant="light">{webhooks.length} endpoints</Badge>
                    </Group>
                    {webhooks.length === 0 ? (
                        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconWebhook size={32} />
                            </ThemeIcon>
                            <Title order={3} mb="xs">Nenhum webhook</Title>
                            <Text c="dimmed">Adicione um webhook acima para receber notificações automáticas.</Text>
                        </Paper>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Nome</Table.Th>
                                    <Table.Th>URL</Table.Th>
                                    <Table.Th>Eventos</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                    <Table.Th ta="center">Ações</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {webhooks.map(w => (
                                    <Table.Tr key={w.id} style={{ opacity: w.isActive ? 1 : 0.6 }}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{w.name}</Text>
                                            <Text size="xs" c="dimmed">Criado: {w.createdAt}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconLink size={14} color="gray" />
                                                <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>{w.url.slice(0, 40)}{w.url.length > 40 ? '...' : ''}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="light">
                                                {w.events.includes('*') ? 'Todos' : `${w.events.length} evento(s)`}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={w.isActive ? 'green' : 'red'}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleToggle(w.id)}
                                            >
                                                {w.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Group gap={4} justify="center">
                                                <CopyButton value={w.url}>
                                                    {({ copied, copy }) => (
                                                        <Tooltip label={copied ? 'Copiado!' : 'Copiar URL'}>
                                                            <ActionIcon size="sm" variant="light" color={copied ? 'green' : 'gray'} onClick={copy}>
                                                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </CopyButton>
                                                <Tooltip label="Remover">
                                                    <ActionIcon size="sm" variant="light" color="red" onClick={() => handleDelete(w.id)}>
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
