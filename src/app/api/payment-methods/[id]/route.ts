import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paymentMethods } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/payment-methods/[id] - Get full payment method details
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const method = await db
            .select()
            .from(paymentMethods)
            .where(eq(paymentMethods.id, id))
            .limit(1);

        if (method.length === 0) {
            return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
        }

        // Mask sensitive data
        const result = { ...method[0] };
        if (result.accountNumber) {
            result.accountNumber = '****' + result.accountNumber.slice(-4);
        }
        if (result.pixKey && result.pixKeyType !== 'random') {
            const key = result.pixKey;
            result.pixKey = key.slice(0, 3) + '****' + key.slice(-3);
        }

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching payment method:', error);
        return NextResponse.json({ error: 'Failed to fetch payment method' }, { status: 500 });
    }
}

// PATCH /api/payment-methods/[id] - Update payment method
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

        // Allow updating label and active status
        if (body.label !== undefined) updateData.label = body.label;
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

        // Handle default setting
        if (body.isDefault) {
            // Get current method to find user
            const current = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
            if (current.length > 0) {
                // Unset other defaults
                await db
                    .update(paymentMethods)
                    .set({ isDefault: 0, updatedAt: Date.now() })
                    .where(eq(paymentMethods.personId, current[0].personId));
            }
            updateData.isDefault = 1;
        }

        // Handle verification
        if (body.isVerified !== undefined) {
            updateData.isVerified = body.isVerified ? 1 : 0;
            if (body.isVerified) {
                updateData.verifiedAt = Date.now();
            }
        }

        const updated = await db
            .update(paymentMethods)
            .set(updateData)
            .where(eq(paymentMethods.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating payment method:', error);
        return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
    }
}

// DELETE /api/payment-methods/[id] - Deactivate payment method
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        // Soft delete - just deactivate
        const deactivated = await db
            .update(paymentMethods)
            .set({
                isActive: 0,
                isDefault: 0,
                updatedAt: Date.now()
            })
            .where(eq(paymentMethods.id, id))
            .returning();

        if (deactivated.length === 0) {
            return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deactivating payment method:', error);
        return NextResponse.json({ error: 'Failed to deactivate payment method' }, { status: 500 });
    }
}
