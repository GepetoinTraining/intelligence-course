'use client';

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
    Select,
    Loader,
    Center,
    Stack,
} from '@mantine/core';
import {
    IconFileExport,
    IconDownload,
    IconEye,
    IconDotsVertical,
    IconCheck,
    IconClock,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface FiscalDocument {
    id: string;
    documentType: string;
    documentNumber: string | null;
    competencyPeriod: string | null;
    issueDate: number | null;
    status: string;
    totalAmountCents: number | null;
    createdAt: number;
}

const statusColors: Record<string, string> = {
    draft: 'gray',
    pending: 'gray',
    generating: 'blue',
    transmitted: 'green',
    authorized: 'green',
    ready: 'green',
    rejected: 'red',
    cancelled: 'red',
    error: 'red',
};

const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    pending: 'Pendente',
    generating: 'Gerando...',
    transmitted: 'Transmitido',
    authorized: 'Autorizado',
    ready: 'Pronto',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
    error: 'Erro',
};

const typeLabels: Record<string, string> = {
    ecd: 'ECD - Escrituração Contábil Digital',
    ecf: 'ECF - Escrituração Contábil e Fiscal',
    'efd-contribuicoes': 'EFD-Contribuições',
    efd: 'EFD-Contribuições',
    sped: 'SPED',
    nfse: 'NFS-e',
};

function formatDate(ts: number | null) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('pt-BR');
}

export default function SPEDPage() {
    const { data, isLoading, error, refetch } = useApi<FiscalDocument[]>('/api/fiscal-documents');

    const allDocs = data || [];
    // Filter for SPED-type documents (not NFS-e)
    const spedDocs = allDocs.filter(d =>
        d.documentType !== 'nfse' && d.documentType !== 'nfs-e',
    );

    const readyCount = spedDocs.filter(d =>
        d.status === 'transmitted' || d.status === 'authorized' || d.status === 'ready',
    ).length;
    const pendingCount = spedDocs.filter(d =>
        d.status === 'pending' || d.status === 'draft',
    ).length;

    if (isLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <div>
                    <Text c="dimmed" size="sm">Contábil</Text>
                    <Title order={2}>SPED</Title>
                </div>
                <Group>
                    <Button leftSection={<IconFileExport size={16} />}>
                        Gerar Arquivo
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card withBorder>
                    <Group>
                        <ThemeIcon color="blue" size="lg" radius="md">
                            <IconFileExport size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Total Arquivos</Text>
                            <Text fw={700} size="xl">{spedDocs.length}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="md">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Prontos</Text>
                            <Text fw={700} size="xl">{readyCount}</Text>
                        </div>
                    </Group>
                </Card>

                <Card withBorder>
                    <Group>
                        <ThemeIcon color="gray" size="lg" radius="md">
                            <IconClock size={20} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed">Pendentes</Text>
                            <Text fw={700} size="xl">{pendingCount}</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            <Card withBorder>
                <Title order={4} mb="md">Arquivos SPED</Title>

                {spedDocs.length === 0 ? (
                    <Center py="xl">
                        <Stack align="center" gap="xs">
                            <IconFileExport size={48} color="gray" />
                            <Text c="dimmed">Nenhum arquivo SPED encontrado</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Período</Table.Th>
                                <Table.Th>Emissão</Table.Th>
                                <Table.Th>Nº Documento</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {spedDocs.map((doc) => (
                                <Table.Tr key={doc.id}>
                                    <Table.Td>
                                        <div>
                                            <Text fw={500} tt="uppercase">{doc.documentType}</Text>
                                            <Text size="xs" c="dimmed">{typeLabels[doc.documentType] || doc.documentType}</Text>
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{doc.competencyPeriod || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatDate(doc.issueDate)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="dimmed">{doc.documentNumber || '-'}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={statusColors[doc.status] || 'gray'} variant="light">
                                            {statusLabels[doc.status] || doc.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            {(doc.status === 'transmitted' || doc.status === 'authorized' || doc.status === 'ready') && (
                                                <ActionIcon variant="light" color="blue" size="sm">
                                                    <IconDownload size={14} />
                                                </ActionIcon>
                                            )}
                                            <Menu position="bottom-end" withArrow>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" color="gray" size="sm">
                                                        <IconDotsVertical size={14} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item leftSection={<IconEye size={14} />}>Ver Detalhes</Menu.Item>
                                                    <Menu.Item leftSection={<IconDownload size={14} />}>Download</Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
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
