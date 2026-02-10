'use client';

import { useState, useMemo } from 'react';
import {
    Container, Title, Text, Paper, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Table, Select, Loader, Alert, TextInput, ActionIcon, Tooltip,
} from '@mantine/core';
import {
    IconFileText, IconAlertCircle, IconSearch, IconDownload,
    IconReceipt, IconCurrencyReal, IconCalendarEvent, IconExternalLink,
} from '@tabler/icons-react';
import { ExportButton } from '@/components/shared';
import { useApi } from '@/hooks/useApi';

interface FiscalDocument {
    id: string;
    documentType: string;
    documentNumber: string;
    series?: string;
    accessKey?: string;
    verificationCode?: string;
    issueDate: number;
    competenceDate?: number;
    issuerId?: string;
    issuerName?: string;
    recipientName?: string;
    recipientDocument?: string;
    totalAmountCents: number;
    netAmountCents?: number;
    issAmountCents?: number;
    serviceDescription?: string;
    status: string;
    pdfUrl?: string;
    xmlUrl?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'gray' },
    issued: { label: 'Emitida', color: 'green' },
    cancelled: { label: 'Cancelada', color: 'red' },
    replaced: { label: 'Substituída', color: 'orange' },
    error: { label: 'Erro', color: 'red' },
    pending_send: { label: 'Aguardando Envio', color: 'yellow' },
};

const TYPE_MAP: Record<string, string> = {
    nfse: 'NFS-e',
    nfe: 'NF-e',
    nfce: 'NFC-e',
    cte: 'CT-e',
    receipt: 'Recibo',
};

export default function DocumentosFiscaisPage() {
    const { data: documentsData, isLoading: loading } = useApi<FiscalDocument[]>('/api/fiscal-documents?limit=100');
    const documents = documentsData || [];
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const fmt = (cents: number) => `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const fmtDate = (ts: number) => ts ? new Date(ts).toLocaleDateString('pt-BR') : '—';

    const filtered = useMemo(() => {
        if (!search.trim()) return documents;
        const q = search.toLowerCase();
        return documents.filter(d =>
            (d.documentNumber || '').toLowerCase().includes(q) ||
            (d.recipientName || '').toLowerCase().includes(q) ||
            (d.serviceDescription || '').toLowerCase().includes(q) ||
            (d.accessKey || '').toLowerCase().includes(q)
        );
    }, [documents, search]);

    const stats = useMemo(() => {
        const issued = documents.filter(d => d.status === 'issued');
        const totalAmount = issued.reduce((sum, d) => sum + (d.totalAmountCents || 0), 0);
        const totalTax = issued.reduce((sum, d) => sum + (d.issAmountCents || 0), 0);
        const thisMonth = issued.filter(d => {
            const dt = new Date(d.issueDate);
            const now = new Date();
            return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
        });
        return {
            total: documents.length,
            issued: issued.length,
            draft: documents.filter(d => d.status === 'draft').length,
            cancelled: documents.filter(d => d.status === 'cancelled').length,
            totalAmount,
            totalTax,
            thisMonth: thisMonth.length,
        };
    }, [documents]);

    if (loading) {
        return (
            <Container size="xl" py="xl">
                <Group justify="center" py={60}><Loader size="lg" /><Text>Carregando documentos fiscais...</Text></Group>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Contábil</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Documentos Fiscais</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                        <Title order={1}>Documentos Fiscais</Title>
                        <ExportButton
                            data={filtered}
                            organizationName="NodeZero"
                        />
                    </Group>
                    <Text c="dimmed" mt="xs">NFS-e, NF-e e recibos emitidos pela organização.</Text>
                </div>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro">{error}</Alert>
                )}

                {/* KPI Cards */}
                <SimpleGrid cols={{ base: 2, md: 4 }}>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Docs</Text>
                                <Text size="xl" fw={700}>{stats.total}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                <IconFileText size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Emitidas</Text>
                                <Text size="xl" fw={700}>{stats.issued}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="green">
                                <IconReceipt size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Valor Total</Text>
                                <Text size="xl" fw={700}>{fmt(stats.totalAmount)}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="teal">
                                <IconCurrencyReal size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                    <Card withBorder padding="lg" radius="md">
                        <Group justify="space-between">
                            <div>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Este Mês</Text>
                                <Text size="xl" fw={700}>{stats.thisMonth}</Text>
                            </div>
                            <ThemeIcon size={48} radius="md" variant="light" color="violet">
                                <IconCalendarEvent size={24} />
                            </ThemeIcon>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Filters */}
                <Group>
                    <TextInput
                        placeholder="Buscar por número, destinatário ou chave..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Tipo"
                        clearable
                        value={typeFilter}
                        onChange={setTypeFilter}
                        data={[
                            { value: 'nfse', label: 'NFS-e' },
                            { value: 'nfe', label: 'NF-e' },
                            { value: 'nfce', label: 'NFC-e' },
                            { value: 'receipt', label: 'Recibo' },
                        ]}
                        w={140}
                    />
                    <Select
                        placeholder="Status"
                        clearable
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={[
                            { value: 'draft', label: 'Rascunho' },
                            { value: 'issued', label: 'Emitida' },
                            { value: 'cancelled', label: 'Cancelada' },
                            { value: 'pending_send', label: 'Aguardando Envio' },
                        ]}
                        w={160}
                    />
                </Group>

                {/* Documents Table */}
                <Card withBorder padding="lg" radius="md">
                    <Group justify="space-between" mb="md">
                        <Text fw={600}>Documentos</Text>
                        <Badge variant="light">{filtered.length} registros</Badge>
                    </Group>
                    {filtered.length === 0 ? (
                        <Text c="dimmed" ta="center" py="xl">Nenhum documento fiscal encontrado.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Tipo</Table.Th>
                                    <Table.Th>Número</Table.Th>
                                    <Table.Th>Destinatário</Table.Th>
                                    <Table.Th>Emissão</Table.Th>
                                    <Table.Th ta="right">Valor</Table.Th>
                                    <Table.Th ta="center">Status</Table.Th>
                                    <Table.Th ta="center">Ações</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.slice(0, 50).map(doc => {
                                    const status = STATUS_MAP[doc.status] || { label: doc.status, color: 'gray' };
                                    return (
                                        <Table.Tr key={doc.id}>
                                            <Table.Td>
                                                <Badge size="sm" variant="light">
                                                    {TYPE_MAP[doc.documentType] || doc.documentType}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>{doc.documentNumber || '—'}</Text>
                                                {doc.series && <Text size="xs" c="dimmed">Série: {doc.series}</Text>}
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{doc.recipientName || '—'}</Text>
                                                {doc.recipientDocument && (
                                                    <Text size="xs" c="dimmed">{doc.recipientDocument}</Text>
                                                )}
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">{fmtDate(doc.issueDate)}</Text>
                                            </Table.Td>
                                            <Table.Td ta="right">
                                                <Text size="sm" fw={600}>{fmt(doc.totalAmountCents || 0)}</Text>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Badge size="sm" variant="light" color={status.color}>{status.label}</Badge>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Group gap={4} justify="center">
                                                    {doc.pdfUrl && (
                                                        <Tooltip label="Baixar PDF">
                                                            <ActionIcon variant="subtle" size="sm" component="a" href={doc.pdfUrl} target="_blank">
                                                                <IconDownload size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                    {doc.xmlUrl && (
                                                        <Tooltip label="Baixar XML">
                                                            <ActionIcon variant="subtle" size="sm" component="a" href={doc.xmlUrl} target="_blank">
                                                                <IconExternalLink size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    )}
                </Card>
            </Stack>
        </Container>
    );
}
