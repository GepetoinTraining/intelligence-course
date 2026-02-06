'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Group,
    ThemeIcon,
    RingProgress,
    Center,
    Loader,
    Alert,
    Button,
} from '@mantine/core';
import {
    IconChartBar,
    IconUsers,
    IconCash,
    IconTrendingUp,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Campaign {
    id: string;
    status: string;
    budgetCents: number | null;
    actualSpendCents: number | null;
    actualLeads: number | null;
    actualEnrollments: number | null;
}

function formatCurrency(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
}

export default function AnalyticsPage() {
    const { data: campaigns, isLoading, error, refetch } = useApi<Campaign[]>('/api/campaigns');

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    const stats = {
        totalBudget: campaigns?.reduce((sum, c) => sum + (c.budgetCents || 0), 0) || 0,
        totalSpent: campaigns?.reduce((sum, c) => sum + (c.actualSpendCents || 0), 0) || 0,
        totalLeads: campaigns?.reduce((sum, c) => sum + (c.actualLeads || 0), 0) || 0,
        totalEnrollments: campaigns?.reduce((sum, c) => sum + (c.actualEnrollments || 0), 0) || 0,
        active: campaigns?.filter(c => c.status === 'active').length || 0,
    };

    const spendRate = stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0;
    const conversionRate = stats.totalLeads > 0 ? Math.round((stats.totalEnrollments / stats.totalLeads) * 100) : 0;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Marketing</Text>
                <Title order={2}>Analytics</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Orçamento Total</Text>
                            <Text fw={700} size="lg">{formatCurrency(stats.totalBudget)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Gasto</Text>
                            <Text fw={700} size="lg">{formatCurrency(stats.totalSpent)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Leads</Text>
                            <Text fw={700} size="lg">{stats.totalLeads}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Matrículas</Text>
                            <Text fw={700} size="lg">{stats.totalEnrollments}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Card withBorder p="lg">
                    <Text fw={600} mb="md">Uso do Orçamento</Text>
                    <Center>
                        <RingProgress
                            size={150}
                            thickness={12}
                            sections={[{ value: spendRate, color: spendRate > 90 ? 'red' : 'blue' }]}
                            label={<Text ta="center" fw={700} size="lg">{spendRate}%</Text>}
                        />
                    </Center>
                </Card>
                <Card withBorder p="lg">
                    <Text fw={600} mb="md">Taxa de Conversão</Text>
                    <Center>
                        <RingProgress
                            size={150}
                            thickness={12}
                            sections={[{ value: conversionRate, color: 'green' }]}
                            label={<Text ta="center" fw={700} size="lg">{conversionRate}%</Text>}
                        />
                    </Center>
                </Card>
            </SimpleGrid>
        </Stack>
    );
}

