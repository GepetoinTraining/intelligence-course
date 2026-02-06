import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/journal-entries/[id] - Get entry with lines
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const entry = await db
            .select()
            .from(journalEntries)
            .where(
                and(
                    eq(journalEntries.id, id),
                    eq(journalEntries.organizationId, orgId)
                )
            )
            .limit(1);

        if (entry.length === 0) {
            return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
        }

        // Get lines with account info
        const lines = await db
            .select({
                line: journalEntryLines,
                account: {
                    code: chartOfAccounts.code,
                    name: chartOfAccounts.name,
                    nature: chartOfAccounts.nature,
                }
            })
            .from(journalEntryLines)
            .leftJoin(chartOfAccounts, eq(journalEntryLines.accountId, chartOfAccounts.id))
            .where(eq(journalEntryLines.entryId, id))
            .orderBy(journalEntryLines.lineNumber);

        const formattedLines = lines.map(l => ({
            ...l.line,
            accountCode: l.account?.code,
            accountName: l.account?.name,
            accountNature: l.account?.nature,
        }));

        return NextResponse.json({
            data: {
                ...entry[0],
                lines: formattedLines,
            }
        });
    } catch (error) {
        console.error('Error fetching journal entry:', error);
        return NextResponse.json({ error: 'Failed to fetch journal entry' }, { status: 500 });
    }
}

// PATCH /api/journal-entries/[id] - Update entry (post, reverse, update memo)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await db
            .select()
            .from(journalEntries)
            .where(
                and(
                    eq(journalEntries.id, id),
                    eq(journalEntries.organizationId, orgId)
                )
            )
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
        }

        const currentEntry = existing[0];
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Date.now(),
        };

        // Handle status transitions
        if (body.status !== undefined) {
            // Can only post from draft
            if (body.status === 'posted' && currentEntry.status !== 'draft') {
                return NextResponse.json({ error: 'Only draft entries can be posted' }, { status: 400 });
            }

            // Can only reverse posted entries
            if (body.status === 'reversed' && currentEntry.status !== 'posted') {
                return NextResponse.json({ error: 'Only posted entries can be reversed' }, { status: 400 });
            }

            updateData.status = body.status;

            if (body.status === 'posted') {
                updateData.postedBy = personId;
                updateData.postedAt = Date.now();
            }
        }

        // Allow updating memo and description on drafts
        if (currentEntry.status === 'draft') {
            if (body.description !== undefined) updateData.description = body.description;
            if (body.memo !== undefined) updateData.memo = body.memo;
        }

        const updated = await db
            .update(journalEntries)
            .set(updateData)
            .where(eq(journalEntries.id, id))
            .returning();

        // If reversing, create reversal entry
        if (body.status === 'reversed') {
            const lines = await db
                .select()
                .from(journalEntryLines)
                .where(eq(journalEntryLines.entryId, id))
                .orderBy(journalEntryLines.lineNumber);

            // Get next entry number
            const lastEntry = await db
                .select({ entryNumber: journalEntries.entryNumber })
                .from(journalEntries)
                .where(
                    and(
                        eq(journalEntries.organizationId, orgId),
                        eq(journalEntries.fiscalYear, currentEntry.fiscalYear),
                        eq(journalEntries.fiscalMonth, currentEntry.fiscalMonth)
                    )
                )
                .orderBy(desc(journalEntries.entryNumber))
                .limit(1);

            const reversalNumber = (lastEntry[0]?.entryNumber || 0) + 1;

            // Create reversal entry
            const reversalEntry = await db.insert(journalEntries).values({
                organizationId: orgId,
                entryNumber: reversalNumber,
                referenceDate: Date.now(),
                postingDate: Date.now(),
                fiscalYear: currentEntry.fiscalYear,
                fiscalMonth: currentEntry.fiscalMonth,
                description: `Estorno: ${currentEntry.description}`,
                memo: body.reversalReason || 'Estorno automático',
                sourceType: 'adjustment',
                sourceId: id,
                status: 'posted',
                isReversal: 1,
                reversesEntryId: id,
                createdBy: personId,
                postedBy: personId,
                postedAt: Date.now(),
            }).returning();

            // Create reversal lines (swap debit/credit)
            const reversalLines = lines.map((line, index) => ({
                entryId: reversalEntry[0].id,
                accountId: line.accountId,
                costCenterId: line.costCenterId,
                amountCents: line.amountCents,
                currency: line.currency,
                entryType: (line.entryType === 'debit' ? 'credit' : 'debit') as 'debit' | 'credit',
                description: `Estorno: ${line.description || ''}`,
                lineNumber: index + 1,
            }));

            await db.insert(journalEntryLines).values(reversalLines);


            // Update original entry with reversal reference
            await db
                .update(journalEntries)
                .set({ reversedByEntryId: reversalEntry[0].id })
                .where(eq(journalEntries.id, id));

            return NextResponse.json({
                data: updated[0],
                reversalEntry: reversalEntry[0],
            });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating journal entry:', error);
        return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 });
    }
}

// DELETE /api/journal-entries/[id] - Cancel draft entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await db
            .select({ status: journalEntries.status })
            .from(journalEntries)
            .where(
                and(
                    eq(journalEntries.id, id),
                    eq(journalEntries.organizationId, orgId)
                )
            )
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
        }

        if (existing[0].status !== 'draft') {
            return NextResponse.json({
                error: 'Only draft entries can be cancelled. Use reversal for posted entries.'
            }, { status: 400 });
        }

        // Delete lines first (cascade should handle this but being explicit)
        await db.delete(journalEntryLines).where(eq(journalEntryLines.entryId, id));

        // Update entry to cancelled
        await db
            .update(journalEntries)
            .set({ status: 'cancelled', updatedAt: Date.now() })
            .where(eq(journalEntries.id, id));

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling journal entry:', error);
        return NextResponse.json({ error: 'Failed to cancel journal entry' }, { status: 500 });
    }
}
