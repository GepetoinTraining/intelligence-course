'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Card,
    Group,
    Stack,
    Avatar,
    Badge,
    TextInput,
    Switch,
    Accordion,
    Button,
    Loader,
    Center,
    Paper,
    Grid,
    Tooltip,
    ActionIcon,
    Alert,
    Divider,
    ScrollArea,
    Box,
} from '@mantine/core';
import {
    IconSearch,
    IconShield,
    IconRefresh,
    IconAlertCircle,
    IconCheck,
    IconX,
} from '@tabler/icons-react';

// ============================================================================
// Types
// ============================================================================

interface UserSummary {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    avatarUrl: string | null;
    overrideCount: number;
    lastSeenAt: number | null;
}

interface PermissionEntry {
    module: string;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    isOverridden: boolean;
    roleDefault: { c: boolean; r: boolean; u: boolean; d: boolean };
}

interface UserPermissions {
    user: UserSummary;
    permissions: PermissionEntry[];
    moduleCategories: Record<string, string[]>;
}

// ============================================================================
// Module Display Names
// ============================================================================

const MODULE_LABELS: Record<string, string> = {
    // Student
    student_dashboard: 'Dashboard',
    student_lessons: 'Aulas',
    student_techniques: 'Técnicas',
    student_todo: 'Tarefas',
    student_constellation: 'Constelação',
    student_workshop: 'Workshop',
    student_challenges: 'Desafios',
    student_capstone: 'Capstone',
    student_reviews: 'Revisões',
    // Parent
    parent_dashboard: 'Dashboard',
    parent_billing: 'Financeiro',
    parent_messages: 'Mensagens',
    // Teacher
    teacher_dashboard: 'Dashboard',
    teacher_attendance: 'Frequência',
    teacher_grades: 'Notas',
    teacher_students: 'Alunos',
    // Staff
    staff_dashboard: 'Dashboard',
    staff_leads: 'Leads',
    staff_trials: 'Aulas Experimentais',
    staff_checkin: 'Check-in',
    staff_landing_builder: 'Landing Pages',
    // School
    school_dashboard: 'Dashboard',
    school_courses: 'Cursos',
    school_modules: 'Módulos',
    school_lessons: 'Aulas',
    school_rooms: 'Salas',
    school_schedules: 'Horários',
    school_terms: 'Períodos',
    school_classes: 'Turmas',
    school_teachers: 'Professores',
    school_enrollments: 'Matrículas',
    school_discounts: 'Descontos',
    school_products: 'Produtos',
    // Marketing
    marketing_campaigns: 'Campanhas',
    marketing_templates: 'Templates',
    marketing_referrals: 'Indicações',
    // Owner
    owner_dashboard: 'Dashboard',
    owner_payroll: 'Folha de Pagamento',
    owner_reports: 'Relatórios',
    owner_payables: 'Contas a Pagar',
    owner_employees: 'Funcionários',
    owner_permissions: 'Permissões',
    owner_accounting: 'Contabilidade',
    // Accountant
    accountant_dashboard: 'Dashboard',
    accountant_reports: 'Relatórios',
    accountant_sped: 'SPED',
    // Lattice
    lattice_evidence: 'Evidências',
    lattice_projections: 'Projeções',
    lattice_shares: 'Compartilhamentos',
    lattice_matching: 'Matching',
    // Talent
    talent_dashboard: 'Dashboard',
    talent_documents: 'Documentos',
    talent_interview: 'Entrevista',
    talent_cv: 'Currículo',
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
    student: { label: 'Aluno', emoji: '👨‍🎓' },
    parent: { label: 'Responsável', emoji: '👨‍👩‍👧' },
    teacher: { label: 'Professor', emoji: '👩‍🏫' },
    staff: { label: 'Equipe', emoji: '💼' },
    school: { label: 'Escola', emoji: '🏫' },
    marketing: { label: 'Marketing', emoji: '📢' },
    owner: { label: 'Proprietário', emoji: '👑' },
    accountant: { label: 'Contador', emoji: '📊' },
    lattice: { label: 'Lattice HR', emoji: '🎯' },
    talent: { label: 'Talentos', emoji: '💎' },
};

const ROLE_COLORS: Record<string, string> = {
    student: 'violet',
    parent: 'grape',
    teacher: 'blue',
    staff: 'cyan',
    admin: 'orange',
    owner: 'yellow',
    accountant: 'teal',
    talent: 'pink',
};

