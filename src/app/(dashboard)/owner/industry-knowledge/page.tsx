'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, Stack, Card, Badge, Paper,
    SimpleGrid, Select, Button, Table, Tabs, ThemeIcon, Progress,
    Alert, Divider, Accordion
} from '@mantine/core';
import {
    IconTrendingUp, IconTrendingDown, IconArrowRight, IconEqual,
    IconBulb, IconClock, IconTarget, IconChartBar, IconInfoCircle,
    IconSchool, IconUsers, IconCurrencyDollar, IconPercentage,
    IconArrowLeft, IconDownload, IconMail, IconBrandInstagram,
    IconBrandGoogle, IconCheck, IconX
} from '@tabler/icons-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface Benchmark {
    metric: string;
    yourValue: number;
    industryAvg: number;
    topQuartile: number;
    unit: string;
    higherIsBetter: boolean;
    category: 'acquisition' | 'conversion' | 'retention' | 'revenue';
}

interface BestPractice {
    id: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    implemented: boolean;
    category: 'marketing' | 'sales' | 'retention' | 'operations';
}

interface IndustryInsight {
    id: string;
    title: string;
    content: string;
    source: string;
    date: string;
    relevance: 'high' | 'medium' | 'low';
}

interface SendTimeData {
    day: string;
    email: { best: string; openRate: number };
    whatsapp: { best: string; responseRate: number };
    instagram: { best: string; engagementRate: number };
}

// ============================================================================
// REFERENCE DATA
// ============================================================================

const BENCHMARKS: Benchmark[] = [
    // Acquisition
    { metric: 'CAC (Custo por Aquisição)', yourValue: 285, industryAvg: 320, topQuartile: 220, unit: 'R$', higherIsBetter: false, category: 'acquisition' },
    { metric: 'CPL (Custo por Lead)', yourValue: 18, industryAvg: 25, topQuartile: 12, unit: 'R$', higherIsBetter: false, category: 'acquisition' },
    { metric: 'Visitantes → Leads', yourValue: 4.2, industryAvg: 3.5, topQuartile: 6.0, unit: '%', higherIsBetter: true, category: 'acquisition' },
    { metric: 'Leads por mês', yourValue: 145, industryAvg: 120, topQuartile: 200, unit: '', higherIsBetter: true, category: 'acquisition' },

    // Conversion
    { metric: 'Lead → Trial', yourValue: 28, industryAvg: 22, topQuartile: 35, unit: '%', higherIsBetter: true, category: 'conversion' },
    { metric: 'Trial → Matrícula', yourValue: 45, industryAvg: 38, topQuartile: 55, unit: '%', higherIsBetter: true, category: 'conversion' },
    { metric: 'Taxa Geral de Conversão', yourValue: 12.6, industryAvg: 8.4, topQuartile: 18, unit: '%', higherIsBetter: true, category: 'conversion' },
    { metric: 'Tempo médio até matrícula', yourValue: 21, industryAvg: 28, topQuartile: 14, unit: 'dias', higherIsBetter: false, category: 'conversion' },

    // Retention
    { metric: 'Retenção M3', yourValue: 82, industryAvg: 75, topQuartile: 88, unit: '%', higherIsBetter: true, category: 'retention' },
    { metric: 'Retenção M6', yourValue: 68, industryAvg: 60, topQuartile: 78, unit: '%', higherIsBetter: true, category: 'retention' },
    { metric: 'Retenção M12', yourValue: 52, industryAvg: 42, topQuartile: 62, unit: '%', higherIsBetter: true, category: 'retention' },
    { metric: 'Churn mensal', yourValue: 4.5, industryAvg: 6.0, topQuartile: 3.0, unit: '%', higherIsBetter: false, category: 'retention' },

    // Revenue
    { metric: 'LTV médio', yourValue: 3850, industryAvg: 3200, topQuartile: 4800, unit: 'R$', higherIsBetter: true, category: 'revenue' },
    { metric: 'LTV:CAC Ratio', yourValue: 13.5, industryAvg: 10, topQuartile: 18, unit: 'x', higherIsBetter: true, category: 'revenue' },
    { metric: 'Ticket médio', yourValue: 335, industryAvg: 290, topQuartile: 420, unit: 'R$', higherIsBetter: true, category: 'revenue' },
    { metric: 'Receita de Expansão', yourValue: 15, industryAvg: 10, topQuartile: 22, unit: '% do MRR', higherIsBetter: true, category: 'revenue' },
];

