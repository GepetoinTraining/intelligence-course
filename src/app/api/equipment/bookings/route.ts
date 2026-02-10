import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { equipmentBookings, schoolEquipment } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/equipment/bookings — List bookings (optional ?equipmentId= or ?status= filter)
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const equipmentId = searchParams.get('equipmentId');
        const status = searchParams.get('status');

        let items;
        if (equipmentId) {
            items = await db.select({
                booking: equipmentBookings,
                equipment: schoolEquipment,
            })
                .from(equipmentBookings)
                .leftJoin(schoolEquipment, eq(equipmentBookings.equipmentId, schoolEquipment.id))
                .where(and(
                    eq(equipmentBookings.organizationId, orgId),
                    eq(equipmentBookings.equipmentId, equipmentId),
                ));
        } else if (status) {
            items = await db.select({
                booking: equipmentBookings,
                equipment: schoolEquipment,
            })
                .from(equipmentBookings)
                .leftJoin(schoolEquipment, eq(equipmentBookings.equipmentId, schoolEquipment.id))
                .where(and(
                    eq(equipmentBookings.organizationId, orgId),
                    eq(equipmentBookings.status, status as any),
                ));
        } else {
            items = await db.select({
                booking: equipmentBookings,
                equipment: schoolEquipment,
            })
                .from(equipmentBookings)
                .leftJoin(schoolEquipment, eq(equipmentBookings.equipmentId, schoolEquipment.id))
                .where(eq(equipmentBookings.organizationId, orgId));
        }

        const data = items.map(row => ({
            ...row.booking,
            equipmentName: row.equipment?.name || '-',
            equipmentCategory: row.equipment?.category || '-',
        }));

        return NextResponse.json({ data });
    } catch (error) {
        console.error('[equipment/bookings GET]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/equipment/bookings — Create a booking request
export async function POST(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const [booking] = await db.insert(equipmentBookings).values({
            organizationId: orgId,
            equipmentId: body.equipmentId,
            requestedBy: body.requestedBy || personId,
            startTime: body.startTime,
            endTime: body.endTime,
            lessonId: body.lessonId,
            purpose: body.purpose,
            roomId: body.roomId,
            notes: body.notes,
            status: 'pending',
        }).returning();

        return NextResponse.json({ data: booking }, { status: 201 });
    } catch (error) {
        console.error('[equipment/bookings POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/equipment/bookings — Update booking status (approve/return/cancel)
export async function PATCH(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { bookingId, status: newStatus, returnCondition } = body;

        if (!bookingId || !newStatus) {
            return NextResponse.json({ error: 'bookingId and status required' }, { status: 400 });
        }

        const updates: Record<string, any> = {
            status: newStatus,
            updatedAt: Math.floor(Date.now() / 1000),
        };

        if (newStatus === 'approved') {
            updates.approvedBy = personId;
        }
        if (newStatus === 'returned') {
            updates.returnedAt = Math.floor(Date.now() / 1000);
            if (returnCondition) updates.returnCondition = returnCondition;
        }

        const [updated] = await db.update(equipmentBookings)
            .set(updates)
            .where(and(
                eq(equipmentBookings.id, bookingId),
                eq(equipmentBookings.organizationId, orgId),
            ))
            .returning();

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error('[equipment/bookings PATCH]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