// ============================================================================
// Components
// ============================================================================

function UserCard({
    user,
    isSelected,
    onClick
}: {
    user: UserSummary;
    isSelected: boolean;
    onClick: () => void;
}) {
    const roleColor = ROLE_COLORS[user.role || 'student'] || 'gray';

    return (
        <Card
            shadow={isSelected ? 'md' : 'xs'}
            padding="sm"
            radius="md"
            withBorder
            style={{
                cursor: 'pointer',
                borderColor: isSelected ? `var(--mantine-color-${roleColor}-6)` : undefined,
                backgroundColor: isSelected ? `var(--mantine-color-${roleColor}-light)` : undefined,
            }}
            onClick={onClick}
        >
            <Group gap="sm">
                <Avatar
                    size={40}
                    radius="xl"
                    color={roleColor}
                    src={user.avatarUrl}
                >
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                        {user.name || user.email}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                        {user.email}
                    </Text>
                </Box>
                <Stack gap={4} align="flex-end">
                    <Badge size="xs" color={roleColor} variant="light">
                        {user.role}
                    </Badge>
                    {user.overrideCount > 0 && (
                        <Badge size="xs" color="orange" variant="outline">
                            {user.overrideCount} custom
                        </Badge>
                    )}
                </Stack>
            </Group>
        </Card>
    );
}

