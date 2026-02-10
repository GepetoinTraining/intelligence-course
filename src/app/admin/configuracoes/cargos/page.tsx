'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Table, Switch, ActionIcon, Loader, Alert, Center, Modal, TextInput, Textarea,
    ColorSwatch, Select,
} from '@mantine/core';
import {
    IconShieldCheck, IconPlus, IconPencil, IconTrash, IconAlertCircle,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

const COLOR_OPTIONS = ['red', 'purple', 'blue', 'teal', 'green', 'pink', 'orange', 'cyan'];

const ALL_MODULES = [
    'Marketing', 'Comercial', 'Operacional', 'Pedagógico', 'Financeiro', 'RH', 'Contábil', 'Configurações',
];

export default function CargosPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any[]>('/api/positions');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ name: '', description: '', color: 'blue' });
    const [saving, setSaving] = useState(false);

    const roles = useMemo(() => {
        if (!apiData || !Array.isArray(apiData)) return [];
        return apiData;
    }, [apiData]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', description: '', color: 'blue' });
        setModalOpen(true);
    };

    const openEdit = (role: any) => {
        setEditing(role);
        setForm({ name: role.name, description: role.description || '', color: role.color || 'blue' });
        setModalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) {
                await fetch('/api/positions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editing.id, ...form }),
                });
            } else {
                await fetch('/api/positions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
            }
            refetch();
            setModalOpen(false);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este cargo?')) return;
        await fetch('/api/positions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
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
                    <Title order={2}>Cargos e Permissões</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    Novo Cargo
                </Button>
            </Group>

            {roles.length === 0 ? (
                <Card withBorder p="xl">
                    <Center>
                        <Stack align="center" gap="sm">
                            <ThemeIcon variant="light" size="xl" color="gray"><IconShieldCheck size={24} /></ThemeIcon>
                            <Text c="dimmed">Nenhum cargo cadastrado</Text>
                            <Button variant="light" onClick={openCreate}>Criar primeiro cargo</Button>
                        </Stack>
                    </Center>
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 2, sm: 3 }}>
                    {roles.map((role: any) => (
                        <Card key={role.id} withBorder p="md">
                            <Group justify="space-between" mb="xs">
                                <Badge color={role.color || 'blue'} variant="light">{role.name}</Badge>
                                <Group gap={4}>
                                    <ActionIcon variant="subtle" size="sm" onClick={() => openEdit(role)}>
                                        <IconPencil size={14} />
                                    </ActionIcon>
                                    <ActionIcon variant="subtle" size="sm" color="red" onClick={() => handleDelete(role.id)}>
                                        <IconTrash size={14} />
                                    </ActionIcon>
                                </Group>
                            </Group>
                            <Text size="sm" c="dimmed" mb="sm">{role.description || '—'}</Text>
                            <Group justify="space-between">
                                <Text size="xs" c="dimmed">{role.userCount || 0} usuários</Text>
                                <Badge size="xs" variant="outline">
                                    {role.permissions === 'all' ? 'Todas' : `${role.permissionCount || 0} permissões`}
                                </Badge>
                            </Group>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            {/* Permissions Matrix — static module overview */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Matriz de Permissões (por Módulo)</Text>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Módulo</Table.Th>
                            {roles.slice(0, 6).map((r: any) => (
                                <Table.Th key={r.id}>{r.name}</Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {ALL_MODULES.map((mod) => (
                            <Table.Tr key={mod}>
                                <Table.Td><Text fw={500}>{mod}</Text></Table.Td>
                                {roles.slice(0, 6).map((r: any) => (
                                    <Table.Td key={r.id}>
                                        <Switch
                                            checked={r.name === 'Administrador' || r.permissions === 'all'}
                                            size="xs"
                                            readOnly
                                        />
                                    </Table.Td>
                                ))}
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* Create/Edit Modal */}
            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cargo' : 'Novo Cargo'}>
                <Stack gap="md">
                    <TextInput label="Nome do Cargo" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                    <Textarea label="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    <div>
                        <Text size="sm" fw={500} mb={4}>Cor</Text>
                        <Group gap="xs">
                            {COLOR_OPTIONS.map(c => (
                                <ColorSwatch
                                    key={c}
                                    color={`var(--mantine-color-${c}-6)`}
                                    onClick={() => setForm(p => ({ ...p, color: c }))}
                                    style={{ cursor: 'pointer', outline: form.color === c ? '2px solid var(--mantine-color-blue-5)' : 'none', outlineOffset: 2 }}
                                />
                            ))}
                        </Group>
                    </div>
                    <Button onClick={handleSave} loading={saving} fullWidth>
                        {editing ? 'Salvar Alterações' : 'Criar Cargo'}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
