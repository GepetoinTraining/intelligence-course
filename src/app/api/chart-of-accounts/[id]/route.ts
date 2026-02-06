import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chartOfAccounts, journalEntryLines } from '@/lib/db/schema';
import { eq, and, sum } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/chart-of-accounts/[id] - Get account with balance
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const account = await db
            .select()
            .from(chartOfAccounts)
            .where(
                and(
                    eq(chartOfAccounts.id, id),
                    eq(chartOfAccounts.organizationId, orgId)
                )
            )
            .limit(1);

        if (account.length === 0) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        // Calculate balance from journal entries
        const debits = await db
            .select({ total: sum(journalEntryLines.amountCents) })
            .from(journalEntryLines)
            .where(
                and(
                    eq(journalEntryLines.accountId, id),
                    eq(journalEntryLines.entryType, 'debit')
                )
            );

        const credits = await db
            .select({ total: sum(journalEntryLines.amountCents) })
            .from(journalEntryLines)
            .where(
                and(
                    eq(journalEntryLines.accountId, id),
                    eq(journalEntryLines.entryType, 'credit')
                )
            );

        const debitTotal = Number(debits[0]?.total || 0);
        const creditTotal = Number(credits[0]?.total || 0);

        // Calculate balance based on account nature
        const balance = account[0].nature === 'debit'
            ? debitTotal - creditTotal
            : creditTotal - debitTotal;

        return NextResponse.json({
            data: {
                ...account[0],
                debitTotal,
                creditTotal,
                balance,
            }
        });
    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}

// PATCH /api/chart-of-accounts/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Check if system account
        const existing = await db
            .select({ isSystem: chartOfAccounts.isSystem })
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.id, id))
            .limit(1);

        if (existing.length > 0 && existing[0].isSystem) {
            return NextResponse.json({ error: 'Cannot modify system accounts' }, { status: 400 });
        }

        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Date.now(),
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.allowsPosting !== undefined) updateData.allowsPosting = body.allowsPosting ? 1 : 0;
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;
        if (body.cofinsApplicable !== undefined) updateData.cofinsApplicable = body.cofinsApplicable ? 1 : 0;
        if (body.pisApplicable !== undefined) updateData.pisApplicable = body.pisApplicable ? 1 : 0;
        if (body.csllApplicable !== undefined) updateData.csllApplicable = body.csllApplicable ? 1 : 0;
        if (body.irpjApplicable !== undefined) updateData.irpjApplicable = body.irpjApplicable ? 1 : 0;

        const updated = await db
            .update(chartOfAccounts)
            .set(updateData)
            .where(
                and(
                    eq(chartOfAccounts.id, id),
                    eq(chartOfAccounts.organizationId, orgId)
                )
            )
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

// DELETE /api/chart-of-accounts/[id] - Deactivate account
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Check if system account
        const existing = await db
            .select({ isSystem: chartOfAccounts.isSystem })
            .from(chartOfAccounts)
            .where(eq(chartOfAccounts.id, id))
            .limit(1);

        if (existing.length > 0 && existing[0].isSystem) {
            return NextResponse.json({ error: 'Cannot delete system accounts' }, { status: 400 });
        }

        // Check if account has journal entries
        const entries = await db
            .select({ id: journalEntryLines.id })
            .from(journalEntryLines)
            .where(eq(journalEntryLines.accountId, id))
            .limit(1);

        if (entries.length > 0) {
            // Soft delete - just deactivate
            await db
                .update(chartOfAccounts)
                .set({ isActive: 0, updatedAt: Date.now() })
                .where(eq(chartOfAccounts.id, id));
        } else {
            // Hard delete if no entries
            await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, id));
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
