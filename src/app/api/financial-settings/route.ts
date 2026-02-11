import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizationFinancialSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/financial-settings - Get org financial settings
export async function GET() {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await db
            .select()
            .from(organizationFinancialSettings)
            .where(eq(organizationFinancialSettings.organizationId, orgId))
            .limit(1);

        return NextResponse.json({ data: result[0] || null });
    } catch (error) {
        console.error('Error fetching financial settings:', error);
        return NextResponse.json({ error: 'Failed to fetch financial settings' }, { status: 500 });
    }
}

// PATCH /api/financial-settings - Update org financial settings
export async function PATCH(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Check if settings already exist
        const existing = await db
            .select()
            .from(organizationFinancialSettings)
            .where(eq(organizationFinancialSettings.organizationId, orgId))
            .limit(1);

        if (existing.length > 0) {
            // Update existing
            const updated = await db
                .update(organizationFinancialSettings)
                .set({
                    moneyManagementMode: body.moneyManagementMode,
                    defaultGatewayId: body.defaultGatewayId,
                    defaultSplitRuleId: body.defaultSplitRuleId,
                    lateFeeType: body.lateFeeType,
                    lateFeePercent: body.lateFeePercent,
                    lateFeeCents: body.lateFeeCents,
                    lateFeeInterestMonthly: body.lateFeeInterestMonthly,
                    earlyPaymentDiscountPercent: body.earlyPaymentDiscountPercent,
                    earlyPaymentDays: body.earlyPaymentDays,
                    reminderDays: body.reminderDays,
                    autoSendReminders: body.autoSendReminders,
                    invoiceDueDay: body.invoiceDueDay,
                    invoicePrefix: body.invoicePrefix,
                    updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(organizationFinancialSettings.organizationId, orgId))
                .returning();

            return NextResponse.json({ data: updated[0] });
        } else {
            // Create new
            const created = await db.insert(organizationFinancialSettings).values({
                organizationId: orgId,
                ...body,
            }).returning();

            return NextResponse.json({ data: created[0] }, { status: 201 });
        }
    } catch (error) {
        console.error('Error updating financial settings:', error);
        return NextResponse.json({ error: 'Failed to update financial settings' }, { status: 500 });
    }
}
