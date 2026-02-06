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
    Avatar,
    Progress,
} from '@mantine/core';
import {
    IconBriefcase,
    IconPlus,
    IconEye,
    IconEdit,
    IconDotsVertical,
    IconPhone,
    IconMail,
    IconFileText,
    IconCurrencyDollar,
    IconClock,
    IconCheck,
    IconX,
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getDaysAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function NegociacoesPage() {
    const { data: leads, isLoading } = useApi<Lead[]>('/api/leads');

    // Filter leads in negotiation status
    const negotiations = leads?.filter(lead =>
        lead.status === 'negotiating' || lead.status === 'qualified'
    ) || [];

    const totalValue = negotiations.reduce((acc, l) => acc + (l.value || 2500), 0);
    const activeCount = negotiations.length;
    const avgValue = activeCount > 0 ? totalValue / activeCount : 0;

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Comercial</Text>
                    <Title order={2}>Negociações em Andamento</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Negociação
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconBriefcase size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Em Negociação</Text>
                            <Text fw={700} size="xl">{activeCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
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
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconCurrencyDollar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ticket Médio</Text>
                            <Text fw={700} size="xl">{formatCurrency(avgValue)}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Tempo Médio (dias)</Text>
                            <Text fw={700} size="xl">7</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Negociações</Title>

                {negotiations.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        Nenhuma negociação em andamento
                    </Text>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Lead</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Dias</Table.Th>
                                <Table.Th>Última Atividade</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {negotiations.map((lead) => {
                                const daysAgo = getDaysAgo(lead.createdAt);
                                return (
                                    <Table.Tr key={lead.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar size="sm" radius="xl" color="blue">
                                                    {lead.firstName?.charAt(0) || '?'}
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={500}>
                                                        {lead.firstName} {lead.lastName}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">{lead.email}</Text>
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text fw={600}>{formatCurrency(lead.value || 2500)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={lead.status === 'negotiating' ? 'yellow' : 'green'}
                                                variant="light"
                                            >
                                                {lead.status === 'negotiating' ? 'Negociando' : 'Qualificado'}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                color={daysAgo > 14 ? 'red' : daysAgo > 7 ? 'yellow' : 'green'}
                                                variant="light"
                                            >
                                                {daysAgo} dias
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{formatDate(lead.createdAt)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <ActionIcon variant="subtle" color="green" size="sm">
                                                    <IconCheck size={14} />
                                                </ActionIcon>
                                                <ActionIcon variant="subtle" color="red" size="sm">
                                                    <IconX size={14} />
                                                </ActionIcon>
                                                <Menu position="bottom-end" withArrow>
                                                    <Menu.Target>
                                                        <ActionIcon variant="subtle" color="gray" size="sm">
                                                            <IconDotsVertical size={14} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                                        <Menu.Item leftSection={<IconFileText size={14} />}>Criar Proposta</Menu.Item>
                                                        <Menu.Item leftSection={<IconPhone size={14} />}>Ligar</Menu.Item>
                                                        <Menu.Item leftSection={<IconMail size={14} />}>Enviar Email</Menu.Item>
                                                        <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>
        </div>
    );
}

