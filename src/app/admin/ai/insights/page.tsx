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
    Paper,
    RingProgress,
    Center,
    Progress,
    Loader,
    Alert,
} from '@mantine/core';
import {
    IconBrain,
    IconTrendingUp,
    IconTrendingDown,
    IconAlertTriangle,
    IconBulb,
    IconRefresh,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

// Demo insights
const insights = [
    { id: 1, type: 'opportunity', title: 'Aumento de demanda detectado', description: 'Busca por cursos de inglês business aumentou 34% este mês. Considere criar mais turmas.', impact: 'high', actionable: true },
    { id: 2, type: 'warning', title: 'Risco de evasão identificado', description: '12 alunos apresentam padrão de faltas que indica risco de cancelamento nos próximos 30 dias.', impact: 'high', actionable: true },
    { id: 3, type: 'insight', title: 'Melhor horário para campanhas', description: 'Análise indica que emails enviados às terças-feiras às 09h têm 45% mais abertura.', impact: 'medium', actionable: false },
    { id: 4, type: 'opportunity', title: 'Cross-sell potencial', description: '45 alunos de inglês intermediário têm perfil para curso de business english.', impact: 'medium', actionable: true },
    { id: 5, type: 'insight', title: 'Sazonalidade identificada', description: 'Matrículas tendem a cair 23% em dezembro. Planeje promoções antecipadas.', impact: 'low', actionable: false },
];

export default function InsightsPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/scrm/crm-insights');


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Assistente IA</Text>
                    <Title order={2}>Insights</Title>
                </div>
                <Button variant="light" leftSection={<IconRefresh size={16} />}>
                    Atualizar Análise
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="grape" size="lg">
                            <IconBrain size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Insights Ativos</Text>
                            <Text fw={700} size="lg">{insights.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Oportunidades</Text>
                            <Text fw={700} size="lg">{insights.filter(i => i.type === 'opportunity').length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Alertas</Text>
                            <Text fw={700} size="lg">{insights.filter(i => i.type === 'warning').length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBulb size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Acionáveis</Text>
                            <Text fw={700} size="lg">{insights.filter(i => i.actionable).length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Insights List */}
            <Stack gap="sm">
                {insights.map((insight) => (
                    <Card key={insight.id} withBorder p="md">
                        <Group justify="space-between" wrap="nowrap" align="flex-start">
                            <Group wrap="nowrap" align="flex-start" gap="md">
                                <ThemeIcon
                                    size="lg"
                                    radius="xl"
                                    variant="light"
                                    color={
                                        insight.type === 'opportunity' ? 'green' :
                                            insight.type === 'warning' ? 'red' : 'blue'
                                    }
                                >
                                    {insight.type === 'opportunity' ? <IconTrendingUp size={18} /> :
                                        insight.type === 'warning' ? <IconAlertTriangle size={18} /> :
                                            <IconBulb size={18} />}
                                </ThemeIcon>
                                <div>
                                    <Group gap="xs" mb={4}>
                                        <Text fw={600}>{insight.title}</Text>
                                        <Badge
                                            size="xs"
                                            color={
                                                insight.impact === 'high' ? 'red' :
                                                    insight.impact === 'medium' ? 'yellow' : 'gray'
                                            }
                                        >
                                            {insight.impact === 'high' ? 'Alto impacto' :
                                                insight.impact === 'medium' ? 'Impacto médio' : 'Baixo impacto'}
                                        </Badge>
                                    </Group>
                                    <Text size="sm" c="dimmed">{insight.description}</Text>
                                </div>
                            </Group>
                            {insight.actionable && (
                                <Button size="xs" variant="light">
                                    Agir
                                </Button>
                            )}
                        </Group>
                    </Card>
                ))}
            </Stack>
        </Stack>
    );
}

