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
    Table,
    Loader,
    Alert,
    Center,
    Button,
} from '@mantine/core';
import {
    IconReport,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface ProgressRecord {
    id: string;
    userId: string;
    lessonId: string | null;
    taskId: string | null;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
    score: number | null;
    maxScore: number | null;
    completedAt: number | null;
}

const statusLabels: Record<string, string> = {
    not_started: 'Não iniciado',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    skipped: 'Pulado',
};

export default function NotasPage() {
    const { data, isLoading, error, refetch } = useApi<{ progress: ProgressRecord[] }>('/api/progress');

    const progress = data?.progress || [];

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

    const completed = progress.filter(p => p.status === 'completed');
    const avgScore = completed.length > 0
        ? Math.round(completed.reduce((sum, p) => sum + (p.score || 0), 0) / completed.length)
        : 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Pedagógico</Text>
                <Title order={2}>Notas</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconReport size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Registros</Text>
                            <Text fw={700} size="lg">{progress.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconReport size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Concluídos</Text>
                            <Text fw={700} size="lg">{completed.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconReport size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Média Geral</Text>
                            <Text fw={700} size="lg">{avgScore}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {progress.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Nota</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {progress.slice(0, 20).map((record) => (
                                <Table.Tr key={record.id}>
                                    <Table.Td><Text size="xs" c="dimmed">{record.id.slice(0, 8)}...</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {record.lessonId ? 'Lição' : record.taskId ? 'Tarefa' : 'Outro'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        {record.score !== null && record.maxScore !== null
                                            ? `${record.score}/${record.maxScore}`
                                            : '-'}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                record.status === 'completed' ? 'green' :
                                                    record.status === 'in_progress' ? 'yellow' : 'gray'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[record.status] || record.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconReport size={48} color="gray" />
                            <Text c="dimmed">Nenhum registro de notas</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

