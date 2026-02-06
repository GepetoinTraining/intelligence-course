import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { chartOfAccounts, journalEntries, journalEntryLines, fiscalDocuments, staffPayroll, users } from '@/lib/db/schema';

// Simplified export API that handles the reports we have proper schema support for

export type ExportableReport =
    | 'chart-of-accounts'
    | 'journal-entries'
    | 'fiscal-documents'
    | 'payroll';

interface ExportQuery {
    report: ExportableReport;
    startDate?: string;
    endDate?: string;
    year?: string;
    month?: string;
    status?: string;
}

// GET /api/export?report=journal-entries&startDate=2026-01-01&endDate=2026-01-31
export async function GET(request: NextRequest) {
    try {
        const { personId, orgId } = await getApiAuthWithOrg();

        if (!personId || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const report = searchParams.get('report') as ExportableReport;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const status = searchParams.get('status');

        if (!report) {
            return NextResponse.json({
                error: 'Report type is required',
                availableReports: [
                    'chart-of-accounts',
                    'journal-entries',
                    'fiscal-documents',
                    'payroll',
                ],
            }, { status: 400 });
        }

        // Parse dates
        const startTs = startDate ? new Date(startDate).getTime() : undefined;
        const endTs = endDate ? new Date(endDate).getTime() : undefined;

        let data: any[] = [];
        let metadata: Record<string, any> = {
            report,
            generatedAt: new Date().toISOString(),
            organizationId: orgId,
        };

        switch (report) {
            case 'chart-of-accounts': {
                const accounts = await db
                    .select()
                    .from(chartOfAccounts)
                    .where(eq(chartOfAccounts.organizationId, orgId))
                    .orderBy(chartOfAccounts.code);

                data = accounts.map(acc => ({
                    code: acc.code,
                    name: acc.name,
                    accountType: acc.accountType,
                    nature: acc.nature,
                    classification: acc.classification,
                    level: acc.level,
                    allowsPosting: acc.allowsPosting ? 'Sim' : 'Não',
                    isActive: acc.isActive ? 'Ativo' : 'Inativo',
                }));
                break;
            }

            case 'journal-entries': {
                const conditions = [eq(journalEntries.organizationId, orgId)];

                if (year) {
                    conditions.push(eq(journalEntries.fiscalYear, parseInt(year)));
                }
                if (month) {
                    conditions.push(eq(journalEntries.fiscalMonth, parseInt(month)));
                }
                if (startTs) {
                    conditions.push(gte(journalEntries.referenceDate, startTs));
                }
                if (endTs) {
                    conditions.push(lte(journalEntries.referenceDate, endTs));
                }
                if (status) {
                    conditions.push(eq(journalEntries.status, status as any));
                }

                const entries = await db
                    .select({
                        entry: journalEntries,
                        line: journalEntryLines,
                        account: chartOfAccounts,
                    })
                    .from(journalEntries)
                    .leftJoin(journalEntryLines, eq(journalEntries.id, journalEntryLines.entryId))
                    .leftJoin(chartOfAccounts, eq(journalEntryLines.accountId, chartOfAccounts.id))
                    .where(and(...conditions))
                    .orderBy(journalEntries.entryNumber, journalEntryLines.lineNumber);

                data = entries.map(row => ({
                    entryNumber: row.entry.entryNumber,
                    date: row.entry.referenceDate,
                    accountCode: row.account?.code || '',
                    accountName: row.account?.name || '',
                    description: row.line?.description || row.entry.description,
                    debit: row.line?.entryType === 'debit' ? row.line.amountCents : null,
                    credit: row.line?.entryType === 'credit' ? row.line.amountCents : null,
                    status: row.entry.status,
                }));

                metadata.fiscalYear = year;
                metadata.fiscalMonth = month;
                break;
            }

            case 'fiscal-documents': {
                const conditions = [eq(fiscalDocuments.organizationId, orgId)];

                if (startTs) {
                    conditions.push(gte(fiscalDocuments.issueDate, startTs));
                }
                if (endTs) {
                    conditions.push(lte(fiscalDocuments.issueDate, endTs));
                }
                if (status) {
                    conditions.push(eq(fiscalDocuments.status, status as any));
                }

                const docs = await db
                    .select()
                    .from(fiscalDocuments)
                    .where(and(...conditions))
                    .orderBy(desc(fiscalDocuments.issueDate));

                data = docs.map(doc => ({
                    documentNumber: doc.documentNumber,
                    series: doc.series,
                    documentType: doc.documentType,
                    issueDate: doc.issueDate,
                    recipientName: doc.recipientName,
                    recipientDocument: doc.recipientDocument,
                    totalAmount: doc.totalAmountCents,
                    netAmount: doc.netAmountCents,
                    issAmount: doc.issAmountCents,
                    pisAmount: doc.pisAmountCents,
                    cofinsAmount: doc.cofinsAmountCents,
                    irAmount: doc.irAmountCents,
                    status: doc.status,
                    accessKey: doc.accessKey,
                }));
                break;
            }

            case 'payroll': {
                const conditions = [eq(staffPayroll.organizationId, orgId)];

                if (startTs) {
                    conditions.push(gte(staffPayroll.periodStart, startTs));
                }
                if (endTs) {
                    conditions.push(lte(staffPayroll.periodEnd, endTs));
                }
                if (status) {
                    conditions.push(eq(staffPayroll.status, status as any));
                }

                const payrollData = await db
                    .select({
                        payroll: staffPayroll,
                        user: users,
                    })
                    .from(staffPayroll)
                    .leftJoin(users, eq(staffPayroll.personId, users.id))
                    .where(and(...conditions))
                    .orderBy(desc(staffPayroll.periodStart));

                data = payrollData.map(row => {
                    const deductions = row.payroll.deductions
                        ? (typeof row.payroll.deductions === 'string'
                            ? JSON.parse(row.payroll.deductions)
                            : row.payroll.deductions)
                        : {};
                    const totalDeductions = row.payroll.totalDeductionsCents || 0;
                    const inss = deductions.INSS || 0;
                    const irrf = deductions.IRRF || deductions.IR || 0;

                    return {
                        employeeName: row.user?.name || '',
                        email: row.user?.email || '',
                        periodStart: row.payroll.periodStart,
                        periodEnd: row.payroll.periodEnd,
                        payrollType: row.payroll.payrollType,
                        grossAmount: row.payroll.grossAmountCents,
                        inss: inss,
                        irrf: irrf,
                        otherDeductions: totalDeductions - inss - irrf,
                        totalDeductions: totalDeductions,
                        totalAdditions: row.payroll.totalAdditionsCents,
                        netAmount: row.payroll.netAmountCents,
                        paidAmount: row.payroll.paidAmountCents,
                        status: row.payroll.status,
                    };
                });
                break;
            }

            default:
                return NextResponse.json({
                    error: `Report type '${report}' is not yet implemented`,
                }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            metadata,
            data,
            count: data.length,
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({
            error: 'Failed to generate export data',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}



