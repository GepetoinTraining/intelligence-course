'use client';

import { useState, useMemo } from 'react';
import {
    Title, Text, Group, Stack, Badge, Card, SimpleGrid, Table, TextInput,
    Button, ActionIcon, Tooltip, CopyButton, Loader, Alert, Center, Modal,
    MultiSelect, Switch,
} from '@mantine/core';
import {
    IconWebhook, IconPlus, IconTrash, IconCopy, IconCheck, IconLink,
    IconCloudUp, IconBell, IconShieldCheck, IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

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

const ALL_EVENTS = [
    'enrollment.created', 'enrollment.completed', 'payment.received',
    'contract.signed', 'lead.created', 'student.enrolled',
    'invoice.paid', 'class.started', 'grade.posted',
];

export default function WebhooksPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any[]>('/api/webhooks');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ name: '', url: '', events: [] as string[] });
    const [saving, setSaving] = useState(false);

    const webhooks = useMemo<WebhookEntry[]>(() => {
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
            return apiData.map((w: any) => ({
                id: w.id,
                name: w.name || 'Webhook',
                url: w.url || w.endpoint || '',
                events: Array.isArray(w.events) ? w.events : (typeof w.events === 'string' ? JSON.parse(w.events) : []),
                isActive: w.isActive ?? w.active ?? true,
                createdAt: w.createdAt ? new Date(w.createdAt * 1000).toLocaleDateString('pt-BR') : '—',
                lastTriggered: w.lastTriggered ? new Date(w.lastTriggered * 1000).toLocaleDateString('pt-BR') : undefined,
                successCount: w.successCount ?? 0,
                failureCount: w.failureCount ?? 0,
            }));
        }
        return [];
    }, [apiData]);

    const handleAdd = async () => {
        if (!form.name || !form.url) return;
        setSaving(true);
        try {
            await fetch('/api/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            refetch();
            setModalOpen(false);
            setForm({ name: '', url: '', events: [] });
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este webhook?')) return;
        await fetch('/api/webhooks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        refetch();
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        await fetch('/api/webhooks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isActive }),
        });
        refetch();
    };

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle />} color="red" title="Erro">{String(error)}</Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Webhooks</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
                    Novo Webhook
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <IconWebhook size={20} color="var(--mantine-color-blue-6)" />
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{webhooks.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <IconCheck size={20} color="var(--mantine-color-green-6)" />
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="lg">{webhooks.filter(w => w.isActive).length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <IconCloudUp size={20} color="var(--mantine-color-teal-6)" />
                        <div>
                            <Text size="xs" c="dimmed">Envios OK</Text>
                            <Text fw={700} size="lg">{webhooks.reduce((s, w) => s + w.successCount, 0)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <IconAlertCircle size={20} color="var(--mantine-color-red-6)" />
                        <div>
                            <Text size="xs" c="dimmed">Falhas</Text>
                            <Text fw={700} size="lg">{webhooks.reduce((s, w) => s + w.failureCount, 0)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {webhooks.length === 0 ? (
                <Card withBorder p="xl">
                    <Center>
                        <Stack align="center" gap="sm">
                            <IconWebhook size={40} color="gray" />
                            <Text c="dimmed">Nenhum webhook configurado</Text>
                            <Button variant="light" onClick={() => setModalOpen(true)}>Criar primeiro webhook</Button>
                        </Stack>
                    </Center>
                </Card>
            ) : (
                <Card withBorder p="md">
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>URL</Table.Th>
                                <Table.Th>Eventos</Table.Th>
                                <Table.Th>Último Disparo</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {webhooks.map((wh) => (
                                <Table.Tr key={wh.id}>
                                    <Table.Td><Text fw={500}>{wh.name}</Text></Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Text size="xs" c="dimmed" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {wh.url}
                                            </Text>
                                            <CopyButton value={wh.url}>
                                                {({ copied, copy }) => (
                                                    <Tooltip label={copied ? 'Copiado!' : 'Copiar URL'}>
                                                        <ActionIcon size="xs" variant="subtle" onClick={copy}>
                                                            {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </CopyButton>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {wh.events.slice(0, 2).map((e, i) => (
                                                <Badge key={i} size="xs" variant="light">{e}</Badge>
                                            ))}
                                            {wh.events.length > 2 && <Badge size="xs" variant="outline">+{wh.events.length - 2}</Badge>}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td><Text size="sm">{wh.lastTriggered || '—'}</Text></Table.Td>
                                    <Table.Td>
                                        <Switch checked={wh.isActive} onChange={e => handleToggle(wh.id, e.currentTarget.checked)} size="sm" />
                                    </Table.Td>
                                    <Table.Td>
                                        <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(wh.id)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Create Modal */}
            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Novo Webhook" size="md">
                <Stack gap="md">
                    <TextInput label="Nome" placeholder="Meu webhook" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                    <TextInput label="URL" placeholder="https://..." leftSection={<IconLink size={16} />} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} required />
                    <MultiSelect
                        label="Eventos"
                        data={ALL_EVENTS}
                        value={form.events}
                        onChange={v => setForm(p => ({ ...p, events: v }))}
                        placeholder="Selecione os eventos"
                    />
                    <Button onClick={handleAdd} loading={saving} fullWidth>Criar Webhook</Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
