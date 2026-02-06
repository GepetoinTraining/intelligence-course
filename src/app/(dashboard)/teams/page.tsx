'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, TextInput, Loader, Center,
    ThemeIcon, Avatar, ActionIcon, Tooltip, Modal,
    Select, Textarea, ColorSwatch, SegmentedControl,
    Accordion, Table, Menu, Skeleton, Divider, Tabs, Box
} from '@mantine/core';
import {
    IconUsers, IconSearch, IconPlus, IconEdit,
    IconTrash, IconUser, IconFolder, IconCheck,
    IconChevronRight, IconDotsVertical, IconUsersGroup,
    IconBuildingCommunity, IconTarget, IconRocket,
    IconSettings, IconShield, IconHierarchy, IconRefresh,
    IconChevronDown, IconZoomIn, IconZoomOut, IconArrowsMaximize,
    IconCrown, IconChartBar
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Team {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    teamType: string;
    parentTeamId: string | null;
    icon: string;
    color: string;
    isActive: boolean;
    memberCount: number;
    createdAt: number;
}

interface Position {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    level: number;
    positionType: string;
    icon: string;
    color: string;
    canManage: boolean;
    isLeadership: boolean;
}

const TEAM_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    department: { label: 'Departamento', icon: <IconBuildingCommunity size={16} />, color: 'blue' },
    squad: { label: 'Squad', icon: <IconUsersGroup size={16} />, color: 'violet' },
    chapter: { label: 'Chapter', icon: <IconUsers size={16} />, color: 'cyan' },
    guild: { label: 'Guilda', icon: <IconShield size={16} />, color: 'orange' },
    tribe: { label: 'Tribo', icon: <IconHierarchy size={16} />, color: 'grape' },
    project: { label: 'Projeto', icon: <IconTarget size={16} />, color: 'green' },
    committee: { label: 'Comitê', icon: <IconFolder size={16} />, color: 'yellow' },
    other: { label: 'Outro', icon: <IconUsers size={16} />, color: 'gray' },
};

const POSITION_TYPES: Record<string, { label: string; color: string }> = {
    leadership: { label: 'Liderança', color: 'yellow' },
    management: { label: 'Gestão', color: 'blue' },
    specialist: { label: 'Especialista', color: 'violet' },
    operational: { label: 'Operacional', color: 'green' },
    support: { label: 'Suporte', color: 'cyan' },
    intern: { label: 'Estagiário', color: 'gray' },
    contractor: { label: 'Terceiro', color: 'orange' },
    other: { label: 'Outro', color: 'gray' },
};

const COLORS = [
    'red', 'pink', 'grape', 'violet', 'indigo', 'blue',
    'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'
];

// ============ ORG CHART COMPONENT ============

interface TeamMember {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    positionName: string;
    positionLevel: number;
    memberRole: string;
    allocation: number;
    isActive: boolean;
}

interface TeamWithMembers extends Team {
    members?: TeamMember[];
}

interface TreeNode {
    id: string;
    name: string;
    type: string;
    color: string;
    members: TeamMember[];
    children: TreeNode[];
    x: number;
    y: number;
    width: number;
    height: number;
    collapsed: boolean;
}

const NODE_WIDTH = 260;
const NODE_MIN_HEIGHT = 70;
const MEMBER_HEIGHT = 44;
const HORIZONTAL_GAP = 30;
const VERTICAL_GAP = 50;

const TEAM_COLORS_MAP: Record<string, string> = {
    department: '#228be6',
    squad: '#7950f2',
    chapter: '#15aabf',
    guild: '#fd7e14',
    tribe: '#be4bdb',
    project: '#40c057',
    committee: '#fab005',
    other: '#868e96',
};

const ROLE_ICONS_MAP: Record<string, React.ReactNode> = {
    owner: <IconCrown size={12} />,
    lead: <IconShield size={12} />,
    member: <IconUser size={12} />,
    guest: <IconUser size={12} />,
};

