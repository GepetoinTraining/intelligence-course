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
    ActionIcon,
    Avatar,
    Loader,
    Alert,
    Center,
} from '@mantine/core';
import {
    IconUsers,
    IconPlus,
    IconPhone,
    IconMail,
    IconUserCheck,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Lead {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string | null;
    status: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost';
    assignedTo: string | null;
    createdAt: string;
    interestedIn: string | null;
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    negotiating: 'Negociando',
    won: 'Convertido',
    lost: 'Perdido',
};

const sourceLabels: Record<string, string> = {
    website: 'Site',
    referral: 'Indicação',
    social: 'Redes Sociais',
    ads: 'Anúncios',
    walk_in: 'Presencial',
    phone: 'Telefone',
};

export default function LeadsPage() {
    const { data: leads, isLoading, error, refetch } = useApi<Lead[]>('/api/leads');

    const stats = {
        total: leads?.length || 0,
        new: leads?.filter(l => l.status === 'new').length || 0,
        qualified: leads?.filter(l => l.status === 'qualified').length || 0,
        converted: leads?.filter(l => l.status === 'won').length || 0,
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
                    <Title order={2}>Leads</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>
                    Novo Lead
                </Button>
            </Group>

            {/* Quick Stats */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Leads</Text>
                            <Text fw={700} size="lg">{stats.total}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Novos</Text>
                            <Text fw={700} size="lg">{stats.new}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="yellow" size="lg">
                            <IconUsers size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Qualificados</Text>
                            <Text fw={700} size="lg">{stats.qualified}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="teal" size="lg">
                            <IconUserCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Convertidos</Text>
                            <Text fw={700} size="lg">{stats.converted}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Leads Table */}
            <Card withBorder p="md">
                {leads && leads.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Lead</Table.Th>
                                <Table.Th>Contato</Table.Th>
                                <Table.Th>Origem</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Ações</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {leads.map((lead) => (
                                <Table.Tr key={lead.id}>
                                    <Table.Td>
                                        <Group gap="sm">
                                            <Avatar size={32} radius="xl" color="blue">
                                                {lead.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </Avatar>
                                            <Text fw={500}>{lead.name}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            {lead.email && <Text size="sm">{lead.email}</Text>}
                                            {lead.phone && <Text size="xs" c="dimmed">{lead.phone}</Text>}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {lead.source ? sourceLabels[lead.source] || lead.source : '-'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={
                                                lead.status === 'new' ? 'blue' :
                                                    lead.status === 'qualified' ? 'yellow' :
                                                        lead.status === 'won' ? 'green' :
                                                            lead.status === 'lost' ? 'red' : 'gray'
                                            }
                                            variant="light"
                                        >
                                            {statusLabels[lead.status] || lead.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatDate(lead.createdAt)}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon variant="subtle" size="sm">
                                                <IconPhone size={14} />
                                            </ActionIcon>
                                            <ActionIcon variant="subtle" size="sm">
                                                <IconMail size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconUsers size={48} color="gray" />
                            <Text c="dimmed">Nenhum lead encontrado</Text>
                            <Button size="xs" leftSection={<IconPlus size={14} />}>
                                Cadastrar lead
                            </Button>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

