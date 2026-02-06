'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Badge,
    Group,
    ThemeIcon,
    Button,
    Table,
    Progress,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconTarget,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Team {
    id: string;
    name: string;
    teamType: string;
    memberCount: number;
    isActive: number;
}

export default function MetasPage() {
    const { data: teams, isLoading, error, refetch } = useApi<Team[]>('/api/teams');

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    // Mock goal progress since we don't have specific goals API
    const teamGoals = teams?.map(team => ({
        ...team,
        goalTarget: 100000,
        goalCurrent: Math.floor(Math.random() * 100000),
    })) || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Comercial</Text>
                    <Title order={2}>Metas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Meta</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconTarget size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Equipes</Text>
                            <Text fw={700} size="lg">{teams?.length || 0}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {teamGoals.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Equipe</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Membros</Table.Th>
                                <Table.Th>Progresso</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {teamGoals.map((team) => {
                                const progress = Math.round((team.goalCurrent / team.goalTarget) * 100);
                                return (
                                    <Table.Tr key={team.id}>
                                        <Table.Td><Text fw={500}>{team.name}</Text></Table.Td>
                                        <Table.Td><Badge variant="light" size="sm">{team.teamType}</Badge></Table.Td>
                                        <Table.Td>{team.memberCount}</Table.Td>
                                        <Table.Td style={{ width: 200 }}>
                                            <Group gap="xs">
                                                <Progress value={progress} size="sm" style={{ flex: 1 }} color={progress >= 100 ? 'green' : progress >= 70 ? 'yellow' : 'blue'} />
                                                <Text size="xs" c="dimmed">{progress}%</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={progress >= 100 ? 'green' : progress >= 70 ? 'yellow' : 'blue'} variant="light">
                                                {progress >= 100 ? 'Atingida' : progress >= 70 ? 'Em progresso' : 'Iniciando'}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconTarget size={48} color="gray" />
                            <Text c="dimmed">Nenhuma meta encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