const BEST_PRACTICES: BestPractice[] = [
    // Marketing
    { id: '1', title: 'Resposta em menos de 5 minutos', description: 'Leads contactados em até 5 minutos têm 9x mais chance de conversão', impact: 'high', implemented: true, category: 'marketing' },
    { id: '2', title: 'UTM em todos os links', description: 'Rastreamento completo para atribuição precisa de ROI por canal', impact: 'high', implemented: true, category: 'marketing' },
    { id: '3', title: 'Remarketing em 7 dias', description: 'Leads que não converteram recebem sequência de remarketing', impact: 'medium', implemented: false, category: 'marketing' },
    { id: '4', title: 'Prova social em landing pages', description: 'Depoimentos com foto e nome aumentam conversão em 34%', impact: 'high', implemented: true, category: 'marketing' },

    // Sales
    { id: '5', title: 'Script de ligação padronizado', description: 'Roteiro testado para aulas experimentais e follow-up', impact: 'high', implemented: true, category: 'sales' },
    { id: '6', title: 'Cadência de 7 toques', description: 'Sequência multicanal (WhatsApp, email, ligação) em 7 dias', impact: 'high', implemented: false, category: 'sales' },
    { id: '7', title: 'Objeções mapeadas', description: 'Respostas documentadas para as 10 objeções mais comuns', impact: 'medium', implemented: true, category: 'sales' },
    { id: '8', title: 'CRM atualizado diariamente', description: 'Pipeline com status e próxima ação em cada lead', impact: 'medium', implemented: true, category: 'sales' },

    // Retention
    { id: '9', title: 'Onboarding estruturado', description: 'Primeiros 30 dias com marcos de sucesso definidos', impact: 'high', implemented: true, category: 'retention' },
    { id: '10', title: 'Alerta de risco de churn', description: 'Sistema automático detecta sinais de desengajamento', impact: 'high', implemented: true, category: 'retention' },
    { id: '11', title: 'NPS trimestral', description: 'Pesquisa de satisfação com ação em detratores', impact: 'medium', implemented: false, category: 'retention' },
    { id: '12', title: 'Programa de indicação', description: 'Incentivo para alunos indicarem novos estudantes', impact: 'medium', implemented: true, category: 'retention' },

    // Operations
    { id: '13', title: 'Dashboard de métricas semanais', description: 'Reunião semanal com KPIs principais', impact: 'high', implemented: true, category: 'operations' },
    { id: '14', title: 'SLA de atendimento', description: 'Tempo máximo de resposta definido por canal', impact: 'medium', implemented: false, category: 'operations' },
    { id: '15', title: 'Automação de cobranças', description: 'Lembretes automáticos antes do vencimento', impact: 'medium', implemented: true, category: 'operations' },
];

const SEND_TIMES: SendTimeData[] = [
    { day: 'Segunda', email: { best: '10:00', openRate: 28 }, whatsapp: { best: '19:00', responseRate: 45 }, instagram: { best: '12:00', engagementRate: 4.2 } },
    { day: 'Terça', email: { best: '10:00', openRate: 32 }, whatsapp: { best: '19:30', responseRate: 48 }, instagram: { best: '18:00', engagementRate: 4.5 } },
    { day: 'Quarta', email: { best: '10:00', openRate: 30 }, whatsapp: { best: '19:00', responseRate: 46 }, instagram: { best: '12:00', engagementRate: 4.3 } },
    { day: 'Quinta', email: { best: '14:00', openRate: 29 }, whatsapp: { best: '19:30', responseRate: 47 }, instagram: { best: '19:00', engagementRate: 4.8 } },
    { day: 'Sexta', email: { best: '10:00', openRate: 26 }, whatsapp: { best: '18:00', responseRate: 42 }, instagram: { best: '17:00', engagementRate: 4.1 } },
    { day: 'Sábado', email: { best: '11:00', openRate: 22 }, whatsapp: { best: '10:00', responseRate: 38 }, instagram: { best: '11:00', engagementRate: 5.2 } },
    { day: 'Domingo', email: { best: '20:00', openRate: 24 }, whatsapp: { best: '19:00', responseRate: 35 }, instagram: { best: '20:00', engagementRate: 5.0 } },
];

