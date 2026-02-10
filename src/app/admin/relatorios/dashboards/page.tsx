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
    RingProgress,
    Center,
    Paper,
    Progress,
    Loader,
    Alert,
} from '@mantine/core';
import {
    IconLayoutDashboard,
    IconTrendingUp,
    IconTrendingDown,
    IconUsers,
    IconCash,
    IconTarget,
    IconBook,
    IconBriefcase,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// Demo KPI data
const kpis = [
    { label: 'Alunos Ativos', value: 1247, change: 5.2, trend: 'up', target: 1300 },
    { label: 'Taxa Retenção', value: 92, suffix: '%', change: 2.1, trend: 'up', target: 95 },
    { label: 'Receita Mensal', value: 287, prefix: 'R$', suffix: 'k', change: 8.5, trend: 'up', target: 300 },
    { label: 'Inadimplência', value: 4.2, suffix: '%', change: -1.3, trend: 'down', target: 3 },
    { label: 'CAC', value: 450, prefix: 'R$', change: -5.0, trend: 'down', target: 400 },
    { label: 'LTV', value: 8500, prefix: 'R$', change: 3.2, trend: 'up', target: 9000 },
];

const departmentMetrics = [
    { name: 'Marketing', leads: 156, conversion: 12.3, color: 'pink' },
    { name: 'Comercial', opportunities: 45, closedWon: 18, color: 'blue' },
    { name: 'Pedagógico', classes: 24, avgAttendance: 89, color: 'purple' },
    { name: 'Financeiro', receivables: 145000, collected: 89000, color: 'green' },
];

export default function DashboardsPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/reports/financial');


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Relatórios & BI</Text>
                    <Title order={2}>Dashboards</Title>
                </div>
                <Badge size="lg" variant="light" color="blue">
                    Atualizado há 5 min
                </Badge>
            </Group>

            {/* Main KPIs */}
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
                {kpis.map((kpi) => (
                    <Card key={kpi.label} withBorder p="md">
                        <Text size="xs" c="dimmed" mb="xs">{kpi.label}</Text>
                        <Group justify="space-between" align="flex-end">
                            <Text fw={700} size="xl">
                                {kpi.prefix}{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}{kpi.suffix}
                            </Text>
                            <Badge
                                variant="light"
                                color={kpi.trend === 'up' ? 'green' : 'red'}
                                leftSection={
                                    kpi.trend === 'up' ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />
                                }
                            >
                                {kpi.change > 0 ? '+' : ''}{kpi.change}%
                            </Badge>
                        </Group>
                        <Progress
                            value={((typeof kpi.value === 'number' ? kpi.value : 0) / kpi.target) * 100}
                            size="xs"
                            mt="xs"
                            color={((typeof kpi.value === 'number' ? kpi.value : 0) / kpi.target) >= 1 ? 'green' : 'blue'}
                        />
                        <Text size="xs" c="dimmed" mt={4}>
                            Meta: {kpi.prefix}{kpi.target}{kpi.suffix}
                        </Text>
                    </Card>
                ))}
            </SimpleGrid>

            {/* Department Performance */}
            <Text fw={500}>Performance por Área</Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                {departmentMetrics.map((dept) => (
                    <Card key={dept.name} withBorder p="md">
                        <Group justify="space-between" mb="md">
                            <Badge variant="light" color={dept.color}>{dept.name}</Badge>
                        </Group>
                        {dept.name === 'Marketing' && (
                            <>
                                <Group justify="space-between">
                                    <Text size="sm">Leads</Text>
                                    <Text fw={600}>{dept.leads}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm">Conversão</Text>
                                    <Text fw={600}>{dept.conversion}%</Text>
                                </Group>
                            </>
                        )}
                        {dept.name === 'Comercial' && (
                            <>
                                <Group justify="space-between">
                                    <Text size="sm">Oportunidades</Text>
                                    <Text fw={600}>{dept.opportunities}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm">Fechadas</Text>
                                    <Text fw={600}>{dept.closedWon}</Text>
                                </Group>
                            </>
                        )}
                        {dept.name === 'Pedagógico' && (
                            <>
                                <Group justify="space-between">
                                    <Text size="sm">Turmas</Text>
                                    <Text fw={600}>{dept.classes}</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm">Frequência</Text>
                                    <Text fw={600}>{dept.avgAttendance}%</Text>
                                </Group>
                            </>
                        )}
                        {dept.name === 'Financeiro' && (
                            <>
                                <Group justify="space-between">
                                    <Text size="sm">A Receber</Text>
                                    <Text fw={600}>R$ {((dept.receivables ?? 0) / 1000).toFixed(0)}k</Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="sm">Recebido</Text>
                                    <Text fw={600}>R$ {((dept.collected ?? 0) / 1000).toFixed(0)}k</Text>
                                </Group>
                            </>
                        )}
                    </Card>
                ))}
            </SimpleGrid>

            {/* Chart Placeholder */}
            <Card withBorder p="lg">
                <Text fw={500} mb="md">Evolução de Matrículas</Text>
                <Center h={200} bg="var(--mantine-color-gray-0)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                    <Text c="dimmed" size="sm">📊 Gráfico de área - últimos 12 meses</Text>
                </Center>
            </Card>
        </Stack>
    );
}

