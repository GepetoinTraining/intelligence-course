'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, Progress, Loader, Accordion, List,
    RingProgress, Skeleton, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconChartBar, IconRefresh, IconBulb, IconAlertTriangle,
    IconRocket, IconTargetArrow, IconUsers, IconTrendingUp,
    IconMoodSmile, IconMoodSad, IconBrain, IconArrowLeft
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface CRMInsightsData {
    period: { days: number; startDate: number };
    summary: {
        totalActive: number;
        with3x3Complete: number;
        withPersonas: number;
        conversionRate: number;
        wonCount: number;
        lostCount: number;
    };
    distributions: {
        funnel: Record<string, number>;
        segment: { tofu: number; mofu: number; bofu: number; outcome: number };
        sentiment: Record<string, number>;
        source: Record<string, number>;
    };
    bottlenecks: string[];
    recommendations: string[];
}

interface AIInsightsData {
    executiveSummary: string;
    keyPatterns: string[];
    actionableInsights: string[];
    riskAreas: string[];
    opportunities: string[];
    segmentRecommendations?: {
        tofu: string;
        mofu: string;
        bofu: string;
    };
    generatedAt: number;
    leadsAnalyzed: number;
}

const STAGE_LABELS: Record<string, string> = {
    small_engagement: 'Pequenos Engajamentos',
    comments_conversations: 'Comentários/Conversas',
    interested: 'Interessados',
    qualifying: 'Qualificando',
    more_information: 'Mais Informações',
    events_invitations: 'Eventos/Convites',
    appointments: 'Agendamentos',
    negotiation: 'Negociação',
    counters: 'Contrapropostas',
    won: 'Ganho',
    lost: 'Pausado',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SCRMInsightsPage() {
    const [insights, setInsights] = useState<CRMInsightsData | null>(null);
    const [aiInsights, setAiInsights] = useState<AIInsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [days, setDays] = useState(30);

    const fetchInsights = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/scrm/crm-insights?days=${days}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setInsights(data.data);
        } catch (error) {
            console.error('Error fetching insights:', error);
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível carregar os insights',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    }, [days]);

    const generateAIInsights = async () => {
        try {
            setGeneratingAI(true);
            const res = await fetch('/api/scrm/crm-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days }),
            });
            if (!res.ok) throw new Error('Failed to generate');
            const data = await res.json();
            setAiInsights(data.data);
            notifications.show({
                title: 'Sucesso',
                message: 'Insights AI gerados com sucesso',
                color: 'green',
            });
        } catch (error) {
            console.error('Error generating AI insights:', error);
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível gerar os insights AI',
                color: 'red',
            });
        } finally {
            setGeneratingAI(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <Skeleton height={40} width={300} />
                    <Skeleton height={36} width={120} />
                </Group>
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={120} radius="md" />
                    ))}
                </SimpleGrid>
                <Skeleton height={300} radius="md" />
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/staff/scrm"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>Insights SCRM 📊</Title>
                    <Text c="dimmed">Análise de relacionamentos e padrões do CRM</Text>
                </div>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={fetchInsights}
                    >
                        Atualizar
                    </Button>
                    <Button
                        leftSection={<IconBrain size={16} />}
                        onClick={generateAIInsights}
                        loading={generatingAI}
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'indigo' }}
                    >
                        Gerar Insights AI
                    </Button>
                </Group>
            </Group>

            {/* Summary KPIs */}
            {insights && (
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                    <Paper shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Leads Ativos</Text>
                                <Text size="xl" fw={700}>{insights.summary.totalActive}</Text>
                            </div>
                            <ThemeIcon size="lg" variant="light" color="blue">
                                <IconUsers size={20} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Com 3x3 Completo</Text>
                                <Text size="xl" fw={700}>{insights.summary.with3x3Complete}</Text>
                                <Progress
                                    value={(insights.summary.with3x3Complete / Math.max(insights.summary.totalActive, 1)) * 100}
                                    size="xs"
                                    color="violet"
                                    mt="xs"
                                />
                            </div>
                            <RingProgress
                                size={50}
                                thickness={4}
                                sections={[{
                                    value: (insights.summary.with3x3Complete / Math.max(insights.summary.totalActive, 1)) * 100,
                                    color: 'violet'
                                }]}
                            />
                        </Group>
                    </Paper>

                    <Paper shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Com Persona AI</Text>
                                <Text size="xl" fw={700}>{insights.summary.withPersonas}</Text>
                                <Progress
                                    value={(insights.summary.withPersonas / Math.max(insights.summary.totalActive, 1)) * 100}
                                    size="xs"
                                    color="grape"
                                    mt="xs"
                                />
                            </div>
                            <ThemeIcon size="lg" variant="light" color="grape">
                                <IconBrain size={20} />
                            </ThemeIcon>
                        </Group>
                    </Paper>

                    <Paper shadow="sm" radius="md" p="md" withBorder>
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed">Taxa de Conversão</Text>
                                <Text size="xl" fw={700} c={insights.summary.conversionRate > 30 ? 'green' : 'orange'}>
                                    {insights.summary.conversionRate}%
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {insights.summary.wonCount} ganhos / {insights.summary.lostCount} pausados
                                </Text>
                            </div>
                            <ThemeIcon size="lg" variant="light" color="green">
                                <IconTrendingUp size={20} />
                            </ThemeIcon>
                        </Group>
                    </Paper>
                </SimpleGrid>
            )}

            {/* Distributions */}
            {insights && (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {/* Funnel Distribution */}
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Text fw={600} mb="md">Distribuição por Etapa</Text>
                        <Stack gap="xs">
                            {Object.entries(insights.distributions.funnel)
                                .sort(([, a], [, b]) => b - a)
                                .map(([stage, count]) => (
                                    <div key={stage}>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">{STAGE_LABELS[stage] || stage}</Text>
                                            <Badge size="sm" variant="light">{count}</Badge>
                                        </Group>
                                        <Progress
                                            value={(count / Math.max(insights.summary.totalActive, 1)) * 100}
                                            size="sm"
                                            color="blue"
                                        />
                                    </div>
                                ))}
                        </Stack>
                    </Card>

                    {/* Sentiment Distribution */}
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Text fw={600} mb="md">Distribuição de Sentimento</Text>
                        <Stack gap="md">
                            {Object.entries(insights.distributions.sentiment).map(([sentiment, count]) => {
                                const colors: Record<string, string> = {
                                    enthusiastic: 'green',
                                    positive: 'teal',
                                    neutral: 'gray',
                                    hesitant: 'yellow',
                                    negative: 'red',
                                };
                                const labels: Record<string, string> = {
                                    enthusiastic: 'Entusiasmado',
                                    positive: 'Positivo',
                                    neutral: 'Neutro',
                                    hesitant: 'Hesitante',
                                    negative: 'Negativo',
                                };
                                return (
                                    <Group key={sentiment} justify="space-between">
                                        <Group gap="xs">
                                            {sentiment === 'positive' || sentiment === 'enthusiastic' ? (
                                                <IconMoodSmile size={16} color="var(--mantine-color-green-6)" />
                                            ) : sentiment === 'negative' || sentiment === 'hesitant' ? (
                                                <IconMoodSad size={16} color="var(--mantine-color-red-6)" />
                                            ) : (
                                                <IconMoodSmile size={16} color="var(--mantine-color-gray-6)" />
                                            )}
                                            <Text size="sm">{labels[sentiment] || sentiment}</Text>
                                        </Group>
                                        <Badge color={colors[sentiment] || 'gray'}>{count}</Badge>
                                    </Group>
                                );
                            })}
                        </Stack>
                    </Card>

                    {/* Source Distribution */}
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Text fw={600} mb="md">Fontes dos Leads</Text>
                        <Stack gap="xs">
                            {Object.entries(insights.distributions.source)
                                .sort(([, a], [, b]) => b - a)
                                .map(([source, count]) => (
                                    <Group key={source} justify="space-between">
                                        <Text size="sm" tt="capitalize">{source.replace('_', ' ')}</Text>
                                        <Badge variant="light">{count}</Badge>
                                    </Group>
                                ))}
                        </Stack>
                    </Card>

                    {/* Recommendations */}
                    <Card shadow="sm" radius="md" p="md" withBorder>
                        <Group mb="md">
                            <ThemeIcon variant="light" color="orange">
                                <IconBulb size={16} />
                            </ThemeIcon>
                            <Text fw={600}>Recomendações</Text>
                        </Group>
                        <Stack gap="sm">
                            {insights.recommendations.map((rec, i) => (
                                <Alert key={i} variant="light" color="blue" icon={<IconTargetArrow size={16} />}>
                                    {rec}
                                </Alert>
                            ))}
                        </Stack>

                        {insights.bottlenecks.length > 0 && (
                            <>
                                <Text fw={600} mt="md" mb="sm" c="orange">⚠️ Gargalos Detectados</Text>
                                <Stack gap="xs">
                                    {insights.bottlenecks.map((bottleneck, i) => (
                                        <Badge key={i} variant="light" color="orange" size="lg" fullWidth>
                                            {STAGE_LABELS[bottleneck] || bottleneck}
                                        </Badge>
                                    ))}
                                </Stack>
                            </>
                        )}
                    </Card>
                </SimpleGrid>
            )}

            {/* AI Insights */}
            {aiInsights && (
                <Card shadow="sm" radius="md" p="lg" withBorder style={{ background: 'linear-gradient(135deg, var(--mantine-color-violet-0), var(--mantine-color-indigo-0))' }}>
                    <Group mb="md">
                        <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'violet', to: 'indigo' }}>
                            <IconBrain size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} size="lg">Análise AI</Text>
                            <Text size="xs" c="dimmed">
                                Gerado em {new Date(aiInsights.generatedAt).toLocaleString('pt-BR')} •
                                {aiInsights.leadsAnalyzed} leads analisados
                            </Text>
                        </div>
                    </Group>

                    <Paper p="md" radius="md" withBorder mb="md">
                        <Text fw={600} mb="xs">📋 Resumo Executivo</Text>
                        <Text>{aiInsights.executiveSummary}</Text>
                    </Paper>

                    <Accordion variant="separated">
                        <Accordion.Item value="patterns">
                            <Accordion.Control icon={<IconChartBar size={16} />}>
                                Padrões Identificados ({aiInsights.keyPatterns.length})
                            </Accordion.Control>
                            <Accordion.Panel>
                                <List>
                                    {aiInsights.keyPatterns.map((pattern, i) => (
                                        <List.Item key={i}>{pattern}</List.Item>
                                    ))}
                                </List>
                            </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="actions">
                            <Accordion.Control icon={<IconTargetArrow size={16} />}>
                                Ações Recomendadas ({aiInsights.actionableInsights.length})
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="xs">
                                    {aiInsights.actionableInsights.map((action, i) => (
                                        <Alert key={i} variant="light" color="green" icon={<IconRocket size={16} />}>
                                            {action}
                                        </Alert>
                                    ))}
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="risks">
                            <Accordion.Control icon={<IconAlertTriangle size={16} />}>
                                Áreas de Risco ({aiInsights.riskAreas.length})
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="xs">
                                    {aiInsights.riskAreas.map((risk, i) => (
                                        <Alert key={i} variant="light" color="red">
                                            {risk}
                                        </Alert>
                                    ))}
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="opportunities">
                            <Accordion.Control icon={<IconTrendingUp size={16} />}>
                                Oportunidades ({aiInsights.opportunities.length})
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="xs">
                                    {aiInsights.opportunities.map((opp, i) => (
                                        <Alert key={i} variant="light" color="teal">
                                            {opp}
                                        </Alert>
                                    ))}
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>

                        {aiInsights.segmentRecommendations && (
                            <Accordion.Item value="segments">
                                <Accordion.Control icon={<IconUsers size={16} />}>
                                    Recomendações por Segmento
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="md">
                                        <Paper p="sm" withBorder>
                                            <Badge color="blue" mb="xs">TOFU - Consciência</Badge>
                                            <Text size="sm">{aiInsights.segmentRecommendations.tofu}</Text>
                                        </Paper>
                                        <Paper p="sm" withBorder>
                                            <Badge color="violet" mb="xs">MOFU - Consideração</Badge>
                                            <Text size="sm">{aiInsights.segmentRecommendations.mofu}</Text>
                                        </Paper>
                                        <Paper p="sm" withBorder>
                                            <Badge color="orange" mb="xs">BOFU - Decisão</Badge>
                                            <Text size="sm">{aiInsights.segmentRecommendations.bofu}</Text>
                                        </Paper>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        )}
                    </Accordion>
                </Card>
            )}
        </Stack>
    );
}

