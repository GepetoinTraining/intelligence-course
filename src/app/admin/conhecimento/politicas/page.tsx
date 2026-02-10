'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Table,
    Button,
    SimpleGrid,
    ThemeIcon,
    ActionIcon,
    Menu,
    TextInput,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconScale,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconSearch,
    IconFileText,
    IconCheck,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Policy {
    id: string;
    code: string;
    title: string;
    category: string;
    version: string;
    effectiveDate: string;
    status: 'active' | 'pending' | 'expired';
    mandatory: boolean;
}

// Mock data
const mockPolicies: Policy[] = [
    { id: '1', code: 'POL-001', title: 'Política de Privacidade', category: 'Legal', version: '2.0', effectiveDate: '2025-01-01', status: 'active', mandatory: true },
    { id: '2', code: 'POL-002', title: 'Código de Conduta', category: 'RH', version: '1.5', effectiveDate: '2024-06-01', status: 'active', mandatory: true },
    { id: '3', code: 'POL-003', title: 'Política de Reembolso', category: 'Financeiro', version: '1.2', effectiveDate: '2025-03-01', status: 'active', mandatory: false },
    { id: '4', code: 'POL-004', title: 'Política de Home Office', category: 'RH', version: '1.0', effectiveDate: '2026-03-01', status: 'pending', mandatory: false },
    { id: '5', code: 'POL-005', title: 'Termos de Uso', category: 'Legal', version: '3.1', effectiveDate: '2025-01-15', status: 'active', mandatory: true },
];

const statusColors: Record<string, string> = {
    active: 'green',
    pending: 'yellow',
    expired: 'red',
};

const statusLabels: Record<string, string> = {
    active: 'Vigente',
    pending: 'Aguardando',
    expired: 'Expirada',
};

export default function PoliticasPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/wiki/articles?category=policy');

    const [policies] = useState<Policy[]>(mockPolicies);
    const [search, setSearch] = useState('');

    const filtered = policies.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = policies.filter(p => p.status === 'active').length;
    const mandatoryCount = policies.filter(p => p.mandatory).length;


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Conhecimento</Text>
                    <Title order={2}>Políticas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Política
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconScale size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Políticas</Text>
                            <Text fw={700} size="xl">{policies.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Vigentes</Text>
                            <Text fw={700} size="xl">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="red" size="lg" radius="md">
                            <IconFileText size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Obrigatórias</Text>
                            <Text fw={700} size="xl">{mandatoryCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconEdit size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Última Revisão</Text>
                            <Text fw={700} size="xl">Jan 2026</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Group justify="space-between" mb="md">
                    <Title order={4}>Todas as Políticas</Title>
                    <TextInput
                        placeholder="Buscar..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        w={250}
                    />
                </Group>

                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Título</Table.Th>
                            <Table.Th>Categoria</Table.Th>
                            <Table.Th>Versão</Table.Th>
                            <Table.Th>Vigência</Table.Th>
                            <Table.Th>Obrigatória</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((policy) => (
                            <Table.Tr key={policy.id}>
                                <Table.Td>
                                    <Text fw={500}>{policy.code}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{policy.title}</Text>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="light" color="gray">{policy.category}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Badge variant="outline" size="sm">v{policy.version}</Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Text size="sm">{new Date(policy.effectiveDate).toLocaleDateString('pt-BR')}</Text>
                                </Table.Td>
                                <Table.Td>
                                    {policy.mandatory ? (
                                        <Badge color="red" variant="light">Sim</Badge>
                                    ) : (
                                        <Text size="sm" c="dimmed">Não</Text>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <Badge color={statusColors[policy.status]} variant="light">
                                        {statusLabels[policy.status]}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Menu position="bottom-end" withArrow>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray">
                                                <IconDotsVertical size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item leftSection={<IconEye size={14} />}>Visualizar</Menu.Item>
                                            <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>
        </div>
    );
}

