'use client';

import { use, useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Progress, Avatar, ThemeIcon, Paper, Table, ActionIcon,
    Tabs, TextInput, Select
} from '@mantine/core';
import {
    IconSearch, IconFilter, IconMail,
    IconCircleCheck, IconCircleHalf, IconCircle, IconChartBar
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

interface Student {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    lessonsCompleted: number;
    totalLessons: number;
    lastActive: string;
    capstoneStatus: 'not_started' | 'in_progress' | 'submitted' | 'graded';
    capstoneGrade?: number;
}


const CLASS_INFO = {
    name: 'Turma A - Manhã',
    code: 'ORBIT-A1',
    module: 'Módulo 1: The Orbit',
};

interface Props {
    params: Promise<{ classId: string }>;
}

export default function ClassDetailPage({ params }: Props) {
    const { classId } = use(params);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [classInfo, setClassInfo] = useState(CLASS_INFO);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch class info
            const classRes = await fetch(`/api/classes/${classId}`);
            if (classRes.ok) {
                const classJson = await classRes.json();
                if (classJson.data) {
                    setClassInfo({
                        name: classJson.data.name || CLASS_INFO.name,
                        code: classJson.data.code || CLASS_INFO.code,
                        module: classJson.data.module || CLASS_INFO.module,
                    });
                }
            }
            // Fetch enrolled students
            const res = await fetch(`/api/enrollments?classId=${classId}`);
            if (res.ok) {
                const json = await res.json();
                setStudents((json.data || []).map((e: any) => ({
                    id: e.studentId || e.id,
                    name: e.studentName || e.name || 'Aluno',
                    email: e.studentEmail || e.email || '',
                    avatar: e.avatarUrl || undefined,
                    lessonsCompleted: e.lessonsCompleted || 0,
                    totalLessons: e.totalLessons || 1,
                    lastActive: e.lastActive || '-',
                    capstoneStatus: e.capstoneStatus || 'not_started',
                    capstoneGrade: e.capstoneGrade,
                })));
            }
        } catch (err) {
            console.error('Failed to fetch class data', err);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const completedCount = students.filter(s => s.lessonsCompleted === s.totalLessons).length;
    const avgProgress = students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.lessonsCompleted / s.totalLessons) * 100, 0) / students.length) : 0;
    const submittedCount = students.filter(s => s.capstoneStatus === 'submitted' || s.capstoneStatus === 'graded').length;

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    const getCapstoneStatusBadge = (status: Student['capstoneStatus'], grade?: number) => {
        switch (status) {
            case 'graded':
                return <Badge color="green" variant="light">Avaliado: {grade}%</Badge>;
            case 'submitted':
                return <Badge color="blue" variant="light">Enviado</Badge>;
            case 'in_progress':
                return <Badge color="yellow" variant="light">Em Andamento</Badge>;
            default:
                return <Badge color="gray" variant="light">Não Iniciado</Badge>;
        }
    };

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Group gap="sm" mb="xs">
                        <Badge variant="light" color="violet" size="lg">{CLASS_INFO.code}</Badge>
                        <Badge variant="outline" color="gray">{CLASS_INFO.module}</Badge>
                    </Group>
                    <Title order={2}>{classInfo.name}</Title>
                    <Text c="dimmed">{students.length} alunos matriculados</Text>
                </div>
                <Group>
                    <Button variant="light" leftSection={<IconMail size={16} />}>
                        Enviar Mensagem
                    </Button>
                    <ExportButton
                        data={filteredStudents.map(s => ({
                            name: s.name,
                            email: s.email,
                            progress: `${s.lessonsCompleted}/${s.totalLessons}`,
                            progressPercent: `${Math.round((s.lessonsCompleted / s.totalLessons) * 100)}%`,
                            capstoneStatus: s.capstoneStatus === 'graded'
                                ? `Avaliado: ${s.capstoneGrade}%`
                                : s.capstoneStatus === 'submitted'
                                    ? 'Enviado'
                                    : s.capstoneStatus === 'in_progress'
                                        ? 'Em Andamento'
                                        : 'Não Iniciado',
                            lastActive: s.lastActive,
                        }))}
                        columns={[
                            { key: 'name', label: 'Nome' },
                            { key: 'email', label: 'E-mail' },
                            { key: 'progress', label: 'Progresso' },
                            { key: 'progressPercent', label: '% Concluído' },
                            { key: 'capstoneStatus', label: 'Capstone' },
                            { key: 'lastActive', label: 'Última Atividade' },
                        ]}
                        title={`Turma ${classInfo.name} - ${classInfo.module}`}
                        filename={`turma_${classId}`}
                        formats={['csv', 'xlsx', 'pdf']}
                        label="Exportar"
                    />
                </Group>
            </Group>

            {/* Stats */}
            <Group grow>
                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={44} radius="md" variant="light" color="green">
                            <IconCircleCheck size={22} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{completedCount}/{students.length}</Text>
                            <Text size="sm" c="dimmed">Concluíram Módulo</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={44} radius="md" variant="light" color="cyan">
                            <IconChartBar size={22} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{avgProgress}%</Text>
                            <Text size="sm" c="dimmed">Progresso Médio</Text>
                        </div>
                    </Group>
                </Paper>

                <Paper shadow="xs" radius="md" p="lg" withBorder>
                    <Group>
                        <ThemeIcon size={44} radius="md" variant="light" color="violet">
                            <IconCircleHalf size={22} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{submittedCount}</Text>
                            <Text size="sm" c="dimmed">Capstones Enviados</Text>
                        </div>
                    </Group>
                </Paper>
            </Group>

            {/* Tabs */}
            <Tabs defaultValue="students">
                <Tabs.List>
                    <Tabs.Tab value="students">Alunos</Tabs.Tab>
                    <Tabs.Tab value="capstones">Capstones para Avaliar</Tabs.Tab>
                    <Tabs.Tab value="analytics">Analytics</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="students" pt="md">
                    <Stack gap="md">
                        {/* Search & Filter */}
                        <Group>
                            <TextInput
                                placeholder="Buscar aluno..."
                                leftSection={<IconSearch size={16} />}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <Select
                                placeholder="Filtrar por status"
                                data={[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'completed', label: 'Concluídos' },
                                    { value: 'in_progress', label: 'Em Andamento' },
                                    { value: 'behind', label: 'Atrasados' },
                                ]}
                                defaultValue="all"
                                leftSection={<IconFilter size={16} />}
                            />
                        </Group>

                        {/* Students Table */}
                        <Card shadow="xs" radius="md" p={0} withBorder>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Aluno</Table.Th>
                                        <Table.Th>Progresso</Table.Th>
                                        <Table.Th>Capstone</Table.Th>
                                        <Table.Th>Última Atividade</Table.Th>
                                        <Table.Th></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredStudents.map((student) => (
                                        <Table.Tr key={student.id}>
                                            <Table.Td>
                                                <Group gap="sm">
                                                    <Avatar size={36} radius="xl" color="violet">
                                                        {student.name.split(' ').map(n => n[0]).join('')}
                                                    </Avatar>
                                                    <div>
                                                        <Text size="sm" fw={500}>{student.name}</Text>
                                                        <Text size="xs" c="dimmed">{student.email}</Text>
                                                    </div>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Progress
                                                        value={(student.lessonsCompleted / student.totalLessons) * 100}
                                                        size="sm"
                                                        w={80}
                                                        color="cyan"
                                                    />
                                                    <Text size="xs" c="dimmed">
                                                        {student.lessonsCompleted}/{student.totalLessons}
                                                    </Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                {getCapstoneStatusBadge(student.capstoneStatus, student.capstoneGrade)}
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" c="dimmed">{student.lastActive}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Button variant="subtle" size="xs">
                                                    Ver Detalhes
                                                </Button>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Card>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="capstones" pt="md">
                    <Stack gap="md">
                        {students.filter(s => s.capstoneStatus === 'submitted').map((student) => (
                            <Card key={student.id} shadow="xs" radius="md" p="lg" withBorder>
                                <Group justify="space-between">
                                    <Group gap="md">
                                        <Avatar size={48} radius="xl" color="violet">
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                        </Avatar>
                                        <div>
                                            <Text fw={600}>{student.name}</Text>
                                            <Text size="sm" c="dimmed">Capstone: The World Builder</Text>
                                        </div>
                                    </Group>
                                    <Group>
                                        <Button variant="light">Ver Submissão</Button>
                                        <Button>Avaliar</Button>
                                    </Group>
                                </Group>
                            </Card>
                        ))}
                        {students.filter(s => s.capstoneStatus === 'submitted').length === 0 && (
                            <Paper p="xl" ta="center" c="dimmed">
                                Nenhum capstone aguardando avaliação
                            </Paper>
                        )}
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="analytics" pt="md">
                    <Paper p="xl" ta="center" c="dimmed" withBorder radius="md">
                        📊 Analytics em desenvolvimento...
                    </Paper>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
}
