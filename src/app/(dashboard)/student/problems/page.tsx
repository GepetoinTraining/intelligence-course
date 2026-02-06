'use client';

import { useState, useEffect } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Modal, Loader, Center, SimpleGrid, Progress,
    ThemeIcon, ActionIcon, Menu
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlus, IconSearch, IconBulb, IconDots, IconEye,
    IconEdit, IconTrash, IconRocket, IconTarget
} from '@tabler/icons-react';
import Link from 'next/link';

interface ProblemWorkshop {
    id: string;
    rawProblem: string;
    rootCause: string | null;
    signName: string | null;
    status: 'draft' | 'in_progress' | 'complete';
    currentStep: number;
    selectedForCapstone: boolean;
    createdAt: number;
}

const statusConfig = {
    draft: { label: 'Rascunho', color: 'gray' },
    in_progress: { label: 'Em Progresso', color: 'blue' },
    complete: { label: 'Completo', color: 'green' },
};

export default function StudentProblemsPage() {
    const [problems, setProblems] = useState<ProblemWorkshop[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [newProblem, setNewProblem] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/workshops');
            const data = await res.json();
            if (data.data) {
                setProblems(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch problems:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newProblem.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/workshops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawProblem: newProblem }),
            });
            if (res.ok) {
                closeCreate();
                setNewProblem('');
                fetchProblems();
            }
        } catch (error) {
            console.error('Failed to create problem:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredProblems = problems.filter(p =>
        p.rawProblem.toLowerCase().includes(search.toLowerCase()) ||
        (p.signName && p.signName.toLowerCase().includes(search.toLowerCase()))
    );

    const completedCount = problems.filter(p => p.status === 'complete').length;
    const inProgressCount = problems.filter(p => p.status === 'in_progress').length;
    const capstoneCount = problems.filter(p => p.selectedForCapstone).length;

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2}>Problem Lab</Title>
                    <Text c="dimmed">Transforme problemas em oportunidades</Text>
                </div>
                <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                    Novo Problema
                </Button>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={4} mb="lg">
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="blue">
                            <IconBulb size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{problems.length}</Text>
                            <Text size="xs" c="dimmed">Total</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="yellow">
                            <IconTarget size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{inProgressCount}</Text>
                            <Text size="xs" c="dimmed">Em Progresso</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="green">
                            <IconBulb size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{completedCount}</Text>
                            <Text size="xs" c="dimmed">Completos</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon size="lg" variant="light" color="violet">
                            <IconRocket size={18} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{capstoneCount}</Text>
                            <Text size="xs" c="dimmed">Para Capstone</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <TextInput
                placeholder="Buscar problemas..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                mb="lg"
            />

            {loading ? (
                <Center py={100}>
                    <Loader size="lg" />
                </Center>
            ) : filteredProblems.length === 0 ? (
                <Card withBorder p="xl" ta="center">
                    <ThemeIcon size={60} radius="xl" variant="light" color="violet" mx="auto" mb="md">
                        <IconBulb size={30} />
                    </ThemeIcon>
                    <Title order={3} mb="xs">Nenhum problema encontrado</Title>
                    <Text c="dimmed" mb="lg">
                        {problems.length === 0
                            ? 'Comece identificando um problema que você quer resolver!'
                            : 'Tente ajustar a busca'}
                    </Text>
                    {problems.length === 0 && (
                        <Button onClick={openCreate}>Começar Primeiro Problema</Button>
                    )}
                </Card>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {filteredProblems.map((problem) => {
                        const config = statusConfig[problem.status];
                        const progressPercent = (problem.currentStep / 6) * 100;
                        return (
                            <Card key={problem.id} withBorder padding="lg">
                                <Group justify="space-between" mb="sm">
                                    <Badge color={config.color}>{config.label}</Badge>
                                    <Group gap="xs">
                                        {problem.selectedForCapstone && (
                                            <Badge variant="light" color="violet" leftSection={<IconRocket size={12} />}>
                                                Capstone
                                            </Badge>
                                        )}
                                        <Menu>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" size="sm">
                                                    <IconDots size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    component={Link}
                                                    href={`/student/workshop?id=${problem.id}`}
                                                    leftSection={<IconEdit size={14} />}
                                                >
                                                    Continuar
                                                </Menu.Item>
                                                <Menu.Item leftSection={<IconEye size={14} />}>
                                                    Visualizar
                                                </Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
                                                    Excluir
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </Group>

                                <Text fw={600} mb="xs" lineClamp={2}>
                                    {problem.signName || problem.rawProblem.slice(0, 100)}
                                </Text>

                                {problem.rootCause && (
                                    <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                                        Causa raiz: {problem.rootCause}
                                    </Text>
                                )}

                                <Stack gap={4}>
                                    <Group justify="space-between">
                                        <Text size="xs" c="dimmed">Progresso</Text>
                                        <Text size="xs" c="dimmed">Passo {problem.currentStep}/6</Text>
                                    </Group>
                                    <Progress value={progressPercent} size="sm" />
                                </Stack>

                                <Button
                                    component={Link}
                                    href={`/student/workshop?id=${problem.id}`}
                                    variant="light"
                                    fullWidth
                                    mt="md"
                                >
                                    {problem.status === 'complete' ? 'Revisar' : 'Continuar'}
                                </Button>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            )}

            {/* Create Modal */}
            <Modal opened={createOpened} onClose={closeCreate} title="Identificar Problema" size="md">
                <Stack>
                    <Text size="sm" c="dimmed">
                        Descreva um problema que você quer resolver. Pode ser algo pessoal,
                        profissional, ou um desafio que você observa no mundo.
                    </Text>
                    <TextInput
                        label="Qual problema você quer resolver?"
                        placeholder="Descreva livremente..."
                        value={newProblem}
                        onChange={(e) => setNewProblem(e.target.value)}
                        required
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={closeCreate}>Cancelar</Button>
                        <Button onClick={handleCreate} loading={saving} disabled={!newProblem.trim()}>
                            Começar Workshop
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

