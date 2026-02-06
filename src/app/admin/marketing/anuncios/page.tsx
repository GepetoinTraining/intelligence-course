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
    IconAd,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Campaign {
    id: string;
    name: string;
    campaignType: string;
    status: string;
    budgetCents: number | null;
    actualSpendCents: number | null;
    actualLeads: number | null;
    startsAt: string | null;
    endsAt: string | null;
}

function formatCurrency(cents: number | null): string {
    if (!cents) return '-';
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
}

export default function AnunciosPage() {
    const { data: campaigns, isLoading, error, refetch } = useApi<Campaign[]>('/api/campaigns');

    const ads = campaigns?.filter(c =>
        ['google_ads', 'meta_ads', 'paid_social', 'display'].includes(c.campaignType)
    ) || [];

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    if (error) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Erro ao carregar" color="red">
                {error}
                <Button size="xs" variant="light" ml="md" onClick={refetch}>Tentar novamente</Button>
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Marketing</Text>
                    <Title order={2}>Anúncios</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Anúncio</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconAd size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Anúncios</Text>
                            <Text fw={700} size="lg">{ads.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconAd size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Ativos</Text>
                            <Text fw={700} size="lg">{ads.filter(a => a.status === 'active').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {ads.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Campanha</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Orçamento</Table.Th>
                                <Table.Th>Gasto</Table.Th>
                                <Table.Th>Leads</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {ads.map((ad) => (
                                <Table.Tr key={ad.id}>
                                    <Table.Td><Text fw={500}>{ad.name}</Text></Table.Td>
                                    <Table.Td><Badge variant="light" size="sm">{ad.campaignType}</Badge></Table.Td>
                                    <Table.Td>{formatCurrency(ad.budgetCents)}</Table.Td>
                                    <Table.Td>{formatCurrency(ad.actualSpendCents)}</Table.Td>
                                    <Table.Td>{ad.actualLeads || 0}</Table.Td>
                                    <Table.Td>
                                        <Badge color={ad.status === 'active' ? 'green' : 'gray'} variant="light">
                                            {ad.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconAd size={48} color="gray" />
                            <Text c="dimmed">Nenhum anúncio encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

