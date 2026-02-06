'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Card, Stack, Group, Badge, Button,
    Paper, ActionIcon, TextInput, Textarea, Modal, Avatar,
    ThemeIcon, Box, Menu, ScrollArea,
    Code, Grid
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconDotsVertical, IconArrowRight, IconArrowLeft,
    IconTrash, IconEdit, IconBuilding, IconMail, IconPhone,
    IconCalendar, IconUser, IconNotes
} from '@tabler/icons-react';

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    school: string;
    message?: string;
    stage: 'new' | 'contacted' | 'demo_scheduled' | 'proposal_sent' | 'won' | 'lost';
    createdAt: Date;
    notes?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const INITIAL_LEADS: Lead[] = [
    {
        id: '1',
        name: 'Maria Silva',
        email: 'maria@escolatecnologia.com.br',
        phone: '(11) 99999-1111',
        school: 'Escola Tecnologia São Paulo',
        message: 'Interessados no módulo pedagógico e AI companion.',
        stage: 'new',
        createdAt: new Date('2026-02-04'),
        notes: '',
    },
    {
        id: '2',
        name: 'Carlos Mendes',
        email: 'carlos@codekids.com.br',
        school: 'Code Kids',
        message: 'Queremos migrar de outra plataforma. 200 alunos atualmente.',
        stage: 'contacted',
        createdAt: new Date('2026-02-03'),
        notes: 'Ligou de volta, interessado em demo.',
    },
    {
        id: '3',
        name: 'Ana Oliveira',
        email: 'ana@futuroacademy.com',
        phone: '(21) 98888-2222',
        school: 'Futuro Academy',
        stage: 'demo_scheduled',
        createdAt: new Date('2026-02-01'),
        notes: 'Demo agendada para 07/02 às 14h.',
    },
    {
        id: '4',
        name: 'Roberto Lima',
        email: 'roberto@digitalschool.com.br',
        school: 'Digital School',
        message: 'Rede com 5 unidades, precisamos de multi-org.',
        stage: 'proposal_sent',
        createdAt: new Date('2026-01-28'),
        notes: 'Proposta Enterprise enviada. Aguardando retorno.',
    },
];

