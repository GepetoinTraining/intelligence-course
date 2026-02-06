'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Textarea, Modal, Loader, Center, Table,
    ActionIcon, Menu, ThemeIcon, ColorSwatch
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconSearch, IconDots, IconEdit, IconTrash,
    IconChartBar, IconArrowUp, IconArrowDown
} from '@tabler/icons-react';

interface Level {
    id: string;
    name: string;
    code: string;
    description: string | null;
    color: string;
    order: number;
    studentCount: number;
}

const defaultColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function SchoolLevelsPage() {
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const [formData, setFormData] = useState({ name: '', code: '', description: '', color: '#3b82f6' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/levels');
            const data = await res.json();
            if (data.data) {
                setLevels(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch levels:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    order: levels.length,
                }),
            });
            if (res.ok) {
                closeCreate();
                setFormData({ name: '', code: '', description: '', color: '#3b82f6' });
                fetchLevels();
            }
        } catch (error) {
            console.error('Failed to create level:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (level: Level) => {
        setEditingLevel(level);
        setFormData({
            name: level.name,
            code: level.code,
            description: level.description || '',
            color: level.color,
        });
        openCreate();
    };

    const handleUpdate = async () => {
        if (!editingLevel) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/levels/${editingLevel.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                closeCreate();
                setEditingLevel(null);
                setFormData({ name: '', code: '', description: '', color: '#3b82f6' });
                fetchLevels();
            }
        } catch (error) {
            console.error('Failed to update level:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este nível?')) return;
        try {
            await fetch(`/api/levels/${id}`, { method: 'DELETE' });
            fetchLevels();
        } catch (error) {
            console.error('Failed to delete level:', error);
        }
    };

    const filteredLevels = levels.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Níveis</Title>
                    <Text c="dimmed">Gerencie os níveis de proficiência</Text>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditingLevel(null); openCreate(); }}>
                    Novo Nível
                </Button>
            </Group>

            <TextInput
                placeholder="Buscar níveis..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                mb="lg"
            />

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredLevels.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconChartBar size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhum nível cadastrado</Title>
                    <Text c="dimmed" mb="lg">
                        Crie níveis para categorizar alunos por proficiência
                    </Text>
                    <Button onClick={openCreate}>Criar Primeiro Nível</Button>
                </Card>
            ) : (
                <Card withBorder p={0}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Ordem</Table.Th>
                                <Table.Th>Cor</Table.Th>
                                <Table.Th>Código</Table.Th>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Alunos</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredLevels
                                .sort((a, b) => a.order - b.order)
                                .map((level) => (
                                    <Table.Tr key={level.id}>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <ActionIcon variant="subtle" size="sm">
                                                    <IconArrowUp size={14} />
                                                </ActionIcon>
                                                <Text size="sm">{level.order + 1}</Text>
                                                <ActionIcon variant="subtle" size="sm">
                                                    <IconArrowDown size={14} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <ColorSwatch color={level.color} size={24} />
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light">{level.code}</Badge>
                                        </Table.Td>
                                        <Table.Td fw={500}>{level.name}</Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed" lineClamp={1}>
                                                {level.description || '-'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>{level.studentCount}</Table.Td>
                                        <Table.Td>
                                            <Menu>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle">
                                                        <IconDots size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => handleEdit(level)}
                                                    >
                                                        Editar
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        color="red"
                                                        leftSection={<IconTrash size={14} />}
                                                        onClick={() => handleDelete(level.id)}
                                                    >
                                                        Excluir
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                opened={createOpened}
                onClose={() => { closeCreate(); setEditingLevel(null); }}
                title={editingLevel ? 'Editar Nível' : 'Novo Nível'}
            >
                <Stack>
                    <Group grow>
                        <TextInput
                            label="Código"
                            placeholder="Ex: A1, B2, C1"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            required
                        />
                        <TextInput
                            label="Nome"
                            placeholder="Ex: Iniciante, Intermediário"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </Group>
                    <Textarea
                        label="Descrição"
                        placeholder="Descrição do nível..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div>
                        <Text size="sm" fw={500} mb="xs">Cor</Text>
                        <Group>
                            {defaultColors.map((color) => (
                                <ColorSwatch
                                    key={color}
                                    color={color}
                                    onClick={() => setFormData({ ...formData, color })}
                                    style={{
                                        cursor: 'pointer',
                                        outline: formData.color === color ? '2px solid var(--mantine-color-blue-5)' : 'none',
                                        outlineOffset: 2,
                                    }}
                                />
                            ))}
                        </Group>
                    </div>
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={() => { closeCreate(); setEditingLevel(null); }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={editingLevel ? handleUpdate : handleCreate}
                            loading={saving}
                            disabled={!formData.name || !formData.code}
                        >
                            {editingLevel ? 'Salvar' : 'Criar'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

