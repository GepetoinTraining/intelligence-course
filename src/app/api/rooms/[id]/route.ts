import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/rooms/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const room = await db
            .select()
            .from(rooms)
            .where(eq(rooms.id, id))
            .limit(1);

        if (room.length === 0) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({ data: room[0] });
    } catch (error) {
        console.error('Error fetching room:', error);
        return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
    }
}

// PATCH /api/rooms/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.capacity !== undefined) updateData.capacity = body.capacity;
        if (body.roomType !== undefined) updateData.roomType = body.roomType;
        if (body.defaultMeetUrl !== undefined) updateData.defaultMeetUrl = body.defaultMeetUrl;
        if (body.floor !== undefined) updateData.floor = body.floor;
        if (body.building !== undefined) updateData.building = body.building;
        if (body.amenities !== undefined) updateData.amenities = JSON.stringify(body.amenities);
        if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

        const updated = await db
            .update(rooms)
            .set(updateData)
            .where(eq(rooms.id, id))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating room:', error);
        return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
    }
}

// DELETE /api/rooms/[id] - Deactivate room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const deleted = await db
            .update(rooms)
            .set({ isActive: 0 })
            .where(eq(rooms.id, id))
            .returning();

        if (deleted.length === 0) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        console.error('Error deactivating room:', error);
        return NextResponse.json({ error: 'Failed to deactivate room' }, { status: 500 });
    }
}
