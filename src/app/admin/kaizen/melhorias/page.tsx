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
    Progress,
} from '@mantine/core';
import {
    IconBulb,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconCheck,
    IconClock,
    IconTrendingUp,
} from '@tabler/icons-react';

interface Improvement {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    impact: number;
    progress: number;
    assignedTo?: string;
    createdAt: string;
}

// Mock data
const mockImprovements: Improvement[] = [
    { id: '1', title: 'Implementar sistema de reposição online', description: 'Permitir alunos reagendarem aulas pelo app', category: 'Operacional', priority: 'high', status: 'in_progress', impact: 8, progress: 60, assignedTo: 'João', createdAt: '2026-01-15' },
    { id: '2', title: 'Melhorar iluminação da sala 3', description: 'Trocar lâmpadas e adicionar cortinas', category: 'Infraestrutura', priority: 'medium', status: 'completed', impact: 5, progress: 100, createdAt: '2026-01-10' },
    { id: '3', title: 'Criar FAQ para dúvidas comuns', description: 'Documentar perguntas frequentes', category: 'Atendimento', priority: 'low', status: 'pending', impact: 6, progress: 0, createdAt: '2026-02-01' },
    { id: '4', title: 'Automatizar envio de boletos', description: 'Envio automático 5 dias antes do vencimento', category: 'Financeiro', priority: 'high', status: 'in_progress', impact: 9, progress: 80, assignedTo: 'Maria', createdAt: '2026-01-20' },
];

const priorityColors: Record<string, string> = {
    low: 'gray',
    medium: 'blue',
    high: 'red',
};

const priorityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
};

const statusColors: Record<string, string> = {
    pending: 'gray',
    in_progress: 'blue',
    completed: 'green',
};

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
};

export default function MelhoriasPage() {
    const [improvements] = useState<Improvement[]>(mockImprovements);

    const pendingCount = improvements.filter(i => i.status === 'pending').length;
    const inProgressCount = improvements.filter(i => i.status === 'in_progress').length;
    const completedCount = improvements.filter(i => i.status === 'completed').length;
    const avgImpact = Math.round(improvements.reduce((acc, i) => acc + i.impact, 0) / improvements.length);

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Kaizen</Text>
                    <Title order={2}>Melhorias</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Melhoria
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="gray" size="lg" radius="md">
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
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconBulb size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Andamento</Text>
                            <Text fw={700} size="xl">{inProgressCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídas</Text>
                            <Text fw={700} size="xl">{completedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Impacto Médio</Text>
                            <Text fw={700} size="xl">{avgImpact}/10</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Melhorias</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Melhoria</Table.Th>
                            <Table.Th>Categoria</Table.Th>
                            <Table.Th>Prioridade</Table.Th>
                            <Table.Th>Impacto</Table.Th>
                            <Table.Th>Progresso</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {improvements.map((item) => (
                            <Table.Tr key={item.id}>
                                <Table.Td>
                                    <div>
                                        <Text fw={500}>{item.title}</Text>
                                        <Text size="xs" c="dimmed" truncate style={{ maxWidth: 200 }}>
                                            {item.description}
                                        </Text>
                                    </div>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" color="gray">{item.category}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={priorityColors[item.priority]} variant="dot">
                                        {priorityLabels[item.priority]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={600}>{item.impact}/10</Text>
                                </Table.Td>
                                <Table.Td style={{ width: 120 }}>
                                    <Progress value={item.progress} color="blue" size="sm" />
                                    <Text size="xs" c="dimmed" ta="center">{item.progress}%</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[item.status]} variant="light">
                                        {statusLabels[item.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
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

