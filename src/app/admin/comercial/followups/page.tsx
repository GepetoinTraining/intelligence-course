'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    Avatar,
    Tabs,
    Checkbox,
    Loader,
    Alert,
    Center,
    Stack,
    Modal,
    TextInput,
    Textarea,
    Select,
    NumberInput,
} from '@mantine/core';
import {
    IconBellRinging,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconPhone,
    IconMail,
    IconCheck,
    IconClock,
    IconCalendar,
    IconTrash,
    IconAlertCircle,
    IconNote,
    IconSend,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// ---------- types ----------

interface ActionItem {
    id: string;
    title: string;
    description: string | null;
    actionTypeId: string | null;
    linkedEntityType: string | null;
    linkedEntityId: string | null;
    assignedTo: string | null;
    assignedToName: string | null;
    assignedToAvatar: string | null;
    createdBy: string;
    createdByName: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: number | null;
    dueTime: string | null;
    startDate: number | null;
    endDate: number | null;
    isAllDay: boolean;
    completedAt: number | null;
    outcome: string | null;
    createdAt: number;
    actionTypeName: string | null;
    actionTypeIcon: string;
    actionTypeColor: string;
}

// ---------- helpers ----------

const priorityColors: Record<string, string> = {
    low: 'gray',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red',
};

const priorityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
};

const statusColors: Record<string, string> = {
    pending: 'blue',
    in_progress: 'yellow',
    completed: 'green',
    cancelled: 'gray',
    deferred: 'grape',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    deferred: 'Adiado',
};

function formatTs(ts: number | null) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('pt-BR');
}

function isOverdue(item: ActionItem) {
    if (!item.dueDate || item.status === 'completed' || item.status === 'cancelled') return false;
    return item.dueDate < Date.now();
}

// ---------- component ----------

