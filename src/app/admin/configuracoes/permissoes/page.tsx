'use client';

import {
    Title, Text, Stack, SimpleGrid, Card, Badge, Group, ThemeIcon, Button,
    Table, Switch, Loader, Alert, Center,
} from '@mantine/core';
import {
    IconShield, IconKey, IconUsers, IconLock, IconAlertCircle, IconDeviceFloppy,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

const ALL_MODULES = [
    'Marketing', 'Comercial', 'Operacional', 'Pedagógico', 'Financeiro', 'RH', 'Contábil', 'Configurações',
];

const ACTIONS = ['Visualizar', 'Criar', 'Editar', 'Excluir'];

export default function PermissoesPage() {
    const { data: apiData, isLoading, error, refetch } = useApi<any[]>('/api/permissions');
    const { data: rolesData } = useApi<any[]>('/api/positions');
    const [saving, setSaving] = useState(false);

    // Build matrix: module → action → enabled
    const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});

    const permissions = useMemo(() => {
        if (!apiData || !Array.isArray(apiData)) return [];
        return apiData;
    }, [apiData]);

    const roles = useMemo(() => {
        if (!rolesData || !Array.isArray(rolesData)) return [];
        return rolesData;
    }, [rolesData]);

    const totalModules = ALL_MODULES.length;
    const rolesCount = roles.length;
    const permCount = permissions.length || ALL_MODULES.length * ACTIONS.length;

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/permissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matrix }),
            });
            refetch();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    if (isLoading) return <Center h={400}><Loader size="lg" /></Center>;
    if (error) return <Alert icon={<IconAlertCircle />} color="red" title="Erro">{String(error)}</Alert>;

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Configurações</Text>
                    <Title order={2}>Permissões</Title>
                </div>
                <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}>
                    Salvar Alterações
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg"><IconShield size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Módulos</Text>
                            <Text fw={700} size="lg">{totalModules}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg"><IconUsers size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Cargos</Text>
                            <Text fw={700} size="lg">{rolesCount}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="purple" size="lg"><IconKey size={20} /></ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Permissões</Text>
                            <Text fw={700} size="lg">{permCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

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
                        {ALL_MODULES.map((mod) => {
                            const modPerms = permissions.filter((p: any) => p.module === mod);
                            const modActions = modPerms.length > 0
                                ? modPerms.map((p: any) => p.action)
                                : ACTIONS.slice(0, mod === 'Configurações' ? 2 : 3);
                            const modRoles = modPerms.length > 0
                                ? [...new Set(modPerms.map((p: any) => p.roleName || 'Admin'))]
                                : ['Admin'];

                            return (
                                <Table.Tr key={mod}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <IconLock size={14} />
                                            <Text fw={500}>{mod}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {modActions.map((p: string, i: number) => (
                                                <Badge key={i} variant="light" size="xs">{p}</Badge>
                                            ))}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {(modRoles as string[]).map((r: string, i: number) => (
                                                <Badge key={i} variant="outline" size="xs">{r}</Badge>
                                            ))}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Switch defaultChecked={(modRoles as string[]).length <= 2} size="sm" />
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Card>
        </Stack>
    );
}
