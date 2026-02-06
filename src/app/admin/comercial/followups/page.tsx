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
} from '@tabler/icons-react';

interface FollowUp {
    id: string;
    leadId: string;
    leadName: string;
    type: 'call' | 'email' | 'meeting' | 'task';
    description: string;
    dueDate: string;
    dueTime?: string;
    status: 'pending' | 'completed' | 'overdue';
    priority: 'low' | 'medium' | 'high';
    assignedTo: string;
    createdAt: string;
}

// Mock data for follow-ups
const mockFollowUps: FollowUp[] = [
    { id: '1', leadId: 'l1', leadName: 'Maria Silva', type: 'call', description: 'Retornar ligação sobre proposta', dueDate: '2026-02-05', dueTime: '10:00', status: 'pending', priority: 'high', assignedTo: 'João', createdAt: '2026-02-03' },
    { id: '2', leadId: 'l2', leadName: 'Pedro Santos', type: 'email', description: 'Enviar proposta atualizada', dueDate: '2026-02-05', status: 'pending', priority: 'medium', assignedTo: 'João', createdAt: '2026-02-04' },
    { id: '3', leadId: 'l3', leadName: 'Ana Costa', type: 'meeting', description: 'Reunião de fechamento', dueDate: '2026-02-06', dueTime: '14:00', status: 'pending', priority: 'high', assignedTo: 'Maria', createdAt: '2026-02-02' },
    { id: '4', leadId: 'l4', leadName: 'Carlos Lima', type: 'call', description: 'Confirmar interesse', dueDate: '2026-02-04', status: 'overdue', priority: 'high', assignedTo: 'João', createdAt: '2026-02-01' },
    { id: '5', leadId: 'l5', leadName: 'Fernanda Oliveira', type: 'task', description: 'Preparar material personalizado', dueDate: '2026-02-07', status: 'pending', priority: 'low', assignedTo: 'Ana', createdAt: '2026-02-04' },
];

const typeIcons: Record<string, React.ReactNode> = {
    call: <IconPhone size={16} />,
    email: <IconMail size={16} />,
    meeting: <IconCalendar size={16} />,
    task: <IconCheck size={16} />,
};

const typeColors: Record<string, string> = {
    call: 'blue',
    email: 'grape',
    meeting: 'green',
    task: 'gray',
};

const typeLabels: Record<string, string> = {
    call: 'Ligação',
    email: 'Email',
    meeting: 'Reunião',
    task: 'Tarefa',
};

const priorityColors: Record<string, string> = {
    low: 'gray',
    medium: 'yellow',
    high: 'red',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function FollowUpsPage() {
    const [followUps, setFollowUps] = useState<FollowUp[]>(mockFollowUps);
    const [activeTab, setActiveTab] = useState<string | null>('pending');

    const filtered = activeTab === 'all'
        ? followUps
        : followUps.filter(f =>
            activeTab === 'pending' ? (f.status === 'pending' || f.status === 'overdue') : f.status === activeTab
        );

    const pendingCount = followUps.filter(f => f.status === 'pending').length;
    const overdueCount = followUps.filter(f => f.status === 'overdue').length;
    const todayCount = followUps.filter(f => f.dueDate === '2026-02-05' && f.status !== 'completed').length;
    const completedCount = followUps.filter(f => f.status === 'completed').length;

    const handleComplete = (id: string) => {
        setFollowUps(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'completed' as const } : f
        ));
    };

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Comercial</Text>
                    <Title order={2}>Follow-ups</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Follow-up
                </Button>
            </Group>

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

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="pending">Pendentes ({pendingCount + overdueCount})</Tabs.Tab>
                        <Tabs.Tab value="completed">Concluídos ({completedCount})</Tabs.Tab>
                        <Tabs.Tab value="all">Todos ({followUps.length})</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 40 }}></Table.Th>
                            <Table.Th>Lead</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Descrição</Table.Th>
                            <Table.Th>Data/Hora</Table.Th>
                            <Table.Th>Prioridade</Table.Th>
                            <Table.Th>Responsável</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((followUp) => (
                            <Table.Tr
                                key={followUp.id}
                                style={{
                                    opacity: followUp.status === 'completed' ? 0.6 : 1,
                                    textDecoration: followUp.status === 'completed' ? 'line-through' : 'none',
                                }}
                            >
                                <Table.Td>
                                    <Checkbox
                                        checked={followUp.status === 'completed'}
                                        onChange={() => handleComplete(followUp.id)}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="sm">
                                        <Avatar size="sm" radius="xl" color="blue">
                                            {followUp.leadName.charAt(0)}
                                        </Avatar>
                                        <Text size="sm" fw={500}>{followUp.leadName}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge
                                        color={typeColors[followUp.type]}
                                        variant="light"
                                        leftSection={typeIcons[followUp.type]}
                                    >
                                        {typeLabels[followUp.type]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{followUp.description}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        <Text size="sm">{formatDate(followUp.dueDate)}</Text>
                                        {followUp.dueTime && <Text size="xs" c="dimmed">{followUp.dueTime}</Text>}
                                        {followUp.status === 'overdue' && (
                                            <Badge color="red" size="xs">Atrasado</Badge>
                                        )}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={priorityColors[followUp.priority]} variant="dot">
                                        {followUp.priority === 'high' ? 'Alta' : followUp.priority === 'medium' ? 'Média' : 'Baixa'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{followUp.assignedTo}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" size="sm">
                                                <IconDotsVertical size={14} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ver Lead</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                            <Menu.Item leftSection={<IconCheck size={14} />} color="green">Marcar Concluído</Menu.Item>
                                            <Menu.Divider />
                                            <Menu.Item leftSection={<IconTrash size={14} />} color="red">Excluir</Menu.Item>
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

