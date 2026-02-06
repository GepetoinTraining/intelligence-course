import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staffPayroll, payrollPayments } from '@/lib/db/schema';
import { eq, and, sum } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/staff-payroll/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const payroll = await db
            .select()
            .from(staffPayroll)
            .where(eq(staffPayroll.id, id))
            .limit(1);

        if (payroll.length === 0) {
            return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
        }

        // Get associated payments
        const payments = await db
            .select()
            .from(payrollPayments)
            .where(eq(payrollPayments.payrollId, id));

        return NextResponse.json({
            data: {
                ...payroll[0],
                payments,
            }
        });
    } catch (error) {
        console.error('Error fetching payroll:', error);
        return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 });
    }
}

// PATCH /api/staff-payroll/[id] - Update payroll (status, amounts, approval)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Date.now(),
        };

        // Basic fields
        if (body.payrollType !== undefined) updateData.payrollType = body.payrollType;
        if (body.grossAmountCents !== undefined) updateData.grossAmountCents = body.grossAmountCents;
        if (body.deductions !== undefined) updateData.deductions = JSON.stringify(body.deductions);
        if (body.totalDeductionsCents !== undefined) updateData.totalDeductionsCents = body.totalDeductionsCents;
        if (body.additions !== undefined) updateData.additions = JSON.stringify(body.additions);
        if (body.totalAdditionsCents !== undefined) updateData.totalAdditionsCents = body.totalAdditionsCents;
        if (body.netAmountCents !== undefined) updateData.netAmountCents = body.netAmountCents;
        if (body.hoursWorked !== undefined) updateData.hoursWorked = body.hoursWorked;
        if (body.notes !== undefined) updateData.notes = body.notes;
        if (body.payslipUrl !== undefined) updateData.payslipUrl = body.payslipUrl;

        // Status transitions with approval tracking
        if (body.status !== undefined) {
            updateData.status = body.status;

            if (body.status === 'approved') {
                updateData.approvedBy = personId;
                updateData.approvedAt = Date.now();
            } else if (body.status === 'paid') {
                updateData.paidAt = Date.now();
                // Get the current payroll to set paid amount
                const current = await db.select().from(staffPayroll).where(eq(staffPayroll.id, id)).limit(1);
                if (current.length > 0) {
                    updateData.paidAmountCents = current[0].netAmountCents;
                }
            }
        }

        const updated = await db
            .update(staffPayroll)
            .set(updateData)
            .where(eq(staffPayroll.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating payroll:', error);
        return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
    }
}

// DELETE /api/staff-payroll/[id] - Cancel payroll
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Check if already paid
        const existing = await db.select().from(staffPayroll).where(eq(staffPayroll.id, id)).limit(1);
        if (existing.length > 0 && existing[0].status === 'paid') {
            return NextResponse.json({ error: 'Cannot cancel a paid payroll' }, { status: 400 });
        }

        const cancelled = await db
            .update(staffPayroll)
            .set({
                status: 'cancelled',
                updatedAt: Date.now()
            })
            .where(eq(staffPayroll.id, id))
            .returning();

        if (cancelled.length === 0) {
            return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error cancelling payroll:', error);
        return NextResponse.json({ error: 'Failed to cancel payroll' }, { status: 500 });
    }
}
