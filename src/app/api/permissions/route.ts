/**
 * Permissions API
 * 
 * GET /api/permissions - List all users with their permissions (organization-scoped)
 * GET /api/permissions?userId=xxx - Get specific user's permissions
 * POST /api/permissions - Update user permission override
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, rolePermissions, userPermissions, PERMISSION_MODULES } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Module categories for better UI organization
export const MODULE_CATEGORIES = {
    student: ['student_dashboard', 'student_lessons', 'student_techniques', 'student_todo', 'student_constellation', 'student_workshop', 'student_challenges', 'student_capstone', 'student_reviews'],
    parent: ['parent_dashboard', 'parent_billing', 'parent_messages'],
    teacher: ['teacher_dashboard', 'teacher_attendance', 'teacher_grades', 'teacher_students'],
    staff: ['staff_dashboard', 'staff_leads', 'staff_trials', 'staff_checkin', 'staff_landing_builder'],
    school: ['school_dashboard', 'school_courses', 'school_modules', 'school_lessons', 'school_rooms', 'school_schedules', 'school_terms', 'school_classes', 'school_teachers', 'school_enrollments', 'school_discounts', 'school_products'],
    marketing: ['marketing_campaigns', 'marketing_templates', 'marketing_referrals'],
    owner: ['owner_dashboard', 'owner_payroll', 'owner_reports', 'owner_payables', 'owner_employees', 'owner_permissions', 'owner_accounting'],
    accountant: ['accountant_dashboard', 'accountant_reports', 'accountant_sped'],
    lattice: ['lattice_evidence', 'lattice_projections', 'lattice_shares', 'lattice_matching'],
    talent: ['talent_dashboard', 'talent_documents', 'talent_interview', 'talent_cv'],
};

// Default permissions per role
const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, { c: boolean; r: boolean; u: boolean; d: boolean }>> = {
    student: {
        student_dashboard: { c: false, r: true, u: false, d: false },
        student_lessons: { c: false, r: true, u: true, d: false },
        student_techniques: { c: true, r: true, u: true, d: false },
        student_todo: { c: true, r: true, u: true, d: true },
        student_constellation: { c: true, r: true, u: true, d: true },
        student_workshop: { c: true, r: true, u: true, d: true },
        student_challenges: { c: true, r: true, u: true, d: false },
        student_capstone: { c: true, r: true, u: true, d: false },
        student_reviews: { c: true, r: true, u: true, d: false },
    },
    parent: {
        parent_dashboard: { c: false, r: true, u: false, d: false },
        parent_billing: { c: false, r: true, u: true, d: false },
        parent_messages: { c: true, r: true, u: false, d: false },
    },
    teacher: {
        teacher_dashboard: { c: false, r: true, u: false, d: false },
        teacher_attendance: { c: true, r: true, u: true, d: false },
        teacher_grades: { c: true, r: true, u: true, d: false },
        teacher_students: { c: false, r: true, u: true, d: false },
    },
    staff: {
        staff_dashboard: { c: false, r: true, u: false, d: false },
        staff_leads: { c: true, r: true, u: true, d: true },
        staff_trials: { c: true, r: true, u: true, d: false },
        staff_checkin: { c: true, r: true, u: true, d: false },
        staff_landing_builder: { c: true, r: true, u: true, d: true },
    },
    admin: {
        // Admin has access to school modules
        school_dashboard: { c: false, r: true, u: false, d: false },
        school_courses: { c: true, r: true, u: true, d: true },
        school_modules: { c: true, r: true, u: true, d: true },
        school_lessons: { c: true, r: true, u: true, d: true },
        school_rooms: { c: true, r: true, u: true, d: true },
        school_schedules: { c: true, r: true, u: true, d: true },
        school_terms: { c: true, r: true, u: true, d: true },
        school_classes: { c: true, r: true, u: true, d: true },
        school_teachers: { c: true, r: true, u: true, d: false },
        school_enrollments: { c: true, r: true, u: true, d: false },
        school_discounts: { c: true, r: true, u: true, d: true },
        school_products: { c: true, r: true, u: true, d: true },
        marketing_campaigns: { c: true, r: true, u: true, d: true },
        marketing_templates: { c: true, r: true, u: true, d: true },
        marketing_referrals: { c: true, r: true, u: true, d: false },
    },
    owner: {
        // Owner has full access to everything
        ...Object.fromEntries(PERMISSION_MODULES.map(m => [m, { c: true, r: true, u: true, d: true }])),
    },
    accountant: {
        accountant_dashboard: { c: false, r: true, u: false, d: false },
        accountant_reports: { c: false, r: true, u: false, d: false },
        accountant_sped: { c: true, r: true, u: false, d: false },
    },
    talent: {
        talent_dashboard: { c: false, r: true, u: true, d: false },
        talent_documents: { c: true, r: true, u: true, d: true },
        talent_interview: { c: true, r: true, u: true, d: false },
        talent_cv: { c: false, r: true, u: false, d: false },
    },
};

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the requesting user
        const [requestingUser] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
        if (!requestingUser || !['owner', 'admin'].includes(requestingUser.role || '')) {
            return NextResponse.json({ error: 'Only owners and admins can manage permissions' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('userId');

        if (targetUserId) {
            // Get specific user's permissions
            const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
            if (!targetUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Get role defaults
            const roleDefaults = DEFAULT_ROLE_PERMISSIONS[targetUser.role || 'student'] || {};

            // Get user overrides
            const overrides = await db.select().from(userPermissions).where(eq(userPermissions.userId, targetUserId));
            const overridesMap = Object.fromEntries(overrides.map(o => [o.module, o]));

            // Build effective permissions
            const effectivePermissions = PERMISSION_MODULES.map(module => {
                const roleDefault = roleDefaults[module] || { c: false, r: false, u: false, d: false };
                const override = overridesMap[module];

                return {
                    module,
                    canCreate: override?.canCreate ?? roleDefault.c,
                    canRead: override?.canRead ?? roleDefault.r,
                    canUpdate: override?.canUpdate ?? roleDefault.u,
                    canDelete: override?.canDelete ?? roleDefault.d,
                    isOverridden: !!override,
                    roleDefault: roleDefault,
                };
            });

            return NextResponse.json({
                user: {
                    id: targetUser.id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: targetUser.role,
                    avatarUrl: targetUser.avatarUrl,
                },
                permissions: effectivePermissions,
                moduleCategories: MODULE_CATEGORIES,
            });
        } else {
            // List all users with summary
            const orgUsers = await db.select().from(users)
                .where(requestingUser.organizationId
                    ? eq(users.organizationId, requestingUser.organizationId)
                    : undefined
                );

            // Get all user overrides
            const userIds = orgUsers.map(u => u.id);
            const allOverrides = userIds.length > 0
                ? await db.select().from(userPermissions).where(inArray(userPermissions.userId, userIds))
                : [];

            const overridesByUser = allOverrides.reduce((acc, o) => {
                if (!acc[o.userId]) acc[o.userId] = [];
                acc[o.userId].push(o);
                return acc;
            }, {} as Record<string, typeof allOverrides>);

            const usersWithSummary = orgUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                overrideCount: (overridesByUser[user.id] || []).length,
                lastSeenAt: user.lastSeenAt,
            }));

            return NextResponse.json({
                users: usersWithSummary,
                moduleCategories: MODULE_CATEGORIES,
                allModules: PERMISSION_MODULES,
            });
        }
    } catch (error) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the requesting user
        const [requestingUser] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
        if (!requestingUser || !['owner', 'admin'].includes(requestingUser.role || '')) {
            return NextResponse.json({ error: 'Only owners and admins can manage permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, module, canCreate, canRead, canUpdate, canDelete, reason } = body;

        if (!userId || !module) {
            return NextResponse.json({ error: 'userId and module are required' }, { status: 400 });
        }

        // Check if module is valid
        if (!PERMISSION_MODULES.includes(module)) {
            return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
        }

        // Get target user to verify exists and get their role
        const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Don't allow modifying owner permissions (unless you're also an owner)
        if (targetUser.role === 'owner' && requestingUser.role !== 'owner') {
            return NextResponse.json({ error: 'Cannot modify owner permissions' }, { status: 403 });
        }

        // Check if all values match role defaults (then delete override)
        const roleDefaults = DEFAULT_ROLE_PERMISSIONS[targetUser.role || 'student']?.[module] || { c: false, r: false, u: false, d: false };
        const isDefaultMatch =
            canCreate === roleDefaults.c &&
            canRead === roleDefaults.r &&
            canUpdate === roleDefaults.u &&
            canDelete === roleDefaults.d;

        if (isDefaultMatch) {
            // Remove override if it exists
            await db.delete(userPermissions).where(
                and(
                    eq(userPermissions.userId, userId),
                    eq(userPermissions.module, module)
                )
            );
            return NextResponse.json({
                success: true,
                message: 'Permission reset to role default',
                isOverridden: false,
            });
        }

        // Upsert the permission override
        const existing = await db.select().from(userPermissions)
            .where(and(eq(userPermissions.userId, userId), eq(userPermissions.module, module)))
            .limit(1);

        if (existing.length > 0) {
            await db.update(userPermissions)
                .set({
                    canCreate,
                    canRead,
                    canUpdate,
                    canDelete,
                    grantedBy: clerkUserId,
                    reason,
                    updatedAt: Math.floor(Date.now() / 1000),
                })
                .where(eq(userPermissions.id, existing[0].id));
        } else {
            await db.insert(userPermissions).values({
                userId,
                module,
                canCreate,
                canRead,
                canUpdate,
                canDelete,
                grantedBy: clerkUserId,
                reason,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Permission updated',
            isOverridden: true,
        });
    } catch (error) {
        console.error('Error updating permission:', error);
        return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the requesting user
        const [requestingUser] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
        if (!requestingUser || !['owner', 'admin'].includes(requestingUser.role || '')) {
            return NextResponse.json({ error: 'Only owners and admins can manage permissions' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('userId');

        if (!targetUserId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Delete all overrides for user (reset to role defaults)
        await db.delete(userPermissions).where(eq(userPermissions.userId, targetUserId));

        return NextResponse.json({
            success: true,
            message: 'All permission overrides removed, user reset to role defaults',
        });
    } catch (error) {
        console.error('Error resetting permissions:', error);
        return NextResponse.json({ error: 'Failed to reset permissions' }, { status: 500 });
    }
}

