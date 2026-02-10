'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Loader, Alert, Paper, Textarea,
    Button, Select, TextInput,
} from '@mantine/core';
import {
    IconAlertCircle, IconBulb, IconUsers, IconMessageCircle,
    IconPlus, IconCheck, IconTarget,
} from '@tabler/icons-react';

interface Suggestion {
    id: string;
    title: string;
    description: string;
    status: string;
    netVotes: number;
    submitterName: string;
    createdAt: number;
}

interface RetroItem {
    id: string;
    type: 'went_well' | 'improve' | 'action';
    text: string;
    author: string;
    votes: number;
}

const TYPE_COLORS: Record<string, string> = { went_well: 'green', improve: 'orange', action: 'blue' };
const TYPE_LABELS: Record<string, string> = { went_well: '✅ O que foi bem', improve: '🔧 Melhorar', action: '🎯 Ação' };

export default function RetrospectivasPage() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retroItems, setRetroItems] = useState<RetroItem[]>([]);
    const [newText, setNewText] = useState('');
    const [newType, setNewType] = useState<string | null>('went_well');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/kaizen/suggestions?limit=20&sort=recent');
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.data || []);
                }
            } catch (err) {
                setError('Falha ao carregar dados');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleAdd = () => {
        if (!newText.trim() || !newType) return;
        setRetroItems(p => [...p, {
            id: crypto.randomUUID(),
            type: newType as RetroItem['type'],
            text: newText.trim(),
            author: 'Você',
            votes: 0,
        }]);
        setNewText('');
    };

    const handleVote = (id: string) => {
        setRetroItems(p => p.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i));
    };

    const columns = useMemo(() => {
        const types: RetroItem['type'][] = ['went_well', 'improve', 'action'];
        return types.map(t => ({
            type: t,
            label: TYPE_LABELS[t],
            color: TYPE_COLORS[t],
            items: retroItems.filter(i => i.type === t).sort((a, b) => b.votes - a.votes),
        }));
    }, [retroItems]);

    const stats = useMemo(() => ({
        total: retroItems.length,
        actions: retroItems.filter(i => i.type === 'action').length,
        recentSuggestions: suggestions.length,
    }), [retroItems, suggestions]);

    if (loading) {
        return <Container size="xl" py="xl"><Group justify="center" py={60}><Loader size="lg" /><Text>Carregando...</Text></Group></Container>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Kaizen</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Retrospectivas</Text></Group>
                    <Title order={1}>Retrospectivas</Title>
                    <Text c="dimmed" mt="xs">Facilitação de reuniões de retrospectiva com pautas de melhoria contínua.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                <SimpleGrid cols={{ base: 3 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Itens</Text><Text size="xl" fw={700}>{stats.total}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue"><IconMessageCircle size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ações Definidas</Text><Text size="xl" fw={700} c="teal">{stats.actions}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="teal"><IconTarget size={24} /></ThemeIcon></Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between"><div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Sugestões Kaizen</Text><Text size="xl" fw={700}>{stats.recentSuggestions}</Text></div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet"><IconBulb size={24} /></ThemeIcon></Group>
                    </Card>
                </SimpleGrid>

                {/* Add Item */}
                <Card withBorder padding="lg" radius="md">
                    <Text fw={600} mb="md">Adicionar Item</Text>
                    <Group align="end">
                        <Select label="Tipo" value={newType} onChange={setNewType} w={200}
                            data={[{ value: 'went_well', label: '✅ O que foi bem' }, { value: 'improve', label: '🔧 Melhorar' }, { value: 'action', label: '🎯 Ação' }]} />
                        <TextInput label="Descrição" placeholder="Descreva o item..." value={newText} onChange={e => setNewText(e.currentTarget.value)} style={{ flex: 1 }} />
                        <Button leftSection={<IconPlus size={16} />} onClick={handleAdd} disabled={!newText.trim()}>Adicionar</Button>
                    </Group>
                </Card>

                {/* Retro Board */}
                <SimpleGrid cols={{ base: 1, md: 3 }}>
                    {columns.map(col => (
                        <Card key={col.type} withBorder padding="md" radius="md">
                            <Group justify="space-between" mb="md">
                                <Text fw={600} size="sm">{col.label}</Text>
                                <Badge variant="filled" color={col.color} size="sm" circle>{col.items.length}</Badge>
                            </Group>
                            <Stack gap="xs" style={{ minHeight: 200 }}>
                                {col.items.length === 0 ? (
                                    <Paper withBorder p="md" radius="md" style={{ border: '2px dashed var(--mantine-color-gray-3)', textAlign: 'center' }}>
                                        <Text size="sm" c="dimmed">Vazio</Text>
                                    </Paper>
                                ) : col.items.map(item => (
                                    <Paper key={item.id} withBorder p="sm" radius="md">
                                        <Text size="sm">{item.text}</Text>
                                        <Group justify="space-between" mt="xs">
                                            <Text size="xs" c="dimmed">{item.author}</Text>
                                            <Badge size="sm" variant="light" color={col.color} style={{ cursor: 'pointer' }} onClick={() => handleVote(item.id)}>
                                                👍 {item.votes}
                                            </Badge>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>

                {/* Related Kaizen */}
                {suggestions.length > 0 && (
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Sugestões Kaizen Recentes (Contexto)</Text>
                        <Stack gap="xs">
                            {suggestions.slice(0, 5).map(s => (
                                <Group key={s.id} justify="space-between">
                                    <div>
                                        <Text size="sm" fw={500}>{s.title}</Text>
                                        <Text size="xs" c="dimmed">{s.submitterName} — {new Date(s.createdAt * 1000).toLocaleDateString('pt-BR')}</Text>
                                    </div>
                                    <Badge size="sm" variant="light" color={s.netVotes > 0 ? 'green' : 'gray'}>
                                        {s.netVotes > 0 ? '+' : ''}{s.netVotes}
                                    </Badge>
                                </Group>
                            ))}
                        </Stack>
                    </Card>
                )}
            </Stack>
        </Container>
    );
}
