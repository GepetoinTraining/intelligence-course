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
    IconBook,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface JournalEntry {
    id: string;
    entryNumber: number;
    referenceDate: number;
    fiscalYear: number;
    fiscalMonth: number;
    description: string | null;
    status: string;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    posted: 'Lançado',
    voided: 'Estornado',
};

export default function FechamentoPage() {
    const { data: entries, isLoading, error, refetch } = useApi<JournalEntry[]>('/api/journal-entries');

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

    const allEntries = entries || [];
    const posted = allEntries.filter(e => e.status === 'posted');

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Contábil</Text>
                    <Title order={2}>Fechamento</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Novo Lançamento</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allEntries.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconBook size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Lançados</Text>
                            <Text fw={700} size="lg">{posted.length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allEntries.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Nº</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Descrição</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allEntries.map((entry) => (
                                <Table.Tr key={entry.id}>
                                    <Table.Td><Text fw={500}>{entry.entryNumber}</Text></Table.Td>
                                    <Table.Td>{formatDate(entry.referenceDate)}</Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" size="sm">
                                            {String(entry.fiscalMonth).padStart(2, '0')}/{entry.fiscalYear}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td><Text lineClamp={1}>{entry.description || '-'}</Text></Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={entry.status === 'posted' ? 'green' : entry.status === 'voided' ? 'red' : 'yellow'}
                                            variant="light"
                                        >
                                            {statusLabels[entry.status] || entry.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconBook size={48} color="gray" />
                            <Text c="dimmed">Nenhum lançamento encontrado</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

