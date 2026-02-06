'use client';

import { useState } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button, SimpleGrid,
    ThemeIcon, Paper, ActionIcon, Modal, TextInput, Textarea, Avatar,
    Tabs, Grid, Progress, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconChevronLeft, IconPlus, IconTrophy, IconFlame, IconThumbUp,
    IconEye, IconSend, IconCrown, IconStar, IconThumbDown, IconAward
} from '@tabler/icons-react';
import Link from 'next/link';

interface Challenge {
    id: string;
    title: string;
    description: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    attempts: number;
    bestScore?: number;
    status: 'open' | 'attempted' | 'solved';
    difficulty: 'easy' | 'medium' | 'hard';
}

interface Solution {
    id: string;
    challengeId: string;
    authorId: string;
    authorName: string;
    prompt: string;
    score: number;
    upvotes: number;
    downvotes: number;
    userVote: 'up' | 'down' | null;
    submittedAt: string;
}

interface LeaderboardEntry {
    rank: number;
    name: string;
    score: number;
    challenges: number;
}

const MOCK_CHALLENGES: Challenge[] = [
    { id: '1', title: 'O Paradoxo do Viajante', description: 'Crie um prompt que faça o AI explicar o paradoxo do avô de forma simples', authorId: 'u1', authorName: 'Maria S.', createdAt: '2026-02-01', attempts: 15, bestScore: 95, status: 'open', difficulty: 'medium' },
    { id: '2', title: 'Poesia em Código', description: 'Faça o AI escrever um poema onde cada linha seja também código válido', authorId: 'u2', authorName: 'João C.', createdAt: '2026-01-28', attempts: 8, bestScore: 88, status: 'attempted', difficulty: 'hard' },
    { id: '3', title: 'Explicação para Criança', description: 'Explique mecânica quântica para uma criança de 5 anos', authorId: 'u3', authorName: 'Ana L.', createdAt: '2026-01-25', attempts: 23, bestScore: 92, status: 'solved', difficulty: 'easy' },
];

const MOCK_SOLUTIONS: Solution[] = [
    { id: 's1', challengeId: '1', authorId: 'u4', authorName: 'Pedro A.', prompt: 'Imagine que você tem uma máquina do tempo...', score: 95, upvotes: 12, downvotes: 1, userVote: null, submittedAt: '2026-02-01T14:00:00' },
    { id: 's2', challengeId: '1', authorId: 'u5', authorName: 'Carla M.', prompt: 'Vamos fingir que você é um viajante do tempo...', score: 88, upvotes: 8, downvotes: 2, userVote: 'up', submittedAt: '2026-02-01T15:30:00' },
    { id: 's3', challengeId: '3', authorId: 'u6', authorName: 'Lucas R.', prompt: 'Pense em coisas muito pequenininhas...', score: 92, upvotes: 15, downvotes: 0, userVote: null, submittedAt: '2026-01-26T10:00:00' },
    { id: 's4', challengeId: '3', authorId: 'u1', authorName: 'Maria S.', prompt: 'Sabe quando você brinca de esconde-esconde...', score: 85, upvotes: 10, downvotes: 3, userVote: 'down', submittedAt: '2026-01-26T11:00:00' },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, name: 'Pedro Alves', score: 450, challenges: 12 },
    { rank: 2, name: 'Maria Santos', score: 380, challenges: 10 },
    { rank: 3, name: 'João Costa', score: 320, challenges: 8 },
    { rank: 4, name: 'Ana Lima', score: 280, challenges: 7 },
    { rank: 5, name: 'Bruno Silva', score: 240, challenges: 6 },
];

