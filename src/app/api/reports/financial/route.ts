import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    invoices, courses, chartOfAccounts, journalEntries,
    journalEntryLines, organizationMemberships, persons
} from '@/lib/db/schema';
import { eq, and, sql, gte, lt, desc, asc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// ============================================================================
// Helper: Parse fiscal period from "YYYY-MM" string
// ============================================================================
function parsePeriod(period: string): { year: number; month: number; startTs: number; endTs: number } {
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1); // first day of next month
    return {
        year, month,
        startTs: Math.floor(start.getTime() / 1000),
        endTs: Math.floor(end.getTime() / 1000),
    };
}

// ============================================================================
// GET /api/reports/financial?period=2026-02&section=revenue|payments|defaulters|teachers|accounting
// ============================================================================
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '2026-02';
    const section = searchParams.get('section') || 'all';

    const { year, month, startTs, endTs } = parsePeriod(period);

    try {
        const result: Record<string, unknown> = {};

        // ───────────────────────────────────────────
        // REVENUE BY COURSE
        // ───────────────────────────────────────────
        if (section === 'all' || section === 'revenue') {
            const revenueRows = await db
                .select({
                    courseId: invoices.courseId,
                    courseName: courses.title,
                    revenue: sql<number>`COALESCE(SUM(${invoices.netAmount}), 0)`,
                    students: sql<number>`COUNT(DISTINCT ${invoices.studentUserId})`,
                })
                .from(invoices)
                .leftJoin(courses, eq(invoices.courseId, courses.id))
                .where(and(
                    eq(invoices.organizationId, orgId),
                    eq(invoices.status, 'paid'),
                    gte(invoices.paidDate, startTs),
                    lt(invoices.paidDate, endTs),
                ))
                .groupBy(invoices.courseId, courses.title);

            const totalRevenue = revenueRows.reduce((sum, r) => sum + (r.revenue || 0), 0);

            result.revenueByCourse = revenueRows.map((r, i) => ({
                name: r.courseName || 'Sem Curso',
                revenue: r.revenue || 0,
                students: r.students || 0,
                percentage: totalRevenue > 0 ? Math.round(((r.revenue || 0) / totalRevenue) * 100) : 0,
                color: ['#7950f2', '#228be6', '#40c057', '#fd7e14', '#e64980', '#15aabf'][i % 6],
            }));

            result.totalRevenue = totalRevenue;
        }

        // ───────────────────────────────────────────
        // PAYMENT METHODS
        // ───────────────────────────────────────────
        if (section === 'all' || section === 'payments') {
            const methodRows = await db
                .select({
                    method: invoices.paymentMethod,
                    amount: sql<number>`COALESCE(SUM(${invoices.netAmount}), 0)`,
                    count: sql<number>`COUNT(*)`,
                })
                .from(invoices)
                .where(and(
                    eq(invoices.organizationId, orgId),
                    eq(invoices.status, 'paid'),
                    gte(invoices.paidDate, startTs),
                    lt(invoices.paidDate, endTs),
                ))
                .groupBy(invoices.paymentMethod);

            const totalPayments = methodRows.reduce((sum, r) => sum + (r.amount || 0), 0);

            const methodLabels: Record<string, string> = {
                pix: 'PIX',
                credit_card: 'Cartão de Crédito',
                boleto: 'Boleto',
                transfer: 'Transferência',
            };

            result.paymentMethods = methodRows.map((r, i) => ({
                method: methodLabels[r.method || ''] || r.method || 'Outro',
                amount: r.amount || 0,
                count: r.count || 0,
                percentage: totalPayments > 0 ? Math.round(((r.amount || 0) / totalPayments) * 100) : 0,
                color: ['#228be6', '#7950f2', '#40c057', '#fd7e14'][i % 4],
            }));
        }

        // ───────────────────────────────────────────
        // DEFAULTERS (Overdue invoices)
        // ───────────────────────────────────────────
        if (section === 'all' || section === 'defaulters') {
            const nowTs = Math.floor(Date.now() / 1000);
            const overdueRows = await db
                .select({
                    id: invoices.id,
                    name: invoices.payerName,
                    course: courses.title,
                    amount: invoices.netAmount,
                    dueDate: invoices.dueDate,
                    status: invoices.status,
                })
                .from(invoices)
                .leftJoin(courses, eq(invoices.courseId, courses.id))
                .where(and(
                    eq(invoices.organizationId, orgId),
                    eq(invoices.status, 'overdue'),
                ))
                .orderBy(asc(invoices.dueDate))
                .limit(50);

            result.defaulters = overdueRows.map(r => ({
                id: r.id,
                name: r.name,
                course: r.course || 'N/A',
                amount: r.amount || 0,
                daysPast: Math.max(0, Math.floor((nowTs - (r.dueDate || nowTs)) / 86400)),
                status: 'overdue',
            }));
        }

        // ───────────────────────────────────────────
        // TEACHER COST ANALYSIS
        // ───────────────────────────────────────────
        if (section === 'all' || section === 'teachers') {
            // Get staff members with 'teacher' role
            const teacherRows = await db
                .select({
                    id: persons.id,
                    name: sql<string>`COALESCE(${persons.displayName}, ${persons.firstName} || ' ' || ${persons.lastName})`,
                    email: persons.primaryEmail,
                })
                .from(organizationMemberships)
                .innerJoin(persons, eq(organizationMemberships.personId, persons.id))
                .where(and(
                    eq(organizationMemberships.organizationId, orgId),
                    eq(organizationMemberships.role, 'teacher'),
                    eq(organizationMemberships.status, 'active'),
                ))
                .limit(100);

            // For each teacher, compute basic stats from actual data
            // (In a real scenario, this would come from payroll + class assignments)
            result.teachers = teacherRows.map(t => ({
                id: t.id,
                name: t.name || 'Professor',
                email: t.email || '',
                classes: 0,
                students: 0,
                salary: 0,
                bonus: 0,
                totalCost: 0,
                hoursPerWeek: 0,
                revenueGenerated: 0,
                efficiency: 0,
                costPerStudent: 0,
                trend: 0,
            }));

            result.costBreakdown = {
                salaries: 0,
                bonuses: 0,
                benefits: 0,
                training: 0,
                total: 0,
                asPercentOfRevenue: 0,
            };
        }

        // ───────────────────────────────────────────
        // ACCOUNTING: DRE, Balanço, Balancete
        // ───────────────────────────────────────────
        if (section === 'all' || section === 'accounting') {
            // --- Balancete (Trial Balance) ---
            // Get all journal entry lines for the period, grouped by account
            const balanceteRaw = await db
                .select({
                    accountId: journalEntryLines.accountId,
                    code: chartOfAccounts.code,
                    name: chartOfAccounts.name,
                    level: chartOfAccounts.level,
                    accountType: chartOfAccounts.accountType,
                    nature: chartOfAccounts.nature,
                    debit: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntryLines.entryType} = 'debit' THEN ${journalEntryLines.amountCents} ELSE 0 END), 0)`,
                    credit: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntryLines.entryType} = 'credit' THEN ${journalEntryLines.amountCents} ELSE 0 END), 0)`,
                })
                .from(journalEntryLines)
                .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
                .innerJoin(chartOfAccounts, eq(journalEntryLines.accountId, chartOfAccounts.id))
                .where(and(
                    eq(journalEntries.organizationId, orgId),
                    eq(journalEntries.status, 'posted'),
                    eq(journalEntries.fiscalYear, year),
                    eq(journalEntries.fiscalMonth, month),
                ))
                .groupBy(journalEntryLines.accountId, chartOfAccounts.code, chartOfAccounts.name,
                    chartOfAccounts.level, chartOfAccounts.accountType, chartOfAccounts.nature)
                .orderBy(asc(chartOfAccounts.code));

            result.balancete = balanceteRaw.map(r => {
                const level = r.level || 1;
                const accountType = level === 1 ? 'group' : level === 2 ? 'subgroup' : 'account';
                return {
                    code: r.code || '',
                    name: r.name || '',
                    type: accountType as 'group' | 'subgroup' | 'account',
                    balance: (r.debit - r.credit) / 100, // centavos → reais
                    debit: r.debit / 100,
                    credit: r.credit / 100,
                };
            });

            // --- DRE (Income Statement) ---
            // Build from revenue and expense accounts for the period
            const dreAccounts = await db
                .select({
                    code: chartOfAccounts.code,
                    name: chartOfAccounts.name,
                    accountType: chartOfAccounts.accountType,
                    classification: chartOfAccounts.classification,
                    level: chartOfAccounts.level,
                    debit: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntryLines.entryType} = 'debit' THEN ${journalEntryLines.amountCents} ELSE 0 END), 0)`,
                    credit: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntryLines.entryType} = 'credit' THEN ${journalEntryLines.amountCents} ELSE 0 END), 0)`,
                })
                .from(chartOfAccounts)
                .leftJoin(journalEntryLines, and(
                    eq(journalEntryLines.accountId, chartOfAccounts.id),
                    sql`${journalEntryLines.entryId} IN (
                        SELECT id FROM journal_entries 
                        WHERE organization_id = ${orgId}
                        AND status = 'posted'
                        AND fiscal_year = ${year}
                        AND fiscal_month = ${month}
                    )`
                ))
                .where(and(
                    eq(chartOfAccounts.organizationId, orgId),
                    sql`${chartOfAccounts.accountType} IN ('revenue', 'expense')`,
                ))
                .groupBy(chartOfAccounts.code, chartOfAccounts.name,
                    chartOfAccounts.accountType, chartOfAccounts.classification, chartOfAccounts.level)
                .orderBy(asc(chartOfAccounts.code));

            // Build DRE items
            const dreItems: { name: string; value: number; type: string }[] = [];
            let totalReceita = 0;
            let totalDespesa = 0;

            // Revenue accounts (credit nature = positive)
            const revenueAccts = dreAccounts.filter(a => a.accountType === 'revenue');
            if (revenueAccts.length > 0) {
                dreItems.push({ name: 'RECEITA OPERACIONAL', value: 0, type: 'header' });
                for (const acct of revenueAccts) {
                    const val = (acct.credit - acct.debit) / 100;
                    totalReceita += val;
                    dreItems.push({ name: `  ${acct.name}`, value: val, type: 'item' });
                }
                dreItems.push({ name: 'Total Receita', value: totalReceita, type: 'subtotal' });
            }

            // Expense accounts (debit nature = positive)
            const expenseAccts = dreAccounts.filter(a => a.accountType === 'expense');
            if (expenseAccts.length > 0) {
                dreItems.push({ name: 'DESPESAS OPERACIONAIS', value: 0, type: 'header' });
                for (const acct of expenseAccts) {
                    const val = (acct.debit - acct.credit) / 100;
                    totalDespesa += val;
                    dreItems.push({ name: `  ${acct.name}`, value: -val, type: 'item' });
                }
                dreItems.push({ name: 'Total Despesas', value: -totalDespesa, type: 'subtotal' });
            }

            dreItems.push({ name: 'RESULTADO LÍQUIDO', value: totalReceita - totalDespesa, type: 'total' });
            result.dre = dreItems;

            // --- Balanço Patrimonial (Balance Sheet) ---
            // Get ALL posted entries up to end of period (cumulative)
            const bsAccounts = await db
                .select({
                    code: chartOfAccounts.code,
                    name: chartOfAccounts.name,
                    accountType: chartOfAccounts.accountType,
                    classification: chartOfAccounts.classification,
                    nature: chartOfAccounts.nature,
                    debit: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntryLines.entryType} = 'debit' THEN ${journalEntryLines.amountCents} ELSE 0 END), 0)`,
                    credit: sql<number>`COALESCE(SUM(CASE WHEN ${journalEntryLines.entryType} = 'credit' THEN ${journalEntryLines.amountCents} ELSE 0 END), 0)`,
                })
                .from(chartOfAccounts)
                .leftJoin(journalEntryLines, and(
                    eq(journalEntryLines.accountId, chartOfAccounts.id),
                    sql`${journalEntryLines.entryId} IN (
                        SELECT id FROM journal_entries 
                        WHERE organization_id = ${orgId}
                        AND status = 'posted'
                        AND (fiscal_year < ${year} OR (fiscal_year = ${year} AND fiscal_month <= ${month}))
                    )`
                ))
                .where(and(
                    eq(chartOfAccounts.organizationId, orgId),
                    sql`${chartOfAccounts.accountType} IN ('asset', 'liability', 'equity')`,
                    eq(chartOfAccounts.isActive, 1),
                ))
                .groupBy(chartOfAccounts.code, chartOfAccounts.name,
                    chartOfAccounts.accountType, chartOfAccounts.classification, chartOfAccounts.nature)
                .orderBy(asc(chartOfAccounts.code));

            // Group by classification
            const toLineItem = (acct: typeof bsAccounts[number]) => ({
                name: acct.name || '',
                value: (acct.nature === 'debit'
                    ? (acct.debit - acct.credit)
                    : (acct.credit - acct.debit)) / 100,
            });

            const classificationMap: Record<string, string[]> = {
                'current_asset': [], 'non_current_asset': [], 'fixed_asset': [], 'intangible_asset': [],
                'current_liability': [], 'non_current_liability': [],
                'capital': [], 'reserves': [], 'retained_earnings': [],
            };

            result.balanco = {
                ativo: {
                    circulante: bsAccounts
                        .filter(a => a.classification === 'current_asset')
                        .map(toLineItem),
                    naoCirculante: bsAccounts
                        .filter(a => ['non_current_asset', 'fixed_asset', 'intangible_asset'].includes(a.classification || ''))
                        .map(toLineItem),
                },
                passivo: {
                    circulante: bsAccounts
                        .filter(a => a.classification === 'current_liability')
                        .map(toLineItem),
                    naoCirculante: bsAccounts
                        .filter(a => a.classification === 'non_current_liability')
                        .map(toLineItem),
                },
                patrimonioLiquido: bsAccounts
                    .filter(a => ['capital', 'reserves', 'retained_earnings'].includes(a.classification || ''))
                    .map(toLineItem),
            };
        }

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error generating financial report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
