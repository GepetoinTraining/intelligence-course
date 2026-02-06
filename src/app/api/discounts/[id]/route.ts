import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { discounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/discounts/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(discounts)
            .where(eq(discounts.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching discount:', error);
        return NextResponse.json({ error: 'Failed to fetch discount' }, { status: 500 });
    }
}

// PATCH /api/discounts/[id]
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

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.discountType !== undefined) updateData.discountType = body.discountType;
        if (body.value !== undefined) updateData.value = body.value;
        if (body.code !== undefined) updateData.code = body.code;
        if (body.applicableTo !== undefined) updateData.applicableTo = body.applicableTo;
        if (body.applicableProductIds !== undefined) updateData.applicableProductIds = JSON.stringify(body.applicableProductIds);
        if (body.minPurchase !== undefined) updateData.minPurchase = body.minPurchase;
        if (body.maxUses !== undefined) updateData.maxUses = body.maxUses;
        if (body.validFrom !== undefined) updateData.validFrom = body.validFrom;
        if (body.validUntil !== undefined) updateData.validUntil = body.validUntil;
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

        const updated = await db
            .update(discounts)
            .set(updateData)
            .where(eq(discounts.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating discount:', error);
        return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
    }
}

// DELETE /api/discounts/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(discounts)
            .set({ isActive: 0 })
            .where(eq(discounts.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deactivating discount:', error);
        return NextResponse.json({ error: 'Failed to deactivate discount' }, { status: 500 });
    }
}
