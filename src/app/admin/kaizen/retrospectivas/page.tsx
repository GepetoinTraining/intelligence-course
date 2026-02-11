'use client';

import { useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Loader, Alert, Center, Button, Progress,
} from '@mantine/core';
import {
    IconHistory, IconAlertCircle, IconTarget, IconBulb,
    IconTrendingUp, IconCheck,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

interface Suggestion {
    id: string;
    title: string;
    description: string;
    status: string;
    problemType: string;
    estimatedImpact: string;
    upvotes: number;
    createdAt: number;
}

export default function RetrospectivasPage() {
    const { data, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const suggestions = data || [];

    // Group by quarter
    const quarters = useMemo(() => {
        const map = new Map<string, Suggestion[]>();
        suggestions.forEach(s => {
            const d = new Date((s.createdAt || 0) * 1000);
            const q = Math.ceil((d.getMonth() + 1) / 3);
            const key = `${d.getFullYear()} Q${q}`;
            const arr = map.get(key) || [];
            arr.push(s);
            map.set(key, arr);
        });
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [suggestions]);

    // Category distribution for overall retro
    const categories = useMemo(() => {
        const map = new Map<string, number>();
        suggestions.forEach(s => {
            map.set(s.problemType, (map.get(s.problemType) || 0) + 1);
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }, [suggestions]);

    const totalCount = suggestions.length;
    const implementedCount = suggestions.filter(s => s.status === 'implemented').length;
    const successRate = totalCount > 0 ? Math.round((implementedCount / totalCount) * 100) : 0;
    const avgVotes = totalCount > 0 ? Math.round(suggestions.reduce((s, i) => s + i.upvotes, 0) / totalCount) : 0;

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}<Button size="xs" ml="md" onClick={refetch}>Tentar novamente</Button></Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Kaizen</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Retrospectivas</Text></Group>
                    <Title order={2}>Retrospectivas</Title>
                    <Text size="sm" c="dimmed" mt={4}>Análise periódica das sugestões e melhorias implementadas</Text>
                </div>
                <DiagramToggle route="/api/kaizen/suggestions" data={suggestions} forceType="flowchart" title="Análise Retrospectiva" />
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="blue" size="lg"><IconBulb size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Total Sugestões</Text><Text fw={700} size="xl">{totalCount}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="green" size="lg"><IconCheck size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Implementadas</Text><Text fw={700} size="xl">{implementedCount}</Text></div></Group>
                    <Progress value={successRate} color="green" size="xs" mt="xs" />
                    <Text size="xs" c="dimmed" mt={2}>{successRate}%</Text>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="yellow" size="lg"><IconTrendingUp size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Média de Votos</Text><Text fw={700} size="xl">{avgVotes}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="grape" size="lg"><IconTarget size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Trimestres</Text><Text fw={700} size="xl">{quarters.length}</Text></div></Group>
                </Card>
            </SimpleGrid>

            {/* Category distribution */}
            <Card withBorder p="md">
                <Text fw={600} mb="md">Distribuição por Categoria</Text>
                <Stack gap="xs">
                    {categories.map(([cat, count]) => (
                        <Group key={cat} gap="xs">
                            <Text size="sm" fw={500} w={120} tt="capitalize">{cat.replace(/_/g, ' ')}</Text>
                            <Progress value={(count / Math.max(1, totalCount)) * 100} color="blue" size="lg" style={{ flex: 1 }} />
                            <Badge size="sm" variant="light">{count}</Badge>
                        </Group>
                    ))}
                </Stack>
            </Card>

            {/* Quarter breakdown */}
            {quarters.map(([label, items]) => {
                const imp = items.filter(s => s.status === 'implemented').length;
                const rate = items.length > 0 ? Math.round((imp / items.length) * 100) : 0;
                return (
                    <Card key={label} withBorder p="md">
                        <Group justify="space-between" mb="sm">
                            <Group gap="xs">
                                <IconHistory size={18} />
                                <Text fw={600}>{label}</Text>
                                <Badge size="sm" variant="light">{items.length} sugestões</Badge>
                            </Group>
                            <Badge color={rate >= 50 ? 'green' : rate >= 25 ? 'yellow' : 'red'} variant="light">
                                {rate}% implementadas
                            </Badge>
                        </Group>
                        <SimpleGrid cols={{ base: 2, sm: 4 }}>
                            {items.slice(0, 4).map(s => (
                                <Card key={s.id} withBorder p="xs" radius="sm">
                                    <Text size="sm" fw={500} lineClamp={1}>{s.title}</Text>
                                    <Group gap={4} mt={4}>
                                        <Badge size="xs" variant="light">{s.status}</Badge>
                                        <Text size="xs" c="dimmed">{s.upvotes} 👍</Text>
                                    </Group>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Card>
                );
            })}

            {quarters.length === 0 && (
                <Center py="xl"><Stack align="center" gap="xs">
                    <IconHistory size={48} color="gray" /><Text c="dimmed">Nenhuma retrospectiva disponível</Text>
                </Stack></Center>
            )}
        </Stack>
    );
}
