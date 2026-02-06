'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, ThemeIcon, Skeleton, Select,
    Avatar, Tooltip, Box, ActionIcon, Loader
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconUsers, IconArrowLeft, IconRefresh, IconDownload,
    IconArrowUp, IconArrowDown, IconUser, IconCrown,
    IconZoomIn, IconZoomOut
} from '@tabler/icons-react';
import Link from 'next/link';

interface ReportingMember {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    positionName: string;
    positionLevel: number;
    memberRole: string;
    teamName: string;
    teamId: string;
    reportsToMemberId: string | null;
}

interface ReportingNode extends ReportingMember {
    directReports: ReportingNode[];
    depth: number;
}

const CARD_WIDTH = 200;
const CARD_HEIGHT = 100;
const HORIZONTAL_GAP = 30;
const VERTICAL_GAP = 60;

export default function ReportingStructurePage() {
    const [members, setMembers] = useState<ReportingMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/teams?includeMembers=true');
            if (res.ok) {
                const data = await res.json();
                const allTeams = data.data || [];

                // Extract team list for filter
                setTeams(allTeams.map((t: any) => ({ id: t.id, name: t.name })));

                // Flatten members with team context
                const allMembers: ReportingMember[] = [];
                allTeams.forEach((team: any) => {
                    team.members?.forEach((m: any) => {
                        allMembers.push({
                            ...m,
                            teamName: team.name,
                            teamId: team.id,
                        });
                    });
                });
                setMembers(allMembers);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível carregar os dados',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    // Build reporting tree
    const reportingTree = useMemo(() => {
        const filtered = selectedTeam
            ? members.filter(m => m.teamId === selectedTeam)
            : members;

        // Build lookup
        const byId = new Map<string, ReportingNode>();
        filtered.forEach(m => {
            byId.set(m.id, { ...m, directReports: [], depth: 0 });
        });

        // Find root nodes (no reportsToMemberId or not in filtered set)
        const roots: ReportingNode[] = [];

        byId.forEach((node, id) => {
            if (!node.reportsToMemberId || !byId.has(node.reportsToMemberId)) {
                roots.push(node);
            } else {
                const manager = byId.get(node.reportsToMemberId);
                if (manager) {
                    manager.directReports.push(node);
                }
            }
        });

        // Calculate depths
        function setDepth(node: ReportingNode, depth: number) {
            node.depth = depth;
            node.directReports.forEach(child => setDepth(child, depth + 1));
        }
        roots.forEach(root => setDepth(root, 0));

        // Sort by position level (highest first)
        roots.sort((a, b) => b.positionLevel - a.positionLevel);

        return roots;
    }, [members, selectedTeam]);

    // Calculate SVG dimensions
    const svgDimensions = useMemo(() => {
        let maxWidth = 0;
        let maxDepth = 0;

        function countNodes(node: ReportingNode, depth: number): number {
            if (node.directReports.length === 0) {
                maxDepth = Math.max(maxDepth, depth);
                return 1;
            }
            const childWidth = node.directReports.reduce(
                (sum, child) => sum + countNodes(child, depth + 1), 0
            );
            maxDepth = Math.max(maxDepth, depth);
            return childWidth;
        }

        const totalLeaves = reportingTree.reduce((sum, root) => sum + countNodes(root, 0), 0);
        maxWidth = Math.max(totalLeaves, reportingTree.length);

        return {
            width: Math.max(800, maxWidth * (CARD_WIDTH + HORIZONTAL_GAP) + 100),
            height: Math.max(400, (maxDepth + 1) * (CARD_HEIGHT + VERTICAL_GAP) + 100),
        };
    }, [reportingTree]);

    // Render node
    const renderNode = useCallback((node: ReportingNode, x: number, y: number, parentX?: number, parentY?: number) => {
        const elements: React.ReactNode[] = [];

        // Connection line to parent
        if (parentX !== undefined && parentY !== undefined) {
            elements.push(
                <line
                    key={`line-${node.id}`}
                    x1={parentX + CARD_WIDTH / 2}
                    y1={parentY + CARD_HEIGHT}
                    x2={x + CARD_WIDTH / 2}
                    y2={y}
                    stroke="var(--mantine-color-gray-5)"
                    strokeWidth={2}
                />
            );
        }

        // Node card
        const isLeader = node.memberRole === 'owner' || node.memberRole === 'lead';
        elements.push(
            <foreignObject
                key={`node-${node.id}`}
                x={x}
                y={y}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
            >
                <Paper
                    shadow="sm"
                    p="xs"
                    radius="md"
                    withBorder
                    style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        background: isLeader
                            ? 'linear-gradient(135deg, var(--mantine-color-yellow-1), var(--mantine-color-orange-1))'
                            : 'var(--mantine-color-body)',
                        cursor: 'pointer',
                    }}
                >
                    <Group gap="xs" wrap="nowrap">
                        <Avatar
                            src={node.userAvatar}
                            size="sm"
                            radius="xl"
                            color={isLeader ? 'yellow' : 'blue'}
                        >
                            {isLeader ? <IconCrown size={14} /> : <IconUser size={14} />}
                        </Avatar>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <Text size="xs" fw={600} lineClamp={1}>
                                {node.userName}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                                {node.positionName}
                            </Text>
                        </div>
                    </Group>
                    {node.directReports.length > 0 && (
                        <Badge size="xs" variant="light" color="blue" mt={4}>
                            {node.directReports.length} diretos
                        </Badge>
                    )}
                </Paper>
            </foreignObject>
        );

        // Render child reports
        if (node.directReports.length > 0) {
            const totalWidth = node.directReports.length * (CARD_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
            let childX = x + CARD_WIDTH / 2 - totalWidth / 2;
            const childY = y + CARD_HEIGHT + VERTICAL_GAP;

            node.directReports.forEach(child => {
                elements.push(...renderNode(child, childX, childY, x, y));
                childX += CARD_WIDTH + HORIZONTAL_GAP;
            });
        }

        return elements;
    }, []);

    // Calculate all node positions
    const renderedNodes = useMemo(() => {
        const elements: React.ReactNode[] = [];
        let offsetX = 50;

        function getNodeWidth(node: ReportingNode): number {
            if (node.directReports.length === 0) return CARD_WIDTH + HORIZONTAL_GAP;
            return node.directReports.reduce((sum, child) => sum + getNodeWidth(child), 0);
        }

        reportingTree.forEach(root => {
            const width = getNodeWidth(root);
            const x = offsetX + width / 2 - CARD_WIDTH / 2;
            elements.push(...renderNode(root, x, 50));
            offsetX += width;
        });

        return elements;
    }, [reportingTree, renderNode]);

    // Statistics
    const stats = useMemo(() => {
        const filtered = selectedTeam
            ? members.filter(m => m.teamId === selectedTeam)
            : members;

        const managers = filtered.filter(m =>
            filtered.some(other => other.reportsToMemberId === m.id)
        );

        const maxSpan = managers.reduce((max, manager) => {
            const reports = filtered.filter(m => m.reportsToMemberId === manager.id);
            return Math.max(max, reports.length);
        }, 0);

        let maxDepth = 0;
        function getDepth(memberId: string, depth: number): number {
            const reports = filtered.filter(m => m.reportsToMemberId === memberId);
            if (reports.length === 0) return depth;
            return Math.max(...reports.map(r => getDepth(r.id, depth + 1)));
        }
        reportingTree.forEach(root => {
            maxDepth = Math.max(maxDepth, getDepth(root.id, 1));
        });

        return {
            totalMembers: filtered.length,
            managersCount: managers.length,
            maxSpan,
            levels: maxDepth,
        };
    }, [members, selectedTeam, reportingTree]);

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>📊 Estrutura de Reporte</Title>
                        <Text c="dimmed">Carregando...</Text>
                    </div>
                </Group>
                <Skeleton height={400} radius="md" />
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>📊 Estrutura de Reporte</Title>
                    <Text c="dimmed">Visualize quem reporta a quem na organização</Text>
                </div>
                <Group>
                    <ActionIcon variant="light" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                        <IconZoomOut size={16} />
                    </ActionIcon>
                    <Text size="sm" fw={500}>{Math.round(zoom * 100)}%</Text>
                    <ActionIcon variant="light" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
                        <IconZoomIn size={16} />
                    </ActionIcon>
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
                        Voltar
                    </Button>
                </Group>
            </Group>

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="blue">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.totalMembers}</Text>
                            <Text size="sm" c="dimmed">Total</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="violet">
                            <IconCrown size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.managersCount}</Text>
                            <Text size="sm" c="dimmed">Gestores</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="green">
                            <IconArrowDown size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.maxSpan}</Text>
                            <Text size="sm" c="dimmed">Maior Span</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="orange">
                            <IconArrowUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{stats.levels}</Text>
                            <Text size="sm" c="dimmed">Níveis</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Controls */}
            <Card shadow="xs" radius="md" p="md" withBorder>
                <Group>
                    <Select
                        placeholder="Filtrar por equipe..."
                        data={teams.map(t => ({ value: t.id, label: t.name }))}
                        value={selectedTeam}
                        onChange={setSelectedTeam}
                        clearable
                        w={250}
                    />
                </Group>
            </Card>

            {/* Diagram */}
            <Card shadow="xs" radius="md" p="md" withBorder style={{ overflow: 'auto' }}>
                {reportingTree.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        Nenhuma estrutura de reporte encontrada.
                        Configure os campos "reporta a" nos membros para visualizar.
                    </Text>
                ) : (
                    <Box style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        minHeight: svgDimensions.height * zoom
                    }}>
                        <svg
                            width={svgDimensions.width}
                            height={svgDimensions.height}
                            style={{ display: 'block' }}
                        >
                            {renderedNodes}
                        </svg>
                    </Box>
                )}
            </Card>

            {/* Legend */}
            <Card shadow="xs" radius="md" p="sm" withBorder>
                <Group gap="lg">
                    <Text size="sm" fw={500}>Legenda:</Text>
                    <Group gap="md">
                        <Group gap={4}>
                            <Box
                                w={20}
                                h={20}
                                style={{
                                    background: 'linear-gradient(135deg, var(--mantine-color-yellow-1), var(--mantine-color-orange-1))',
                                    borderRadius: 4,
                                    border: '1px solid var(--mantine-color-gray-4)'
                                }}
                            />
                            <Text size="sm">Liderança</Text>
                        </Group>
                        <Group gap={4}>
                            <Box
                                w={20}
                                h={20}
                                style={{
                                    background: 'var(--mantine-color-body)',
                                    borderRadius: 4,
                                    border: '1px solid var(--mantine-color-gray-4)'
                                }}
                            />
                            <Text size="sm">Membro</Text>
                        </Group>
                        <Group gap={4}>
                            <Box w={20} h={2} bg="gray.5" />
                            <Text size="sm">Linha de reporte</Text>
                        </Group>
                    </Group>
                </Group>
            </Card>
        </Stack>
    );
}

