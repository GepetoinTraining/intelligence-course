'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Group,
    Stack,
    Card,
    Badge,
    Avatar,
    ScrollArea,
    SegmentedControl,
    Paper,
    ActionIcon,
    Menu,
    ThemeIcon,
    Tooltip,
    Progress,
    Loader,
    Center,
    Box,
    Grid,
    Tabs,
    Select,
    RingProgress,
    Divider,
    SimpleGrid,
    Modal,
    Timeline,
    Button,
    TextInput,
    Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconUser,
    IconUserPlus,
    IconPhone,
    IconCheck,
    IconCalendar,
    IconCurrencyDollar,
    IconSchool,
    IconAlertTriangle,
    IconArrowRight,
    IconDotsVertical,
    IconMail,
    IconBrandWhatsapp,
    IconRefresh,
    IconTrendingUp,
    IconUsers,
    IconTarget,
    IconGift,
    IconChevronRight,
    IconFilter,
    IconArrowUpRight,
    IconArrowDownRight,
    IconReceipt,
    IconClock,
    IconHistory,
    IconArrowBackUp,
    IconX,
    IconEdit,
    IconNote,
    IconListCheck,
    IconPlus,
    IconSend,
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface FunnelItem {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    stage: string;
    status: string;
    assignedTo: {
        id: string;
        name: string;
        avatarUrl: string | null;
    } | null;
    value: number;
    daysInStage: number;
    lastContact: number | null;
    nextFollowup: number | null;
    source: string | null;
    course: string | null;
    tags: string[];
}

interface StageColumn {
    id: string;
    label: string;
    color: string;
    icon: React.ReactNode;
    phase: 'cac' | 'conversion' | 'ltv' | 'retention';
}

// ============================================================================
// Funnel Stages Configuration
// ============================================================================

const CAC_STAGES: StageColumn[] = [
    { id: 'new', label: 'Novos Leads', color: 'gray', icon: <IconUserPlus size={16} />, phase: 'cac' },
    { id: 'contacted', label: 'Contatados', color: 'blue', icon: <IconPhone size={16} />, phase: 'cac' },
    { id: 'qualified', label: 'Qualificados', color: 'cyan', icon: <IconCheck size={16} />, phase: 'cac' },
    { id: 'trial_scheduled', label: 'Trial Agendada', color: 'violet', icon: <IconCalendar size={16} />, phase: 'cac' },
    { id: 'trial_completed', label: 'Trial Feita', color: 'grape', icon: <IconSchool size={16} />, phase: 'cac' },
    { id: 'proposal_sent', label: 'Proposta Enviada', color: 'orange', icon: <IconCurrencyDollar size={16} />, phase: 'cac' },
];

const CONVERSION_STAGES: StageColumn[] = [
    { id: 'enrolled', label: 'Matriculado', color: 'green', icon: <IconCheck size={16} />, phase: 'conversion' },
];

const LTV_STAGES: StageColumn[] = [
    { id: 'active', label: 'Ativo', color: 'teal', icon: <IconTrendingUp size={16} />, phase: 'ltv' },
    { id: 'at_risk', label: 'Em Risco', color: 'yellow', icon: <IconAlertTriangle size={16} />, phase: 'ltv' },
    { id: 'paused', label: 'Pausado', color: 'gray', icon: <IconRefresh size={16} />, phase: 'ltv' },
];

const RETENTION_STAGES: StageColumn[] = [
    { id: 'completed', label: 'Formado', color: 'blue', icon: <IconSchool size={16} />, phase: 'retention' },
    { id: 'alumnus', label: 'Alumni', color: 'indigo', icon: <IconUsers size={16} />, phase: 'retention' },
    { id: 'upsell', label: 'Upsell', color: 'pink', icon: <IconTarget size={16} />, phase: 'retention' },
    { id: 'referral', label: 'Indicador', color: 'lime', icon: <IconGift size={16} />, phase: 'retention' },
];

const ALL_STAGES = [...CAC_STAGES, ...CONVERSION_STAGES, ...LTV_STAGES, ...RETENTION_STAGES];

// ============================================================================
// CRM Detail Modal
// ============================================================================

interface AuditLogEntry {
    id: string;
    action: string;
    fieldName: string | null;
    previousValue: string | null;
    newValue: string | null;
    changeDescription: string | null;
    reason: string | null;
    changedBy: string;
    changedByName: string | null;
    changedByRole: string | null;
    canUndo: boolean;
    undoneAt: number | null;
    createdAt: number;
}

