'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Paper,
    Loader, Center, SimpleGrid, ThemeIcon, SegmentedControl,
    Table, Progress
} from '@mantine/core';
import {
    IconTrendingUp, IconTrendingDown, IconChartLine,
    IconCalendar, IconCash, IconUsers
} from '@tabler/icons-react';

interface ProjectionMonth {
    month: string;
    expectedInflow: number;
    expectedOutflow: number;
    netProjection: number;
    confidence: number;
}

export default function OwnerProjectionsPage() {
    const [projections, setProjections] = useState<ProjectionMonth[]>([]);
    const [loading, setLoading] = useState(true);
    const [horizon, setHorizon] = useState<'3' | '6' | '12'>('3');

    useEffect(() => {
        fetchProjections();
    }, [horizon]);

    const fetchProjections = async () => {
        setLoading(true);
        try {
            // This would fetch from a projections API
            // For now, generate placeholder data based on current month
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const currentMonth = new Date().getMonth();
            const horizonNum = parseInt(horizon);

            const data: ProjectionMonth[] = [];
            for (let i = 1; i <= horizonNum; i++) {
                const monthIndex = (currentMonth + i) % 12;
                data.push({
                    month: months[monthIndex],
                    expectedInflow: 0,
                    expectedOutflow: 0,
                    netProjection: 0,
                    confidence: 90 - (i * 10),
                });
            }
            setProjections(data);
        } catch (error) {
            console.error('Failed to fetch projections:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100);
    };

    const totalExpectedInflow = projections.reduce((acc, p) => acc + p.expectedInflow, 0);
    const totalExpectedOutflow = projections.reduce((acc, p) => acc + p.expectedOutflow, 0);
    const totalNetProjection = totalExpectedInflow - totalExpectedOutflow;

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Projeções</Title>
                    <Text c="dimmed">Projeções financeiras futuras</Text>
                </div>
                <SegmentedControl
                    value={horizon}
                    onChange={(v) => setHorizon(v as typeof horizon)}
                    data={[
                        { label: '3 meses', value: '3' },
                        { label: '6 meses', value: '6' },
                        { label: '12 meses', value: '12' },
                    ]}
                />
            </Group>

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : (
                <Stack>
                    {/* Summary Cards */}
                    <SimpleGrid cols={3}>
                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Entradas Previstas</Text>
                                    <Text size="xl" fw={700} c="green">
                                        {formatCurrency(totalExpectedInflow)}
                                    </Text>
                                    <Text size="xs" c="dimmed">Próximos {horizon} meses</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="green" radius="xl">
                                    <IconTrendingUp size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Saídas Previstas</Text>
                                    <Text size="xl" fw={700} c="red">
                                        {formatCurrency(totalExpectedOutflow)}
                                    </Text>
                                    <Text size="xs" c="dimmed">Próximos {horizon} meses</Text>
                                </div>
                                <ThemeIcon size={48} variant="light" color="red" radius="xl">
                                    <IconTrendingDown size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>

                        <Card withBorder p="lg">
                            <Group justify="space-between">
                                <div>
                                    <Text size="sm" c="dimmed">Resultado Projetado</Text>
                                    <Text
                                        size="xl"
                                        fw={700}
                                        c={totalNetProjection >= 0 ? 'green' : 'red'}
                                    >
                                        {formatCurrency(totalNetProjection)}
                                    </Text>
                                    <Text size="xs" c="dimmed">Acumulado</Text>
                                </div>
                                <ThemeIcon
                                    size={48}
                                    variant="light"
                                    color={totalNetProjection >= 0 ? 'blue' : 'orange'}
                                    radius="xl"
                                >
                                    <IconChartLine size={24} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    </SimpleGrid>

                    {/* Monthly Projections */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Projeção Mensal</Title>
                        {projections.length > 0 ? (
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Mês</Table.Th>
                                        <Table.Th ta="right">Entradas</Table.Th>
                                        <Table.Th ta="right">Saídas</Table.Th>
                                        <Table.Th ta="right">Resultado</Table.Th>
                                        <Table.Th>Confiança</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {projections.map((p) => (
                                        <Table.Tr key={p.month}>
                                            <Table.Td fw={500}>{p.month}</Table.Td>
                                            <Table.Td ta="right" c="green">
                                                {formatCurrency(p.expectedInflow)}
                                            </Table.Td>
                                            <Table.Td ta="right" c="red">
                                                {formatCurrency(p.expectedOutflow)}
                                            </Table.Td>
                                            <Table.Td ta="right" c={p.netProjection >= 0 ? 'green' : 'red'}>
                                                {formatCurrency(p.netProjection)}
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Progress
                                                        value={p.confidence}
                                                        size="sm"
                                                        style={{ flex: 1 }}
                                                        color={p.confidence > 70 ? 'green' : p.confidence > 40 ? 'yellow' : 'red'}
                                                    />
                                                    <Text size="xs" c="dimmed">{p.confidence}%</Text>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Paper withBorder p="xl" ta="center">
                                <Text c="dimmed">Sem projeções disponíveis</Text>
                            </Paper>
                        )}
                    </Card>

                    {/* Chart Placeholder */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Visualização de Projeções</Title>
                        <Paper withBorder p="xl" ta="center" bg="gray.0">
                            <ThemeIcon size={60} variant="light" color="gray" radius="xl" mx="auto" mb="md">
                                <IconChartLine size={30} />
                            </ThemeIcon>
                            <Text c="dimmed">
                                Gráfico de projeções será exibido quando conectado ao banco de dados
                            </Text>
                            <Text size="xs" c="dimmed" mt="sm">
                                As projeções são baseadas em dados históricos e matrículas confirmadas
                            </Text>
                        </Paper>
                    </Card>

                    {/* Assumptions */}
                    <Card withBorder p="lg">
                        <Title order={4} mb="md">Premissas da Projeção</Title>
                        <SimpleGrid cols={3}>
                            <Paper withBorder p="md">
                                <Group gap="sm">
                                    <ThemeIcon variant="light" color="blue">
                                        <IconUsers size={16} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="sm" fw={500}>Alunos Ativos</Text>
                                        <Text size="xs" c="dimmed">Base atual de matrículas</Text>
                                    </div>
                                </Group>
                            </Paper>
                            <Paper withBorder p="md">
                                <Group gap="sm">
                                    <ThemeIcon variant="light" color="green">
                                        <IconCash size={16} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="sm" fw={500}>Mensalidade Média</Text>
                                        <Text size="xs" c="dimmed">Calculada por tipo de curso</Text>
                                    </div>
                                </Group>
                            </Paper>
                            <Paper withBorder p="md">
                                <Group gap="sm">
                                    <ThemeIcon variant="light" color="orange">
                                        <IconCalendar size={16} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="sm" fw={500}>Sazonalidade</Text>
                                        <Text size="xs" c="dimmed">Ajuste por período do ano</Text>
                                    </div>
                                </Group>
                            </Paper>
                        </SimpleGrid>
                    </Card>
                </Stack>
            )}
        </Container>
    );
}

