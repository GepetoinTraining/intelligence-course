'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
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
    Select,
} from '@mantine/core';
import {
    IconTicket,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconMessageCircle,
    IconCheck,
    IconClock,
    IconAlertCircle,
} from '@tabler/icons-react';

interface Ticket {
    id: string;
    number: string;
    requesterName: string;
    subject: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    assignedTo?: string;
    createdAt: string;
    updatedAt: string;
}



const statusColors: Record<string, string> = {
    open: 'blue',
    in_progress: 'yellow',
    waiting: 'orange',
    resolved: 'green',
    closed: 'gray',
};

const statusLabels: Record<string, string> = {
    open: 'Aberto',
    in_progress: 'Em Atendimento',
    waiting: 'Aguardando',
    resolved: 'Resolvido',
    closed: 'Fechado',
};

const priorityColors: Record<string, string> = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
};

const priorityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function TicketsPage() {
    const { data: ticketsData, isLoading } = useApi<any>('/api/tickets');
    const tickets: Ticket[] = ticketsData?.data || [];
    const [activeTab, setActiveTab] = useState<string | null>('open');

    const filtered = activeTab === 'all'
        ? tickets
        : activeTab === 'open'
            ? tickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting')
            : tickets.filter(t => t.status === activeTab);

    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
    const urgentCount = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Suporte</Text>
                    <Title order={2}>Tickets</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Ticket
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconTicket size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Aberto</Text>
                            <Text fw={700} size="xl">{openCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Resolvidos</Text>
                            <Text fw={700} size="xl">{resolvedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconAlertCircle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Alta Prioridade</Text>
                            <Text fw={700} size="xl">{urgentCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tempo Médio</Text>
                            <Text fw={700} size="xl">4h</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="open">Abertos ({openCount})</Tabs.Tab>
                        <Tabs.Tab value="resolved">Resolvidos ({resolvedCount})</Tabs.Tab>
                        <Tabs.Tab value="all">Todos ({tickets.length})</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Ticket</Table.Th>
                            <Table.Th>Solicitante</Table.Th>
                            <Table.Th>Categoria</Table.Th>
                            <Table.Th>Prioridade</Table.Th>
                            <Table.Th>Responsável</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Atualização</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((ticket) => (
                            <Table.Tr key={ticket.id}>
                                <Table.Td>
                                    <div>
                                        <Text size="sm" fw={500}>{ticket.number}</Text>
                                        <Text size="xs" c="dimmed" truncate style={{ maxWidth: 200 }}>
                                            {ticket.subject}
                                        </Text>
                                    </div>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="sm">
                                        <Avatar size="sm" radius="xl" color="blue">
                                            {ticket.requesterName.charAt(0)}
                                        </Avatar>
                                        <Text size="sm">{ticket.requesterName}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" color="gray">{ticket.category}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={priorityColors[ticket.priority]}
                                        variant="dot"
                                    >
                                        {priorityLabels[ticket.priority]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{ticket.assignedTo || '-'}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[ticket.status]} variant="light">
                                        {statusLabels[ticket.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{formatDate(ticket.updatedAt)}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" size="sm">
                                                <IconDotsVertical size={14} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ver Ticket</Menu.Item>
                                            <Menu.Item leftSection={<IconMessageCircle size={14} />}>Responder</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                            {ticket.status !== 'resolved' && (
                                                <Menu.Item leftSection={<IconCheck size={14} />} color="green">
                                                    Marcar como Resolvido
                                                </Menu.Item>
                                            )}
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