interface CrmDetailModalProps {
    opened: boolean;
    onClose: () => void;
    item: FunnelItem | null;
    entityType: 'lead' | 'enrollment';
    onRefresh: () => void;
}

interface NoteEntry {
    id: string;
    title: string | null;
    content: string;
    noteType: string;
    createdBy: string;
    createdByName: string;
    createdByAvatar: string | null;
    isPinned: boolean;
    createdAt: number;
}

interface ActionItemEntry {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: number | null;
    assignedToName: string | null;
    actionTypeName: string | null;
    actionTypeColor: string;
    createdAt: number;
}

function CrmDetailModal({ opened, onClose, item, entityType, onRefresh }: CrmDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState<any>(null);
    const [history, setHistory] = useState<AuditLogEntry[]>([]);
    const [notes, setNotes] = useState<NoteEntry[]>([]);
    const [actions, setActions] = useState<ActionItemEntry[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('info');
    const [undoing, setUndoing] = useState<string | null>(null);

    // Note form state
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteType, setNewNoteType] = useState('general');
    const [submittingNote, setSubmittingNote] = useState(false);

    // Action form state
    const [newActionTitle, setNewActionTitle] = useState('');
    const [newActionDueDate, setNewActionDueDate] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    useEffect(() => {
        if (opened && item) {
            loadDetail();
            loadNotes();
            loadActions();
        }
    }, [opened, item]);

    const loadDetail = async () => {
        if (!item) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/${item.id}?type=${entityType}`);
            if (res.ok) {
                const data = await res.json();
                setDetail(data.entity);
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to load detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadNotes = async () => {
        if (!item) return;
        try {
            const res = await fetch(`/api/notes?entityType=${entityType}&entityId=${item.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data.notes || []);
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    };

    const loadActions = async () => {
        if (!item) return;
        try {
            const res = await fetch(`/api/action-items?entityType=${entityType}&entityId=${item.id}`);
            if (res.ok) {
                const data = await res.json();
                setActions(data.items || []);
            }
        } catch (error) {
            console.error('Failed to load actions:', error);
        }
    };

    const handleSubmitNote = async () => {
        if (!item || !newNoteContent.trim()) return;
        setSubmittingNote(true);
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityType,
                    entityId: item.id,
                    content: newNoteContent,
                    noteType: newNoteType,
                }),
            });
            if (res.ok) {
                setNewNoteContent('');
                loadNotes();
            }
        } catch (error) {
            console.error('Failed to create note:', error);
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleSubmitAction = async () => {
        if (!item || !newActionTitle.trim()) return;
        setSubmittingAction(true);
        try {
            const res = await fetch('/api/action-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newActionTitle,
                    linkedEntityType: entityType,
                    linkedEntityId: item.id,
                    dueDate: newActionDueDate ? new Date(newActionDueDate).getTime() : null,
                }),
            });
            if (res.ok) {
                setNewActionTitle('');
                setNewActionDueDate('');
                loadActions();
            }
        } catch (error) {
            console.error('Failed to create action:', error);
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleCompleteAction = async (actionId: string) => {
        try {
            await fetch(`/api/action-items/${actionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            });
            loadActions();
        } catch (error) {
            console.error('Failed to complete action:', error);
        }
    };

    const handleUndo = async (logId: string) => {
        if (!item) return;
        setUndoing(logId);
        try {
            const res = await fetch(`/api/crm/${item.id}/undo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logId }),
            });
            if (res.ok) {
                loadDetail();
                onRefresh();
            }
        } catch (error) {
            console.error('Failed to undo:', error);
        } finally {
            setUndoing(null);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return <IconUserPlus size={14} />;
            case 'stage_change': return <IconArrowRight size={14} />;
            case 'assign': return <IconUser size={14} />;
            case 'update': return <IconEdit size={14} />;
            case 'note': return <IconNote size={14} />;
            case 'undo': return <IconArrowBackUp size={14} />;
            default: return <IconEdit size={14} />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'create': return 'green';
            case 'stage_change': return 'blue';
            case 'assign': return 'violet';
            case 'undo': return 'orange';
            default: return 'gray';
        }
    };

    if (!item) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group>
                    <Avatar size={36} radius="xl" color="violet">
                        {item.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <Text fw={600}>{item.name}</Text>
                        <Text size="xs" c="dimmed">{item.email || 'Sem email'}</Text>
                    </div>
                </Group>
            }
            size="lg"
            radius="lg"
        >
            {loading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : (
                <Stack gap="md">
                    <Tabs value={activeTab} onChange={setActiveTab}>
                        <Tabs.List>
                            <Tabs.Tab value="info" leftSection={<IconUser size={14} />}>
                                Info
                            </Tabs.Tab>
                            <Tabs.Tab value="notes" leftSection={<IconNote size={14} />}>
                                Notas ({notes.length})
                            </Tabs.Tab>
                            <Tabs.Tab value="actions" leftSection={<IconListCheck size={14} />}>
                                Ações ({actions.length})
                            </Tabs.Tab>
                            <Tabs.Tab value="history" leftSection={<IconHistory size={14} />}>
                                Histórico ({history.length})
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="info" pt="md">
                            <Stack gap="sm">
                                {/* Contact Info */}
                                <Paper p="sm" radius="md" withBorder>
                                    <Text size="xs" c="dimmed" fw={500} mb="xs">CONTATO</Text>
                                    <Group gap="lg">
                                        {item.email && (
                                            <Group gap="xs">
                                                <IconMail size={14} color="gray" />
                                                <Text size="sm">{item.email}</Text>
                                            </Group>
                                        )}
                                        {item.phone && (
                                            <Group gap="xs">
                                                <IconPhone size={14} color="gray" />
                                                <Text size="sm">{item.phone}</Text>
                                            </Group>
                                        )}
                                    </Group>
                                </Paper>

                                {/* Stage & Value */}
                                <SimpleGrid cols={2}>
                                    <Paper p="sm" radius="md" withBorder>
                                        <Text size="xs" c="dimmed" fw={500} mb="xs">ESTÁGIO ATUAL</Text>
                                        <Badge size="lg" variant="light" color={
                                            ALL_STAGES.find(s => s.id === item.stage)?.color || 'gray'
                                        }>
                                            {ALL_STAGES.find(s => s.id === item.stage)?.label || item.stage}
                                        </Badge>
                                        <Text size="xs" c="dimmed" mt="xs">
                                            {item.daysInStage} dias neste estágio
                                        </Text>
                                    </Paper>

                                    {item.value > 0 && (
                                        <Paper p="sm" radius="md" withBorder>
                                            <Text size="xs" c="dimmed" fw={500} mb="xs">VALOR</Text>
                                            <Text size="xl" fw={700} c="green">
                                                R$ {item.value.toLocaleString('pt-BR')}
                                            </Text>
                                        </Paper>
                                    )}
                                </SimpleGrid>

                                {/* Course Interest */}
                                {item.course && (
                                    <Paper p="sm" radius="md" withBorder>
                                        <Text size="xs" c="dimmed" fw={500} mb="xs">INTERESSE</Text>
                                        <Badge color="blue">{item.course}</Badge>
                                    </Paper>
                                )}

                                {/* Assigned To */}
                                {detail?.assignedUser && (
                                    <Paper p="sm" radius="md" withBorder>
                                        <Text size="xs" c="dimmed" fw={500} mb="xs">RESPONSÁVEL</Text>
                                        <Group>
                                            <Avatar size="sm" radius="xl">
                                                {detail.assignedUser.name?.charAt(0) || '?'}
                                            </Avatar>
                                            <div>
                                                <Text size="sm">{detail.assignedUser.name}</Text>
                                                <Text size="xs" c="dimmed">{detail.assignedUser.email}</Text>
                                            </div>
                                        </Group>
                                    </Paper>
                                )}
                            </Stack>
                        </Tabs.Panel>

                        {/* Notes Panel */}
                        <Tabs.Panel value="notes" pt="md">
                            <Stack gap="md">
                                {/* Add Note Form */}
                                <Paper p="sm" radius="md" withBorder>
                                    <Stack gap="xs">
                                        <TextInput
                                            placeholder="Adicionar uma nota..."
                                            value={newNoteContent}
                                            onChange={(e) => setNewNoteContent(e.target.value)}
                                            rightSection={
                                                <ActionIcon
                                                    variant="filled"
                                                    color="violet"
                                                    onClick={handleSubmitNote}
                                                    loading={submittingNote}
                                                    disabled={!newNoteContent.trim()}
                                                >
                                                    <IconSend size={14} />
                                                </ActionIcon>
                                            }
                                        />
                                        <Select
                                            size="xs"
                                            value={newNoteType}
                                            onChange={(v) => setNewNoteType(v || 'general')}
                                            data={[
                                                { value: 'general', label: '📝 Geral' },
                                                { value: 'call', label: '📞 Ligação' },
                                                { value: 'meeting', label: '📅 Reunião' },
                                                { value: 'email', label: '✉️ Email' },
                                                { value: 'important', label: '⚠️ Importante' },
                                                { value: 'followup', label: '🔄 Follow-up' },
                                            ]}
                                            w={150}
                                        />
                                    </Stack>
                                </Paper>

                                {/* Notes List */}
                                {notes.length === 0 ? (
                                    <Center py="xl">
                                        <Stack align="center" gap="xs">
                                            <ThemeIcon size={48} color="gray" variant="light" radius="xl">
                                                <IconNote size={24} />
                                            </ThemeIcon>
                                            <Text c="dimmed">Nenhuma nota registrada</Text>
                                        </Stack>
                                    </Center>
                                ) : (
                                    <ScrollArea h={300}>
                                        <Stack gap="sm">
                                            {notes.map((note) => (
                                                <Paper key={note.id} p="sm" radius="md" withBorder>
                                                    <Group justify="space-between" mb="xs">
                                                        <Group gap="xs">
                                                            <Avatar size="sm" radius="xl">
                                                                {note.createdByName.charAt(0)}
                                                            </Avatar>
                                                            <Text size="xs" fw={500}>{note.createdByName}</Text>
                                                            <Badge size="xs" variant="light">
                                                                {note.noteType === 'call' ? '📞' :
                                                                    note.noteType === 'meeting' ? '📅' :
                                                                        note.noteType === 'email' ? '✉️' :
                                                                            note.noteType === 'important' ? '⚠️' :
                                                                                note.noteType === 'followup' ? '🔄' : '📝'}
                                                            </Badge>
                                                        </Group>
                                                        <Text size="xs" c="dimmed">
                                                            {formatDate(note.createdAt)}
                                                        </Text>
                                                    </Group>
                                                    <Text size="sm">{note.content}</Text>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </ScrollArea>
                                )}
                            </Stack>
                        </Tabs.Panel>

                        {/* Actions Panel */}
                        <Tabs.Panel value="actions" pt="md">
                            <Stack gap="md">
                                {/* Add Action Form */}
                                <Paper p="sm" radius="md" withBorder>
                                    <Stack gap="xs">
                                        <Group>
                                            <TextInput
                                                placeholder="Nova ação..."
                                                value={newActionTitle}
                                                onChange={(e) => setNewActionTitle(e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <TextInput
                                                type="date"
                                                placeholder="Prazo"
                                                value={newActionDueDate}
                                                onChange={(e) => setNewActionDueDate(e.target.value)}
                                                w={140}
                                            />
                                            <ActionIcon
                                                variant="filled"
                                                color="violet"
                                                size="lg"
                                                onClick={handleSubmitAction}
                                                loading={submittingAction}
                                                disabled={!newActionTitle.trim()}
                                            >
                                                <IconPlus size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Stack>
                                </Paper>

                                {/* Actions List */}
                                {actions.length === 0 ? (
                                    <Center py="xl">
                                        <Stack align="center" gap="xs">
                                            <ThemeIcon size={48} color="gray" variant="light" radius="xl">
                                                <IconListCheck size={24} />
                                            </ThemeIcon>
                                            <Text c="dimmed">Nenhuma ação pendente</Text>
                                        </Stack>
                                    </Center>
                                ) : (
                                    <ScrollArea h={300}>
                                        <Stack gap="sm">
                                            {actions.map((action) => (
                                                <Paper
                                                    key={action.id}
                                                    p="sm"
                                                    radius="md"
                                                    withBorder
                                                    style={{
                                                        opacity: action.status === 'completed' ? 0.6 : 1,
                                                        borderLeft: `3px solid var(--mantine-color-${action.priority === 'urgent' ? 'red' :
                                                            action.priority === 'high' ? 'orange' :
                                                                action.priority === 'medium' ? 'blue' : 'gray'
                                                            }-5)`,
                                                    }}
                                                >
                                                    <Group justify="space-between">
                                                        <Group gap="sm">
                                                            <ActionIcon
                                                                variant={action.status === 'completed' ? 'filled' : 'outline'}
                                                                color={action.status === 'completed' ? 'green' : 'gray'}
                                                                radius="xl"
                                                                size="sm"
                                                                onClick={() => action.status !== 'completed' && handleCompleteAction(action.id)}
                                                            >
                                                                <IconListCheck size={14} />
                                                            </ActionIcon>
                                                            <div>
                                                                <Text
                                                                    size="sm"
                                                                    fw={500}
                                                                    td={action.status === 'completed' ? 'line-through' : undefined}
                                                                >
                                                                    {action.title}
                                                                </Text>
                                                                {action.dueDate && (
                                                                    <Text size="xs" c="dimmed">
                                                                        Prazo: {new Date(action.dueDate).toLocaleDateString('pt-BR')}
                                                                    </Text>
                                                                )}
                                                            </div>
                                                        </Group>
                                                        <Group gap="xs">
                                                            <Badge
                                                                size="xs"
                                                                color={
                                                                    action.priority === 'urgent' ? 'red' :
                                                                        action.priority === 'high' ? 'orange' :
                                                                            action.priority === 'medium' ? 'blue' : 'gray'
                                                                }
                                                            >
                                                                {action.priority}
                                                            </Badge>
                                                            {action.assignedToName && (
                                                                <Avatar size="xs" radius="xl">
                                                                    {action.assignedToName.charAt(0)}
                                                                </Avatar>
                                                            )}
                                                        </Group>
                                                    </Group>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </ScrollArea>
                                )}
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="history" pt="md">
                            {history.length === 0 ? (
                                <Center py="xl">
                                    <Stack align="center" gap="xs">
                                        <ThemeIcon size={48} color="gray" variant="light" radius="xl">
                                            <IconHistory size={24} />
                                        </ThemeIcon>
                                        <Text c="dimmed">Nenhuma alteração registrada</Text>
                                    </Stack>
                                </Center>
                            ) : (
                                <ScrollArea h={400}>
                                    <Timeline active={history.length - 1} bulletSize={24} lineWidth={2}>
                                        {history.map((entry, index) => (
                                            <Timeline.Item
                                                key={entry.id}
                                                bullet={getActionIcon(entry.action)}
                                                color={entry.undoneAt ? 'gray' : getActionColor(entry.action)}
                                                title={
                                                    <Group justify="space-between">
                                                        <Text size="sm" fw={500} td={entry.undoneAt ? 'line-through' : undefined}>
                                                            {entry.changeDescription || entry.action}
                                                        </Text>
                                                        {entry.canUndo && !entry.undoneAt && index === 0 && (
                                                            <Tooltip label="Desfazer alteração">
                                                                <ActionIcon
                                                                    size="sm"
                                                                    variant="subtle"
                                                                    color="orange"
                                                                    onClick={() => handleUndo(entry.id)}
                                                                    loading={undoing === entry.id}
                                                                >
                                                                    <IconArrowBackUp size={14} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </Group>
                                                }
                                            >
                                                <Stack gap={2}>
                                                    <Group gap="xs">
                                                        <Text size="xs" c="dimmed">
                                                            {entry.changedByName || 'Sistema'}
                                                        </Text>
                                                        {entry.changedByRole && (
                                                            <Badge size="xs" variant="outline" color="gray">
                                                                {entry.changedByRole}
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                    <Text size="xs" c="dimmed">
                                                        {formatDate(entry.createdAt)}
                                                    </Text>
                                                    {entry.undoneAt && (
                                                        <Badge size="xs" color="orange" variant="light">
                                                            Desfeito em {formatDate(entry.undoneAt)}
                                                        </Badge>
                                                    )}
                                                    {entry.reason && (
                                                        <Text size="xs" fs="italic" c="dimmed">
                                                            Motivo: {entry.reason}
                                                        </Text>
                                                    )}
                                                </Stack>
                                            </Timeline.Item>
                                        ))}
                                    </Timeline>
                                </ScrollArea>
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </Stack>
            )
            }
        </Modal >
    );
}

// ============================================================================
// Kanban Card Component
// ============================================================================

function FunnelCard({ item, onAction }: { item: FunnelItem; onAction: (action: string, id: string) => void }) {
    const getUrgencyColor = () => {
        if (item.daysInStage > 14) return 'red';
        if (item.daysInStage > 7) return 'orange';
        if (item.daysInStage > 3) return 'yellow';
        return 'green';
    };

    return (
        <Card shadow="xs" padding="sm" radius="md" withBorder mb="xs">
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    <Avatar size={32} radius="xl" color="blue">
                        {item.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Stack gap={0}>
                        <Text size="sm" fw={500} lineClamp={1}>{item.name}</Text>
                        {item.email && (
                            <Text size="xs" c="dimmed" lineClamp={1}>{item.email}</Text>
                        )}
                    </Stack>
                </Group>
                <Menu shadow="md" width={180} position="bottom-end">
                    <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                            <IconDotsVertical size={14} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Ações</Menu.Label>
                        <Menu.Item
                            leftSection={<IconChevronRight size={14} />}
                            onClick={() => onAction('advance', item.id)}
                        >
                            Avançar Estágio
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconPhone size={14} />}
                            onClick={() => onAction('call', item.id)}
                        >
                            Registrar Contato
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconBrandWhatsapp size={14} />}
                            onClick={() => onAction('whatsapp', item.id)}
                        >
                            Enviar WhatsApp
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconMail size={14} />}
                            onClick={() => onAction('email', item.id)}
                        >
                            Enviar Email
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                            leftSection={<IconUser size={14} />}
                            onClick={() => onAction('view', item.id)}
                        >
                            Ver Detalhes
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>

            {/* Course interest */}
            {item.course && (
                <Badge size="xs" variant="light" color="blue" mb="xs">
                    {item.course}
                </Badge>
            )}

            {/* Value */}
            {item.value > 0 && (
                <Group gap="xs" mb="xs">
                    <ThemeIcon size="xs" variant="light" color="green">
                        <IconCurrencyDollar size={10} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">
                        R$ {item.value.toLocaleString('pt-BR')}
                    </Text>
                </Group>
            )}

            {/* Assigned to */}
            {item.assignedTo && (
                <Group gap="xs" mb="xs">
                    <Avatar size={18} radius="xl" src={item.assignedTo.avatarUrl}>
                        {item.assignedTo.name.charAt(0)}
                    </Avatar>
                    <Text size="xs" c="dimmed">
                        {item.assignedTo.name}
                    </Text>
                </Group>
            )}

            {/* Days in stage indicator */}
            <Group justify="space-between">
                <Tooltip label={`${item.daysInStage} dias neste estágio`}>
                    <Badge size="xs" color={getUrgencyColor()} variant="light">
                        {item.daysInStage}d
                    </Badge>
                </Tooltip>

                {/* Source */}
                {item.source && (
                    <Text size="xs" c="dimmed">{item.source}</Text>
                )}
            </Group>

            {/* Tags */}
            {item.tags.length > 0 && (
                <Group gap={4} mt="xs">
                    {item.tags.slice(0, 2).map((tag, i) => (
                        <Badge key={i} size="xs" variant="outline" color="gray">
                            {tag}
                        </Badge>
                    ))}
                    {item.tags.length > 2 && (
                        <Text size="xs" c="dimmed">+{item.tags.length - 2}</Text>
                    )}
                </Group>
            )}
        </Card>
    );
}

// ============================================================================
// Kanban Column Component
// ============================================================================

function FunnelColumn({
    stage,
    items,
    onAction,
}: {
    stage: StageColumn;
    items: FunnelItem[];
    onAction: (action: string, id: string) => void;
}) {
    const totalValue = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <Paper
            p="sm"
            radius="md"
            withBorder
            style={{ minWidth: 280, flex: '1 1 280px', maxWidth: 400, height: '100%' }}
        >
            <Group justify="space-between" mb="sm">
                <Group gap="xs">
                    <ThemeIcon size="sm" color={stage.color} variant="light">
                        {stage.icon}
                    </ThemeIcon>
                    <Text size="sm" fw={600}>{stage.label}</Text>
                    <Badge size="sm" color={stage.color} variant="filled" circle>
                        {items.length}
                    </Badge>
                </Group>
            </Group>

            {/* Total Value */}
            {totalValue > 0 && (
                <Group gap="xs" mb="sm">
                    <Text size="xs" c="dimmed">
                        Valor: R$ {totalValue.toLocaleString('pt-BR')}
                    </Text>
                </Group>
            )}

            <ScrollArea h={500} offsetScrollbars scrollbarSize={6}>
                <Stack gap="xs">
                    {items.length === 0 ? (
                        <Center py="xl">
                            <Text size="sm" c="dimmed">Nenhum item</Text>
                        </Center>
                    ) : (
                        items.map((item) => (
                            <FunnelCard key={item.id} item={item} onAction={onAction} />
                        ))
                    )}
                </Stack>
            </ScrollArea>
        </Paper>
    );
}

// ============================================================================
// Phase Summary Cards
// ============================================================================

function PhaseSummary({
    title,
    count,
    value,
    color,
    conversion,
}: {
    title: string;
    count: number;
    value: number;
    color: string;
    conversion?: number;
}) {
    return (
        <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">{title}</Text>
                <Badge color={color} variant="light">{count} pessoas</Badge>
            </Group>
            <Text size="xl" fw={700}>
                R$ {value.toLocaleString('pt-BR')}
            </Text>
            {conversion !== undefined && (
                <Group gap="xs" mt="xs">
                    <Progress value={conversion} color={color} size="sm" style={{ flex: 1 }} />
                    <Text size="xs" c="dimmed">{conversion.toFixed(1)}%</Text>
                </Group>
            )}
        </Card>
    );
}

// ============================================================================
// Main Page
// ============================================================================

export default function CRMFunnelPage() {
    const [viewMode, setViewMode] = useState<'all' | 'cac' | 'ltv' | 'retention'>('all');
    const [items, setItems] = useState<FunnelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignee, setAssignee] = useState<string | null>(null);

    // Load funnel data
    useEffect(() => {
        async function loadFunnel() {
            try {
                const params = new URLSearchParams();
                if (assignee) params.set('assignee', assignee);

                const res = await fetch(`/api/crm/funnel?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items || []);
                } else {
                    // Mock data for development
                    setItems(generateMockData());
                }
            } catch (error) {
                console.error('Failed to load funnel:', error);
                setItems(generateMockData());
            } finally {
                setLoading(false);
            }
        }
        loadFunnel();
    }, [assignee]);

    // Modal state
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [selectedItem, setSelectedItem] = useState<FunnelItem | null>(null);

    const handleAction = async (action: string, itemId: string) => {
        const item = items.find(i => i.id === itemId);

        if (action === 'view' && item) {
            setSelectedItem(item);
            openModal();
            return;
        }

        console.log('Action:', action, 'Item:', itemId);
        // TODO: Implement other actions
    };

    const handleRefresh = () => {
        setLoading(true);
        // Re-trigger useEffect
        setAssignee(prev => prev);
    };

    // Filter stages by view mode
    const visibleStages = viewMode === 'all'
        ? ALL_STAGES
        : viewMode === 'cac'
            ? [...CAC_STAGES, ...CONVERSION_STAGES]
            : viewMode === 'ltv'
                ? [...CONVERSION_STAGES, ...LTV_STAGES]
                : RETENTION_STAGES;

    // Group items by stage
    const itemsByStage: Record<string, FunnelItem[]> = {};
    visibleStages.forEach(stage => {
        itemsByStage[stage.id] = items.filter(item => item.stage === stage.id);
    });

    // Calculate phase summaries
    const cacItems = items.filter(i => CAC_STAGES.some(s => s.id === i.stage));
    const ltvItems = items.filter(i => LTV_STAGES.some(s => s.id === i.stage));
    const retentionItems = items.filter(i => RETENTION_STAGES.some(s => s.id === i.stage));

    const cacValue = cacItems.reduce((sum, i) => sum + i.value, 0);
    const ltvValue = ltvItems.reduce((sum, i) => sum + i.value, 0);
    const enrolledCount = items.filter(i => i.stage === 'enrolled').length;
    const conversionRate = cacItems.length > 0 ? (enrolledCount / cacItems.length) * 100 : 0;

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>🎯 Funil CAC → LTV</Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Acompanhe toda a jornada do cliente: Lead → Aluno → Alumni → Recompra
                    </Text>
                </div>

                <Group>
                    <Select
                        placeholder="Filtrar por responsável"
                        leftSection={<IconFilter size={14} />}
                        data={[
                            { value: 'all', label: 'Todos' },
                            { value: 'me', label: 'Meus leads' },
                        ]}
                        value={assignee || 'all'}
                        onChange={(v) => setAssignee(v === 'all' ? null : v)}
                        w={200}
                        size="sm"
                    />
                </Group>
            </Group>

            {/* View Mode Tabs */}
            <Tabs value={viewMode} onChange={(v) => setViewMode(v as typeof viewMode)} mb="lg">
                <Tabs.List>
                    <Tabs.Tab value="all" leftSection={<IconUsers size={14} />}>
                        Toda Jornada
                    </Tabs.Tab>
                    <Tabs.Tab value="cac" leftSection={<IconUserPlus size={14} />}>
                        CAC (Aquisição)
                    </Tabs.Tab>
                    <Tabs.Tab value="ltv" leftSection={<IconTrendingUp size={14} />}>
                        LTV (Retenção)
                    </Tabs.Tab>
                    <Tabs.Tab value="retention" leftSection={<IconGift size={14} />}>
                        Pós-venda
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {/* Phase Summaries */}
            <Grid mb="lg">
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <PhaseSummary
                        title="Pipeline CAC"
                        count={cacItems.length}
                        value={cacValue}
                        color="blue"
                        conversion={conversionRate}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <PhaseSummary
                        title="Matriculados"
                        count={enrolledCount}
                        value={items.filter(i => i.stage === 'enrolled').reduce((s, i) => s + i.value, 0)}
                        color="green"
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <PhaseSummary
                        title="Base Ativa"
                        count={ltvItems.length}
                        value={ltvValue}
                        color="teal"
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <PhaseSummary
                        title="Alumni / Upsell"
                        count={retentionItems.length}
                        value={retentionItems.reduce((s, i) => s + i.value, 0)}
                        color="pink"
                    />
                </Grid.Col>
            </Grid>

            {/* Kanban Board */}
            {loading ? (
                <Center py="xl">
                    <Loader size="lg" />
                </Center>
            ) : (
                <ScrollArea>
                    <Group gap="md" align="flex-start" wrap="nowrap" pb="md">
                        {visibleStages.map((stage) => (
                            <FunnelColumn
                                key={stage.id}
                                stage={stage}
                                items={itemsByStage[stage.id] || []}
                                onAction={handleAction}
                            />
                        ))}
                    </Group>
                </ScrollArea>
            )}

            {/* CRM Detail Modal */}
            <CrmDetailModal
                opened={modalOpened}
                onClose={closeModal}
                item={selectedItem}
                entityType={selectedItem?.stage && [...LTV_STAGES, ...RETENTION_STAGES].some(s => s.id === selectedItem.stage) ? 'enrollment' : 'lead'}
                onRefresh={handleRefresh}
            />
        </Container>
    );
}

// ============================================================================
// Mock Data Generator
// ============================================================================

function generateMockData(): FunnelItem[] {
    const names = [
        'Ana Silva', 'Bruno Santos', 'Carla Oliveira', 'Diego Pereira',
        'Elena Costa', 'Fernando Lima', 'Gabriela Souza', 'Hugo Martins',
        'Isabela Rocha', 'João Pedro', 'Karina Alves', 'Lucas Ferreira',
    ];
    const sources = ['instagram', 'google', 'referral', 'website', 'facebook'];
    const courses = ['Intelligence Course', 'Advanced AI', 'Prompt Engineering'];
    const stages = ['new', 'contacted', 'qualified', 'trial_scheduled', 'trial_completed',
        'proposal_sent', 'enrolled', 'active', 'at_risk', 'completed', 'alumnus', 'upsell'];

    return names.map((name, i) => ({
        id: `item-${i}`,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
        phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        stage: stages[i % stages.length],
        status: 'active',
        assignedTo: i % 3 === 0 ? {
            id: 'user-1',
            name: 'Pedro Garcia',
            avatarUrl: null,
        } : null,
        value: Math.floor(500 + Math.random() * 2500),
        daysInStage: Math.floor(Math.random() * 20),
        lastContact: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        nextFollowup: Date.now() + Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000),
        source: sources[i % sources.length],
        course: courses[i % courses.length],
        tags: i % 2 === 0 ? ['VIP', 'Indicação'] : [],
    }));
}

