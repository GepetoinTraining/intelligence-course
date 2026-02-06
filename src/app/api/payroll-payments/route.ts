import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payrollPayments, staffPayroll, paymentMethods } from '@/lib/db/schema';
import { eq, and, desc, sum } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/payroll-payments - List payments (optionally filtered by payrollId)
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const payrollId = searchParams.get('payrollId');
    const staffUserId = searchParams.get('personId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [];

        if (payrollId) {
            conditions.push(eq(payrollPayments.payrollId, payrollId));
        }

        if (staffUserId) {
            conditions.push(eq(payrollPayments.personId, staffUserId));
        }

        if (status) {
            conditions.push(eq(payrollPayments.status, status as any));
        }

        const result = await db
            .select()
            .from(payrollPayments)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(payrollPayments.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching payroll payments:', error);
        return NextResponse.json({ error: 'Failed to fetch payroll payments' }, { status: 500 });
    }
}

// POST /api/payroll-payments - Create a payment (supports split payments)
export async function POST(request: NextRequest) {
    const { personId: authUserId } = await getApiAuthWithOrg();
    if (!authUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Validate payroll exists and is in payable status
        const payroll = await db
            .select()
            .from(staffPayroll)
            .where(eq(staffPayroll.id, body.payrollId))
            .limit(1);

        if (payroll.length === 0) {
            return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
        }

        const payrollRecord = payroll[0];

        // Check if payroll is in a valid state for payment
        if (!['approved', 'scheduled', 'partially_paid'].includes(payrollRecord.status || '')) {
            return NextResponse.json({
                error: 'Payroll must be approved before payments can be made'
            }, { status: 400 });
        }

        // Calculate total already paid
        const paidResult = await db
            .select({ total: sum(payrollPayments.amountCents) })
            .from(payrollPayments)
            .where(
                and(
                    eq(payrollPayments.payrollId, body.payrollId),
                    eq(payrollPayments.status, 'completed')
                )
            );

        const totalPaid = Number(paidResult[0]?.total || 0);
        const remainingAmount = payrollRecord.netAmountCents - totalPaid;

        // Validate payment amount
        if (body.amountCents > remainingAmount) {
            return NextResponse.json({
                error: `Payment exceeds remaining amount. Remaining: ${remainingAmount / 100}`,
                remainingAmountCents: remainingAmount
            }, { status: 400 });
        }

        // Create the payment
        const newPayment = await db.insert(payrollPayments).values({
            payrollId: body.payrollId,
            personId: payrollRecord.personId,
            paymentMethodId: body.paymentMethodId,
            amountCents: body.amountCents,
            currency: body.currency || 'BRL',
            methodType: body.methodType,
            paymentProvider: body.paymentProvider || 'manual',
            externalPaymentId: body.externalPaymentId,
            status: body.status || 'pending',
            scheduledFor: body.scheduledFor,
            notes: body.notes,
            paidBy: authUserId,
        }).returning();

        // Update payroll status if this completes the payment
        const newTotalPaid = totalPaid + body.amountCents;
        if (newTotalPaid >= payrollRecord.netAmountCents) {
            // Fully paid
            await db.update(staffPayroll)
                .set({
                    status: 'paid',
                    paidAmountCents: newTotalPaid,
                    paidAt: Date.now(),
                    updatedAt: Date.now()
                })
                .where(eq(staffPayroll.id, body.payrollId));
        } else if (newTotalPaid > 0) {
            // Partially paid
            await db.update(staffPayroll)
                .set({
                    status: 'partially_paid',
                    paidAmountCents: newTotalPaid,
                    updatedAt: Date.now()
                })
                .where(eq(staffPayroll.id, body.payrollId));
        }

        return NextResponse.json({
            data: newPayment[0],
            payrollStatus: newTotalPaid >= payrollRecord.netAmountCents ? 'paid' : 'partially_paid',
            remainingAmountCents: payrollRecord.netAmountCents - newTotalPaid
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating payroll payment:', error);
        return NextResponse.json({ error: 'Failed to create payroll payment' }, { status: 500 });
    }
}



