import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getApiAuthWithOrg } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/alerts/[id]/escalate - Escalate to next level
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const levelProgression: Record<string, string> = {
            green: 'yellow',
            yellow: 'orange',
            orange: 'red',
            red: 'red', // Can't escalate beyond red
        };

        const currentLevel = existing[0].level;
        const nextLevel = levelProgression[currentLevel] || 'yellow';

        if (currentLevel === 'red') {
            return NextResponse.json({
                error: 'Cannot escalate beyond red',
                note: 'Contact ECA authorities directly for red-level emergencies',
            }, { status: 400 });
        }

        // In production, this would trigger notifications
        const actions: string[] = [];
        if (nextLevel === 'yellow') actions.push('Parents notified');
        if (nextLevel === 'orange') actions.push('Coordinator notified');
        if (nextLevel === 'red') actions.push('ECA protocol initiated');

        const updated = await db
            .update(safetyAlerts)
            .set({
                level: nextLevel as 'green' | 'yellow' | 'orange' | 'red',
                notifiedParents: ['yellow', 'orange', 'red'].includes(nextLevel) ? 1 : 0,
                notifiedAuthorities: nextLevel === 'red' ? 1 : 0,
            })
            .where(eq(safetyAlerts.id, id))
            .returning();

        return NextResponse.json({
            data: updated[0],
            escalation: {
                from: currentLevel,
                to: nextLevel,
                actions,
            },
        });
    } catch (error) {
        console.error('Error escalating alert:', error);
        return NextResponse.json({ error: 'Failed to escalate alert' }, { status: 500 });
    }
}
