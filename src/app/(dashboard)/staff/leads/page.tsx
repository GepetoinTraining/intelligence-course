'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title,
    Text,
    Card,
    Stack,
    Group,
    Badge,
    Avatar,
    Paper,
    Button,
    TextInput,
    Select,
    ActionIcon,
    Menu,
    Modal,
    Tabs,
    SimpleGrid,
    Checkbox,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch,
    IconFilter,
    IconPlus,
    IconPhone,
    IconMail,
    IconBrandWhatsapp,
    IconCalendarEvent,
    IconDotsVertical,
    IconUser,
    IconArrowRight,
    IconGripVertical,
    IconTag,
    IconUsers,
    IconTrash,
    IconCheck,
} from '@tabler/icons-react';
import Link from 'next/link';

// Lead status pipeline stages
const stages = [
    { id: 'new', label: 'Novos', color: 'blue' },
    { id: 'contacted', label: 'Contatados', color: 'cyan' },
    { id: 'qualified', label: 'Qualificados', color: 'teal' },
    { id: 'trial_scheduled', label: 'Trial Agendado', color: 'violet' },
    { id: 'trial_completed', label: 'Trial Feito', color: 'grape' },
    { id: 'proposal_sent', label: 'Proposta', color: 'orange' },
];



const sourceLabels: Record<string, string> = {
    instagram: 'Instagram',
    website: 'Website',
    referral: 'Indicação',
    google: 'Google',
    facebook: 'Facebook',
    walk_in: 'Presencial',
};

const sourceColors: Record<string, string> = {
    instagram: 'pink',
    website: 'blue',
    referral: 'green',
    google: 'red',
    facebook: 'indigo',
    walk_in: 'teal',
};

const STAFF = [
    { value: 'carlos', label: 'Carlos' },
    { value: 'julia', label: 'Julia' },
    { value: 'marina', label: 'Marina' },
];

const TAGS = [
    { value: 'hot', label: '🔥 Hot', color: 'red' },
    { value: 'priority', label: '⭐ Prioridade', color: 'yellow' },
    { value: 'cold', label: '❄️ Frio', color: 'blue' },
    { value: 'followup', label: '📞 Follow-up', color: 'green' },
];

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    interest: string;
    createdAt: string;
    assignedTo: string | null;
    tags: string[];
}

interface LeadCardProps {
    lead: Lead;
    onContact: (leadId: string, type: string) => void;
    isSelected: boolean;
    onSelect: (leadId: string) => void;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
}