export default function FollowUpsPage() {
    const { data, isLoading, error, refetch } = useApi<{ items: ActionItem[] }>(
        '/api/action-items?entityType=lead&view=all',
    );
    const items = data?.items || [];

    const [activeTab, setActiveTab] = useState<string | null>('pending');
    const [createOpen, createHandlers] = useDisclosure(false);
    const [notesOpen, notesHandlers] = useDisclosure(false);
    const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);

    // -- create form state --
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<string | null>('medium');
    const [newDueDate, setNewDueDate] = useState('');
    const [newDueTime, setNewDueTime] = useState('');
    const [creating, setCreating] = useState(false);

    // -- notes state --
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // -- filter --
    const filtered = activeTab === 'all'
        ? items
        : activeTab === 'pending'
            ? items.filter(f => f.status === 'pending' || f.status === 'in_progress')
            : items.filter(f => f.status === activeTab);

    const pendingCount = items.filter(f => f.status === 'pending' || f.status === 'in_progress').length;
    const overdueCount = items.filter(f => isOverdue(f)).length;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayCount = items.filter(f =>
        f.dueDate && f.dueDate >= todayStart.getTime() && f.dueDate <= todayEnd.getTime()
        && f.status !== 'completed' && f.status !== 'cancelled',
    ).length;
    const completedCount = items.filter(f => f.status === 'completed').length;

    // -- actions --
    const handleComplete = async (item: ActionItem) => {
        try {
            await fetch(`/api/action-items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            refetch();
            notifications.show({ title: 'Concluído', message: `"${item.title}" marcado como concluído`, color: 'green' });
        } catch {
            notifications.show({ title: 'Erro', message: 'Erro ao concluir follow-up', color: 'red' });
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            await fetch('/api/action-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDesc || null,
                    priority: newPriority || 'medium',
                    linkedEntityType: 'lead',
                    dueDate: newDueDate ? new Date(newDueDate).getTime() : null,
                    dueTime: newDueTime || null,
                }),
            });
            refetch();
            createHandlers.close();
            setNewTitle('');
            setNewDesc('');
            setNewPriority('medium');
            setNewDueDate('');
            setNewDueTime('');
            notifications.show({ title: 'Criado', message: 'Follow-up criado com sucesso', color: 'green' });
        } catch {
            notifications.show({ title: 'Erro', message: 'Erro ao criar follow-up', color: 'red' });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (item: ActionItem) => {
        try {
            await fetch(`/api/action-items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            });
            refetch();
            notifications.show({ title: 'Cancelado', message: `"${item.title}" foi cancelado`, color: 'orange' });
        } catch {
            notifications.show({ title: 'Erro', message: 'Erro ao cancelar', color: 'red' });
        }
    };

    const handleSaveNote = async () => {
        if (!selectedItem || !noteText.trim()) return;
        setSavingNote(true);
        try {
            await fetch(`/api/action-items/${selectedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outcomeNotes: noteText }),
            });
            refetch();
            notesHandlers.close();
            setNoteText('');
            setSelectedItem(null);
            notifications.show({ title: 'Nota salva', message: 'Anotação registrada com sucesso', color: 'blue' });
        } catch {
            notifications.show({ title: 'Erro', message: 'Erro ao salvar nota', color: 'red' });
        } finally {
            setSavingNote(false);
        }
    };

    // -- loading --
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
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Comercial</Text>
                    <Title order={2}>Follow-ups</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={createHandlers.open}>
                    Novo Follow-up
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="xl">{pendingCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconBellRinging size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Atrasados</Text>
                            <Text fw={700} size="xl">{overdueCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Para Hoje</Text>
                            <Text fw={700} size="xl">{todayCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídos</Text>
                            <Text fw={700} size="xl">{completedCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Table */}
            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="pending">Pendentes ({pendingCount})</Tabs.Tab>
                        <Tabs.Tab value="completed">Concluídos ({completedCount})</Tabs.Tab>
                        <Tabs.Tab value="all">Todos ({items.length})</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                {filtered.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconClock size={48} color="gray" />
                            <Text c="dimmed">Nenhum follow-up encontrado</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ width: 40 }}></Table.Th>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Data/Hora</Table.Th>
                                <Table.Th>Prioridade</Table.Th>
                                <Table.Th>Responsável</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map((item) => (
                                <Table.Tr
                                    key={item.id}
                                    style={{
                                        opacity: item.status === 'completed' ? 0.6 : 1,
                                        textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                                    }}
                                >
                                    <Table.Td>
                                        <Checkbox
                                            checked={item.status === 'completed'}
                                            onChange={() => item.status !== 'completed' && handleComplete(item)}
                                            disabled={item.status === 'completed'}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={500}>{item.title}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" lineClamp={1}>{item.description || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Text size="sm">{formatTs(item.dueDate)}</Text>
                                            {item.dueTime && <Text size="xs" c="dimmed">{item.dueTime}</Text>}
                                            {isOverdue(item) && (
                                                <Badge color="red" size="xs">Atrasado</Badge>
                                            )}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={priorityColors[item.priority]} variant="dot">
                                            {priorityLabels[item.priority] || item.priority}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size="sm" radius="xl" color="blue" src={item.assignedToAvatar}>
                                                {(item.assignedToName || '?').charAt(0)}
                                            </Avatar>
                                            <Text size="sm">{item.assignedToName || '-'}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={statusColors[item.status]} variant="light">
                                            {statusLabels[item.status] || item.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconDotsVertical size={14} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    leftSection={<IconNote size={14} />}
                                                    onClick={() => { setSelectedItem(item); setNoteText(item.outcome || ''); notesHandlers.open(); }}
                                                >
                                                    Anotações
                                                </Menu.Item>
                                                {item.status !== 'completed' && (
                                                    <Menu.Item
                                                        leftSection={<IconCheck size={14} />}
                                                        color="green"
                                                        onClick={() => handleComplete(item)}
                                                    >
                                                        Marcar Concluído
                                                    </Menu.Item>
                                                )}
                                                <Menu.Divider />
                                                <Menu.Item
                                                    leftSection={<IconTrash size={14} />}
                                                    color="red"
                                                    onClick={() => handleDelete(item)}
                                                >
                                                    Cancelar
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Create Modal */}
            <Modal opened={createOpen} onClose={createHandlers.close} title="Novo Follow-up" size="md">
                <Stack gap="md">
                    <TextInput
                        label="Título"
                        placeholder="Ex: Retornar ligação sobre proposta"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.currentTarget.value)}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Detalhes do follow-up..."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.currentTarget.value)}
                        rows={3}
                    />
                    <Group grow>
                        <Select
                            label="Prioridade"
                            data={[
                                { value: 'low', label: 'Baixa' },
                                { value: 'medium', label: 'Média' },
                                { value: 'high', label: 'Alta' },
                                { value: 'urgent', label: 'Urgente' },
                            ]}
                            value={newPriority}
                            onChange={setNewPriority}
                        />
                        <TextInput
                            label="Data"
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.currentTarget.value)}
                        />
                        <TextInput
                            label="Hora"
                            type="time"
                            value={newDueTime}
                            onChange={(e) => setNewDueTime(e.currentTarget.value)}
                        />
                    </Group>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={createHandlers.close}>Cancelar</Button>
                        <Button onClick={handleCreate} loading={creating} disabled={!newTitle.trim()}>
                            Criar Follow-up
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Notes Modal */}
            <Modal opened={notesOpen} onClose={() => { notesHandlers.close(); setSelectedItem(null); }} title={`Anotações — ${selectedItem?.title || ''}`} size="md">
                <Stack gap="md">
                    <Textarea
                        label="Notas / Observações"
                        placeholder="Registre anotações sobre este follow-up..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.currentTarget.value)}
                        rows={6}
                        autosize
                        minRows={4}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => { notesHandlers.close(); setSelectedItem(null); }}>
                            Fechar
                        </Button>
                        <Button
                            leftSection={<IconSend size={14} />}
                            onClick={handleSaveNote}
                            loading={savingNote}
                        >
                            Salvar Nota
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </div>
    );
}
