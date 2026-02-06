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
    Switch,
    ActionIcon,
} from '@mantine/core';
import {
    IconShieldCheck,
    IconPlus,
    IconPencil,
    IconEye,
    IconTrash,
} from '@tabler/icons-react';

// Demo roles data
const roles = [
    { id: 1, name: 'Administrador', description: 'Acesso total ao sistema', users: 2, permissions: 'all', color: 'red' },
    { id: 2, name: 'Coordenador Pedagógico', description: 'Gestão pedagógica e professores', users: 3, permissions: 45, color: 'purple' },
    { id: 3, name: 'Professor', description: 'Acesso a turmas e materiais', users: 12, permissions: 28, color: 'blue' },
    { id: 4, name: 'Recepção', description: 'Operacional e atendimento', users: 4, permissions: 32, color: 'teal' },
    { id: 5, name: 'Financeiro', description: 'Gestão financeira e cobranças', users: 2, permissions: 25, color: 'green' },
    { id: 6, name: 'Marketing', description: 'Campanhas e leads', users: 2, permissions: 18, color: 'pink' },
];

const permissionModules = [
    { module: 'Marketing', admin: true, coord: false, teacher: false, reception: false, finance: false },
    { module: 'Comercial', admin: true, coord: false, teacher: false, reception: true, finance: false },
    { module: 'Operacional', admin: true, coord: true, teacher: false, reception: true, finance: false },
    { module: 'Pedagógico', admin: true, coord: true, teacher: true, reception: false, finance: false },
    { module: 'Financeiro', admin: true, coord: false, teacher: false, reception: false, finance: true },
    { module: 'RH', admin: true, coord: false, teacher: false, reception: false, finance: false },
];

export default function CargosPage() {
    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Cargos e Permissões</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Cargo
                </Button>
            </Group>

            {/* Roles Grid */}
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {roles.map((role) => (
                    <Card key={role.id} withBorder p="md">
                        <Group justify="space-between" mb="xs">
                            <Badge color={role.color} variant="light">{role.name}</Badge>
                            <ActionIcon variant="subtle" size="sm">
                                <IconPencil size={14} />
                            </ActionIcon>
                        </Group>
                        <Text size="sm" c="dimmed" mb="sm">{role.description}</Text>
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed">{role.users} usuários</Text>
                            <Badge size="xs" variant="outline">
                                {role.permissions === 'all' ? 'Todas' : `${role.permissions} permissões`}
                            </Badge>
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            {/* Permission Matrix */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Matriz de Permissões (por Módulo)</Text>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Módulo</Table.Th>
                            <Table.Th>Admin</Table.Th>
                            <Table.Th>Coordenador</Table.Th>
                            <Table.Th>Professor</Table.Th>
                            <Table.Th>Recepção</Table.Th>
                            <Table.Th>Financeiro</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {permissionModules.map((perm) => (
                            <Table.Tr key={perm.module}>
                                <Table.Td>
                                    <Text fw={500}>{perm.module}</Text>
                                </Table.Td>
                                <Table.Td><Switch checked={perm.admin} size="xs" readOnly /></Table.Td>
                                <Table.Td><Switch checked={perm.coord} size="xs" readOnly /></Table.Td>
                                <Table.Td><Switch checked={perm.teacher} size="xs" readOnly /></Table.Td>
                                <Table.Td><Switch checked={perm.reception} size="xs" readOnly /></Table.Td>
                                <Table.Td><Switch checked={perm.finance} size="xs" readOnly /></Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}

