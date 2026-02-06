'use client';

import { useState } from 'react';
import {
    Button, Menu, Modal, Stack, Select, Group, Text, Paper,
    LoadingOverlay, Alert, Checkbox, SimpleGrid, ThemeIcon, Badge
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import {
    IconDownload, IconFileTypeCsv, IconFileTypeXls, IconFileTypePdf,
    IconJson, IconChevronDown, IconCheck, IconX, IconFileExport
} from '@tabler/icons-react';
import {
    exportData, downloadBlob, ExportFormat, ExportOptions, ExportColumn,
    REPORT_TEMPLATES, ReportType
} from '@/lib/export/exportService';

// ----------------------------------------
// Types
// ----------------------------------------

export interface ExportButtonProps {
    /** Data to export (for direct export) */
    data?: Record<string, any>[];
    /** Column definitions */
    columns?: ExportColumn[];
    /** Report title */
    title?: string;
    /** Base filename (without extension) */
    filename?: string;
    /** Available formats (default: all) */
    formats?: ExportFormat[];
    /** Fetch data function (for API-based export) */
    fetchData?: (params: { startDate?: Date; endDate?: Date }) => Promise<Record<string, any>[]>;
    /** Show date range picker */
    showDateRange?: boolean;
    /** Organization name for header */
    organizationName?: string;
    /** Button variant */
    variant?: 'filled' | 'light' | 'outline' | 'subtle';
    /** Button size */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Disable button */
    disabled?: boolean;
    /** Custom button label */
    label?: string;
}

const FORMAT_CONFIG: Record<ExportFormat, { label: string; icon: typeof IconDownload; color: string }> = {
    csv: { label: 'CSV', icon: IconFileTypeCsv, color: 'green' },
    xlsx: { label: 'Excel', icon: IconFileTypeXls, color: 'blue' },
    pdf: { label: 'PDF', icon: IconFileTypePdf, color: 'red' },
    json: { label: 'JSON', icon: IconJson, color: 'gray' },
    'sped-ecd': { label: 'SPED ECD', icon: IconFileExport, color: 'violet' },
    xml: { label: 'XML', icon: IconFileExport, color: 'orange' },
};

// ----------------------------------------
// Simple Export Button (Direct)
// ----------------------------------------

export function ExportButton({
    data = [],
    columns = [],
    title = 'Exportação',
    filename = 'export',
    formats = ['csv', 'xlsx', 'pdf', 'json'],
    fetchData,
    showDateRange = false,
    organizationName,
    variant = 'light',
    size = 'sm',
    disabled = false,
    label = 'Exportar',
}: ExportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

    const handleExport = async (format: ExportFormat) => {
        setLoading(true);
        try {
            let exportDataSource = data;

            // Fetch data if function provided
            if (fetchData) {
                exportDataSource = await fetchData({
                    startDate: dateRange[0] || undefined,
                    endDate: dateRange[1] || undefined,
                });
            }

            const options: ExportOptions = {
                filename,
                title,
                columns,
                data: exportDataSource,
                format,
                organizationName,
                dateRange: dateRange[0] && dateRange[1] ? {
                    start: dateRange[0],
                    end: dateRange[1],
                } : undefined,
            };

            const result = await exportData(options);

            if (result.success && result.blob && result.filename) {
                downloadBlob(result.blob, result.filename);
            } else {
                console.error('Export failed:', result.error);
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Group gap="xs">
            {showDateRange && (
                <DatePickerInput
                    type="range"
                    placeholder="Período"
                    value={dateRange}
                    onChange={(value) => setDateRange(value as [Date | null, Date | null])}
                    size={size}
                    clearable
                    valueFormat="DD/MM/YYYY"
                />
            )}
            <Menu shadow="md" width={160}>
                <Menu.Target>
                    <Button
                        variant={variant}
                        size={size}
                        leftSection={<IconDownload size={16} />}
                        rightSection={<IconChevronDown size={14} />}
                        loading={loading}
                        disabled={disabled || (data.length === 0 && !fetchData)}
                    >
                        {label}
                    </Button>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Formato</Menu.Label>
                    {formats.map((format) => {
                        const config = FORMAT_CONFIG[format];
                        const Icon = config.icon;
                        return (
                            <Menu.Item
                                key={format}
                                leftSection={<Icon size={16} color={`var(--mantine-color-${config.color}-6)`} />}
                                onClick={() => handleExport(format)}
                            >
                                {config.label}
                            </Menu.Item>
                        );
                    })}
                </Menu.Dropdown>
            </Menu>
        </Group>
    );
}

// ----------------------------------------
// Full Export Modal
// ----------------------------------------

export interface ExportModalProps {
    opened: boolean;
    onClose: () => void;
    reports: ReportType[];
    organizationName?: string;
    onExport: (params: {
        report: ReportType;
        format: ExportFormat;
        startDate?: Date;
        endDate?: Date;
    }) => Promise<{ data: Record<string, any>[]; columns: ExportColumn[] }>;
}

export function ExportModal({
    opened,
    onClose,
    reports,
    organizationName,
    onExport,
}: ExportModalProps) {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        if (!selectedReport) return;

        setLoading(true);
        setError(null);

        try {
            const result = await onExport({
                report: selectedReport,
                format: selectedFormat,
                startDate: dateRange[0] || undefined,
                endDate: dateRange[1] || undefined,
            });

            const template = REPORT_TEMPLATES[selectedReport];

            const options: ExportOptions = {
                filename: `${selectedReport}-${new Date().toISOString().split('T')[0]}`,
                title: template.title,
                columns: result.columns || template.columns,
                data: result.data,
                format: selectedFormat,
                organizationName,
                dateRange: dateRange[0] && dateRange[1] ? {
                    start: dateRange[0],
                    end: dateRange[1],
                } : undefined,
            };

            const exportResult = await exportData(options);

            if (exportResult.success && exportResult.blob && exportResult.filename) {
                downloadBlob(exportResult.blob, exportResult.filename);
                onClose();
            } else {
                setError(exportResult.error || 'Falha ao exportar');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const reportOptions = reports.map(r => ({
        value: r,
        label: REPORT_TEMPLATES[r].title,
    }));

    const formatOptions: ExportFormat[] = ['csv', 'xlsx', 'pdf', 'json'];

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Exportar Relatório"
            size="md"
        >
            <LoadingOverlay visible={loading} />
            <Stack>
                {error && (
                    <Alert color="red" icon={<IconX size={16} />} withCloseButton onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Select
                    label="Relatório"
                    placeholder="Selecione o relatório"
                    data={reportOptions}
                    value={selectedReport}
                    onChange={(v) => setSelectedReport(v as ReportType)}
                    required
                />

                <DatePickerInput
                    type="range"
                    label="Período"
                    placeholder="Selecione o período"
                    value={dateRange}
                    onChange={(value) => setDateRange(value as [Date | null, Date | null])}
                    clearable
                    valueFormat="DD/MM/YYYY"
                />

                <Text size="sm" fw={500}>Formato</Text>
                <SimpleGrid cols={4} spacing="xs">
                    {formatOptions.map((format) => {
                        const config = FORMAT_CONFIG[format];
                        const Icon = config.icon;
                        const isSelected = selectedFormat === format;

                        return (
                            <Paper
                                key={format}
                                p="sm"
                                radius="md"
                                withBorder
                                onClick={() => setSelectedFormat(format)}
                                style={{
                                    cursor: 'pointer',
                                    borderColor: isSelected ? `var(--mantine-color-${config.color}-6)` : undefined,
                                    backgroundColor: isSelected ? `var(--mantine-color-${config.color}-light)` : undefined,
                                }}
                            >
                                <Stack align="center" gap={4}>
                                    <ThemeIcon
                                        size="lg"
                                        variant={isSelected ? 'filled' : 'light'}
                                        color={config.color}
                                    >
                                        <Icon size={18} />
                                    </ThemeIcon>
                                    <Text size="xs" fw={isSelected ? 600 : 400}>{config.label}</Text>
                                </Stack>
                            </Paper>
                        );
                    })}
                </SimpleGrid>

                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleExport}
                        disabled={!selectedReport}
                        leftSection={<IconDownload size={16} />}
                    >
                        Exportar
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

// ----------------------------------------
// Quick Export Buttons (Pre-configured)
// ----------------------------------------

interface QuickExportProps {
    data: Record<string, any>[];
    type: ReportType;
    organizationName?: string;
}

export function QuickExportButtons({ data, type, organizationName }: QuickExportProps) {
    const template = REPORT_TEMPLATES[type];

    return (
        <ExportButton
            data={data}
            columns={template.columns}
            title={template.title}
            filename={`${type}-${new Date().toISOString().split('T')[0]}`}
            organizationName={organizationName}
        />
    );
}

export default ExportButton;