const WINNING_COPY_PATTERNS = [
    {
        category: 'Headlines',
        patterns: [
            { pattern: 'Números específicos', example: 'Fluência em 12 meses ou seu dinheiro de volta', effectiveness: 92 },
            { pattern: 'Pergunta provocativa', example: 'Você ainda vai adiar seu inglês por quanto tempo?', effectiveness: 85 },
            { pattern: 'Benefício direto', example: 'Fale inglês com confiança em qualquer situação', effectiveness: 88 },
        ],
    },
    {
        category: 'CTAs',
        patterns: [
            { pattern: 'Primeira pessoa', example: 'Quero minha aula grátis', effectiveness: 95 },
            { pattern: 'Urgência sutil', example: 'Garantir minha vaga', effectiveness: 90 },
            { pattern: 'Benefício no botão', example: 'Começar a falar inglês', effectiveness: 87 },
        ],
    },
    {
        category: 'WhatsApp',
        patterns: [
            { pattern: 'Emoji + nome', example: '👋 Oi [Nome], tudo bem?', effectiveness: 94 },
            { pattern: 'Pergunta aberta', example: 'Como posso te ajudar a alcançar a fluência?', effectiveness: 88 },
            { pattern: 'Áudio curto', example: 'Áudio de 30s com proposta personalizada', effectiveness: 91 },
        ],
    },
];

