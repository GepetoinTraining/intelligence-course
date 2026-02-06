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
    IconBook2,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Lesson {
    id: string;
    title: string;
    moduleId: string;
    orderIndex: number;
    lessonType: string;
    contentFormat: string;
}

function parseTitle(title: string): string {
    try {
        const parsed = JSON.parse(title);
        return parsed.pt || parsed.en || title;
    } catch {
        return title;
    }
}

export default function MateriaisPage() {
    const { data: lessons, isLoading, error, refetch } = useApi<Lesson[]>('/api/lessons');

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

    const materials = lessons || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Pedagógico</Text>
                    <Title order={2}>Materiais</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Material</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBook2 size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{materials.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {materials.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Título</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Formato</Table.Th>
                                <Table.Th>Ordem</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {materials.map((lesson) => (
                                <Table.Tr key={lesson.id}>
                                    <Table.Td><Text fw={500}>{parseTitle(lesson.title)}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">{lesson.lessonType}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline" size="sm">{lesson.contentFormat}</Badge>
                                    </Table.Td>
                                    <Table.Td>{lesson.orderIndex}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBook2 size={48} color="gray" />
                            <Text c="dimmed">Nenhum material encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

