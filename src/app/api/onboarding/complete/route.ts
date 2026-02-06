import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, memoryGraphs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// POST /api/onboarding/complete - Finalize onboarding
export async function POST(request: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            dateOfBirth,
            guardianInfo, // For minors
            agreedToTerms,
            agreedToPrivacyPolicy,
            communicationPreferences,
        } = body;

        if (!agreedToTerms || !agreedToPrivacyPolicy) {
            return NextResponse.json({
                error: 'Must agree to terms and privacy policy'
            }, { status: 400 });
        }

        // Update user preferences
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const preferences = JSON.parse(user[0]?.preferences || '{}');

        preferences.dateOfBirth = dateOfBirth;
        preferences.guardianInfo = guardianInfo;
        preferences.termsAcceptedAt = Math.floor(Date.now() / 1000);
        preferences.privacyAcceptedAt = Math.floor(Date.now() / 1000);
        preferences.onboardingStatus = 'completed';
        preferences.onboardingCompletedAt = Math.floor(Date.now() / 1000);
        preferences.notifications = communicationPreferences || {};

        await db
            .update(users)
            .set({
                preferences: JSON.stringify(preferences),
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(users.id, userId));

        // Create initial memory graph for students
        if (user[0]?.role === 'student' && orgId) {
            // Check if graph already exists
            const existingGraph = await db
                .select()
                .from(memoryGraphs)
                .where(eq(memoryGraphs.studentId, userId))
                .limit(1);

            if (existingGraph.length === 0) {
                await db.insert(memoryGraphs).values({
                    studentId: userId,
                    organizationId: orgId,
                    snr: 1.0,
                });
            }
        }

        return NextResponse.json({
            data: {
                success: true,
                status: 'completed',
                message: 'Onboarding complete! Welcome to Intelligence Course.',
                redirectTo: user[0]?.role === 'student' ? '/student' : '/dashboard',
            }
        });
    } catch (error) {
        console.error('Error completing onboarding:', error);
        return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }
}

