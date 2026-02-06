'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container, Title, Text, Card, Stack, Group, Button, Badge,
    ThemeIcon, Paper, Divider, Box, TextInput, Select, Switch,
    SimpleGrid, ActionIcon, Modal, Textarea, Alert, Tabs
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconUsers, IconPlus, IconEdit, IconTrash, IconArrowLeft,
    IconCheck, IconShieldCheck, IconHierarchy, IconUserPlus,
    IconCrown, IconSchool, IconClipboard, IconCash, IconDoor, IconClock
} from '@tabler/icons-react';
import { useOrg } from '@/components/OrgContext';

// Default roles for a school
const DEFAULT_ROLES = [
    {
        id: 'owner',
        name: 'Proprietário',
        description: 'Acesso total ao sistema',
        icon: IconCrown,
        color: 'yellow',
        permissions: ['all'],
        canDelete: false,
        reportsTo: null,
    },
    {
        id: 'admin',
        name: 'Administrador',
        description: 'Gerencia a escola',
        icon: IconShieldCheck,
        color: 'orange',
        permissions: ['manage_users', 'manage_courses', 'manage_finances', 'view_reports'],
        canDelete: false,
        reportsTo: 'owner',
    },
    {
        id: 'coordinator',
        name: 'Coordenador',
        description: 'Coordena área pedagógica',
        icon: IconHierarchy,
        color: 'blue',
        permissions: ['manage_courses', 'manage_teachers', 'view_students'],
        canDelete: true,
        reportsTo: 'admin',
    },
    {
        id: 'teacher',
        name: 'Professor',
        description: 'Ministra aulas',
        icon: IconSchool,
        color: 'cyan',
        permissions: ['view_courses', 'manage_own_classes', 'view_students'],
        canDelete: false,
        reportsTo: 'coordinator',
    },
    {
        id: 'sales',
        name: 'Comercial',
        description: 'Vendas e atendimento',
        icon: IconClipboard,
        color: 'green',
        permissions: ['manage_leads', 'create_enrollments', 'view_pricing'],
        canDelete: true,
        reportsTo: 'admin',
    },
    {
        id: 'accountant',
        name: 'Contador',
        description: 'Acesso fiscal e contábil',
        icon: IconCash,
        color: 'teal',
        permissions: ['view_finances', 'export_reports', 'manage_fiscal'],
        canDelete: true,
        reportsTo: 'owner',
    },
];

// Available permissions
const PERMISSIONS = [
    { value: 'all', label: 'Acesso Total', description: 'Todas as permissões' },
    { value: 'manage_users', label: 'Gerenciar Usuários', description: 'Criar, editar e remover usuários' },
    { value: 'manage_courses', label: 'Gerenciar Cursos', description: 'Criar e editar cursos e turmas' },
    { value: 'manage_teachers', label: 'Gerenciar Professores', description: 'Atribuir professores a turmas' },
    { value: 'manage_finances', label: 'Gerenciar Financeiro', description: 'Acessar contas e pagamentos' },
    { value: 'manage_leads', label: 'Gerenciar Leads', description: 'Acessar funil de vendas' },
    { value: 'manage_fiscal', label: 'Gerenciar Fiscal', description: 'Emitir notas e acessar SPED' },
    { value: 'create_enrollments', label: 'Criar Matrículas', description: 'Matricular alunos' },
    { value: 'view_reports', label: 'Ver Relatórios', description: 'Acessar dashboards e métricas' },
    { value: 'view_finances', label: 'Ver Financeiro', description: 'Visualizar dados financeiros' },
    { value: 'view_courses', label: 'Ver Cursos', description: 'Visualizar cursos e turmas' },
    { value: 'view_students', label: 'Ver Alunos', description: 'Visualizar dados de alunos' },
    { value: 'view_pricing', label: 'Ver Preços', description: 'Visualizar tabela de preços' },
    { value: 'manage_own_classes', label: 'Gerenciar Próprias Turmas', description: 'Gerenciar apenas suas turmas' },
    { value: 'export_reports', label: 'Exportar Relatórios', description: 'Baixar relatórios em Excel/PDF' },
];

interface Role {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    permissions: string[];
    canDelete: boolean;
    reportsTo: string | null;
}

