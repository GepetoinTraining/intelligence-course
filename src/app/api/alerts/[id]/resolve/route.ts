import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/alerts/[id]/resolve - Resolve alert
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { resolutionNotes } = body;

        const existing = await db
            .select()
            .from(safetyAlerts)
            .where(eq(safetyAlerts.id, id))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        if (existing[0].resolvedAt) {
            return NextResponse.json({
                error: 'Already resolved',
                resolvedAt: existing[0].resolvedAt,
                resolvedBy: existing[0].resolvedBy,
            }, { status: 400 });
        }

        const updated = await db
            .update(safetyAlerts)
            .set({
                resolvedAt: Math.floor(Date.now() / 1000),
                resolvedBy: userId,
                resolutionNotes: resolutionNotes || null,
            })
            .where(eq(safetyAlerts.id, id))
            .returning();

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error resolving alert:', error);
        return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
    }
}
