'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    TextInput, Modal, Textarea, SimpleGrid, Paper,
    ThemeIcon, Tabs
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSearch, IconPlus, IconTrophy, IconSkull,
    IconSparkles, IconRefresh
} from '@tabler/icons-react';

interface GraveyardEntry {
    id: string;
    characterName: string;
    causeOfDeath: string;
    epitaph: string;
    technique?: string;
    moduleId?: string;
    runId: string;
    resurrectedAsId?: string;
    votes: number;
    createdAt: string;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: number;
    progress: number;
    unlocked: boolean;
}

// Mock data
const MOCK_GRAVES: GraveyardEntry[] = [
    {
        id: 'g1',
        characterName: 'Grumpy Blacksmith v1',
        causeOfDeath: 'Sabia muito sobre WiFi routers',
        epitaph: '"Deveria ter ficado na forja"',
        technique: 'orbit',
        moduleId: 'module-1',
        runId: 'run-101',
        votes: 8,
        createdAt: '2026-01-20T10:00:00Z',
    },
    {
        id: 'g2',
        characterName: 'Alien Tourist',
        causeOfDeath: 'Esqueceu que era de outro planeta',
        epitaph: '"A gravidade terrestre foi forte demais"',
        technique: 'orbit',
        moduleId: 'module-1',
        runId: 'run-089',
        resurrectedAsId: 'p3',
        votes: 12,
        createdAt: '2026-01-18T14:00:00Z',
    },
    {
        id: 'g3',
        characterName: 'Noir Detective',
        causeOfDeath: 'Sorriu',
        epitaph: '"O sorriso foi o último caso"',
        technique: 'orbit',
        moduleId: 'module-1',
        runId: 'run-078',
        votes: 24,
        createdAt: '2026-01-15T16:00:00Z',
    },
    {
        id: 'g4',
        characterName: 'Medieval Merchant',
        causeOfDeath: 'Aceitou pagamento em PIX',
        epitaph: '"Ouro ou nada... ops"',
        technique: 'orbit',
        runId: 'run-056',
        votes: 31,
        createdAt: '2026-01-12T09:00:00Z',
    },
    {
        id: 'g5',
        characterName: 'Silent Monk',
        causeOfDeath: 'Falou demais',
        epitaph: '"..."',
        technique: 'black_hole',
        runId: 'run-042',
        votes: 45,
        createdAt: '2026-01-10T11:00:00Z',
    },
    {
        id: 'g6',
        characterName: 'Caveman',
        causeOfDeath: 'Usou gramática perfeita',
        epitaph: '"Me Tarzan, me speak very eloquently"',
        technique: 'orbit',
        runId: 'run-033',
        votes: 56,
        createdAt: '2026-01-08T15:00:00Z',
    },
];

const MOCK_BADGES: Badge[] = [
    {
        id: 'b1',
        name: 'Primeiro Funeral',
        description: 'Enterre seu primeiro personagem',
        icon: '⚰️',
        requirement: 1,
        progress: 6,
        unlocked: true,
    },
    {
        id: 'b2',
        name: 'Character Assassin',
        description: 'Quebre 10 personagens',
        icon: '🗡️',
        requirement: 10,
        progress: 6,
        unlocked: false,
    },
    {
        id: 'b3',
        name: 'Serial Breaker',
        description: 'Quebre 25 personagens',
        icon: '💀',
        requirement: 25,
        progress: 6,
        unlocked: false,
    },
    {
        id: 'b4',
        name: 'Method Actor',
        description: 'Ressuscite 5 personagens',
        icon: '🎭',
        requirement: 5,
        progress: 1,
        unlocked: false,
    },
    {
        id: 'b5',
        name: 'Epitaph Master',
        description: 'Receba 50 votos em epitáfios',
        icon: '✍️',
        requirement: 50,
        progress: 45,
        unlocked: false,
    },
];