function PermissionRow({
    permission,
    onUpdate,
    disabled,
}: {
    permission: PermissionEntry;
    onUpdate: (module: string, field: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete', value: boolean) => void;
    disabled: boolean;
}) {
    const label = MODULE_LABELS[permission.module] || permission.module;

    return (
        <Paper p="sm" radius="sm" withBorder={permission.isOverridden} style={{
            borderColor: permission.isOverridden ? 'var(--mantine-color-orange-4)' : undefined,
            backgroundColor: permission.isOverridden ? 'var(--mantine-color-orange-light)' : undefined,
        }}>
            <Group justify="space-between" wrap="nowrap">
                <Group gap="xs">
                    <Text size="sm" fw={500}>{label}</Text>
                    {permission.isOverridden && (
                        <Badge size="xs" color="orange" variant="light">
                            personalizado
                        </Badge>
                    )}
                </Group>

                <Group gap="lg">
                    <Tooltip label="Criar" position="top">
                        <Stack gap={2} align="center">
                            <Text size="xs" c="dimmed">C</Text>
                            <Switch
                                size="xs"
                                checked={permission.canCreate}
                                onChange={(e) => onUpdate(permission.module, 'canCreate', e.currentTarget.checked)}
                                disabled={disabled}
                                color={permission.canCreate === permission.roleDefault.c ? 'blue' : 'orange'}
                            />
                        </Stack>
                    </Tooltip>
                    <Tooltip label="Ler" position="top">
                        <Stack gap={2} align="center">
                            <Text size="xs" c="dimmed">R</Text>
                            <Switch
                                size="xs"
                                checked={permission.canRead}
                                onChange={(e) => onUpdate(permission.module, 'canRead', e.currentTarget.checked)}
                                disabled={disabled}
                                color={permission.canRead === permission.roleDefault.r ? 'blue' : 'orange'}
                            />
                        </Stack>
                    </Tooltip>
                    <Tooltip label="Atualizar" position="top">
                        <Stack gap={2} align="center">
                            <Text size="xs" c="dimmed">U</Text>
                            <Switch
                                size="xs"
                                checked={permission.canUpdate}
                                onChange={(e) => onUpdate(permission.module, 'canUpdate', e.currentTarget.checked)}
                                disabled={disabled}
                                color={permission.canUpdate === permission.roleDefault.u ? 'blue' : 'orange'}
                            />
                        </Stack>
                    </Tooltip>
                    <Tooltip label="Excluir" position="top">
                        <Stack gap={2} align="center">
                            <Text size="xs" c="dimmed">D</Text>
                            <Switch
                                size="xs"
                                checked={permission.canDelete}
                                onChange={(e) => onUpdate(permission.module, 'canDelete', e.currentTarget.checked)}
                                disabled={disabled}
                                color={permission.canDelete === permission.roleDefault.d ? 'blue' : 'orange'}
                            />
                        </Stack>
                    </Tooltip>
                </Group>
            </Group>
        </Paper>
    );
}

// ============================================================================
// Main Page
// ============================================================================

export default function PermissionsPage() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);
    const [permLoading, setPermLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    // Load users list
    useEffect(() => {
        async function loadUsers() {
            try {
                const res = await fetch('/api/permissions');
                const data = await res.json();
                setUsers(data.users || []);
            } catch (error) {
                console.error('Failed to load users:', error);
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, []);

    // Load selected user's permissions
    useEffect(() => {
        async function loadPermissions() {
            if (!selectedUserId) {
                setUserPermissions(null);
                return;
            }
            setPermLoading(true);
            try {
                const res = await fetch(`/api/permissions?userId=${selectedUserId}`);
                const data = await res.json();
                setUserPermissions(data);
            } catch (error) {
                console.error('Failed to load permissions:', error);
            } finally {
                setPermLoading(false);
            }
        }
        loadPermissions();
    }, [selectedUserId]);

    const handleUpdate = async (module: string, field: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete', value: boolean) => {
        if (!userPermissions || !selectedUserId) return;

        // Optimistic update
        const updatedPermissions = userPermissions.permissions.map(p => {
            if (p.module === module) {
                return { ...p, [field]: value, isOverridden: true };
            }
            return p;
        });
        setUserPermissions({ ...userPermissions, permissions: updatedPermissions });

        // Get all values for this module
        const perm = updatedPermissions.find(p => p.module === module)!;

        setSaving(true);
        try {
            await fetch('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    module,
                    canCreate: perm.canCreate,
                    canRead: perm.canRead,
                    canUpdate: perm.canUpdate,
                    canDelete: perm.canDelete,
                }),
            });

            // Reload to get accurate isOverridden status
            const res = await fetch(`/api/permissions?userId=${selectedUserId}`);
            const data = await res.json();
            setUserPermissions(data);

            // Update users list override count
            const usersRes = await fetch('/api/permissions');
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);
        } catch (error) {
            console.error('Failed to update permission:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleResetAll = async () => {
        if (!selectedUserId) return;

        setSaving(true);
        try {
            await fetch(`/api/permissions?userId=${selectedUserId}`, { method: 'DELETE' });

            // Reload
            const res = await fetch(`/api/permissions?userId=${selectedUserId}`);
            const data = await res.json();
            setUserPermissions(data);

            const usersRes = await fetch('/api/permissions');
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);
        } catch (error) {
            console.error('Failed to reset permissions:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
    );

    // Group permissions by category
    const groupedPermissions = userPermissions ? Object.entries(userPermissions.moduleCategories).map(([category, modules]) => ({
        category,
        permissions: userPermissions.permissions.filter(p => modules.includes(p.module)),
    })).filter(g => g.permissions.length > 0) : [];

    const isTargetOwner = userPermissions?.user.role === 'owner';

    return (
        <Container size="xl" py="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Group gap="xs">
                        <IconShield size={28} color="var(--mantine-color-blue-6)" />
                        <Title order={2}>Gerenciamento de Permissões</Title>
                    </Group>
                    <Text c="dimmed" size="sm" mt={4}>
                        Configure quais módulos cada usuário pode acessar e quais ações podem realizar.
                    </Text>
                </div>
                {saving && (
                    <Badge size="lg" color="blue" variant="light" leftSection={<Loader size={12} />}>
                        Salvando...
                    </Badge>
                )}
            </Group>

            <Grid gutter="lg">
                {/* Users List */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder>
                        <Stack gap="sm">
                            <TextInput
                                placeholder="Buscar usuário..."
                                leftSection={<IconSearch size={16} />}
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                            />

                            <Divider />

                            <ScrollArea h={500} offsetScrollbars>
                                <Stack gap="xs">
                                    {loading ? (
                                        <Center py="xl">
                                            <Loader />
                                        </Center>
                                    ) : filteredUsers.length === 0 ? (
                                        <Center py="xl">
                                            <Text c="dimmed">Nenhum usuário encontrado</Text>
                                        </Center>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <UserCard
                                                key={user.id}
                                                user={user}
                                                isSelected={selectedUserId === user.id}
                                                onClick={() => setSelectedUserId(user.id)}
                                            />
                                        ))
                                    )}
                                </Stack>
                            </ScrollArea>
                        </Stack>
                    </Card>
                </Grid.Col>

                {/* Permissions Editor */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card shadow="sm" padding="md" radius="md" withBorder h="100%">
                        {!selectedUserId ? (
                            <Center h={400}>
                                <Stack align="center" gap="md">
                                    <IconShield size={48} color="var(--mantine-color-gray-4)" />
                                    <Text c="dimmed">Selecione um usuário para gerenciar permissões</Text>
                                </Stack>
                            </Center>
                        ) : permLoading ? (
                            <Center h={400}>
                                <Loader size="lg" />
                            </Center>
                        ) : userPermissions && (
                            <Stack gap="md">
                                {/* User Header */}
                                <Paper p="md" radius="md" withBorder>
                                    <Group justify="space-between">
                                        <Group gap="md">
                                            <Avatar
                                                size={50}
                                                radius="xl"
                                                color={ROLE_COLORS[userPermissions.user.role || 'student']}
                                                src={userPermissions.user.avatarUrl}
                                            >
                                                {userPermissions.user.name?.charAt(0).toUpperCase() || userPermissions.user.email.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <div>
                                                <Text fw={600} size="lg">{userPermissions.user.name || userPermissions.user.email}</Text>
                                                <Text size="sm" c="dimmed">{userPermissions.user.email}</Text>
                                            </div>
                                            <Badge size="lg" color={ROLE_COLORS[userPermissions.user.role || 'student']} variant="light">
                                                {userPermissions.user.role}
                                            </Badge>
                                        </Group>

                                        <Tooltip label="Resetar para padrões do cargo">
                                            <Button
                                                variant="light"
                                                color="red"
                                                size="sm"
                                                leftSection={<IconRefresh size={16} />}
                                                onClick={handleResetAll}
                                                disabled={saving || isTargetOwner}
                                            >
                                                Resetar
                                            </Button>
                                        </Tooltip>
                                    </Group>
                                </Paper>

                                {isTargetOwner && (
                                    <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
                                        Proprietários têm acesso total e suas permissões não podem ser modificadas.
                                    </Alert>
                                )}

                                {/* Permission Categories */}
                                <ScrollArea h={450} offsetScrollbars>
                                    <Accordion variant="separated" radius="md" defaultValue={groupedPermissions[0]?.category}>
                                        {groupedPermissions.map(({ category, permissions }) => {
                                            const catInfo = CATEGORY_LABELS[category] || { label: category, emoji: '📁' };
                                            const customCount = permissions.filter(p => p.isOverridden).length;

                                            return (
                                                <Accordion.Item key={category} value={category}>
                                                    <Accordion.Control>
                                                        <Group justify="space-between">
                                                            <Group gap="xs">
                                                                <Text>{catInfo.emoji}</Text>
                                                                <Text fw={500}>{catInfo.label}</Text>
                                                            </Group>
                                                            {customCount > 0 && (
                                                                <Badge size="sm" color="orange" variant="light">
                                                                    {customCount} personalizados
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                    </Accordion.Control>
                                                    <Accordion.Panel>
                                                        <Stack gap="xs">
                                                            {permissions.map(perm => (
                                                                <PermissionRow
                                                                    key={perm.module}
                                                                    permission={perm}
                                                                    onUpdate={handleUpdate}
                                                                    disabled={isTargetOwner}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </Accordion.Panel>
                                                </Accordion.Item>
                                            );
                                        })}
                                    </Accordion>
                                </ScrollArea>

                                {/* Legend */}
                                <Paper p="sm" radius="sm" withBorder>
                                    <Group gap="lg">
                                        <Text size="xs" fw={500}>Legenda:</Text>
                                        <Group gap="xs">
                                            <Switch size="xs" checked color="blue" readOnly />
                                            <Text size="xs" c="dimmed">Padrão do cargo</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Switch size="xs" checked color="orange" readOnly />
                                            <Text size="xs" c="dimmed">Personalizado</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <Badge size="xs" color="orange" variant="light">personalizado</Badge>
                                            <Text size="xs" c="dimmed">Módulo modificado</Text>
                                        </Group>
                                    </Group>
                                </Paper>
                            </Stack>
                        )}
                    </Card>
                </Grid.Col>
            </Grid>
        </Container>
    );
}

