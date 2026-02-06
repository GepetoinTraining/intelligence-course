import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrollments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/enrollments/[id]/drop - Drop/cancel enrollment
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        // Get current enrollment
        const existing = await db
            .select()
            .from(enrollments)
            .where(eq(enrollments.id, id))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const now = Math.floor(Date.now() / 1000);

        const updated = await db
            .update(enrollments)
            .set({
                status: 'dropped',
                droppedAt: now,
                dropReason: body.reason,
                notes: body.notes ? `${existing[0].notes || ''}\n[Drop note] ${body.notes}` : existing[0].notes,
                updatedAt: now,
            })
            .where(eq(enrollments.id, id))
            .returning();

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error dropping enrollment:', error);
        return NextResponse.json({ error: 'Failed to drop enrollment' }, { status: 500 });
    }
}
