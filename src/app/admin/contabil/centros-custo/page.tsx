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
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconCategory,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconChartPie,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface CostCenter {
    id: string;
    code: string;
    name: string;
    type: 'revenue' | 'expense' | 'mixed';
    parent?: string;
    budget: number;
    actual: number;
    status: 'active' | 'inactive';
}

// Mock data
const mockCostCenters: CostCenter[] = [
    { id: '1', code: 'CC-001', name: 'Administrativo', type: 'expense', budget: 50000, actual: 42000, status: 'active' },
    { id: '2', code: 'CC-002', name: 'Acadêmico', type: 'mixed', budget: 80000, actual: 65000, status: 'active' },
    { id: '3', code: 'CC-003', name: 'Comercial', type: 'expense', budget: 30000, actual: 28000, status: 'active' },
    { id: '4', code: 'CC-004', name: 'Marketing', type: 'expense', budget: 25000, actual: 22000, status: 'active' },
    { id: '5', code: 'CC-005', name: 'Infraestrutura', type: 'expense', budget: 15000, actual: 8000, status: 'active' },
    { id: '6', code: 'CC-006', name: 'TI', type: 'expense', budget: 20000, actual: 18500, status: 'inactive' },
];

const typeColors: Record<string, string> = {
    revenue: 'green',
    expense: 'red',
    mixed: 'blue',
};

const typeLabels: Record<string, string> = {
    revenue: 'Receita',
    expense: 'Despesa',
    mixed: 'Misto',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getUtilizationColor(percent: number): string {
    if (percent >= 100) return 'red';
    if (percent >= 80) return 'yellow';
    return 'green';
}

export default function CentrosCustoPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/cost-centers');

    const [costCenters] = useState<CostCenter[]>(mockCostCenters);

    const totalBudget = costCenters.filter(c => c.status === 'active').reduce((acc, c) => acc + c.budget, 0);
    const totalActual = costCenters.filter(c => c.status === 'active').reduce((acc, c) => acc + c.actual, 0);
    const activeCount = costCenters.filter(c => c.status === 'active').length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Contábil</Text>
                    <Title order={2}>Centros de Custo</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Centro de Custo
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconCategory size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Centros Ativos</Text>
                            <Text fw={700} size="xl">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconChartPie size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Orçamento Total</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalBudget)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconChartPie size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Realizado</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalActual)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color={getUtilizationColor((totalActual / totalBudget) * 100)} size="lg" radius="md">
                            <IconChartPie size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Utilização</Text>
                            <Text fw={700} size="xl">{Math.round((totalActual / totalBudget) * 100)}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todos os Centros de Custo</Title>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Nome</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                            <Table.Th>Orçamento</Table.Th>
                            <Table.Th>Realizado</Table.Th>
                            <Table.Th>Utilização</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {costCenters.map((cc) => {
                            const utilization = Math.round((cc.actual / cc.budget) * 100);
                            return (
                                <Table.Tr key={cc.id} style={{ opacity: cc.status === 'inactive' ? 0.5 : 1 }}>
                                    <Table.Td>
                                        <Text fw={500}>{cc.code}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{cc.name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={typeColors[cc.type]} variant="light">
                                            {typeLabels[cc.type]}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatCurrency(cc.budget)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatCurrency(cc.actual)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={getUtilizationColor(utilization)} variant="light">
                                            {utilization}%
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={cc.status === 'active' ? 'green' : 'gray'}>
                                            {cc.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Lançamentos</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
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

