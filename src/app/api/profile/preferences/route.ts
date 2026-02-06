import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/profile/preferences - Get notification/language settings
export async function GET(request: NextRequest) {
    const { userId } = await auth();
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

        return NextResponse.json({
            data: {
                language: preferences.language || 'pt-BR',
                timezone: preferences.timezone || 'America/Sao_Paulo',
                notifications: preferences.notifications || {
                    email: true,
                    push: true,
                    sms: false,
                    whatsapp: true,
                },
                privacy: preferences.privacy || {
                    showProfile: true,
                    showProgress: true,
                },
                accessibility: preferences.accessibility || {
                    highContrast: false,
                    largeText: false,
                    reduceMotion: false,
                },
            }
        });
    } catch (error) {
        console.error('Error fetching preferences:', error);
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
}

// PATCH /api/profile/preferences - Update preferences
export async function PATCH(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const currentPrefs = JSON.parse(user[0]?.preferences || '{}');

        const updatedPrefs = {
            ...currentPrefs,
            language: body.language || currentPrefs.language,
            timezone: body.timezone || currentPrefs.timezone,
            notifications: body.notifications !== undefined
                ? { ...currentPrefs.notifications, ...body.notifications }
                : currentPrefs.notifications,
            privacy: body.privacy !== undefined
                ? { ...currentPrefs.privacy, ...body.privacy }
                : currentPrefs.privacy,
            accessibility: body.accessibility !== undefined
                ? { ...currentPrefs.accessibility, ...body.accessibility }
                : currentPrefs.accessibility,
        };

        await db.update(users).set({
            preferences: JSON.stringify(updatedPrefs),
            updatedAt: Math.floor(Date.now() / 1000),
        }).where(eq(users.id, userId));

        return NextResponse.json({ data: updatedPrefs });
    } catch (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }
}

