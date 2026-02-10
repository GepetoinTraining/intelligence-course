'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Loader, Alert, Paper, Select,
} from '@mantine/core';
import {
    IconAlertCircle, IconHierarchy, IconUsers, IconUser,
    IconShieldCheck, IconChevronRight,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Role {
    id: string;
    name: string;
    slug: string;
    description?: string;
    hierarchyLevel: number;
    category: string;
    department?: string;
    permissions: string[];
    icon?: string;
    color?: string;
    canHaveReports: boolean;
    isActive: boolean;
    isSystemRole: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    executive: 'red', director: 'orange', coordinator: 'violet',
    manager: 'blue', specialist: 'teal', staff: 'gray',
    educator: 'green', support: 'yellow',
};
const CATEGORY_LABELS: Record<string, string> = {
    executive: 'Executivo', director: 'Diretor', coordinator: 'Coordenador',
    manager: 'Gerente', specialist: 'Especialista', staff: 'Colaborador',
    educator: 'Educador', support: 'Suporte',
};

export default function OrganogramaPage() {
    const { data: apiData, isLoading: loading, error } = useApi<{ roles: Role[] }>('/api/roles?includeInactive=true');
    const roles = apiData?.roles || (Array.isArray(apiData) ? apiData : []);
    const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);

    const departments = useMemo(() => {
        const depts = new Set<string>();
        roles.forEach(r => { if (r.department) depts.add(r.department); });
        return Array.from(depts).sort();
    }, [roles]);

    const filteredRoles = useMemo(() => {
        let list = roles;
        if (departmentFilter) list = list.filter(r => r.department === departmentFilter);
        return list.sort((a, b) => b.hierarchyLevel - a.hierarchyLevel);
    }, [roles, departmentFilter]);

    const stats = useMemo(() => {
        const active = roles.filter(r => r.isActive).length;
        const byCategory = new Map<string, number>();
        roles.forEach(r => { byCategory.set(r.category, (byCategory.get(r.category) || 0) + 1); });
        const categories = Array.from(byCategory.entries())
            .map(([cat, count]) => ({ cat, label: CATEGORY_LABELS[cat] || cat, count }))
            .sort((a, b) => b.count - a.count);
        return { total: roles.length, active, departments: departments.length, categories };
    }, [roles, departments]);

    // Group by hierarchy level for tree-like display
    const hierarchyLevels = useMemo(() => {
        const levels = new Map<number, Role[]>();
        filteredRoles.forEach(r => {
            const existing = levels.get(r.hierarchyLevel) || [];
            existing.push(r);
            levels.set(r.hierarchyLevel, existing);
        });
        return Array.from(levels.entries()).sort((a, b) => b[0] - a[0]);
    }, [filteredRoles]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando organograma...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">RH & Pessoas</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Organograma</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Organograma</Title>
                        <Select
                            size="sm"
                            placeholder="Filtrar Departamento"
                            clearable
                            value={departmentFilter}
                            onChange={setDepartmentFilter}
                            data={departments.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))}
                            w={200}
                        />
                    </Group>
                    <Text c="dimmed" mt="xs">Estrutura hierárquica de cargos e funções da organização.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Cargos</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconHierarchy size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ativos</Text>
                                <Text size="xl" fw={700} c="green">{stats.active}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconShieldCheck size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Departamentos</Text>
                                <Text size="xl" fw={700}>{stats.departments}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconUsers size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Categorias</Text>
                                <Text size="xl" fw={700}>{stats.categories.length}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="orange">
                                <IconUser size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Category Badges */}
                {stats.categories.length > 0 && (
                    <Card withBorder padding="lg" radius="md">
                        <Text fw={600} mb="md">Distribuição por Categoria</Text>
                        <Group gap="md">
                            {stats.categories.map(c => (
                                <Badge key={c.cat} size="lg" variant="light" color={CATEGORY_COLORS[c.cat] || 'gray'}>
                                    {c.label}: {c.count}
                                </Badge>
                            ))}
                        </Group>
                    </Card>
                )}

                {/* Hierarchy Tree */}
                {hierarchyLevels.length === 0 ? (
                    <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                        <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                            <IconHierarchy size={32} />
                        </ThemeIcon>
                        <Title order={3} mb="xs">Nenhum cargo cadastrado</Title>
                        <Text c="dimmed">Configure os cargos da organização para visualizar o organograma.</Text>
                    </Paper>
                ) : (
                    <Stack gap="md">
                        {hierarchyLevels.map(([level, levelRoles]) => (
                            <Card key={level} withBorder padding="md" radius="md">
                                <Group mb="md">
                                    <Badge variant="filled" color="blue" size="lg">Nível {level}</Badge>
                                    <Text size="sm" c="dimmed">{levelRoles.length} cargo{levelRoles.length > 1 ? 's' : ''}</Text>
                                </Group>
                                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                                    {levelRoles.map(role => (
                                        <Paper
                                            key={role.id}
                                            withBorder
                                            p="md"
                                            radius="md"
                                            style={{
                                                opacity: role.isActive ? 1 : 0.5,
                                                borderLeft: `4px solid var(--mantine-color-${role.color || 'blue'}-5)`,
                                            }}
                                        >
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm" fw={600}>{role.name}</Text>
                                                {role.isSystemRole && <Badge size="xs" variant="filled" color="red">Sistema</Badge>}
                                            </Group>
                                            {role.description && (
                                                <Text size="xs" c="dimmed" lineClamp={2} mb="xs">{role.description}</Text>
                                            )}
                                            <Group gap={4} mt="xs">
                                                <Badge size="xs" variant="light" color={CATEGORY_COLORS[role.category] || 'gray'}>
                                                    {CATEGORY_LABELS[role.category] || role.category}
                                                </Badge>
                                                {role.department && (
                                                    <Badge size="xs" variant="outline">{role.department}</Badge>
                                                )}
                                                {!role.isActive && <Badge size="xs" color="red" variant="light">Inativo</Badge>}
                                            </Group>
                                            {role.permissions.length > 0 && (
                                                <Group gap={4} mt="xs">
                                                    <IconShieldCheck size={12} color="gray" />
                                                    <Text size="xs" c="dimmed">{role.permissions.length} permissões</Text>
                                                </Group>
                                            )}
                                            {role.canHaveReports && (
                                                <Group gap={4} mt={4}>
                                                    <IconChevronRight size={12} color="gray" />
                                                    <Text size="xs" c="dimmed">Permite subordinados diretos</Text>
                                                </Group>
                                            )}
                                        </Paper>
                                    ))}
                                </SimpleGrid>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Headcount Alert */}
                <Alert
                    icon={<IconHierarchy size={16} />}
                    color="indigo"
                    variant="light"
                    title="Estrutura Organizacional — Compliance"
                >
                    <Text size="xs">
                        <strong>eSocial S-2200/S-2300:</strong> Toda movimentação de cargo/função deve ser refletida nos eventos eSocial.
                        <strong> CLT Art. 468:</strong> Alteração de função só é lícita com consentimento mútuo e sem prejuízo ao empregado.
                        <strong> Headcount:</strong> Mantenha o organograma atualizado para planejamento de headcount e orçamento de folha.
                    </Text>
                </Alert>
            </Stack>
        </Container>
    );
}