export default function GraveyardPage() {
    const [graves] = useState<GraveyardEntry[]>(MOCK_GRAVES);
    const [badges] = useState<Badge[]>(MOCK_BADGES);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('graves');
    const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
    const [newGrave, setNewGrave] = useState({ characterName: '', causeOfDeath: '', epitaph: '' });

    const filteredGraves = graves.filter(g =>
        g.characterName.toLowerCase().includes(search.toLowerCase()) ||
        g.epitaph.toLowerCase().includes(search.toLowerCase()) ||
        g.causeOfDeath.toLowerCase().includes(search.toLowerCase())
    );

    const topEpitaphs = [...graves].sort((a, b) => b.votes - a.votes).slice(0, 5);

    return (
        <>
            <Stack gap="xl">
                {/* Header */}
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Character Graveyard 💀</Title>
                        <Text c="dimmed">Onde personagens quebrados descansam em paz</Text>
                    </div>
                    <Button leftSection={<IconPlus size={16} />} onClick={openAdd} color="gray">
                        Enterrar Personagem
                    </Button>
                </Group>

                {/* Stats */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    <Paper p="md" radius="md" withBorder ta="center">
                        <ThemeIcon size={40} variant="light" color="gray" radius="xl" mx="auto" mb="xs">
                            <IconSkull size={20} />
                        </ThemeIcon>
                        <Text size="xl" fw={700}>{graves.length}</Text>
                        <Text size="xs" c="dimmed">Enterrados</Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder ta="center">
                        <ThemeIcon size={40} variant="light" color="green" radius="xl" mx="auto" mb="xs">
                            <IconRefresh size={20} />
                        </ThemeIcon>
                        <Text size="xl" fw={700}>{graves.filter(g => g.resurrectedAsId).length}</Text>
                        <Text size="xs" c="dimmed">Ressuscitados</Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder ta="center">
                        <ThemeIcon size={40} variant="light" color="yellow" radius="xl" mx="auto" mb="xs">
                            <IconTrophy size={20} />
                        </ThemeIcon>
                        <Text size="xl" fw={700}>{badges.filter(b => b.unlocked).length}/{badges.length}</Text>
                        <Text size="xs" c="dimmed">Badges</Text>
                    </Paper>
                    <Paper p="md" radius="md" withBorder ta="center">
                        <ThemeIcon size={40} variant="light" color="violet" radius="xl" mx="auto" mb="xs">
                            <IconSparkles size={20} />
                        </ThemeIcon>
                        <Text size="xl" fw={700}>{graves.reduce((acc, g) => acc + g.votes, 0)}</Text>
                        <Text size="xs" c="dimmed">Votos Totais</Text>
                    </Paper>
                </SimpleGrid>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="graves" leftSection={<IconSkull size={14} />}>
                            Cemitério
                        </Tabs.Tab>
                        <Tabs.Tab value="leaderboard" leftSection={<IconTrophy size={14} />}>
                            Melhores Epitáfios
                        </Tabs.Tab>
                        <Tabs.Tab value="badges" leftSection={<IconSparkles size={14} />}>
                            Badges
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="graves" pt="md">
                        {/* Search */}
                        <TextInput
                            placeholder="Buscar personagens..."
                            leftSection={<IconSearch size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            mb="md"
                            style={{ maxWidth: 400 }}
                        />

                        {/* Graves Grid */}
                        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
                            {filteredGraves.map((grave) => (
                                <Card
                                    key={grave.id}
                                    shadow="sm"
                                    radius="md"
                                    p="md"
                                    withBorder
                                    style={{
                                        background: 'linear-gradient(180deg, var(--mantine-color-gray-1) 0%, var(--mantine-color-gray-2) 100%)',
                                        borderColor: 'var(--mantine-color-gray-4)',
                                    }}
                                >
                                    <Stack gap="xs" align="center" ta="center">
                                        {/* Tombstone top */}
                                        <Paper
                                            p="xs"
                                            radius="md"
                                            style={{
                                                borderTopLeftRadius: 40,
                                                borderTopRightRadius: 40,
                                                width: '100%',
                                                background: 'linear-gradient(180deg, var(--mantine-color-gray-3) 0%, var(--mantine-color-gray-4) 100%)',
                                            }}
                                        >
                                            <Text size="xs" fw={700} c="dimmed">R.I.P.</Text>
                                            <Text size="sm" fw={600} lineClamp={1} mt={2}>
                                                {grave.characterName}
                                            </Text>
                                        </Paper>

                                        {/* Epitaph */}
                                        <Text size="xs" fs="italic" c="dimmed" lineClamp={2}>
                                            {grave.epitaph}
                                        </Text>

                                        {/* Cause */}
                                        <Badge variant="light" color="red" size="xs">
                                            {grave.causeOfDeath}
                                        </Badge>

                                        {/* Technique Tag */}
                                        {grave.technique && (
                                            <Badge variant="outline" color="gray" size="xs">
                                                #{grave.technique}
                                            </Badge>
                                        )}

                                        {/* Resurrection indicator */}
                                        {grave.resurrectedAsId && (
                                            <Badge variant="filled" color="green" size="xs" leftSection="🔄">
                                                Ressuscitado!
                                            </Badge>
                                        )}

                                        {/* Votes */}
                                        <Group gap={4}>
                                            <Text size="xs" c="dimmed">👍 {grave.votes}</Text>
                                        </Group>
                                    </Stack>
                                </Card>
                            ))}
                        </SimpleGrid>

                        {filteredGraves.length === 0 && (
                            <Paper p="xl" radius="md" withBorder ta="center">
                                <IconSkull size={48} color="var(--mantine-color-gray-5)" />
                                <Text c="dimmed" mt="md">Nenhum personagem encontrado</Text>
                            </Paper>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="leaderboard" pt="md">
                        <Stack gap="md">
                            <Text fw={500}>Top 5 Epitáfios Mais Votados</Text>
                            {topEpitaphs.map((grave, index) => (
                                <Card key={grave.id} shadow="xs" radius="md" p="md" withBorder>
                                    <Group justify="space-between">
                                        <Group gap="md">
                                            <ThemeIcon
                                                size={40}
                                                radius="xl"
                                                color={index === 0 ? 'yellow' : index === 1 ? 'gray' : index === 2 ? 'orange' : 'dark'}
                                                variant={index < 3 ? 'filled' : 'light'}
                                            >
                                                <Text fw={700}>#{index + 1}</Text>
                                            </ThemeIcon>
                                            <div>
                                                <Text fw={500}>{grave.characterName}</Text>
                                                <Text size="sm" fs="italic" c="dimmed">
                                                    {grave.epitaph}
                                                </Text>
                                            </div>
                                        </Group>
                                        <Badge size="lg" variant="light" color="violet">
                                            👍 {grave.votes}
                                        </Badge>
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="badges" pt="md">
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                            {badges.map((badge) => (
                                <Card
                                    key={badge.id}
                                    shadow="xs"
                                    radius="md"
                                    p="lg"
                                    withBorder
                                    style={{
                                        opacity: badge.unlocked ? 1 : 0.6,
                                        background: badge.unlocked ?
                                            'linear-gradient(135deg, var(--mantine-color-yellow-0) 0%, var(--mantine-color-orange-0) 100%)' :
                                            undefined
                                    }}
                                >
                                    <Group gap="md">
                                        <Text size="2rem">{badge.icon}</Text>
                                        <div style={{ flex: 1 }}>
                                            <Group gap="xs">
                                                <Text fw={600}>{badge.name}</Text>
                                                {badge.unlocked && (
                                                    <Badge size="xs" color="green">Desbloqueado</Badge>
                                                )}
                                            </Group>
                                            <Text size="sm" c="dimmed">{badge.description}</Text>
                                            <Group gap={4} mt="xs">
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        height: 4,
                                                        background: 'var(--mantine-color-gray-3)',
                                                        borderRadius: 2,
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${Math.min(100, (badge.progress / badge.requirement) * 100)}%`,
                                                            height: '100%',
                                                            background: badge.unlocked ?
                                                                'var(--mantine-color-green-5)' :
                                                                'var(--mantine-color-violet-5)',
                                                            transition: 'width 0.3s'
                                                        }}
                                                    />
                                                </div>
                                                <Text size="xs" c="dimmed">
                                                    {badge.progress}/{badge.requirement}
                                                </Text>
                                            </Group>
                                        </div>
                                    </Group>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Tabs.Panel>
                </Tabs>
            </Stack>

            {/* Add Grave Modal */}
            <Modal
                opened={addOpened}
                onClose={closeAdd}
                title="Enterrar Personagem 💀"
                size="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome do Personagem"
                        placeholder="Ex: Grumpy Blacksmith"
                        value={newGrave.characterName}
                        onChange={(e) => setNewGrave(prev => ({ ...prev, characterName: e.target.value }))}
                        required
                    />

                    <TextInput
                        label="Causa da Morte"
                        placeholder="O que fez o personagem quebrar?"
                        value={newGrave.causeOfDeath}
                        onChange={(e) => setNewGrave(prev => ({ ...prev, causeOfDeath: e.target.value }))}
                        required
                    />

                    <Textarea
                        label="Epitáfio"
                        placeholder="Uma frase engraçada para a lápide..."
                        value={newGrave.epitaph}
                        onChange={(e) => setNewGrave(prev => ({ ...prev, epitaph: e.target.value }))}
                        required
                    />

                    <Text size="xs" c="dimmed">
                        💡 Dica: epitáfios criativos recebem mais votos e podem desbloquear badges!
                    </Text>

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeAdd}>Cancelar</Button>
                        <Button color="gray" onClick={() => { closeAdd(); }}>
                            ⚰️ Enterrar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}

