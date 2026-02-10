'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Container, Title, Text, Card, Group, Stack, Badge, Button,
    SimpleGrid, ThemeIcon, Table, Paper, Select, Loader, Center,
    TextInput, ActionIcon, Tooltip, Progress, Avatar,
} from '@mantine/core';
import {
    IconChartBar, IconSearch, IconFilter, IconUsers,
    IconTargetArrow, IconTrendingUp, IconPhone,
    IconMail, IconCalendar, IconRefresh,
    IconEye, IconBrandWhatsapp,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    source: string | null;
    status: string;
    interestedIn: string | null;
    currentLevel: string | null;
    assignedTo: string | null;
    createdAt: number | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    new: { label: 'Novo', color: 'blue' },
    contacted: { label: 'Contactado', color: 'cyan' },
    qualified: { label: 'Qualificado', color: 'green' },
    proposal: { label: 'Proposta', color: 'violet' },
    negotiation: { label: 'Negociação', color: 'orange' },
    enrolled: { label: 'Matriculado', color: 'teal' },
    lost: { label: 'Perdido', color: 'red' },
    nurturing: { label: 'Nutrição', color: 'yellow' },
};

const sourceLabels: Record<string, string> = {
    website: 'Website',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    google: 'Google Ads',
    referral: 'Indicação',
    walk_in: 'Presencial',
    phone: 'Telefone',
    event: 'Evento',
    other: 'Outros',
};

// ============================================================================
// PAGE
// ============================================================================

