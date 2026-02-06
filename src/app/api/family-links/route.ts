import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { familyLinks } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

// GET /api/family-links - List family links
export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');
    const studentId = searchParams.get('studentId');
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const conditions = [];

        if (parentId) {
            conditions.push(eq(familyLinks.parentId, parentId));
        }

        if (studentId) {
            conditions.push(eq(familyLinks.studentId, studentId));
        }

        // If no filters, return links for the current user
        if (conditions.length === 0) {
            conditions.push(or(
                eq(familyLinks.parentId, userId),
                eq(familyLinks.studentId, userId)
            ));
        }

        const result = await db
            .select()
            .from(familyLinks)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(limit);

        return NextResponse.json({ data: result });
    } catch (error) {
        console.error('Error fetching family links:', error);
        return NextResponse.json({ error: 'Failed to fetch family links' }, { status: 500 });
    }
}

// POST /api/family-links - Create family link
export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const newLink = await db.insert(familyLinks).values({
            parentId: body.parentId,
            studentId: body.studentId,
            relationship: body.relationship || 'parent',
            canViewProgress: body.canViewProgress !== false ? 1 : 0,
            canViewGrades: body.canViewGrades !== false ? 1 : 0,
            canPayInvoices: body.canPayInvoices !== false ? 1 : 0,
            canCommunicate: body.canCommunicate !== false ? 1 : 0,
            isPrimaryContact: body.isPrimaryContact ? 1 : 0,
        }).returning();

        return NextResponse.json({ data: newLink[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating family link:', error);
        return NextResponse.json({ error: 'Failed to create family link' }, { status: 500 });
    }
}

