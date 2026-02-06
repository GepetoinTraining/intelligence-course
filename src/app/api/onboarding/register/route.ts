import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// POST /api/onboarding/register - Register new user
export async function POST(request: NextRequest) {
    const { personId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, name, role } = body;

        if (!email) {
            return NextResponse.json({ error: 'email required' }, { status: 400 });
        }

        // Check if user already exists
        const existing = await db
            .select()
            .from(users)
            .where(eq(users.id, personId))
            .limit(1);

        if (existing.length > 0) {
            // Update existing user
            const updated = await db
                .update(users)
                .set({
                    email,
                    name,
                    role: role || 'student',
                    updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(users.id, personId))
                .returning();

            return NextResponse.json({ data: updated[0] });
        }

        // Create new user
        const newUser = await db.insert(users).values({
            id: personId,
            email,
            name,
            role: role || 'student',
        }).returning();

        return NextResponse.json({ data: newUser[0] }, { status: 201 });
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}



