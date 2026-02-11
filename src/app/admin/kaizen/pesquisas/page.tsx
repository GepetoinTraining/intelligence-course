'use client';

import { useMemo, useState } from 'react';
import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon,
    Table, Loader, Alert, Center, Button, Modal, TextInput,
    Textarea, Select,
} from '@mantine/core';
import {
    IconSearch, IconAlertCircle, IconPlus, IconClipboardList,
    IconUsers, IconCheck,
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
    createdAt: number;
}

export default function PesquisasPage() {
    const { data, isLoading, error, refetch } = useApi<Suggestion[]>('/api/kaizen/suggestions?limit=100');
    const { create, isLoading: creating } = useCreate('/api/kaizen/suggestions');
    const suggestions = data || [];
    const [createOpen, setCreateOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [type, setType] = useState('quality');

    // Group by problem type as "research areas"
    const areas = useMemo(() => {
        const map = new Map<string, Suggestion[]>();
        suggestions.forEach(s => {
            const arr = map.get(s.problemType) || [];
            arr.push(s);
            map.set(s.problemType, arr);
        });
        return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
    }, [suggestions]);

    const stats = {
        totalAreas: areas.length,
        totalSuggestions: suggestions.length,
        activeResearch: suggestions.filter(s => ['under_review', 'approved', 'in_progress'].includes(s.status)).length,
        completed: suggestions.filter(s => s.status === 'implemented').length,
    };

    const handleCreate = async () => {
        try {
            await create({ title, description: desc, problemType: type });
            setCreateOpen(false);
            setTitle(''); setDesc(''); setType('quality');
            refetch();
        } catch { /* hook handles */ }
    };

    const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('pt-BR');

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}<Button size="xs" ml="md" onClick={refetch}>Tentar novamente</Button></Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Group gap="xs" mb={4}><Text size="sm" c="dimmed">Kaizen</Text><Text size="sm" c="dimmed">/</Text><Text size="sm" fw={500}>Pesquisas</Text></Group>
                    <Title order={2}>Pesquisas & Investigações</Title>
                </div>
                <Group>
                    <DiagramToggle route="/api/kaizen/suggestions" data={suggestions} forceType="flowchart" title="Árvore de Pesquisas" />
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>Nova Pesquisa</Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="blue" size="lg"><IconSearch size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Áreas</Text><Text fw={700} size="xl">{stats.totalAreas}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="grape" size="lg"><IconClipboardList size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Total</Text><Text fw={700} size="xl">{stats.totalSuggestions}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="violet" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Em Pesquisa</Text><Text fw={700} size="xl">{stats.activeResearch}</Text></div></Group>
                </Card>
                <Card withBorder p="md">
                    <Group><ThemeIcon variant="light" color="green" size="lg"><IconCheck size={20} /></ThemeIcon>
                        <div><Text size="xs" c="dimmed">Concluídas</Text><Text fw={700} size="xl">{stats.completed}</Text></div></Group>
                </Card>
            </SimpleGrid>

            {areas.map(([areaName, items]) => (
                <Card key={areaName} withBorder p="md">
                    <Group justify="space-between" mb="sm">
                        <Group gap="xs">
                            <Text fw={600} tt="capitalize">{areaName.replace(/_/g, ' ')}</Text>
                            <Badge size="sm" variant="light">{items.length}</Badge>
                        </Group>
                    </Group>
                    <Table>
                        <Table.Thead><Table.Tr>
                            <Table.Th>Título</Table.Th><Table.Th>Impacto</Table.Th>
                            <Table.Th>Status</Table.Th><Table.Th>Data</Table.Th>
                        </Table.Tr></Table.Thead>
                        <Table.Tbody>
                            {items.slice(0, 5).map(s => (
                                <Table.Tr key={s.id}>
                                    <Table.Td><Text size="sm" fw={500}>{s.title}</Text></Table.Td>
                                    <Table.Td><Badge size="xs" variant="light">{s.estimatedImpact}</Badge></Table.Td>
                                    <Table.Td><Badge size="xs" variant="light">{s.status}</Badge></Table.Td>
                                    <Table.Td><Text size="sm" c="dimmed">{fmt(s.createdAt)}</Text></Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            ))}

            <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Nova Pesquisa">
                <Stack gap="md">
                    <TextInput label="Título" value={title} onChange={e => setTitle(e.target.value)} required />
                    <Select label="Área" value={type} onChange={v => setType(v || 'quality')}
                        data={[
                            { value: 'quality', label: '⭐ Qualidade' },
                            { value: 'inefficiency', label: '⚡ Eficiência' },
                            { value: 'safety', label: '🛡️ Segurança' },
                            { value: 'cost', label: '💰 Custo' },
                            { value: 'communication', label: '💬 Comunicação' },
                            { value: 'other', label: '📝 Outro' },
                        ]} />
                    <Textarea label="Descrição" value={desc} onChange={e => setDesc(e.target.value)} minRows={3} required />
                    <Group justify="flex-end">
                        <Button variant="light" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                        <Button loading={creating} disabled={!title.trim() || !desc.trim()} onClick={handleCreate}>Criar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
