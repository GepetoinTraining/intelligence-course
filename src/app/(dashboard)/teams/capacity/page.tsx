'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, ThemeIcon, Skeleton, Divider,
    Table, Progress, Select, Tooltip, Avatar, RingProgress,
    SegmentedControl, Grid, Modal
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconUsers, IconArrowLeft, IconChartBar, IconRefresh,
    IconAlertCircle, IconCheck, IconX, IconUser,
    IconClock, IconTrendingUp, IconTrendingDown
} from '@tabler/icons-react';
import Link from 'next/link';

interface TeamMember {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    positionName: string;
    allocation: number;
    memberRole: string;
    customTitle?: string;
    teamName: string;
    teamId: string;
}

interface Team {
    id: string;
    name: string;
    slug: string;
    teamType: string;
    memberCount: number;
    totalAllocation: number;
    members: TeamMember[];
}

interface CapacityMetrics {
    totalMembers: number;
    totalFTE: number;
    overallocatedCount: number;
    underutilizedCount: number;
    averageAllocation: number;
}

const ALLOCATION_COLORS = {
    optimal: 'green',     // 80-100%
    underutilized: 'yellow', // 50-79%
    low: 'orange',        // 25-49%
    minimal: 'red',       // <25%
    overallocated: 'violet', // >100%
};

function getAllocationColor(allocation: number): string {
    if (allocation > 1) return ALLOCATION_COLORS.overallocated;
    if (allocation >= 0.8) return ALLOCATION_COLORS.optimal;
    if (allocation >= 0.5) return ALLOCATION_COLORS.underutilized;
    if (allocation >= 0.25) return ALLOCATION_COLORS.low;
    return ALLOCATION_COLORS.minimal;
}

function formatAllocation(allocation: number): string {
    return `${Math.round(allocation * 100)}%`;
}

