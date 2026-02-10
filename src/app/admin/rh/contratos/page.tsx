'use client';

import { useState } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    TextInput, Table, Avatar, Loader, Center, Paper, SimpleGrid,
    ThemeIcon, Select, Tabs, ActionIcon, Menu, Tooltip, Alert,
} from '@mantine/core';
import {
    IconFileText, IconSearch, IconFilter, IconUsers,
    IconClock, IconCalendar, IconDots, IconEye,
    IconBriefcase, IconCurrencyReal, IconCheck, IconX,
    IconAlertTriangle, IconRefresh,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';
import { useApi } from '@/hooks/useApi';

// ============================================================================
// TYPES
// ============================================================================

interface StaffContract {
    id: string;
    personId: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    jobTitle: string;
    department: string;
    contractType: string;
    salaryCents: number | null;
    hourlyRateCents: number | null;
    weeklyHours: number;
    accessLevel: string;
    startsAt: number | null;
    endsAt: number | null;
    status: string;
    createdAt: number | null;
}

const departmentLabels: Record<string, string> = {
    admin: 'Administrativo',
    reception: 'Recepção',
    marketing: 'Marketing',
    finance: 'Financeiro',
    maintenance: 'Manutenção',
    it: 'TI',
    management: 'Gerência',
    academic: 'Acadêmico',
    other: 'Outros',
};

const contractTypeLabels: Record<string, string> = {
    clt: 'CLT',
    pj: 'PJ',
    freelance: 'Freelance',
    intern: 'Estagiário',
    volunteer: 'Voluntário',
};

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'green' },
    suspended: { label: 'Suspenso', color: 'orange' },
    terminated: { label: 'Encerrado', color: 'red' },
    pending: { label: 'Pendente', color: 'yellow' },
};

// ============================================================================
// PAGE
// ============================================================================

