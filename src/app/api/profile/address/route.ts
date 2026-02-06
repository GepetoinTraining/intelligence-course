import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/profile/address - Get addresses from preferences
export async function GET(request: NextRequest) {
    const { userId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const preferences = JSON.parse(user[0].preferences || '{}');
        const addresses = preferences.addresses || [];

        return NextResponse.json({ data: addresses });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }
}

// PATCH /api/profile/address - Update addresses in preferences
export async function PATCH(request: NextRequest) {
    const { userId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { addresses } = body;

        if (!Array.isArray(addresses)) {
            return NextResponse.json({ error: 'addresses must be an array' }, { status: 400 });
        }

        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const preferences = JSON.parse(user[0]?.preferences || '{}');
        preferences.addresses = addresses;

        await db.update(users).set({
            preferences: JSON.stringify(preferences),
            updatedAt: Math.floor(Date.now() / 1000),
        }).where(eq(users.id, userId));

        return NextResponse.json({ data: addresses });
    } catch (error) {
        console.error('Error updating addresses:', error);
        return NextResponse.json({ error: 'Failed to update addresses' }, { status: 500 });
    }
}

