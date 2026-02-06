'use client';

import {
    Title,
    Text,
    Stack,
    SimpleGrid,
    Card,
    Group,
    ThemeIcon,
    Loader,
    Alert,
    Center,
    Button,
    Table,
} from '@mantine/core';
import {
    IconChartDonut,
    IconAlertCircle,
    IconArrowUpRight,
    IconArrowDownRight,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface Account {
    id: string;
    code: string;
    name: string;
    accountType: string;
}

function formatCurrency(cents: number): string {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function DREPage() {
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
    const revenues = allAccounts.filter(a => a.accountType === 'revenue');
    const expenses = allAccounts.filter(a => a.accountType === 'expense');

    // Mock values for DRE structure
    const mockRevenue = 150000 * 100;
    const mockExpenses = 95000 * 100;
    const netIncome = mockRevenue - mockExpenses;

    return (
        <Stack gap="lg">
            <div>
                <Text size="sm" c="dimmed">Contábil</Text>
                <Title order={2}>DRE - Demonstração do Resultado</Title>
            </div>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconArrowUpRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Receitas</Text>
                            <Text fw={700} size="lg">{formatCurrency(mockRevenue)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="red" size="lg">
                            <IconArrowDownRight size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Despesas</Text>
                            <Text fw={700} size="lg">{formatCurrency(mockExpenses)}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color={netIncome >= 0 ? 'teal' : 'orange'} size="lg">
                            <IconChartDonut size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Resultado</Text>
                            <Text fw={700} size="lg" c={netIncome >= 0 ? 'teal' : 'red'}>
                                {formatCurrency(netIncome)}
                            </Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                <Text fw={600} mb="md">Contas de Resultado</Text>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Conta</Table.Th>
                            <Table.Th>Tipo</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {revenues.map((account) => (
                            <Table.Tr key={account.id}>
                                <Table.Td><Text fw={500}>{account.code}</Text></Table.Td>
                                <Table.Td>{account.name}</Table.Td>
                                <Table.Td><Text c="green">Receita</Text></Table.Td>
                            </Table.Tr>
                        ))}
                        {expenses.map((account) => (
                            <Table.Tr key={account.id}>
                                <Table.Td><Text fw={500}>{account.code}</Text></Table.Td>
                                <Table.Td>{account.name}</Table.Td>
                                <Table.Td><Text c="red">Despesa</Text></Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
                {revenues.length === 0 && expenses.length === 0 && (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconChartDonut size={48} color="gray" />
                            <Text c="dimmed">Nenhuma conta de resultado encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

