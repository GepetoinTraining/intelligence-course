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
} from '@mantine/core';
import {
    IconTable,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconClock,
    IconBook,
    IconUsers,
    IconCalendar,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Course {
    id: string;
    name: string;
    level: string;
    duration: number;
    modules: number;
    lessons: number;
}

interface CurriculumEntry {
    id: string;
    courseId: string;
    courseName: string;
    moduleOrder: number;
    moduleName: string;
    weekStart: number;
    weekEnd: number;
    topics: string[];
}

// Mock curriculum data
const mockCurriculum: CurriculumEntry[] = [
    { id: '1', courseId: 'c1', courseName: 'Inglês Básico', moduleOrder: 1, moduleName: 'Introdução ao Inglês', weekStart: 1, weekEnd: 4, topics: ['Alfabeto', 'Números', 'Cores', 'Cumprimentos'] },
    { id: '2', courseId: 'c1', courseName: 'Inglês Básico', moduleOrder: 2, moduleName: 'Verbos Básicos', weekStart: 5, weekEnd: 8, topics: ['Presente Simples', 'Verb To Be', 'Verbos de Ação'] },
    { id: '3', courseId: 'c1', courseName: 'Inglês Básico', moduleOrder: 3, moduleName: 'Vocabulário do Dia a Dia', weekStart: 9, weekEnd: 12, topics: ['Família', 'Casa', 'Rotina Diária'] },
    { id: '4', courseId: 'c2', courseName: 'Inglês Intermediário', moduleOrder: 1, moduleName: 'Tempos Verbais', weekStart: 1, weekEnd: 6, topics: ['Past Simple', 'Present Perfect', 'Future Forms'] },
    { id: '5', courseId: 'c2', courseName: 'Inglês Intermediário', moduleOrder: 2, moduleName: 'Comunicação', weekStart: 7, weekEnd: 12, topics: ['Conversations', 'Presentations', 'Writing'] },
];

export default function GradePage() {
    const [curriculum] = useState<CurriculumEntry[]>(mockCurriculum);
    const { data: courses } = useApi<Course[]>('/api/courses');

    // Group by course
    const groupedCurriculum = curriculum.reduce((acc, entry) => {
        if (!acc[entry.courseId]) {
            acc[entry.courseId] = {
                courseName: entry.courseName,
                modules: [],
            };
        }
        acc[entry.courseId].modules.push(entry);
        return acc;
    }, {} as Record<string, { courseName: string; modules: CurriculumEntry[] }>);

    const totalCourses = Object.keys(groupedCurriculum).length;
    const totalModules = curriculum.length;
    const totalTopics = curriculum.reduce((acc, c) => acc + c.topics.length, 0);

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Pedagógico</Text>
                    <Title order={2}>Grade Curricular</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Módulo
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Cursos</Text>
                            <Text fw={700} size="xl">{totalCourses}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconTable size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Módulos</Text>
                            <Text fw={700} size="xl">{totalModules}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCalendar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tópicos</Text>
                            <Text fw={700} size="xl">{totalTopics}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Duração Média</Text>
                            <Text fw={700} size="xl">12 sem</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {Object.entries(groupedCurriculum).map(([courseId, { courseName, modules }]) => (
                <Card key={courseId} withBorder mb="md">
                    <Group justify="space-between" mb="md">
                        <Group>
                            <ThemeIcon color="blue" size="lg" radius="md" variant="light">
                                <IconBook size={20} />
                            </ThemeIcon>
                            <div>
                                <Title order={4}>{courseName}</Title>
                                <Text size="sm" c="dimmed">{modules.length} módulos</Text>
                            </div>
                        </Group>
                        <Button variant="light" size="xs">Editar Grade</Button>
                    </Group>

                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ width: 50 }}>#</Table.Th>
                                <Table.Th>Módulo</Table.Th>
                                <Table.Th>Semanas</Table.Th>
                                <Table.Th>Tópicos</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {modules.sort((a, b) => a.moduleOrder - b.moduleOrder).map((module) => (
                                <Table.Tr key={module.id}>
                                    <Table.Td>
                                        <Badge variant="light">{module.moduleOrder}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={500}>{module.moduleName}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline">
                                            Sem {module.weekStart} - {module.weekEnd}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {module.topics.slice(0, 3).map((topic, i) => (
                                                <Badge key={i} size="xs" variant="light" color="gray">
                                                    {topic}
                                                </Badge>
                                            ))}
                                            {module.topics.length > 3 && (
                                                <Badge size="xs" variant="light">+{module.topics.length - 3}</Badge>
                                            )}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconDotsVertical size={14} />
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
            ))}
        </div>
    );
}