export default function CapacityPlanningPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'members' | 'teams'>('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/teams?includeMembers=true');
            if (res.ok) {
                const data = await res.json();
                const teamList: Team[] = (data.data || []).map((team: any) => ({
                    ...team,
                    totalAllocation: team.members?.reduce(
                        (sum: number, m: any) => sum + (m.allocation || 1),
                        0
                    ) || 0,
                }));
                setTeams(teamList);

                // Flatten members from all teams with team context
                const members: TeamMember[] = [];
                teamList.forEach(team => {
                    team.members?.forEach((m: any) => {
                        members.push({
                            ...m,
                            teamName: team.name,
                            teamId: team.id,
                        });
                    });
                });
                setAllMembers(members);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
            notifications.show({
                title: 'Erro ao Carregar',
                message: 'Não foi possível carregar os dados de capacidade.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate organization-wide metrics
    const metrics: CapacityMetrics = useMemo(() => {
        // Group by userId to get unique members
        const membersByUser = new Map<string, TeamMember[]>();
        allMembers.forEach(m => {
            if (!membersByUser.has(m.userId)) {
                membersByUser.set(m.userId, []);
            }
            membersByUser.get(m.userId)!.push(m);
        });

        let totalFTE = 0;
        let overallocatedCount = 0;
        let underutilizedCount = 0;

        membersByUser.forEach((memberships, userId) => {
            const totalAlloc = memberships.reduce((sum, m) => sum + (m.allocation || 1), 0);
            totalFTE += totalAlloc;
            if (totalAlloc > 1.0) overallocatedCount++;
            if (totalAlloc < 0.5) underutilizedCount++;
        });

        return {
            totalMembers: membersByUser.size,
            totalFTE,
            overallocatedCount,
            underutilizedCount,
            averageAllocation: membersByUser.size > 0
                ? totalFTE / membersByUser.size
                : 0,
        };
    }, [allMembers]);

    // User allocation summary (grouped by person)
    const userAllocations = useMemo(() => {
        const byUser = new Map<string, {
            userId: string;
            userName: string;
            userEmail: string;
            userAvatar: string | null;
            teams: Array<{ teamId: string; teamName: string; allocation: number; positionName: string }>;
            totalAllocation: number;
        }>();

        allMembers.forEach(m => {
            if (!byUser.has(m.userId)) {
                byUser.set(m.userId, {
                    userId: m.userId,
                    userName: m.userName,
                    userEmail: m.userEmail,
                    userAvatar: m.userAvatar,
                    teams: [],
                    totalAllocation: 0,
                });
            }
            const user = byUser.get(m.userId)!;
            user.teams.push({
                teamId: m.teamId,
                teamName: m.teamName,
                allocation: m.allocation || 1,
                positionName: m.positionName,
            });
            user.totalAllocation += m.allocation || 1;
        });

        return Array.from(byUser.values()).sort((a, b) => b.totalAllocation - a.totalAllocation);
    }, [allMembers]);

    // Filtered teams
    const filteredTeams = selectedTeam
        ? teams.filter(t => t.id === selectedTeam)
        : teams;

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>📊 Planejamento de Capacidade</Title>
                        <Text c="dimmed">Carregando...</Text>
                    </div>
                </Group>
                <SimpleGrid cols={4}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} height={100} radius="md" />
                    ))}
                </SimpleGrid>
                <Skeleton height={400} radius="md" />
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>📊 Planejamento de Capacidade</Title>
                    <Text c="dimmed">Visão geral da alocação de recursos humanos</Text>
                </div>
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconRefresh size={16} />}
                        onClick={loadData}
                    >
                        Atualizar
                    </Button>
                    <Button
                        component={Link}
                        href="/teams"
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                    >
                        Voltar para Equipes
                    </Button>
                </Group>
            </Group>

            {/* KPI Cards */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="blue">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{metrics.totalMembers}</Text>
                            <Text size="sm" c="dimmed">Colaboradores</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="green">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{metrics.totalFTE.toFixed(1)}</Text>
                            <Text size="sm" c="dimmed">FTE Total</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="violet">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{metrics.overallocatedCount}</Text>
                            <Text size="sm" c="dimmed">Sobre-alocados</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="orange">
                            <IconTrendingDown size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{metrics.underutilizedCount}</Text>
                            <Text size="sm" c="dimmed">Subutilizados</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Controls */}
            <Card shadow="xs" radius="md" p="md" withBorder>
                <Group justify="space-between">
                    <SegmentedControl
                        value={viewMode}
                        onChange={(v) => setViewMode(v as any)}
                        data={[
                            { label: 'Visão Geral', value: 'overview' },
                            { label: 'Por Equipe', value: 'teams' },
                            { label: 'Por Pessoa', value: 'members' },
                        ]}
                    />
                    <Select
                        placeholder="Filtrar equipe..."
                        data={teams.map(t => ({ value: t.id, label: t.name }))}
                        value={selectedTeam}
                        onChange={setSelectedTeam}
                        clearable
                        w={200}
                    />
                </Group>
            </Card>

            {/* Content based on view mode */}
            {viewMode === 'overview' && (
                <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="xs" radius="md" p="md" withBorder h="100%">
                            <Text fw={500} mb="md">Alocação Média por Equipe</Text>
                            <Stack gap="xs">
                                {teams.slice(0, 8).map(team => (
                                    <div key={team.id}>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">{team.name}</Text>
                                            <Text size="sm" fw={500}>
                                                {team.memberCount} membros • {team.totalAllocation.toFixed(1)} FTE
                                            </Text>
                                        </Group>
                                        <Progress
                                            value={Math.min((team.totalAllocation / Math.max(team.memberCount, 1)) * 100, 100)}
                                            color={getAllocationColor(team.totalAllocation / Math.max(team.memberCount, 1))}
                                            size="sm"
                                        />
                                    </div>
                                ))}
                            </Stack>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Card shadow="xs" radius="md" p="md" withBorder h="100%">
                            <Text fw={500} mb="md">Alertas de Capacidade</Text>
                            <Stack gap="sm">
                                {userAllocations
                                    .filter(u => u.totalAllocation > 1 || u.totalAllocation < 0.25)
                                    .slice(0, 6)
                                    .map(user => (
                                        <Paper key={user.userId} p="sm" withBorder radius="sm">
                                            <Group justify="space-between">
                                                <Group gap="sm">
                                                    <Avatar src={user.userAvatar} radius="xl" size="sm" />
                                                    <div>
                                                        <Text size="sm" fw={500}>{user.userName}</Text>
                                                        <Text size="xs" c="dimmed">
                                                            {user.teams.length} equipe(s)
                                                        </Text>
                                                    </div>
                                                </Group>
                                                <Badge
                                                    color={getAllocationColor(user.totalAllocation)}
                                                    variant="light"
                                                >
                                                    {formatAllocation(user.totalAllocation)}
                                                </Badge>
                                            </Group>
                                        </Paper>
                                    ))}
                                {userAllocations.filter(u => u.totalAllocation > 1 || u.totalAllocation < 0.25).length === 0 && (
                                    <Text size="sm" c="dimmed" ta="center" py="xl">
                                        <IconCheck size={20} style={{ marginRight: 8 }} />
                                        Nenhum alerta de capacidade
                                    </Text>
                                )}
                            </Stack>
                        </Card>
                    </Grid.Col>
                </Grid>
            )}

            {viewMode === 'teams' && (
                <Card shadow="xs" radius="md" p="md" withBorder>
                    <Table verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Equipe</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Membros</Table.Th>
                                <Table.Th>FTE Total</Table.Th>
                                <Table.Th>Alocação Média</Table.Th>
                                <Table.Th>Capacidade</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredTeams.map(team => {
                                const avgAlloc = team.memberCount > 0
                                    ? team.totalAllocation / team.memberCount
                                    : 0;
                                return (
                                    <Table.Tr key={team.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <ThemeIcon size="sm" variant="light" color="blue">
                                                    <IconUsers size={14} />
                                                </ThemeIcon>
                                                <Text fw={500}>{team.name}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="sm" variant="light">
                                                {team.teamType}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>{team.memberCount}</Table.Td>
                                        <Table.Td>{team.totalAllocation.toFixed(1)}</Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={getAllocationColor(avgAlloc)}
                                                variant="light"
                                            >
                                                {formatAllocation(avgAlloc)}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td w={150}>
                                            <Progress
                                                value={Math.min(avgAlloc * 100, 100)}
                                                color={getAllocationColor(avgAlloc)}
                                                size="sm"
                                            />
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {viewMode === 'members' && (
                <Card shadow="xs" radius="md" p="md" withBorder>
                    <Table verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Colaborador</Table.Th>
                                <Table.Th>Equipes</Table.Th>
                                <Table.Th>Alocação Total</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Distribuição</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {userAllocations
                                .filter(u => !selectedTeam || u.teams.some(t => t.teamId === selectedTeam))
                                .map(user => (
                                    <Table.Tr key={user.userId}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar src={user.userAvatar} radius="xl" size="sm" />
                                                <div>
                                                    <Text size="sm" fw={500}>{user.userName}</Text>
                                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                                        {user.userEmail}
                                                    </Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {user.teams.slice(0, 2).map((t, i) => (
                                                    <Tooltip key={i} label={`${t.positionName} - ${formatAllocation(t.allocation)}`}>
                                                        <Badge size="xs" variant="outline">
                                                            {t.teamName.substring(0, 12)}
                                                        </Badge>
                                                    </Tooltip>
                                                ))}
                                                {user.teams.length > 2 && (
                                                    <Badge size="xs" variant="light">
                                                        +{user.teams.length - 2}
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={getAllocationColor(user.totalAllocation)}
                                                variant="light"
                                                size="lg"
                                            >
                                                {formatAllocation(user.totalAllocation)}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {user.totalAllocation > 1 && (
                                                <Badge color="violet" variant="dot">Sobre-alocado</Badge>
                                            )}
                                            {user.totalAllocation >= 0.8 && user.totalAllocation <= 1 && (
                                                <Badge color="green" variant="dot">Ideal</Badge>
                                            )}
                                            {user.totalAllocation >= 0.5 && user.totalAllocation < 0.8 && (
                                                <Badge color="yellow" variant="dot">Disponível</Badge>
                                            )}
                                            {user.totalAllocation < 0.5 && (
                                                <Badge color="orange" variant="dot">Subutilizado</Badge>
                                            )}
                                        </Table.Td>
                                        <Table.Td w={180}>
                                            <Stack gap={2}>
                                                {user.teams.map((t, i) => (
                                                    <Progress
                                                        key={i}
                                                        value={t.allocation * 100}
                                                        color={getAllocationColor(user.totalAllocation)}
                                                        size={6}
                                                    />
                                                ))}
                                            </Stack>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            )}

            {/* Legend */}
            <Card shadow="xs" radius="md" p="sm" withBorder>
                <Group gap="lg">
                    <Text size="sm" fw={500}>Legenda:</Text>
                    <Group gap="md">
                        <Badge color="green" variant="light" size="sm">80-100% Ideal</Badge>
                        <Badge color="yellow" variant="light" size="sm">50-79% Disponível</Badge>
                        <Badge color="orange" variant="light" size="sm">25-49% Baixo</Badge>
                        <Badge color="red" variant="light" size="sm">&lt;25% Mínimo</Badge>
                        <Badge color="violet" variant="light" size="sm">&gt;100% Sobre-alocado</Badge>
                    </Group>
                </Group>
            </Card>
        </Stack>
    );
}

