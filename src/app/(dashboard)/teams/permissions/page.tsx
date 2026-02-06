'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Title, Text, Stack, Group, Card, Badge, Button,
    Paper, SimpleGrid, ThemeIcon, Skeleton, Divider,
    Table, Checkbox, Select, Tabs, Accordion, Tooltip,
    ActionIcon, Modal, TextInput, Textarea, SegmentedControl,
    Notification, rem, Loader
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconShield, IconPlus, IconSearch, IconCheck, IconX,
    IconArrowLeft, IconAlertCircle, IconDeviceFloppy,
    IconSettings, IconUser, IconUsers, IconFilter, IconRefresh
} from '@tabler/icons-react';
import Link from 'next/link';

interface ActionType {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string;
    subcategory: string | null;
    riskLevel: string;
    requiresApproval: boolean;
    isSystem: boolean;
}

interface Position {
    id: string;
    name: string;
    slug: string;
    level: number;
    positionType: string;
    permissions?: {
        actionTypeId: string;
        scope: string;
        canDelegate: boolean;
    }[];
}

const RISK_COLORS: Record<string, string> = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    critical: 'red',
};

const SCOPE_LABELS: Record<string, string> = {
    own: 'Próprio',
    team: 'Equipe',
    department: 'Departamento',
    organization: 'Organização',
    global: 'Global',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    wiki: <IconShield size={16} />,
    kaizen: <IconShield size={16} />,
    crm: <IconShield size={16} />,
    finance: <IconShield size={16} />,
    hr: <IconUsers size={16} />,
    academic: <IconShield size={16} />,
    system: <IconSettings size={16} />,
};

