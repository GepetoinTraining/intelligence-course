import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { costCenters, journalEntryLines } from '@/lib/db/schema';
import { eq, and, sum } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/cost-centers/[id] - Get cost center with expense totals
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const center = await db
            .select()
            .from(costCenters)
            .where(
                and(
                    eq(costCenters.id, id),
                    eq(costCenters.organizationId, orgId)
                )
            )
            .limit(1);

        if (center.length === 0) {
            return NextResponse.json({ error: 'Cost center not found' }, { status: 404 });
        }

        // Calculate total expenses from journal entries
        const debits = await db
            .select({ total: sum(journalEntryLines.amountCents) })
            .from(journalEntryLines)
            .where(
                and(
                    eq(journalEntryLines.costCenterId, id),
                    eq(journalEntryLines.entryType, 'debit')
                )
            );

        const totalExpenses = Number(debits[0]?.total || 0);

        // Calculate budget utilization
        const budgetUtilization = center[0].monthlyBudgetCents
            ? (totalExpenses / center[0].monthlyBudgetCents) * 100
            : null;

        return NextResponse.json({
            data: {
                ...center[0],
                totalExpenses,
                budgetUtilization,
            }
        });
    } catch (error) {
        console.error('Error fetching cost center:', error);
        return NextResponse.json({ error: 'Failed to fetch cost center' }, { status: 500 });
    }
}

// PATCH /api/cost-centers/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Date.now(),
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.centerType !== undefined) updateData.centerType = body.centerType;
        if (body.managerId !== undefined) updateData.managerId = body.managerId || null;
        if (body.annualBudgetCents !== undefined) updateData.annualBudgetCents = body.annualBudgetCents;
        if (body.monthlyBudgetCents !== undefined) updateData.monthlyBudgetCents = body.monthlyBudgetCents;
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

        const updated = await db
            .update(costCenters)
            .set(updateData)
            .where(
                and(
                    eq(costCenters.id, id),
                    eq(costCenters.organizationId, orgId)
                )
            )
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Cost center not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating cost center:', error);
        return NextResponse.json({ error: 'Failed to update cost center' }, { status: 500 });
    }
}

// DELETE /api/cost-centers/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Check if cost center has journal entries
        const entries = await db
            .select({ id: journalEntryLines.id })
            .from(journalEntryLines)
            .where(eq(journalEntryLines.costCenterId, id))
            .limit(1);

        if (entries.length > 0) {
            // Soft delete
            await db
                .update(costCenters)
                .set({ isActive: 0, updatedAt: Date.now() })
                .where(eq(costCenters.id, id));
        } else {
            // Hard delete
            await db.delete(costCenters).where(eq(costCenters.id, id));
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deleting cost center:', error);
        return NextResponse.json({ error: 'Failed to delete cost center' }, { status: 500 });
    }
}
