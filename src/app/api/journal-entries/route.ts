import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/lib/db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/journal-entries - List journal entries
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fiscalYear = searchParams.get('year');
    const fiscalMonth = searchParams.get('month');
    const status = searchParams.get('status');
    const sourceType = searchParams.get('sourceType');
    const sourceId = searchParams.get('sourceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [eq(journalEntries.organizationId, orgId)];

        if (fiscalYear) {
            conditions.push(eq(journalEntries.fiscalYear, parseInt(fiscalYear)));
        }

        if (fiscalMonth) {
            conditions.push(eq(journalEntries.fiscalMonth, parseInt(fiscalMonth)));
        }

        if (status) {
            conditions.push(eq(journalEntries.status, status as any));
        }

        if (sourceType) {
            conditions.push(eq(journalEntries.sourceType, sourceType as any));
        }

        if (sourceId) {
            conditions.push(eq(journalEntries.sourceId, sourceId));
        }

        if (startDate) {
            conditions.push(gte(journalEntries.referenceDate, parseInt(startDate)));
        }

        if (endDate) {
            conditions.push(lte(journalEntries.referenceDate, parseInt(endDate)));
        }

        const result = await db
            .select()
            .from(journalEntries)
            .where(and(...conditions))
            .orderBy(desc(journalEntries.referenceDate), desc(journalEntries.entryNumber))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
    }
}

// POST /api/journal-entries - Create journal entry with lines
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate lines exist
        if (!body.lines || !Array.isArray(body.lines) || body.lines.length < 2) {
            return NextResponse.json({
                error: 'Journal entry must have at least 2 lines (debit and credit)'
            }, { status: 400 });
        }

        // Validate debit = credit
        let totalDebit = 0;
        let totalCredit = 0;

        for (const line of body.lines) {
            if (line.entryType === 'debit') {
                totalDebit += line.amountCents;
            } else if (line.entryType === 'credit') {
                totalCredit += line.amountCents;
            }
        }

        if (totalDebit !== totalCredit) {
            return NextResponse.json({
                error: `Débitos (${totalDebit / 100}) devem ser iguais aos créditos (${totalCredit / 100})`,
                totalDebit,
                totalCredit,
            }, { status: 400 });
        }

        // Get or generate entry number
        const referenceDate = new Date(body.referenceDate || Date.now());
        const fiscalYear = body.fiscalYear || referenceDate.getFullYear();
        const fiscalMonth = body.fiscalMonth || referenceDate.getMonth() + 1;

        // Get next entry number for period
        const lastEntry = await db
            .select({ entryNumber: journalEntries.entryNumber })
            .from(journalEntries)
            .where(
                and(
                    eq(journalEntries.organizationId, orgId),
                    eq(journalEntries.fiscalYear, fiscalYear),
                    eq(journalEntries.fiscalMonth, fiscalMonth)
                )
            )
            .orderBy(desc(journalEntries.entryNumber))
            .limit(1);

        const entryNumber = (lastEntry[0]?.entryNumber || 0) + 1;

        // Create entry
        const newEntry = await db.insert(journalEntries).values({
            organizationId: orgId,
            entryNumber,
            referenceDate: referenceDate.getTime(),
            postingDate: Date.now(),
            fiscalYear,
            fiscalMonth,
            description: body.description,
            memo: body.memo,
            sourceType: body.sourceType || 'manual',
            sourceId: body.sourceId,
            status: body.autoPost ? 'posted' : 'draft',
            createdBy: userId,
            postedBy: body.autoPost ? userId : null,
            postedAt: body.autoPost ? Date.now() : null,
        }).returning();

        const entryId = newEntry[0].id;

        // Create lines
        const linesToInsert = body.lines.map((line: any, index: number) => ({
            entryId,
            accountId: line.accountId,
            costCenterId: line.costCenterId || null,
            amountCents: line.amountCents,
            currency: line.currency || 'BRL',
            entryType: line.entryType,
            description: line.description,
            taxCode: line.taxCode,
            taxAmountCents: line.taxAmountCents,
            documentNumber: line.documentNumber,
            documentDate: line.documentDate,
            lineNumber: index + 1,
        }));

        await db.insert(journalEntryLines).values(linesToInsert);

        return NextResponse.json({
            data: {
                ...newEntry[0],
                lines: linesToInsert,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating journal entry:', error);
        return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
    }
}



