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
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconSpeakerphone,
    IconPlus,
    IconUsers,
    IconCash,
    IconCalendar,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Campaign {
    id: string;
    name: string;
    campaignType: string;
    status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
    startsAt: string | null;
    endsAt: string | null;
    budgetCents: number | null;
    actualSpendCents: number | null;
    goalLeads: number | null;
    actualLeads: number | null;
    goalEnrollments: number | null;
    actualEnrollments: number | null;
}

function formatCurrency(cents: number | null): string {
    if (cents === null) return '-';
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
}

export default function CampanhasPage() {
    const { data: campaigns, isLoading, error, refetch } = useApi<Campaign[]>('/api/campaigns');

    const stats = {
        total: campaigns?.length || 0,
        active: campaigns?.filter(c => c.status === 'active').length || 0,
        totalBudget: campaigns?.reduce((sum, c) => sum + (c.budgetCents || 0), 0) || 0,
        totalLeads: campaigns?.reduce((sum, c) => sum + (c.actualLeads || 0), 0) || 0,
    };

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>
                    Tentar novamente
                </Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Marketing</Text>
                    <Title order={2}>Campanhas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Nova Campanha
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="violet" size="lg">
                            <IconSpeakerphone size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Campanhas</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconSpeakerphone size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativas</Text>
                            <Text fw={700} size="lg">{stats.active}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconCash size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Orçamento Total</Text>
                            <Text fw={700} size="lg">{formatCurrency(stats.totalBudget)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="orange" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Leads Gerados</Text>
                            <Text fw={700} size="lg">{stats.totalLeads}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Campaigns Table */}
            <Card withBorder p="md">
                {campaigns && campaigns.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Campanha</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Orçamento</Table.Th>
                                <Table.Th>Leads</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {campaigns.map((campaign) => (
                                <Table.Tr key={campaign.id}>
                                    <Table.Td>
                                        <Text fw={500}>{campaign.name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">{campaign.campaignType}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">
                                            {formatDate(campaign.startsAt)} - {formatDate(campaign.endsAt)}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>{formatCurrency(campaign.budgetCents)}</Table.Td>
                                    <Table.Td>
                                        {campaign.actualLeads ?? 0}/{campaign.goalLeads ?? '-'}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                campaign.status === 'active' ? 'green' :
                                                    campaign.status === 'draft' ? 'gray' :
                                                        campaign.status === 'scheduled' ? 'blue' :
                                                            campaign.status === 'paused' ? 'yellow' :
                                                                campaign.status === 'completed' ? 'teal' : 'red'
                                            }
                                            variant="light"
                                        >
                                            {campaign.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconSpeakerphone size={48} color="gray" />
                            <Text c="dimmed">Nenhuma campanha encontrada</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Criar primeira campanha
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

