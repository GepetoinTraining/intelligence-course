import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/alerts/[id]/acknowledge - Staff acknowledges alert
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { personId, orgId } = await getApiAuthWithOrg();
    if (!personId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await db
            .select()
            .from(safetyAlerts)
            .where(eq(safetyAlerts.id, id))
            .limit(1);

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        if (existing[0].acknowledgedAt) {
            return NextResponse.json({
                error: 'Already acknowledged',
                acknowledgedAt: existing[0].acknowledgedAt,
                acknowledgedBy: existing[0].acknowledgedBy,
            }, { status: 400 });
        }

        const updated = await db
            .update(safetyAlerts)
            .set({
                acknowledgedAt: Math.floor(Date.now() / 1000),
                acknowledgedBy: personId,
            })
            .where(eq(safetyAlerts.id, id))
            .returning();

        return NextResponse.json({ data: updated[0] });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 });
    }
}
