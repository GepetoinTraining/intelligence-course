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
    RingProgress,
    Center,
    Loader,
    Alert,
} from '@mantine/core';
import {
    IconChartBar,
    IconDownload,
    IconTrendingUp,
    IconUsers,
    IconCash,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// Demo KPI data
const kpiData = [
    { metric: 'Taxa de Renovação', current: 78, target: 85, unit: '%', trend: 'up' },
    { metric: 'NPS (Net Promoter Score)', current: 72, target: 80, unit: '', trend: 'up' },
    { metric: 'Ticket Médio', current: 890, target: 950, unit: 'R$', trend: 'stable' },
    { metric: 'CAC (Custo Aquisição)', current: 120, target: 100, unit: 'R$', trend: 'down' },
    { metric: 'LTV/CAC', current: 8.5, target: 10, unit: 'x', trend: 'up' },
    { metric: 'Churn Mensal', current: 3.2, target: 2.5, unit: '%', trend: 'stable' },
];

export default function KPIsPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/reports/financial');

    const achieved = kpiData.filter(k => k.current >= k.target).length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Relatórios & BI</Text>
                    <Title order={2}>Indicadores (KPIs)</Title>
                </div>
                <Group>
                    <Badge size="lg" variant="light">Fevereiro 2026</Badge>
                    <Button variant="light" leftSection={<IconDownload size={16} />}>
                        Exportar
                    </Button>
                </Group>
            </Group>

            {/* Summary */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total KPIs</Text>
                            <Text fw={700} size="lg">{kpiData.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Metas Atingidas</Text>
                            <Text fw={700} size="lg">{achieved}/{kpiData.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <RingProgress
                            size={50}
                            thickness={5}
                            sections={[{ value: (achieved / kpiData.length) * 100, color: 'green' }]}
                            label={
                                <Center>
                                    <Text size="xs" fw={700}>{Math.round((achieved / kpiData.length) * 100)}%</Text>
                                </Center>
                            }
                        />
                        <div>
                            <Text size="xs" c="dimmed">Performance</Text>
                            <Text fw={700} size="lg">{Math.round((achieved / kpiData.length) * 100)}%</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Melhoria</Text>
                            <Text fw={700} size="lg">{kpiData.filter(k => k.trend === 'up').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* KPI Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {kpiData.map((kpi) => (
                    <Card key={kpi.metric} withBorder p="md">
                        <Group justify="space-between" mb="sm">
                            <Text fw={500}>{kpi.metric}</Text>
                            <Badge
                                variant="light"
                                color={
                                    kpi.trend === 'up' ? 'green' :
                                        kpi.trend === 'down' ? 'red' : 'gray'
                                }
                            >
                                {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
                            </Badge>
                        </Group>
                        <Group justify="space-between" align="flex-end">
                            <div>
                                <Text size="xs" c="dimmed">Atual</Text>
                                <Text fw={700} size="xl" c={kpi.current >= kpi.target ? 'green' : 'orange'}>
                                    {kpi.unit === 'R$' ? 'R$ ' : ''}{kpi.current}{kpi.unit === '%' ? '%' : kpi.unit === 'x' ? 'x' : ''}
                                </Text>
                            </div>
                            <div>
                                <Text size="xs" c="dimmed">Meta</Text>
                                <Text fw={500} size="lg">
                                    {kpi.unit === 'R$' ? 'R$ ' : ''}{kpi.target}{kpi.unit === '%' ? '%' : kpi.unit === 'x' ? 'x' : ''}
                                </Text>
                            </div>
                            <RingProgress
                                size={60}
                                thickness={6}
                                sections={[{ value: Math.min((kpi.current / kpi.target) * 100, 100), color: kpi.current >= kpi.target ? 'green' : 'orange' }]}
                                label={
                                    <Center>
                                        <Text size="xs" fw={700}>{Math.round((kpi.current / kpi.target) * 100)}%</Text>
                                    </Center>
                                }
                            />
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
}

