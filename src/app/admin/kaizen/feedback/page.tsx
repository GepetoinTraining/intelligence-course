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
    Rating,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconMessage2,
    IconPlus,
    IconEye,
    IconDotsVertical,
    IconThumbUp,
    IconThumbDown,
    IconStar,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Feedback {
    id: string;
    type: 'positive' | 'negative' | 'suggestion';
    category: string;
    message: string;
    rating?: number;
    authorName: string;
    createdAt: string;
    status: 'new' | 'reviewed' | 'resolved';
}

// Mock data
const mockFeedback: Feedback[] = [
    { id: '1', type: 'positive', category: 'Aulas', message: 'Professor muito didático!', rating: 5, authorName: 'Maria Silva', createdAt: '2026-02-05', status: 'new' },
    { id: '2', type: 'negative', category: 'Estrutura', message: 'Ar condicionado não está funcionando bem', authorName: 'Pedro Santos', createdAt: '2026-02-04', status: 'reviewed' },
    { id: '3', type: 'suggestion', category: 'Material', message: 'Seria bom ter mais exercícios práticos', authorName: 'Ana Costa', createdAt: '2026-02-03', status: 'resolved' },
    { id: '4', type: 'positive', category: 'Atendimento', message: 'Secretaria sempre muito prestativa', rating: 5, authorName: 'João Lima', createdAt: '2026-02-02', status: 'new' },
];

const typeColors: Record<string, string> = {
    positive: 'green',
    negative: 'red',
    suggestion: 'blue',
};

const typeLabels: Record<string, string> = {
    positive: 'Positivo',
    negative: 'Negativo',
    suggestion: 'Sugestão',
};

const statusColors: Record<string, string> = {
    new: 'blue',
    reviewed: 'yellow',
    resolved: 'green',
};

const statusLabels: Record<string, string> = {
    new: 'Novo',
    reviewed: 'Revisando',
    resolved: 'Resolvido',
};

export default function FeedbackPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/reviews');

    const [feedback] = useState<Feedback[]>(mockFeedback);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const filtered = activeTab === 'all'
        ? feedback
        : feedback.filter(f => f.type === activeTab);

    const positiveCount = feedback.filter(f => f.type === 'positive').length;
    const negativeCount = feedback.filter(f => f.type === 'negative').length;
    const suggestionCount = feedback.filter(f => f.type === 'suggestion').length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Kaizen</Text>
                    <Title order={2}>Feedback</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Registrar Feedback
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconMessage2 size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="xl">{feedback.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconThumbUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Positivos</Text>
                            <Text fw={700} size="xl">{positiveCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconThumbDown size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Negativos</Text>
                            <Text fw={700} size="xl">{negativeCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconStar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Média Geral</Text>
                            <Text fw={700} size="xl">4.2</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                    <Tabs.List>
                        <Tabs.Tab value="all">Todos ({feedback.length})</Tabs.Tab>
                        <Tabs.Tab value="positive">Positivos ({positiveCount})</Tabs.Tab>
                        <Tabs.Tab value="negative">Negativos ({negativeCount})</Tabs.Tab>
                        <Tabs.Tab value="suggestion">Sugestões ({suggestionCount})</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Autor</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Categoria</Table.Th>
                            <Table.Th>Mensagem</Table.Th>
                            <Table.Th>Avaliação</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((item) => (
                            <Table.Tr key={item.id}>
                                <Table.Td>
                                    <Group gap="sm">
                                        <Avatar size="sm" radius="xl" color="blue">
                                            {item.authorName.charAt(0)}
                                        </Avatar>
                                        <Text size="sm">{item.authorName}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={typeColors[item.type]} variant="light">
                                        {typeLabels[item.type]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="outline" color="gray">{item.category}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm" truncate style={{ maxWidth: 200 }}>{item.message}</Text>
                                </Table.Td>
                                <Table.Td>
                                    {item.rating ? <Rating value={item.rating} readOnly size="xs" /> : '-'}
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

