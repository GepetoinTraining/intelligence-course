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
    IconBook,
    IconPlus,
    IconUsers,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Course {
    id: string;
    title: string;
    description: string | null;
    isPublished: number;
    isPublic: number;
    language: string;
    createdAt: number;
}

function parseTitle(title: string | null): string {
    if (!title) return '-';
    try {
        const parsed = JSON.parse(title);
        return parsed['pt-BR'] || parsed.en || Object.values(parsed)[0] || '-';
    } catch {
        return title;
    }
}

export default function CursosPage() {
    const { data: courses, isLoading, error, refetch } = useApi<Course[]>('/api/courses');

    const stats = {
        total: courses?.length || 0,
        published: courses?.filter(c => c.isPublished === 1).length || 0,
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
                    <Text size="sm" c="dimmed">Pedagógico</Text>
                    <Title order={2}>Cursos</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Curso
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Cursos</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Publicados</Text>
                            <Text fw={700} size="lg">{stats.published}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Courses Table */}
            <Card withBorder p="md">
                {courses && courses.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Curso</Table.Th>
                                <Table.Th>Idioma</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {courses.map((course) => (
                                <Table.Tr key={course.id}>
                                    <Table.Td>
                                        <Text fw={500}>{parseTitle(course.title)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline" size="sm">{course.language}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={course.isPublished === 1 ? 'green' : 'gray'}
                                            variant="light"
                                        >
                                            {course.isPublished === 1 ? 'Publicado' : 'Rascunho'}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBook size={48} color="gray" />
                            <Text c="dimmed">Nenhum curso encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Criar curso
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

