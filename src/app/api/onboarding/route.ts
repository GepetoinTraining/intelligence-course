import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthWithOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Roles that are auto-approved (no approval needed)
const AUTO_APPROVED_ROLES = ['student', 'parent'];

// Map of roles to their approver roles
const APPROVAL_HIERARCHY: Record<string, string[]> = {
    teacher: ['admin', 'owner'],
    staff: ['admin', 'owner'],
    admin: ['owner'],
    accountant: ['admin', 'owner'],
};

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await getApiAuthWithOrg();

        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requestedRole, phone, message, email, name } = body;

        // Validate role
        const validRoles = ['student', 'parent', 'teacher', 'staff', 'admin', 'accountant'];
        if (!validRoles.includes(requestedRole)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const isAutoApproved = AUTO_APPROVED_ROLES.includes(requestedRole);

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.id, clerkUserId))
            .limit(1);

        if (existingUser.length > 0) {
            // User exists, update their requested role
            await db
                .update(users)
                .set({
                    role: isAutoApproved ? requestedRole : 'student', // Default to student if pending
                    preferences: JSON.stringify({
                        requestedRole: isAutoApproved ? null : requestedRole,
                        approvalStatus: isAutoApproved ? 'approved' : 'pending',
                        approvalMessage: message || null,
                        phone: phone || null,
                        onboardingCompletedAt: Date.now(),
                    }),
                    updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(users.id, clerkUserId));
        } else {
            // Create new user
            await db.insert(users).values({
                id: clerkUserId,
                email: email,
                name: name,
                role: isAutoApproved ? requestedRole : 'student', // Default to student if pending
                preferences: JSON.stringify({
                    requestedRole: isAutoApproved ? null : requestedRole,
                    approvalStatus: isAutoApproved ? 'approved' : 'pending',
                    approvalMessage: message || null,
                    phone: phone || null,
                    onboardingCompletedAt: Date.now(),
                }),
            });
        }

        // TODO: If not auto-approved, send notification to approvers
        // This would involve:
        // 1. Finding users with approver roles
        // 2. Creating a notification/approval request
        // 3. Sending email via Resend/SendGrid

        return NextResponse.json({
            success: true,
            autoApproved: isAutoApproved,
            role: isAutoApproved ? requestedRole : 'student',
            message: isAutoApproved
                ? 'Account activated successfully'
                : 'Approval request sent',
        });
    } catch (error) {
        console.error('Onboarding error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Check onboarding status
export async function GET(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await getApiAuthWithOrg();

        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, clerkUserId))
            .limit(1);

        if (user.length === 0) {
            return NextResponse.json({
                needsOnboarding: true,
                status: 'not_started',
            });
        }

        const prefs = typeof user[0].preferences === 'string'
            ? JSON.parse(user[0].preferences)
            : user[0].preferences || {};

        return NextResponse.json({
            needsOnboarding: !prefs.onboardingCompletedAt,
            status: prefs.approvalStatus || 'unknown',
            requestedRole: prefs.requestedRole,
            currentRole: user[0].role,
        });
    } catch (error) {
        console.error('Onboarding check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