export default function RelatorioComercialPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ limit: '100' });
            if (statusFilter) params.set('status', statusFilter);
            if (sourceFilter) params.set('source', sourceFilter);

            const res = await fetch(`/api/leads?${params.toString()}`);
            const json = await res.json();
            if (json.data) setLeads(json.data);
        } catch (err) {
            console.error('Error fetching leads:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sourceFilter]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const filtered = leads.filter(l =>
        !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.email || '').toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        enrolled: leads.filter(l => l.status === 'enrolled').length,
        lost: leads.filter(l => l.status === 'lost').length,
    };

    const conversionRate = stats.total > 0
        ? Math.round((stats.enrolled / stats.total) * 100)
        : 0;

    // Source breakdown
    const sourceCounts = leads.reduce((acc, l) => {
        const src = l.source || 'other';
        acc[src] = (acc[src] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topSources = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

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
                        <Text size="sm" c="dimmed">Relatórios & BI</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Relatório Comercial</Text>
                    </Group>
                    <Group justify="space-between" align="flex-end">
                        <div>
                            <Title order={1}>Relatório Comercial</Title>
                            <Text c="dimmed" mt="xs">Análise de desempenho comercial, conversões e funil de leads.</Text>
                        </div>
                        <Group>
                            <ExportButton
                                data={filtered.map(l => ({
                                    nome: l.name,
                                    email: l.email || '–',
                                    telefone: l.phone || '–',
                                    fonte: sourceLabels[l.source || ''] || l.source || '–',
                                    status: statusConfig[l.status]?.label || l.status,
                                    data: formatDate(l.createdAt),
                                }))}
                                columns={[
                                    { key: 'nome', label: 'Nome' },
                                    { key: 'email', label: 'Email' },
                                    { key: 'telefone', label: 'Telefone' },
                                    { key: 'fonte', label: 'Fonte' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'data', label: 'Data' },
                                ]}
                                title="Relatório Comercial"
                                filename="relatorio_comercial"
                                formats={['csv', 'xlsx', 'pdf']}
                                label="Exportar"
                            />
                            <Tooltip label="Atualizar">
                                <ActionIcon variant="subtle" onClick={fetchLeads} size="lg">
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Group>
                </div>

                {loading ? (
                    <Center py="xl"><Loader size="lg" /></Center>
                ) : (
                    <>
                        {/* Summary */}
                        <SimpleGrid cols={{ base: 2, sm: 5 }}>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={40} radius="md" variant="light" color="blue">
                                        <IconUsers size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Leads</Text>
                                        <Text size="xl" fw={700}>{stats.total}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={40} radius="md" variant="light" color="cyan">
                                        <IconTargetArrow size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Novos</Text>
                                        <Text size="xl" fw={700}>{stats.new}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={40} radius="md" variant="light" color="green">
                                        <IconTrendingUp size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Qualificados</Text>
                                        <Text size="xl" fw={700}>{stats.qualified}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={40} radius="md" variant="light" color="teal">
                                        <IconChartBar size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Matriculados</Text>
                                        <Text size="xl" fw={700}>{stats.enrolled}</Text>
                                    </div>
                                </Group>
                            </Card>
                            <Card withBorder radius="md" p="md">
                                <Group>
                                    <ThemeIcon size={40} radius="md" variant="light" color="violet">
                                        <IconTrendingUp size={20} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Conversão</Text>
                                        <Text size="xl" fw={700}>{conversionRate}%</Text>
                                    </div>
                                </Group>
                            </Card>
                        </SimpleGrid>

                        {/* Funnel + Sources */}
                        <SimpleGrid cols={{ base: 1, md: 2 }}>
                            {/* Funnel */}
                            <Card withBorder radius="md" p="lg">
                                <Title order={4} mb="md">Funil de Vendas</Title>
                                <Stack gap="sm">
                                    {Object.entries(statusConfig).map(([key, { label, color }]) => {
                                        const count = leads.filter(l => l.status === key).length;
                                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                        if (count === 0) return null;
                                        return (
                                            <div key={key}>
                                                <Group justify="space-between" mb={4}>
                                                    <Group gap="xs">
                                                        <Badge variant="light" color={color} size="sm">{label}</Badge>
                                                    </Group>
                                                    <Text size="sm" fw={500}>{count} ({pct}%)</Text>
                                                </Group>
                                                <Progress value={pct} color={color} size="sm" radius="xl" />
                                            </div>
                                        );
                                    })}
                                </Stack>
                            </Card>

                            {/* Source breakdown */}
                            <Card withBorder radius="md" p="lg">
                                <Title order={4} mb="md">Fontes de Leads</Title>
                                {topSources.length === 0 ? (
                                    <Text c="dimmed" ta="center" py="md">Sem dados de fontes</Text>
                                ) : (
                                    <Stack gap="sm">
                                        {topSources.map(([source, count]) => {
                                            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                            return (
                                                <div key={source}>
                                                    <Group justify="space-between" mb={4}>
                                                        <Text size="sm">{sourceLabels[source] || source}</Text>
                                                        <Text size="sm" fw={500}>{count} ({pct}%)</Text>
                                                    </Group>
                                                    <Progress value={pct} color="violet" size="sm" radius="xl" />
                                                </div>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Card>
                        </SimpleGrid>

                        {/* Filters */}
                        <Group>
                            <TextInput
                                placeholder="Buscar por nome ou email..."
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
                                data={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))}
                                clearable
                                w={160}
                            />
                            <Select
                                placeholder="Fonte"
                                value={sourceFilter}
                                onChange={setSourceFilter}
                                data={Object.entries(sourceLabels).map(([k, v]) => ({ value: k, label: v }))}
                                clearable
                                w={160}
                            />
                        </Group>

                        {/* Leads Table */}
                        {filtered.length === 0 ? (
                            <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
                                <ThemeIcon size={48} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                    <IconUsers size={24} />
                                </ThemeIcon>
                                <Text fw={500} mb="xs">Nenhum lead encontrado</Text>
                                <Text size="sm" c="dimmed">Ajuste os filtros ou aguarde novos leads</Text>
                            </Paper>
                        ) : (
                            <Card withBorder radius="md" p={0}>
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Lead</Table.Th>
                                            <Table.Th>Contato</Table.Th>
                                            <Table.Th>Fonte</Table.Th>
                                            <Table.Th>Status</Table.Th>
                                            <Table.Th>Data</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {filtered.slice(0, 50).map(lead => (
                                            <Table.Tr key={lead.id}>
                                                <Table.Td>
                                                    <Group gap="sm">
                                                        <Avatar size={32} radius="xl" color="violet">
                                                            {(lead.name || '?')[0]}
                                                        </Avatar>
                                                        <Text size="sm" fw={500}>{lead.name}</Text>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Stack gap={2}>
                                                        {lead.email && (
                                                            <Group gap={4}>
                                                                <IconMail size={12} color="gray" />
                                                                <Text size="xs" c="dimmed">{lead.email}</Text>
                                                            </Group>
                                                        )}
                                                        {lead.phone && (
                                                            <Group gap={4}>
                                                                <IconPhone size={12} color="gray" />
                                                                <Text size="xs" c="dimmed">{lead.phone}</Text>
                                                            </Group>
                                                        )}
                                                    </Stack>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="light" size="sm">
                                                        {sourceLabels[lead.source || ''] || lead.source || '–'}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        variant="light"
                                                        color={statusConfig[lead.status]?.color || 'gray'}
                                                        size="sm"
                                                    >
                                                        {statusConfig[lead.status]?.label || lead.status}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">{formatDate(lead.createdAt)}</Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Card>
                        )}
                    </>
                )}
            </Stack>
        </Container>
    );
}
