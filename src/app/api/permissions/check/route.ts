/**
 * Permission Check API
 * 
 * GET /api/permissions/check?module=xxx - Check single module permission
 * GET /api/permissions/check?modules=xxx,yyy - Check multiple modules
 * 
 * Returns the effective permissions (role default + user overrides)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, userPermissions, PERMISSION_MODULES, type PermissionModule } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// Default permissions per role (mirrored from main permissions route)
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

function getEffectivePermission(
    role: string,
    module: string,
    override: { canCreate: boolean | null; canRead: boolean | null; canUpdate: boolean | null; canDelete: boolean | null } | null
) {
    const roleDefaults = DEFAULT_ROLE_PERMISSIONS[role]?.[module] || { c: false, r: false, u: false, d: false };

    return {
        canCreate: override?.canCreate ?? roleDefaults.c,
        canRead: override?.canRead ?? roleDefaults.r,
        canUpdate: override?.canUpdate ?? roleDefaults.u,
        canDelete: override?.canDelete ?? roleDefaults.d,
    };
}

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user
        const [user] = await db.select().from(users).where(eq(users.id, clerkUserId)).limit(1);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const singleModule = searchParams.get('module');
        const multipleModules = searchParams.get('modules');

        if (singleModule) {
            // Check single module
            if (!PERMISSION_MODULES.includes(singleModule as PermissionModule)) {
                return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
            }

            // Get user override
            const [override] = await db.select().from(userPermissions)
                .where(and(
                    eq(userPermissions.userId, clerkUserId),
                    eq(userPermissions.module, singleModule)
                ))
                .limit(1);

            const permission = getEffectivePermission(user.role || 'student', singleModule, override || null);
            return NextResponse.json(permission);
        } else if (multipleModules) {
            // Check multiple modules
            const modules = multipleModules.split(',').filter(m => PERMISSION_MODULES.includes(m as PermissionModule));

            if (modules.length === 0) {
                return NextResponse.json({});
            }

            // Get all overrides for these modules
            const overrides = await db.select().from(userPermissions)
                .where(and(
                    eq(userPermissions.userId, clerkUserId),
                    inArray(userPermissions.module, modules)
                ));

            const overrideMap = Object.fromEntries(overrides.map(o => [o.module, o]));

            const result: Record<string, { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }> = {};
            for (const module of modules) {
                result[module] = getEffectivePermission(user.role || 'student', module, overrideMap[module] || null);
            }

            return NextResponse.json(result);
        } else {
            return NextResponse.json({ error: 'Either module or modules parameter required' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error checking permission:', error);
        return NextResponse.json({ error: 'Failed to check permission' }, { status: 500 });
    }
}

