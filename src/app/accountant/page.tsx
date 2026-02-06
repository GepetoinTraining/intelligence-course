'use client';

import { useState, useEffect } from 'react';
import {
    Container, Paper, Title, Text, Group, Stack, SimpleGrid, Card,
    Badge, Button, ThemeIcon, Tabs, Select, Box, Divider, Alert,
    ActionIcon, Tooltip, Table, ScrollArea, LoadingOverlay, SegmentedControl
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import {
    IconDownload, IconFileTypeCsv, IconFileTypeXls, IconFileTypePdf,
    IconChartLine, IconReceipt, IconCash, IconUsers, IconCalendar,
    IconBuildingBank, IconFileText, IconReportAnalytics, IconArrowUpRight,
    IconAlertCircle, IconCheck, IconClock, IconRefresh, IconEye,
    IconFileExport, IconBook, IconCalculator
} from '@tabler/icons-react';
import { PageHeader, SectionCard, StatsCard } from '@/components/shared';
import { ExportButton, ExportModal } from '@/components/shared/ExportButton';
import { REPORT_TEMPLATES, ReportType, ExportColumn } from '@/lib/export/exportService';

// ----------------------------------------
// Types
// ----------------------------------------

interface ReportSummary {
    report: ReportType;
    lastExport?: number;
    recordCount?: number;
    status: 'available' | 'pending' | 'processing';
}

interface ExportHistory {
    id: string;
    report: string;
    format: string;
    exportedAt: number;
    exportedBy: string;
    recordCount: number;
    fileSize?: string;
}

// ----------------------------------------
// Report Cards Config
// ----------------------------------------

const REPORT_CARDS: Array<{
    id: ReportType;
    title: string;
    description: string;
    icon: typeof IconDownload;
    color: string;
    category: 'financial' | 'tax' | 'operational';
}> = [
        {
            id: 'balancete',
            title: 'Balancete',
            description: 'Balancete de verificação com saldos por conta',
            icon: IconChartLine,
            color: 'blue',
            category: 'financial',
        },
        {
            id: 'dre',
            title: 'DRE',
            description: 'Demonstração do Resultado do Exercício',
            icon: IconReportAnalytics,
            color: 'violet',
            category: 'financial',
        },
        {
            id: 'journalEntries',
            title: 'Livro Diário',
            description: 'Lançamentos contábeis do período',
            icon: IconBook,
            color: 'cyan',
            category: 'financial',
        },
        {
            id: 'fiscalDocuments',
            title: 'Notas Fiscais',
            description: 'Relação de NF-e e NFS-e emitidas',
            icon: IconReceipt,
            color: 'green',
            category: 'tax',
        },
        {
            id: 'taxWithholdings',
            title: 'Retenções DIRF',
            description: 'Impostos retidos para DIRF',
            icon: IconCalculator,
            color: 'orange',
            category: 'tax',
        },
        {
            id: 'payroll',
            title: 'Folha de Pagamento',
            description: 'Resumo da folha com encargos',
            icon: IconUsers,
            color: 'pink',
            category: 'operational',
        },
        {
            id: 'invoices',
            title: 'Faturas',
            description: 'Relatório de faturas e recebimentos',
            icon: IconCash,
            color: 'teal',
            category: 'operational',
        },
    ];

// ----------------------------------------
// Main Page Component
// ----------------------------------------

export default function AccountantPortalPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('reports');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [fiscalPeriod, setFiscalPeriod] = useState<string>('');
    const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false);
    const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);

    // Fiscal period options
    const currentYear = new Date().getFullYear();
    const fiscalPeriodOptions = [];
    for (let year = currentYear; year >= currentYear - 2; year--) {
        for (let month = 12; month >= 1; month--) {
            const monthStr = month.toString().padStart(2, '0');
            fiscalPeriodOptions.push({
                value: `${year}-${monthStr}`,
                label: `${monthStr}/${year}`,
            });
        }
    }

    // Filter reports by category
    const filteredReports = categoryFilter === 'all'
        ? REPORT_CARDS
        : REPORT_CARDS.filter(r => r.category === categoryFilter);

    // Mock export history
    useEffect(() => {
        setExportHistory([
            {
                id: '1',
                report: 'Livro Diário',
                format: 'XLSX',
                exportedAt: Date.now() - 86400000,
                exportedBy: 'Maria Contadora',
                recordCount: 245,
                fileSize: '128 KB',
            },
            {
                id: '2',
                report: 'Notas Fiscais',
                format: 'PDF',
                exportedAt: Date.now() - 172800000,
                exportedBy: 'João Fiscal',
                recordCount: 89,
                fileSize: '256 KB',
            },
            {
                id: '3',
                report: 'Balancete',
                format: 'XLSX',
                exportedAt: Date.now() - 259200000,
                exportedBy: 'Maria Contadora',
                recordCount: 156,
                fileSize: '98 KB',
            },
        ]);
    }, []);

    const handleExport = async (params: {
        report: ReportType;
        format: any;
        startDate?: Date;
        endDate?: Date;
    }) => {
        // Fetch data from API
        const searchParams = new URLSearchParams();
        searchParams.set('report', params.report);
        if (params.startDate) {
            searchParams.set('startDate', params.startDate.toISOString());
        }
        if (params.endDate) {
            searchParams.set('endDate', params.endDate.toISOString());
        }

        const response = await fetch(`/api/export?${searchParams}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        return {
            data: result.data,
            columns: REPORT_TEMPLATES[params.report].columns,
        };
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Container size="xl" py="xl">
            <PageHeader
                title="Portal do Contador"
                subtitle="Exporte relatórios fiscais e contábeis"
                icon={IconBuildingBank}
                actions={
                    <Group>
                        <Button
                            variant="light"
                            leftSection={<IconRefresh size={16} />}
                            onClick={() => setLoading(true)}
                        >
                            Atualizar
                        </Button>
                        <Button
                            leftSection={<IconFileExport size={16} />}
                            onClick={openExportModal}
                        >
                            Exportação Avançada
                        </Button>
                    </Group>
                }
            />

            {/* Period Selection */}
            <Paper p="md" radius="md" withBorder mb="lg">
                <Group>
                    <Select
                        label="Período Fiscal"
                        placeholder="Selecione o mês"
                        data={fiscalPeriodOptions}
                        value={fiscalPeriod}
                        onChange={(v) => setFiscalPeriod(v || '')}
                        clearable
                        w={150}
                    />
                    <Text size="sm" c="dimmed" style={{ alignSelf: 'flex-end', marginBottom: 4 }}>ou</Text>
                    <DatePickerInput
                        type="range"
                        label="Intervalo Personalizado"
                        placeholder="Selecione as datas"
                        value={dateRange}
                        onChange={(value) => setDateRange(value as [Date | null, Date | null])}
                        clearable
                        valueFormat="DD/MM/YYYY"
                        w={280}
                    />
                </Group>
            </Paper>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List mb="lg">
                    <Tabs.Tab value="reports" leftSection={<IconFileText size={16} />}>
                        Relatórios
                    </Tabs.Tab>
                    <Tabs.Tab value="history" leftSection={<IconClock size={16} />}>
                        Histórico de Exportações
                    </Tabs.Tab>
                    <Tabs.Tab value="obligations" leftSection={<IconCalendar size={16} />}>
                        Obrigações Acessórias
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="reports">
                    {/* Category Filter */}
                    <Group mb="md">
                        <SegmentedControl
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            data={[
                                { value: 'all', label: 'Todos' },
                                { value: 'financial', label: 'Contábil' },
                                { value: 'tax', label: 'Fiscal' },
                                { value: 'operational', label: 'Operacional' },
                            ]}
                        />
                    </Group>

                    {/* Report Cards */}
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {filteredReports.map((report) => {
                            const Icon = report.icon;
                            return (
                                <Card key={report.id} shadow="sm" radius="md" withBorder>
                                    <Group justify="space-between" mb="sm">
                                        <ThemeIcon size="lg" variant="light" color={report.color}>
                                            <Icon size={20} />
                                        </ThemeIcon>
                                        <Badge
                                            variant="light"
                                            color={
                                                report.category === 'financial' ? 'blue' :
                                                    report.category === 'tax' ? 'orange' : 'green'
                                            }
                                        >
                                            {report.category === 'financial' ? 'Contábil' :
                                                report.category === 'tax' ? 'Fiscal' : 'Operacional'}
                                        </Badge>
                                    </Group>
                                    <Text fw={600} size="lg" mb={4}>{report.title}</Text>
                                    <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                                        {report.description}
                                    </Text>

                                    <Divider mb="md" />

                                    <Group gap="xs">
                                        <Tooltip label="Exportar Excel">
                                            <ActionIcon variant="light" color="blue">
                                                <IconFileTypeXls size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Exportar CSV">
                                            <ActionIcon variant="light" color="green">
                                                <IconFileTypeCsv size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Exportar PDF">
                                            <ActionIcon variant="light" color="red">
                                                <IconFileTypePdf size={18} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Box style={{ marginLeft: 'auto' }}>
                                            <Button
                                                variant="light"
                                                size="xs"
                                                rightSection={<IconArrowUpRight size={14} />}
                                            >
                                                Visualizar
                                            </Button>
                                        </Box>
                                    </Group>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                </Tabs.Panel>

                <Tabs.Panel value="history">
                    <SectionCard title="Últimas Exportações">
                        <ScrollArea>
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Relatório</Table.Th>
                                        <Table.Th>Formato</Table.Th>
                                        <Table.Th>Registros</Table.Th>
                                        <Table.Th>Tamanho</Table.Th>
                                        <Table.Th>Exportado por</Table.Th>
                                        <Table.Th>Data/Hora</Table.Th>
                                        <Table.Th>Ações</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {exportHistory.map((item) => (
                                        <Table.Tr key={item.id}>
                                            <Table.Td>
                                                <Text fw={500}>{item.report}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge variant="light">
                                                    {item.format}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>{item.recordCount}</Table.Td>
                                            <Table.Td>{item.fileSize}</Table.Td>
                                            <Table.Td>{item.exportedBy}</Table.Td>
                                            <Table.Td>{formatDate(item.exportedAt)}</Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Tooltip label="Baixar novamente">
                                                        <ActionIcon variant="subtle" color="blue">
                                                            <IconDownload size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Visualizar">
                                                        <ActionIcon variant="subtle">
                                                            <IconEye size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </SectionCard>
                </Tabs.Panel>

                <Tabs.Panel value="obligations">
                    <Stack gap="md">
                        <Alert
                            color="blue"
                            icon={<IconAlertCircle size={16} />}
                            title="Calendário Fiscal"
                        >
                            Acompanhe as obrigações acessórias e seus prazos de entrega.
                        </Alert>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            {/* SPED Contributions */}
                            <Card shadow="sm" radius="md" withBorder>
                                <Group justify="space-between" mb="sm">
                                    <Group gap="xs">
                                        <ThemeIcon variant="light" color="blue">
                                            <IconFileText size={18} />
                                        </ThemeIcon>
                                        <Text fw={600}>SPED Contribuições</Text>
                                    </Group>
                                    <Badge color="green" leftSection={<IconCheck size={12} />}>
                                        Em dia
                                    </Badge>
                                </Group>
                                <Text size="sm" c="dimmed" mb="sm">
                                    Escrituração Fiscal Digital das Contribuições
                                </Text>
                                <Group gap="xs">
                                    <Text size="sm">Próximo prazo:</Text>
                                    <Text size="sm" fw={600}>15/02/2026</Text>
                                </Group>
                                <Button variant="light" size="xs" mt="md" fullWidth>
                                    Gerar Arquivo
                                </Button>
                            </Card>

                            {/* EFD ICMS/IPI */}
                            <Card shadow="sm" radius="md" withBorder>
                                <Group justify="space-between" mb="sm">
                                    <Group gap="xs">
                                        <ThemeIcon variant="light" color="violet">
                                            <IconFileText size={18} />
                                        </ThemeIcon>
                                        <Text fw={600}>EFD ICMS/IPI</Text>
                                    </Group>
                                    <Badge color="yellow" leftSection={<IconClock size={12} />}>
                                        Pendente
                                    </Badge>
                                </Group>
                                <Text size="sm" c="dimmed" mb="sm">
                                    Escrituração Fiscal Digital
                                </Text>
                                <Group gap="xs">
                                    <Text size="sm">Próximo prazo:</Text>
                                    <Text size="sm" fw={600}>25/02/2026</Text>
                                </Group>
                                <Button variant="light" size="xs" mt="md" fullWidth>
                                    Gerar Arquivo
                                </Button>
                            </Card>

                            {/* ECD */}
                            <Card shadow="sm" radius="md" withBorder>
                                <Group justify="space-between" mb="sm">
                                    <Group gap="xs">
                                        <ThemeIcon variant="light" color="cyan">
                                            <IconBook size={18} />
                                        </ThemeIcon>
                                        <Text fw={600}>ECD (SPED Contábil)</Text>
                                    </Group>
                                    <Badge color="green" leftSection={<IconCheck size={12} />}>
                                        Em dia
                                    </Badge>
                                </Group>
                                <Text size="sm" c="dimmed" mb="sm">
                                    Escrituração Contábil Digital
                                </Text>
                                <Group gap="xs">
                                    <Text size="sm">Próximo prazo:</Text>
                                    <Text size="sm" fw={600}>31/05/2026</Text>
                                </Group>
                                <Button variant="light" size="xs" mt="md" fullWidth>
                                    Gerar Arquivo
                                </Button>
                            </Card>

                            {/* ECF */}
                            <Card shadow="sm" radius="md" withBorder>
                                <Group justify="space-between" mb="sm">
                                    <Group gap="xs">
                                        <ThemeIcon variant="light" color="orange">
                                            <IconCalculator size={18} />
                                        </ThemeIcon>
                                        <Text fw={600}>ECF</Text>
                                    </Group>
                                    <Badge color="green" leftSection={<IconCheck size={12} />}>
                                        Em dia
                                    </Badge>
                                </Group>
                                <Text size="sm" c="dimmed" mb="sm">
                                    Escrituração Contábil Fiscal
                                </Text>
                                <Group gap="xs">
                                    <Text size="sm">Próximo prazo:</Text>
                                    <Text size="sm" fw={600}>31/07/2026</Text>
                                </Group>
                                <Button variant="light" size="xs" mt="md" fullWidth>
                                    Gerar Arquivo
                                </Button>
                            </Card>
                        </SimpleGrid>
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            {/* Export Modal */}
            <ExportModal
                opened={exportModalOpened}
                onClose={closeExportModal}
                reports={REPORT_CARDS.map(r => r.id)}
                organizationName="Academia de Dança Node Zero"
                onExport={handleExport}
            />
        </Container>
    );
}

