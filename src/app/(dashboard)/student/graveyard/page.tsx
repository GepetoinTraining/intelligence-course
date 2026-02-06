'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Textarea, Modal, Loader, Center, SimpleGrid,
    ThemeIcon, Paper, Blockquote
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconSearch, IconSkull, IconGrave2, IconRefresh
} from '@tabler/icons-react';

interface GraveyardEntry {
    id: string;
    characterName: string;
    causeOfDeath: string | null;
    epitaph: string | null;
    technique: string | null;
    createdAt: number;
}

export default function StudentGraveyardPage() {
    const [entries, setEntries] = useState<GraveyardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [newEntry, setNewEntry] = useState({
        characterName: '',
        causeOfDeath: '',
        epitaph: '',
        runId: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/graveyard');
            const data = await res.json();
            if (data.data) {
                setEntries(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch graveyard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newEntry.characterName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/graveyard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry),
            });
            if (res.ok) {
                closeCreate();
                setNewEntry({ characterName: '', causeOfDeath: '', epitaph: '', runId: '' });
                fetchEntries();
            }
        } catch (error) {
            console.error('Failed to create entry:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredEntries = entries.filter(e =>
        e.characterName.toLowerCase().includes(search.toLowerCase()) ||
        (e.causeOfDeath && e.causeOfDeath.toLowerCase().includes(search.toLowerCase()))
    );

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Group gap="sm">
                        <ThemeIcon size="lg" variant="light" color="gray">
                            <IconSkull size={20} />
                        </ThemeIcon>
                        <div>
                            <Title order={2}>Character Graveyard</Title>
                            <Text c="dimmed">Onde personagens vão quando quebram o personagem</Text>
                        </div>
                    </Group>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate} color="gray">
                    Enterrar Personagem
                </Button>
            </Group>

            {/* Stats */}
            <Paper withBorder p="md" mb="lg" bg="dark.8">
                <Group justify="center" gap={50}>
                    <Stack align="center" gap={4}>
                        <ThemeIcon size={50} variant="light" color="gray" radius="xl">
                            <IconGrave2 size={28} />
                        </ThemeIcon>
                        <Text size="xl" fw={700} c="white">{entries.length}</Text>
                        <Text size="sm" c="dimmed">Total de Lápides</Text>
                    </Stack>
                    <Stack align="center" gap={4}>
                        <ThemeIcon size={50} variant="light" color="green" radius="xl">
                            <IconRefresh size={28} />
                        </ThemeIcon>
                        <Text size="xl" fw={700} c="white">
                            {entries.filter(e => e.epitaph).length}
                        </Text>
                        <Text size="sm" c="dimmed">Com Epitáfio</Text>
                    </Stack>
                </Group>
            </Paper>

            <TextInput
                placeholder="Buscar personagens..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                mb="lg"
            />

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredEntries.length === 0 ? (
                <Card withBorder p="xl" ta="center" bg="dark.7">
                    <ThemeIcon size={80} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                        <IconSkull size={40} />
                    </ThemeIcon>
                    <Title order={3} mb="xs" c="white">O cemitério está vazio</Title>
                    <Text c="dimmed" mb="lg">
                        {entries.length === 0
                            ? 'Nenhum personagem morreu ainda. Continue praticando!'
                            : 'Nenhum personagem encontrado com essa busca'}
                    </Text>
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {filteredEntries.map((entry) => (
                        <Card key={entry.id} withBorder padding="lg" bg="dark.7">
                            <Stack>
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <IconGrave2 size={20} />
                                        <Text fw={700} size="lg">{entry.characterName}</Text>
                                    </Group>
                                    {entry.technique && (
                                        <Badge variant="light" color="violet">{entry.technique}</Badge>
                                    )}
                                </Group>

                                {entry.causeOfDeath && (
                                    <Text size="sm" c="red.4">
                                        ☠️ {entry.causeOfDeath}
                                    </Text>
                                )}

                                {entry.epitaph && (
                                    <Blockquote
                                        color="gray"
                                        cite="— Epitáfio"
                                        icon={null}
                                        mt="sm"
                                    >
                                        <Text size="sm" fs="italic">"{entry.epitaph}"</Text>
                                    </Blockquote>
                                )}

                                <Text size="xs" c="dimmed" ta="right">
                                    RIP {formatDate(entry.createdAt)}
                                </Text>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            )}

            {/* Create Modal */}
            <Modal opened={createOpened} onClose={closeCreate} title="Enterrar Personagem" size="md">
                <Stack>
                    <TextInput
                        label="Nome do Personagem"
                        placeholder="Ex: Grumpy Blacksmith"
                        value={newEntry.characterName}
                        onChange={(e) => setNewEntry({ ...newEntry, characterName: e.target.value })}
                        required
                    />
                    <TextInput
                        label="Run ID"
                        placeholder="ID do prompt run relacionado"
                        value={newEntry.runId}
                        onChange={(e) => setNewEntry({ ...newEntry, runId: e.target.value })}
                    />
                    <Textarea
                        label="Causa da Morte"
                        placeholder="Ex: Perguntou sobre WiFi routers"
                        value={newEntry.causeOfDeath}
                        onChange={(e) => setNewEntry({ ...newEntry, causeOfDeath: e.target.value })}
                    />
                    <Textarea
                        label="Epitáfio"
                        placeholder="Uma frase em memória do personagem..."
                        value={newEntry.epitaph}
                        onChange={(e) => setNewEntry({ ...newEntry, epitaph: e.target.value })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={closeCreate}>Cancelar</Button>
                        <Button onClick={handleCreate} loading={saving} disabled={!newEntry.characterName.trim()} color="gray">
                            Enterrar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

