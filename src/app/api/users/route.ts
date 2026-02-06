import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

// GET /api/users - List users (admin/staff only)
export async function GET(request: NextRequest) {
    const { userId, orgId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        // Build conditions
        const conditions = [];

        if (orgId) {
            conditions.push(eq(users.organizationId, orgId));
        }

        if (role) {
            conditions.push(eq(users.role, role as any));
        }

        if (search) {
            conditions.push(like(users.name, `%${search}%`));
        }

        const result = await db
            .select()
            .from(users)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(users.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST /api/users - Create user (typically handled by Clerk webhook)
export async function POST(request: NextRequest) {
    const { userId } = await getApiAuthWithOrg();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newUser = await db.insert(users).values({
            id: body.id,
            email: body.email,
            name: body.name,
            avatarUrl: body.avatarUrl,
            role: body.role || 'student',
            organizationId: body.organizationId,
            preferences: body.preferences || '{}',
        }).returning();

        return NextResponse.json({ data: newUser[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