export default function TeamSetupPage() {
    const org = useOrg();
    const router = useRouter();
    const primaryColor = org.primaryColor || '#7048e8';

    const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string | null>('roles');

    // New role form state
    const [newRole, setNewRole] = useState({
        name: '',
        description: '',
        reportsTo: 'admin',
        permissions: [] as string[],
    });

    // Rooms state
    const [rooms, setRooms] = useState([
        { id: '1', name: 'Sala 1', capacity: 20, type: 'classroom', equipment: ['projetor', 'quadro'] },
        { id: '2', name: 'Laboratório', capacity: 15, type: 'lab', equipment: ['computadores', 'projetor'] },
        { id: '3', name: 'Auditório', capacity: 50, type: 'auditorium', equipment: ['projetor', 'som'] },
    ]);

    // Working hours state
    const [workingHours, setWorkingHours] = useState({
        monday: { enabled: true, start: '08:00', end: '22:00' },
        tuesday: { enabled: true, start: '08:00', end: '22:00' },
        wednesday: { enabled: true, start: '08:00', end: '22:00' },
        thursday: { enabled: true, start: '08:00', end: '22:00' },
        friday: { enabled: true, start: '08:00', end: '22:00' },
        saturday: { enabled: true, start: '08:00', end: '14:00' },
        sunday: { enabled: false, start: '08:00', end: '12:00' },
    });

    const handleSaveRole = () => {
        if (editingRole) {
            setRoles(prev => prev.map(r =>
                r.id === editingRole.id
                    ? { ...r, ...newRole }
                    : r
            ));
        } else {
            const newId = newRole.name.toLowerCase().replace(/\s+/g, '_');
            setRoles(prev => [...prev, {
                id: newId,
                name: newRole.name,
                description: newRole.description,
                icon: IconUsers,
                color: 'gray',
                permissions: newRole.permissions,
                canDelete: true,
                reportsTo: newRole.reportsTo,
            }]);
        }
        closeModal();
        setEditingRole(null);
        setNewRole({ name: '', description: '', reportsTo: 'admin', permissions: [] });
    };

    const handleDeleteRole = (roleId: string) => {
        setRoles(prev => prev.filter(r => r.id !== roleId));
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setNewRole({
            name: role.name,
            description: role.description,
            reportsTo: role.reportsTo || 'admin',
            permissions: role.permissions,
        });
        openModal();
    };

    const completedItems = roles.length >= 3 ? 2 : 1; // Simplified completion check

    return (
        <Box bg="dark.9" mih="100vh">
            <Container size="lg" py="xl">
                <Stack gap="lg">
                    {/* Header */}
                    <Group justify="space-between">
                        <Group>
                            <Button
                                variant="subtle"
                                leftSection={<IconArrowLeft size={16} />}
                                onClick={() => router.push(`/${org.slug}/admin/setup`)}
                            >
                                Voltar
                            </Button>
                            <Divider orientation="vertical" />
                            <div>
                                <Text c="gray.5" size="xs">Configuração da Escola</Text>
                                <Title order={2} c="white" size="lg">
                                    Equipe & Hierarquia
                                </Title>
                            </div>
                        </Group>
                        <Badge size="lg" color="violet">
                            {completedItems}/2 Completo
                        </Badge>
                    </Group>

                    {/* Tabs */}
                    <Tabs value={activeTab} onChange={setActiveTab} color="violet">
                        <Tabs.List>
                            <Tabs.Tab value="roles" leftSection={<IconShieldCheck size={16} />}>
                                Cargos
                            </Tabs.Tab>
                            <Tabs.Tab value="hierarchy" leftSection={<IconHierarchy size={16} />}>
                                Hierarquia
                            </Tabs.Tab>
                            <Tabs.Tab value="rooms" leftSection={<IconDoor size={16} />}>
                                Salas
                            </Tabs.Tab>
                            <Tabs.Tab value="hours" leftSection={<IconClock size={16} />}>
                                Horários
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* Roles Panel */}
                        <Tabs.Panel value="roles" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Configure os cargos e suas permissões no sistema.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                        onClick={() => {
                                            setEditingRole(null);
                                            setNewRole({ name: '', description: '', reportsTo: 'admin', permissions: [] });
                                            openModal();
                                        }}
                                    >
                                        Novo Cargo
                                    </Button>
                                </Group>

                                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                                    {roles.map((role) => (
                                        <Card key={role.id} bg="dark.7" radius="md" p="md">
                                            <Stack gap="sm">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <ThemeIcon
                                                            size={36}
                                                            radius="md"
                                                            color={role.color}
                                                            variant="light"
                                                        >
                                                            <role.icon size={18} />
                                                        </ThemeIcon>
                                                        <div>
                                                            <Text c="white" fw={600} size="sm">
                                                                {role.name}
                                                            </Text>
                                                            <Text c="gray.5" size="xs">
                                                                {role.description}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                </Group>

                                                <Divider color="dark.5" />

                                                <Text c="gray.5" size="xs">
                                                    {role.permissions.length} permissões
                                                </Text>

                                                {role.reportsTo && (
                                                    <Badge size="xs" variant="light" color="gray">
                                                        Reporta a: {roles.find(r => r.id === role.reportsTo)?.name}
                                                    </Badge>
                                                )}

                                                <Group gap="xs">
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        leftSection={<IconEdit size={14} />}
                                                        onClick={() => handleEditRole(role)}
                                                        flex={1}
                                                    >
                                                        Editar
                                                    </Button>
                                                    {role.canDelete && (
                                                        <ActionIcon
                                                            size="md"
                                                            variant="light"
                                                            color="red"
                                                            onClick={() => handleDeleteRole(role.id)}
                                                        >
                                                            <IconTrash size={14} />
                                                        </ActionIcon>
                                                    )}
                                                </Group>
                                            </Stack>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            </Stack>
                        </Tabs.Panel>

                        {/* Hierarchy Panel */}
                        <Tabs.Panel value="hierarchy" pt="lg">
                            <Stack gap="md">
                                <Alert variant="light" color="blue">
                                    <Text size="sm">
                                        A hierarquia define quem aprova solicitações e quem reporta a quem.
                                        Arraste os cargos para reorganizar (em breve).
                                    </Text>
                                </Alert>

                                <Card bg="dark.7" radius="md" p="lg">
                                    <Stack gap="md">
                                        {/* Simple hierarchy visualization */}
                                        {roles
                                            .filter(r => !r.reportsTo)
                                            .map(topRole => (
                                                <Stack key={topRole.id} gap="xs">
                                                    <Paper p="sm" radius="md" bg="dark.6">
                                                        <Group>
                                                            <ThemeIcon size={32} radius="md" color={topRole.color}>
                                                                <topRole.icon size={16} />
                                                            </ThemeIcon>
                                                            <Text c="white" fw={600} size="sm">{topRole.name}</Text>
                                                            <Badge size="xs" color="yellow">Topo</Badge>
                                                        </Group>
                                                    </Paper>

                                                    {/* Level 1 */}
                                                    <Box ml="xl" pl="lg" style={{ borderLeft: '2px solid var(--mantine-color-dark-5)' }}>
                                                        <Stack gap="xs">
                                                            {roles
                                                                .filter(r => r.reportsTo === topRole.id)
                                                                .map(l1Role => (
                                                                    <Stack key={l1Role.id} gap="xs">
                                                                        <Paper p="sm" radius="md" bg="dark.6">
                                                                            <Group>
                                                                                <ThemeIcon size={28} radius="md" color={l1Role.color} variant="light">
                                                                                    <l1Role.icon size={14} />
                                                                                </ThemeIcon>
                                                                                <Text c="white" size="sm">{l1Role.name}</Text>
                                                                            </Group>
                                                                        </Paper>

                                                                        {/* Level 2 */}
                                                                        <Box ml="xl" pl="lg" style={{ borderLeft: '2px solid var(--mantine-color-dark-6)' }}>
                                                                            <Stack gap="xs">
                                                                                {roles
                                                                                    .filter(r => r.reportsTo === l1Role.id)
                                                                                    .map(l2Role => (
                                                                                        <Paper key={l2Role.id} p="xs" radius="sm" bg="dark.8">
                                                                                            <Group gap="xs">
                                                                                                <ThemeIcon size={24} radius="sm" color={l2Role.color} variant="light">
                                                                                                    <l2Role.icon size={12} />
                                                                                                </ThemeIcon>
                                                                                                <Text c="gray.4" size="xs">{l2Role.name}</Text>
                                                                                            </Group>
                                                                                        </Paper>
                                                                                    ))
                                                                                }
                                                                            </Stack>
                                                                        </Box>
                                                                    </Stack>
                                                                ))
                                                            }
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            ))
                                        }
                                    </Stack>
                                </Card>

                                <Button
                                    variant="light"
                                    color="green"
                                    rightSection={<IconCheck size={16} />}
                                    onClick={() => router.push(`/${org.slug}/admin/setup`)}
                                >
                                    Salvar e Continuar
                                </Button>
                            </Stack>
                        </Tabs.Panel>

                        {/* Rooms Panel */}
                        <Tabs.Panel value="rooms" pt="lg">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Text c="gray.4" size="sm">
                                        Cadastre as salas e espaços disponíveis para aulas.
                                    </Text>
                                    <Button
                                        leftSection={<IconPlus size={16} />}
                                        size="sm"
                                    >
                                        Nova Sala
                                    </Button>
                                </Group>

                                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                                    {rooms.map((room) => (
                                        <Card key={room.id} bg="dark.7" radius="md" p="md">
                                            <Stack gap="sm">
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <ThemeIcon
                                                            size={36}
                                                            radius="md"
                                                            color={room.type === 'lab' ? 'blue' : room.type === 'auditorium' ? 'orange' : 'violet'}
                                                            variant="light"
                                                        >
                                                            <IconDoor size={18} />
                                                        </ThemeIcon>
                                                        <div>
                                                            <Text c="white" fw={600} size="sm">
                                                                {room.name}
                                                            </Text>
                                                            <Text c="gray.5" size="xs">
                                                                Capacidade: {room.capacity} pessoas
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                </Group>

                                                <Group gap="xs">
                                                    {room.equipment.map((eq) => (
                                                        <Badge key={eq} size="xs" variant="light" color="gray">
                                                            {eq}
                                                        </Badge>
                                                    ))}
                                                </Group>

                                                <Group gap="xs">
                                                    <Button
                                                        size="xs"
                                                        variant="light"
                                                        leftSection={<IconEdit size={14} />}
                                                        flex={1}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <ActionIcon
                                                        size="md"
                                                        variant="light"
                                                        color="red"
                                                    >
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            </Stack>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            </Stack>
                        </Tabs.Panel>

                        {/* Working Hours Panel */}
                        <Tabs.Panel value="hours" pt="lg">
                            <Stack gap="md">
                                <Text c="gray.4" size="sm">
                                    Defina os horários de funcionamento da escola.
                                </Text>

                                <Card bg="dark.7" radius="md" p="md">
                                    <Stack gap="sm">
                                        {Object.entries(workingHours).map(([day, hours]) => {
                                            const dayNames: Record<string, string> = {
                                                monday: 'Segunda-feira',
                                                tuesday: 'Terça-feira',
                                                wednesday: 'Quarta-feira',
                                                thursday: 'Quinta-feira',
                                                friday: 'Sexta-feira',
                                                saturday: 'Sábado',
                                                sunday: 'Domingo',
                                            };
                                            return (
                                                <Paper key={day} p="sm" radius="sm" bg="dark.6">
                                                    <Group justify="space-between">
                                                        <Group gap="md">
                                                            <Switch
                                                                checked={hours.enabled}
                                                                onChange={(e) => setWorkingHours(prev => ({
                                                                    ...prev,
                                                                    [day]: { ...hours, enabled: e.target.checked }
                                                                }))}
                                                            />
                                                            <Text c={hours.enabled ? 'white' : 'gray.6'} size="sm" fw={500}>
                                                                {dayNames[day]}
                                                            </Text>
                                                        </Group>
                                                        {hours.enabled && (
                                                            <Group gap="xs">
                                                                <TextInput
                                                                    size="xs"
                                                                    w={70}
                                                                    value={hours.start}
                                                                    onChange={(e) => setWorkingHours(prev => ({
                                                                        ...prev,
                                                                        [day]: { ...hours, start: e.target.value }
                                                                    }))}
                                                                />
                                                                <Text c="gray.5" size="xs">até</Text>
                                                                <TextInput
                                                                    size="xs"
                                                                    w={70}
                                                                    value={hours.end}
                                                                    onChange={(e) => setWorkingHours(prev => ({
                                                                        ...prev,
                                                                        [day]: { ...hours, end: e.target.value }
                                                                    }))}
                                                                />
                                                            </Group>
                                                        )}
                                                    </Group>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                </Card>

                                <Button
                                    variant="light"
                                    color="green"
                                    rightSection={<IconCheck size={16} />}
                                    onClick={() => router.push(`/${org.slug}/admin/setup`)}
                                >
                                    Salvar e Continuar
                                </Button>
                            </Stack>
                        </Tabs.Panel>
                    </Tabs>
                </Stack>
            </Container>

            {/* Role Modal */}
            <Modal
                opened={isModalOpen}
                onClose={closeModal}
                title={editingRole ? 'Editar Cargo' : 'Novo Cargo'}
                size="md"
            >
                <Stack gap="md">
                    <TextInput
                        label="Nome do Cargo"
                        placeholder="Ex: Gerente Comercial"
                        value={newRole.name}
                        onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />

                    <Textarea
                        label="Descrição"
                        placeholder="Descreva as responsabilidades..."
                        value={newRole.description}
                        onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                    />

                    <Select
                        label="Reporta a"
                        data={roles.map(r => ({ value: r.id, label: r.name }))}
                        value={newRole.reportsTo}
                        onChange={(value) => setNewRole(prev => ({ ...prev, reportsTo: value || 'admin' }))}
                    />

                    <Text size="sm" fw={500}>Permissões</Text>
                    <Stack gap="xs">
                        {PERMISSIONS.slice(1).map((perm) => (
                            <Switch
                                key={perm.value}
                                label={perm.label}
                                description={perm.description}
                                checked={newRole.permissions.includes(perm.value)}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setNewRole(prev => ({
                                        ...prev,
                                        permissions: isChecked
                                            ? [...prev.permissions, perm.value]
                                            : prev.permissions.filter(p => p !== perm.value),
                                    }));
                                }}
                            />
                        ))}
                    </Stack>

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={closeModal}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveRole} disabled={!newRole.name}>
                            {editingRole ? 'Salvar' : 'Criar'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}
