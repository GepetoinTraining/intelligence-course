import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/invoices/[id]/pay - Record payment for invoice
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // Get the invoice
        const invoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);

        if (invoice.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        const invoiceData = invoice[0];

        if (invoiceData.status === 'paid') {
            return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
        }

        // Payment amount (uses netAmount from invoice if not provided)
        const paymentAmount = body.amount || invoiceData.netAmount;

        // Create transaction
        const transaction = await db.insert(transactions).values({
            organizationId: orgId,
            invoiceId: id,
            personId: invoiceData.payerUserId,
            type: 'payment_received',
            amount: paymentAmount,
            currency: invoiceData.currency || 'BRL',
            status: 'completed',
            description: body.description || 'Payment received',
        }).returning();

        // Update invoice status
        await db
            .update(invoices)
            .set({
                status: 'paid',
                paidDate: Math.floor(Date.now() / 1000),
                paymentMethod: body.paymentMethod || 'pix',
                paymentProvider: body.paymentProvider || 'internal',
                externalPaymentId: body.externalPaymentId,
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(invoices.id, id));

        return NextResponse.json({
            data: {
                transaction: transaction[0],
                invoiceStatus: 'paid',
                paidAmount: paymentAmount,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error recording payment:', error);
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }
}
