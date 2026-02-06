'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Paper,
    Loader, Center, SimpleGrid, ThemeIcon, Table, Progress,
    Avatar, RingProgress
} from '@mantine/core';
import {
    IconUsers, IconClock, IconTrendingUp, IconChartBar,
    IconStar, IconCash
} from '@tabler/icons-react';

interface StaffMember {
    id: string;
    name: string;
    role: 'teacher' | 'staff' | 'admin';
    hoursWorked: number;
    hoursTarget: number;
    efficiency: number;
    studentsAssigned: number;
    revenue: number;
    rating: number;
}

const roleLabels: Record<string, string> = {
    teacher: 'Professor',
    staff: 'Equipe',
    admin: 'Admin',
};

export default function OwnerStaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users?role=teacher');
            const data = await res.json();
            if (data.data) {
                setStaff(data.data.map((s: any) => ({
                    id: s.id,
                    name: s.name || 'Colaborador',
                    role: 'teacher',
                    hoursWorked: 0,
                    hoursTarget: 40,
                    efficiency: 0,
                    studentsAssigned: 0,
                    revenue: 0,
                    rating: 0,
                })));
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
    };

    const totalHoursWorked = staff.reduce((acc, s) => acc + s.hoursWorked, 0);
    const totalStudents = staff.reduce((acc, s) => acc + s.studentsAssigned, 0);
    const totalRevenue = staff.reduce((acc, s) => acc + s.revenue, 0);
    const avgEfficiency = staff.length > 0
        ? staff.reduce((acc, s) => acc + s.efficiency, 0) / staff.length
        : 0;

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Eficiência da Equipe</Title>
                    <Text c="dimmed">Análise de produtividade e performance</Text>
                </div>
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : (
                <Stack>
                    {/* Summary Cards */}
                    <SimpleGrid cols={4}>
                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Colaboradores</Text>
                                    <Text size="xl" fw={700}>{staff.length}</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="blue" radius="xl">
                                    <IconUsers size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Horas Trabalhadas</Text>
                                    <Text size="xl" fw={700}>{totalHoursWorked}h</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="green" radius="xl">
                                    <IconClock size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Eficiência Média</Text>
                                    <Text size="xl" fw={700}>{avgEfficiency.toFixed(0)}%</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="violet" radius="xl">
                                    <IconTrendingUp size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Receita Gerada</Text>
                                    <Text size="xl" fw={700}>{formatCurrency(totalRevenue)}</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="orange" radius="xl">
                                    <IconCash size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    </SimpleGrid>

                    {/* Staff Table */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Performance Individual</Title>
                        {staff.length === 0 ? (
                            <Paper withBorder p="xl" ta="center">
                                <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                    <IconUsers size={30} />
                                </ThemeIcon>
                                <Text c="dimmed">Nenhum colaborador cadastrado</Text>
                            </Paper>
                        ) : (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Colaborador</Table.Th>
                                        <Table.Th>Função</Table.Th>
                                        <Table.Th>Horas</Table.Th>
                                        <Table.Th>Eficiência</Table.Th>
                                        <Table.Th>Alunos</Table.Th>
                                        <Table.Th>Receita</Table.Th>
                                        <Table.Th>Avaliação</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {staff.map((member) => (
                                        <Table.Tr key={member.id}>
                                            <Table.Td>
                                                <Group gap="sm">
                                                    <Avatar size={32} radius="xl" color="blue">
                                                        {member.name.charAt(0)}
                                                    </Avatar>
                                                    <Text fw={500}>{member.name}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge variant="light">
                                                    {roleLabels[member.role] || member.role}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Text size="sm">{member.hoursWorked}h</Text>
                                                    <Text size="xs" c="dimmed">/ {member.hoursTarget}h</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Progress
                                                        value={member.efficiency}
                                                        size="sm"
                                                        w={80}
                                                        color={member.efficiency > 80 ? 'green' : member.efficiency > 50 ? 'yellow' : 'red'}
                                                    />
                                                    <Text size="xs">{member.efficiency}%</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>{member.studentsAssigned}</Table.Td>
                                            <Table.Td>{formatCurrency(member.revenue)}</Table.Td>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    <IconStar size={14} fill="var(--mantine-color-yellow-5)" color="var(--mantine-color-yellow-5)" />
                                                    <Text size="sm">{member.rating.toFixed(1)}</Text>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        )}
                    </Card>

                    {/* Efficiency Distribution */}
                    <SimpleGrid cols={2}>
                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Distribuição de Carga</Title>
                            <Paper withBorder p="xl" ta="center" bg="gray.0">
                                <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                    <IconChartBar size={30} />
                                </ThemeIcon>
                                <Text c="dimmed">
                                    Gráfico de distribuição será exibido com dados reais
                                </Text>
                            </Paper>
                        </Card>

                        <Card withBorder p="lg">
                            <Title order={4} mb="md">Custo por Aluno</Title>
                            <Paper withBorder p="xl" ta="center" bg="gray.0">
                                <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                    <IconCash size={30} />
                                </ThemeIcon>
                                <Text c="dimmed">
                                    Análise de custo será exibida com dados reais
                                </Text>
                            </Paper>
                        </Card>
                    </SimpleGrid>
                </Stack>
            )}
        </Container>
    );
}