export default function ChallengeBoardPage() {
    const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);
    const [solutions, setSolutions] = useState<Solution[]>(MOCK_SOLUTIONS);
    const [activeTab, setActiveTab] = useState<string | null>('all');
    const [modal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [attemptModal, { open: openAttempt, close: closeAttempt }] = useDisclosure(false);
    const [solutionsModal, { open: openSolutions, close: closeSolutions }] = useDisclosure(false);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDifficulty, setNewDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [attemptPrompt, setAttemptPrompt] = useState('');

    const handleCreate = () => {
        if (!newTitle || !newDescription) return;
        const newChallenge: Challenge = {
            id: `ch-${Date.now()}`,
            title: newTitle,
            description: newDescription,
            authorId: 'me',
            authorName: 'Você',
            createdAt: new Date().toISOString().split('T')[0],
            attempts: 0,
            status: 'open',
            difficulty: newDifficulty,
        };
        setChallenges(prev => [newChallenge, ...prev]);
        setNewTitle('');
        setNewDescription('');
        closeModal();
    };

    const handleAttempt = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setAttemptPrompt('');
        openAttempt();
    };

    const handleSubmitAttempt = () => {
        if (!selectedChallenge || !attemptPrompt.trim()) return;

        const newSolution: Solution = {
            id: `sol-${Date.now()}`,
            challengeId: selectedChallenge.id,
            authorId: 'me',
            authorName: 'Você',
            prompt: attemptPrompt,
            score: Math.floor(Math.random() * 20) + 75, // Mock score
            upvotes: 0,
            downvotes: 0,
            userVote: null,
            submittedAt: new Date().toISOString(),
        };

        setSolutions(prev => [newSolution, ...prev]);
        setChallenges(prev => prev.map(c =>
            c.id === selectedChallenge.id
                ? { ...c, attempts: c.attempts + 1, status: 'attempted' as const }
                : c
        ));
        closeAttempt();
    };

    const handleViewSolutions = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        openSolutions();
    };

    const handleVote = (solutionId: string, vote: 'up' | 'down') => {
        setSolutions(prev => prev.map(s => {
            if (s.id !== solutionId) return s;

            let newUpvotes = s.upvotes;
            let newDownvotes = s.downvotes;
            let newUserVote: 'up' | 'down' | null = vote;

            // Remove previous vote
            if (s.userVote === 'up') newUpvotes--;
            if (s.userVote === 'down') newDownvotes--;

            // Toggle off if same vote
            if (s.userVote === vote) {
                newUserVote = null;
            } else {
                // Apply new vote
                if (vote === 'up') newUpvotes++;
                if (vote === 'down') newDownvotes++;
            }

            return {
                ...s,
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                userVote: newUserVote,
            };
        }));
    };

    const getDifficultyInfo = (diff: string) => {
        const map: Record<string, { color: string; label: string }> = {
            easy: { color: 'green', label: 'Fácil' },
            medium: { color: 'orange', label: 'Médio' },
            hard: { color: 'red', label: 'Difícil' },
        };
        return map[diff] || map.medium;
    };

    const getStatusInfo = (status: string) => {
        const map: Record<string, { color: string; label: string }> = {
            open: { color: 'blue', label: 'Aberto' },
            attempted: { color: 'orange', label: 'Tentado' },
            solved: { color: 'green', label: 'Resolvido' },
        };
        return map[status] || map.open;
    };

    const filteredChallenges = activeTab === 'all' ? challenges :
        activeTab === 'mine' ? challenges.filter(c => c.authorId === 'me') :
            challenges.filter(c => c.status === activeTab);

    const challengeSolutions = selectedChallenge
        ? solutions.filter(s => s.challengeId === selectedChallenge.id).sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
        : [];

    return (
        <Stack gap="xl">
            <Group justify="space-between">
                <Group>
                    <Link href="/student" passHref legacyBehavior>
                        <ActionIcon component="a" variant="subtle" size="lg">
                            <IconChevronLeft size={20} />
                        </ActionIcon>
                    </Link>
                    <div>
                        <Title order={2}>Desafios da Turma 🏆</Title>
                        <Text c="dimmed">Crie e resolva desafios de prompting</Text>
                    </div>
                </Group>
                <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
                    Criar Desafio
                </Button>
            </Group>

            <Grid>
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Tabs value={activeTab} onChange={setActiveTab}>
                        <Tabs.List>
                            <Tabs.Tab value="all">Todos</Tabs.Tab>
                            <Tabs.Tab value="open">Abertos</Tabs.Tab>
                            <Tabs.Tab value="attempted">Tentados</Tabs.Tab>
                            <Tabs.Tab value="solved">Resolvidos</Tabs.Tab>
                            <Tabs.Tab value="mine">Meus</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>

                    <Stack gap="md" mt="md">
                        {filteredChallenges.map(challenge => {
                            const diffInfo = getDifficultyInfo(challenge.difficulty);
                            const statusInfo = getStatusInfo(challenge.status);
                            const solutionCount = solutions.filter(s => s.challengeId === challenge.id).length;

                            return (
                                <Card key={challenge.id} shadow="sm" radius="md" p="lg" withBorder>
                                    <Group justify="space-between" mb="md">
                                        <Group gap="sm">
                                            <Avatar size="sm" radius="xl" color="blue">
                                                {challenge.authorName.charAt(0)}
                                            </Avatar>
                                            <div>
                                                <Text fw={600}>{challenge.title}</Text>
                                                <Text size="xs" c="dimmed">por {challenge.authorName}</Text>
                                            </div>
                                        </Group>
                                        <Group gap={4}>
                                            <Badge color={diffInfo.color} variant="light" size="sm">
                                                {diffInfo.label}
                                            </Badge>
                                            <Badge color={statusInfo.color} variant="outline" size="sm">
                                                {statusInfo.label}
                                            </Badge>
                                        </Group>
                                    </Group>

                                    <Text size="sm" c="dimmed" mb="md">{challenge.description}</Text>

                                    <Group justify="space-between">
                                        <Group gap="lg">
                                            <Group gap={4}>
                                                <IconFlame size={14} />
                                                <Text size="sm">{challenge.attempts} tentativas</Text>
                                            </Group>
                                            {challenge.bestScore && (
                                                <Group gap={4}>
                                                    <IconStar size={14} color="var(--mantine-color-yellow-6)" />
                                                    <Text size="sm">Melhor: {challenge.bestScore}%</Text>
                                                </Group>
                                            )}
                                            {solutionCount > 0 && (
                                                <Tooltip label="Ver soluções votadas">
                                                    <Badge
                                                        variant="light"
                                                        color="grape"
                                                        leftSection={<IconThumbUp size={10} />}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleViewSolutions(challenge)}
                                                    >
                                                        {solutionCount} soluções
                                                    </Badge>
                                                </Tooltip>
                                            )}
                                        </Group>
                                        <Group gap="xs">
                                            {solutionCount > 0 && (
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    leftSection={<IconEye size={14} />}
                                                    onClick={() => handleViewSolutions(challenge)}
                                                >
                                                    Soluções
                                                </Button>
                                            )}
                                            <Button
                                                size="xs"
                                                variant="light"
                                                leftSection={<IconSend size={14} />}
                                                onClick={() => handleAttempt(challenge)}
                                            >
                                                Tentar
                                            </Button>
                                        </Group>
                                    </Group>
                                </Card>
                            );
                        })}
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card shadow="sm" radius="md" p="lg" withBorder>
                        <Group gap="xs" mb="md">
                            <IconTrophy size={20} color="var(--mantine-color-yellow-6)" />
                            <Text fw={600}>Ranking</Text>
                        </Group>
                        <Stack gap="sm">
                            {MOCK_LEADERBOARD.map((entry, i) => (
                                <Paper key={i} p="sm" bg={i === 0 ? 'yellow.0' : 'gray.0'} radius="md">
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <ThemeIcon
                                                size="sm"
                                                variant="filled"
                                                color={i === 0 ? 'yellow' : i === 1 ? 'gray' : i === 2 ? 'orange' : 'blue'}
                                            >
                                                {i === 0 ? <IconCrown size={12} /> : entry.rank}
                                            </ThemeIcon>
                                            <div>
                                                <Text size="sm" fw={500}>{entry.name}</Text>
                                                <Text size="xs" c="dimmed">{entry.challenges} desafios</Text>
                                            </div>
                                        </Group>
                                        <Text size="sm" fw={700}>{entry.score} pts</Text>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Create Modal */}
            <Modal opened={modal} onClose={closeModal} title="Criar Desafio" centered>
                <Stack gap="md">
                    <TextInput
                        label="Título"
                        placeholder="Ex: O Paradoxo do Viajante"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva o desafio..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        minRows={3}
                        required
                    />
                    <Group>
                        {(['easy', 'medium', 'hard'] as const).map(d => (
                            <Button
                                key={d}
                                size="xs"
                                variant={newDifficulty === d ? 'filled' : 'light'}
                                color={getDifficultyInfo(d).color}
                                onClick={() => setNewDifficulty(d)}
                            >
                                {getDifficultyInfo(d).label}
                            </Button>
                        ))}
                    </Group>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeModal}>Cancelar</Button>
                        <Button onClick={handleCreate}>Criar</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Attempt Modal */}
            <Modal opened={attemptModal} onClose={closeAttempt} title={selectedChallenge?.title} centered size="lg">
                <Stack gap="md">
                    <Paper p="md" bg="blue.0" radius="md">
                        <Text size="sm">{selectedChallenge?.description}</Text>
                    </Paper>
                    <Textarea
                        label="Sua Solução"
                        placeholder="Escreva seu prompt aqui..."
                        value={attemptPrompt}
                        onChange={(e) => setAttemptPrompt(e.target.value)}
                        minRows={6}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeAttempt}>Cancelar</Button>
                        <Button leftSection={<IconSend size={16} />} onClick={handleSubmitAttempt}>
                            Submeter
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Solutions Modal with Voting */}
            <Modal
                opened={solutionsModal}
                onClose={closeSolutions}
                title={
                    <Group gap="xs">
                        <IconAward size={20} />
                        <Text fw={600}>Soluções: {selectedChallenge?.title}</Text>
                    </Group>
                }
                centered
                size="lg"
            >
                <Stack gap="md">
                    <Paper p="sm" bg="gray.0" radius="md">
                        <Text size="sm" c="dimmed">{selectedChallenge?.description}</Text>
                    </Paper>

                    <Text size="sm" fw={500}>
                        {challengeSolutions.length} solução(ões) - Vote nas melhores!
                    </Text>

                    <Stack gap="sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {challengeSolutions.map((solution, index) => {
                            const netVotes = solution.upvotes - solution.downvotes;

                            return (
                                <Paper key={solution.id} p="md" withBorder radius="md">
                                    <Group justify="space-between" mb="sm">
                                        <Group gap="sm">
                                            {index === 0 && netVotes > 0 && (
                                                <ThemeIcon size="sm" color="yellow" variant="filled">
                                                    <IconCrown size={12} />
                                                </ThemeIcon>
                                            )}
                                            <Avatar size="sm" radius="xl" color="violet">
                                                {solution.authorName.charAt(0)}
                                            </Avatar>
                                            <div>
                                                <Text size="sm" fw={500}>{solution.authorName}</Text>
                                                <Text size="xs" c="dimmed">
                                                    Score: {solution.score}% • {new Date(solution.submittedAt).toLocaleDateString('pt-BR')}
                                                </Text>
                                            </div>
                                        </Group>
                                        <Badge variant="light" color={netVotes > 0 ? 'green' : netVotes < 0 ? 'red' : 'gray'}>
                                            {netVotes > 0 ? '+' : ''}{netVotes} votos
                                        </Badge>
                                    </Group>

                                    <Paper p="sm" bg="gray.0" radius="sm" mb="sm">
                                        <Text size="sm" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                            {solution.prompt.length > 200
                                                ? solution.prompt.substring(0, 200) + '...'
                                                : solution.prompt}
                                        </Text>
                                    </Paper>

                                    <Group justify="space-between">
                                        <Group gap="xs">
                                            <Tooltip label="Votar positivo">
                                                <ActionIcon
                                                    variant={solution.userVote === 'up' ? 'filled' : 'light'}
                                                    color="green"
                                                    onClick={() => handleVote(solution.id, 'up')}
                                                >
                                                    <IconThumbUp size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Text size="sm" fw={500}>{solution.upvotes}</Text>

                                            <Tooltip label="Votar negativo">
                                                <ActionIcon
                                                    variant={solution.userVote === 'down' ? 'filled' : 'light'}
                                                    color="red"
                                                    onClick={() => handleVote(solution.id, 'down')}
                                                >
                                                    <IconThumbDown size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Text size="sm" fw={500}>{solution.downvotes}</Text>
                                        </Group>

                                        <Button size="xs" variant="subtle" leftSection={<IconEye size={14} />}>
                                            Ver Completo
                                        </Button>
                                    </Group>
                                </Paper>
                            );
                        })}

                        {challengeSolutions.length === 0 && (
                            <Paper p="xl" ta="center" c="dimmed">
                                <Text>Nenhuma solução ainda. Seja o primeiro!</Text>
                            </Paper>
                        )}
                    </Stack>

                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={closeSolutions}>Fechar</Button>
                        <Button
                            leftSection={<IconSend size={16} />}
                            onClick={() => { closeSolutions(); if (selectedChallenge) handleAttempt(selectedChallenge); }}
                        >
                            Submeter Minha Solução
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}


