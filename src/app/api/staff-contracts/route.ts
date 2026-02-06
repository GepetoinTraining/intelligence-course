import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staffContracts, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/staff-contracts - List staff contracts
export async function GET(request: NextRequest) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const conditions = [];

        if (orgId) {
            conditions.push(eq(staffContracts.organizationId, orgId));
        }

        if (status) {
            conditions.push(eq(staffContracts.status, status as any));
        }

        if (department) {
            conditions.push(eq(staffContracts.department, department as any));
        }

        // Join with users to get name, email, etc.
        const result = await db
            .select({
                contract: staffContracts,
                user: {
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    avatarUrl: users.avatarUrl,
                }
            })
            .from(staffContracts)
            .leftJoin(users, eq(staffContracts.userId, users.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(staffContracts.createdAt))
            .limit(limit)
            .offset(offset);

        // Flatten the result
        const flattened = result.map(r => ({
            ...r.contract,
            name: r.user?.name,
            email: r.user?.email,
            avatarUrl: r.user?.avatarUrl,
        }));

        return NextResponse.json({ data: flattened });
    } catch (error) {
        console.error('Error fetching staff contracts:', error);
        return NextResponse.json({ error: 'Failed to fetch staff contracts' }, { status: 500 });
    }
}

// POST /api/staff-contracts - Create staff contract (and user if needed)
export async function POST(request: NextRequest) {
    const { userId: authUserId, orgId } = await getApiAuthWithOrg();
    if (!authUserId || !orgId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Check if user exists, if not create one
        let staffUserId = body.userId;

        if (!staffUserId && body.email) {
            // Check if user exists by email
            const existingUser = await db
                .select()
                .from(users)
                .where(eq(users.email, body.email))
                .limit(1);

            if (existingUser.length > 0) {
                staffUserId = existingUser[0].id;
            } else {
                // Create new user - need to generate ID since Clerk won't be managing this user
                const newUserId = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newUser = await db.insert(users).values({
                    id: newUserId,
                    email: body.email,
                    name: body.name,
                    role: 'staff',
                }).returning();
                staffUserId = newUser[0].id;
            }
        }

        if (!staffUserId) {
            return NextResponse.json({ error: 'User ID or email required' }, { status: 400 });
        }

        const newContract = await db.insert(staffContracts).values({
            organizationId: orgId,
            userId: staffUserId,
            jobTitle: body.jobTitle,
            department: body.department || 'admin',
            contractType: body.contractType || 'clt',
            salaryCents: body.salaryCents,
            hourlyRateCents: body.hourlyRateCents,
            weeklyHours: body.weeklyHours || 40,
            workSchedule: body.workSchedule ? JSON.stringify(body.workSchedule) : '{}',
            accessLevel: body.accessLevel || 'basic',
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            status: 'active',
            benefits: body.benefits ? JSON.stringify(body.benefits) : '{}',
        }).returning();

        return NextResponse.json({ data: newContract[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating staff contract:', error);
        return NextResponse.json({ error: 'Failed to create staff contract' }, { status: 500 });
    }
}