export default function ContratosPage() {
    const { data: contractsData, isLoading: loading, refetch } = useApi<StaffContract[]>('/api/staff-contracts');
    const contracts = contractsData || [];
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('all');

    const filtered = contracts.filter(c => {
        const matchesSearch = !search ||
            (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
            c.jobTitle.toLowerCase().includes(search.toLowerCase());
        const matchesTab = activeTab === 'all' || c.contractType === activeTab;
        return matchesSearch && matchesTab;
    });

    const stats = {
        total: contracts.length,
        active: contracts.filter(c => c.status === 'active').length,
        clt: contracts.filter(c => c.contractType === 'clt').length,
        pj: contracts.filter(c => c.contractType === 'pj').length,
    };

    const formatCurrency = (cents: number | null) => {
        if (!cents) return '–';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    };

    const formatDate = (ts: number | null) => {
        if (!ts) return '–';
        return new Date(ts * 1000).toLocaleDateString('pt-BR');
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">RH & Pessoas</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Contratos de Trabalho</Text>
                    </Group>
                    <Group justify="space-between" align="flex-end">
                        <div>
                            <Title order={1}>Contratos de Trabalho</Title>
                            <Text c="dimmed" mt="xs">Gerenciamento de contratos CLT, PJ e temporários.</Text>
                        </div>
                        <Group>
                            <ExportButton
                                data={filtered.map(c => ({
                                    nome: c.name || '–',
                                    email: c.email || '–',
                                    cargo: c.jobTitle,
                                    departamento: departmentLabels[c.department] || c.department,
                                    tipo: contractTypeLabels[c.contractType] || c.contractType,
                                    salario: formatCurrency(c.salaryCents),
                                    horasSemanais: c.weeklyHours,
                                    status: statusConfig[c.status]?.label || c.status,
                                    inicio: formatDate(c.startsAt),
                                }))}
                                columns={[
                                    { key: 'nome', label: 'Nome' },
                                    { key: 'email', label: 'Email' },
                                    { key: 'cargo', label: 'Cargo' },
                                    { key: 'departamento', label: 'Departamento' },
                                    { key: 'tipo', label: 'Tipo' },
                                    { key: 'salario', label: 'Salário' },
                                    { key: 'horasSemanais', label: 'Horas/Sem' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'inicio', label: 'Início' },
                                ]}
                                title="Contratos de Trabalho"
                                filename="contratos_trabalho"
                                formats={['csv', 'xlsx', 'pdf']}
                                label="Exportar"
                            />
                            <Tooltip label="Atualizar">
                                <ActionIcon variant="subtle" onClick={refetch} size="lg">
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Group>
                </div>

                {/* Stats  */}
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="blue">
                                <IconFileText size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                        </Group>
                    </Card>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="green">
                                <IconCheck size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Ativos</Text>
                                <Text size="xl" fw={700}>{stats.active}</Text>
                            </div>
                        </Group>
                    </Card>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="violet">
                                <IconBriefcase size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>CLT</Text>
                                <Text size="xl" fw={700}>{stats.clt}</Text>
                            </div>
                        </Group>
                    </Card>
                    <Card withBorder radius="md" p="md">
                        <Group>
                            <ThemeIcon size={40} radius="md" variant="light" color="orange">
                                <IconCurrencyReal size={20} />
                            </ThemeIcon>
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>PJ</Text>
                                <Text size="xl" fw={700}>{stats.pj}</Text>
                            </div>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Filters */}
                <Group>
                    <TextInput
                        placeholder="Buscar por nome, email ou cargo..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ flex: 1, maxWidth: 400 }}
                    />
                    <Select
                        placeholder="Status"
                        leftSection={<IconFilter size={16} />}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={[
                            { value: 'active', label: 'Ativos' },
                            { value: 'suspended', label: 'Suspensos' },
                            { value: 'terminated', label: 'Encerrados' },
                        ]}
                        clearable
                        w={160}
                    />
                    <Select
                        placeholder="Departamento"
                        leftSection={<IconUsers size={16} />}
                        value={departmentFilter}
                        onChange={setDepartmentFilter}
                        data={Object.entries(departmentLabels).map(([value, label]) => ({ value, label }))}
                        clearable
                        w={180}
                    />
                </Group>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="all">Todos ({contracts.length})</Tabs.Tab>
                        <Tabs.Tab value="clt">CLT ({stats.clt})</Tabs.Tab>
                        <Tabs.Tab value="pj">PJ ({stats.pj})</Tabs.Tab>
                        <Tabs.Tab value="freelance">Freelance</Tabs.Tab>
                        <Tabs.Tab value="intern">Estagiários</Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                {/* Table */}
                {loading ? (
                    <Center py="xl">
                        <Loader size="lg" />
                    </Center>
                ) : filtered.length === 0 ? (
                    <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                        <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                            <IconFileText size={24} />
                        </ThemeIcon>
                        <Text fw={500} mb="xs">Nenhum contrato encontrado</Text>
                        <Text size="sm" c="dimmed">Ajuste os filtros ou adicione novos contratos</Text>
                    </Paper>
                ) : (
                    <Card withBorder radius="md" p={0}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Funcionário</Table.Th>
                                    <Table.Th>Cargo</Table.Th>
                                    <Table.Th>Departamento</Table.Th>
                                    <Table.Th>Tipo</Table.Th>
                                    <Table.Th>Salário</Table.Th>
                                    <Table.Th>Horas/Sem</Table.Th>
                                    <Table.Th>Início</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th w={50}></Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.map(contract => (
                                    <Table.Tr key={contract.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar
                                                    size={32}
                                                    radius="xl"
                                                    src={contract.avatarUrl}
                                                    color="violet"
                                                >
                                                    {(contract.name || '?')[0]}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>{contract.name || '–'}</Text>
                                                    <Text size="xs" c="dimmed">{contract.email || '–'}</Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{contract.jobTitle}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" size="sm">
                                                {departmentLabels[contract.department] || contract.department}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                variant="outline"
                                                size="sm"
                                                color={contract.contractType === 'clt' ? 'violet' : 'orange'}
                                            >
                                                {contractTypeLabels[contract.contractType] || contract.contractType}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>
                                                {formatCurrency(contract.salaryCents)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{contract.weeklyHours}h</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{formatDate(contract.startsAt)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                variant="light"
                                                color={statusConfig[contract.status]?.color || 'gray'}
                                                size="sm"
                                            >
                                                {statusConfig[contract.status]?.label || contract.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Menu position="bottom-end" withArrow>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" color="gray">
                                                        <IconDots size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<IconEye size={14} />}>
                                                        Ver Detalhes
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>
                )}

                {/* CLT Compliance Alert */}
                <Alert
                    icon={<IconFileText size={16} />}
                    color="violet"
                    variant="light"
                    title="Obrigações Contratuais — CLT"
                >
                    <Text size="xs">
                        <strong>Contrato por prazo determinado (CLT Art. 445):</strong> Máximo 2 anos, incluindo prorrogação.
                        Exceção: contrato de experiência = máx 90 dias.
                        <strong> eSocial:</strong> Evento S-2200 (admissão) deve ser enviado até a véspera do início das atividades.
                        <strong> FGTS (Lei 8.036/90):</strong> Depósito de 8% sobre remuneração para todos os CLT.
                        <strong> Exame admissional (NR-7):</strong> Obrigatório antes do início das atividades.
                    </Text>
                </Alert>
            </Stack>
        </Container>
    );
}
