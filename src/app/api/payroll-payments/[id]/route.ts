import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payrollPayments, staffPayroll } from '@/lib/db/schema';
import { eq, and, sum } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/payroll-payments/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const payment = await db
            .select()
            .from(payrollPayments)
            .where(eq(payrollPayments.id, id))
            .limit(1);

        if (payment.length === 0) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        return NextResponse.json({ data: payment[0] });
    } catch (error) {
        console.error('Error fetching payment:', error);
        return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
    }
}

// PATCH /api/payroll-payments/[id] - Update payment status (mark as completed, failed, etc.)
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

        if (body.status !== undefined) {
            updateData.status = body.status;

            // Track status timestamps
            if (body.status === 'processing') {
                updateData.processedAt = Date.now();
            } else if (body.status === 'completed') {
                updateData.completedAt = Date.now();
                updateData.confirmedBy = userId;
            } else if (body.status === 'failed') {
                updateData.failedAt = Date.now();
                updateData.failureReason = body.failureReason;
                updateData.retryCount = (body.retryCount || 0) + 1;
            }
        }

        if (body.externalPaymentId !== undefined) updateData.externalPaymentId = body.externalPaymentId;
        if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;
        if (body.receiptNumber !== undefined) updateData.receiptNumber = body.receiptNumber;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const updated = await db
            .update(payrollPayments)
            .set(updateData)
            .where(eq(payrollPayments.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // If payment was completed, recalculate payroll status
        if (body.status === 'completed') {
            const payment = updated[0];

            // Get total completed payments for this payroll
            const completedResult = await db
                .select({ total: sum(payrollPayments.amountCents) })
                .from(payrollPayments)
                .where(
                    and(
                        eq(payrollPayments.payrollId, payment.payrollId),
                        eq(payrollPayments.status, 'completed')
                    )
                );

            const totalCompleted = Number(completedResult[0]?.total || 0);

            // Get payroll to compare
            const payroll = await db
                .select()
                .from(staffPayroll)
                .where(eq(staffPayroll.id, payment.payrollId))
                .limit(1);

            if (payroll.length > 0) {
                const payrollRecord = payroll[0];
                const newStatus = totalCompleted >= payrollRecord.netAmountCents ? 'paid' : 'partially_paid';

                await db.update(staffPayroll)
                    .set({
                        status: newStatus,
                        paidAmountCents: totalCompleted,
                        paidAt: newStatus === 'paid' ? Date.now() : null,
                        updatedAt: Date.now()
                    })
                    .where(eq(staffPayroll.id, payment.payrollId));
            }
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating payment:', error);
        return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }
}

// DELETE /api/payroll-payments/[id] - Cancel payment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Get current payment
        const existing = await db
            .select()
            .from(payrollPayments)
            .where(eq(payrollPayments.id, id))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (existing[0].status === 'completed') {
            return NextResponse.json({
                error: 'Cannot cancel a completed payment. Use refund instead.'
            }, { status: 400 });
        }

        const cancelled = await db
            .update(payrollPayments)
            .set({
                status: 'cancelled',
                updatedAt: Date.now()
            })
            .where(eq(payrollPayments.id, id))
            .returning();

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling payment:', error);
        return NextResponse.json({ error: 'Failed to cancel payment' }, { status: 500 });
    }
}
