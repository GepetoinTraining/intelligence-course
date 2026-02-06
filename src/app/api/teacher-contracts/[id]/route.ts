import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teacherContracts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/teacher-contracts/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select()
            .from(teacherContracts)
            .where(eq(teacherContracts.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Error fetching teacher contract:', error);
        return NextResponse.json({ error: 'Failed to fetch teacher contract' }, { status: 500 });
    }
}

// PATCH /api/teacher-contracts/[id]
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

        if (body.contractType !== undefined) updateData.contractType = body.contractType;
        if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;
        if (body.monthlyBase !== undefined) updateData.monthlyBase = body.monthlyBase;
        if (body.commissionPercent !== undefined) updateData.commissionPercent = body.commissionPercent;
        if (body.bonusRules !== undefined) updateData.bonusRules = JSON.stringify(body.bonusRules);
        if (body.startDate !== undefined) updateData.startDate = body.startDate;
        if (body.endDate !== undefined) updateData.endDate = body.endDate;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const updated = await db
            .update(teacherContracts)
            .set(updateData)
            .where(eq(teacherContracts.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating teacher contract:', error);
        return NextResponse.json({ error: 'Failed to update teacher contract' }, { status: 500 });
    }
}

// DELETE /api/teacher-contracts/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(teacherContracts)
            .set({ status: 'terminated', updatedAt: Math.floor(Date.now() / 1000) })
            .where(eq(teacherContracts.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error terminating teacher contract:', error);
        return NextResponse.json({ error: 'Failed to terminate teacher contract' }, { status: 500 });
    }
}
