/**
 * Export Service
 * 
 * Handles exporting data to various formats:
 * - PDF (using @react-pdf/renderer or html-to-pdf)
 * - CSV (native implementation)
 * - Excel (using xlsx library)
 * - JSON (native)
 * - SPED ECD format (Brazilian accounting)
 */

// ----------------------------------------
// Types
// ----------------------------------------

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json' | 'sped-ecd' | 'xml';

export interface ExportColumn {
    key: string;
    label: string;
    width?: number;
    format?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'percentage';
    align?: 'left' | 'center' | 'right';
}

export interface ExportOptions {
    filename: string;
    title?: string;
    subtitle?: string;
    columns: ExportColumn[];
    data: Record<string, any>[];
    format: ExportFormat;
    includeFooter?: boolean;
    footerText?: string;
    organizationName?: string;
    generatedBy?: string;
    dateRange?: { start: Date; end: Date };
}

export interface ExportResult {
    success: boolean;
    filename?: string;
    blob?: Blob;
    base64?: string;
    error?: string;
}

// ----------------------------------------
// Formatters
// ----------------------------------------

function formatValue(value: any, format?: ExportColumn['format']): string {
    if (value === null || value === undefined) return '';

    switch (format) {
        case 'currency':
            const cents = typeof value === 'number' ? value : parseInt(value) || 0;
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(cents / 100);

        case 'number':
            return new Intl.NumberFormat('pt-BR').format(value);

        case 'percentage':
            return `${(value * 100).toFixed(2)}%`;

        case 'date':
            const date = new Date(value);
            return date.toLocaleDateString('pt-BR');

        case 'datetime':
            const datetime = new Date(value);
            return datetime.toLocaleString('pt-BR');

        default:
            return String(value);
    }
}

// ----------------------------------------
// CSV Export
// ----------------------------------------

