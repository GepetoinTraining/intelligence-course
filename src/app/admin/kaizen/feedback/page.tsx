'use client';

import { useState, useMemo } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Table, Loader, Alert, Center, Tabs, Rating, Button, Modal,
    TextInput, Select, Textarea,
} from '@mantine/core';
import {
    IconMessage2, IconAlertCircle, IconThumbUp, IconThumbDown,
    IconStar, IconPlus,
} from '@tabler/icons-react';
import { useApi, useCreate } from '@/hooks/useApi';
import { DiagramToggle } from '@/components/DiagramToggle';

interface Suggestion {
    id: string;
    title: string;
    description: string;
    problemType: string;
    status: string;
    estimatedImpact: string;
    upvotes: number;
    downvotes: number;
    submitterName?: string;
    createdAt: number;
    tags: string;
}

const statusColors: Record<string, string> = {
    submitted: 'blue', under_review: 'yellow', needs_info: 'orange',
    approved: 'teal', in_progress: 'violet', implemented: 'green',
    rejected: 'red', deferred: 'gray',
};
const statusLabels: Record<string, string> = {
    submitted: 'Novo', under_review: 'Revisando', needs_info: 'Info Necessária',
    approved: 'Aprovado', in_progress: 'Em Progresso', implemented: 'Implementado',
    rejected: 'Rejeitado', deferred: 'Adiado',
};
const impactColors: Record<string, string> = { low: 'gray', medium: 'yellow', high: 'orange', critical: 'red' };

export default function FeedbackPage() {
    const { data, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const { create, isLoading: creating } = useCreate('/api/kaizen/suggestions');
    const suggestions = data || [];

    const [tab, setTab] = useState<string | null>('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newType, setNewType] = useState('communication');

    const feedbackItems = useMemo(() => {
        let items = suggestions;
        if (tab === 'positive') items = items.filter(s => s.upvotes > s.downvotes);
        if (tab === 'negative') items = items.filter(s => s.downvotes >= s.upvotes && s.downvotes > 0);
        if (tab === 'neutral') items = items.filter(s => s.upvotes === 0 && s.downvotes === 0);
        return items;
    }, [suggestions, tab]);

    const stats = {
        total: suggestions.length,
        positive: suggestions.filter(s => s.upvotes > s.downvotes).length,
        negative: suggestions.filter(s => s.downvotes >= s.upvotes && s.downvotes > 0).length,
        resolved: suggestions.filter(s => s.status === 'implemented').length,
    };

    const handleCreate = async () => {
        try {
            await create({ title: newTitle, description: newDesc, problemType: newType });
            setCreateOpen(false);
            setNewTitle(''); setNewDesc(''); setNewType('communication');
            refetch();
        } catch { /* hook handles */ }
    };

    const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('pt-BR');

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Kaizen</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Feedback</Text></Group>
                    <Title order={2}>Feedback & Sugestões</Title>
                </div>
                <Group>
                    <DiagramToggle route="/api/kaizen/suggestions" data={suggestions} forceType="journey" title="Mapa de Feedback" />
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>Novo Feedback</Button>
                </Group>
            </Group>

            {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="blue" size="lg"><IconMessage2 size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Total</Text><Text fw={700} size="xl">{stats.total}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="green" size="lg"><IconThumbUp size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Positivos</Text><Text fw={700} size="xl">{stats.positive}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="red" size="lg"><IconThumbDown size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Negativos</Text><Text fw={700} size="xl">{stats.negative}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="teal" size="lg"><IconStar size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Resolvidos</Text><Text fw={700} size="xl">{stats.resolved}</Text></div></Group>
                </Card>
            </SimpleGrid>

            <Tabs value={tab} onChange={setTab}>
                <Tabs.List>
                    <Tabs.Tab value="all">Todos ({suggestions.length})</Tabs.Tab>
                    <Tabs.Tab value="positive">Positivos ({stats.positive})</Tabs.Tab>
                    <Tabs.Tab value="negative">Negativos ({stats.negative})</Tabs.Tab>
                    <Tabs.Tab value="neutral">Neutros</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            <Card withBorder p="md">
                {feedbackItems.length > 0 ? (
                    <Table>
                        <Table.Thead><Table.Tr>
                            <Table.Th>Feedback</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Votos</Table.Th>
                            <Table.Th>Impacto</Table.Th><Table.Th>Status</Table.Th><Table.Th>Data</Table.Th>
                        </Table.Tr></Table.Thead>
                        <Table.Tbody>
                            {feedbackItems.map(s => (
                                <Table.Tr key={s.id}>
                                    <Table.Td><Text fw={500} size="sm">{s.title}</Text>
                                        <Text size="xs" c="dimmed" lineClamp={1}>{s.description}</Text></Table.Td>
                                    <Table.Td><Badge size="sm" variant="light">{s.problemType}</Badge></Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <IconThumbUp size={14} color="green" /><Text size="sm">{s.upvotes}</Text>
                                            <IconThumbDown size={14} color="red" /><Text size="sm">{s.downvotes}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td><Badge size="sm" variant="light" color={impactColors[s.estimatedImpact] || 'gray'}>{s.estimatedImpact}</Badge></Table.Td>
                                    <Table.Td><Badge size="sm" variant="light" color={statusColors[s.status] || 'gray'}>{statusLabels[s.status] || s.status}</Badge></Table.Td>
                                    <Table.Td><Text size="sm" c="dimmed">{fmt(s.createdAt)}</Text></Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl"><Stack align="center" gap="xs">
                        <IconMessage2 size={48} color="gray" /><Text c="dimmed">Nenhum feedback encontrado</Text>
                    </Stack></Center>
                )}
            </Card>

            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Novo Feedback" size="md">
                <Stack gap="md">
                    <TextInput label="Título" placeholder="Resumo do feedback" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                    <Select label="Tipo" value={newType} onChange={v => setNewType(v || 'communication')}
                        data={[
                            { value: 'communication', label: '💬 Comunicação' },
                            { value: 'quality', label: '⭐ Qualidade' },
                            { value: 'inefficiency', label: '⚡ Ineficiência' },
                            { value: 'safety', label: '🛡️ Segurança' },
                            { value: 'other', label: '📝 Outro' },
                        ]} />
                    <Textarea label="Descrição" placeholder="Detalhes do feedback..." value={newDesc} onChange={e => setNewDesc(e.target.value)} minRows={3} required />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button leftSection={<IconPlus size={16} />} disabled={!newTitle.trim() || !newDesc.trim()} loading={creating} onClick={handleCreate}>Enviar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
