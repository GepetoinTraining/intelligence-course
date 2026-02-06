'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Table,
    Loader,
    Alert,
    Center,
    ActionIcon,
} from '@mantine/core';
import {
    IconBulb,
    IconPlus,
    IconThumbUp,
    IconAlertCircle,
    IconCheck,
    IconClock,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Suggestion {
    id: string;
    title: string;
    problemDescription: string;
    problemType: string;
    status: 'submitted' | 'under_review' | 'approved' | 'in_progress' | 'implemented' | 'rejected' | 'deferred';
    voteCount: number;
    createdAt: number;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    submitted: 'Enviada',
    under_review: 'Em Análise',
    approved: 'Aprovada',
    in_progress: 'Em Progresso',
    implemented: 'Implementada',
    rejected: 'Rejeitada',
    deferred: 'Adiada',
};

const problemTypeLabels: Record<string, string> = {
    process: 'Processo',
    quality: 'Qualidade',
    safety: 'Segurança',
    efficiency: 'Eficiência',
    cost: 'Custo',
    customer: 'Cliente',
    employee: 'Colaborador',
    other: 'Outro',
};

export default function SugestoesPage() {
    const { data: suggestions, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions');

    const stats = {
        total: suggestions?.length || 0,
        pending: suggestions?.filter(s => s.status === 'submitted' || s.status === 'under_review').length || 0,
        implemented: suggestions?.filter(s => s.status === 'implemented').length || 0,
        totalVotes: suggestions?.reduce((sum, s) => sum + (s.voteCount || 0), 0) || 0,
    };

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Kaizen</Text>
                    <Title order={2}>Sugestões de Melhoria</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Sugestão
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBulb size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Sugestões</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="lg">{stats.pending}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Implementadas</Text>
                            <Text fw={700} size="lg">{stats.implemented}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconThumbUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Votos</Text>
                            <Text fw={700} size="lg">{stats.totalVotes}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Suggestions Table */}
            <Card withBorder p="md">
                {suggestions && suggestions.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Sugestão</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Votos</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Ação</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {suggestions.map((suggestion) => (
                                <Table.Tr key={suggestion.id}>
                                    <Table.Td>
                                        <Text fw={500}>{suggestion.title}</Text>
                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                            {suggestion.problemDescription}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {problemTypeLabels[suggestion.problemType] || suggestion.problemType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconThumbUp size={14} />
                                            <Text fw={500}>{suggestion.voteCount}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                suggestion.status === 'implemented' ? 'green' :
                                                    suggestion.status === 'approved' || suggestion.status === 'in_progress' ? 'blue' :
                                                        suggestion.status === 'rejected' ? 'red' :
                                                            suggestion.status === 'deferred' ? 'gray' : 'yellow'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[suggestion.status] || suggestion.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(suggestion.createdAt)}</Table.Td>
                                    <Table.Td>
                                        <ActionIcon variant="subtle" size="sm">
                                            <IconThumbUp size={14} />
                                        </ActionIcon>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBulb size={48} color="gray" />
                            <Text c="dimmed">Nenhuma sugestão encontrada</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Enviar sugestão
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

