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
    IconListTree,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Account {
    id: string;
    code: string;
    name: string;
    accountType: string;
    nature: string;
    level: number;
    isActive: number;
}

const typeLabels: Record<string, string> = {
    asset: 'Ativo',
    liability: 'Passivo',
    equity: 'Patrimônio Líquido',
    revenue: 'Receita',
    expense: 'Despesa',
};

const natureLabels: Record<string, string> = {
    debit: 'Devedora',
    credit: 'Credora',
};

export default function PlanoContasPage() {
    const { data: accounts, isLoading, error, refetch } = useApi<Account[]>('/api/chart-of-accounts');

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

    const allAccounts = accounts || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Contábil</Text>
                    <Title order={2}>Plano de Contas</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Nova Conta</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconListTree size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Contas</Text>
                            <Text fw={700} size="lg">{allAccounts.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allAccounts.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Código</Table.Th>
                                <Table.Th>Nome</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Natureza</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allAccounts.map((account) => (
                                <Table.Tr key={account.id}>
                                    <Table.Td>
                                        <Text fw={500} style={{ paddingLeft: (account.level - 1) * 12 }}>
                                            {account.code}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>{account.name}</Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {typeLabels[account.accountType] || account.accountType}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline" size="sm">
                                            {natureLabels[account.nature] || account.nature}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={account.isActive ? 'green' : 'gray'} variant="light">
                                            {account.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconListTree size={48} color="gray" />
                            <Text c="dimmed">Nenhuma conta encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

