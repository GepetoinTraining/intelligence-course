import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/rooms - List rooms
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const activeOnly = searchParams.get('active') !== 'false';

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(rooms.organizationId, orgId));
        }

        if (type) {
            conditions.push(eq(rooms.roomType, type as any));
        }

        if (activeOnly) {
            conditions.push(eq(rooms.isActive, 1));
        }

        const result = await db
            .select()
            .from(rooms)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }
}

// POST /api/rooms - Create room
export async function POST(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newRoom = await db.insert(rooms).values({
            organizationId: orgId,
            name: body.name,
            capacity: body.capacity || 15,
            roomType: body.roomType || 'classroom',
            defaultMeetUrl: body.defaultMeetUrl,
            floor: body.floor,
            building: body.building,
            amenities: body.amenities ? JSON.stringify(body.amenities) : '[]',
            isActive: 1,
        }).returning();

        return NextResponse.json({ data: newRoom[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}