const INDUSTRY_INSIGHTS: IndustryInsight[] = [
    {
        id: '1',
        title: 'WhatsApp supera email em conversão para cursos presenciais',
        content: 'Escolas que priorizam WhatsApp como canal principal reportam taxas de resposta 3x maiores que email. O tempo médio de resposta de 2 minutos aumenta conversão em 400%.',
        source: 'Pesquisa Setorial Educação 2025',
        date: '2025-11',
        relevance: 'high',
    },
    {
        id: '2',
        title: 'Aulas experimentais gratuitas ainda são o melhor conversor',
        content: 'Apesar de tendências para webinars e conteúdo digital, a aula presencial ou ao vivo 1:1 mantém taxa de conversão de 45-55%, vs 15-20% de outros formatos.',
        source: 'Benchmark Cursos de Idiomas BR',
        date: '2025-10',
        relevance: 'high',
    },
    {
        id: '3',
        title: 'Ticket médio cresce com pagamento recorrente',
        content: 'Escolas que migraram para modelo de assinatura mensal viram aumento de 23% no LTV comparado com pacotes fechados, principalmente por redução de fricção.',
        source: 'Análise Financeira EdTech',
        date: '2025-12',
        relevance: 'medium',
    },
    {
        id: '4',
        title: 'Retenção M3 é o principal preditor de LTV',
        content: 'Alunos que passam dos 3 primeiros meses têm 78% de chance de completar 12 meses. Foco no onboarding inicial é o melhor ROI em retenção.',
        source: 'Estudo de Retenção ABRAEP',
        date: '2025-09',
        relevance: 'high',
    },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function BenchmarkRow({ benchmark }: { benchmark: Benchmark }) {
    const { metric, yourValue, industryAvg, topQuartile, unit, higherIsBetter } = benchmark;

    const vsAvg = higherIsBetter
        ? ((yourValue - industryAvg) / industryAvg * 100)
        : ((industryAvg - yourValue) / industryAvg * 100);

    const isAboveAvg = vsAvg > 0;
    const isTopQuartile = higherIsBetter
        ? yourValue >= topQuartile
        : yourValue <= topQuartile;

    return (
        <Table.Tr>
            <Table.Td>
                <Text size="sm" fw={500}>{metric}</Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
                <Group gap={4} justify="flex-end">
                    <Text size="sm" fw={600}>
                        {typeof yourValue === 'number' && yourValue % 1 !== 0
                            ? yourValue.toFixed(1)
                            : yourValue}
                    </Text>
                    <Text size="xs" c="dimmed">{unit}</Text>
                </Group>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
                <Text size="sm" c="dimmed">
                    {industryAvg} {unit}
                </Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>
                <Text size="sm" c="blue" fw={500}>
                    {topQuartile} {unit}
                </Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
                <Badge
                    color={isAboveAvg ? 'green' : 'red'}
                    variant="light"
                    leftSection={isAboveAvg ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
                >
                    {isAboveAvg ? '+' : ''}{vsAvg.toFixed(0)}%
                </Badge>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
                {isTopQuartile ? (
                    <ThemeIcon color="blue" variant="filled" size="sm" radius="xl">
                        <IconCheck size={12} />
                    </ThemeIcon>
                ) : (
                    <ThemeIcon color="gray" variant="light" size="sm" radius="xl">
                        <IconArrowRight size={12} />
                    </ThemeIcon>
                )}
            </Table.Td>
        </Table.Tr>
    );
}

function PracticeCard({ practice }: { practice: BestPractice }) {
    const impactColors = { high: 'red', medium: 'orange', low: 'gray' };
    const impactLabels = { high: 'Alto', medium: 'Médio', low: 'Baixo' };

    return (
        <Paper p="md" withBorder radius="md">
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    {practice.implemented ? (
                        <ThemeIcon color="green" variant="filled" size="sm" radius="xl">
                            <IconCheck size={12} />
                        </ThemeIcon>
                    ) : (
                        <ThemeIcon color="gray" variant="light" size="sm" radius="xl">
                            <IconX size={12} />
                        </ThemeIcon>
                    )}
                    <Text size="sm" fw={500}>{practice.title}</Text>
                </Group>
                <Badge color={impactColors[practice.impact]} size="xs">
                    Impacto {impactLabels[practice.impact]}
                </Badge>
            </Group>
            <Text size="xs" c="dimmed">{practice.description}</Text>
        </Paper>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function IndustryKnowledgePage() {
    const [activeTab, setActiveTab] = useState<string | null>('benchmarks');
    const [benchmarkCategory, setBenchmarkCategory] = useState<string>('all');

    // Filter benchmarks
    const filteredBenchmarks = benchmarkCategory === 'all'
        ? BENCHMARKS
        : BENCHMARKS.filter(b => b.category === benchmarkCategory);

    // Calculate practice stats
    const practiceStats = useMemo(() => {
        const total = BEST_PRACTICES.length;
        const implemented = BEST_PRACTICES.filter(p => p.implemented).length;
        return { total, implemented, percentage: (implemented / total * 100).toFixed(0) };
    }, []);

    // Calculate benchmark performance
    const benchmarkPerformance = useMemo(() => {
        const aboveAvg = BENCHMARKS.filter(b => {
            const vsAvg = b.higherIsBetter
                ? b.yourValue >= b.industryAvg
                : b.yourValue <= b.industryAvg;
            return vsAvg;
        }).length;
        return { aboveAvg, total: BENCHMARKS.length, percentage: (aboveAvg / BENCHMARKS.length * 100).toFixed(0) };
    }, []);

    return (
        <Container fluid px="lg" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Group gap="md" mb="xs">
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            component={Link}
                            href="/owner"
                        >
                            Voltar
                        </Button>
                    </Group>
                    <Title order={2}>📊 Industry Knowledge</Title>
                    <Text c="dimmed">Benchmarks, melhores práticas e insights do setor</Text>
                </div>
                <Button variant="light" leftSection={<IconDownload size={16} />}>
                    Exportar Relatório
                </Button>
            </Group>

            {/* Summary Cards */}
            <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Acima da Média</Text>
                        <ThemeIcon variant="light" color="green" size="md">
                            <IconTrendingUp size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700} c="green">
                        {benchmarkPerformance.percentage}%
                    </Text>
                    <Text size="xs" c="dimmed">
                        {benchmarkPerformance.aboveAvg}/{benchmarkPerformance.total} métricas
                    </Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Práticas Adotadas</Text>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconCheck size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {practiceStats.percentage}%
                    </Text>
                    <Text size="xs" c="dimmed">
                        {practiceStats.implemented}/{practiceStats.total} implementadas
                    </Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Insights Relevantes</Text>
                        <ThemeIcon variant="light" color="violet" size="md">
                            <IconBulb size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {INDUSTRY_INSIGHTS.filter(i => i.relevance === 'high').length}
                    </Text>
                    <Text size="xs" c="dimmed">
                        Alta prioridade
                    </Text>
                </Paper>

                <Paper shadow="sm" p="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Top Quartile</Text>
                        <ThemeIcon variant="light" color="orange" size="md">
                            <IconTarget size={16} />
                        </ThemeIcon>
                    </Group>
                    <Text size="xl" fw={700}>
                        {BENCHMARKS.filter(b => b.higherIsBetter ? b.yourValue >= b.topQuartile : b.yourValue <= b.topQuartile).length}
                    </Text>
                    <Text size="xs" c="dimmed">
                        métricas no top 25%
                    </Text>
                </Paper>
            </SimpleGrid>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="md">
                    <Tabs.Tab value="benchmarks" leftSection={<IconChartBar size={14} />}>
                        Benchmarks
                    </Tabs.Tab>
                    <Tabs.Tab value="practices" leftSection={<IconCheck size={14} />}>
                        Melhores Práticas
                    </Tabs.Tab>
                    <Tabs.Tab value="timing" leftSection={<IconClock size={14} />}>
                        Horários Ideais
                    </Tabs.Tab>
                    <Tabs.Tab value="copy" leftSection={<IconBulb size={14} />}>
                        Copy Patterns
                    </Tabs.Tab>
                    <Tabs.Tab value="insights" leftSection={<IconInfoCircle size={14} />}>
                        Insights
                    </Tabs.Tab>
                </Tabs.List>

                {/* Benchmarks */}
                <Tabs.Panel value="benchmarks">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Text fw={600}>Comparativo com o Setor</Text>
                            <Select
                                size="xs"
                                value={benchmarkCategory}
                                onChange={(v) => setBenchmarkCategory(v || 'all')}
                                data={[
                                    { value: 'all', label: 'Todas categorias' },
                                    { value: 'acquisition', label: 'Aquisição' },
                                    { value: 'conversion', label: 'Conversão' },
                                    { value: 'retention', label: 'Retenção' },
                                    { value: 'revenue', label: 'Receita' },
                                ]}
                                style={{ width: 180 }}
                            />
                        </Group>

                        <Table.ScrollContainer minWidth={700}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Métrica</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Você</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Média Setor</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Top 25%</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>vs Média</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>Top?</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {filteredBenchmarks.map(b => (
                                        <BenchmarkRow key={b.metric} benchmark={b} />
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                </Tabs.Panel>

                {/* Best Practices */}
                <Tabs.Panel value="practices">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                        {['marketing', 'sales', 'retention', 'operations'].map(category => {
                            const categoryLabels: Record<string, string> = {
                                marketing: '📢 Marketing',
                                sales: '🤝 Vendas',
                                retention: '💎 Retenção',
                                operations: '⚙️ Operações'
                            };
                            const practices = BEST_PRACTICES.filter(p => p.category === category);
                            const implemented = practices.filter(p => p.implemented).length;

                            return (
                                <Card key={category} shadow="sm" p="lg" radius="md" withBorder>
                                    <Group justify="space-between" mb="md">
                                        <Text fw={600}>{categoryLabels[category]}</Text>
                                        <Badge color={implemented === practices.length ? 'green' : 'gray'}>
                                            {implemented}/{practices.length}
                                        </Badge>
                                    </Group>
                                    <Stack gap="sm">
                                        {practices.map(p => (
                                            <PracticeCard key={p.id} practice={p} />
                                        ))}
                                    </Stack>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                </Tabs.Panel>

                {/* Optimal Send Times */}
                <Tabs.Panel value="timing">
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text fw={600} mb="md">🕐 Melhores Horários por Canal e Dia</Text>
                        <Table.ScrollContainer minWidth={700}>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Dia</Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>
                                            <Group gap={4} justify="center">
                                                <IconMail size={14} />
                                                Email
                                            </Group>
                                        </Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>
                                            <Group gap={4} justify="center">
                                                <IconBrandInstagram size={14} />
                                                Instagram
                                            </Group>
                                        </Table.Th>
                                        <Table.Th style={{ textAlign: 'center' }}>
                                            <Group gap={4} justify="center">
                                                WhatsApp
                                            </Group>
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {SEND_TIMES.map(day => (
                                        <Table.Tr key={day.day}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{day.day}</Text>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <div>
                                                    <Text size="sm" fw={600}>{day.email.best}</Text>
                                                    <Text size="xs" c="dimmed">Open: {day.email.openRate}%</Text>
                                                </div>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <div>
                                                    <Text size="sm" fw={600}>{day.instagram.best}</Text>
                                                    <Text size="xs" c="dimmed">Eng: {day.instagram.engagementRate}%</Text>
                                                </div>
                                            </Table.Td>
                                            <Table.Td style={{ textAlign: 'center' }}>
                                                <div>
                                                    <Text size="sm" fw={600}>{day.whatsapp.best}</Text>
                                                    <Text size="xs" c="dimmed">Resp: {day.whatsapp.responseRate}%</Text>
                                                </div>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>

                        <Alert color="blue" variant="light" mt="lg" icon={<IconInfoCircle size={16} />}>
                            <Text size="sm">
                                Dados agregados de escolas similares no Brasil. Sua audiência pode variar — teste e ajuste baseado nos seus dados.
                            </Text>
                        </Alert>
                    </Card>
                </Tabs.Panel>

                {/* Copy Patterns */}
                <Tabs.Panel value="copy">
                    <Stack gap="lg">
                        {WINNING_COPY_PATTERNS.map(category => (
                            <Card key={category.category} shadow="sm" p="lg" radius="md" withBorder>
                                <Text fw={600} mb="md">✍️ {category.category}</Text>
                                <Table>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Padrão</Table.Th>
                                            <Table.Th>Exemplo</Table.Th>
                                            <Table.Th style={{ textAlign: 'center' }}>Efetividade</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {category.patterns.map(pattern => (
                                            <Table.Tr key={pattern.pattern}>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>{pattern.pattern}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed" fs="italic">"{pattern.example}"</Text>
                                                </Table.Td>
                                                <Table.Td style={{ textAlign: 'center' }}>
                                                    <Group gap={4} justify="center">
                                                        <Progress
                                                            value={pattern.effectiveness}
                                                            size="lg"
                                                            radius="xl"
                                                            color={pattern.effectiveness > 90 ? 'green' : pattern.effectiveness > 85 ? 'blue' : 'orange'}
                                                            style={{ width: 80 }}
                                                        />
                                                        <Text size="xs" fw={500}>{pattern.effectiveness}%</Text>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Card>
                        ))}
                    </Stack>
                </Tabs.Panel>

                {/* Industry Insights */}
                <Tabs.Panel value="insights">
                    <Stack gap="md">
                        {INDUSTRY_INSIGHTS.map(insight => (
                            <Card key={insight.id} shadow="sm" p="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="sm">
                                    <Group gap="xs">
                                        <Badge
                                            color={insight.relevance === 'high' ? 'red' : insight.relevance === 'medium' ? 'orange' : 'gray'}
                                            variant="light"
                                        >
                                            {insight.relevance === 'high' ? 'Alta Prioridade' : insight.relevance === 'medium' ? 'Relevante' : 'Informativo'}
                                        </Badge>
                                        <Text size="xs" c="dimmed">{insight.date}</Text>
                                    </Group>
                                    <Text size="xs" c="dimmed">{insight.source}</Text>
                                </Group>
                                <Text fw={600} mb="sm">{insight.title}</Text>
                                <Text size="sm" c="dimmed">{insight.content}</Text>
                            </Card>
                        ))}
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}

