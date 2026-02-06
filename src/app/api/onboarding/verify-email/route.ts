import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, persons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/onboarding/verify-email - Email verification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, verificationCode } = body;

        if (!email || !verificationCode) {
            return NextResponse.json({ error: 'email and verificationCode required' }, { status: 400 });
        }

        // In production, this would:
        // 1. Verify the code matches what was sent
        // 2. Check code hasn't expired
        // 3. Update user's email verification status

        // For now, simulate verification by updating preferences
        const user = await db
            .select()
            .from(users)
            .where(eq(persons.primaryEmail, email))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const preferences = JSON.parse(user[0].preferences || '{}');
        preferences.emailVerifiedAt = Math.floor(Date.now() / 1000);
        preferences.onboardingStatus = 'email_verified';

        await db
            .update(users)
            .set({
                preferences: JSON.stringify(preferences),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(persons.primaryEmail, email));

        return NextResponse.json({
            data: {
                verified: true,
                email,
                nextStep: 'complete_profile',
                message: 'Email verified successfully',
            }
        });
    } catch (error) {
        console.error('Error verifying email:', error);
        return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }
}



