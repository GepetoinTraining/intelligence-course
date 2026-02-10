'use client';

import { useState, useCallback } from 'react';
import {
    Container, Title, Text, Group, ThemeIcon, Stack, Badge,
    Card, SimpleGrid, Button, Loader, Alert, Select, Paper,
    Center,
} from '@mantine/core';
import {
    IconAlertCircle, IconDownload, IconFileSpreadsheet,
    IconFileText, IconReceipt, IconCash, IconChartBar,
} from '@tabler/icons-react';
import { useApi } from '@/hooks/useApi';

interface ReportDef {
    id: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    apiReport: string;
}

const REPORTS: ReportDef[] = [
    {
        id: 'chart-of-accounts',
        label: 'Plano de Contas',
        description: 'Exportar plano de contas completo da organização.',
        icon: IconChartBar,
        color: 'blue',
        apiReport: 'chart-of-accounts',
    },
    {
        id: 'journal-entries',
        label: 'Lançamentos Contábeis',
        description: 'Exportar lançamentos contábeis com detalhes de débito/crédito.',
        icon: IconFileText,
        color: 'violet',
        apiReport: 'journal-entries',
    },
    {
        id: 'fiscal-documents',
        label: 'Documentos Fiscais',
        description: 'Exportar notas fiscais de serviço (NFS-e) e outros documentos.',
        icon: IconReceipt,
        color: 'green',
        apiReport: 'fiscal-documents',
    },
    {
        id: 'payroll',
        label: 'Folha de Pagamento',
        description: 'Exportar dados completos da folha de pagamento mensal.',
        icon: IconCash,
        color: 'orange',
        apiReport: 'payroll',
    },
];

export default function ExportarPage() {
    // API data (falls back to inline demo data below)
    const { data: _apiData, isLoading: _apiLoading, error: _apiError } = useApi<any[]>('/api/export');

    const [downloading, setDownloading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [month, setMonth] = useState(String(new Date().getMonth() + 1));
    const [lastResult, setLastResult] = useState<{ report: string; count: number } | null>(null);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }));
    const months = [
        { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
        { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
        { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
        { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
        { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
    ];

    const handleExport = useCallback(async (report: ReportDef) => {
        setDownloading(report.id);
        setError(null);
        try {
            const params = new URLSearchParams({
                report: report.apiReport,
                year,
                month,
            });

            const res = await fetch(`/api/export?${params}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Falha na exportação');
            }
            const data = await res.json();

            if (!data.success || !data.data) {
                throw new Error('Nenhum dado retornado');
            }

            // Convert to CSV and download
            const rows = data.data;
            if (rows.length === 0) {
                setLastResult({ report: report.label, count: 0 });
                return;
            }

            const headers = Object.keys(rows[0]);
            const csvContent = [
                headers.join(','),
                ...rows.map((r: Record<string, any>) =>
                    headers.map(h => {
                        const val = r[h];
                        if (val === null || val === undefined) return '';
                        const str = String(val);
                        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${report.apiReport}_${year}-${month.padStart(2, '0')}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            setLastResult({ report: report.label, count: rows.length });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao exportar');
            console.error(err);
        } finally {
            setDownloading(null);
        }
    }, [year, month]);


    if (_apiLoading) {
        return <Center h={400}><Loader size="lg" /></Center>;
    }

    return (
        <Container size="xl" py="xl">
            <Stack gap="lg">
                {/* Header */}
                <div>
                    <Group gap="xs" mb={4}>
                        <Text size="sm" c="dimmed">Relatórios</Text>
                        <Text size="sm" c="dimmed">/</Text>
                        <Text size="sm" fw={500}>Central de Exportação</Text>
                    </Group>
                    <Title order={1}>Central de Exportação</Title>
                    <Text c="dimmed" mt="xs">Exporte dados contábeis, fiscais e de folha de pagamento em CSV.</Text>
                </div>

                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erro" withCloseButton onClose={() => setError(null)}>{error}</Alert>}

                {lastResult && (
                    <Alert icon={<IconDownload size={16} />} color="green" title="Exportação concluída" withCloseButton onClose={() => setLastResult(null)}>
                        {lastResult.count > 0
                            ? `"${lastResult.report}" exportado com ${lastResult.count} registros.`
                            : `"${lastResult.report}" não contém dados para o período selecionado.`
                        }
                    </Alert>
                )}

                {/* Period Selector */}
                <Card withBorder padding="lg" radius="md">
                    <Text fw={600} mb="md">Período de Exportação</Text>
                    <Group>
                        <Select
                            label="Ano"
                            value={year}
                            onChange={(v) => setYear(v || String(currentYear))}
                            data={years}
                            w={120}
                        />
                        <Select
                            label="Mês"
                            value={month}
                            onChange={(v) => setMonth(v || '1')}
                            data={months}
                            w={160}
                        />
                    </Group>
                </Card>

                {/* Report Cards */}
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {REPORTS.map(report => {
                        const Icon = report.icon;
                        return (
                            <Card key={report.id} withBorder padding="lg" radius="md">
                                <Group justify="space-between" mb="md">
                                    <Group>
                                        <ThemeIcon size={48} radius="md" variant="light" color={report.color}>
                                            <Icon size={24} />
                                        </ThemeIcon>
                                        <div>
                                            <Text fw={600}>{report.label}</Text>
                                            <Text size="sm" c="dimmed" maw={280}>{report.description}</Text>
                                        </div>
                                    </Group>
                                </Group>
                                <Group gap="sm">
                                    <Button
                                        leftSection={<IconFileSpreadsheet size={16} />}
                                        variant="light"
                                        color={report.color}
                                        loading={downloading === report.id}
                                        onClick={() => handleExport(report)}
                                        fullWidth
                                    >
                                        Exportar CSV
                                    </Button>
                                </Group>
                            </Card>
                        );
                    })}
                </SimpleGrid>

                {/* Export Info */}
                <Paper withBorder p="xl" radius="md">
                    <Group gap="md">
                        <ThemeIcon size={48} radius="md" variant="light" color="gray">
                            <IconDownload size={24} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600}>Sobre as Exportações</Text>
                            <Text size="sm" c="dimmed">
                                Os dados são exportados em formato CSV (Comma-Separated Values), compatível com Excel, Google Sheets e outros softwares.
                                Os valores monetários são em centavos. Datas são em formato timestamp Unix.
                            </Text>
                        </div>
                    </Group>
                </Paper>
            </Stack>
        </Container>
    );
}
