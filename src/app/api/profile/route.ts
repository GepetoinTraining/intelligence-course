import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
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

        return NextResponse.json({ data: user[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const updateData: Record<string, any> = {
            updatedAt: Math.floor(Date.now() / 1000),
        };

        // Only allow updating certain fields
        if (body.firstName !== undefined) updateData.firstName = body.firstName;
        if (body.lastName !== undefined) updateData.lastName = body.lastName;
        if (body.phone !== undefined) updateData.phone = body.phone;
        if (body.dateOfBirth !== undefined) updateData.dateOfBirth = body.dateOfBirth;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
        if (body.bio !== undefined) updateData.bio = body.bio;
        if (body.timezone !== undefined) updateData.timezone = body.timezone;
        if (body.preferredLanguage !== undefined) updateData.preferredLanguage = body.preferredLanguage;

        const updated = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        if (updated.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}



