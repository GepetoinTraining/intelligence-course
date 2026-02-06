import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrollments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/enrollments/[id]/transfer - Transfer student to another class
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { userId, orgId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        if (!body.newClassId) {
            return NextResponse.json({ error: 'newClassId is required' }, { status: 400 });
        }

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

        // Create new enrollment
        const newEnrollment = await db.insert(enrollments).values({
            organizationId: existing[0].organizationId,
            userId: existing[0].userId,
            classId: body.newClassId,
            termId: body.termId || existing[0].termId,
            leadId: existing[0].leadId,
            trialId: existing[0].trialId,
            status: 'active',
            enrolledAt: now,
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            notes: body.notes || `Transferred from enrollment ${id}`,
        }).returning();

        // Update old enrollment
        await db
            .update(enrollments)
            .set({
                status: 'transferred',
                transferredToEnrollmentId: newEnrollment[0].id,
                updatedAt: now,
            })
            .where(eq(enrollments.id, id));

        return NextResponse.json({ data: newEnrollment[0] });
    } catch (error) {
        console.error('Error transferring enrollment:', error);
        return NextResponse.json({ error: 'Failed to transfer enrollment' }, { status: 500 });
    }
}
