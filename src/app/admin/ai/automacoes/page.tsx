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
} from '@mantine/core';
import {
    IconRobot,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Prompt {
    id: string;
    name: string;
    description: string | null;
    tags: string;
    sharedWith: string;
    createdAt: number;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

function parseTags(tags: string): string[] {
    try {
        return JSON.parse(tags);
    } catch {
        return [];
    }
}

export default function AIAutomacoesPage() {
    const { data: prompts, isLoading, error, refetch } = useApi<Prompt[]>('/api/prompts');

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

    const allPrompts = prompts || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">AI</Text>
                    <Title order={2}>Automações</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Automação</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconRobot size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allPrompts.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allPrompts.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Tags</Table.Th>
                                <Table.Th>Compartilhamento</Table.Th>
                                <Table.Th>Criado</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allPrompts.map((prompt) => {
                                const tags = parseTags(prompt.tags);
                                return (
                                    <Table.Tr key={prompt.id}>
                                        <Table.Td>
                                            <Text fw={500}>{prompt.name}</Text>
                                            {prompt.description && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>{prompt.description}</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {tags.slice(0, 3).map((tag, i) => (
                                                    <Badge key={i} variant="light" size="xs">{tag}</Badge>
                                                ))}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="outline" size="sm">{prompt.sharedWith}</Badge>
                                        </Table.Td>
                                        <Table.Td>{formatDate(prompt.createdAt)}</Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconRobot size={48} color="gray" />
                            <Text c="dimmed">Nenhuma automação encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

