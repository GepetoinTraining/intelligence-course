'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, Avatar, ActionIcon, Tooltip, Modal,
    Select, Textarea, ThemeIcon, Skeleton, Divider,
    Table, Menu, Breadcrumbs, Anchor, TextInput,
    NumberInput, SegmentedControl, Slider
} from '@mantine/core';
import {
    IconUsers, IconPlus, IconEdit, IconTrash, IconUser,
    IconArrowLeft, IconDotsVertical, IconCheck, IconX,
    IconMail, IconPhone, IconCrown, IconShield,
    IconBriefcase, IconCalendar, IconPercentage
} from '@tabler/icons-react';
import Link from 'next/link';

interface TeamMember {
    id: string;
    userId: string;
    positionId: string;
    memberRole: string;
    customTitle: string | null;
    employmentType: string;
    allocation: number;
    reportsToMemberId: string | null;
    isActive: boolean;
    startDate: number;
    endDate: number | null;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    positionName: string;
    positionLevel: number;
    positionType: string;
}

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
    settings: Record<string, any>;
    members: TeamMember[];
    childTeams: { id: string; name: string; slug: string; teamType: string; icon: string; color: string }[];
}

interface Position {
    id: string;
    name: string;
    slug: string;
    level: number;
}

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
}

const MEMBER_ROLES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    owner: { label: 'Dono', color: 'yellow', icon: <IconCrown size={14} /> },
    lead: { label: 'Líder', color: 'blue', icon: <IconShield size={14} /> },
    member: { label: 'Membro', color: 'green', icon: <IconUser size={14} /> },
    guest: { label: 'Convidado', color: 'gray', icon: <IconUser size={14} /> },
    observer: { label: 'Observador', color: 'gray', icon: <IconUser size={14} /> },
};

const EMPLOYMENT_TYPES: Record<string, string> = {
    full_time: 'Tempo Integral',
    part_time: 'Meio Período',
    contractor: 'Terceiro',
    intern: 'Estagiário',
    volunteer: 'Voluntário',
};

