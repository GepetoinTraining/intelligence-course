'use client';

import { useState } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Badge,
    Button,
    SimpleGrid,
    ThemeIcon,
    Avatar,
    ActionIcon,
    Menu,
    Progress,
} from '@mantine/core';
import {
    IconPlus,
    IconDotsVertical,
    IconEye,
    IconEdit,
    IconPhone,
    IconMail,
    IconArrowRight,
    IconCurrencyDollar,
    IconUsers,
    IconTarget,
    IconTrendingUp,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    value: number;
    createdAt: string;
}

interface PipelineStage {
    id: string;
    name: string;
    color: string;
    leads: Lead[];
    value: number;
}

const stageColors: Record<string, string> = {
    new: '#868e96',
    contacted: '#228be6',
    qualified: '#40c057',
    negotiating: '#fab005',
    closed_won: '#12b886',
    closed_lost: '#fa5252',
};

const stageNames: Record<string, string> = {
    new: 'Novos',
    contacted: 'Contatados',
    qualified: 'Qualificados',
    negotiating: 'Negociando',
    closed_won: 'Fechados',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function PipelinePage() {
    const { data: leads } = useApi<Lead[]>('/api/leads');

    // Group leads by status into pipeline stages
    const stages: PipelineStage[] = Object.entries(stageNames).map(([id, name]) => {
        const stageLeads = leads?.filter(lead => lead.status === id) || [];
        return {
            id,
            name,
            color: stageColors[id] || '#868e96',
            leads: stageLeads,
            value: stageLeads.reduce((acc, l) => acc + (l.value || 2500), 0),
        };
    });

    const totalValue = stages.reduce((acc, s) => acc + s.value, 0);
    const totalLeads = leads?.length || 0;
    const qualifiedCount = stages.find(s => s.id === 'qualified')?.leads.length || 0;
    const closedValue = stages.find(s => s.id === 'closed_won')?.value || 0;

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Comercial</Text>
                    <Title order={2}>Pipeline de Vendas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Lead
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total no Pipeline</Text>
                            <Text fw={700} size="xl">{totalLeads}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCurrencyDollar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Valor Total</Text>
                            <Text fw={700} size="xl">{formatCurrency(totalValue)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconTarget size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Qualificados</Text>
                            <Text fw={700} size="xl">{qualifiedCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="teal" size="lg" radius="md">
                            <IconTrendingUp size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Fechados (Valor)</Text>
                            <Text fw={700} size="xl">{formatCurrency(closedValue)}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                {stages.map((stage) => (
                    <Card
                        key={stage.id}
                        withBorder
                        style={{
                            minWidth: 280,
                            maxWidth: 320,
                            flex: 1,
                            backgroundColor: 'var(--mantine-color-body)',
                        }}
                        p="md"
                    >
                        <Group justify="space-between" mb="md">
                            <Group gap="xs">
                                <div
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        backgroundColor: stage.color
                                    }}
                                />
                                <Text fw={600}>{stage.name}</Text>
                                <Badge size="sm" variant="light" color="gray">{stage.leads.length}</Badge>
                            </Group>
                            <Text size="sm" c="dimmed">{formatCurrency(stage.value)}</Text>
                        </Group>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {stage.leads.slice(0, 5).map((lead) => (
                                <Card key={lead.id} withBorder p="sm" style={{ cursor: 'pointer' }}>
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="sm" wrap="nowrap">
                                            <Avatar size="sm" radius="xl" color="blue">
                                                {lead.firstName?.charAt(0) || '?'}
                                            </Avatar>
                                            <div style={{ overflow: 'hidden' }}>
                                                <Text size="sm" fw={500} truncate>
                                                    {lead.firstName} {lead.lastName}
                                                </Text>
                                                <Text size="xs" c="dimmed" truncate>{lead.email}</Text>
                                            </div>
                                        </Group>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle" color="gray" size="sm">
                                                    <IconDotsVertical size={14} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                                <Menu.Item leftSection={<IconPhone size={14} />}>Ligar</Menu.Item>
                                                <Menu.Item leftSection={<IconMail size={14} />}>Enviar Email</Menu.Item>
                                                <Menu.Item leftSection={<IconArrowRight size={14} />}>Mover Etapa</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                    <Group justify="space-between" mt="xs">
                                        <Badge size="xs" variant="light">{lead.source || 'Direto'}</Badge>
                                        <Text size="xs" fw={500}>{formatCurrency(lead.value || 2500)}</Text>
                                    </Group>
                                </Card>
                            ))}
                            {stage.leads.length > 5 && (
                                <Text size="xs" c="dimmed" ta="center">
                                    + {stage.leads.length - 5} mais
                                </Text>
                            )}
                            {stage.leads.length === 0 && (
                                <Text size="sm" c="dimmed" ta="center" py="md">
                                    Nenhum lead nesta etapa
                                </Text>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