function OrgChartView({ teams, onRefresh }: { teams: Team[]; onRefresh: () => void }) {
    const [zoom, setZoom] = useState(0.85);
    const [pan, setPan] = useState({ x: 40, y: 30 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [teamsWithMembers, setTeamsWithMembers] = useState<TeamWithMembers[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Fetch teams with members
    useEffect(() => {
        const fetchMembers = async () => {
            setLoadingMembers(true);
            try {
                const res = await fetch('/api/teams?includeMembers=true');
                if (res.ok) {
                    const data = await res.json();
                    setTeamsWithMembers(data.data || []);
                }
            } catch (e) {
                console.error('Error fetching members:', e);
                setTeamsWithMembers(teams as TeamWithMembers[]);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, [teams]);

    // Build hierarchical tree
    const buildTree = useCallback((teamList: TeamWithMembers[]): TreeNode[] => {
        const rootTeams = teamList.filter(t => !t.parentTeamId);

        const buildNode = (team: TeamWithMembers): TreeNode => {
            const isCollapsed = collapsedNodes.has(team.id);
            const childTeams = teamList.filter(t => t.parentTeamId === team.id);
            const members = team.members || [];
            const displayMembers = isCollapsed ? [] : members.slice(0, 3);

            return {
                id: team.id,
                name: team.name,
                type: team.teamType,
                color: TEAM_COLORS_MAP[team.teamType] || TEAM_COLORS_MAP.other,
                members: members,
                children: isCollapsed ? [] : childTeams.map(buildNode),
                x: 0,
                y: 0,
                width: NODE_WIDTH,
                height: NODE_MIN_HEIGHT + displayMembers.length * MEMBER_HEIGHT,
                collapsed: isCollapsed,
            };
        };

        return rootTeams.map(buildNode);
    }, [collapsedNodes]);

    // Layout tree positions
    const layoutTree = useCallback((nodes: TreeNode[], startX = 0, startY = 0): { nodes: TreeNode[]; width: number } => {
        if (nodes.length === 0) return { nodes: [], width: 0 };

        let currentX = startX;
        const positioned: TreeNode[] = [];

        nodes.forEach(node => {
            const { nodes: kids, width: childW } = layoutTree(node.children, currentX, startY + node.height + VERTICAL_GAP);
            const nodeWidth = Math.max(node.width, childW);
            const nodeX = childW > 0 ? currentX + (childW - node.width) / 2 : currentX;

            positioned.push({ ...node, x: nodeX, y: startY, children: kids });
            currentX += nodeWidth + HORIZONTAL_GAP;
        });

        return { nodes: positioned, width: currentX - startX - HORIZONTAL_GAP };
    }, []);

    const { positionedTree } = useMemo(() => {
        const tree = buildTree(teamsWithMembers);
        const { nodes } = layoutTree(tree);
        return { positionedTree: nodes };
    }, [teamsWithMembers, buildTree, layoutTree]);

    const toggleCollapse = (nodeId: string) => {
        setCollapsedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    const renderNode = (node: TreeNode): React.ReactNode => {
        const hasChildren = teamsWithMembers.some(t => t.parentTeamId === node.id);
        const displayMembers = node.collapsed ? [] : node.members.slice(0, 3);
        const extra = node.members.length - displayMembers.length;

        return (
            <g key={node.id}>
                <foreignObject x={node.x} y={node.y} width={node.width} height={node.height}>
                    <div
                        style={{
                            background: 'var(--mantine-color-body)',
                            border: `2px solid ${node.color}`,
                            borderRadius: 10,
                            padding: 10,
                            height: '100%',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            cursor: hasChildren ? 'pointer' : 'default',
                        }}
                        onClick={() => hasChildren && toggleCollapse(node.id)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: displayMembers.length > 0 ? 8 : 0 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 6,
                                background: node.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <IconUsers size={14} color="white" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {node.name}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--mantine-color-dimmed)' }}>
                                    {node.type} • {node.members.length} membros
                                </div>
                            </div>
                            {hasChildren && (
                                <div style={{ color: 'var(--mantine-color-dimmed)' }}>
                                    {node.collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
                                </div>
                            )}
                        </div>
                        {displayMembers.map(m => (
                            <div key={m.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 6px', background: 'var(--mantine-color-dark-6)',
                                borderRadius: 5, marginBottom: 4,
                            }}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'var(--mantine-color-blue-6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 600, color: 'white',
                                }}>
                                    {m.userName?.[0] || '?'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {m.userName}
                                    </div>
                                    <div style={{ fontSize: 9, color: 'var(--mantine-color-dimmed)' }}>{m.positionName}</div>
                                </div>
                                <div style={{ color: node.color }}>{ROLE_ICONS_MAP[m.memberRole] || <IconUser size={12} />}</div>
                            </div>
                        ))}
                        {extra > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--mantine-color-dimmed)', textAlign: 'center', paddingTop: 2 }}>
                                +{extra} mais
                            </div>
                        )}
                    </div>
                </foreignObject>
                {node.children.map(child => {
                    const sx = node.x + node.width / 2, sy = node.y + node.height;
                    const ex = child.x + child.width / 2, ey = child.y;
                    const my = sy + (ey - sy) / 2;
                    return (
                        <path
                            key={`e-${node.id}-${child.id}`}
                            d={`M ${sx} ${sy} L ${sx} ${my} L ${ex} ${my} L ${ex} ${ey}`}
                            fill="none" stroke="var(--mantine-color-dark-4)" strokeWidth={2} strokeDasharray="4,4"
                        />
                    );
                })}
                {node.children.map(renderNode)}
            </g>
        );
    };

    if (loadingMembers) {
        return (
            <Center py="xl">
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Carregando organograma...</Text>
                </Stack>
            </Center>
        );
    }

    return (
        <Stack gap="md">
            <Paper shadow="xs" radius="md" p="xs" withBorder>
                <Group justify="space-between">
                    <Group gap="xs">
                        <Tooltip label="Zoom Out"><ActionIcon variant="light" onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))}><IconZoomOut size={18} /></ActionIcon></Tooltip>
                        <Text size="sm" w={50} ta="center">{Math.round(zoom * 100)}%</Text>
                        <Tooltip label="Zoom In"><ActionIcon variant="light" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}><IconZoomIn size={18} /></ActionIcon></Tooltip>
                        <Tooltip label="Reset"><ActionIcon variant="light" onClick={() => { setZoom(0.85); setPan({ x: 40, y: 30 }); }}><IconArrowsMaximize size={18} /></ActionIcon></Tooltip>
                    </Group>
                    <Group gap="xs">
                        {Object.entries(TEAM_COLORS_MAP).slice(0, 5).map(([t, c]) => (
                            <Group key={t} gap={4}><div style={{ width: 10, height: 10, borderRadius: 2, background: c }} /><Text size="xs" c="dimmed" tt="capitalize">{t}</Text></Group>
                        ))}
                    </Group>
                </Group>
            </Paper>
            <Card
                shadow="xs" radius="md" p={0} withBorder
                style={{ minHeight: 450, overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            >
                {positionedTree.length === 0 ? (
                    <Center h="100%" py="xl">
                        <Stack align="center" gap="md">
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray"><IconHierarchy size={32} /></ThemeIcon>
                            <Title order={4}>Nenhuma equipe encontrada</Title>
                            <Text c="dimmed">Crie equipes na aba "Equipes" para visualizar o organograma</Text>
                        </Stack>
                    </Center>
                ) : (
                    <svg width="100%" height="100%" style={{ minHeight: 450 }}>
                        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                            {positionedTree.map(renderNode)}
                        </g>
                    </svg>
                )}
            </Card>
        </Stack>
    );
}

// ============ MAIN TEAMS PAGE ============

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<string | null>('teams');

    // Modal states
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [positionModalOpen, setPositionModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);

    // Form states
    const [teamForm, setTeamForm] = useState({
        name: '',
        description: '',
        teamType: 'squad',
        parentTeamId: '',
        color: 'blue',
    });
    const [positionForm, setPositionForm] = useState({
        name: '',
        description: '',
        level: 5,
        positionType: 'specialist',
        color: 'gray',
        canManage: false,
        isLeadership: false,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [teamsRes, positionsRes] = await Promise.all([
                fetch('/api/teams'),
                fetch('/api/positions'),
            ]);

            if (teamsRes.ok) {
                const data = await teamsRes.json();
                setTeams(data.data || []);
            }
            if (positionsRes.ok) {
                const data = await positionsRes.json();
                setPositions(data.data || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!teamForm.name.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: teamForm.name,
                    description: teamForm.description,
                    teamType: teamForm.teamType,
                    parentTeamId: teamForm.parentTeamId || null,
                    color: teamForm.color,
                }),
            });
            if (res.ok) {
                loadData();
                setTeamModalOpen(false);
                setTeamForm({ name: '', description: '', teamType: 'squad', parentTeamId: '', color: 'blue' });
            }
        } catch (error) {
            console.error('Error creating team:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCreatePosition = async () => {
        if (!positionForm.name.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(positionForm),
            });
            if (res.ok) {
                loadData();
                setPositionModalOpen(false);
                setPositionForm({
                    name: '',
                    description: '',
                    level: 5,
                    positionType: 'specialist',
                    color: 'gray',
                    canManage: false,
                    isLeadership: false,
                });
            }
        } catch (error) {
            console.error('Error creating position:', error);
        } finally {
            setSaving(false);
        }
    };

    const seedActions = async () => {
        try {
            const res = await fetch('/api/actions', { method: 'PUT' });
            if (res.ok) {
                const data = await res.json();
                alert(`Ações criadas: ${data.created}, ignoradas: ${data.skipped}`);
            }
        } catch (error) {
            console.error('Error seeding actions:', error);
        }
    };

    // Filter teams
    const filteredTeams = teams.filter(t =>
        !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Build team hierarchy
    const rootTeams = filteredTeams.filter(t => !t.parentTeamId);
    const getChildTeams = (parentId: string) => filteredTeams.filter(t => t.parentTeamId === parentId);

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>👥 Equipes & Funções</Title>
                        <Text c="dimmed">Carregando...</Text>
                    </div>
                </Group>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} height={120} radius="md" />
                    ))}
                </SimpleGrid>
            </Stack>
        );
    }

    return (
        <Stack gap="xl">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>👥 Equipes & Funções</Title>
                    <Text c="dimmed">Organize sua estrutura organizacional</Text>
                </div>
                <Group>
                    <Button
                        variant="subtle"
                        component={Link}
                        href="/teams/permissions"
                        leftSection={<IconShield size={16} />}
                    >
                        Permissões
                    </Button>
                    <Button
                        variant="subtle"
                        component={Link}
                        href="/teams/capacity"
                        leftSection={<IconChartBar size={16} />}
                    >
                        Capacidade
                    </Button>
                    <Button
                        variant="subtle"
                        component={Link}
                        href="/teams/reporting"
                        leftSection={<IconHierarchy size={16} />}
                    >
                        Estrutura
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={seedActions}
                    >
                        Seed Actions
                    </Button>
                    <Button
                        variant="light"
                        leftSection={<IconShield size={16} />}
                        onClick={() => setPositionModalOpen(true)}
                    >
                        Nova Função
                    </Button>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setTeamModalOpen(true)}
                    >
                        Nova Equipe
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
                            <Text size="xl" fw={700}>{teams.length}</Text>
                            <Text size="sm" c="dimmed">Equipes</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="violet">
                            <IconShield size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{positions.length}</Text>
                            <Text size="sm" c="dimmed">Funções</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="green">
                            <IconUser size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{teams.reduce((sum, t) => sum + t.memberCount, 0)}</Text>
                            <Text size="sm" c="dimmed">Membros</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="orange">
                            <IconHierarchy size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{teams.filter(t => t.parentTeamId).length}</Text>
                            <Text size="sm" c="dimmed">Sub-equipes</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="teams" leftSection={<IconUsers size={16} />}>
                        Equipes
                    </Tabs.Tab>
                    <Tabs.Tab value="orgchart" leftSection={<IconHierarchy size={16} />}>
                        Organograma
                    </Tabs.Tab>
                    <Tabs.Tab value="positions" leftSection={<IconShield size={16} />}>
                        Funções
                    </Tabs.Tab>
                    <Tabs.Tab value="permissions" leftSection={<IconSettings size={16} />}>
                        Permissões
                    </Tabs.Tab>
                </Tabs.List>

                {/* Teams Tab */}
                <Tabs.Panel value="teams" pt="md">
                    <Stack gap="md">
                        <TextInput
                            placeholder="Buscar equipes..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            w={300}
                        />

                        {rootTeams.length === 0 ? (
                            <Card shadow="xs" radius="md" p="xl" withBorder>
                                <Center py="xl">
                                    <Stack align="center" gap="md">
                                        <ThemeIcon size={64} radius="xl" variant="light" color="blue">
                                            <IconUsers size={32} />
                                        </ThemeIcon>
                                        <Title order={4}>Nenhuma equipe criada</Title>
                                        <Text c="dimmed" ta="center">
                                            Comece criando sua primeira equipe
                                        </Text>
                                        <Button
                                            leftSection={<IconPlus size={16} />}
                                            onClick={() => setTeamModalOpen(true)}
                                        >
                                            Criar Equipe
                                        </Button>
                                    </Stack>
                                </Center>
                            </Card>
                        ) : (
                            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                                {rootTeams.map(team => {
                                    const typeConfig = TEAM_TYPES[team.teamType] || TEAM_TYPES.other;
                                    const childTeams = getChildTeams(team.id);

                                    return (
                                        <Card
                                            key={team.id}
                                            shadow="xs"
                                            radius="md"
                                            p="md"
                                            withBorder
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => router.push(`/teams/${team.id}`)}
                                        >
                                            <Group justify="space-between" mb="sm">
                                                <Group gap="sm">
                                                    <ThemeIcon size={40} radius="md" variant="light" color={team.color}>
                                                        {typeConfig.icon}
                                                    </ThemeIcon>
                                                    <div>
                                                        <Text fw={600}>{team.name}</Text>
                                                        <Badge size="xs" variant="light" color={typeConfig.color}>
                                                            {typeConfig.label}
                                                        </Badge>
                                                    </div>
                                                </Group>
                                                <Menu withinPortal>
                                                    <Menu.Target>
                                                        <ActionIcon variant="subtle" onClick={(e) => e.stopPropagation()}>
                                                            <IconDotsVertical size={16} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item leftSection={<IconEdit size={14} />}>
                                                            Editar
                                                        </Menu.Item>
                                                        <Menu.Item leftSection={<IconUser size={14} />}>
                                                            Gerenciar Membros
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
                                                            Arquivar
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>

                                            {team.description && (
                                                <Text size="sm" c="dimmed" lineClamp={2} mb="sm">
                                                    {team.description}
                                                </Text>
                                            )}

                                            <Divider my="sm" />

                                            <Group justify="space-between">
                                                <Group gap="xs">
                                                    <IconUser size={14} color="var(--mantine-color-dimmed)" />
                                                    <Text size="sm" c="dimmed">{team.memberCount} membros</Text>
                                                </Group>
                                                {childTeams.length > 0 && (
                                                    <Badge size="sm" variant="outline">
                                                        {childTeams.length} sub-equipes
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* Positions Tab */}
                <Tabs.Panel value="positions" pt="md">
                    <Stack gap="md">
                        {positions.length === 0 ? (
                            <Card shadow="xs" radius="md" p="xl" withBorder>
                                <Center py="xl">
                                    <Stack align="center" gap="md">
                                        <ThemeIcon size={64} radius="xl" variant="light" color="violet">
                                            <IconShield size={32} />
                                        </ThemeIcon>
                                        <Title order={4}>Nenhuma função criada</Title>
                                        <Text c="dimmed" ta="center">
                                            Crie funções para atribuir aos membros das equipes
                                        </Text>
                                        <Button
                                            leftSection={<IconPlus size={16} />}
                                            onClick={() => setPositionModalOpen(true)}
                                        >
                                            Criar Função
                                        </Button>
                                    </Stack>
                                </Center>
                            </Card>
                        ) : (
                            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                                {positions.map(position => {
                                    const typeConfig = POSITION_TYPES[position.positionType] || POSITION_TYPES.other;

                                    return (
                                        <Card key={position.id} shadow="xs" radius="md" p="md" withBorder>
                                            <Group justify="space-between" mb="sm">
                                                <Group gap="sm">
                                                    <ThemeIcon size={40} radius="md" variant="light" color={position.color}>
                                                        <IconUser size={18} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Text fw={600}>{position.name}</Text>
                                                        <Group gap={4}>
                                                            <Badge size="xs" variant="light" color={typeConfig.color}>
                                                                {typeConfig.label}
                                                            </Badge>
                                                            <Text size="xs" c="dimmed">
                                                                Nível {position.level}
                                                            </Text>
                                                        </Group>
                                                    </div>
                                                </Group>
                                            </Group>

                                            {position.description && (
                                                <Text size="sm" c="dimmed" lineClamp={2}>
                                                    {position.description}
                                                </Text>
                                            )}

                                            <Divider my="sm" />

                                            <Group gap="xs">
                                                {position.isLeadership && (
                                                    <Badge size="xs" color="yellow">Liderança</Badge>
                                                )}
                                                {position.canManage && (
                                                    <Badge size="xs" color="blue">Pode Gerenciar</Badge>
                                                )}
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* Org Chart Tab */}
                <Tabs.Panel value="orgchart" pt="md">
                    <OrgChartView teams={teams} onRefresh={loadData} />
                </Tabs.Panel>

                {/* Permissions Tab */}
                <Tabs.Panel value="permissions" pt="md">
                    <Card shadow="xs" radius="md" p="xl" withBorder>
                        <Center py="xl">
                            <Stack align="center" gap="md">
                                <ThemeIcon size={64} radius="xl" variant="light" color="orange">
                                    <IconSettings size={32} />
                                </ThemeIcon>
                                <Title order={4}>Gerenciador de Permissões</Title>
                                <Text c="dimmed" ta="center" maw={400}>
                                    Defina quais ações cada função pode realizar no sistema
                                </Text>
                                <Button
                                    component={Link}
                                    href="/teams/permissions"
                                    leftSection={<IconShield size={16} />}
                                >
                                    Gerenciar Permissões
                                </Button>
                            </Stack>
                        </Center>
                    </Card>
                </Tabs.Panel>
            </Tabs>

            {/* Create Team Modal */}
            <Modal
                opened={teamModalOpen}
                onClose={() => setTeamModalOpen(false)}
                title="Nova Equipe"
                size="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome da Equipe"
                        placeholder="Ex: Engineering Squad"
                        value={teamForm.name}
                        onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva o propósito desta equipe..."
                        value={teamForm.description}
                        onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                        minRows={2}
                    />
                    <Select
                        label="Tipo de Equipe"
                        data={Object.entries(TEAM_TYPES).map(([value, config]) => ({
                            value,
                            label: config.label,
                        }))}
                        value={teamForm.teamType}
                        onChange={(v) => setTeamForm({ ...teamForm, teamType: v || 'squad' })}
                    />
                    <Select
                        label="Equipe Pai (opcional)"
                        placeholder="Selecione uma equipe pai"
                        data={teams.map(t => ({ value: t.id, label: t.name }))}
                        value={teamForm.parentTeamId}
                        onChange={(v) => setTeamForm({ ...teamForm, parentTeamId: v || '' })}
                        clearable
                    />
                    <div>
                        <Text size="sm" fw={500} mb="xs">Cor</Text>
                        <Group gap="xs">
                            {COLORS.map(color => (
                                <ColorSwatch
                                    key={color}
                                    color={`var(--mantine-color-${color}-6)`}
                                    onClick={() => setTeamForm({ ...teamForm, color })}
                                    style={{
                                        cursor: 'pointer',
                                        border: teamForm.color === color ? '2px solid var(--mantine-color-dark-6)' : undefined,
                                    }}
                                />
                            ))}
                        </Group>
                    </div>
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setTeamModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateTeam} loading={saving}>
                            Criar Equipe
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Create Position Modal */}
            <Modal
                opened={positionModalOpen}
                onClose={() => setPositionModalOpen(false)}
                title="Nova Função"
                size="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome da Função"
                        placeholder="Ex: Tech Lead"
                        value={positionForm.name}
                        onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                        required
                    />
                    <Textarea
                        label="Descrição"
                        placeholder="Descreva as responsabilidades desta função..."
                        value={positionForm.description}
                        onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                        minRows={2}
                    />
                    <Select
                        label="Tipo"
                        data={Object.entries(POSITION_TYPES).map(([value, config]) => ({
                            value,
                            label: config.label,
                        }))}
                        value={positionForm.positionType}
                        onChange={(v) => setPositionForm({ ...positionForm, positionType: v || 'specialist' })}
                    />
                    <Select
                        label="Nível (1 = mais alto)"
                        data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({
                            value: n.toString(),
                            label: `Nível ${n}`,
                        }))}
                        value={positionForm.level.toString()}
                        onChange={(v) => setPositionForm({ ...positionForm, level: parseInt(v || '5') })}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={() => setPositionModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreatePosition} loading={saving}>
                            Criar Função
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

