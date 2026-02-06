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
} from '@mantine/core';
import {
    IconShield,
    IconPlus,
    IconKey,
    IconUsers,
    IconCheck,
    IconLock,
} from '@tabler/icons-react';

// Demo permissions modules
const modules = [
    { id: 1, name: 'Marketing', permissions: ['Visualizar', 'Editar', 'Criar'], roles: ['Admin', 'Marketing'] },
    { id: 2, name: 'Comercial', permissions: ['Visualizar', 'Editar', 'Criar'], roles: ['Admin', 'Comercial'] },
    { id: 3, name: 'Operacional', permissions: ['Visualizar', 'Editar', 'Criar'], roles: ['Admin', 'Operacional', 'Professor'] },
    { id: 4, name: 'Financeiro', permissions: ['Visualizar', 'Editar', 'Criar', 'Excluir'], roles: ['Admin', 'Financeiro'] },
    { id: 5, name: 'Pedagógico', permissions: ['Visualizar', 'Editar'], roles: ['Admin', 'Professor', 'Coordenador'] },
    { id: 6, name: 'RH', permissions: ['Visualizar', 'Editar', 'Criar'], roles: ['Admin', 'RH'] },
    { id: 7, name: 'Contábil', permissions: ['Visualizar', 'Editar'], roles: ['Admin', 'Contador'] },
    { id: 8, name: 'Configurações', permissions: ['Visualizar', 'Editar'], roles: ['Admin'] },
];

export default function PermissoesPage() {
    const totalModules = modules.length;
    const rolesCount = new Set(modules.flatMap(m => m.roles)).size;

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Permissões</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Permissão
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconShield size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Módulos</Text>
                            <Text fw={700} size="lg">{totalModules}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Cargos</Text>
                            <Text fw={700} size="lg">{rolesCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg">
                            <IconKey size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Permissões</Text>
                            <Text fw={700} size="lg">{modules.reduce((sum, m) => sum + m.permissions.length, 0)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Permissions Matrix */}
            <Card withBorder p="md">
                <Text fw={500} mb="md">Matriz de Permissões por Módulo</Text>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Módulo</Table.Th>
                            <Table.Th>Permissões</Table.Th>
                            <Table.Th>Cargos com Acesso</Table.Th>
                            <Table.Th>Restrito</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {modules.map((mod) => (
                            <Table.Tr key={mod.id}>
                                <Table.Td>
                                    <Group gap="xs">
                                        <IconLock size={14} />
                                        <Text fw={500}>{mod.name}</Text>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        {mod.permissions.map((p, i) => (
                                            <Badge key={i} variant="light" size="xs">{p}</Badge>
                                        ))}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4}>
                                        {mod.roles.map((r, i) => (
                                            <Badge key={i} variant="outline" size="xs">{r}</Badge>
                                        ))}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Switch defaultChecked={mod.roles.length <= 2} size="sm" />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}

