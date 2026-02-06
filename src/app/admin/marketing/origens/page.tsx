'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    Alert,
    Loader,
    Progress,
    Menu,
} from '@mantine/core';
import {
    IconRoute,
    IconPlus,
    IconEye,
    IconEdit,
    IconTrash,
    IconAlertCircle,
    IconRefresh,
    IconWorld,
    IconBrandFacebook,
    IconBrandGoogle,
    IconMail,
    IconUsers,
    IconDotsVertical,
    IconChartBar,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Source {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    leadsCount: number;
    conversionRate: number;
    createdAt: string;
}

const sourceTypeIcons: Record<string, React.ReactNode> = {
    organic: <IconWorld size={16} />,
    paid: <IconBrandGoogle size={16} />,
    social: <IconBrandFacebook size={16} />,
    email: <IconMail size={16} />,
    referral: <IconUsers size={16} />,
};

const sourceTypeColors: Record<string, string> = {
    organic: 'green',
    paid: 'blue',
    social: 'grape',
    email: 'yellow',
    referral: 'pink',
    direct: 'gray',
};

export default function OrigensPage() {
    const router = useRouter();
    const { data: sources, isLoading, error, refetch } = useApi<Source[]>('/api/leads');

    // Group leads by source to create source stats
    const sourceStats = sources?.reduce((acc, lead: any) => {
        const source = lead.source || 'direct';
        if (!acc[source]) {
            acc[source] = { count: 0, converted: 0 };
        }
        acc[source].count++;
        if (lead.status === 'converted' || lead.status === 'enrolled') {
            acc[source].converted++;
        }
        return acc;
    }, {} as Record<string, { count: number; converted: number }>) || {};

    const sourceList = Object.entries(sourceStats).map(([name, stats]) => ({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        type: name === 'google' || name === 'facebook' ? 'paid' :
            name === 'instagram' ? 'social' :
                name === 'email' ? 'email' :
                    name === 'referral' ? 'referral' : 'organic',
        isActive: true,
        leadsCount: stats.count,
        conversionRate: stats.count > 0 ? (stats.converted / stats.count) * 100 : 0,
    }));

    const totalLeads = sourceList.reduce((acc, s) => acc + s.leadsCount, 0);
    const topSource = sourceList.sort((a, b) => b.leadsCount - a.leadsCount)[0];

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar origens" color="red">
                Não foi possível carregar as origens de leads.
                <Button variant="light" color="red" size="xs" mt="sm" onClick={() => refetch()}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Marketing</Text>
                    <Title order={2}>Origens de Leads</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Origem
                </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconRoute size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Origens Ativas</Text>
                            <Text fw={700} size="xl">{sourceList.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total de Leads</Text>
                            <Text fw={700} size="xl">{totalLeads}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="grape" size="lg" radius="md">
                            <IconChartBar size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Melhor Origem</Text>
                            <Text fw={700} size="xl">{topSource?.name || '-'}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="orange" size="lg" radius="md">
                            <IconRefresh size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Taxa Média</Text>
                            <Text fw={700} size="xl">
                                {sourceList.length > 0
                                    ? (sourceList.reduce((a, s) => a + s.conversionRate, 0) / sourceList.length).toFixed(1)
                                    : 0}%
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Todas as Origens</Title>

                {sourceList.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        Nenhuma origem encontrada
                    </Text>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Origem</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Leads</Table.Th>
                                <Table.Th>Taxa de Conversão</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {sourceList.map((source) => (
                                <Table.Tr key={source.id}>
                                    <Table.Td>
                                        <Group gap="xs">
                                            {sourceTypeIcons[source.type] || <IconWorld size={16} />}
                                            <Text fw={500}>{source.name}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={sourceTypeColors[source.type] || 'gray'} variant="light">
                                            {source.type}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{source.leadsCount}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Progress
                                                value={source.conversionRate}
                                                size="sm"
                                                w={60}
                                                color={source.conversionRate > 50 ? 'green' : source.conversionRate > 25 ? 'yellow' : 'red'}
                                            />
                                            <Text size="sm">{source.conversionRate.toFixed(1)}%</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={source.isActive ? 'green' : 'gray'}>
                                            {source.isActive ? 'Ativo' : 'Inativo'}
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
                                                <Menu.Item leftSection={<IconEye size={14} />}>Ver Leads</Menu.Item>
                                                <Menu.Item leftSection={<IconEdit size={14} />}>Editar</Menu.Item>
                                                <Menu.Divider />
                                                <Menu.Item leftSection={<IconTrash size={14} />} color="red">Remover</Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Card>
        </div>
    );
}

