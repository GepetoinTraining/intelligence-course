import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staffContracts, users, persons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/staff-contracts/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const result = await db
            .select({
                contract: staffContracts,
                person: {
                    firstName: persons.firstName,
                    lastName: persons.lastName,
                    email: persons.primaryEmail,
                    avatarUrl: persons.avatarUrl,
                }
            })
            .from(staffContracts)
            .leftJoin(persons, eq(staffContracts.personId, persons.id))
            .where(eq(staffContracts.id, id))
            .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: 'Staff contract not found' }, { status: 404 });
        }

        const contract = {
            ...result[0].contract,
            name: result[0].person?.firstName,
            email: result[0].person?.email,
            avatarUrl: result[0].person?.avatarUrl,
        };

        return NextResponse.json({ data: contract });
    } catch (error) {
        console.error('Error fetching staff contract:', error);
        return NextResponse.json({ error: 'Failed to fetch staff contract' }, { status: 500 });
    }
}

// PATCH /api/staff-contracts/[id]
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

        if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
        if (body.department !== undefined) updateData.department = body.department;
        if (body.contractType !== undefined) updateData.contractType = body.contractType;
        if (body.salaryCents !== undefined) updateData.salaryCents = body.salaryCents;
        if (body.hourlyRateCents !== undefined) updateData.hourlyRateCents = body.hourlyRateCents;
        if (body.weeklyHours !== undefined) updateData.weeklyHours = body.weeklyHours;
        if (body.workSchedule !== undefined) updateData.workSchedule = JSON.stringify(body.workSchedule);
        if (body.accessLevel !== undefined) updateData.accessLevel = body.accessLevel;
        if (body.startsAt !== undefined) updateData.startsAt = body.startsAt;
        if (body.endsAt !== undefined) updateData.endsAt = body.endsAt;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.benefits !== undefined) updateData.benefits = JSON.stringify(body.benefits);

        const updated = await db
            .update(staffContracts)
            .set(updateData)
            .where(eq(staffContracts.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Staff contract not found' }, { status: 404 });
        }

        // Also update user info if provided
        if (body.name) {
            const contract = updated[0];
            const userUpdateData: Record<string, any> = {};
            if (body.name) userUpdateData.name = body.name;

            await db
                .update(users)
                .set(userUpdateData)
                .where(eq(users.id, contract.userId));
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating staff contract:', error);
        return NextResponse.json({ error: 'Failed to update staff contract' }, { status: 500 });
    }
}

// DELETE /api/staff-contracts/[id] - Terminate contract
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const terminated = await db
            .update(staffContracts)
            .set({
                status: 'terminated',
                endsAt: Date.now(),
                updatedAt: Date.now()
            })
            .where(eq(staffContracts.id, id))
            .returning();

        if (terminated.length === 0) {
            return NextResponse.json({ error: 'Staff contract not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error terminating staff contract:', error);
        return NextResponse.json({ error: 'Failed to terminate staff contract' }, { status: 500 });
    }
}