const STAGES = [
    { key: 'new', label: 'Novos', color: 'gray', icon: IconPlus },
    { key: 'contacted', label: 'Contatados', color: 'blue', icon: IconPhone },
    { key: 'demo_scheduled', label: 'Demo Agendada', color: 'violet', icon: IconCalendar },
    { key: 'proposal_sent', label: 'Proposta Enviada', color: 'orange', icon: IconMail },
    { key: 'won', label: 'Ganhos 🎉', color: 'green', icon: IconBuilding },
    { key: 'lost', label: 'Perdidos', color: 'red', icon: IconTrash },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function LeadCard({
    lead,
    onMoveRight,
    onMoveLeft,
    onEdit,
    onDelete
}: {
    lead: Lead;
    onMoveRight: () => void;
    onMoveLeft: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const stageIndex = STAGES.findIndex(s => s.key === lead.stage);
    const canMoveRight = stageIndex < STAGES.length - 1;
    const canMoveLeft = stageIndex > 0;

    return (
        <Card shadow="sm" radius="md" p="sm" withBorder>
            <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                    <Group gap="xs">
                        <Avatar size="sm" color="violet" radius="xl">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <div>
                            <Text size="sm" fw={600}>{lead.name}</Text>
                            <Text size="xs" c="dimmed">{lead.school}</Text>
                        </div>
                    </Group>

                    <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                                <IconDotsVertical size={14} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
                                Editar
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={onDelete}>
                                Excluir
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

                <Text size="xs" c="dimmed" lineClamp={2}>
                    {lead.message || lead.notes || lead.email}
                </Text>

                <Group gap="xs" justify="space-between">
                    <Text size="xs" c="dimmed">
                        {lead.createdAt.toLocaleDateString('pt-BR')}
                    </Text>

                    <Group gap={4}>
                        {canMoveLeft && (
                            <ActionIcon
                                size="xs"
                                variant="subtle"
                                onClick={onMoveLeft}
                                title="Mover para trás"
                            >
                                <IconArrowLeft size={12} />
                            </ActionIcon>
                        )}
                        {canMoveRight && (
                            <ActionIcon
                                size="xs"
                                variant="light"
                                color="violet"
                                onClick={onMoveRight}
                                title="Avançar"
                            >
                                <IconArrowRight size={12} />
                            </ActionIcon>
                        )}
                    </Group>
                </Group>
            </Stack>
        </Card>
    );
}

function KanbanColumn({
    stage,
    leads,
    onMoveRight,
    onMoveLeft,
    onEdit,
    onDelete
}: {
    stage: typeof STAGES[0];
    leads: Lead[];
    onMoveRight: (id: string) => void;
    onMoveLeft: (id: string) => void;
    onEdit: (lead: Lead) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <Paper
            p="md"
            radius="md"
            bg="dark.7"
            style={{
                minWidth: 280,
                maxWidth: 280,
                height: 'calc(100vh - 200px)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Group gap="xs" mb="md">
                <ThemeIcon size="sm" variant="light" color={stage.color} radius="xl">
                    <stage.icon size={12} />
                </ThemeIcon>
                <Text fw={600} size="sm" c="white">{stage.label}</Text>
                <Badge size="sm" color={stage.color} variant="filled">{leads.length}</Badge>
            </Group>

            <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                <Stack gap="sm">
                    {leads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onMoveRight={() => onMoveRight(lead.id)}
                            onMoveLeft={() => onMoveLeft(lead.id)}
                            onEdit={() => onEdit(lead)}
                            onDelete={() => onDelete(lead.id)}
                        />
                    ))}
                    {leads.length === 0 && (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                            Nenhum lead
                        </Text>
                    )}
                </Stack>
            </ScrollArea>
        </Paper>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PlatformLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [opened, { open, close }] = useDisclosure(false);

    // New lead form state
    const [newLead, setNewLead] = useState({
        name: '',
        email: '',
        phone: '',
        school: '',
        message: '',
    });

    const moveLead = (id: string, direction: 'left' | 'right') => {
        setLeads(prev => prev.map(lead => {
            if (lead.id !== id) return lead;

            const currentIndex = STAGES.findIndex(s => s.key === lead.stage);
            const newIndex = direction === 'right'
                ? Math.min(currentIndex + 1, STAGES.length - 1)
                : Math.max(currentIndex - 1, 0);

            return { ...lead, stage: STAGES[newIndex].key as Lead['stage'] };
        }));
    };

    const deleteLead = (id: string) => {
        setLeads(prev => prev.filter(lead => lead.id !== id));
    };

    const addLead = () => {
        if (!newLead.name || !newLead.email || !newLead.school) return;

        const lead: Lead = {
            id: Date.now().toString(),
            name: newLead.name,
            email: newLead.email,
            phone: newLead.phone,
            school: newLead.school,
            message: newLead.message,
            stage: 'new',
            createdAt: new Date(),
        };

        setLeads(prev => [...prev, lead]);
        setNewLead({ name: '', email: '', phone: '', school: '', message: '' });
        close();
    };

    return (
        <Box bg="dark.9" mih="100vh">
            <Container size="xl" py="lg">
                {/* Header */}
                <Group justify="space-between" mb="lg">
                    <div>
                        <Title order={2} c="white">Pipeline de Leads</Title>
                        <Text c="gray.5">Gerencie escolas interessadas no NodeZero</Text>
                    </div>

                    <Group>
                        <Badge size="lg" color="violet" variant="filled">
                            {leads.length} leads
                        </Badge>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            variant="gradient"
                            gradient={{ from: 'violet', to: 'grape' }}
                            onClick={open}
                        >
                            Novo Lead
                        </Button>
                    </Group>
                </Group>

                {/* Stats */}
                <Grid mb="lg">
                    {STAGES.slice(0, 5).map(stage => {
                        const count = leads.filter(l => l.stage === stage.key).length;
                        return (
                            <Grid.Col key={stage.key} span={{ base: 6, md: 2.4 }}>
                                <Paper p="md" radius="md" bg="dark.7">
                                    <Group gap="xs">
                                        <ThemeIcon size="md" color={stage.color} variant="light" radius="xl">
                                            <stage.icon size={16} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xl" fw={700} c="white">{count}</Text>
                                            <Text size="xs" c="dimmed">{stage.label}</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            </Grid.Col>
                        );
                    })}
                </Grid>

                {/* Kanban Board */}
                <ScrollArea>
                    <Group gap="md" align="flex-start" wrap="nowrap">
                        {STAGES.map(stage => (
                            <KanbanColumn
                                key={stage.key}
                                stage={stage}
                                leads={leads.filter(l => l.stage === stage.key)}
                                onMoveRight={(id) => moveLead(id, 'right')}
                                onMoveLeft={(id) => moveLead(id, 'left')}
                                onEdit={setEditingLead}
                                onDelete={deleteLead}
                            />
                        ))}
                    </Group>
                </ScrollArea>
            </Container>

            {/* New Lead Modal */}
            <Modal
                opened={opened}
                onClose={close}
                title="Novo Lead"
                size="md"
                styles={{
                    header: { background: 'var(--mantine-color-dark-7)' },
                    body: { background: 'var(--mantine-color-dark-7)' },
                    title: { color: 'white' },
                }}
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome"
                        placeholder="Nome do contato"
                        required
                        value={newLead.name}
                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                        styles={{ label: { color: 'white' } }}
                    />
                    <TextInput
                        label="Email"
                        placeholder="email@escola.com"
                        required
                        type="email"
                        value={newLead.email}
                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                        styles={{ label: { color: 'white' } }}
                    />
                    <TextInput
                        label="Telefone"
                        placeholder="(00) 00000-0000"
                        value={newLead.phone}
                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                        styles={{ label: { color: 'white' } }}
                    />
                    <TextInput
                        label="Escola"
                        placeholder="Nome da escola"
                        required
                        value={newLead.school}
                        onChange={(e) => setNewLead({ ...newLead, school: e.target.value })}
                        styles={{ label: { color: 'white' } }}
                    />
                    <Textarea
                        label="Mensagem"
                        placeholder="Notas sobre o lead..."
                        rows={3}
                        value={newLead.message}
                        onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
                        styles={{ label: { color: 'white' } }}
                    />
                    <Button
                        fullWidth
                        onClick={addLead}
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                    >
                        Adicionar Lead
                    </Button>
                </Stack>
            </Modal>
        </Box>
    );
}