export default function TeamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Add member modal
    const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('member');
    const [allocation, setAllocation] = useState<number>(100);
    const [customTitle, setCustomTitle] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTeam();
        loadPositions();
        loadUsers();
    }, [id]);

    const loadTeam = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${id}`);
            if (res.ok) {
                const data = await res.json();
                setTeam(data.data);
            }
        } catch (error) {
            console.error('Error loading team:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPositions = async () => {
        try {
            const res = await fetch('/api/positions');
            if (res.ok) {
                const data = await res.json();
                setPositions(data.data || []);
            }
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch('/api/users?limit=100');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.data || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserId || !selectedPositionId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/teams/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    positionId: selectedPositionId,
                    memberRole: selectedRole,
                    allocation: allocation / 100,
                    customTitle: customTitle || undefined,
                }),
            });
            if (res.ok) {
                loadTeam();
                setAddMemberModalOpen(false);
                resetMemberForm();
            }
        } catch (error) {
            console.error('Error adding member:', error);
        } finally {
            setSaving(false);
        }
    };

    const resetMemberForm = () => {
        setSelectedUserId(null);
        setSelectedPositionId(null);
        setSelectedRole('member');
        setAllocation(100);
        setCustomTitle('');
    };

    if (loading) {
        return (
            <Stack gap="xl">
                <Skeleton height={30} width={300} />
                <Skeleton height={100} />
                <Skeleton height={300} />
            </Stack>
        );
    }

    if (!team) {
        return (
            <Stack gap="xl" align="center" py="xl">
                <ThemeIcon size={64} radius="xl" variant="light" color="red">
                    <IconUsers size={32} />
                </ThemeIcon>
                <Title order={3}>Equipe não encontrada</Title>
                <Button
                    component={Link}
                    href="/teams"
                    leftSection={<IconArrowLeft size={16} />}
                    variant="light"
                >
                    Voltar para Equipes
                </Button>
            </Stack>
        );
    }

    // Get available users (not already in team)
    const existingMemberIds = new Set(team.members.map(m => m.userId));
    const availableUsers = users.filter(u => !existingMemberIds.has(u.id));

    // Sort members by position level
    const sortedMembers = [...team.members].sort((a, b) => a.positionLevel - b.positionLevel);

    return (
        <Stack gap="xl">
            {/* Breadcrumbs */}
            <Breadcrumbs>
                <Anchor component={Link} href="/teams" size="sm">
                    Equipes
                </Anchor>
                <Text size="sm" c="dimmed">{team.name}</Text>
            </Breadcrumbs>

            {/* Header */}
            <Group justify="space-between" align="flex-start">
                <Group gap="md">
                    <ThemeIcon size={60} radius="md" variant="light" color={team.color}>
                        <IconUsers size={30} />
                    </ThemeIcon>
                    <div>
                        <Title order={2}>{team.name}</Title>
                        {team.description && (
                            <Text c="dimmed" maw={500}>{team.description}</Text>
                        )}
                        <Group gap="xs" mt="xs">
                            <Badge variant="light" color={team.color}>
                                {team.teamType}
                            </Badge>
                            <Badge variant="outline">
                                {team.members.filter(m => m.isActive).length} membros
                            </Badge>
                        </Group>
                    </div>
                </Group>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconEdit size={16} />}
                    >
                        Editar
                    </Button>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setAddMemberModalOpen(true)}
                    >
                        Adicionar Membro
                    </Button>
                </Group>
            </Group>

            {/* Child Teams */}
            {team.childTeams.length > 0 && (
                <Card shadow="xs" radius="md" p="md" withBorder>
                    <Text fw={500} mb="sm">Sub-equipes</Text>
                    <Group gap="md">
                        {team.childTeams.map(child => (
                            <Button
                                key={child.id}
                                variant="light"
                                color={child.color}
                                leftSection={<IconUsers size={14} />}
                                onClick={() => router.push(`/teams/${child.id}`)}
                            >
                                {child.name}
                            </Button>
                        ))}
                    </Group>
                </Card>
            )}

            {/* Members Table */}
            <Card shadow="xs" radius="md" p="md" withBorder>
                <Group justify="space-between" mb="md">
                    <Text fw={500}>Membros da Equipe</Text>
                    <Badge variant="light">{team.members.length} total</Badge>
                </Group>

                {team.members.length === 0 ? (
                    <Stack align="center" py="xl">
                        <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                            <IconUsers size={24} />
                        </ThemeIcon>
                        <Text c="dimmed">Nenhum membro nesta equipe</Text>
                        <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setAddMemberModalOpen(true)}
                        >
                            Adicionar Membro
                        </Button>
                    </Stack>
                ) : (
                    <Table verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Membro</Table.Th>
                                <Table.Th>Função</Table.Th>
                                <Table.Th>Papel</Table.Th>
                                <Table.Th>Alocação</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {sortedMembers.map(member => {
                                const roleConfig = MEMBER_ROLES[member.memberRole] || MEMBER_ROLES.member;

                                return (
                                    <Table.Tr key={member.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar
                                                    src={member.userAvatar}
                                                    radius="xl"
                                                    size="sm"
                                                    color="blue"
                                                >
                                                    {member.userName?.[0] || '?'}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        {member.userName}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {member.userEmail}
                                                    </Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <Text size="sm">{member.customTitle || member.positionName}</Text>
                                                <Text size="xs" c="dimmed">Nv. {member.positionLevel}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                size="sm"
                                                variant="light"
                                                color={roleConfig.color}
                                                leftSection={roleConfig.icon}
                                            >
                                                {roleConfig.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                <IconPercentage size={14} color="var(--mantine-color-dimmed)" />
                                                <Text size="sm">{Math.round(member.allocation * 100)}%</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                size="sm"
                                                variant="dot"
                                                color={member.isActive ? 'green' : 'gray'}
                                            >
                                                {member.isActive ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu withinPortal>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle">
                                                        <IconDotsVertical size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<IconEdit size={14} />}>
                                                        Editar
                                                    </Menu.Item>
                                                    <Menu.Item leftSection={<IconShield size={14} />}>
                                                        Alterar Papel
                                                    </Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item color="red" leftSection={<IconX size={14} />}>
                                                        Remover
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>

            {/* Back */}
            <Button
                component={Link}
                href="/teams"
                leftSection={<IconArrowLeft size={16} />}
                variant="subtle"
            >
                Voltar para Equipes
            </Button>

            {/* Add Member Modal */}
            <Modal
                opened={addMemberModalOpen}
                onClose={() => setAddMemberModalOpen(false)}
                title="Adicionar Membro"
                size="md"
            >
                <Stack gap="md">
                    <Select
                        label="Usuário"
                        placeholder="Selecione um usuário"
                        data={availableUsers.map(u => ({
                            value: u.id,
                            label: `${u.name} (${u.email})`,
                        }))}
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                        searchable
                        required
                    />
                    <Select
                        label="Função"
                        placeholder="Selecione uma função"
                        data={positions.map(p => ({
                            value: p.id,
                            label: `${p.name} (Nível ${p.level})`,
                        }))}
                        value={selectedPositionId}
                        onChange={setSelectedPositionId}
                        searchable
                        required
                    />
                    <Select
                        label="Papel na Equipe"
                        data={Object.entries(MEMBER_ROLES).map(([value, config]) => ({
                            value,
                            label: config.label,
                        }))}
                        value={selectedRole}
                        onChange={(v) => setSelectedRole(v || 'member')}
                    />
                    <TextInput
                        label="Título Personalizado (opcional)"
                        placeholder="Ex: Senior Developer"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                    />
                    <div>
                        <Text size="sm" fw={500} mb="xs">Alocação: {allocation}%</Text>
                        <Slider
                            value={allocation}
                            onChange={setAllocation}
                            min={10}
                            max={100}
                            step={10}
                            marks={[
                                { value: 25, label: '25%' },
                                { value: 50, label: '50%' },
                                { value: 75, label: '75%' },
                                { value: 100, label: '100%' },
                            ]}
                        />
                    </div>
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={() => setAddMemberModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddMember}
                            loading={saving}
                            disabled={!selectedUserId || !selectedPositionId}
                        >
                            Adicionar
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