export default function PermissionsPage() {
    const [actions, setActions] = useState<ActionType[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Permission matrix state - original from server
    const [originalMatrix, setOriginalMatrix] = useState<Record<string, Record<string, { enabled: boolean; scope: string }>>>({});
    // Permission matrix state - current local state
    const [permissionMatrix, setPermissionMatrix] = useState<Record<string, Record<string, { enabled: boolean; scope: string }>>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [actionsRes, positionsRes] = await Promise.all([
                fetch('/api/actions'),
                fetch('/api/positions?includePermissions=true'),
            ]);

            if (actionsRes.ok) {
                const data = await actionsRes.json();
                setActions(data.data || []);
            }
            if (positionsRes.ok) {
                const data = await positionsRes.json();
                setPositions(data.data || []);
                buildPermissionMatrix(data.data || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const buildPermissionMatrix = (positionList: Position[]) => {
        const matrix: Record<string, Record<string, { enabled: boolean; scope: string }>> = {};

        positionList.forEach(position => {
            matrix[position.id] = {};
            position.permissions?.forEach(perm => {
                matrix[position.id][perm.actionTypeId] = {
                    enabled: true,
                    scope: perm.scope,
                };
            });
        });

        setPermissionMatrix(matrix);
        setOriginalMatrix(JSON.parse(JSON.stringify(matrix))); // Deep clone
        setHasChanges(false);
    };

    const hasPermission = (positionId: string, actionId: string): boolean => {
        return permissionMatrix[positionId]?.[actionId]?.enabled || false;
    };

    const getPermissionScope = (positionId: string, actionId: string): string => {
        return permissionMatrix[positionId]?.[actionId]?.scope || 'team';
    };

    const togglePermission = (positionId: string, actionId: string) => {
        const current = hasPermission(positionId, actionId);
        const currentScope = getPermissionScope(positionId, actionId);

        // Optimistic update
        setPermissionMatrix(prev => ({
            ...prev,
            [positionId]: {
                ...prev[positionId],
                [actionId]: { enabled: !current, scope: currentScope || 'team' },
            }
        }));
        setHasChanges(true);
        queueAutoSave(positionId);
    };

    const updateScope = (positionId: string, actionId: string, scope: string) => {
        setPermissionMatrix(prev => ({
            ...prev,
            [positionId]: {
                ...prev[positionId],
                [actionId]: { ...prev[positionId]?.[actionId], scope },
            }
        }));
        setHasChanges(true);
        queueAutoSave(positionId);
    };

    // Debounced auto-save
    const queueAutoSave = useCallback((positionId: string) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            savePermissions(positionId);
        }, 1500); // Save 1.5s after last change
    }, []);

    const savePermissions = async (positionId: string) => {
        setSaving(true);
        try {
            const positionPerms = permissionMatrix[positionId] || {};
            const permissions = actions.map(action => ({
                actionTypeId: action.id,
                scope: positionPerms[action.id]?.scope || 'team',
                canDelegate: false,
                enabled: positionPerms[action.id]?.enabled || false,
            }));

            const res = await fetch('/api/position-permissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ positionId, permissions }),
            });

            if (!res.ok) throw new Error('Failed to save');

            const data = await res.json();

            // Update original matrix to reflect saved state
            setOriginalMatrix(prev => ({
                ...prev,
                [positionId]: JSON.parse(JSON.stringify(permissionMatrix[positionId])),
            }));
            setHasChanges(false);

            notifications.show({
                title: 'Permissões Salvas',
                message: `${data.created || 0} criadas, ${data.updated || 0} atualizadas, ${data.deleted || 0} removidas`,
                color: 'green',
                icon: <IconCheck size={16} />,
            });
        } catch (error) {
            console.error('Save error:', error);
            notifications.show({
                title: 'Erro ao Salvar',
                message: 'Não foi possível salvar as permissões. Tente novamente.',
                color: 'red',
                icon: <IconX size={16} />,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleManualSave = () => {
        if (selectedPosition && hasChanges) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            savePermissions(selectedPosition);
        }
    };

    // Group actions by category
    const groupedActions = actions.reduce((acc, action) => {
        if (!acc[action.category]) acc[action.category] = [];
        acc[action.category].push(action);
        return acc;
    }, {} as Record<string, ActionType[]>);

    const categories = Object.keys(groupedActions).sort();

    // Filter actions
    const filteredActions = actions.filter(a => {
        if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
        if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    if (loading) {
        return (
            <Stack gap="xl">
                <Group justify="space-between">
                    <div>
                        <Title order={2}>🔐 Gerenciamento de Permissões</Title>
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
                    <Title order={2}>🔐 Gerenciamento de Permissões</Title>
                    <Text c="dimmed">Defina o que cada função pode fazer no sistema</Text>
                </div>
                <Group>
                    {selectedPosition && (
                        <Button
                            variant="filled"
                            color="green"
                            leftSection={saving ? <Loader size={16} color="white" /> : <IconDeviceFloppy size={16} />}
                            onClick={handleManualSave}
                            disabled={!hasChanges || saving}
                        >
                            {saving ? 'Salvando...' : hasChanges ? 'Salvar Alterações' : 'Salvo'}
                        </Button>
                    )}
                    <Button
                        variant="subtle"
                        leftSection={<IconRefresh size={16} />}
                        onClick={loadData}
                        disabled={loading}
                    >
                        Recarregar
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

            {/* Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="violet">
                            <IconShield size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>{actions.length}</Text>
                            <Text size="sm" c="dimmed">Ações</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="blue">
                            <IconUsers size={20} />
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
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>
                                {Object.values(permissionMatrix).reduce(
                                    (sum, perms) => sum + Object.values(perms).filter(p => p.enabled).length, 0
                                )}
                            </Text>
                            <Text size="sm" c="dimmed">Permissões Ativas</Text>
                        </div>
                    </Group>
                </Paper>
                <Paper shadow="xs" radius="md" p="md" withBorder>
                    <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color="orange">
                            <IconAlertCircle size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xl" fw={700}>
                                {actions.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length}
                            </Text>
                            <Text size="sm" c="dimmed">Alto Risco</Text>
                        </div>
                    </Group>
                </Paper>
            </SimpleGrid>

            {/* Filters */}
            <Card shadow="xs" radius="md" p="md" withBorder>
                <Group gap="md">
                    <TextInput
                        placeholder="Buscar ações..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        w={250}
                    />
                    <Select
                        placeholder="Categoria"
                        leftSection={<IconFilter size={16} />}
                        data={[
                            { value: 'all', label: 'Todas Categorias' },
                            ...categories.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))
                        ]}
                        value={categoryFilter}
                        onChange={(v) => setCategoryFilter(v || 'all')}
                        w={180}
                    />
                    <Select
                        placeholder="Selecionar Função"
                        leftSection={<IconUser size={16} />}
                        data={positions.map(p => ({
                            value: p.id,
                            label: `${p.name} (Nv. ${p.level})`,
                        }))}
                        value={selectedPosition}
                        onChange={setSelectedPosition}
                        w={220}
                        clearable
                    />
                </Group>
            </Card>

            {/* Permission Matrix */}
            {selectedPosition ? (
                <Card shadow="xs" radius="md" p="md" withBorder>
                    <Group justify="space-between" mb="md">
                        <Text fw={500}>
                            Permissões: {positions.find(p => p.id === selectedPosition)?.name}
                        </Text>
                        <Badge>
                            {Object.values(permissionMatrix[selectedPosition] || {}).filter(p => p.enabled).length} ativas
                        </Badge>
                    </Group>

                    <Accordion variant="separated">
                        {categories.filter(cat => categoryFilter === 'all' || cat === categoryFilter).map(category => {
                            const categoryActions = groupedActions[category].filter(a =>
                                !searchQuery ||
                                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                a.code.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (categoryActions.length === 0) return null;

                            const enabledCount = categoryActions.filter(a =>
                                hasPermission(selectedPosition, a.id)
                            ).length;

                            return (
                                <Accordion.Item key={category} value={category}>
                                    <Accordion.Control>
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                {CATEGORY_ICONS[category] || <IconShield size={16} />}
                                                <Text fw={500}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                                            </Group>
                                            <Badge size="sm" variant="light">
                                                {enabledCount}/{categoryActions.length}
                                            </Badge>
                                        </Group>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Table verticalSpacing="xs">
                                            <Table.Tbody>
                                                {categoryActions.map(action => {
                                                    const enabled = hasPermission(selectedPosition, action.id);

                                                    return (
                                                        <Table.Tr key={action.id}>
                                                            <Table.Td w={50}>
                                                                <Checkbox
                                                                    checked={enabled}
                                                                    onChange={() => togglePermission(selectedPosition, action.id)}
                                                                />
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <div>
                                                                    <Text size="sm" fw={500}>{action.name}</Text>
                                                                    <Text size="xs" c="dimmed" ff="monospace">{action.code}</Text>
                                                                </div>
                                                            </Table.Td>
                                                            <Table.Td w={100}>
                                                                <Badge
                                                                    size="xs"
                                                                    variant="light"
                                                                    color={RISK_COLORS[action.riskLevel]}
                                                                >
                                                                    {action.riskLevel}
                                                                </Badge>
                                                            </Table.Td>
                                                            <Table.Td w={100}>
                                                                {action.requiresApproval && (
                                                                    <Tooltip label="Requer aprovação">
                                                                        <Badge size="xs" color="orange" variant="dot">
                                                                            Aprovação
                                                                        </Badge>
                                                                    </Tooltip>
                                                                )}
                                                            </Table.Td>
                                                            <Table.Td w={120}>
                                                                {enabled && (
                                                                    <Select
                                                                        size="xs"
                                                                        data={Object.entries(SCOPE_LABELS).map(([v, l]) => ({
                                                                            value: v, label: l
                                                                        }))}
                                                                        value={getPermissionScope(selectedPosition, action.id)}
                                                                        onChange={(v) => v && updateScope(selectedPosition, action.id, v)}
                                                                        w={120}
                                                                    />
                                                                )}
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    );
                                                })}
                                            </Table.Tbody>
                                        </Table>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            );
                        })}
                    </Accordion>
                </Card>
            ) : (
                // Overview: show all actions by category
                <Card shadow="xs" radius="md" p="md" withBorder>
                    <Text fw={500} mb="md">Todas as Ações do Sistema</Text>
                    <Text size="sm" c="dimmed" mb="md">
                        Selecione uma função acima para gerenciar suas permissões
                    </Text>

                    <Accordion variant="separated">
                        {categories.filter(cat => categoryFilter === 'all' || cat === categoryFilter).map(category => {
                            const categoryActions = groupedActions[category].filter(a =>
                                !searchQuery ||
                                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                a.code.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (categoryActions.length === 0) return null;

                            return (
                                <Accordion.Item key={category} value={category}>
                                    <Accordion.Control>
                                        <Group gap="sm">
                                            {CATEGORY_ICONS[category] || <IconShield size={16} />}
                                            <Text fw={500}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                                            <Badge size="sm" variant="light">{categoryActions.length}</Badge>
                                        </Group>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Table verticalSpacing="xs">
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Ação</Table.Th>
                                                    <Table.Th>Código</Table.Th>
                                                    <Table.Th>Risco</Table.Th>
                                                    <Table.Th>Flags</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {categoryActions.map(action => (
                                                    <Table.Tr key={action.id}>
                                                        <Table.Td>
                                                            <Text size="sm" fw={500}>{action.name}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Text size="xs" c="dimmed" ff="monospace">{action.code}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                size="xs"
                                                                variant="light"
                                                                color={RISK_COLORS[action.riskLevel]}
                                                            >
                                                                {action.riskLevel}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Group gap={4}>
                                                                {action.requiresApproval && (
                                                                    <Badge size="xs" color="orange" variant="dot">
                                                                        Aprovação
                                                                    </Badge>
                                                                )}
                                                                {action.isSystem && (
                                                                    <Badge size="xs" color="gray" variant="dot">
                                                                        Sistema
                                                                    </Badge>
                                                                )}
                                                            </Group>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            );
                        })}
                    </Accordion>
                </Card>
            )}
        </Stack>
    );
}