export function exportToCSV(options: ExportOptions): ExportResult {
    try {
        const { columns, data, filename } = options;

        // Header row
        const headers = columns.map(col => `"${col.label}"`).join(',');

        // Data rows
        const rows = data.map(row => {
            return columns.map(col => {
                const value = row[col.key];
                const formatted = formatValue(value, col.format);
                // Escape quotes and wrap in quotes
                return `"${String(formatted).replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

        return {
            success: true,
            filename: `${filename}.csv`,
            blob,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to export CSV',
        };
    }
}

// ----------------------------------------
// JSON Export
// ----------------------------------------

export function exportToJSON(options: ExportOptions): ExportResult {
    try {
        const { columns, data, filename, title, organizationName, dateRange } = options;

        const exportData = {
            metadata: {
                title,
                organization: organizationName,
                generatedAt: new Date().toISOString(),
                dateRange: dateRange ? {
                    start: dateRange.start.toISOString(),
                    end: dateRange.end.toISOString(),
                } : undefined,
                columns: columns.map(col => ({
                    key: col.key,
                    label: col.label,
                    format: col.format,
                })),
            },
            data,
            summary: {
                totalRecords: data.length,
            },
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

        return {
            success: true,
            filename: `${filename}.json`,
            blob,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to export JSON',
        };
    }
}

// ----------------------------------------
// Excel Export (XLSX) - Browser-compatible
// ----------------------------------------

export async function exportToExcel(options: ExportOptions): Promise<ExportResult> {
    try {
        // Dynamic import to avoid SSR issues - xlsx is an optional dependency
        // @ts-ignore - xlsx may not be installed
        const XLSX = await import('xlsx').catch(() => null);

        if (!XLSX) {
            // Fallback to CSV if xlsx is not available
            return exportToCSV(options);
        }

        const { columns, data, filename, title } = options;

        // Prepare worksheet data
        const wsData: any[][] = [];

        // Title row (if provided)
        if (title) {
            wsData.push([title]);
            wsData.push([]); // Empty row
        }

        // Header row
        wsData.push(columns.map(col => col.label));

        // Data rows
        data.forEach(row => {
            wsData.push(columns.map(col => {
                const value = row[col.key];
                // For Excel, keep numbers as numbers
                if (col.format === 'currency') {
                    return typeof value === 'number' ? value / 100 : 0;
                }
                if (col.format === 'number' || col.format === 'percentage') {
                    return typeof value === 'number' ? value : parseFloat(value) || 0;
                }
                return formatValue(value, col.format);
            }));
        });

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = columns.map(col => ({ wch: col.width || 15 }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Dados');

        // Generate buffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        return {
            success: true,
            filename: `${filename}.xlsx`,
            blob,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to export Excel',
        };
    }
}

// ----------------------------------------
// PDF Export - HTML Template
// ----------------------------------------

export function generatePDFHTML(options: ExportOptions): string {
    const { title, subtitle, columns, data, organizationName, generatedBy, dateRange, footerText } = options;

    const now = new Date().toLocaleString('pt-BR');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>${title || 'Export'}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1f2937;
            padding: 20px;
            margin: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 15px;
        }
        .header h1 {
            margin: 0 0 5px 0;
            font-size: 18pt;
            color: #1e3a8a;
        }
        .header h2 {
            margin: 0;
            font-size: 12pt;
            font-weight: normal;
            color: #6b7280;
        }
        .meta {
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            color: #6b7280;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background: #1e3a8a;
            color: white;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            font-size: 9pt;
        }
        td {
            padding: 6px 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 9pt;
        }
        tr:nth-child(even) td {
            background: #f9fafb;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 8pt;
            color: #9ca3af;
            text-align: center;
        }
        .summary {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 4px;
            font-size: 9pt;
            margin-bottom: 20px;
        }
        @media print {
            body { padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        ${organizationName ? `<p style="margin: 0 0 5px 0; font-size: 10pt;">${organizationName}</p>` : ''}
        <h1>${title || 'Relatório'}</h1>
        ${subtitle ? `<h2>${subtitle}</h2>` : ''}
    </div>
    
    <div class="meta">
        <span>
            ${dateRange ? `Período: ${dateRange.start.toLocaleDateString('pt-BR')} a ${dateRange.end.toLocaleDateString('pt-BR')}` : ''}
        </span>
        <span>Gerado em: ${now}${generatedBy ? ` por ${generatedBy}` : ''}</span>
    </div>
    
    <div class="summary">
        <strong>Total de registros:</strong> ${data.length}
    </div>
    
    <table>
        <thead>
            <tr>
                ${columns.map(col => `<th class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">${col.label}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map(row => `
                <tr>
                    ${columns.map(col => `<td class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">${formatValue(row[col.key], col.format)}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="footer">
        ${footerText || 'Documento gerado automaticamente pelo sistema Node Zero'}
        <br>
        Este documento é válido para fins de verificação fiscal e contábil.
    </div>
</body>
</html>
    `.trim();
}

export async function exportToPDF(options: ExportOptions): Promise<ExportResult> {
    try {
        const html = generatePDFHTML(options);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });

        // Note: For actual PDF generation, use server-side rendering with puppeteer
        // or a service like react-pdf. This returns HTML for print-to-PDF.
        return {
            success: true,
            filename: `${options.filename}.html`,
            blob,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to export PDF',
        };
    }
}

// ----------------------------------------
// Download Helper
// ----------------------------------------

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ----------------------------------------
// Main Export Function
// ----------------------------------------

export async function exportData(options: ExportOptions): Promise<ExportResult> {
    switch (options.format) {
        case 'csv':
            return exportToCSV(options);
        case 'json':
            return exportToJSON(options);
        case 'xlsx':
            return await exportToExcel(options);
        case 'pdf':
            return await exportToPDF(options);
        default:
            return {
                success: false,
                error: `Unsupported format: ${options.format}`,
            };
    }
}

// ----------------------------------------
// Predefined Report Templates
// ----------------------------------------

export const REPORT_TEMPLATES = {
    // Financial Reports
    balancete: {
        title: 'Balancete de Verificação',
        columns: [
            { key: 'code', label: 'Código', width: 15 },
            { key: 'name', label: 'Conta', width: 40 },
            { key: 'previousBalance', label: 'Saldo Anterior', format: 'currency' as const, align: 'right' as const, width: 18 },
            { key: 'debits', label: 'Débitos', format: 'currency' as const, align: 'right' as const, width: 18 },
            { key: 'credits', label: 'Créditos', format: 'currency' as const, align: 'right' as const, width: 18 },
            { key: 'currentBalance', label: 'Saldo Atual', format: 'currency' as const, align: 'right' as const, width: 18 },
        ],
    },

    dre: {
        title: 'Demonstração do Resultado do Exercício',
        columns: [
            { key: 'description', label: 'Descrição', width: 50 },
            { key: 'currentPeriod', label: 'Período Atual', format: 'currency' as const, align: 'right' as const, width: 20 },
            { key: 'previousPeriod', label: 'Período Anterior', format: 'currency' as const, align: 'right' as const, width: 20 },
            { key: 'variation', label: 'Variação %', format: 'percentage' as const, align: 'right' as const, width: 15 },
        ],
    },

    journalEntries: {
        title: 'Livro Diário',
        columns: [
            { key: 'entryNumber', label: 'Nº', width: 10 },
            { key: 'date', label: 'Data', format: 'date' as const, width: 12 },
            { key: 'accountCode', label: 'Conta', width: 15 },
            { key: 'accountName', label: 'Nome da Conta', width: 30 },
            { key: 'description', label: 'Histórico', width: 35 },
            { key: 'debit', label: 'Débito', format: 'currency' as const, align: 'right' as const, width: 15 },
            { key: 'credit', label: 'Crédito', format: 'currency' as const, align: 'right' as const, width: 15 },
        ],
    },

    payroll: {
        title: 'Folha de Pagamento',
        columns: [
            { key: 'employeeName', label: 'Funcionário', width: 25 },
            { key: 'department', label: 'Departamento', width: 15 },
            { key: 'grossAmount', label: 'Bruto', format: 'currency' as const, align: 'right' as const, width: 15 },
            { key: 'inss', label: 'INSS', format: 'currency' as const, align: 'right' as const, width: 12 },
            { key: 'irrf', label: 'IRRF', format: 'currency' as const, align: 'right' as const, width: 12 },
            { key: 'otherDeductions', label: 'Outros Desc.', format: 'currency' as const, align: 'right' as const, width: 12 },
            { key: 'netAmount', label: 'Líquido', format: 'currency' as const, align: 'right' as const, width: 15 },
        ],
    },

    fiscalDocuments: {
        title: 'Relação de Notas Fiscais',
        columns: [
            { key: 'documentNumber', label: 'Número', width: 15 },
            { key: 'series', label: 'Série', width: 8 },
            { key: 'issueDate', label: 'Emissão', format: 'date' as const, width: 12 },
            { key: 'recipientName', label: 'Destinatário', width: 30 },
            { key: 'recipientDocument', label: 'CPF/CNPJ', width: 18 },
            { key: 'totalAmount', label: 'Valor Total', format: 'currency' as const, align: 'right' as const, width: 15 },
            { key: 'status', label: 'Status', width: 12 },
        ],
    },

    taxWithholdings: {
        title: 'Retenções de Impostos (DIRF)',
        columns: [
            { key: 'beneficiaryName', label: 'Beneficiário', width: 25 },
            { key: 'beneficiaryDocument', label: 'CPF/CNPJ', width: 18 },
            { key: 'taxType', label: 'Imposto', width: 10 },
            { key: 'baseAmount', label: 'Base', format: 'currency' as const, align: 'right' as const, width: 15 },
            { key: 'rate', label: 'Alíquota', format: 'percentage' as const, align: 'right' as const, width: 10 },
            { key: 'amount', label: 'Retido', format: 'currency' as const, align: 'right' as const, width: 15 },
            { key: 'dueDate', label: 'Vencimento', format: 'date' as const, width: 12 },
        ],
    },

    students: {
        title: 'Lista de Alunos',
        columns: [
            { key: 'name', label: 'Nome', width: 30 },
            { key: 'email', label: 'E-mail', width: 25 },
            { key: 'phone', label: 'Telefone', width: 15 },
            { key: 'enrollmentDate', label: 'Matrícula', format: 'date' as const, width: 12 },
            { key: 'course', label: 'Curso', width: 20 },
            { key: 'status', label: 'Status', width: 12 },
        ],
    },

    invoices: {
        title: 'Relatório de Faturas',
        columns: [
            { key: 'invoiceNumber', label: 'Nº Fatura', width: 12 },
            { key: 'studentName', label: 'Aluno', width: 25 },
            { key: 'dueDate', label: 'Vencimento', format: 'date' as const, width: 12 },
            { key: 'amount', label: 'Valor', format: 'currency' as const, align: 'right' as const, width: 15 },
            { key: 'paidAt', label: 'Pago em', format: 'date' as const, width: 12 },
            { key: 'status', label: 'Status', width: 12 },
            { key: 'paymentMethod', label: 'Método', width: 12 },
        ],
    },
};

export type ReportType = keyof typeof REPORT_TEMPLATES;

