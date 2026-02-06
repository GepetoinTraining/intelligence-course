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
    IconFileInvoice,
    IconPlus,
    IconAlertCircle,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface FiscalDocument {
    id: string;
    documentType: string;
    documentNumber: string;
    issueDate: number;
    recipientName: string | null;
    totalAmountCents: number;
    status: string;
}

function formatCurrency(cents: number | null): string {
    if (!cents) return '-';
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
}

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    issued: 'Emitida',
    cancelled: 'Cancelada',
    pending: 'Pendente',
};

export default function NFSePage() {
    const { data: documents, isLoading, error, refetch } = useApi<FiscalDocument[]>('/api/fiscal-documents?type=nfse');

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

    const allDocs = documents || [];

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
                <div>
                    <Text size="sm" c="dimmed">Contábil</Text>
                    <Title order={2}>NFS-e</Title>
                </div>
                <Button leftSection={<IconPlus size={16} />}>Emitir NFS-e</Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="blue" size="lg">
                            <IconFileInvoice size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total</Text>
                            <Text fw={700} size="lg">{allDocs.length}</Text>
                        </div>
                    </Group>
                </Card>
                <Card withBorder p="md">
                    <Group>
                        <ThemeIcon variant="light" color="green" size="lg">
                            <IconFileInvoice size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Emitidas</Text>
                            <Text fw={700} size="lg">{allDocs.filter(d => d.status === 'issued').length}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder p="md">
                {allDocs.length > 0 ? (
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Número</Table.Th>
                                <Table.Th>Data</Table.Th>
                                <Table.Th>Destinatário</Table.Th>
                                <Table.Th>Valor</Table.Th>
                                <Table.Th>Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {allDocs.map((doc) => (
                                <Table.Tr key={doc.id}>
                                    <Table.Td><Text fw={500}>{doc.documentNumber}</Text></Table.Td>
                                    <Table.Td>{formatDate(doc.issueDate)}</Table.Td>
                                    <Table.Td>{doc.recipientName || '-'}</Table.Td>
                                    <Table.Td>{formatCurrency(doc.totalAmountCents)}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={doc.status === 'issued' ? 'green' : doc.status === 'cancelled' ? 'red' : 'yellow'}
                                            variant="light"
                                        >
                                            {statusLabels[doc.status] || doc.status}
                                        </Badge>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                ) : (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconFileInvoice size={48} color="gray" />
                            <Text c="dimmed">Nenhuma NFS-e encontrada</Text>
                        </Stack>
                    </Center>
                )}
            </Card>
        </Stack>
    );
}

