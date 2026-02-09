import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/enrollment-flow/calculate
// Computes payment plan: total, installments, optional discount
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            monthlyPrice,       // Base monthly price in cents (from courseType.defaultMonthlyPrice)
            durationMonths,     // Number of months the student will study
            installmentCount,   // Number of installments (can be <= durationMonths)
            discountPercent,    // Optional discount % (0-100)
            enrollmentFee,      // Optional one-time enrollment fee in cents
        } = body;

        if (!monthlyPrice || !durationMonths || !installmentCount) {
            return NextResponse.json({ error: 'monthlyPrice, durationMonths, and installmentCount are required' }, { status: 400 });
        }

        // Calculate totals
        const grossTotal = monthlyPrice * durationMonths;
        const enrollmentFeeAmount = enrollmentFee || 0;
        const grossWithFee = grossTotal + enrollmentFeeAmount;

        // Apply discount (only to tuition, not enrollment fee)
        const discount = discountPercent ? Math.round(grossTotal * (discountPercent / 100)) : 0;
        const netTuition = grossTotal - discount;
        const netTotal = netTuition + enrollmentFeeAmount;

        // Calculate installment values
        const installmentValue = Math.round(netTotal / installmentCount);
        // Last installment absorbs rounding difference
        const lastInstallmentValue = netTotal - (installmentValue * (installmentCount - 1));

        // Generate installment schedule
        const now = new Date();
        const installments = [];
        for (let i = 0; i < installmentCount; i++) {
            const dueDate = new Date(now);
            dueDate.setMonth(dueDate.getMonth() + i + 1); // First payment next month
            dueDate.setDate(10); // Default due day: 10th

            installments.push({
                number: i + 1,
                dueDate: dueDate.toISOString().split('T')[0],
                dueDateTimestamp: Math.floor(dueDate.getTime() / 1000),
                amount: i === installmentCount - 1 ? lastInstallmentValue : installmentValue,
            });
        }

        return NextResponse.json({
            data: {
                // Summary
                monthlyPrice,
                durationMonths,
                enrollmentFee: enrollmentFeeAmount,

                // Gross
                grossTuition: grossTotal,
                grossTotal: grossWithFee,

                // Discount
                discountPercent: discountPercent || 0,
                discountAmount: discount,

                // Net
                netTuition,
                netTotal,

                // Installments
                installmentCount,
                installmentValue,
                lastInstallmentValue,
                installments,
            },
        });
    } catch (error) {
        console.error('Error calculating payment plan:', error);
        return NextResponse.json({ error: 'Failed to calculate payment plan' }, { status: 500 });
    }
}
