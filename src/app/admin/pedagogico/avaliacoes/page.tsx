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
    Select,
} from '@mantine/core';
import {
    IconClipboardCheck,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconFileText,
    IconUsers,
    IconChartBar,
    IconDownload,
} from '@tabler/icons-react';

interface Assessment {
    id: string;
    classId: string;
    className: string;
    name: string;
    type: 'exam' | 'quiz' | 'assignment' | 'project' | 'participation';
    weight: number;
    maxScore: number;
    dueDate?: string;
    status: 'draft' | 'published' | 'grading' | 'graded';
    submissionsCount: number;
    totalStudents: number;
    avgScore?: number;
}

// Mock data for assessments
const mockAssessments: Assessment[] = [
    { id: '1', classId: 'c1', className: 'Turma A - Básico', name: 'Prova Mensal - Fevereiro', type: 'exam', weight: 30, maxScore: 100, dueDate: '2026-02-28', status: 'published', submissionsCount: 0, totalStudents: 15 },
    { id: '2', classId: 'c1', className: 'Turma A - Básico', name: 'Quiz: Verbos Regulares', type: 'quiz', weight: 10, maxScore: 20, dueDate: '2026-02-10', status: 'graded', submissionsCount: 15, totalStudents: 15, avgScore: 16.5 },
    { id: '3', classId: 'c2', className: 'Turma B - Intermediário', name: 'Writing Assignment', type: 'assignment', weight: 20, maxScore: 50, dueDate: '2026-02-15', status: 'grading', submissionsCount: 12, totalStudents: 18 },
    { id: '4', classId: 'c2', className: 'Turma B - Intermediário', name: 'Projeto Final', type: 'project', weight: 40, maxScore: 100, dueDate: '2026-03-15', status: 'draft', submissionsCount: 0, totalStudents: 18 },
    { id: '5', classId: 'c3', className: 'Business English', name: 'Presentation Skills', type: 'participation', weight: 15, maxScore: 30, status: 'graded', submissionsCount: 10, totalStudents: 10, avgScore: 25.2 },
];

const typeColors: Record<string, string> = {
    exam: 'red',
    quiz: 'blue',
    assignment: 'green',
    project: 'grape',
    participation: 'orange',
};

const typeLabels: Record<string, string> = {
    exam: 'Prova',
    quiz: 'Quiz',
    assignment: 'Trabalho',
    project: 'Projeto',
    participation: 'Participação',
};

const statusColors: Record<string, string> = {
    draft: 'gray',
    published: 'blue',
    grading: 'yellow',
    graded: 'green',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    published: 'Publicada',
    grading: 'Corrigindo',
    graded: 'Corrigida',
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function AvaliacoesPage() {
    const [assessments] = useState<Assessment[]>(mockAssessments);

    const totalAssessments = assessments.length;
    const gradedCount = assessments.filter(a => a.status === 'graded').length;
    const pendingGrading = assessments.filter(a => a.status === 'grading').length;
    const avgScoreAll = assessments
        .filter(a => a.avgScore)
        .reduce((acc, a) => acc + (a.avgScore || 0), 0) / (assessments.filter(a => a.avgScore).length || 1);

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Pedagógico</Text>
                    <Title order={2}>Avaliações</Title>
                </div>
                <Group>
                    <Select
                        placeholder="Todas as turmas"
                        data={[
                            { value: 'all', label: 'Todas as Turmas' },
                            { value: 'c1', label: 'Turma A - Básico' },
                            { value: 'c2', label: 'Turma B - Intermediário' },
                            { value: 'c3', label: 'Business English' },
                        ]}
                        w={180}
                        clearable
                    />
                    <Button leftSection={<IconPlus size={16} />}>
                        Nova Avaliação
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconClipboardCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total de Avaliações</Text>
                            <Text fw={700} size="xl">{totalAssessments}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Corrigidas</Text>
                            <Text fw={700} size="xl">{gradedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="yellow" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Aguardando Correção</Text>
                            <Text fw={700} size="xl">{pendingGrading}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Média Geral</Text>
                            <Text fw={700} size="xl">{avgScoreAll.toFixed(1)}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Avaliações</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Avaliação</Table.Th>
                            <Table.Th>Turma</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Peso</Table.Th>
                            <Table.Th>Entregas</Table.Th>
                            <Table.Th>Média</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {assessments.map((assessment) => {
                            const submissionRate = assessment.totalStudents > 0
                                ? (assessment.submissionsCount / assessment.totalStudents) * 100
                                : 0;
                            const avgPercent = assessment.avgScore && assessment.maxScore
                                ? (assessment.avgScore / assessment.maxScore) * 100
                                : null;

                            return (
                                <Table.Tr key={assessment.id}>
                                    <Table.Td>
                                        <div>
                                            <Text fw={500}>{assessment.name}</Text>
                                            {assessment.dueDate && (
                                                <Text size="xs" c="dimmed">Entrega: {formatDate(assessment.dueDate)}</Text>
                                            )}
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{assessment.className}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={typeColors[assessment.type]} variant="light">
                                            {typeLabels[assessment.type]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline">{assessment.weight}%</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Progress
                                                value={submissionRate}
                                                size="sm"
                                                w={50}
                                                color={submissionRate === 100 ? 'green' : 'blue'}
                                            />
                                            <Text size="sm">{assessment.submissionsCount}/{assessment.totalStudents}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        {avgPercent !== null ? (
                                            <Badge
                                                color={avgPercent >= 70 ? 'green' : avgPercent >= 50 ? 'yellow' : 'red'}
                                                variant="light"
                                            >
                                                {avgPercent.toFixed(0)}%
                                            </Badge>
                                        ) : (
                                            <Text size="sm" c="dimmed">-</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={statusColors[assessment.status]} variant="light">
                                            {statusLabels[assessment.status]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconDotsVertical size={14} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Resultados</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                <Menu.Item leftSection={<IconChartBar size={14} />}>Estatísticas</Menu.Item>
                                                <Menu.Item leftSection={<IconDownload size={14} />}>Exportar Notas</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

