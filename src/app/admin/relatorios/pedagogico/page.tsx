'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Paper, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Select, Loader, Alert, Progress, RingProgress,
} from '@mantine/core';
import {
    IconSchool, IconUsers, IconClipboardCheck, IconAlertCircle,
    IconUserCheck, IconUserX, IconClock, IconChartBar,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';
import { useApi } from '@/hooks/useApi';

interface ClassData {
    id: string;
    name: string;
    courseId: string;
    maxStudents: number;
    status: string;
}

interface EnrollmentData {
    id: string;
    classId: string;
    personId?: string;
    status: string;
    enrolledAt?: number;
}

export default function RelatorioPedagogicoPage() {
    const { data: classesData, isLoading: loadingClasses, error: errorClasses } = useApi<ClassData[]>('/api/classes?limit=200');
    const { data: enrollmentsData, isLoading: loadingEnrollments, error: errorEnrollments } = useApi<EnrollmentData[]>('/api/enrollments?limit=500');

    const classes = classesData || [];
    const enrollments = enrollmentsData || [];
    const loading = loadingClasses || loadingEnrollments;
    const error = errorClasses || errorEnrollments;
    const [period, setPeriod] = useState('current');

    const stats = useMemo(() => {
        const activeClasses = classes.filter(c => c.status === 'active' || c.status === 'in_progress');
        const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'enrolled');
        const completedEnrollments = enrollments.filter(e => e.status === 'completed');
        const droppedEnrollments = enrollments.filter(e => e.status === 'cancelled' || e.status === 'dropped');
        const totalStudents = new Set(activeEnrollments.map(e => e.personId)).size;

        const classOccupancy = activeClasses.map(cls => {
            const enrolled = enrollments.filter(e => e.classId === cls.id && (e.status === 'active' || e.status === 'enrolled')).length;
            return {
                id: cls.id,
                name: cls.name,
                enrolled,
                capacity: cls.maxStudents || 20,
                occupancy: cls.maxStudents ? Math.round((enrolled / cls.maxStudents) * 100) : 0,
            };
        }).sort((a, b) => b.occupancy - a.occupancy);

        const avgOccupancy = classOccupancy.length > 0
            ? Math.round(classOccupancy.reduce((sum, c) => sum + c.occupancy, 0) / classOccupancy.length)
            : 0;

        const completionRate = enrollments.length > 0
            ? Math.round((completedEnrollments.length / enrollments.length) * 100)
            : 0;

        const dropoutRate = enrollments.length > 0
            ? Math.round((droppedEnrollments.length / enrollments.length) * 100)
            : 0;

        return {
            totalClasses: activeClasses.length,
            totalStudents,
            totalEnrollments: activeEnrollments.length,
            completedEnrollments: completedEnrollments.length,
            droppedEnrollments: droppedEnrollments.length,
            avgOccupancy,
            completionRate,
            dropoutRate,
            classOccupancy,
        };
    }, [classes, enrollments]);

    const formatPercent = (v: number) => `${v}%`;

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando relatório pedagógico...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Relatórios & BI</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Pedagógico</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Group gap="md" align="center">
                            <Title order={1}>Relatório Pedagógico</Title>
                        </Group>
                        <Group>
                            <Select
                                size="sm"
                                value={period}
                                onChange={(v) => setPeriod(v || 'current')}
                                data={[
                                    { value: 'current', label: 'Período Atual' },
                                    { value: 'last_month', label: 'Mês Passado' },
                                    { value: 'last_quarter', label: 'Último Trimestre' },
                                    { value: 'year', label: 'Ano Letivo' },
                                ]}
                                w={180}
                            />
                            <ExportButton
                                data={stats.classOccupancy}
                                organizationName="NodeZero"
                            />
                        </Group>
                    </Group>
                    <Text c="dimmed" mt="xs">Visão geral do desempenho acadêmico e ocupação de turmas.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>
                )}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Turmas Ativas</Text>
                                <Text size="xl" fw={700}>{stats.totalClasses}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconSchool size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Alunos Ativos</Text>
                                <Text size="xl" fw={700}>{stats.totalStudents}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconUsers size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Taxa de Conclusão</Text>
                                <Text size="xl" fw={700}>{formatPercent(stats.completionRate)}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="teal">
                                <IconUserCheck size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Taxa de Evasão</Text>
                                <Text size="xl" fw={700} c={stats.dropoutRate > 15 ? 'red' : undefined}>
                                    {formatPercent(stats.dropoutRate)}
                                </Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="red">
                                <IconUserX size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Occupancy Overview */}
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Ocupação Média</Text>
                            <Badge color={stats.avgOccupancy > 80 ? 'green' : stats.avgOccupancy > 50 ? 'yellow' : 'red'}>
                                {formatPercent(stats.avgOccupancy)}
                            </Badge>
                        </Group>
                        <Group justify="center">
                            <RingProgress
                                size={180}
                                thickness={18}
                                roundCaps
                                sections={[
                                    { value: stats.avgOccupancy, color: stats.avgOccupancy > 80 ? 'green' : stats.avgOccupancy > 50 ? 'yellow' : 'red' },
                                ]}
                                label={
                                    <Text ta="center" size="xl" fw={700}>{formatPercent(stats.avgOccupancy)}</Text>
                                }
                            />
                        </Group>
                        <Text size="sm" c="dimmed" ta="center" mt="sm">
                            {stats.totalEnrollments} matrículas em {stats.totalClasses} turmas
                        </Text>
                    </Card>

                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Status das Matrículas</Text>
                            <IconChartBar size={20} color="gray" />
                        </Group>
                        <Stack gap="md">
                            <div>
                                <Group justify="space-between" mb={4}>
                                    <Text size="sm">Ativas</Text>
                                    <Text size="sm" fw={600}>{stats.totalEnrollments}</Text>
                                </Group>
                                <Progress value={enrollments.length > 0 ? (stats.totalEnrollments / enrollments.length) * 100 : 0} color="green" size="lg" radius="md" />
                            </div>
                            <div>
                                <Group justify="space-between" mb={4}>
                                    <Text size="sm">Concluídas</Text>
                                    <Text size="sm" fw={600}>{stats.completedEnrollments}</Text>
                                </Group>
                                <Progress value={enrollments.length > 0 ? (stats.completedEnrollments / enrollments.length) * 100 : 0} color="blue" size="lg" radius="md" />
                            </div>
                            <div>
                                <Group justify="space-between" mb={4}>
                                    <Text size="sm">Canceladas/Evasão</Text>
                                    <Text size="sm" fw={600}>{stats.droppedEnrollments}</Text>
                                </Group>
                                <Progress value={enrollments.length > 0 ? (stats.droppedEnrollments / enrollments.length) * 100 : 0} color="red" size="lg" radius="md" />
                            </div>
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* Class Occupancy Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Ocupação por Turma</Text>
                        <Badge variant="light">{stats.classOccupancy.length} turmas</Badge>
                    </Group>
                    {stats.classOccupancy.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhuma turma ativa encontrada.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Turma</Table.Th>
                                    <Table.Th ta="center">Matriculados</Table.Th>
                                    <Table.Th ta="center">Capacidade</Table.Th>
                                    <Table.Th>Ocupação</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {stats.classOccupancy.slice(0, 20).map(cls => (
                                    <Table.Tr key={cls.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{cls.name || cls.id.slice(0, 8)}</Text>
                                        </Table.Td>
                                        <Table.Td ta="center">{cls.enrolled}</Table.Td>
                                        <Table.Td ta="center">{cls.capacity}</Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Progress
                                                    value={cls.occupancy}
                                                    size="lg"
                                                    radius="md"
                                                    color={cls.occupancy > 90 ? 'green' : cls.occupancy > 60 ? 'blue' : cls.occupancy > 30 ? 'yellow' : 'red'}
                                                    style={{ flex: 1 }}
                                                />
                                                <Text size="xs" fw={600} w={40} ta="right">{cls.occupancy}%</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={cls.occupancy >= 80 ? 'green' : cls.occupancy >= 50 ? 'yellow' : 'red'}
                                            >
                                                {cls.occupancy >= 80 ? 'Bom' : cls.occupancy >= 50 ? 'Regular' : 'Baixo'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