function LeadCard({ lead, onContact, isSelected, onSelect, onDragStart }: LeadCardProps) {
    return (
        <Paper
            p="sm"
            withBorder
            radius="md"
            style={{
                cursor: 'grab',
                opacity: 1,
                border: isSelected ? '2px solid var(--mantine-color-blue-5)' : undefined,
            }}
            draggable
            onDragStart={(e) => onDragStart(e, lead.id)}
        >
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onSelect(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                        size="xs"
                    />
                    <Avatar size="sm" color="blue" radius="xl">
                        {lead.name.charAt(0)}
                    </Avatar>
                    <div>
                        <Text
                            size="sm"
                            fw={500}
                            lineClamp={1}
                            component={Link}
                            href={`/staff/leads/${lead.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            {lead.name}
                        </Text>
                        <Text size="xs" c="dimmed">{lead.interest}</Text>
                    </div>
                </Group>
                <Menu withinPortal position="bottom-end" shadow="sm">
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={(e) => e.preventDefault()}
                        >
                            <IconDotsVertical size={14} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item leftSection={<IconUser size={14} />} component={Link} href={`/staff/leads/${lead.id}`}>
                            Ver detalhes
                        </Menu.Item>
                        <Menu.Item leftSection={<IconCalendarEvent size={14} />}>
                            Agendar trial
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Label>Mover para</Menu.Label>
                        {stages.map(stage => (
                            <Menu.Item key={stage.id} leftSection={<IconArrowRight size={14} />}>
                                {stage.label}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <Group gap="xs" mb="xs">
                <Badge size="xs" color={sourceColors[lead.source]} variant="light">
                    {sourceLabels[lead.source]}
                </Badge>
                {lead.tags.map(tag => {
                    const tagData = TAGS.find(t => t.value === tag);
                    return tagData ? (
                        <Badge key={tag} size="xs" color={tagData.color} variant="filled">
                            {tagData.label}
                        </Badge>
                    ) : null;
                })}
                <Text size="xs" c="dimmed">{lead.createdAt}</Text>
            </Group>

            {lead.assignedTo && (
                <Text size="xs" c="dimmed" mb="xs">
                    👤 {lead.assignedTo}
                </Text>
            )}

            <Group gap="xs" onClick={(e) => e.preventDefault()}>
                <ActionIcon
                    size="sm"
                    variant="light"
                    color="green"
                    onClick={() => onContact(lead.id, 'whatsapp')}
                >
                    <IconBrandWhatsapp size={14} />
                </ActionIcon>
                <ActionIcon
                    size="sm"
                    variant="light"
                    color="blue"
                    onClick={() => onContact(lead.id, 'phone')}
                >
                    <IconPhone size={14} />
                </ActionIcon>
                <ActionIcon
                    size="sm"
                    variant="light"
                    color="violet"
                    onClick={() => onContact(lead.id, 'email')}
                >
                    <IconMail size={14} />
                </ActionIcon>
            </Group>
        </Paper>
    );
}

export default function LeadPipelinePage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/leads');
                const json = await res.json();
                if (json.data) {
                    const mapped = json.data.map((l: any) => ({
                        id: l.id,
                        name: l.name || '',
                        email: l.email || '',
                        phone: l.phone || '',
                        status: l.status || 'new',
                        source: l.source || 'website',
                        interest: l.interestedIn ? (JSON.parse(l.interestedIn)[0] || '') : '',
                        createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : '',
                        assignedTo: l.assignedTo || null,
                        tags: l.tags ? JSON.parse(l.tags) : [],
                    }));
                    setLeads(mapped);
                }
            } catch (err) {
                console.error('Failed to fetch leads:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);
    const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
    const [newLeadOpened, { open: openNewLead, close: closeNewLead }] = useDisclosure(false);
    const [bulkOpened, { open: openBulk, close: closeBulk }] = useDisclosure(false);
    const [viewMode, setViewMode] = useState<string>('kanban');
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [draggedLead, setDraggedLead] = useState<string | null>(null);

    // Bulk action state
    const [bulkAssignee, setBulkAssignee] = useState<string | null>(null);
    const [bulkTag, setBulkTag] = useState<string | null>(null);

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
            lead.email.toLowerCase().includes(search.toLowerCase());
        const matchesSource = !sourceFilter || lead.source === sourceFilter;
        const matchesAssignee = !assigneeFilter || lead.assignedTo?.toLowerCase() === assigneeFilter;
        return matchesSearch && matchesSource && matchesAssignee;
    });

    const getLeadsByStage = (stageId: string) => {
        return filteredLeads.filter(lead => lead.status === stageId);
    };

    const handleContact = (leadId: string, type: string) => {
        console.log(`Contact ${leadId} via ${type}`);
    };

    const handleSelect = (leadId: string) => {
        setSelectedLeads(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) {
                next.delete(leadId);
            } else {
                next.add(leadId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedLeads.size === filteredLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
        }
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggedLead(leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        if (draggedLead) {
            setLeads(prev => prev.map(lead =>
                lead.id === draggedLead ? { ...lead, status: stageId } : lead
            ));
            setDraggedLead(null);
        }
    };

    const handleBulkAssign = () => {
        if (bulkAssignee) {
            const assigneeName = STAFF.find(s => s.value === bulkAssignee)?.label || bulkAssignee;
            setLeads(prev => prev.map(lead =>
                selectedLeads.has(lead.id) ? { ...lead, assignedTo: assigneeName } : lead
            ));
        }
        closeBulk();
        setSelectedLeads(new Set());
        setBulkAssignee(null);
    };

    const handleBulkTag = () => {
        if (bulkTag) {
            setLeads(prev => prev.map(lead =>
                selectedLeads.has(lead.id)
                    ? { ...lead, tags: lead.tags.includes(bulkTag) ? lead.tags : [...lead.tags, bulkTag] }
                    : lead
            ));
        }
        closeBulk();
        setSelectedLeads(new Set());
        setBulkTag(null);
    };

    const handleBulkDelete = () => {
        setLeads(prev => prev.filter(lead => !selectedLeads.has(lead.id)));
        closeBulk();
        setSelectedLeads(new Set());
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={1}>Pipeline de Leads</Title>
                    <Text c="dimmed" size="lg">
                        {filteredLeads.length} leads no funil • Arraste para mover
                    </Text>
                </div>
                <Group>
                    {selectedLeads.size > 0 && (
                        <Button
                            variant="light"
                            leftSection={<IconUsers size={18} />}
                            onClick={openBulk}
                        >
                            Ações em Massa ({selectedLeads.size})
                        </Button>
                    )}
                    <Button
                        leftSection={<IconPlus size={18} />}
                        onClick={openNewLead}
                    >
                        Novo Lead
                    </Button>
                </Group>
            </Group>

            {/* Filters */}
            <Card shadow="sm" radius="md" p="md" withBorder>
                <Group>
                    <Checkbox
                        checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                        indeterminate={selectedLeads.size > 0 && selectedLeads.size < filteredLeads.length}
                        onChange={handleSelectAll}
                        label={`Selecionar todos (${selectedLeads.size})`}
                    />
                    <TextInput
                        placeholder="Buscar por nome ou email..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Origem"
                        leftSection={<IconFilter size={16} />}
                        data={[
                            { value: 'instagram', label: 'Instagram' },
                            { value: 'website', label: 'Website' },
                            { value: 'referral', label: 'Indicação' },
                            { value: 'google', label: 'Google' },
                            { value: 'facebook', label: 'Facebook' },
                            { value: 'walk_in', label: 'Presencial' },
                        ]}
                        value={sourceFilter}
                        onChange={setSourceFilter}
                        clearable
                        w={150}
                    />
                    <Select
                        placeholder="Responsável"
                        leftSection={<IconUser size={16} />}
                        data={STAFF}
                        value={assigneeFilter}
                        onChange={setAssigneeFilter}
                        clearable
                        w={150}
                    />
                    <Tabs value={viewMode} onChange={(v) => setViewMode(v || 'kanban')}>
                        <Tabs.List>
                            <Tabs.Tab value="kanban">Kanban</Tabs.Tab>
                            <Tabs.Tab value="list">Lista</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </Group>
            </Card>

            {/* Kanban Board with Drag & Drop */}
            {viewMode === 'kanban' && (
                <div style={{ overflowX: 'auto' }}>
                    <Group align="flex-start" wrap="nowrap" gap="md" style={{ minWidth: 'max-content' }}>
                        {stages.map((stage) => {
                            const stageLeads = getLeadsByStage(stage.id);
                            return (
                                <Card
                                    key={stage.id}
                                    shadow="sm"
                                    radius="md"
                                    p="md"
                                    withBorder
                                    style={{
                                        width: 300,
                                        flexShrink: 0,
                                        minHeight: 400,
                                        backgroundColor: draggedLead ? 'var(--mantine-color-gray-0)' : undefined,
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, stage.id)}
                                >
                                    <Group justify="space-between" mb="md">
                                        <Group gap="xs">
                                            <Badge color={stage.color} variant="filled" size="lg">
                                                {stageLeads.length}
                                            </Badge>
                                            <Text fw={600}>{stage.label}</Text>
                                        </Group>
                                    </Group>

                                    <Stack gap="sm">
                                        {stageLeads.length === 0 ? (
                                            <Text c="dimmed" ta="center" py="xl" size="sm">
                                                {draggedLead ? 'Solte aqui para mover' : 'Nenhum lead'}
                                            </Text>
                                        ) : (
                                            stageLeads.map((lead) => (
                                                <LeadCard
                                                    key={lead.id}
                                                    lead={lead}
                                                    onContact={handleContact}
                                                    isSelected={selectedLeads.has(lead.id)}
                                                    onSelect={handleSelect}
                                                    onDragStart={handleDragStart}
                                                />
                                            ))
                                        )}
                                    </Stack>
                                </Card>
                            );
                        })}
                    </Group>
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <Card shadow="sm" radius="md" p="md" withBorder>
                    <Stack gap="sm">
                        {filteredLeads.map((lead) => (
                            <Paper
                                key={lead.id}
                                p="md"
                                withBorder
                                radius="md"
                                style={{
                                    border: selectedLeads.has(lead.id) ? '2px solid var(--mantine-color-blue-5)' : undefined
                                }}
                            >
                                <Group justify="space-between">
                                    <Group>
                                        <Checkbox
                                            checked={selectedLeads.has(lead.id)}
                                            onChange={() => handleSelect(lead.id)}
                                        />
                                        <Avatar color="blue" radius="xl">
                                            {lead.name.charAt(0)}
                                        </Avatar>
                                        <div>
                                            <Text
                                                fw={500}
                                                component={Link}
                                                href={`/staff/leads/${lead.id}`}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                {lead.name}
                                            </Text>
                                            <Text size="sm" c="dimmed">{lead.email} • {lead.phone}</Text>
                                        </div>
                                    </Group>
                                    <Group>
                                        <Badge color={sourceColors[lead.source]} variant="light">
                                            {sourceLabels[lead.source]}
                                        </Badge>
                                        {lead.tags.map(tag => {
                                            const tagData = TAGS.find(t => t.value === tag);
                                            return tagData ? (
                                                <Badge key={tag} size="sm" color={tagData.color} variant="filled">
                                                    {tagData.label}
                                                </Badge>
                                            ) : null;
                                        })}
                                        <Badge
                                            color={stages.find(s => s.id === lead.status)?.color}
                                            variant="filled"
                                        >
                                            {stages.find(s => s.id === lead.status)?.label}
                                        </Badge>
                                        {lead.assignedTo && (
                                            <Text size="sm" c="dimmed">👤 {lead.assignedTo}</Text>
                                        )}
                                        <Text size="sm" c="dimmed">{lead.createdAt}</Text>
                                        <Group gap="xs">
                                            <ActionIcon variant="light" color="green" size="sm">
                                                <IconBrandWhatsapp size={14} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="blue" size="sm">
                                                <IconPhone size={14} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="violet" size="sm">
                                                <IconMail size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Card>
            )}

            {/* New Lead Modal */}
            <Modal
                opened={newLeadOpened}
                onClose={closeNewLead}
                title="Novo Lead"
                size="md"
            >
                <Stack>
                    <TextInput label="Nome" placeholder="Nome completo" required />
                    <TextInput label="Email" placeholder="email@exemplo.com" />
                    <TextInput label="Telefone" placeholder="(11) 99999-9999" />
                    <TextInput label="WhatsApp" placeholder="(11) 99999-9999" />
                    <Select
                        label="Origem"
                        placeholder="Selecione"
                        data={[
                            { value: 'instagram', label: 'Instagram' },
                            { value: 'website', label: 'Website' },
                            { value: 'referral', label: 'Indicação' },
                            { value: 'google', label: 'Google' },
                            { value: 'facebook', label: 'Facebook' },
                            { value: 'walk_in', label: 'Presencial' },
                        ]}
                    />
                    <Select
                        label="Interesse"
                        placeholder="Selecione o curso"
                        data={[
                            { value: 'english_a1', label: 'English A1' },
                            { value: 'english_a2', label: 'English A2' },
                            { value: 'english_b1', label: 'English B1' },
                            { value: 'spanish_a1', label: 'Spanish A1' },
                            { value: 'intelligence', label: 'Intelligence' },
                        ]}
                    />
                    <Select
                        label="Responsável"
                        placeholder="Atribuir a"
                        data={STAFF}
                    />
                    <TextInput label="Observações" placeholder="Notas sobre o lead..." />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeNewLead}>
                            Cancelar
                        </Button>
                        <Button onClick={closeNewLead}>
                            Salvar Lead
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Bulk Actions Modal */}
            <Modal
                opened={bulkOpened}
                onClose={closeBulk}
                title={`Ações em Massa (${selectedLeads.size} selecionados)`}
                size="md"
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        Selecione uma ação para aplicar aos {selectedLeads.size} leads selecionados:
                    </Text>

                    <Card withBorder p="md">
                        <Stack gap="sm">
                            <Text fw={500}>Atribuir Responsável</Text>
                            <Group>
                                <Select
                                    placeholder="Selecione"
                                    data={STAFF}
                                    value={bulkAssignee}
                                    onChange={setBulkAssignee}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    leftSection={<IconUsers size={16} />}
                                    onClick={handleBulkAssign}
                                    disabled={!bulkAssignee}
                                >
                                    Atribuir
                                </Button>
                            </Group>
                        </Stack>
                    </Card>

                    <Card withBorder p="md">
                        <Stack gap="sm">
                            <Text fw={500}>Adicionar Tag</Text>
                            <Group>
                                <Select
                                    placeholder="Selecione"
                                    data={TAGS.map(t => ({ value: t.value, label: t.label }))}
                                    value={bulkTag}
                                    onChange={setBulkTag}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    leftSection={<IconTag size={16} />}
                                    onClick={handleBulkTag}
                                    disabled={!bulkTag}
                                >
                                    Adicionar
                                </Button>
                            </Group>
                        </Stack>
                    </Card>

                    <Card withBorder p="md" bg="red.0">
                        <Group justify="space-between">
                            <div>
                                <Text fw={500} c="red">Excluir Leads</Text>
                                <Text size="sm" c="dimmed">Esta ação não pode ser desfeita</Text>
                            </div>
                            <Button
                                color="red"
                                variant="light"
                                leftSection={<IconTrash size={16} />}
                                onClick={handleBulkDelete}
                            >
                                Excluir
                            </Button>
                        </Group>
                    </Card>

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeBulk}>
                            Fechar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

