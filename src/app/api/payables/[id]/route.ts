import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payables } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/payables/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const payable = await db
            .select()
            .from(payables)
            .where(eq(payables.id, id))
            .limit(1);

        if (payable.length === 0) {
            return NextResponse.json({ error: 'Payable not found' }, { status: 404 });
        }

        return NextResponse.json({ data: payable[0] });
    } catch (error) {
        console.error('Error fetching payable:', error);
        return NextResponse.json({ error: 'Failed to fetch payable' }, { status: 500 });
    }
}

// PATCH /api/payables/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Date.now(),
        };

        if (body.vendorName !== undefined) updateData.vendorName = body.vendorName;
        if (body.vendorDocument !== undefined) updateData.vendorDocument = body.vendorDocument;
        if (body.invoiceNumber !== undefined) updateData.invoiceNumber = body.invoiceNumber;
        if (body.invoiceUrl !== undefined) updateData.invoiceUrl = body.invoiceUrl;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.amountCents !== undefined) updateData.amountCents = body.amountCents;
        if (body.issueDate !== undefined) updateData.issueDate = body.issueDate;
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
        if (body.paidDate !== undefined) updateData.paidDate = body.paidDate;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
        if (body.paymentReference !== undefined) updateData.paymentReference = body.paymentReference;
        if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring ? 1 : 0;
        if (body.recurrenceInterval !== undefined) updateData.recurrenceInterval = body.recurrenceInterval;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const updated = await db
            .update(payables)
            .set(updateData)
            .where(eq(payables.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Payable not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating payable:', error);
        return NextResponse.json({ error: 'Failed to update payable' }, { status: 500 });
    }
}

// DELETE /api/payables/[id] - Cancel payable
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const cancelled = await db
            .update(payables)
            .set({ status: 'cancelled', updatedAt: Date.now() })
            .where(eq(payables.id, id))
            .returning();

        if (cancelled.length === 0) {
            return NextResponse.json({ error: 'Payable not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling payable:', error);
        return NextResponse.json({ error: 'Failed to cancel payable' }, { status: 500 });
    }
}
