'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Loader, Alert, Center, RingProgress, Button,
} from '@mantine/core';
import {
    IconChartDonut, IconMoodSmile, IconMoodSad, IconMoodNeutral,
    IconAlertCircle, IconTrendingUp,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

interface Suggestion {
    id: string;
    title: string;
    status: string;
    problemType: string;
    estimatedImpact: string;
    upvotes: number;
    downvotes: number;
    createdAt: number;
}

function getNPSColor(score: number): string {
    if (score >= 50) return 'green';
    if (score >= 0) return 'yellow';
    return 'red';
}

function getNPSLabel(score: number): string {
    if (score >= 50) return 'Excelente';
    if (score >= 0) return 'Bom';
    return 'Precisa Melhorar';
}

export default function NPSPage() {
    const { data, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const suggestions = data || [];

    // Calculate NPS-like metrics from voting data
    const nps = useMemo(() => {
        if (suggestions.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
        const promoters = suggestions.filter(s => s.upvotes > 2 && s.upvotes > s.downvotes * 2).length;
        const detractors = suggestions.filter(s => s.downvotes > s.upvotes).length;
        const passives = suggestions.length - promoters - detractors;
        const score = Math.round(((promoters - detractors) / suggestions.length) * 100);
        return { score, promoters, passives, detractors, total: suggestions.length };
    }, [suggestions]);

    // Create journey-style data for diagram
    const journeyData = useMemo(() => {
        const byType = new Map<string, { upvotes: number; count: number }>();
        suggestions.forEach(s => {
            const t = s.problemType || 'other';
            const existing = byType.get(t) || { upvotes: 0, count: 0 };
            existing.upvotes += s.upvotes;
            existing.count++;
            byType.set(t, existing);
        });
        return Array.from(byType.entries()).map(([type, data]) => ({
            name: type,
            category: 'Satisfação por Área',
            score: Math.min(5, Math.max(1, Math.round((data.upvotes / Math.max(1, data.count)) * 2.5))),
        }));
    }, [suggestions]);

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    if (error) return <Alert icon={<IconAlertCircle size={16} />} title="Erro" color="red">{error}<Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button></Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Kaizen</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>NPS</Text></Group>
                    <Title order={2}>Net Promoter Score</Title>
                    <Text size="sm" c="dimmed" mt={4}>Índice de satisfação calculado a partir dos votos em sugestões</Text>
                </div>
                <DiagramToggle route="/api/kaizen/suggestions" data={journeyData} forceType="journey" title="Mapa de Satisfação NPS" />
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                <Card withBorder p="lg">
                    <Group justify="center">
                        <RingProgress
                            size={120}
                            thickness={12}
                            roundCaps
                            sections={[
                                { value: (nps.promoters / Math.max(1, nps.total)) * 100, color: 'green' },
                                { value: (nps.passives / Math.max(1, nps.total)) * 100, color: 'yellow' },
                                { value: (nps.detractors / Math.max(1, nps.total)) * 100, color: 'red' },
                            ]}
                            label={
                                <Text ta="center" fw={700} size="xl" c={getNPSColor(nps.score)}>
                                    {nps.score}
                                </Text>
                            }
                        />
                    </Group>
                    <Text ta="center" fw={600} mt="sm">NPS Score</Text>
                    <Badge fullWidth variant="light" color={getNPSColor(nps.score)} mt="xs">
                        {getNPSLabel(nps.score)}
                    </Badge>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconMoodSmile size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Promotores</Text>
                            <Text fw={700} size="xl">{nps.promoters}</Text>
                            <Text size="xs" c="dimmed">{nps.total > 0 ? Math.round((nps.promoters / nps.total) * 100) : 0}%</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg"><IconMoodNeutral size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Passivos</Text>
                            <Text fw={700} size="xl">{nps.passives}</Text>
                            <Text size="xs" c="dimmed">{nps.total > 0 ? Math.round((nps.passives / nps.total) * 100) : 0}%</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg"><IconMoodSad size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Detratores</Text>
                            <Text fw={700} size="xl">{nps.detractors}</Text>
                            <Text size="xs" c="dimmed">{nps.total > 0 ? Math.round((nps.detractors / nps.total) * 100) : 0}%</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">Tendência por Área</Text>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }}>
                    {journeyData.map((item, i) => (
                        <Card key={i} withBorder p="sm" radius="md">
                            <Text size="sm" fw={500} tt="capitalize">{item.name.replace(/_/g, ' ')}</Text>
                            <Group gap={4} mt="xs">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <IconMoodSmile
                                        key={star}
                                        size={16}
                                        color={star <= item.score ? 'var(--mantine-color-yellow-6)' : 'var(--mantine-color-gray-4)'}
                                    />
                                ))}
                            </Group>
                            <Text size="xs" c="dimmed" mt={4}>{item.score}/5</Text>
                        </Card>
                    ))}
                </SimpleGrid>
            </Card>
        </Stack>
    );
}
