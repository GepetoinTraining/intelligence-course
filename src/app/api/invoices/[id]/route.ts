import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, invoiceItems, transactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/invoices/[id] - Get invoice with items and payments
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const invoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);

        if (invoice.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Get items
        const items = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, id));

        // Get payments
        const payments = await db
            .select()
            .from(transactions)
            .where(eq(transactions.invoiceId, id))
            .orderBy(desc(transactions.createdAt));

        return NextResponse.json({
            data: {
                ...invoice[0],
                items,
                payments,
            }
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}

// PATCH /api/invoices/[id] - Update invoice
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (body.status !== undefined) updateData.status = body.status;
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
        if (body.description !== undefined) updateData.description = body.description;

        const updated = await db
            .update(invoices)
            .set(updateData)
            .where(eq(invoices.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
}

// DELETE /api/invoices/[id] - Cancel invoice
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Check if invoice has any payments
        const payments = await db
            .select()
            .from(transactions)
            .where(eq(transactions.invoiceId, id))
            .limit(1);

        if (payments.length > 0) {
            return NextResponse.json({
                error: 'Cannot cancel invoice with payments'
            }, { status: 400 });
        }

        const cancelled = await db
            .update(invoices)
            .set({
                status: 'cancelled',
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(invoices.id, id))
            .returning();

        if (cancelled.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling invoice:', error);
        return NextResponse.json({ error: 'Failed to cancel invoice' }, { status: 500 });
    }
}
