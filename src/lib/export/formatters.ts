/**
 * Brazilian Fiscal Formatters
 * 
 * Utility functions for formatting Brazilian fiscal data:
 * - Currency (BRL)
 * - CPF/CNPJ documents
 * - Dates (DD/MM/YYYY)
 * - Percentages
 * - Competency periods
 */

// ============================================================================
// CURRENCY FORMATTERS
// ============================================================================

/**
 * Format centavos to Brazilian Real (BRL) currency string
 * @param centavos Amount in centavos (integer)
 * @returns Formatted string like "R$ 1.234,56"
 */
export function formatBRL(centavos: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(centavos / 100);
}

/**
 * Format centavos to plain number string (Brazilian format)
 * @param centavos Amount in centavos
 * @returns Formatted string like "1.234,56"
 */
export function formatBRLPlain(centavos: number): string {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(centavos / 100);
}

/**
 * Parse BRL string to centavos
 * @param value String like "R$ 1.234,56" or "1234,56"
 * @returns Amount in centavos
 */
export function parseBRL(value: string): number {
    const cleaned = value
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    return Math.round(parseFloat(cleaned) * 100);
}

// ============================================================================
// PERCENTAGE FORMATTERS
// ============================================================================

/**
 * Format basis points to percentage string
 * @param basisPoints Percentage in basis points (10000 = 100%, 1500 = 15%)
 * @returns Formatted string like "15,00%"
 */
export function formatPercentage(basisPoints: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(basisPoints / 10000);
}

/**
 * Format basis points to plain percentage string (no symbol)
 * @param basisPoints Percentage in basis points
 * @returns Formatted string like "15,00"
 */
export function formatPercentagePlain(basisPoints: number): string {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(basisPoints / 100);
}

// ============================================================================
// DOCUMENT FORMATTERS (CPF/CNPJ)
// ============================================================================

/**
 * Format CPF with mask: 000.000.000-00
 * @param cpf Raw CPF string (11 digits)
 * @returns Formatted CPF
 */
export function formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '').padStart(11, '0');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Format CNPJ with mask: 00.000.000/0000-00
 * @param cnpj Raw CNPJ string (14 digits)
 * @returns Formatted CNPJ
 */
export function formatCNPJ(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '').padStart(14, '0');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Format document (CPF or CNPJ) based on length
 * @param document Raw document string
 * @returns Formatted document
 */
export function formatDocument(document: string): string {
    const cleaned = document.replace(/\D/g, '');
    if (cleaned.length <= 11) {
        return formatCPF(cleaned);
    }
    return formatCNPJ(cleaned);
}

/**
 * Validate CPF checksum
 * @param cpf Raw CPF string
 * @returns true if valid
 */
export function validateCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false; // All same digits

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * (10 - i);
    }
    let digit1 = (sum * 10) % 11;
    if (digit1 === 10) digit1 = 0;
    if (digit1 !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned[i]) * (11 - i);
    }
    let digit2 = (sum * 10) % 11;
    if (digit2 === 10) digit2 = 0;
    return digit2 === parseInt(cleaned[10]);
}

/**
 * Validate CNPJ checksum
 * @param cnpj Raw CNPJ string
 * @returns true if valid
 */
export function validateCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned[i]) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    if (digit1 !== parseInt(cleaned[12])) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned[i]) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    return digit2 === parseInt(cleaned[13]);
}

// ============================================================================
// DATE FORMATTERS
// ============================================================================

/**
 * Format date to Brazilian style: DD/MM/YYYY
 * @param date Date object or string
 * @returns Formatted date string
 */
export function formatDateBR(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR').format(d);
}

/**
 * Format date with time to Brazilian style: DD/MM/YYYY HH:MM
 * @param date Date object or string
 * @returns Formatted datetime string
 */
export function formatDateTimeBR(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

/**
 * Format competency period from YYYY-MM to MM/YYYY
 * @param period Competency period in YYYY-MM format
 * @returns Formatted string like "01/2026"
 */
export function formatCompetency(period: string): string {
    const [year, month] = period.split('-');
    return `${month}/${year}`;
}

/**
 * Get competency period from date: YYYY-MM
 * @param date Date object
 * @returns Competency period string
 */
export function getCompetencyPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Parse Brazilian date string (DD/MM/YYYY) to Date
 * @param dateStr Date string in DD/MM/YYYY format
 * @returns Date object
 */
export function parseDateBR(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}

// ============================================================================
// POSTAL CODE / PHONE FORMATTERS
// ============================================================================

/**
 * Format Brazilian postal code: 00000-000
 * @param cep Raw CEP string
 * @returns Formatted CEP
 */
export function formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '').padStart(8, '0');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Format Brazilian phone: (00) 00000-0000 or (00) 0000-0000
 * @param phone Raw phone string
 * @returns Formatted phone
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
}

// ============================================================================
// SPED-SPECIFIC FORMATTERS
// ============================================================================

/**
 * Format value for SPED text files (no formatting, comma decimal)
 * @param centavos Amount in centavos
 * @returns SPED-formatted string like "1234,56"
 */
export function formatSPEDValue(centavos: number): string {
    const value = (centavos / 100).toFixed(2);
    return value.replace('.', ',');
}

/**
 * Format date for SPED text files: DDMMYYYY
 * @param date Date object
 * @returns SPED date string
 */
export function formatSPEDDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}${month}${year}`;
}

/**
 * Format SPED register line with pipe separators
 * @param fields Array of field values
 * @returns SPED line like "|REG|FIELD1|FIELD2|"
 */
export function formatSPEDLine(fields: (string | number | null | undefined)[]): string {
    const formatted = fields.map(f => f === null || f === undefined ? '' : String(f));
    return `|${formatted.join('|')}|`;
}

